import { auth } from '../firebase-config.js';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, OAuthProvider } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";

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
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Add loading state
    loginBtn.classList.add('loading');
    loginBtn.disabled = true;

    try {
        // Authenticate user
        const userCredential = await signInWithEmailAndPassword(auth, email, password);

        loginBtn.classList.remove('loading');

        // Show success feedback
        loginBtn.classList.add('success');
        const btnText = loginBtn.querySelector('.btn-text');
        btnText.textContent = 'Welcome!';

        // Redirect to React dashboard
        setTimeout(() => {
            window.location.href = '/dashboard';
        }, 1000);

    } catch (error) {
        // Handle Errors here.
        loginBtn.classList.remove('loading');
        loginBtn.disabled = false;

        let errorMessage = "An error occurred during sign in.";
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            errorMessage = "Invalid email or password.";
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = "Invalid email format.";
        } else {
            errorMessage = error.message; // Fallback
        }

        authError.textContent = errorMessage;
        authError.style.display = 'block';
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
        // Success — redirect
        loginBtn.classList.add('success');
        const btnText = loginBtn.querySelector('.btn-text');
        btnText.textContent = 'Welcome!';
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


