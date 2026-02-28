import React, { useState } from 'react';

/* ── Health Risk & Info Indicator Palette (exact from spec) ── */
const PALETTE = {
    danger: { main: '#EF4A4A', light: '#FEE2E2', dark: '#95161B', darker: '#591B1B', glow: 'rgba(239,86,86,0.2)' },
    warning: { main: '#F68E0B', light: '#FEF3C7', dark: '#82400E', darker: '#92400E', glow: 'rgba(245,158,11,0.2)' },
    success: { main: '#109981', light: '#D1FAE5', dark: '#065F46', darker: '#065F46', glow: 'rgba(19,165,129,0.2)' },
    info: { main: '#00DAAA', light: '#CCFFF0', dark: '#008A6E', darker: '#D05A6E', glow: 'rgba(0,218,170,0.2)' },
};

/* Returns palette key for a vital */
const getPalette = (v) => {
    if (v.isNormal) return PALETTE.success;
    if (v.status === 'Elevated' || v.status === 'High') return PALETTE.danger;
    if (v.status === 'Low') return PALETTE.warning;
    return PALETTE.info;
};

const defaultVitals = [
    {
        title: 'Heart Rate',
        unit: 'bpm',
        value: '78',
        status: 'Normal',
        isNormal: true,
        chartType: 'line',
        path: 'M0,28 Q15,24 25,26 T45,22 T65,20 T80,18 T100,16',
        interactivePoints: [
            { x: 0, y: 28, value: '72', label: '12:00' },
            { x: 25, y: 26, value: '74', label: '14:00' },
            { x: 45, y: 22, value: '76', label: '16:00' },
            { x: 65, y: 20, value: '75', label: '18:00' },
            { x: 80, y: 18, value: '77', label: '20:00' },
            { x: 100, y: 16, value: '78', label: 'Now' }
        ],
    },
    {
        title: 'SpO₂ Level',
        unit: '%',
        value: '98',
        status: 'Normal',
        isNormal: true,
        chartType: 'bars',
        leftLabel: 'Left Lung',
        rightLabel: 'Right Lung',
    },
    {
        title: 'Systolic Blood Pressure',
        unit: 'mmHg',
        value: '118',
        status: 'Normal',
        isNormal: true,
        chartType: 'progress',
        current: 118,
        max: 200,
        normalLabel: '90–120 mmHg',
    },
    {
        title: 'Respiratory Rate',
        unit: '/min',
        value: '16',
        status: 'Normal',
        isNormal: true,
        chartType: 'progress',
        current: 16,
        max: 35,
        normalLabel: '12–20 /min',
    },
    {
        title: 'Body Temperature',
        unit: '°F',
        value: '98.6',
        status: 'Normal',
        isNormal: true,
        chartType: 'progress',
        current: 98.6,
        max: 110,
        normalLabel: '97.8–99.1 °F',
    },
    {
        title: 'Blood Glucose',
        unit: 'mg/dL',
        value: '95',
        status: 'Normal',
        isNormal: true,
        chartType: 'progress',
        current: 95,
        max: 300,
        normalLabel: '70–100 mg/dL',
    },
];

