import React, { useState, useEffect } from 'react';
import { CheckCircle2, Stethoscope, Clock, Pill, Activity, Loader2, Sparkles } from 'lucide-react';
import { generateDynamicNextSteps } from '../../lib/intelligence';

/* ── Health Risk & Info palette ── */
const PALETTE = {
    danger: { main: '#EF4A4A', light: '#FEE2E2', dark: '#95161B', glow: 'rgba(239,86,86,0.12)' },
    warning: { main: '#F68E0B', light: '#FEF3C7', dark: '#82400E', glow: 'rgba(245,158,11,0.12)' },
    success: { main: '#109981', light: '#D1FAE5', dark: '#065F46', glow: 'rgba(19,165,129,0.12)' },
    info: { main: '#00DAAA', light: '#CCFFF0', dark: '#008A6E', glow: 'rgba(0,218,170,0.10)' },
};

const defaultSteps = [
    {
        icon: Stethoscope,
        palette: 'danger',
        title: 'Immediate Assessment',
        timeline: 'Now',
        bullets: [
            'Notify attending physician immediately',
            'Bedside clinical evaluation required',
            'Check ABG and lactate levels',
        ],
    },
    {
        icon: Activity,
        palette: 'warning',
        title: 'Vitals Re-check',
        timeline: 'Within 30 min',
        bullets: [
            'Re-assess HR, SpO₂, MAP in 30 min',
            'Continuous pulse-ox monitoring',
            'Consider arterial line placement',
        ],
    },
    {
        icon: Pill,
        palette: 'success',
        title: 'Medication Review',
        timeline: 'Within 2h',
        bullets: [
            'Review current vasopressor dosage',
            'Consider fluid resuscitation bolus',
            'Evaluate antibiotic coverage',
        ],
    },
    {
        icon: Clock,
        palette: 'info',
        title: 'Continuous Monitoring',
        timeline: 'Ongoing',
        bullets: [
            'Set Cortex AI re-scan every 15 min',
            'Enable automated alert escalation',
            'Track SHAP feature drift trends',
        ],
    },
];

const getIcon = (iconName) => {
    switch (iconName) {
        case 'Stethoscope': case 'immediate': return Stethoscope;
        case 'Activity': case 'vitals': return Activity;
        case 'Pill': case 'meds': return Pill;
        case 'Clock': case 'monitoring': return Clock;
        default: return CheckCircle2;
    }
};

export default function MyActionPlan({ steps, currentUser }) {
    const [dynamicSteps, setDynamicSteps] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        let mounted = true;
        if (currentUser && currentUser.firestoreData) {
            setIsLoading(true);
            generateDynamicNextSteps(currentUser)
                .then(res => {
                    if (mounted && res) setDynamicSteps(res);
                })
                .catch(err => console.error(err))
                .finally(() => {
                    if (mounted) setIsLoading(false);
                });
        }
        return () => { mounted = false; };
    }, [currentUser]);

    const safeSteps = dynamicSteps || steps || defaultSteps;

    return (
        <div className="rounded-[24px] p-6 h-full flex flex-col relative overflow-hidden"
            style={{
                background: 'rgba(255, 255, 255, 0.65)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(255,255,255,0.8)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04), inset 0 0 0 1px rgba(255, 255, 255, 0.5)'
            }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2 text-gray-900">
                    <Sparkles className="w-5 h-5 text-indigo-500" />
                    <h3 className="font-outfit font-semibold text-lg bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-indigo-600">
                        Suggested Next Steps
                    </h3>
                </div>
                {isLoading && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 rounded-full border border-indigo-100">
                        <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
                        <span className="text-[10px] font-bold text-indigo-600 tracking-wide font-outfit uppercase">Generating AI Insights</span>
                    </div>
                )}
            </div>

            {/* Steps List */}
            <div className="flex-1 flex flex-col gap-5 relative">
                <div className={`flex flex-col gap-5 transition-opacity duration-300 ${isLoading ? 'opacity-30 pointer-events-none blur-[1px]' : 'opacity-100'}`}>
                    {safeSteps.map((s, i) => {
                        const Icon = typeof s.icon === 'function' ? s.icon : getIcon(s.icon || s.type);
                        const p = PALETTE[s.palette] || PALETTE.info;
                        return (
                            <div key={i} className="flex items-start gap-3 rounded-2xl p-3 transition-all"
                                style={{ background: p.light, boxShadow: `0 2px 12px ${p.glow}` }}>
                                {/* Icon */}
                                <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center"
                                    style={{ background: p.main + '22', boxShadow: `0 0 10px ${p.glow}` }}>
                                    <Icon size={16} style={{ color: p.main }} />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <p className="text-sm font-outfit font-semibold" style={{ color: p.dark }}>{s.title}</p>
                                        <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border"
                                            style={{
                                                color: p.dark,
                                                background: 'white',
                                                borderColor: p.main + '40',
                                            }}>
                                            {s.timeline}
                                        </span>
                                    </div>
                                    <ul className="text-[11px] leading-relaxed list-disc list-inside space-y-0.5"
                                        style={{ color: p.dark + 'cc' }}>
                                        {s.bullets.map((b, j) => <li key={j}>{b}</li>)}
                                    </ul>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
