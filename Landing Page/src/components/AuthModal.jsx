import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { X, Mail, Lock, User, Loader2, CheckCircle2 } from 'lucide-react';

const AuthModal = ({ isOpen, onClose, initialMode = 'login' }) => {
    const [mode, setMode] = useState(initialMode); // 'login' or 'signup'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resetSent, setResetSent] = useState(false);

    // OTP states
    const [keepSignedIn, setKeepSignedIn] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState('');
    const [sendingOtp, setSendingOtp] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [otpVerified, setOtpVerified] = useState(false);
    const [verifyingOtp, setVerifyingOtp] = useState(false);

    const { login, signup, sendOTPEmail, verifyOTP, resetPassword } = useAuth();
    const navigate = useNavigate();

    // Resend cooldown timer
    useEffect(() => {
        let timer;
        if (resendCooldown > 0) {
            timer = setInterval(() => setResendCooldown((c) => c - 1), 1000);
        }
        return () => clearInterval(timer);
    }, [resendCooldown]);

    // Auto-verify OTP when user enters 6 digits
    useEffect(() => {
        if (otp.length === 6 && otpSent && !otpVerified && !verifyingOtp) {
            const verify = async () => {
                setVerifyingOtp(true);
                setError('');
                try {
                    await verifyOTP(email, otp);
                    setOtpVerified(true);
                } catch (err) {
                    setError('Invalid or expired code. Please try again.');
                    setOtp('');
                } finally {
                    setVerifyingOtp(false);
                }
            };
            verify();
        }
    }, [otp]);

    if (!isOpen) return null;

    // Send OTP on email blur (only in signup mode, only once)
    const handleEmailBlur = async () => {
        if (mode !== 'signup' || !email || !email.includes('@') || otpSent || sendingOtp) return;

        try {
            setSendingOtp(true);
            setError('');
            await sendOTPEmail(email);
            setOtpSent(true);
            setResendCooldown(30);
        } catch (err) {
            setError(err.message?.replace('Firebase: Error (auth/', '').replace(').', '').replace(/-/g, ' ') || 'Failed to send verification code. Please try again.');
        } finally {
            setSendingOtp(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (mode === 'forgot-password') {
                await resetPassword(email);
                setResetSent(true);
                setLoading(false);
                return;
            }

            if (mode === 'signup') {
                if (!otpVerified) {
                    setError('Please verify your email first.');
                    setLoading(false);
                    return;
                }

                await signup(email, password, name);
                onClose();
                navigate('/dashboard?tab=home');
            } else {
                await login(email, password, keepSignedIn);
                onClose();
                navigate('/dashboard?tab=home');
            }
        } catch (err) {
            setError(err.message?.replace('Firebase: Error (auth/', '').replace(').', '').replace(/-/g, ' ') || 'An error occurred.');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0) return;
        try {
            setSendingOtp(true);
            setOtpVerified(false);
            setOtp('');
            await sendOTPEmail(email);
            setResendCooldown(30);
            setError('');
        } catch (err) {
            setError(err.message?.replace('Firebase: Error (auth/', '').replace(').', '').replace(/-/g, ' ') || 'Failed to resend code.');
        } finally {
            setSendingOtp(false);
        }
    };

    const toggleMode = () => {
        setMode(mode === 'login' ? 'signup' : 'login');
        setError('');
        setOtpSent(false);
        setOtp('');
        setOtpVerified(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className="relative w-full max-w-md bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur-md transform transition-all">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                {/* Header */}
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-playfair font-bold text-white mb-2">
                        {mode === 'login' ? 'Welcome Back' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
                    </h2>
                    <p className="text-zinc-400 text-sm font-inter">
                        {mode === 'login'
                            ? 'Enter your details to access your dashboard.'
                            : mode === 'signup'
                                ? 'Join Cortex to unlock powerful clinical insights.'
                                : 'Enter your email to receive a password reset link.'}
                    </p>
                </div>

                {/* Error Message (shown outside OTP section) */}
                {error && !(mode === 'signup' && otpSent && !otpVerified) && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm text-center capitalize">
                        {error}
                    </div>
                )}

                {mode === 'forgot-password' && resetSent ? (
                    <div className="text-center py-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30">
                            <CheckCircle2 className="text-green-400 w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-white font-outfit mb-2">Check Your Email</h3>
                        <p className="text-zinc-400 text-sm mb-6">We've sent a password reset link to <br /><span className="text-white font-medium">{email}</span></p>
                        <button onClick={() => { setMode('login'); setResetSent(false); }} className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-3 px-4 rounded-xl transition-colors border border-zinc-700">Back to Sign In</button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4 font-inter">

                        {/* Full Name — always visible in signup mode */}
                        {mode === 'signup' && (
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1 ml-1 uppercase tracking-wider">Full Name</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                                        <User size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-black/50 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                        placeholder="Dr. Jane Smith"
                                        required
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Email */}
                        <div>
                            <div className="flex items-center justify-between mb-1 ml-1">
                                <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider">Email Address</label>
                                {sendingOtp && <span className="text-xs text-blue-400 animate-pulse">Sending OTP...</span>}
                            </div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onBlur={handleEmailBlur}
                                    className="w-full bg-black/50 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                    required
                                    disabled={loading || sendingOtp || (mode === 'signup' && otpSent)}
                                />
                            </div>
                        </div>

                        {/* Verification Code field */}
                        {mode === 'signup' && (
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1 ml-1 uppercase tracking-wider">Verification Code</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                                        <CheckCircle2 size={18} className={otpVerified ? 'text-green-400' : ''} />
                                    </div>
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            if (val.length <= 6) setOtp(val);
                                        }}
                                        className={`w-full bg-black/50 border rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-1 transition-colors font-medium tracking-widest ${otpVerified ? 'border-green-500 focus:border-green-500 focus:ring-green-500' : 'border-zinc-800 focus:border-blue-500 focus:ring-blue-500'}`}
                                        placeholder="123456"
                                        maxLength={6}
                                        disabled={loading || otpVerified || verifyingOtp}
                                    />
                                    {verifyingOtp && (
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                            <Loader2 className="animate-spin text-blue-400" size={16} />
                                        </div>
                                    )}
                                    {otpVerified && (
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                            <span className="text-xs text-green-400 font-medium">Verified</span>
                                        </div>
                                    )}
                                </div>
                                {error && mode === 'signup' && otpSent && !otpVerified && (
                                    <div className="mt-1.5 ml-1 text-xs text-red-400">
                                        {error}
                                    </div>
                                )}
                                <div className="text-right mt-1 mr-1">
                                    <button
                                        type="button"
                                        onClick={handleResend}
                                        disabled={resendCooldown > 0 || sendingOtp || otpVerified}
                                        className="text-xs text-blue-400 hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {resendCooldown > 0 ? `Resend Code in ${resendCooldown}s` : "Resend Code"}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Password — hidden in forgot password mode */}
                        {mode !== 'forgot-password' && (
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1 ml-1 uppercase tracking-wider">Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-black/50 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                        placeholder="••••••••"
                                        required
                                        minLength={6}
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                        )}



                        {mode === 'login' && (
                            <div className="flex items-center justify-between mt-2 mb-2">
                                <label className="flex items-center text-zinc-400 text-sm cursor-pointer hover:text-white transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={keepSignedIn}
                                        onChange={(e) => setKeepSignedIn(e.target.checked)}
                                        className="mr-2 rounded border-zinc-700 bg-black/50 text-blue-500 focus:ring-blue-500 focus:ring-offset-0 focus:ring-offset-transparent"
                                    />
                                    Keep me signed in
                                </label>
                                <button type="button" onClick={() => { setMode('forgot-password'); setError(''); setResetSent(false); }} className="text-sm text-blue-400 hover:text-blue-300">Forgot Password?</button>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || sendingOtp || verifyingOtp || (mode === 'signup' && (!otpVerified || !name || !password)) || (mode === 'forgot-password' && !email)}
                            className="w-full relative group mt-6 bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Complete Sign Up' : 'Send Reset Link'
                            )}

                            <div className="absolute inset-0 bg-blue-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                        </button>
                    </form>
                )}

                {/* Toggle */}
                <div className="mt-6 text-center text-zinc-400 text-sm font-inter">
                    {mode === 'forgot-password' ? (
                        <button onClick={() => { setMode('login'); setError(''); setResetSent(false); }} className="text-blue-400 hover:text-blue-300 font-medium transition-colors">Back to Sign In</button>
                    ) : (
                        <>
                            {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                            <button
                                onClick={() => {
                                    if (mode === 'login') {
                                        window.location.href = '/signup/index.html';
                                    } else {
                                        toggleMode();
                                    }
                                }}
                                className="text-blue-400 hover:text-blue-300 font-medium transition-colors focus:outline-none"
                            >
                                {mode === 'login' ? 'Sign up' : 'Log in'}
                            </button>
                        </>
                    )}
                </div>

            </div>
        </div>
    );
};

export default AuthModal;
