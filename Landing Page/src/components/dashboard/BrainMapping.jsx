import React, { useState } from 'react';

/* ───────────────────────────────────────────────────────────
   Feature Importance Panel — Premium UI/UX
   Three views: Factors (SHAP), Trends, Correlations
   ─────────────────────────────────────────────────────────── */

const maxVal = 0.50;

/* ── SVG Icons ── */
const FactorsIcon = ({ active }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="14" width="4" height="7" rx="1.5" fill={active ? '#00D4AA' : '#333'} opacity={active ? 0.7 : 0.5} />
        <rect x="10" y="8" width="4" height="13" rx="1.5" fill={active ? '#F68E0B' : '#333'} opacity={active ? 0.85 : 0.5} />
        <rect x="17" y="3" width="4" height="18" rx="1.5" fill={active ? '#EF4A4A' : '#333'} opacity={active ? 1 : 0.5} />
    </svg>
);

const TrendsIcon = ({ active }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M3 17L9 11L13 15L21 7" stroke={active ? '#F68E0B' : '#444'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 7H21V12" stroke={active ? '#F68E0B' : '#444'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 17L9 11L13 15L21 7" stroke={active ? '#F68E0B' : 'transparent'} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity="0.15" />
    </svg>
);

const CorrelationsIcon = ({ active }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="7" cy="7" r="3" fill={active ? '#00D4AA' : '#333'} opacity={active ? 0.9 : 0.5} />
        <circle cx="17" cy="17" r="3" fill={active ? '#EF4A4A' : '#333'} opacity={active ? 0.9 : 0.5} />
        <circle cx="17" cy="9" r="2" fill={active ? '#F68E0B' : '#333'} opacity={active ? 0.7 : 0.4} />
        <circle cx="9" cy="16" r="2" fill={active ? '#109981' : '#333'} opacity={active ? 0.7 : 0.4} />
        <line x1="9" y1="9" x2="15" y2="15" stroke={active ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)'} strokeWidth="1" strokeDasharray="2 2" />
    </svg>
);

/* ── Mini sparkline ── */
const Sparkline = ({ seed, color }) => {
    const pts = Array.from({ length: 14 }, (_, i) => {
        const y = 14 + Math.sin(i * 0.6 + seed) * 8 + Math.cos(i * 1.1 + seed * 2) * 4;
        return `${(i / 13) * 56},${y}`;
    }).join(' ');
    return (
        <svg viewBox="0 0 56 28" className="w-9 h-4" preserveAspectRatio="none" fill="none">
            <polyline points={pts} stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />
        </svg>
    );
};

/* ═══════════════════════════════════════════════
   VIEW 1:  FACTORS  (SHAP horizontal bars)
   ═══════════════════════════════════════════════ */
const SHAPChart = ({ features, maxVal }) => {
    if (!features || features.length === 0) {
        return <div className="flex-1 flex items-center justify-center text-gray-500 font-medium text-[13px] h-full">No clinical data available for patient yet.</div>;
    }
    return (
        <div className="flex flex-col gap-[6px] w-full animate-fadeIn">
            {features.map((f, i) => (
                <div key={i} className="flex items-center gap-3 group cursor-default">
                    {/* Label */}
                    <span className="text-gray-400 text-[11px] w-[80px] text-right truncate group-hover:text-gray-200 transition-colors duration-200 font-medium">
                        {f.name}
                    </span>

                    {/* Bar track */}
                    <div className="flex-1 h-[14px] relative rounded-[4px] overflow-hidden">
                        <div className="absolute inset-0 bg-white/[0.025] rounded-[4px]" />
                        <div
                            className="h-full rounded-[4px] relative overflow-hidden"
                            style={{
                                width: `${(f.value / maxVal) * 100}%`,
                                background: `linear-gradient(90deg, ${f.color}55, ${f.color})`,
                                boxShadow: `0 0 16px ${f.color}25`,
                                transition: 'width 0.8s cubic-bezier(0.22, 1, 0.36, 1)',
                            }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
                        </div>
                    </div>

                    {/* Sparkline + value */}
                    <div className="flex items-center gap-2 w-[76px]">
                        <Sparkline seed={i * 1.3} color={f.color} />
                        <span className="text-[11px] font-mono font-bold w-[30px] text-right" style={{ color: f.color }}>
                            {typeof f.value === 'number' ? f.value.toFixed(2) : f.value}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
};

/* ═══════════════════════════════════════════════
   VIEW 2:  TRENDS  (area sparklines + deltas)
   ═══════════════════════════════════════════════ */
const TrendsChart = ({ trends }) => {
    if (!trends || trends.length === 0) {
        return <div className="flex-1 flex items-center justify-center text-gray-500 font-medium text-[13px] h-full">No trending biometrics tracked for patient yet.</div>;
    }
    return (
        <div className="flex flex-col gap-[10px] w-full animate-fadeIn">
            {trends.slice(0, 6).map((t, i) => {
                const data = (t.data && t.data.length > 0) ? t.data : [0, 0];
                const max = Math.max(...data);
                const min = Math.min(...data);
                const range = max - min === 0 ? 1 : max - min; // Prevent division by zero

                const points = data.length === 1
                    ? [{ x: 0, y: 22 }, { x: 240, y: 22 }]
                    : data.map((val, j) => ({
                        x: (j / (data.length - 1)) * 240,
                        y: 40 - ((val - min) / range) * 36 // Map between Y=4 and Y=40
                    }));

                const line = points.map(p => `${p.x},${p.y}`).join(' ');
                const area = `0,44 ${line} 240,44`;

                return (
                    <div key={i} className="flex items-center gap-3 group cursor-default">
                        <span className="text-gray-400 text-[11px] w-[80px] text-right truncate group-hover:text-gray-200 transition-colors duration-200 font-medium">
                            {t.name}
                        </span>

                        <div className="flex-1 h-[36px] relative rounded-lg overflow-hidden bg-white/[0.015] border border-white/[0.04]">
                            <svg viewBox="0 0 240 44" className="w-full h-full" preserveAspectRatio="none">
                                <defs>
                                    <linearGradient id={`tg-${i}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={t.color} stopOpacity="0.18" />
                                        <stop offset="100%" stopColor={t.color} stopOpacity="0" />
                                    </linearGradient>
                                </defs>
                                <polygon points={area} fill={`url(#tg-${i})`} />
                                <polyline points={line} stroke={t.color} strokeWidth="1.5" fill="none" strokeLinecap="round" />
                                {/* End dot */}
                                <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="2.5" fill={t.color} />
                                <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="5" fill={t.color} opacity="0.2" />
                            </svg>
                        </div>

                        {/* Delta badge */}
                        <div className="w-[52px] flex items-center justify-end gap-1">
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                {t.trend === 'up' && <path d="M5 2L8 6H2L5 2Z" fill={t.color} />}
                                {t.trend === 'down' && <path d="M5 8L2 4H8L5 8Z" fill={t.color} />}
                                {t.trend === 'flat' && <rect x="2" y="4" width="6" height="2" rx="1" fill={t.color} opacity="0.6" />}
                            </svg>
                            <span className="text-[10px] font-mono font-semibold" style={{ color: t.color }}>
                                {t.delta}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

/* ═══════════════════════════════════════════════
   VIEW 3:  CORRELATIONS (glass cards + meters)
   ═══════════════════════════════════════════════ */
const CorrelationsChart = ({ correlations }) => {
    if (!correlations || correlations.length === 0) {
        return <div className="flex-1 flex items-center justify-center text-gray-500 font-medium text-[13px] h-full">Not enough data to map physiological correlations.</div>;
    }
    return (
        <div className="grid grid-cols-2 gap-3 w-full animate-fadeIn">
            {correlations.slice(0, 4).map((pair, i) => {
                const strength = Math.abs(pair.val);
                const arcAngle = strength * 180;
                /* mini arc path for the gauge */
                const r = 22;
                const startX = 28 - r;
                const startY = 28;
                const endRad = (arcAngle * Math.PI) / 180;
                const endX = 28 - r * Math.cos(endRad);
                const endY = 28 - r * Math.sin(endRad);
                const largeArc = arcAngle > 180 ? 1 : 0;
                const arcPath = `M ${startX} ${startY} A ${r} ${r} 0 ${largeArc} 1 ${endX} ${endY}`;

                return (
                    <div key={i} className="relative rounded-2xl p-4 pb-3 flex flex-col gap-2 overflow-hidden group transition-all duration-300 hover:scale-[1.02]"
                        style={{
                            background: `linear-gradient(135deg, rgba(30,30,30,0.6), rgba(22,22,22,0.8))`,
                            border: `1px solid ${pair.color}12`,
                            boxShadow: `0 2px 20px ${pair.color}08`
                        }}
                    >
                        {/* Subtle glow blob */}
                        <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl opacity-[0.08]" style={{ background: pair.color }} />

                        {/* Feature pair labels */}
                        <div className="flex items-center gap-2 z-10">
                            <span className="text-gray-300 text-[11px] font-medium">{pair.p1}</span>
                            <svg width="14" height="8" viewBox="0 0 14 8" fill="none">
                                <path d="M1 4H13M13 4L10 1M13 4L10 7" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span className="text-gray-300 text-[11px] font-medium">{pair.p2}</span>
                        </div>

                        {/* Gauge + value */}
                        <div className="flex items-center justify-between z-10 mt-1">
                            <div className="relative w-[56px] h-[32px]">
                                <svg width="56" height="32" viewBox="0 0 56 32" fill="none">
                                    {/* Track */}
                                    <path d={`M ${28 - r} 28 A ${r} ${r} 0 0 1 ${28 + r} 28`}
                                        stroke="rgba(255,255,255,0.06)" strokeWidth="4" strokeLinecap="round" fill="none" />
                                    {/* Active arc */}
                                    <path d={arcPath}
                                        stroke={pair.color} strokeWidth="4" strokeLinecap="round" fill="none"
                                        style={{ filter: `drop-shadow(0 0 4px ${pair.color}50)` }} />
                                </svg>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-white text-lg font-mono font-bold leading-none">{strength.toFixed(2)}</span>
                                <span className="text-[9px] font-semibold uppercase tracking-widest mt-1" style={{ color: pair.color }}>
                                    {pair.val > 0 ? 'Positive' : 'Inverse'}
                                </span>
                            </div>
                        </div>

                        {/* Bottom bar */}
                        <div className="w-full h-[3px] bg-white/[0.04] rounded-full mt-1 overflow-hidden z-10">
                            <div className="h-full rounded-full" style={{
                                width: `${strength * 100}%`,
                                background: `linear-gradient(90deg, ${pair.color}66, ${pair.color})`,
                                transition: 'width 0.8s cubic-bezier(0.22, 1, 0.36, 1)'
                            }} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

/* ═══════════════════════════════════════════════
   SIDEBAR TAB BUTTON
   ═══════════════════════════════════════════════ */
const ViewTab = ({ label, active, onClick, icon }) => (
    <button
        onClick={onClick}
        className="relative w-[76px] h-[76px] flex flex-col items-center justify-center gap-2 rounded-[22px] transition-all duration-300 outline-none group"
        style={{
            background: active
                ? 'linear-gradient(145deg, rgba(38,38,38,0.9), rgba(24,24,24,0.95))'
                : 'rgba(16,16,16,0.6)',
            border: active ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent',
            boxShadow: active
                ? 'inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 16px rgba(0,0,0,0.3)'
                : 'none',
        }}
    >
        {/* Hover glow */}
        {!active && <div className="absolute inset-0 rounded-[22px] opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: 'rgba(255,255,255,0.02)' }} />}
        {icon}
        <span className={`text-[10px] font-medium tracking-wide transition-colors duration-200 ${active ? 'text-gray-200' : 'text-gray-500 group-hover:text-gray-400'}`}>
            {label}
        </span>
    </button>
);

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */
export default function MyRiskOverview({ features, trends, correlations }) {
    const [activeView, setActiveView] = useState('Factors');

    const safeFeatures = features || [];
    const computedMax = safeFeatures.length > 0 ? Math.max(...safeFeatures.map(f => f.value)) : 0.5;
    const maxVal = computedMax < 0.5 ? 0.5 : computedMax;

    return (
        <div className="rounded-[32px] p-8 h-[440px] flex flex-col relative overflow-hidden group"
            style={{
                background: '#000000', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)',
                border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 24px 48px -12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
            }}>

            <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay pointer-events-none"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />

            {/* Ambient Background Glows */}
            <div className="absolute -top-10 -right-10 w-64 h-64 rounded-full blur-[100px] opacity-[0.1]" style={{ background: '#00D4AA' }} />
            <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full blur-[80px] opacity-[0.08]" style={{ background: '#EF4A4A' }} />

            {/* Header */}
            <div className="flex items-center justify-between mb-5 z-10 w-full relative">
                <h3 className="text-white font-outfit font-semibold text-xl tracking-tight">Feature Importance</h3>
                <div className="flex items-center gap-2 text-[10px] font-mono px-3 py-1.5 rounded-xl"
                    style={{
                        color: 'rgba(255,255,255,0.4)',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)'
                    }}>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    SHAP · XGBoost v3.1
                </div>
            </div>

            <div className="flex-1 flex items-stretch gap-5 z-10 w-full">
                {/* Sidebar Tabs */}
                <div className="flex flex-col gap-2.5 flex-shrink-0">
                    <ViewTab
                        label="Factors"
                        active={activeView === 'Factors'}
                        onClick={() => setActiveView('Factors')}
                        icon={<FactorsIcon active={activeView === 'Factors'} />}
                    />
                    <ViewTab
                        label="Trends"
                        active={activeView === 'Trends'}
                        onClick={() => setActiveView('Trends')}
                        icon={<TrendsIcon active={activeView === 'Trends'} />}
                    />
                    <ViewTab
                        label="Correlations"
                        active={activeView === 'Correlations'}
                        onClick={() => setActiveView('Correlations')}
                        icon={<CorrelationsIcon active={activeView === 'Correlations'} />}
                    />
                </div>

                {/* Central Content Area */}
                <div className="flex-1 flex items-center">
                    {activeView === 'Factors' && <SHAPChart features={safeFeatures} maxVal={maxVal} />}
                    {activeView === 'Trends' && <TrendsChart trends={trends} />}
                    {activeView === 'Correlations' && <CorrelationsChart correlations={correlations} />}
                </div>

                {/* Right Gradient Scale — Factors only */}
                {activeView === 'Factors' && safeFeatures.length > 0 && (
                    <div className="h-full w-12 flex flex-col items-center justify-between relative flex-shrink-0">
                        <span className="text-gray-500 text-[10px] font-mono">0.50</span>
                        <div className="absolute top-4 w-2 h-[1px] bg-gray-600 right-8" />

                        <div className="flex-1 w-[5px] my-3 rounded-full relative ml-2" style={{
                            background: 'linear-gradient(to bottom, #EF4A4A 0%, #F68E0B 35%, #109981 65%, #00D4AA 100%)',
                            boxShadow: '0 0 12px rgba(0,212,170,0.08), inset 0 0 2px rgba(255,255,255,0.05)'
                        }} />

                        <div className="absolute top-1/2 -mt-[1px] w-2 h-[1px] bg-gray-600 right-8" />
                        <span className="absolute top-1/2 -mt-2 -left-2 text-gray-500 text-[10px] font-mono bg-[#111] px-1 rounded z-10">0.25</span>

                        <div className="absolute bottom-4 w-2 h-[1px] bg-gray-600 right-8" />
                        <span className="text-gray-500 text-[10px] font-mono mt-1">0.00</span>
                    </div>
                )}
            </div>
        </div>
    );
}