/* ── Line-chart variant ── */
const LineChart = ({ v }) => {
    const p = getPalette(v);
    const pts = v.interactivePoints || [];

    return (
        <div className="relative h-20 w-full flex items-end border-b border-gray-100 pb-2">

            {/* ── SVG Chart ── */}
            <svg viewBox="0 0 100 40" className="w-full h-full pointer-events-none" preserveAspectRatio="none" fill="none">
                <defs>
                    <linearGradient id={`fill-${v.title.replace(/\\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={p.main} stopOpacity="0.25" />
                        <stop offset="100%" stopColor={p.main} stopOpacity="0.02" />
                    </linearGradient>
                </defs>
                <path d={`${v.path} L100,40 L0,40 Z`} fill={`url(#fill-${v.title.replace(/\\s+/g, '')})`} className="transition-all duration-300" />

                {/* Thicker stroke line matching mockup */}
                <path d={v.path} stroke={p.main} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-300" />
            </svg>

            {/* Bottom X-Axis Labels (Only show first and last to keep it clean) */}
            <div className="absolute -bottom-6 left-0 w-full flex justify-between text-[10px] font-bold font-outfit text-gray-500 pointer-events-none">
                <span className="text-gray-900">{pts[0]?.label}</span>
                <span className="text-gray-900">{pts[pts.length - 1]?.label}</span>
            </div>
        </div>
    );
};

/* ── Bar-chart variant (SpO₂) ── */
const BarChart = ({ v }) => {
    const p = getPalette(v);
    const bars = 36;
    return (
        <div className="flex flex-col items-center gap-1.5 w-full">
            <div className="flex items-end justify-center gap-[2px] h-14 w-full">
                {Array.from({ length: bars }).map((_, i) => {
                    const height = 16 + Math.sin(i * 0.35) * 14 + (i % 3) * 2;
                    const isLeft = i < bars / 2;
                    return (
                        <div key={i} className="rounded-sm" style={{
                            width: '3px',
                            height: `${height}px`,
                            background: `linear-gradient(to top, ${p.main}55, ${p.main})`,
                            boxShadow: `0 0 4px ${p.glow}`,
                        }} />
                    );
                })}
            </div>
            <div className="flex justify-between w-full px-2 text-[9px] text-gray-400">
                <span>{v.leftLabel}</span>
                <span>{v.rightLabel}</span>
            </div>
        </div>
    );
};

/* ── Progress-bar variant (MAP & RR) ── */
const ProgressChart = ({ v }) => {
    const p = getPalette(v);
    const normalFill = PALETTE.success;
    return (
        <div className="flex flex-col gap-3">
            <div>
                <div className="flex justify-between text-[10px] text-gray-400 mb-1.5">
                    <span>Normal Range</span>
                    <span className="font-semibold font-mono" style={{ color: normalFill.dark }}>{v.normalLabel}</span>
                </div>
                <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: normalFill.light }}>
                    <div className="h-full w-[60%] rounded-full" style={{ background: `linear-gradient(90deg, ${normalFill.main}, ${normalFill.dark})` }} />
                </div>
            </div>
            <div>
                <div className="flex justify-between text-[10px] text-gray-400 mb-1.5">
                    <span>Patient Value</span>
                    <span className="font-semibold font-mono" style={{ color: p.dark }}>{v.value} <span className="font-sans">{v.unit}</span></span>
                </div>
                <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: p.light }}>
                    <div className="h-full rounded-full"
                        style={{
                            width: `${(v.current / v.max) * 100}%`,
                            background: `linear-gradient(90deg, ${p.main}, ${p.dark})`,
                            boxShadow: `0 0 8px ${p.glow}`,
                        }} />
                </div>
            </div>
        </div>
    );
};

/* ── Status Badge ── */
const StatusBadge = ({ v }) => {
    const p = getPalette(v);
    return (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold tracking-wide"
            style={{
                color: p.dark,
                background: p.light,
            }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: p.main }} />
            {v.status}
        </div>
    );
};

/* ── Single metric card ── */
const MetricCard = ({ v }) => {
    const p = getPalette(v);

    return (
        <div className="rounded-[24px] p-7 flex flex-col relative overflow-hidden group transition-all duration-300 hover:shadow-md bg-white border border-gray-100"
            style={{
                boxShadow: `0 4px 20px rgba(0,0,0,0.03), 0 4px 24px ${p.glow}`
            }}>
            <div className="flex items-center justify-between mb-2 relative z-10">
                <h4 className="text-gray-600 font-semibold text-[15px]">{v.title}</h4>
                <StatusBadge v={v} />
            </div>

            <div className="flex items-baseline gap-1.5 mb-6">
                <span className="text-[44px] font-outfit font-bold tracking-tight transition-colors duration-200 leading-none" style={{ color: p.main }}>
                    {v.value}
                </span>
                <span className="text-gray-400 font-medium text-sm">{v.unit}</span>
            </div>

            <div className="flex-1 flex flex-col justify-end relative z-10">
                {v.chartType === 'line' && <LineChart v={v} />}
                {v.chartType === 'bars' && <BarChart v={v} />}
                {v.chartType === 'progress' && <ProgressChart v={v} />}
            </div>
        </div>
    );
};

export default function VitalsGrid({ vitals }) {
    const safeVitals = vitals || defaultVitals;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
            {safeVitals.map((v, i) => <MetricCard key={i} v={v} />)}
        </div>
    );
}
