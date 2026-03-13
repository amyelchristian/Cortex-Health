import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence,
    sendPasswordResetEmail
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { generateRealDashboardData, generateUserDashboardData } from '../lib/defaultData';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

// Attempt to load previously cached user from localStorage for instant restore
function getCachedUser() {
    try {
        const raw = localStorage.getItem('authUser');
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function AuthProvider({ children }) {
    // Start with cached user so the UI renders immediately on reload
    const [currentUser, setCurrentUser] = useState(getCachedUser());
    // loading = waiting for Firebase to confirm auth (true only on first cold boot)
    const [loading, setLoading] = useState(true);

    // Sign up function (called AFTER inline OTP verification)
    async function signup(email, password, name) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        if (name) {
            await updateProfile(user, { displayName: name }).catch((err) =>
                console.error('Error setting displayName:', err)
            );
        }

        const defaultDashboardData = generateUserDashboardData(name, email);

        await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: user.email,
            name: name || '',
            createdAt: new Date().toISOString(),
            otpVerified: true,
            dashboardData: defaultDashboardData,
        });

        return user;
    }

    async function login(email, password, keepSignedIn = false) {
        const persistence = keepSignedIn ? browserLocalPersistence : browserSessionPersistence;
        await setPersistence(auth, persistence);
        return signInWithEmailAndPassword(auth, email, password);
    }

    async function sendOTPEmail(email) {
        const functions = getFunctions();
        const sendOTP = httpsCallable(functions, 'sendOTPEmail');
        return sendOTP({ email });
    }

    async function verifyOTP(email, otp) {
        const functions = getFunctions();
        const verify = httpsCallable(functions, 'verifyOTP');
        return verify({ email, otp });
    }

    function logout() {
        localStorage.removeItem('authUser');
        return signOut(auth);
    }

    function resetPassword(email) {
        return sendPasswordResetEmail(auth, email);
    }

    useEffect(() => {
        let unsubscribeDoc = null;

        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // IMPORTANT: Only use cached data if the UID matches. 
                // Otherwise, wait for Firestore to provide the correct data for this specific user.
                setCurrentUser((prev) => (prev && prev.uid === user.uid) ? prev : user);
                setLoading(false);

                // Set up real-time listener for the user's Firestore document
                const userRef = doc(db, 'users', user.uid);

                // Close any existing listener
                if (unsubscribeDoc) unsubscribeDoc();

                unsubscribeDoc = onSnapshot(userRef, (docSnap) => {
                    const firestoreData = docSnap.exists() ? docSnap.data() : { assessments: [] };

                    setCurrentUser(prev => {
                        // If no previous user or different UID, start fresh
                        const baseUser = (prev && prev.uid === user.uid) ? prev : user;

                        // Merge logic: ensure we don't overwrite if local state is ahead (more assessments)
                        const localAssessments = prev?.firestoreData?.assessments || [];
                        const remoteAssessments = firestoreData?.assessments || [];

                        const mergedFirestoreData = {
                            ...firestoreData,
                            assessments: localAssessments.length > remoteAssessments.length
                                ? localAssessments : remoteAssessments
                        };

                        const enrichedUser = Object.assign(
                            Object.create(Object.getPrototypeOf(baseUser)),
                            baseUser,
                            { firestoreData: mergedFirestoreData }
                        );

                        // Sync to localStorage for persistence
                        localStorage.setItem('authUser', JSON.stringify({
                            uid: user.uid,
                            email: user.email,
                            displayName: user.displayName,
                            firestoreData: mergedFirestoreData,
                        }));

                        return enrichedUser;
                    });
                }, (error) => {
                    console.error("Firestore listener error:", error);
                });
            } else {
                if (unsubscribeDoc) unsubscribeDoc();
                localStorage.removeItem('authUser');
                setCurrentUser(null);
                setLoading(false);
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeDoc) unsubscribeDoc();
        };
    }, []);

    async function saveAssessment(assessmentData) {
        if (!currentUser) return;
        const userRef = doc(db, 'users', currentUser.uid);

        try {
            // Fetch current user document to append assessment
            const docSnap = await getDoc(userRef);
            let userDoc = docSnap.exists() ? docSnap.data() : {};
            let assessments = userDoc.assessments || [];

            // Add new assessment
            assessments.unshift(assessmentData);

            // Update Firestore
            await setDoc(userRef, {
                ...userDoc,
                assessments
            }, { merge: true });

            // Build new firestoreData safely
            const prevFirestore = currentUser.firestoreData || userDoc || {};
            const newFirestoreData = {
                ...prevFirestore,
                assessments
            };

            // Update local state instantly for UI
            setCurrentUser(prev => {
                const baseUser = prev || currentUser;
                const enriched = Object.assign(
                    Object.create(Object.getPrototypeOf(baseUser)),
                    baseUser,
                    { firestoreData: newFirestoreData }
                );
                return enriched;
            });

            // Persist to localStorage so a page refresh doesn't lose the data
            localStorage.setItem('authUser', JSON.stringify({
                uid: currentUser.uid,
                email: currentUser.email,
                displayName: currentUser.displayName,
                firestoreData: newFirestoreData,
            }));

        } catch (error) {
            console.error('Failed to save assessment to Firestore:', error);
            throw error;
        }
    }

    async function updateUserProfile(profileData) {
        if (!currentUser) return;

        try {
            const { name, dob, gender, bloodType } = profileData;
            const newName = name || currentUser.displayName;

            // 1. Update Firestore Document FIRST so any triggered listeners fetch fresh data
            const userRef = doc(db, 'users', currentUser.uid);
            await setDoc(userRef, {
                name: newName,
                dob: dob || '',
                gender: gender || '',
                bloodType: bloodType || ''
            }, { merge: true });

            // 2. Update Auth Profile (which triggers onAuthStateChanged under the hood)
            if (name && name !== currentUser.displayName) {
                await updateProfile(auth.currentUser, { displayName: name });
            }

            // 3. Update Local State & Prototype Chain
            const newFirestoreData = {
                ...currentUser.firestoreData,
                name: newName,
                dob: dob || '',
                gender: gender || '',
                bloodType: bloodType || ''
            };

            const enrichedUser = Object.assign(Object.create(Object.getPrototypeOf(currentUser)), currentUser, {
                displayName: newName,
                firestoreData: newFirestoreData
            });
            setCurrentUser(enrichedUser);

            // 4. Manually update cache to prevent flash of old data on reload
            localStorage.setItem('authUser', JSON.stringify({
                uid: enrichedUser.uid,
                email: enrichedUser.email,
                displayName: enrichedUser.displayName,
                firestoreData: enrichedUser.firestoreData,
            }));

        } catch (error) {
            console.error('Failed to update user profile:', error);
            throw error;
        }
    }

    async function deleteDocumentLocally(docId) {
        if (!currentUser) return;
        const userRef = doc(db, 'users', currentUser.uid);

        try {
            // Keep deleted IDs in the user document
            const currentDeleted = currentUser.firestoreData?.deletedDocIds || [];
            if (currentDeleted.includes(docId)) return; // Already deleted

            const newDeleted = [...currentDeleted, docId];

            await setDoc(userRef, { deletedDocIds: newDeleted }, { merge: true });

            const newFirestoreData = {
                ...currentUser.firestoreData,
                deletedDocIds: newDeleted
            };

            const enrichedUser = Object.assign(Object.create(Object.getPrototypeOf(currentUser)), currentUser, {
                firestoreData: newFirestoreData
            });

            setCurrentUser(enrichedUser);

            localStorage.setItem('authUser', JSON.stringify({
                ...JSON.parse(localStorage.getItem('authUser') || '{}'),
                firestoreData: newFirestoreData,
            }));

        } catch (error) {
            console.error('Failed to soft-delete document:', error);
            throw error;
        }
    }

    const value = {
        currentUser,
        loading,
        signup,
        login,
        logout,
        sendOTPEmail,
        verifyOTP,
        saveAssessment,
        updateUserProfile,
        deleteDocumentLocally,
        resetPassword,
    };

    return (
        <AuthContext.Provider value={value}>
            {/* Render children IMMEDIATELY — never block on loading */}
            {children}
        </AuthContext.Provider>
    );
}
