import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, User, Palette, ShieldCheck, Mail, Send, Loader2, CheckCircle2, Calendar, Activity, Droplet, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/* ── Design Palette ── */
const P = {
    info: { main: '#00DAAA', glow: 'rgba(0,218,170,0.2)' },
    purple: { main: '#8B5CF6' },
};

export default function EditProfileForm({ onClose, onUpdate, currentName, currentEmail, firestoreData }) {
    const [name, setName] = useState(currentName || '');
    const [dob, setDob] = useState(firestoreData?.dob || '');
    const [gender, setGender] = useState(firestoreData?.gender || '');
    const [bloodType, setBloodType] = useState(firestoreData?.bloodType || '');

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const { updateUserProfile, logout } = useAuth();

    const handleLogout = async () => {
        try {
            onClose(); // Ensure modal unmounts
            await logout();
        } catch (err) {
            console.error("Failed to log out", err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('Name cannot be empty.');
            return;
        }
        const currentDob = firestoreData?.dob || '';
        const currentGender = firestoreData?.gender || '';
        const currentBloodType = firestoreData?.bloodType || '';

        const hasChanges = (name !== currentName) ||
            (dob !== currentDob) ||
            (gender !== currentGender) ||
            (bloodType !== currentBloodType);

        if (!hasChanges) {
            onClose();
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            await updateUserProfile({
                name,
                dob,
                gender,
                bloodType
            });
            setSuccess(true);
            if (onUpdate) onUpdate(name);
            setTimeout(() => {
                onClose();
            }, 1000);
        } catch (err) {
            setError('Failed to update profile. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const modalContent = (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ animation: 'fadeIn 0.3s ease-out' }}>

            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            {/* Form Container */}
            <div className="relative w-full max-w-[500px] rounded-[32px] overflow-hidden"
                style={{
                    background: 'linear-gradient(180deg, rgba(245,243,240,0.98) 0%, rgba(255,255,255,0.98) 100%)',
                    border: '1px solid rgba(255,255,255,0.9)',
                    boxShadow: '0 32px 80px rgba(0,0,0,0.15), 0 12px 32px rgba(0,0,0,0.08)',
                    backdropFilter: 'blur(40px)',
                    animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                }}>

                {/* Ambient glows */}
                <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-20 pointer-events-none"
                    style={{ background: `radial-gradient(circle, ${P.info.main}, transparent 70%)`, filter: 'blur(60px)' }} />
                <div className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full opacity-15 pointer-events-none"
                    style={{ background: `radial-gradient(circle, ${P.purple.main}, transparent 70%)`, filter: 'blur(50px)' }} />

                {/* ── Header ── */}
                <div className="relative z-10 p-8 pb-6 flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-[18px] flex items-center justify-center"
                            style={{
                                background: 'linear-gradient(135deg, rgba(0,218,170,0.15), rgba(16,153,129,0.05))',
                                border: '1px solid rgba(0,218,170,0.25)',
                                boxShadow: `0 8px 24px ${P.info.glow}`,
                            }}>
                            <User size={24} style={{ color: P.info.main }} />
                        </div>
                        <div>
                            <h2 className="text-gray-900 font-outfit font-black text-2xl tracking-tight">Edit Profile</h2>
                            <p className="text-gray-400 text-xs font-medium mt-1">Manage your Cortex AI account details</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={handleLogout} type="button"
                            className="w-10 h-10 bg-white/60 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 shadow-sm border border-white/80 transition-colors"
                            title="Logout">
                            <LogOut size={17} />
                        </button>
                        <button onClick={onClose} type="button"
                            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/60 border border-white/80 shadow-sm hover:bg-white hover:shadow-md transition-all duration-200">
                            <X size={18} className="text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* ── Form Body ── */}
                <form onSubmit={handleSubmit} className="relative z-10 px-8 pb-8 flex flex-col gap-5">

                    {/* Display Name Input */}
                    <div className="flex flex-col gap-2 p-5 rounded-[20px]"
                        style={{
                            background: 'rgba(255,255,255,0.7)',
                            border: '1px solid rgba(255,255,255,0.8)',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
                        }}>
                        <div className="flex items-center gap-2 mb-2">
                            <Palette size={14} className="text-gray-400" />
                            <label className="text-gray-700 text-sm font-bold font-outfit">Display Name</label>
                        </div>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your name"
                            className="w-full bg-white/60 border border-gray-100 rounded-[14px] py-3.5 px-4 text-gray-900 text-sm font-medium focus:outline-none focus:border-[#109981] focus:ring-2 focus:ring-[#109981]20 transition-all duration-200"
                            style={{ boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.03)' }}
                        />
                    </div>

                    {/* Email Input (Disabled/Read-only) */}
                    <div className="flex flex-col gap-2 p-5 rounded-[20px] opacity-80"
                        style={{
                            background: 'rgba(255,255,255,0.5)',
                            border: '1px solid rgba(255,255,255,0.5)',
                        }}>
                        <div className="flex items-center gap-2 mb-2">
                            <Mail size={14} className="text-gray-400" />
                            <label className="text-gray-700 text-sm font-bold font-outfit">Email Address</label>
                            <span className="ml-auto text-[10px] font-bold tracking-wider text-gray-400 uppercase bg-gray-100 px-2 py-0.5 rounded flex items-center gap-1">
                                <ShieldCheck size={10} /> Verified
                            </span>
                        </div>
                        <input
                            type="email"
                            value={currentEmail || ''}
                            disabled
                            className="w-full bg-white/40 border border-transparent rounded-[14px] py-3.5 px-4 text-gray-500 text-sm font-medium cursor-not-allowed"
                        />
                    </div>

                    {/* Medical Profile Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Date of Birth Input */}
                        <div className="flex flex-col gap-2 p-4 rounded-[16px] col-span-2 sm:col-span-1"
                            style={{
                                background: 'rgba(255,255,255,0.6)',
                                border: '1px solid rgba(255,255,255,0.7)',
                            }}>
                            <div className="flex items-center gap-2 mb-1">
                                <Calendar size={13} className="text-gray-400" />
                                <label className="text-gray-700 text-xs font-bold font-outfit">Date of Birth</label>
                            </div>
                            <input
                                type="date"
                                value={dob}
                                onChange={(e) => setDob(e.target.value)}
                                className="w-full bg-white/60 border border-gray-100 rounded-[12px] py-2.5 px-3 text-gray-900 text-sm font-medium focus:outline-none focus:border-[#109981] focus:ring-2 focus:ring-[#109981]20 transition-all duration-200"
                            />
                        </div>

                        {/* Gender Select */}
                        <div className="flex flex-col gap-2 p-4 rounded-[16px]"
                            style={{
                                background: 'rgba(255,255,255,0.6)',
                                border: '1px solid rgba(255,255,255,0.7)',
                            }}>
                            <div className="flex items-center gap-2 mb-1">
                                <Activity size={13} className="text-gray-400" />
                                <label className="text-gray-700 text-xs font-bold font-outfit">Biological Sex</label>
                            </div>
                            <select
                                value={gender}
                                onChange={(e) => setGender(e.target.value)}
                                className="w-full bg-white/60 border border-gray-100 rounded-[12px] py-2.5 px-3 text-gray-900 text-sm font-medium focus:outline-none focus:border-[#109981] focus:ring-2 focus:ring-[#109981]20 transition-all duration-200"
                            >
                                <option value="">Select...</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        {/* Blood Type Select */}
                        <div className="flex flex-col gap-2 p-4 rounded-[16px]"
                            style={{
                                background: 'rgba(255,255,255,0.6)',
                                border: '1px solid rgba(255,255,255,0.7)',
                            }}>
                            <div className="flex items-center gap-2 mb-1">
                                <Droplet size={13} className="text-danger" style={{ color: '#EF4A4A' }} />
                                <label className="text-gray-700 text-xs font-bold font-outfit">Blood Type</label>
                            </div>
                            <select
                                value={bloodType}
                                onChange={(e) => setBloodType(e.target.value)}
                                className="w-full bg-white/60 border border-gray-100 rounded-[12px] py-2.5 px-3 text-gray-900 text-sm font-medium focus:outline-none focus:border-[#109981] focus:ring-2 focus:ring-[#109981]20 transition-all duration-200"
                            >
                                <option value="">Select...</option>
                                <option value="A+">A+</option>
                                <option value="A-">A-</option>
                                <option value="B+">B+</option>
                                <option value="B-">B-</option>
                                <option value="AB+">AB+</option>
                                <option value="AB-">AB-</option>
                                <option value="O+">O+</option>
                                <option value="O-">O-</option>
                            </select>
                        </div>
                    </div>

                    {error && (
                        <div className="text-[#EF4A4A] text-xs font-bold text-center mt-2 animate-fadeIn">
                            {error}
                        </div>
                    )}

                    {/* Action Button */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <button
                            type="submit"
                            disabled={submitting || success}
                            className="w-full flex justify-center items-center gap-2.5 px-8 py-4 rounded-[16px] font-outfit font-bold text-[15px] transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                            style={{
                                background: success
                                    ? 'linear-gradient(135deg, #109981, #065F46)'
                                    : 'linear-gradient(135deg, #00DAAA, #109981)',
                                color: '#FFFFFF',
                                boxShadow: success
                                    ? '0 8px 24px rgba(16,153,129,0.3)'
                                    : '0 8px 24px rgba(0,218,170,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
                                textShadow: '0 1px 2px rgba(0,0,0,0.15)',
                            }}>
                            {success ? (
                                <>
                                    <CheckCircle2 size={18} />
                                    Profile Saved
                                </>
                            ) : submitting ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Send size={18} />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
