import { auth, db, app } from '../firebase-config.js';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, OAuthProvider } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-functions.js";

const functions = getFunctions(app);

// Toggle password visibility
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');

togglePassword.addEventListener('click', () => {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    togglePassword.classList.toggle('show-password');
});

// Form submission with loading state
const loginForm = document.getElementById('loginForm');
const loginBtn = document.getElementById('loginBtn');
const authError = document.getElementById('authError');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Reset error message
    authError.style.display = 'none';
    authError.textContent = '';

    // Get input values
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const otp = document.getElementById('otp').value;

    if (!otp || otp.length < 6) {
        authError.textContent = "Please enter the 6-digit verification code.";
        authError.style.display = 'block';
        return;
    }

    // Add loading state
    loginBtn.classList.add('loading');
    loginBtn.disabled = true;

    try {
        // 0. Verify OTP first
        const verifyOTP = httpsCallable(functions, 'verifyOTP');
        await verifyOTP({ email, otp });

        // 1. Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 2. Save user profile to Firestore (MUST complete before redirect)
        await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            fullName: name,
            name: name,
            email: email,
            createdAt: new Date().toISOString(),
            otpVerified: true,
            assessments: []
        });

        // Show success feedback
        loginBtn.classList.remove('loading');
        loginBtn.classList.add('success');
        const btnText = loginBtn.querySelector('.btn-text');
        btnText.textContent = 'Account Created!';

        // Redirect to React Dashboard
        setTimeout(() => {
            window.location.href = '/dashboard';
        }, 1500);

    } catch (error) {
        // Handle Auth/Cloud Function Errors here.
        loginBtn.classList.remove('loading');
        loginBtn.disabled = false;

        let errorMessage = "An error occurred during sign up.";
        if (error.message && error.message.includes('Invalid or expired OTP')) {
            errorMessage = "Invalid verification code. Please try again.";
        } else if (error.code === 'auth/email-already-in-use') {
            errorMessage = "This email is already in use.";
        } else if (error.code === 'auth/weak-password') {
            errorMessage = "Password should be at least 6 characters.";
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = "Invalid email format.";
        } else {
            errorMessage = error.message; // Fallback
        }

        authError.textContent = errorMessage;
        authError.style.display = 'block';
    }
});

// OTP Sending Logic
const sendOtpBtn = document.getElementById('sendOtpBtn');
sendOtpBtn.addEventListener('click', async () => {
    const email = document.getElementById('email').value;

    authError.style.display = 'none';
    authError.textContent = '';

    if (!email || !email.includes('@')) {
        authError.textContent = "Please enter a valid email address first.";
        authError.style.display = 'block';
        return;
    }

    sendOtpBtn.disabled = true;
    const originalText = sendOtpBtn.textContent;
    sendOtpBtn.textContent = 'Sending...';

    try {
        const sendOTPEmail = httpsCallable(functions, 'sendOTPEmail');
        await sendOTPEmail({ email });

        sendOtpBtn.textContent = 'Sent!';
        sendOtpBtn.style.color = '#4ade80'; // Success green
        sendOtpBtn.style.borderColor = '#4ade80';

        // Cooldown timer
        let timeLeft = 30;
        const cooldownInterval = setInterval(() => {
            sendOtpBtn.textContent = `Wait ${timeLeft}s`;
            timeLeft--;
            if (timeLeft < 0) {
                clearInterval(cooldownInterval);
                sendOtpBtn.textContent = 'Resend';
                sendOtpBtn.style.color = '#fff';
                sendOtpBtn.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                sendOtpBtn.disabled = false;
            }
        }, 1000);

    } catch (error) {
        sendOtpBtn.textContent = 'Failed';
        sendOtpBtn.disabled = false;
        authError.textContent = error.message || "Failed to send verification code.";
        authError.style.display = 'block';
        setTimeout(() => {
            sendOtpBtn.textContent = originalText;
        }, 2000);
    }
});

// Input focus animations
const inputs = document.querySelectorAll('.input-wrapper input');
inputs.forEach(input => {
    input.addEventListener('focus', () => {
        input.closest('.input-wrapper').classList.add('focused');
    });
    input.addEventListener('blur', () => {
        input.closest('.input-wrapper').classList.remove('focused');
    });
});

// Ambient glow mouse tracking
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

// ============================================================
// Social Login — Google
// ============================================================
const googleBtn = document.getElementById('googleSignIn');
const googleProvider = new GoogleAuthProvider();

googleBtn.addEventListener('click', async () => {
    authError.style.display = 'none';
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        // Save profile to Firestore (MUST complete before redirect)
        await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            fullName: user.displayName || '',
            name: user.displayName || '',
            email: user.email,
            createdAt: new Date().toISOString(),
            otpVerified: true,
            assessments: []
        }, { merge: true });

        loginBtn.classList.add('success');
        const btnText = loginBtn.querySelector('.btn-text');
        btnText.textContent = 'Account Created!';
        setTimeout(() => {
            window.location.href = '/dashboard';
        }, 1000);
    } catch (error) {
        if (error.code !== 'auth/popup-closed-by-user') {
            authError.textContent = error.message;
            authError.style.display = 'block';
        }
    }
});


