import React from 'react';
import { TrendingUp, TrendingDown, Activity, AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';

/* ── Palette ── */
const danger = { main: '#EF4A4A', glow: 'rgba(239,74,74,0.25)' };
const warning = { main: '#F68E0B', glow: 'rgba(246,142,11,0.25)' };
const success = { main: '#109981', glow: 'rgba(16,153,129,0.25)' };
const info = { main: '#00D4AA', glow: 'rgba(0,212,170,0.20)' };

/* ── Utility to get rank ── */
const getRiskColor = (score) => score >= 75 ? danger : score >= 40 ? warning : success;
const getRiskLabel = (score) => score >= 75 ? "Critical Risk" : score >= 40 ? "Elevated Risk" : "Stable Baseline";
const getRiskIcon = (score) => score >= 75 ? ShieldAlert : score >= 40 ? AlertTriangle : CheckCircle2;

/* ── Master Linear Score Card ── */
const MasterScoreCard = ({ score }) => {
    const colorObj = getRiskColor(score);
    const color = colorObj.main;
    const Icon = getRiskIcon(score);
    const label = getRiskLabel(score);

    return (
        <div className="relative rounded-2xl p-5 mb-4 overflow-hidden group transition-all duration-300"
            style={{
                background: `linear-gradient(135deg, ${color}15, rgba(20,20,20,0.8))`,
                border: `1px solid ${color}20`,
                boxShadow: `0 8px 32px ${colorObj.glow}`
            }}>
            {/* Ambient inner glow */}
            <div className="absolute top-0 right-0 w-48 h-48 opacity-10 mix-blend-overlay rounded-full blur-3xl pointer-events-none" style={{ background: color }} />

            <div className="flex items-end justify-between z-10 relative mb-4">
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                        <Icon size={16} style={{ color }} />
                        <span className="text-gray-300 font-outfit text-[13px] font-bold tracking-wider uppercase">{label}</span>
                    </div>
                    <span className="text-gray-400 text-[10px] uppercase tracking-widest font-mono">Aggregated ML Risk Score</span>
                </div>
                <div className="flex items-end gap-1 translate-y-1">
                    <span className="text-[40px] font-mono font-black leading-none drop-shadow-md" style={{ color }}>{score}</span>
                    <span className="text-gray-500 font-mono text-sm leading-snug mb-1">/100</span>
                </div>
            </div>

            {/* Glowing Track */}
            <div className="w-full h-2.5 bg-black/50 rounded-full overflow-hidden relative z-10 border border-white/5 shadow-inner">
                <div className="h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                    style={{
                        width: `${Math.max(score, 2)}%`,
                        background: `linear-gradient(90deg, ${color}66, ${color})`,
                        boxShadow: `0 0 12px ${color}`
                    }}
                >
                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </div>
            </div>

            {/* Scale markers */}
            <div className="flex justify-between w-full mt-2 px-1 z-10 relative">
                <span className="text-[9px] font-mono text-gray-500 font-bold">0</span>
                <span className="text-[9px] font-mono text-gray-500 font-bold">50</span>
                <span className="text-[9px] font-mono text-gray-500 font-bold">100</span>
            </div>
        </div>
    );
};

