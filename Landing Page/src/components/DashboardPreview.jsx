import React from 'react';
import ScrollReveal from './ScrollReveal';
import {
    Activity, Heart, CalendarDays, Pill, Clock, Plus, Zap,
    ArrowRight, Bell, FlaskConical, User, FileText, TrendingUp, Sparkles
} from 'lucide-react';

/* ── Design Palette ── */
const P = {
    mint: '#00DAAA',
    mintDark: '#109981',
    danger: '#EF4A4A',
    warning: '#F68E0B',
    success: '#109981',
    purple: '#8B5CF6',
};

/* ── Cortex AI Score Ring ── */
const ScoreRing = ({ value = 92, size = 64 }) => {
    const r = (size - 6) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ * (1 - value / 100);
    return (
        <div className="relative flex items-center justify-center">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
                <defs>
                    <linearGradient id="previewRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#00DAAA" />
                        <stop offset="100%" stopColor="#109981" />
                    </linearGradient>
                </defs>
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#previewRingGrad)" strokeWidth="4"
                    strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
            </svg>
            <span className="absolute text-white font-outfit font-extrabold text-lg" style={{ textShadow: '0 1px 8px rgba(0,218,170,0.4)' }}>{value}</span>
        </div>
    );
};

/* ── Metric Card ── */
const MetricCard = ({ icon: Icon, badge, badgeColor, value, label, accentColor }) => (
    <div className="rounded-[18px] p-4 flex flex-col gap-3 relative overflow-hidden"
        style={{
            background: 'rgba(255,255,255,0.65)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.8)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
        }}>
        <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-[12px] flex items-center justify-center bg-white"
                style={{ boxShadow: `0 4px 12px ${accentColor}25` }}>
                <Icon size={17} style={{ color: accentColor }} />
            </div>
            <span className="text-[7px] font-black font-mono tracking-[0.12em] uppercase px-1.5 py-0.5 rounded-full border bg-white/50"
                style={{ color: badgeColor || accentColor, borderColor: `${badgeColor || accentColor}30` }}>
                {badge}
            </span>
        </div>
        <div>
            <p className="text-xl font-outfit font-black text-gray-900 leading-none mb-0.5">{value}</p>
            <p className="text-[10px] font-semibold text-gray-500 tracking-wide">{label}</p>
        </div>
    </div>
);

