import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, CheckCircle2, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './forgot-password.css';
import logo from '../assets/transparent-logo.png'; // Using the logo path from login

const ForgotPasswordPage = () => {
    const navigate = useNavigate();
    const { resetPassword } = useAuth();
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // 'idle', 'loading', 'success', 'error'
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic Validation
        if (!email || !email.includes('@')) {
            setStatus('error');
            setErrorMessage('Please enter a valid email address.');
            return;
        }

        setStatus('loading');
        setErrorMessage('');

        try {
            await resetPassword(email);
            setStatus('success');
        } catch (error) {
            setStatus('error');
            setErrorMessage(error.message?.replace('Firebase: Error (auth/', '').replace(').', '').replace(/-/g, ' ') || 'Failed to send reset link. Please try again.');
        }
    };

    return (
        <div className="forgot-pwd-body">
            {/* Ambient glows replicating login page */}
            <div className="ambient-glow ambient-glow-1"></div>
            <div className="ambient-glow ambient-glow-2"></div>
            <div className="ambient-glow ambient-glow-3"></div>

            <div className="forgot-pwd-wrapper">
                <div className="login-panel">
                    <div className="login-panel-inner">

                        {/* Logo */}
                        <div className="login-logo justify-center mb-8">
                            <img src={logo} alt="Cortex Logo" className="login-logo-img" />
                            <span className="login-logo-text">CORTEX</span>
                        </div>

                        {status === 'success' ? (
                            <div className="success-state animate-fade-in pl-2 pr-2">
                                <div className="success-icon-wrapper">
                                    <CheckCircle2 className="success-icon" size={48} />
                                </div>
                                <h2>Check Your Email!</h2>
                                <p>We've sent a password reset link to:<br /><strong>{email}</strong></p>
                                <p className="resend-text">
                                    Didn't receive it? <button className="resend-link" onClick={() => setStatus('idle')}>Resend Email</button>
                                </p>
                                <button
                                    className="btn-login mt-6"
                                    onClick={() => navigate('/login')}
                                >
                                    <span className="btn-text">Return to Login</span>
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="text-center mb-8">
                                    <div className="top-icon-container">
                                        <Lock className="top-icon" size={32} />
                                    </div>
                                    <h1 className="forgot-heading">Forgot Password?</h1>
                                    <p className="forgot-subheading">Enter your email address and we'll send you a link to reset your password</p>
                                </div>

                                <form className="login-form" onSubmit={handleSubmit}>
                                    <div className="form-group">
                                        <div className={`input-wrapper ${status === 'error' ? 'error-border' : ''}`}>
                                            <Mail className="input-icon lucide-icon" size={18} />
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="Enter your email"
                                                required
                                                disabled={status === 'loading'}
                                            />
                                        </div>
                                    </div>

                                    {status === 'error' && (
                                        <div className="auth-error-message text-center w-full block">
                                            {errorMessage}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        className={`btn-login mt-2 ${status === 'loading' ? 'loading' : ''}`}
                                        disabled={status === 'loading'}
                                    >
                                        <span className="btn-text">
                                            {status === 'loading' ? 'Sending...' : 'Send Reset Link'}
                                        </span>
                                        <span className="btn-loader">
                                            <Loader2 className="animate-spin" size={22} />
                                        </span>
                                    </button>
                                </form>
                            </>
                        )}

                        {/* Back to Login Link */}
                        <div className="mt-8 text-center pt-2">
                            <button
                                className="back-to-login"
                                onClick={() => navigate('/login')}
                            >
                                <ArrowLeft size={16} />
                                Remember your password? Back to Login
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
