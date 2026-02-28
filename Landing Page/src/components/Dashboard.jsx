import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { generateRealDashboardData } from '../lib/defaultData';
import TopNav from './dashboard/TopNav';

/* Tab Content */
import HomeTab from './dashboard/HomeTab';
import DocumentsTab from './dashboard/DocumentsTab';
import DatabaseTab from './dashboard/DatabaseTab';
import HealthChatTab from './dashboard/HealthChatTab';
import VitalAssessmentTab from './dashboard/VitalAssessmentTab';

/* Analytics */
import MyRiskOverview from './dashboard/BrainMapping';
import PersonalRiskGauge from './dashboard/AnalyticsInsights';
import VitalsGrid from './dashboard/VitalsGrid';
import MyActionPlan from './dashboard/NextSteps';

/* ── Skeleton Loader ── */
const SkeletonBlock = ({ className = '' }) => (
    <div className={`bg-gray-100 rounded-[20px] animate-pulse ${className}`} />
);

const DashboardSkeleton = () => (
    <div className="flex flex-col gap-6 flex-1 w-full">
        <SkeletonBlock className="h-[160px] w-full" />
        <SkeletonBlock className="h-[80px] w-full" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <SkeletonBlock className="h-[120px]" />
            <SkeletonBlock className="h-[120px]" />
            <SkeletonBlock className="h-[120px]" />
            <SkeletonBlock className="h-[120px]" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
            <SkeletonBlock className="lg:col-span-2 h-[300px]" />
            <SkeletonBlock className="h-[300px]" />
        </div>
    </div>
);

const AmbientMeshBackground = () => (
    <div className="absolute inset-0 z-0 overflow-hidden rounded-[32px] pointer-events-none opacity-50">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full mix-blend-multiply filter blur-[100px] animate-pulse" style={{ background: 'rgba(204, 255, 240, 0.6)', animationDuration: '8s' }} />
        <div className="absolute top-[30%] -right-[10%] w-[40%] h-[40%] rounded-full mix-blend-multiply filter blur-[90px] animate-pulse" style={{ background: 'rgba(237, 233, 254, 0.6)', animationDuration: '10s', animationDelay: '2s' }} />
        <div className="absolute -bottom-[10%] left-[20%] w-[60%] h-[60%] rounded-full mix-blend-multiply filter blur-[120px] animate-pulse" style={{ background: 'rgba(209, 250, 229, 0.5)', animationDuration: '12s', animationDelay: '4s' }} />
    </div>
);

function AnalyticsTab({ data }) {
    if (!data) return <DashboardSkeleton />;
    return (
        <div className="relative flex flex-col gap-6 flex-1 w-full z-0 font-inter min-h-full">
            <AmbientMeshBackground />
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <MyRiskOverview
                        features={data.features}
                        trends={data.trends}
                        correlations={data.correlations}
                    />
                </div>
                <div><PersonalRiskGauge metrics={data.metrics} /></div>
            </div>
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2"><VitalsGrid vitals={data.vitals} /></div>
                <div><MyActionPlan steps={data.nextSteps} currentUser={data._rawCurrentUser} /></div>
            </div>
        </div>
    );
}

/* ── Name helpers ── */
const getEmailFallback = (email) => {
    if (!email) return null;
    return email.split('@')[0]
        .split(/[._-]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

const formatProperName = (nameToFormat) => {
    if (!nameToFormat) return null;
    let formatted = nameToFormat.trim();
    if (!formatted.includes(' ')) {
        if (/[a-z][A-Z]/.test(formatted)) {
            formatted = formatted.replace(/([a-z])([A-Z])/g, '$1 $2');
        } else if (formatted.toLowerCase() === 'diyavantiya') {
            formatted = 'Diya Vantiya';
        }
    }
    return formatted.split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
};

export default function Dashboard() {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Parse ?tab= from URL, default to 'home'
    const urlParams = new URLSearchParams(location.search);
    const initialTab = urlParams.get('tab') || 'home';
    const [activeTab, setActiveTab] = useState(initialTab);

    // Sync tab when URL changes (e.g. browser back/forward)
    useEffect(() => {
        const currentTab = new URLSearchParams(location.search).get('tab');
        if (currentTab && currentTab !== activeTab) setActiveTab(currentTab);
    }, [location.search]);

    // Redirect to home if truly unauthenticated (no cache either)
    useEffect(() => {
        if (!currentUser) { navigate('/'); }
    }, [currentUser, navigate]);

    useEffect(() => {
        document.body.classList.add('dashboard-body');
        return () => document.body.classList.remove('dashboard-body');
    }, []);

    const handleTabChange = (newTab) => {
        setActiveTab(newTab);
        navigate(`/dashboard?tab=${newTab}`, { replace: true });
    };

    const handleLogout = async () => {
        try { localStorage.removeItem('currentUser'); await logout(); navigate('/'); }
        catch (e) { console.error('Logout failed:', e); }
    };

    // ── Derive dashboard data from AuthContext (already fetched — no duplicate request) ──
    const dashboardData = useMemo(() => {
        const firestoreData = currentUser?.firestoreData;

        // Always generate the dashboard state dynamically from the true assessment list
        // If there are no assessments, this correctly builds the empty "Zero State"
        const assessments = firestoreData?.assessments || [];
        const latestAssessment = assessments[0] || null;

        return generateRealDashboardData(currentUser, latestAssessment, assessments);

    }, [currentUser]);

    // ── Derive display name ──
    const displayName = useMemo(() => {
        const rawName = currentUser?.displayName
            || currentUser?.firestoreData?.name
            || currentUser?.firestoreData?.fullName
            || getEmailFallback(currentUser?.email)
            || 'Patient';
        return formatProperName(rawName);
    }, [currentUser]);

    // Store for other components
    useEffect(() => {
        if (displayName && currentUser?.email) {
            localStorage.setItem('currentUser', JSON.stringify({
                name: displayName,
                email: currentUser.email,
            }));
        }
    }, [displayName, currentUser]);

    const renderTab = () => {
        switch (activeTab) {
            case 'home': return <HomeTab displayName={displayName} data={dashboardData} />;
            case 'chat': return <HealthChatTab />;
            case 'assessment': return <VitalAssessmentTab />;
            case 'documents': return <DocumentsTab displayName={displayName} documents={dashboardData?.documents} />;
            case 'database': return <DatabaseTab displayName={displayName} database={dashboardData?.database} />;
            case 'analytics':
            default: return (
                <AnalyticsTab data={dashboardData?.analytics ? { ...dashboardData.analytics, vitals: dashboardData.vitals, _rawCurrentUser: dashboardData._rawCurrentUser } : null} />
            );
        }
    };

    // Show a skeleton while the user object hydrates from Firebase (brief)
    if (!currentUser) {
        return (
            <div className="bg-white w-full p-6 lg:p-10 font-inter flex flex-col min-h-screen">
                <div className="flex items-center justify-between mb-8">
                    <SkeletonBlock className="h-8 w-32" />
                    <SkeletonBlock className="h-8 w-64" />
                    <SkeletonBlock className="h-8 w-24" />
                </div>
                <DashboardSkeleton />
            </div>
        );
    }

    return (
        <div className="bg-white w-full p-6 lg:p-10 text-gray-900 font-inter flex flex-col flex-1 min-h-screen">
            <TopNav
                displayName={displayName}
                onLogout={handleLogout}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                dashboardData={dashboardData}
            />
            <main className="mt-8 flex flex-col gap-6 flex-1 h-full min-h-0">
                {renderTab()}
            </main>
        </div>
    );
}