const DashboardPreview = () => {
    return (
        <section className="py-[100px] relative overflow-visible">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                <ScrollReveal className="text-center mb-14" animation="fade-up">
                    <h2 className="font-outfit font-semibold text-4xl text-white mb-4">
                        See Cortex in Action
                    </h2>
                    <p className="font-inter text-white/60">Real-time risk tracking with an intuitive, minimalist interface.</p>
                </ScrollReveal>

                <ScrollReveal animation="fade-up" delay="200ms">
                    <div className="relative mx-auto w-full max-w-[900px] rounded-[24px] overflow-hidden"
                        style={{
                            animation: 'dashboardFloat 6s ease-in-out infinite',
                            boxShadow: '0 30px 80px rgba(0,0,0,0.4), 0 0 60px rgba(0,212,170,0.12)',
                            border: '1px solid rgba(255,255,255,0.1)',
                        }}>

                        {/* ═══ macOS Browser Chrome ═══ */}
                        <div className="px-4 py-3 flex items-center gap-3"
                            style={{ background: '#1e1e1e', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <div className="flex gap-[7px]">
                                <div className="w-[11px] h-[11px] rounded-full" style={{ background: '#ff5f57' }} />
                                <div className="w-[11px] h-[11px] rounded-full" style={{ background: '#ffbd2e' }} />
                                <div className="w-[11px] h-[11px] rounded-full" style={{ background: '#28ca42' }} />
                            </div>
                            <div className="flex-1 flex justify-center">
                                <div className="flex items-center gap-2 px-4 py-1 rounded-md"
                                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.04)' }}>
                                    <Activity className="w-3 h-3" style={{ color: P.mint }} />
                                    <span className="font-inter text-[11px] text-white/50">cortex.health/dashboard</span>
                                </div>
                            </div>
                            <div className="w-[60px]" /> {/* spacer to center address bar */}
                        </div>

                        {/* ═══ Dashboard Content ═══ */}
                        <div className="p-5 md:p-7 flex flex-col gap-5 relative z-0"
                            style={{
                                background: 'linear-gradient(180deg, #f0f2f5 0%, #e8ebe9 60%, #dfe5e1 100%)',
                            }}>

                            {/* ── Ambient Mesh Blobs ── */}
                            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50 z-0">
                                <div className="absolute -top-[15%] -left-[5%] w-[50%] h-[50%] rounded-full mix-blend-multiply"
                                    style={{ background: 'rgba(204,255,240,0.6)', filter: 'blur(80px)' }} />
                                <div className="absolute top-[10%] -right-[10%] w-[40%] h-[40%] rounded-full mix-blend-multiply"
                                    style={{ background: 'rgba(237,233,254,0.6)', filter: 'blur(80px)' }} />
                            </div>

                            {/* ═══ 1. Dark Banner: Greeting + AI Score ═══ */}
                            <div className="relative rounded-[20px] p-5 md:p-6 overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 z-10"
                                style={{
                                    background: '#000000',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    boxShadow: '0 12px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)',
                                }}>
                                {/* Glow */}
                                <div className="absolute -right-16 top-0 w-64 h-64 rounded-full opacity-25 pointer-events-none"
                                    style={{ background: `radial-gradient(circle, ${P.mint}, transparent 60%)`, filter: 'blur(50px)' }} />

                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-8 h-8 rounded-[10px] flex items-center justify-center"
                                            style={{ background: 'rgba(0,218,170,0.15)', border: '1px solid rgba(0,218,170,0.2)' }}>
                                            <Sparkles size={15} style={{ color: P.mint }} />
                                        </div>
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/10"
                                            style={{ background: 'rgba(255,255,255,0.03)' }}>
                                            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: P.success, boxShadow: `0 0 6px ${P.success}` }} />
                                            <span className="text-[8px] font-bold font-mono tracking-[0.15em] text-white/80">STATUS: STABLE</span>
                                        </div>
                                    </div>
                                    <h3 className="text-white font-outfit font-bold text-2xl md:text-3xl tracking-tight mb-1">
                                        Good morning, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">Patient</span>
                                    </h3>
                                    <p className="text-white/40 text-[10px] font-inter">Tuesday, February 25, 2026 • Overview generated by Cortex AI</p>
                                </div>

                                <div className="relative z-10 bg-white/5 rounded-[16px] p-3.5 border border-white/10 flex items-center gap-3.5 backdrop-blur-md shrink-0">
                                    <ScoreRing value={92} size={56} />
                                    <div className="flex flex-col">
                                        <p className="text-white font-outfit font-bold text-sm tracking-tight">Cortex AI Score</p>
                                        <p className="text-white/40 text-[9px] font-inter mt-0.5">Comprehensive Health Index</p>
                                        <div className="flex items-center gap-1 mt-1.5" style={{ color: P.mint }}>
                                            <TrendingUp size={10} />
                                            <span className="text-[8px] font-mono font-bold tracking-wider">TOP 15% PCT</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ═══ 2. New Assessment CTA ═══ */}
                            <div className="relative z-10 w-full rounded-[16px] p-4 flex items-center justify-between"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(0,218,170,0.06) 0%, rgba(139,92,246,0.04) 100%)',
                                    border: '1px solid rgba(0,218,170,0.18)',
                                    backdropFilter: 'blur(16px)',
                                }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-[12px] flex items-center justify-center"
                                        style={{ background: 'linear-gradient(135deg, #00DAAA, #109981)', boxShadow: '0 4px 16px rgba(0,218,170,0.3)' }}>
                                        <Plus size={18} className="text-white" strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <h4 className="text-gray-900 font-outfit font-black text-sm tracking-tight">New Assessment</h4>
                                        <p className="text-gray-500 text-[9px] font-medium">Start a clinical risk assessment with Cortex AI</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/60 border border-white/80 shadow-sm">
                                    <Zap size={10} style={{ color: P.mint }} />
                                    <span className="text-[10px] font-bold text-gray-600 font-outfit">Begin</span>
                                    <ArrowRight size={11} className="text-gray-400" />
                                </div>
                            </div>

                            {/* ═══ 3. Four Metric Cards ═══ */}
                            <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-3">
                                <MetricCard icon={CalendarDays} badge="+1 THIS WEEK" value="1" label="Upcoming Appointments" accentColor={P.mint} />
                                <MetricCard icon={Pill} badge="NO CHANGES" value="3" label="Active Medications" accentColor={P.warning} />
                                <MetricCard icon={Heart} badge="↑ FROM FAIR" value="Good" label="Health Score" accentColor={P.success} />
                                <MetricCard icon={Clock} badge="DAY 1 OF 7" value="1" label="Days in Care" accentColor={P.purple} />
                            </div>

                            {/* ═══ 4. Bottom Row: Care Timeline + Profile ═══ */}
                            <div className="relative z-10 grid grid-cols-1 md:grid-cols-5 gap-4">

                                {/* ── Care Timeline ── */}
                                <div className="md:col-span-3 rounded-[20px] p-5 relative overflow-hidden"
                                    style={{
                                        background: 'rgba(255,255,255,0.7)',
                                        backdropFilter: 'blur(24px)',
                                        border: '1px solid rgba(255,255,255,0.9)',
                                        boxShadow: '0 8px 32px rgba(0,0,0,0.03)',
                                    }}>
                                    <div className="flex items-center gap-2.5 mb-5">
                                        <div className="w-9 h-9 rounded-[12px] flex items-center justify-center bg-white"
                                            style={{ boxShadow: `0 4px 12px ${P.mint}20` }}>
                                            <Bell size={16} style={{ color: P.mint }} />
                                        </div>
                                        <div>
                                            <h4 className="text-gray-900 font-outfit font-black text-base tracking-tight">Care Timeline</h4>
                                            <p className="text-gray-500 text-[9px] font-medium tracking-wide">Real-time clinical updates</p>
                                        </div>
                                    </div>

                                    {/* Timeline Item */}
                                    <div className="flex items-stretch gap-3.5">
                                        <div className="flex flex-col items-center">
                                            <div className="w-9 h-9 rounded-full flex items-center justify-center bg-white border-[2px] z-10"
                                                style={{ borderColor: '#FEE2E2', boxShadow: `0 3px 10px rgba(239,74,74,0.15)` }}>
                                                <FlaskConical size={14} style={{ color: P.danger }} />
                                            </div>
                                        </div>
                                        <div className="flex-1 pb-2">
                                            <div className="bg-white/60 backdrop-blur-md border border-white p-4 rounded-[16px] shadow-sm">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className="text-[8px] font-black font-mono uppercase tracking-[0.18em]" style={{ color: P.danger }}>Lab Results</span>
                                                    <span className="text-[8px] text-gray-400 font-mono font-medium">Today, 08:11 AM</span>
                                                </div>
                                                <h5 className="text-[12px] font-bold text-gray-900 font-outfit mb-1">Blood test results are ready</h5>
                                                <p className="text-[10px] text-gray-500 leading-relaxed font-medium">
                                                    Your Complete Blood Count results have been reviewed by Dr. Chen and are available to view.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* ── Doctor Profile Card ── */}
                                <div className="md:col-span-2 rounded-[20px] p-5 relative overflow-hidden"
                                    style={{
                                        background: 'rgba(255,255,255,0.7)',
                                        backdropFilter: 'blur(24px)',
                                        border: '1px solid rgba(255,255,255,0.9)',
                                        boxShadow: '0 8px 32px rgba(0,0,0,0.03)',
                                    }}>
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="relative">
                                            <div className="w-11 h-11 rounded-full flex items-center justify-center bg-white border border-gray-100 shadow-sm overflow-hidden">
                                                <User size={20} style={{ color: P.mint }} />
                                            </div>
                                            <div className="absolute inset-0 rounded-full blur-[8px] scale-110 opacity-40 -z-10" style={{ background: P.mint }} />
                                        </div>
                                        <div>
                                            <h4 className="text-gray-900 font-outfit font-black text-sm tracking-tight">Patient</h4>
                                            <p className="text-gray-400 text-[8px] font-bold tracking-wide uppercase mt-0.5">Verified User</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2.5">
                                        {[
                                            { label: 'MRN', value: 'CTX-4115-90', icon: FileText },
                                            { label: 'Date of Birth', value: 'Jun 15, 1961', icon: CalendarDays },
                                        ].map((item) => {
                                            const InfoIcon = item.icon;
                                            return (
                                                <div key={item.label} className="flex items-center gap-3 p-2.5 rounded-[12px] bg-white/40 border border-white/50">
                                                    <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-sm">
                                                        <InfoIcon size={12} className="text-gray-400" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-0.5">{item.label}</p>
                                                        <p className="text-[11px] font-bold text-gray-800 truncate">{item.value}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </ScrollReveal>
            </div>

            {/* ═══ Float Animation Keyframes ═══ */}
            <style>{`
                @keyframes dashboardFloat {
                    0%, 100% { transform: translateY(0px) perspective(1200px) rotateY(-3deg) rotateX(1.5deg); }
                    50% { transform: translateY(-14px) perspective(1200px) rotateY(-3deg) rotateX(1.5deg); }
                }
            `}</style>
        </section>
    );
};

export default DashboardPreview;
