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
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

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

        const { generateUserDashboardData } = await import('../lib/defaultData');
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
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Immediately set auth user so UI isn't blocked
                setCurrentUser((prev) => prev ?? user);
                setLoading(false);

                // Fetch extra Firestore data in the BACKGROUND (non-blocking)
                try {
                    const timeoutPromise = new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Firestore timeout')), 1500)
                    );
                    const docSnap = await Promise.race([
                        getDoc(doc(db, 'users', user.uid)),
                        timeoutPromise,
                    ]);
                    if (docSnap && docSnap.exists()) {
                        const firestoreData = docSnap.data();
                        const enrichedUser = Object.assign(Object.create(Object.getPrototypeOf(user)), user, { firestoreData });
                        setCurrentUser(enrichedUser);
                        // Cache minimal info for instant restore next reload
                        localStorage.setItem('authUser', JSON.stringify({
                            uid: user.uid,
                            email: user.email,
                            displayName: user.displayName,
                            firestoreData,
                        }));
                    } else {
                        setCurrentUser(user);
                        localStorage.setItem('authUser', JSON.stringify({
                            uid: user.uid,
                            email: user.email,
                            displayName: user.displayName,
                        }));
                    }
                } catch (err) {
                    console.warn('Firestore background fetch failed:', err.message);
                    setCurrentUser(user);
                }
            } else {
                localStorage.removeItem('authUser');
                setCurrentUser(null);
                setLoading(false);
            }
        });

        return unsubscribe;
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

            // Generate real dashboard data
            const { generateRealDashboardData } = await import('../lib/defaultData');
            const dashboardData = generateRealDashboardData(currentUser, assessmentData, assessments);

            // Update Firestore
            await setDoc(userRef, {
                ...userDoc,
                assessments,
                dashboardData
            }, { merge: true });

            // Update local state instantly for UI
            setCurrentUser(prev => ({
                ...prev,
                firestoreData: {
                    ...prev.firestoreData,
                    assessments,
                    dashboardData
                }
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
        resetPassword,
    };

    return (
        <AuthContext.Provider value={value}>
            {/* Render children IMMEDIATELY — never block on loading */}
            {children}
        </AuthContext.Provider>
    );
}
