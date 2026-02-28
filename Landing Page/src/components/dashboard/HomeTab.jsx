import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Activity, Heart, CalendarDays, Pill, Clock,
    Sparkles, MessageSquare, FileText, Stethoscope, FlaskConical,
    ClipboardList, User,
    TrendingUp, CheckCircle2, Bell, Zap, ArrowRight, Plus,
    ShieldAlert, Mail
} from 'lucide-react';
import AssessmentForm from './AssessmentForm';
import HealthChatTab from './HealthChatTab';
import { useAuth } from '../../context/AuthContext';

/* ── Ultra-Premium Design Palette ── */
const P = {
    danger: { main: '#EF4A4A', light: '#FEE2E2', dark: '#95161B', glow: 'rgba(239,86,86,0.2)' },
    warning: { main: '#F68E0B', light: '#FEF3C7', dark: '#82400E', glow: 'rgba(245,158,11,0.2)' },
    success: { main: '#109981', light: '#D1FAE5', dark: '#065F46', glow: 'rgba(19,165,129,0.2)' },
    info: { main: '#00DAAA', light: '#CCFFF0', dark: '#008A6E', glow: 'rgba(0,218,170,0.2)' },
    purple: { main: '#8B5CF6', light: '#EDE9FE', dark: '#5B21B6', glow: 'rgba(139,92,246,0.2)' },
};

