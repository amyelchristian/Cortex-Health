import React from 'react';
import { Bell, LayoutDashboard, FileText, BarChart3, Database, Activity, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import logoImg from '../assets/transparent-logo.png';

/* ── Palette matching the real Analytics tab ── */
const C = {
    danger: '#EF4A4A',
    warning: '#F68E0B',
    success: '#109981',
    info: '#00DAAA',
};

/* ── Feature Importance bar data (from CORTEX v3.0 production model) ── */
const FEATURES = [
    { label: 'Emergency Score', val: 0.33, w: '100%', from: '#EF4A4A', to: '#F68E0B' },
    { label: 'Critical RR Flag', val: 0.20, w: '61%', from: '#EF4A4A', to: '#D4650A' },
    { label: 'Critical Score', val: 0.14, w: '43%', from: '#F68E0B', to: '#E8A830' },
    { label: 'Abnormal Vitals', val: 0.13, w: '40%', from: '#D4940A', to: '#109981' },
    { label: 'HR Abnormal', val: 0.05, w: '16%', from: '#109981', to: '#0FBF9A' },
    { label: 'SBP Deviation', val: 0.05, w: '15%', from: '#109981', to: '#00DAAA' },
    { label: 'Critical BP Flag', val: 0.02, w: '6%', from: '#109981', to: '#00DAAA' },
    { label: 'DBP', val: 0.02, w: '5%', from: '#109981', to: '#00DAAA' },
];

const Hero = ({ onOpenAuth }) => {
    return (
        <section className="hero">
            <div className="container mx-auto">
                <div className="hero-content">

                    {/* LEFT COLUMN: Text Content */}
                    <div className="hero-left">
                        <h1 className="hero-headline">
                            Predict Patient Deterioration <br />
                            <span className="hero-subheadline">Before It's Too Late</span>
                        </h1>
                        <p className="hero-subheadline-text">with AI-Powered Risk Detection</p>
                        <p className="hero-description">
                            Cortex uses an XGBoost model trained on 1.41 million real patient records
                            to predict health deterioration before clinical symptoms appear.
                            With 99.98% accuracy and 100% high-risk recall, Cortex catches every
                            critical case - enabling proactive, life-saving intervention.
                        </p>
                        <button
                            className="hero-cta"
                            onClick={() => window.location.href = '/signup/index.html'}
                        >
                            Start for Free
                        </button>
                    </div>

                    {/* RIGHT COLUMN: Analytics Tab Dashboard Preview */}
                    <div className="hero-right">
                        <div className="dashboard-mockup">
                            <div className="dashboard-container">

                                {/* ═══════════ DASHBOARD NAVBAR ═══════════ */}
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-2 pl-2">
                                        <img src={logoImg} alt="Cortex Logo" className="w-[28px] h-[28px] object-contain" />
                                        <span className="font-outfit font-bold text-xl text-white">Cortex</span>
                                    </div>
                                    <div className="hidden md:flex items-center rounded-[24px] p-1.5 border border-white/10" style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}>
                                        {[
                                            { icon: LayoutDashboard, label: 'Home', active: false },
                                            { icon: FileText, label: 'Documents', active: false },
                                            { icon: BarChart3, label: 'Analytics', active: true },
                                            { icon: Database, label: 'Database', active: false },
                                        ].map((t) => (
                                            <div key={t.label}
                                                className={`flex items-center gap-2 px-5 py-2.5 rounded-[20px] cursor-pointer text-[13px] font-medium transition-colors ${t.active ? 'text-white border border-white/20' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                                                style={t.active ? { background: 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' } : {}}
                                            >
                                                <t.icon className="w-[15px] h-[15px]" /> {t.label}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-4 pr-2">
                                        <button className="text-white/60 hover:text-white transition-colors"><Bell className="w-[18px] h-[18px]" /></button>
                                        <div className="w-[34px] h-[34px] rounded-full overflow-hidden border border-white/20" style={{ boxShadow: '0 0 15px rgba(255,255,255,0.1)' }}>
                                            <img src="https://i.pravatar.cc/150?img=47" alt="Profile" className="w-full h-full object-cover" />
                                        </div>
                                    </div>
                                </div>

                                {/* ═══════════ TOP ROW: Feature Importance + AI Insights ═══════════ */}
                                <div className="grid grid-cols-5 gap-5 mb-5">

                                    {/* ── Feature Importance (3/5 width) ── */}
                                    <div className="col-span-3 rounded-[24px] p-6 text-white flex flex-col relative overflow-hidden flex-1"
                                        style={{ border: '1px solid rgba(255, 255, 255, 0.15)', background: 'linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 100%)', backdropFilter: 'blur(30px)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)' }}>

                                        {/* Header */}
                                        <div className="flex items-center justify-between mb-5 z-10">
                                            <h3 className="font-outfit font-semibold text-[15px] text-white">Feature Importance</h3>
                                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono" style={{ color: C.info, background: `${C.info}15`, border: `1px solid ${C.info}30` }}>
                                                <span className="w-[5px] h-[5px] rounded-full animate-pulse" style={{ background: C.info }}></span>
                                                SHAP · XGBoost v3.0
                                            </div>
                                        </div>

                                        {/* Bar Chart */}
                                        <div className="flex flex-col gap-2.5 flex-1 justify-center z-10">
                                            {FEATURES.map((f) => (
                                                <div key={f.label} className="flex items-center gap-3">
                                                    <span className="text-[10px] text-white/60 font-mono w-[85px] text-right flex-shrink-0">{f.label}</span>
                                                    <div className="flex-1 h-[10px] rounded-full relative overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                                                        <div className="absolute top-0 left-0 bottom-0 rounded-full" style={{ width: f.w, background: `linear-gradient(90deg, ${f.from}, ${f.to})` }}></div>
                                                    </div>
                                                    <span className="text-[10px] font-mono text-white/50 w-8 text-right">{f.val.toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* ── AI Analytics Insights (2/5 width) ── */}
                                    <div className="col-span-2 rounded-[24px] p-6 text-white flex flex-col relative overflow-hidden"
                                        style={{ border: '1px solid rgba(255, 255, 255, 0.15)', background: 'linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 100%)', backdropFilter: 'blur(30px)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)' }}>

                                        {/* Header */}
                                        <div className="flex items-center justify-between mb-4 z-10">
                                            <h3 className="font-outfit font-semibold text-[15px] text-white">AI Analytics Insights</h3>
                                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-mono" style={{ color: C.info, background: `${C.info}15`, border: `1px solid ${C.info}30` }}>
                                                <span className="w-1 h-1 rounded-full animate-pulse" style={{ background: C.info }}></span>
                                                Last 24 Hours
                                            </div>
                                        </div>

                                        {/* Risk Cards Row */}
                                        <div className="grid grid-cols-2 gap-3 z-10 mb-4">
                                            {/* Deterioration Risk */}
                                            <div className="rounded-[16px] p-3 border border-white/10" style={{ background: 'rgba(255,255,255,0.04)' }}>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <AlertTriangle size={13} style={{ color: C.danger }} />
                                                    <span className="text-[10px] text-white/80 font-medium leading-tight text-wrap">Deterioration<br />Risk</span>
                                                </div>
                                                <div className="flex items-end justify-between">
                                                    <span className="text-2xl font-mono font-bold" style={{ color: C.danger }}>24%</span>
                                                    <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-semibold" style={{ color: C.danger }}>
                                                        <TrendingUp size={10} /> +8%
                                                    </div>
                                                </div>
                                                <div className="w-full h-[3px] rounded-full mt-2.5 overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                                                    <div className="h-full rounded-full" style={{ width: '24%', background: C.danger }}></div>
                                                </div>
                                            </div>

                                            {/* Sepsis Risk */}
                                            <div className="rounded-[16px] p-3 border border-white/10" style={{ background: 'rgba(255,255,255,0.04)' }}>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Activity size={13} style={{ color: C.warning }} />
                                                    <span className="text-[10px] text-white/80 font-medium leading-tight text-wrap">Sepsis Risk<br />Score</span>
                                                </div>
                                                <div className="flex items-end justify-between">
                                                    <span className="text-2xl font-mono font-bold" style={{ color: C.warning }}>12%</span>
                                                    <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-semibold" style={{ color: C.success }}>
                                                        <TrendingDown size={10} /> -3%
                                                    </div>
                                                </div>
                                                <div className="w-full h-[3px] rounded-full mt-2.5 overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                                                    <div className="h-full rounded-full" style={{ width: '12%', background: C.warning }}></div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Gauge + Stats */}
                                        <div className="flex-1 flex items-center justify-between z-10 w-full pl-2">
                                            {/* SVG Arc Gauge */}
                                            <div className="flex-1 flex items-center justify-center">
                                                <svg width="140" height="110" viewBox="0 0 170 150" fill="none">
                                                    <defs>
                                                        <linearGradient id="heroGaugeGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
                                                            <stop offset="0%" stopColor={C.info} />
                                                            <stop offset="45%" stopColor={C.warning} />
                                                            <stop offset="100%" stopColor={C.danger} />
                                                        </linearGradient>
                                                        <filter id="heroGaugeGlow"><feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={C.danger} floodOpacity="0.4" /></filter>
                                                    </defs>
                                                    {/* Track (Single Gradient Arc) */}
                                                    <path d="M 22 108 A 63 63 0 1 1 148 108" stroke="url(#heroGaugeGrad2)" strokeWidth="8" strokeLinecap="round" fill="none" filter="url(#heroGaugeGlow)" />
                                                    {/* Needle */}
                                                    <line x1="85" y1="91" x2="122" y2="48" stroke={C.danger} strokeWidth="2.5" strokeLinecap="round" filter="url(#heroGaugeGlow)" />

                                                    {/* Score */}
                                                    <text x="85" y="128" textAnchor="middle" fill={C.danger} fontFamily="'JetBrains Mono', monospace" fontSize="28" fontWeight="700">72</text>
                                                    <text x="85" y="142" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontFamily="Inter, sans-serif" fontSize="7" fontWeight="600" letterSpacing="1.5">RISK SCORE</text>
                                                </svg>
                                            </div>

                                            {/* Stat Pills */}
                                            <div className="flex flex-col gap-2 flex-shrink-0">
                                                {[
                                                    { label: 'CONFIDENCE', value: '94%', color: C.info },
                                                    { label: 'TREND', value: '↑ Rising', color: C.danger },
                                                    { label: 'QSOFA', value: '2 / 3', color: C.warning },
                                                ].map((s) => (
                                                    <div key={s.label} className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}>
                                                        <div className="flex flex-col">
                                                            <span className="text-[7.5px] text-white/50 font-semibold uppercase tracking-widest">{s.label}</span>
                                                            <span className="text-[11px] font-mono font-bold" style={{ color: s.color }}>{s.value}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* ═══════════ BOTTOM ROW: Mini Vitals + Next Steps ═══════════ */}
                                <div className="grid grid-cols-5 gap-5">

                                    {/* ── Vitals Mini Cards (3/5) ── */}
                                    <div className="col-span-3 grid grid-cols-2 gap-4">
                                        {[
                                            { label: 'Heart Rate', value: '78', unit: 'bpm', status: 'Normal' },
                                            { label: 'SpO₂ Level', value: '98', unit: '%', status: 'Normal' },
                                            { label: 'Systolic BP', value: '118', unit: 'mmHg', status: 'Normal' },
                                            { label: 'Resp. Rate', value: '16', unit: '/min', status: 'Normal' },
                                        ].map((v) => (
                                            <div key={v.label} className="rounded-[20px] p-5 relative flex flex-col justify-between"
                                                style={{ border: '1px solid rgba(255, 255, 255, 0.15)', background: 'linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 100%)', backdropFilter: 'blur(30px)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)' }}>
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="text-[11px] text-white/70 font-medium">{v.label}</span>
                                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[8.5px] font-semibold" style={{ background: `${C.info}15`, color: C.info }}>
                                                        <span className="w-[5px] h-[5px] rounded-full" style={{ background: C.info }}></span>
                                                        {v.status}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col">
                                                    <div className="flex items-baseline gap-1.5 mb-3">
                                                        <span className="text-3xl font-outfit font-bold text-white leading-none">{v.value}</span>
                                                        <span className="text-[10px] text-white/50 font-medium">{v.unit}</span>
                                                    </div>
                                                    {/* Mini progress bar */}
                                                    <div className="w-[80%] h-[3px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                                                        <div className="h-full rounded-full" style={{ width: '60%', background: C.info }}></div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* ── Suggested Next Steps (2/5) ── */}
                                    <div className="col-span-2 rounded-[24px] p-5 flex flex-col justify-between"
                                        style={{ border: '1px solid rgba(255, 255, 255, 0.15)', background: 'linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 100%)', backdropFilter: 'blur(30px)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)' }}>
                                        <h4 className="font-outfit font-semibold text-[15px] text-white mb-4">Suggested Next Steps</h4>
                                        <div className="flex flex-col gap-3 flex-1 justify-center">
                                            {[
                                                { action: 'Routine Check', time: 'Now', desc: 'Continue standard monitoring' },
                                                { action: 'Vitals Re-check', time: 'Next Shift', desc: 'Re-assess HR, SpO₂, MAP' },
                                                { action: 'Medication Review', time: 'Morning', desc: 'Review current dosage' },
                                            ].map((s) => (
                                                <div key={s.action} className="rounded-xl p-3 flex items-start gap-3 relative overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
                                                    {s.time === 'Now' && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-[#00DAAA] to-[#00DAAA]50"></div>}
                                                    <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0" style={{ background: `${C.info}15` }}>
                                                        <Activity size={12} style={{ color: C.info }} />
                                                    </div>
                                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <span className="text-[11px] text-white/90 font-semibold">{s.action}</span>
                                                            <span className="text-[8px] font-mono px-2 py-0.5 rounded-full" style={{ background: s.time === 'Now' ? `${C.info}20` : 'rgba(255,255,255,0.08)', color: s.time === 'Now' ? C.info : 'rgba(255,255,255,0.4)' }}>{s.time}</span>
                                                        </div>
                                                        <p className="text-[9px] text-white/50 leading-tight">{s.desc}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default Hero;
