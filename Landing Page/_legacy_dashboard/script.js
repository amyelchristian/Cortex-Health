import { auth, db } from '../firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

// DOM Elements
const displayNameEl = document.getElementById('display-name');
const displayEmailEl = document.getElementById('display-email');
const avatarEl = document.getElementById('user-avatar');
const logoutBtn = document.getElementById('logoutBtn');

// ============================================================
// 1. Auth Protection & Data Loading
// ============================================================
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // User is signed in.
        displayEmailEl.textContent = user.email || 'Clinician';

        // Attempt to fetch extra profile data from Firestore
        try {
            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const userData = docSnap.data();
                const fullName = userData.fullName || user.displayName || 'Doctor';
                displayNameEl.textContent = `Dr. ${fullName.split(' ')[0]}`; // Use first name

                // Set avatar letter
                avatarEl.textContent = fullName.charAt(0).toUpperCase();
            } else {
                // Fallback to Auth Profile
                displayNameEl.textContent = user.displayName ? `Dr. ${user.displayName.split(' ')[0]}` : 'Doctor';
                avatarEl.textContent = user.email ? user.email.charAt(0).toUpperCase() : '?';
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
            displayNameEl.textContent = 'Doctor';
        }

    } else {
        // No user is signed in. Redirect immediately.
        window.location.replace('../login/index.html');
    }
});

// ============================================================
// 2. Logout Logic
// ============================================================
logoutBtn.addEventListener('click', async () => {
    try {
        await signOut(auth);
        // Will trigger the onAuthStateChanged listener to redirect
    } catch (error) {
        console.error("Sign out error:", error);
        alert("Failed to sign out.");
    }
});

// ============================================================
// 3. Ambient Glow Mouse Tracking
// ============================================================
document.addEventListener('mousemove', (e) => {
    const glows = document.querySelectorAll('.ambient-glow');
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;

    glows.forEach((glow, i) => {
        const speed = (i + 1) * 8;
        const offsetX = (x - 0.5) * speed;
        const offsetY = (y - 0.5) * speed;
        glow.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    });
});