/* ── Helper Components ── */
const PremiumProgressRing = ({ value, max, size = 80 }) => {
    const r = (size - 8) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ * (1 - (value / max));
    return (
        <div className="relative flex items-center justify-center group cursor-default">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
                <defs>
                    <linearGradient id="ai-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#00DAAA" />
                        <stop offset="100%" stopColor="#109981" />
                    </linearGradient>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>
                {/* Background track */}
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
                {/* Inner shadow simulation */}
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="6" style={{ transform: 'translate(1px, 1px)' }} />
                {/* Gradient progress */}
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#ai-gradient)" strokeWidth="6"
                    strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" filter="url(#glow)"
                    className="transition-all duration-[1.5s] ease-out group-hover:filter-brightness-110" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center transition-transform duration-300 group-hover:scale-105">
                <span className="text-white text-[1.6rem] font-outfit font-extrabold tracking-tighter" style={{ textShadow: '0 2px 10px rgba(0,218,170,0.4)' }}>{value}</span>
            </div>
        </div>
    );
};

const AmbientMeshBackground = () => (
    <div className="absolute inset-0 z-0 overflow-hidden rounded-[32px] pointer-events-none opacity-60">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full mix-blend-multiply filter blur-[100px] animate-pulse"
            style={{ background: 'rgba(204, 255, 240, 0.7)', animationDuration: '8s' }} />
        <div className="absolute top-[10%] -right-[10%] w-[50%] h-[50%] rounded-full mix-blend-multiply filter blur-[100px] animate-pulse"
            style={{ background: 'rgba(237, 233, 254, 0.7)', animationDuration: '10s', animationDelay: '2s' }} />
        <div className="absolute -bottom-[20%] left-[20%] w-[70%] h-[70%] rounded-full mix-blend-multiply filter blur-[120px] animate-pulse"
            style={{ background: 'rgba(209, 250, 229, 0.5)', animationDuration: '12s', animationDelay: '4s' }} />
    </div>
);

/* ══════════════════════════════════════════
   HomeTab Component
   ══════════════════════════════════════════ */
export default function HomeTab({ displayName, data }) {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [showAssessment, setShowAssessment] = useState(false);
    const [latestPrediction, setLatestPrediction] = useState(null);
    const activePrediction = latestPrediction || data?.latestAssessment?.prediction;
    const firstName = displayName?.split(' ')[0] || 'User';
    const now = new Date();
    const hour = now.getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

    // Provide safe defaults if no database data is found
    const healthSummary = data?.healthSummary || [];
    const timeline = data?.careTimeline || [];
    const profile = data?.profile || { score: 0, status: 'STABLE', dob: '', careTeamLead: '', primaryDiagnosis: '' };

    // Maps string types back to Lucide Icons since we can't store actual Icon references in Firestore
    const getHealthIcon = (type) => {
        switch (type) {
            case 'appointments': return CalendarDays;
            case 'medications': return Pill;
            case 'health': return Heart;
            case 'days': return Clock;
            default: return Activity;
        }
    };

    const getTimelineIcon = (tag) => {
        if (tag.includes('Lab')) return FlaskConical;
        if (tag.includes('Update')) return ClipboardList;
        if (tag.includes('Admission')) return CheckCircle2;
        return Stethoscope;
    };

    const firestoreDob = currentUser?.firestoreData?.dob;

    const parsedProfileInfo = [
        { label: 'EMAIL ID', value: currentUser?.email, icon: Mail },
        { label: 'DATE OF BIRTH', value: firestoreDob || profile.dob || '--', icon: CalendarDays },
        { label: 'CARE TEAM LEAD', value: profile.careTeamLead, icon: Stethoscope },
        { label: 'PRIMARY DIAGNOSIS', value: profile.primaryDiagnosis, icon: Activity },
    ];

    return (
        <div className="relative flex flex-col gap-7 flex-1 w-full z-0 font-inter min-h-full">
            <AmbientMeshBackground />

            {/* ═══════════ Ultra-Premium Dark Glass Banner ═══════════ */}
            <div className="relative z-10 rounded-[32px] p-8 lg:p-10 overflow-hidden flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
                style={{
                    background: '#000000',
                    backdropFilter: 'blur(40px)',
                    WebkitBackdropFilter: 'blur(40px)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 24px 48px -12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
                }}>
                {/* Banner inner mesh */}
                <div className="absolute -right-20 top-0 w-96 h-96 rounded-full opacity-30 pointer-events-none"
                    style={{ background: `radial-gradient(circle, ${P.info.main}, transparent 60%)`, filter: 'blur(60px)' }} />
                <div className="absolute left-1/4 -bottom-20 w-64 h-64 rounded-full opacity-20 pointer-events-none"
                    style={{ background: `radial-gradient(circle, ${P.success.main}, transparent 60%)`, filter: 'blur(50px)' }} />

                {/* Texture overlay */}
                <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay pointer-events-none"
                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-[16px] flex items-center justify-center relative group"
                            style={{
                                background: 'linear-gradient(135deg, rgba(0,218,170,0.15), rgba(16,153,129,0.05))',
                                border: '1px solid rgba(0,218,170,0.2)',
                                boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.1)',
                            }}>
                            <div className="absolute inset-0 rounded-[16px] bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
                            <Sparkles size={20} style={{ color: P.info.main }} />
                        </div>
                        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10"
                            style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(10px)' }}>
                            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: profile.status === 'STABLE' ? P.success.main : P.warning.main, boxShadow: `0 0 8px ${profile.status === 'STABLE' ? P.success.main : P.warning.main}` }} />
                            <span className="text-[10px] font-bold font-mono tracking-[0.15em] text-white/90">STATUS: {profile.status}</span>
                        </div>
                    </div>

                    <h1 className="text-white font-outfit font-bold text-4xl lg:text-5xl tracking-tight mb-2">
                        {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">{firstName}</span>
                    </h1>
                    <p className="text-white/50 text-sm font-inter tracking-wide">{dateStr} <span className="mx-2">•</span> Overview generated by Cortex AI</p>
                </div>

                <div className="relative z-10 bg-white/5 rounded-[24px] p-5 pr-8 border border-white/10 flex items-center gap-5 backdrop-blur-md">
                    <PremiumProgressRing value={profile.score} max={100} />
                    <div className="flex flex-col">
                        <p className="text-white font-outfit font-bold text-lg tracking-tight">Cortex AI Score</p>
                        <p className="text-white/50 text-[11px] font-inter mt-0.5">Comprehensive Health Index</p>
                        <div className="flex items-center gap-1.5 mt-2 text-info-main" style={{ color: P.info.main }}>
                            <TrendingUp size={12} />
                            <span className="text-[10px] font-mono font-bold tracking-wider">TOP 15% PCT</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══════════ New Assessment CTA Card ═══════════ */}
            <button
                onClick={() => setShowAssessment(true)}
                className="relative z-10 w-full rounded-[24px] p-6 flex items-center justify-between group cursor-pointer transition-all duration-500 hover:-translate-y-1 hover:shadow-lg"
                style={{
                    background: 'linear-gradient(135deg, rgba(0,218,170,0.08) 0%, rgba(16,153,129,0.04) 50%, rgba(139,92,246,0.06) 100%)',
                    border: '1px solid rgba(0,218,170,0.2)',
                    boxShadow: '0 4px 24px rgba(0,218,170,0.08)',
                    backdropFilter: 'blur(20px)',
                }}>
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-[18px] flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                        style={{
                            background: 'linear-gradient(135deg, #00DAAA, #109981)',
                            boxShadow: '0 8px 24px rgba(0,218,170,0.3)',
                        }}>
                        <Plus size={24} className="text-white" strokeWidth={2.5} />
                    </div>
                    <div className="text-left">
                        <h3 className="text-gray-900 font-outfit font-black text-lg tracking-tight">New Assessment</h3>
                        <p className="text-gray-500 text-xs font-medium mt-0.5">Start a clinical risk assessment with Cortex AI</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 border border-white/80 shadow-sm group-hover:bg-white group-hover:shadow-md transition-all duration-300">
                    <Zap size={13} style={{ color: P.info.main }} />
                    <span className="text-xs font-bold text-gray-600 font-outfit">Begin</span>
                    <ArrowRight size={14} className="text-gray-400 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
            </button>

            {/* Assessment Form Overlay */}
            {showAssessment && (
                <AssessmentForm
                    displayName={displayName}
                    onClose={() => setShowAssessment(false)}
                    onSubmit={(result) => {
                        if (result?.prediction) setLatestPrediction(result.prediction);
                    }}
                />
            )}

            {/* ═══════════ Latest Prediction Result Card ═══════════ */}
            {activePrediction && (() => {
                const pred = activePrediction;
                const riskColor = pred.risk_category === 'High' ? P.danger : pred.risk_category === 'Medium' ? P.warning : P.success;
                return (
                    <div className="relative z-10 rounded-[28px] p-6 overflow-hidden transition-all duration-500"
                        style={{
                            background: `linear-gradient(135deg, ${riskColor.main}08, ${riskColor.main}03)`,
                            border: `1.5px solid ${riskColor.main}20`,
                            boxShadow: `0 8px 32px ${riskColor.glow}`,
                            backdropFilter: 'blur(20px)',
                        }}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-[14px] flex items-center justify-center"
                                    style={{ background: `${riskColor.main}15`, border: `1px solid ${riskColor.main}25` }}>
                                    {pred.safety_override
                                        ? <ShieldAlert size={20} style={{ color: riskColor.main }} />
                                        : <Activity size={20} style={{ color: riskColor.main }} />}
                                </div>
                                <div>
                                    <h3 className="text-gray-900 font-outfit font-black text-base tracking-tight">Latest Assessment</h3>
                                    <p className="text-gray-400 text-[10px] font-mono font-medium mt-0.5">
                                        {pred.timestamp ? new Date(pred.timestamp).toLocaleString() : 'Recent'} • {pred.inference_ms ? pred.inference_ms.toFixed(1) : '--'}ms inference
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-full"
                                style={{ background: `${riskColor.main}12`, border: `1px solid ${riskColor.main}20` }}>
                                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: riskColor.main, boxShadow: `0 0 8px ${riskColor.main}` }} />
                                <span className="text-xs font-black font-outfit tracking-tight" style={{ color: riskColor.main }}>
                                    {pred.risk_category} Risk
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mb-3">
                            {[
                                { label: 'Risk Score', value: `${pred.risk_score}/3` },
                                { label: 'Confidence', value: `${((pred.confidence || 0) * 100).toFixed(1)}%` },
                                { label: 'Inference', value: pred.inference_ms ? `${pred.inference_ms.toFixed(1)}ms` : '--' },
                            ].map((s, i) => (
                                <div key={i} className="rounded-[14px] p-3 text-center"
                                    style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.8)' }}>
                                    <p className="text-sm font-outfit font-black text-gray-900">{s.value}</p>
                                    <p className="text-[9px] text-gray-400 font-bold mt-0.5">{s.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Probability Breakdown */}
                        <div className="flex flex-col gap-2" >
                            {
                                [
                                    { label: 'Low', value: pred.probabilities?.Low || 0, color: '#109981' },
                                    { label: 'Medium', value: pred.probabilities?.Medium || 0, color: '#F68E0B' },
                                    { label: 'High', value: pred.probabilities?.High || 0, color: '#EF4A4A' },
                                ].map((bar, i) => (
                                    <div key={i} className="flex items-center gap-2.5 rounded-[10px] px-3 py-1.5"
                                        style={{ background: 'rgba(255,255,255,0.5)' }}>
                                        <span className="text-[10px] font-bold font-mono w-12 text-gray-500">{bar.label}</span>
                                        <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                                            <div className="h-full rounded-full transition-all duration-700"
                                                style={{ width: `${(bar.value * 100).toFixed(1)}%`, background: bar.color, minWidth: bar.value > 0 ? '3px' : 0 }} />
                                        </div>
                                        <span className="text-[10px] font-black font-mono w-12 text-right" style={{ color: bar.color }}>
                                            {(bar.value * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                ))
                            }
                        </div>

                    </div>
                );
            })()}

            {/* ═══════════ Frosted Glass Summary Cards ═══════════ */}
            <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-4">
                {healthSummary.map((card, i) => {
                    const p = P[card.palette];
                    const Icon = getHealthIcon(card.type);
                    return (
                        <div key={i}
                            className="rounded-[24px] p-6 flex flex-col gap-4 relative overflow-hidden group cursor-default transition-all duration-500 hover:-translate-y-1.5"
                            style={{
                                background: 'rgba(255, 255, 255, 0.65)',
                                backdropFilter: 'blur(24px)',
                                WebkitBackdropFilter: 'blur(24px)',
                                border: '1px solid rgba(255, 255, 255, 0.8)',
                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04), inset 0 0 0 1px rgba(255, 255, 255, 0.5)',
                                animation: `slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both`,
                                animationDelay: `${i * 100}ms`,
                            }}>
                            {/* Card Hover Glow */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full opacity-0 group-hover:opacity-20 transition-all duration-700 blur-[20px]"
                                style={{ background: p.main }} />

                            <div className="flex items-center justify-between z-10">
                                <div className="w-12 h-12 rounded-[16px] flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 bg-white"
                                    style={{
                                        boxShadow: `0 8px 16px ${p.glow}, inset 0 0 0 1px ${p.light}`,
                                    }}>
                                    <Icon size={22} style={{ color: p.main }} />
                                </div>
                                {/* Mini inline trend */}
                                <div className="px-2 py-1 rounded-full border bg-white/50 backdrop-blur-sm" style={{ borderColor: p.main + '20' }}>
                                    <span className="text-[9px] font-black font-mono tracking-widest uppercase" style={{ color: p.dark }}>{card.trend}</span>
                                </div>
                            </div>

                            <div className="z-10 mt-2">
                                <p className="text-[2rem] font-outfit font-black tracking-tight leading-none mb-1 text-gray-900 drop-shadow-sm">{card.value}</p>
                                <p className="text-xs font-bold text-gray-500 tracking-wide">{card.label}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ═══════════ Bottom Row: Timeline + Profile ═══════════ */}
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[500px]">

                {/* ─── Ultra-Premium Care Timeline ─── */}
                <div className="lg:col-span-2 rounded-[32px] p-7 lg:p-8 flex flex-col relative overflow-hidden flex-1"
                    style={{
                        background: 'rgba(255, 255, 255, 0.75)',
                        backdropFilter: 'blur(30px)',
                        WebkitBackdropFilter: 'blur(30px)',
                        border: '1px solid rgba(255,255,255,0.9)',
                        boxShadow: '0 12px 48px rgba(0,0,0,0.03), inset 0 0 0 1px rgba(255,255,255,0.5)',
                    }}>

                    <div className="flex items-center justify-between mb-8 z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-[16px] flex items-center justify-center bg-white"
                                style={{ boxShadow: `0 8px 16px ${P.info.glow}, inset 0 0 0 1px ${P.info.light}` }}>
                                <Bell size={20} style={{ color: P.info.main }} />
                            </div>
                            <div>
                                <h3 className="text-gray-900 font-outfit font-black text-xl tracking-tight">Care Timeline</h3>
                                <p className="text-gray-500 text-xs font-medium tracking-wide">Real-time clinical updates</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-0 flex-1 overflow-y-auto pr-2 relative z-10">
                        {timeline.map((item, i) => {
                            const p = P[item.palette];
                            const Icon = getTimelineIcon(item.tag);
                            const isLast = i === timeline.length - 1;
                            return (
                                <div key={i} className="flex items-stretch gap-5 group cursor-pointer">
                                    {/* Timeline Node & Line */}
                                    <div className="flex flex-col items-center">
                                        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white border-[3px] transition-all duration-300 group-hover:scale-110 z-10 relative"
                                            style={{ borderColor: p.light, boxShadow: `0 4px 12px ${p.glow}` }}>
                                            <Icon size={18} style={{ color: p.main }} />
                                        </div>
                                        {!isLast && (
                                            <div className="w-0.5 flex-1 my-1 rounded-full opacity-30"
                                                style={{ background: `linear-gradient(to bottom, ${p.main}, transparent)` }} />
                                        )}
                                    </div>

                                    {/* Content Card */}
                                    <div className="flex-1 pb-8 group-hover:-translate-y-1 transition-transform duration-300">
                                        <div className="bg-white/60 backdrop-blur-md border border-white p-5 rounded-[24px] shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:bg-white/90">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] font-black font-mono uppercase tracking-[0.2em]" style={{ color: p.main }}>{item.tag}</span>
                                                <span className="text-[10px] text-gray-400 font-mono font-medium">{item.time}</span>
                                            </div>
                                            <h4 className="text-[15px] font-bold text-gray-900 font-outfit mb-1.5">{item.title}</h4>
                                            <p className="text-xs text-gray-500 leading-relaxed font-medium">{item.detail}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ─── Premium Glass Profile & Actions ─── */}
                <div className="flex flex-col gap-6 flex-1">

                    {/* Glass Profile Card */}
                    <div className="rounded-[32px] p-7 relative overflow-hidden group flex-1"
                        style={{
                            background: 'rgba(255, 255, 255, 0.7)',
                            backdropFilter: 'blur(32px)',
                            WebkitBackdropFilter: 'blur(32px)',
                            border: '1px solid rgba(255,255,255,0.9)',
                            boxShadow: '0 12px 48px rgba(0,0,0,0.03)',
                        }}>
                        <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />

                        <div className="flex items-center gap-4 mb-6 relative z-10">
                            <div className="relative">
                                <div className="w-14 h-14 rounded-full flex items-center justify-center bg-white border border-gray-100 shadow-sm relative z-10 overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-info-light/50 to-transparent" />
                                    <User size={26} style={{ color: P.info.main }} />
                                </div>
                                <div className="absolute inset-0 rounded-full blur-[10px] scale-110 z-0 opacity-50 transition-opacity group-hover:opacity-100" style={{ background: P.info.main }} />
                            </div>
                            <div>
                                <h3 className="text-gray-900 font-outfit font-black text-xl tracking-tight">{displayName || 'User'}</h3>
                                <p className="text-gray-400 text-xs font-bold tracking-wide uppercase mt-0.5">Verified User</p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 relative z-10">
                            {parsedProfileInfo.map((item, i) => {
                                const InfoIcon = item.icon;
                                return (
                                    <div key={i} className="flex items-center gap-4 p-3 rounded-[16px] bg-white/40 hover:bg-white/80 transition-colors border border-white/50">
                                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                                            <InfoIcon size={14} className="text-gray-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">{item.label}</p>
                                            <p className="text-xs font-bold text-gray-800 truncate">{item.value}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Action Cards */}
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => navigate('/dashboard?tab=chat')}
                            className="flex flex-col items-center justify-center gap-3 p-6 rounded-[28px] group transition-all duration-300 hover:-translate-y-1"
                            style={{
                                background: 'rgba(255,255,255,0.8)',
                                border: '1px solid rgba(255,255,255,0.9)',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.03)',
                                backdropFilter: 'blur(20px)'
                            }}>
                            <div className="w-12 h-12 rounded-full bg-info-light flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                                style={{ background: P.info.light, color: P.info.main, boxShadow: `0 4px 16px ${P.info.glow}` }}>
                                <MessageSquare size={20} />
                            </div>
                            <span className="text-xs font-bold text-gray-700 font-outfit">Messages</span>
                        </button>

                        <button
                            onClick={() => navigate('/dashboard?tab=documents')}
                            className="flex flex-col items-center justify-center gap-3 p-6 rounded-[28px] group transition-all duration-300 hover:-translate-y-1"
                            style={{
                                background: 'rgba(255,255,255,0.8)',
                                border: '1px solid rgba(255,255,255,0.9)',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.03)',
                                backdropFilter: 'blur(20px)'
                            }}>
                            <div className="w-12 h-12 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                                style={{ background: P.purple.light, color: P.purple.main, boxShadow: `0 4px 16px ${P.purple.glow}` }}>
                                <FileText size={20} />
                            </div>
                            <span className="text-xs font-bold text-gray-700 font-outfit">Records</span>
                        </button>
                    </div>

                </div>
            </div>

            {/* ═══════════ AI Health Companion Section ═══════════ */}
            <div className="relative z-10 w-full mt-2 h-[600px] mb-8">
                <HealthChatTab />
            </div>

        </div>
    );
}