/* ── Secondary Risk Card ── */
const RiskCard = ({ title, subtitle, icon: Icon, value, percentage, color, glow, trend }) => (
    <div className="relative rounded-2xl p-4 flex flex-col gap-3 overflow-hidden group transition-all duration-300 hover:scale-[1.02]"
        style={{
            background: `linear-gradient(145deg, ${color}10, ${color}05)`,
            border: `1px solid ${color}15`,
            boxShadow: `0 4px 20px ${glow}`
        }}>
        {/* Ambient glow */}
        <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full blur-3xl opacity-[0.08]" style={{ background: color }} />

        {/* Top row: icon + title */}
        <div className="flex items-start gap-3 z-10">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${color}15`, border: `1px solid ${color}20` }}>
                <Icon size={14} style={{ color }} />
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="text-white text-[13px] font-outfit font-semibold leading-tight">{title}</h4>
                <p className="text-gray-500 text-[10px] leading-snug mt-0.5 max-w-[120px]">{subtitle}</p>
            </div>
        </div>

        {/* Value + trend */}
        <div className="flex items-end justify-between z-10">
            <span className="text-2xl font-mono font-bold" style={{ color }}>{value}</span>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                style={{
                    background: trend === 'up' ? `${danger.main}15` : trend === 'down' ? `${success.main}15` : 'rgba(255,255,255,0.05)',
                    color: trend === 'up' ? danger.main : trend === 'down' ? success.main : '#888'
                }}>
                {trend === 'up' ? <TrendingUp size={10} /> : trend === 'down' ? <TrendingDown size={10} /> : null}
                {percentage}
            </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 bg-white/[0.04] rounded-full overflow-hidden z-10">
            <div className="h-full rounded-full transition-all duration-1000"
                style={{
                    width: value !== '--%' ? value : '0%',
                    background: `linear-gradient(90deg, ${color}88, ${color})`,
                    boxShadow: `0 0 10px ${glow}`
                }} />
        </div>
    </div>
);

/* ── Lower Stat Pill ── */
const StatPill = ({ label, value, color, icon: Icon, glowing }) => (
    <div className="flex flex-col items-center justify-center py-3 px-2 rounded-2xl relative overflow-hidden group transition-all duration-300"
        style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
            boxShadow: glowing ? `0 4px 20px ${color}15` : '0 2px 8px rgba(0,0,0,0.1)'
        }}>
        <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300" style={{ background: color }} />
        <Icon size={14} style={{ color, marginBottom: '6px' }} />
        <span className="text-white text-[13px] font-mono font-bold" style={{ color }}>{value}</span>
        <span className="text-gray-500 text-[9px] font-medium uppercase tracking-wider mt-0.5 text-center">{label}</span>
    </div>
);

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */
export default function PersonalRiskGauge({ metrics }) {
    // Provide defaults statically if metrics has not loaded
    const scoreNow = metrics?.riskScore || 0;

    const detRisk = metrics?.deteriorationRisk || '--%';
    const detTrend = metrics?.deteriorationRiskTrend || 'flat';
    const detDelta = metrics?.deteriorationRiskDelta || '--%';

    const sepRisk = metrics?.sepsisRisk || '--%';
    const sepTrend = metrics?.sepsisRiskTrend || 'flat';
    const sepDelta = metrics?.sepsisRiskDelta || '--%';

    const confidence = metrics?.confidence || '--%';
    const trendStr = (metrics?.trendStr || 'Need Data').replace(/[↑→↓]/g, '').trim();
    const qsofa = metrics?.qsofa || '-- / 3';

    const statusColor = getRiskColor(scoreNow).main;

    return (
        <div className="rounded-[32px] p-8 h-full min-h-[440px] flex flex-col relative overflow-hidden group"
            style={{
                background: '#000000', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)',
                border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 24px 48px -12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
            }}>

            <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay pointer-events-none"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />

            {/* Ambient background glows */}
            <div className="absolute -top-10 -left-10 w-56 h-56 rounded-full blur-[100px] opacity-[0.1]" style={{ background: danger.main }} />
            <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full blur-[80px] opacity-[0.1]" style={{ background: info.main }} />

            {/* Header */}
            <div className="flex items-center justify-between mb-5 z-10 w-full">
                <h3 className="text-white font-outfit font-semibold text-xl tracking-tight">AI Analytics Insights</h3>
                <div className="flex items-center gap-2 text-[10px] font-mono px-3 py-1.5 rounded-xl"
                    style={{
                        color: info.main,
                        background: `${info.main}08`,
                        border: `1px solid ${info.main}18`
                    }}>
                    <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: info.main }} />
                    Latest Assessment
                </div>
            </div>

            {/* Master Progress Bar */}
            <div className="z-10 w-full animate-fadeIn">
                <MasterScoreCard score={scoreNow} />
            </div>

            {/* Risk Cards row */}
            <div className="grid grid-cols-2 gap-3 z-10 w-full mb-3 flex-1 animate-fadeIn">
                <RiskCard
                    title="Deterioration Risk"
                    subtitle="Based on vital trend analysis"
                    icon={AlertTriangle}
                    value={detRisk}
                    percentage={detDelta}
                    color={danger.main}
                    glow={danger.glow}
                    trend={detTrend}
                />
                <RiskCard
                    title="Sepsis Risk Score"
                    subtitle="qSOFA & feature trajectory"
                    icon={Activity}
                    value={sepRisk}
                    percentage={sepDelta}
                    color={warning.main}
                    glow={warning.glow}
                    trend={sepTrend}
                />
            </div>

            {/* Bottom pills */}
            <div className="grid grid-cols-3 gap-3 w-full z-10 mt-auto pt-1 animate-fadeIn">
                <StatPill label="Confidence" value={confidence} color={info.main} icon={Activity} glowing={true} />
                <StatPill label="State" value={trendStr} color={statusColor} icon={TrendingUp} />
                <StatPill label="qSOFA" value={qsofa} color={warning.main} icon={ShieldAlert} />
            </div>
        </div>
    );
}
