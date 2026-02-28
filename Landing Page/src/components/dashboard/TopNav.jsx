import React, { useState, useRef, useEffect } from 'react';
import { Home, FileText, BarChart2, Database, Bell, LogOut, User } from 'lucide-react';
import logoImg from '../../assets/transparent-logo.png';
import EditProfileForm from './EditProfileForm';
import { useAuth } from '../../context/AuthContext';

const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'database', label: 'Database', icon: Database },
];

export default function TopNav({ displayName, onLogout, activeTab, onTabChange, dashboardData }) {
    const { currentUser } = useAuth();
    const [showNotifications, setShowNotifications] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showEditProfile, setShowEditProfile] = useState(false);
    const [notifications, setNotifications] = useState([]);

    // Load persisted read/dismissed notification IDs
    const getPersistedReadIds = () => {
        try {
            return new Set(JSON.parse(localStorage.getItem('cortex_read_notifs') || '[]'));
        } catch (e) {
            return new Set();
        }
    };
    const [persistedReadIds, setPersistedReadIds] = useState(getPersistedReadIds());

    const persistReadIds = (idsSet) => {
        setPersistedReadIds(idsSet);
        localStorage.setItem('cortex_read_notifs', JSON.stringify(Array.from(idsSet)));
    };

    // Dynamically generate notifications based on user data
    useEffect(() => {
        if (!currentUser?.firestoreData) return;
        const assessments = currentUser.firestoreData.assessments || [];
        const vitals = currentUser.firestoreData.vitals;

        const generatedNotifs = [];

        // 1. Process Assessments (they are sorted newest first)
        assessments.forEach((assessment, index) => {
            const pred = assessment.prediction || {};
            const riskColor = pred.risk_category === 'High' ? 'EF4A4A' : pred.risk_category === 'Medium' ? 'F68E0B' : '109981';
            const dateStr = new Date(assessment.timestamp || new Date()).toLocaleString();

            // Only the most recent assessment is unread by default
            const isRead = index !== 0;

            // If safety override triggered
            if (pred.safety_override) {
                generatedNotifs.push({
                    id: `${assessment.timestamp}-safety`,
                    avatar: `https://ui-avatars.com/api/?name=Alert&background=EF4A4A&color=fff`,
                    message: `Safety Override Applied: ${pred.override_reason}`,
                    time: dateStr,
                    read: isRead
                });
            }

            generatedNotifs.push({
                id: assessment.timestamp || `assessment-${index}`,
                avatar: `https://ui-avatars.com/api/?name=Cortex+AI&background=${riskColor}&color=fff`,
                message: `Assessment complete: ${pred.risk_category || 'Unknown'} Risk detected (Score: ${pred.risk_score || 0}/3).`,
                time: dateStr,
                read: isRead
            });
        });

        // 2. Process Vitals
        if (vitals && Object.keys(vitals).length > 0) {
            generatedNotifs.push({
                id: 'vitals-sync',
                avatar: 'https://ui-avatars.com/api/?name=Vitals&background=4285F4&color=fff',
                message: `Vitals updated: HR ${vitals.heartRate || '--'} bpm, SpO₂ ${vitals.spo2 || '--'}%.`,
                time: 'Recent',
                read: true
            });
        }

        // 3. Welcome Message
        generatedNotifs.push({
            id: 'welcome',
            avatar: 'https://ui-avatars.com/api/?name=System&background=8B5CF6&color=fff',
            message: 'Patient profile initialized and secured.',
            time: 'System Setup',
            read: true
        });

        // Preserve read state from previous render and localStorage
        setNotifications(prev => {
            const currentReadIds = new Set(prev.filter(n => n.read).map(n => n.id));
            return generatedNotifs.map(n => ({
                ...n,
                read: currentReadIds.has(n.id) || persistedReadIds.has(n.id) || n.read
            }));
        });
    }, [currentUser]); // Reacting to currentUser limits dependency loops here. Persistent changes run through handler functions.

    const unreadNotifications = notifications.filter(n => !n.read);
    const unreadCount = unreadNotifications.length;

    const markAsRead = (id) => {
        const newPersisted = new Set(persistedReadIds);
        newPersisted.add(id);
        persistReadIds(newPersisted);

        setNotifications(notifications.map(n =>
            n.id === id ? { ...n, read: true } : n
        ));
    };

    const markAllAsRead = () => {
        const newPersisted = new Set(persistedReadIds);
        notifications.forEach(n => newPersisted.add(n.id));
        persistReadIds(newPersisted);

        setNotifications(notifications.map(n => ({ ...n, read: true })));
    };

    const initials = displayName
        ?.split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase() || 'PT';

    // Close dropdowns on click outside
    const userMenuRef = useRef(null);
    useEffect(() => {
        function handleClickOutside(event) {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setShowUserMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <header className="flex items-center justify-between w-full relative z-10 py-4 gap-6 lg:gap-12 px-2">
            {/* Brand */}
            <div className="flex items-center gap-3 cursor-pointer transition-transform hover:scale-105 shrink-0"
                onClick={() => onTabChange('home')}>
                <img src={logoImg} alt="Cortex" className="w-10 h-10 object-contain invert opacity-90" />
                <span className="font-outfit font-bold text-3xl text-[#0a0e0c] tracking-tight">Cortex</span>
            </div>

            <nav className="hidden md:flex items-center justify-center bg-white rounded-full shadow-sm border border-gray-100 px-3 py-2 gap-1.5 z-0 shrink-0">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={`flex items-center gap-2.5 px-5 lg:px-6 py-2.5 rounded-full text-[15px] font-medium transition-all duration-200 ${isActive
                                ? 'bg-[#1c1c1c] text-white shadow-md'
                                : 'text-gray-500 hover:bg-gray-50'
                                }`}>
                            <Icon size={18} /> {tab.label}
                        </button>
                    );
                })}
            </nav>

            {/* Right User Actions */}
            <div className="flex items-center gap-4 relative z-20 shrink-0">
                <div className="relative">
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="w-11 h-11 bg-white rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-50 shadow-sm border border-gray-100 relative transition-transform hover:scale-105"
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                        )}
                    </button>

                    {/* Notifications Dropdown */}
                    {showNotifications && (
                        <div className="absolute right-0 mt-3 w-[360px] bg-white rounded-[24px] shadow-[0_12px_40px_rgb(0,0,0,0.12)] border border-gray-100 overflow-hidden transform origin-top-right transition-all animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                            <div className="p-5 pb-3">
                                <h3 className="text-2xl font-bold text-[#111827]">Notifications</h3>
                            </div>

                            <div className="max-h-[400px] overflow-y-auto px-5">
                                {unreadNotifications.length > 0 ? (
                                    <div className="flex flex-col">
                                        {unreadNotifications.map((notif, idx) => (
                                            <div
                                                key={notif.id}
                                                onClick={() => markAsRead(notif.id)}
                                                className={`py-4 cursor-pointer flex gap-4 ${idx !== unreadNotifications.length - 1 ? 'border-b border-gray-100' : ''}`}
                                            >
                                                <div className="shrink-0 relative">
                                                    <img src={notif.avatar} alt="Avatar" className="w-12 h-12 rounded-full object-cover" />
                                                    {!notif.read && (
                                                        <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></span>
                                                    )}
                                                </div>
                                                <div className="flex flex-col justify-center">
                                                    <p className="text-[15px] text-[#111827] font-semibold leading-tight">
                                                        {notif.message}
                                                    </p>
                                                    <p className="text-[13px] text-gray-500 mt-1">{notif.time}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-8 text-center text-gray-500 flex flex-col items-center gap-3">
                                        <Bell size={28} className="text-gray-300" />
                                        <p className="text-base">No new notifications</p>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 flex justify-center text-center">
                                <button
                                    onClick={markAllAsRead}
                                    className="text-[15px] font-semibold text-[#111827] hover:text-[#109981] transition-colors"
                                >
                                    Mark as all read
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="relative" ref={userMenuRef}>
                    <button
                        onClick={() => {
                            setShowUserMenu(!showUserMenu);
                            setShowNotifications(false);
                        }}
                        className="flex items-center gap-3 px-7 py-3 bg-white rounded-full text-[15px] font-semibold transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
                    >
                        <span className="text-[#111827]">
                            {displayName}
                        </span>
                    </button>

                    {/* User Dropdown */}
                    {showUserMenu && (
                        <div className="absolute right-0 mt-3 w-full min-w-[220px] bg-white rounded-[32px] shadow-[0_12px_40px_rgba(0,0,0,0.08)] border border-gray-50 overflow-hidden transform origin-top-right transition-all animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                            <div className="p-2.5">
                                <button
                                    onClick={() => {
                                        setShowUserMenu(false);
                                        setShowEditProfile(true);
                                    }}
                                    className="w-full text-left px-5 py-3.5 text-[15px] text-[#109981] font-semibold bg-[#F4F9F8] hover:bg-[#E8F5F2] rounded-[24px] transition-colors flex items-center gap-3"
                                >
                                    <User size={18} strokeWidth={2.5} /> Edit Profile
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                <button onClick={onLogout}
                    className="w-11 h-11 bg-white rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 shadow-sm border border-gray-100 transition-colors"
                    title="Logout">
                    <LogOut size={18} />
                </button>
            </div>

            {/* Edit Profile Modal */}
            {showEditProfile && (
                <EditProfileForm
                    onClose={() => setShowEditProfile(false)}
                    currentName={displayName}
                    currentEmail={currentUser?.email}
                    firestoreData={currentUser?.firestoreData}
                />
            )}
        </header>
    );
}
