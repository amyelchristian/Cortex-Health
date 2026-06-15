import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
    X, Heart, Thermometer, Wind, Droplets, Activity, Gauge,
    Stethoscope, ClipboardList, AlertCircle, CheckCircle2,
    ChevronDown, ChevronUp, Send, Loader2, Zap, ShieldAlert,
    ArrowRight
} from 'lucide-react';
import { predictRisk } from '../../lib/cortexApi';
import { useAuth } from '../../context/AuthContext';

/* ── Design Palette ── */
const P = {
    danger: { main: '#EF4A4A', light: '#FEE2E2', dark: '#95161B', glow: 'rgba(239,86,86,0.2)' },
    warning: { main: '#F68E0B', light: '#FEF3C7', dark: '#82400E', glow: 'rgba(245,158,11,0.2)' },
    success: { main: '#109981', light: '#D1FAE5', dark: '#065F46', glow: 'rgba(19,165,129,0.2)' },
    info: { main: '#00DAAA', light: '#CCFFF0', dark: '#008A6E', glow: 'rgba(0,218,170,0.2)' },
    purple: { main: '#8B5CF6', light: '#EDE9FE', dark: '#5B21B6', glow: 'rgba(139,92,246,0.2)' },
};

/* ─────────────────────────────────────────────────
   VITAL SIGNS CONFIG
   ───────────────────────────────────────────────── */
const VITALS_CONFIG = [
    { key: 'heartRate', label: 'Heart Rate', unit: 'bpm', min: 30, max: 200, placeholder: '72', icon: Heart, color: P.danger.main, required: true },
    { key: 'spo2', label: 'SpO₂', unit: '%', min: 70, max: 100, placeholder: '98', icon: Droplets, color: P.info.main, required: true },
    { key: 'systolicBP', label: 'Systolic BP', unit: 'mmHg', min: 70, max: 250, placeholder: '120', icon: Gauge, color: P.warning.main, required: true },
    { key: 'diastolicBP', label: 'Diastolic BP', unit: 'mmHg', min: 40, max: 150, placeholder: '80', icon: Gauge, color: P.warning.main, required: true },
    { key: 'respiratoryRate', label: 'Respiratory Rate', unit: '/min', min: 5, max: 40, placeholder: '16', icon: Wind, color: P.success.main, required: true },
    { key: 'temperature', label: 'Temperature', unit: '°F', min: 95, max: 108, placeholder: '98.6', icon: Thermometer, color: P.danger.main, required: true },
    { key: 'bloodGlucose', label: 'Blood Glucose', unit: 'mg/dL', min: 20, max: 600, placeholder: '95', icon: Activity, color: P.purple.main, required: false },
];

/* ─────────────────────────────────────────────────
   SYMPTOMS CONFIG
   ───────────────────────────────────────────────── */
const SYMPTOMS = [
    'Fever', 'Cough', 'Shortness of Breath', 'Chest Pain',
    'Fatigue', 'Nausea / Vomiting', 'Dizziness', 'Confusion',
    'Abdominal Pain', 'Headache', 'Muscle Pain', 'Loss of Appetite',
];

/* ─────────────────────────────────────────────────
   MEDICAL HISTORY CONFIG
   ───────────────────────────────────────────────── */
const MEDICAL_HISTORY = [
    'Diabetes', 'Pre-Diabetic', 'Hypertension', 'High Blood Pressure', 'Low Blood Pressure',
    'Heart Disease', 'COPD / Asthma', 'Kidney Disease', 'Liver Disease', 'Cancer',
    'Immunocompromised', 'Stroke History', 'Smoking', 'PCOS', 'Thyroid', 'Migraine', 'AIDS',
    'PCOD', 'Down Syndrome', 'Myopia', 'High Cholesterol', 'Obesity', 'Alzheimer', 'Genetic Disorder'
];

/* ── Collapsible Section Header ── */
const SectionHeader = ({ icon: Icon, title, subtitle, color, isOpen, onToggle, count }) => (
    <button onClick={onToggle}
        className="w-full flex items-center justify-between p-5 rounded-[20px] transition-all duration-300 group"
        style={{
            background: isOpen
                ? `linear-gradient(135deg, ${color}12, ${color}06)`
                : 'rgba(255,255,255,0.5)',
            border: `1px solid ${isOpen ? color + '25' : 'rgba(255,255,255,0.7)'}`,
            boxShadow: isOpen ? `0 4px 20px ${color}10` : '0 2px 8px rgba(0,0,0,0.02)',
        }}>
        <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-[14px] flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                style={{ background: `${color}15`, border: `1px solid ${color}20` }}>
                <Icon size={20} style={{ color }} />
            </div>
            <div className="text-left">
                <h4 className="text-gray-900 font-outfit font-bold text-[15px] tracking-tight">{title}</h4>
                <p className="text-gray-400 text-[11px] font-medium mt-0.5">{subtitle}</p>
            </div>
        </div>
        <div className="flex items-center gap-3">
            {count > 0 && (
                <span className="text-[10px] font-bold font-mono px-2.5 py-1 rounded-full"
                    style={{ background: `${color}15`, color }}>
                    {count} selected
                </span>
            )}
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/60 border border-white/80 shadow-sm">
                {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </div>
        </div>
    </button>
);

/* ── Numeric Vital Input Card ── */
const VitalInput = ({ config, value, onChange, error }) => {
    const Icon = config.icon;
    return (
        <div className="flex flex-col gap-2 p-4 rounded-[18px] transition-all duration-300 hover:-translate-y-0.5 group"
            style={{
                background: 'rgba(255,255,255,0.7)',
                border: error ? `1.5px solid ${P.danger.main}40` : '1px solid rgba(255,255,255,0.8)',
                boxShadow: error ? `0 4px 16px ${P.danger.glow}` : '0 4px 16px rgba(0,0,0,0.02)',
                backdropFilter: 'blur(20px)',
            }}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-[10px] flex items-center justify-center"
                        style={{ background: `${config.color}12` }}>
                        <Icon size={14} style={{ color: config.color }} />
                    </div>
                    <span className="text-gray-700 text-xs font-bold font-outfit">
                        {config.label}
                        {config.required && <span style={{ color: P.danger.main }}> *</span>}
                    </span>
                </div>
                <span className="text-[10px] font-mono text-gray-400 font-medium">{config.unit}</span>
            </div>

            {/* Input */}
            <div className="relative">
                <input
                    type="number"
                    min={config.min}
                    max={config.max}
                    step={config.key === 'temperature' ? '0.1' : '1'}
                    value={value}
                    onChange={(e) => onChange(config.key, e.target.value)}
                    placeholder={config.placeholder}
                    className="w-full bg-white/60 border border-gray-100 rounded-[12px] py-2.5 px-3.5 text-gray-900 text-sm font-mono font-semibold placeholder-gray-300 focus:outline-none focus:border-gray-300 focus:ring-2 focus:ring-gray-100 transition-all duration-200"
                    style={{ boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.03)' }}
                />
            </div>

            {/* Range hint */}
            <div className="flex items-center justify-between text-[9px] text-gray-400 font-mono px-1">
                <span>Range: {config.min}–{config.max}</span>
                {error && <span className="font-bold" style={{ color: P.danger.main }}>{error}</span>}
            </div>
        </div>
    );
};

/* ── Checkbox Chip ── */
const CheckChip = ({ label, checked, onChange, color }) => (
    <button
        type="button"
        onClick={() => onChange(!checked)}
        className="relative px-4 py-2.5 rounded-[14px] text-xs font-bold font-outfit transition-all duration-300 cursor-pointer select-none overflow-hidden"
        style={{
            background: checked
                ? `linear-gradient(135deg, ${color}18, ${color}08)`
                : 'rgba(255,255,255,0.6)',
            border: `1.5px solid ${checked ? color + '40' : 'rgba(0,0,0,0.06)'}`,
            color: checked ? color : '#6B7280',
            boxShadow: checked ? `0 2px 12px ${color}15` : '0 1px 4px rgba(0,0,0,0.02)',
            transform: checked ? 'scale(1.02)' : 'scale(1)',
        }}>
        <span className="flex items-center gap-2">
            {checked && <CheckCircle2 size={13} />}
            {label}
        </span>
    </button>
);

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */
export default function AssessmentForm({ onClose, onSubmit, displayName }) {
    const [vitals, setVitals] = useState({});
    const [symptoms, setSymptoms] = useState({});
    const [history, setHistory] = useState({});
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [apiError, setApiError] = useState(null);
    const [prediction, setPrediction] = useState(null);
    const [openSections, setOpenSections] = useState({ vitals: true, symptoms: false, history: false });
    const { saveAssessment } = useAuth();

    const toggleSection = (key) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

    const handleVitalChange = (key, value) => {
        setVitals(prev => ({ ...prev, [key]: value }));
        // Clear error on change
        if (errors[key]) setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
    };

    const handleSymptomToggle = (symptom) => {
        setSymptoms(prev => ({ ...prev, [symptom]: !prev[symptom] }));
    };

    const handleHistoryToggle = (item) => {
        setHistory(prev => ({ ...prev, [item]: !prev[item] }));
    };

    const validateVitals = () => {
        const newErrors = {};
        VITALS_CONFIG.forEach(v => {
            const raw = vitals[v.key];
            const val = parseFloat(raw);
            if (v.required && (raw === undefined || raw === '')) {
                newErrors[v.key] = 'Required';
            } else if (raw !== undefined && raw !== '') {
                if (isNaN(val) || val < v.min || val > v.max) {
                    newErrors[v.key] = `Must be ${v.min}–${v.max}`;
                }
            }
        });
        // DBP must be less than SBP
        const sbp = parseFloat(vitals.systolicBP);
        const dbp = parseFloat(vitals.diastolicBP);
        if (!isNaN(sbp) && !isNaN(dbp) && dbp >= sbp) {
            newErrors.diastolicBP = 'Must be less than Systolic BP';
        }
        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) {
            setOpenSections(prev => ({ ...prev, vitals: true }));
        }
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateVitals()) return;

        setSubmitting(true);
        setApiError(null);

        const assessmentData = {
            timestamp: new Date().toISOString(),
            patient: displayName,
            vitals: {},
            symptoms: [],
            medicalHistory: [],
        };

        // Collect vitals
        VITALS_CONFIG.forEach(v => {
            if (vitals[v.key] !== undefined && vitals[v.key] !== '') {
                assessmentData.vitals[v.key] = parseFloat(vitals[v.key]);
            }
        });

        // Collect symptoms
        SYMPTOMS.forEach(s => {
            if (symptoms[s]) assessmentData.symptoms.push(s);
        });

        // Collect medical history
        MEDICAL_HISTORY.forEach(h => {
            if (history[h]) assessmentData.medicalHistory.push(h);
        });

        try {
            const result = await predictRisk(assessmentData);
            setPrediction(result);

            // Attempt to save to Firestore & update Context
            await saveAssessment({ ...assessmentData, prediction: result });

            if (onSubmit) onSubmit({ ...assessmentData, prediction: result });
        } catch (err) {
            console.error('Cortex API error:', err);
            setApiError(err.message || 'Failed to get prediction');
        } finally {
            setSubmitting(false);
        }
    };

    const selectedSymptomCount = Object.values(symptoms).filter(Boolean).length;
    const selectedHistoryCount = Object.values(history).filter(Boolean).length;
    const filledVitalsCount = Object.values(vitals).filter(v => v !== '' && v !== undefined).length;

    const modalContent = (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto"
            style={{ animation: 'fadeIn 0.3s ease-out' }}>

            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            {/* Form Container */}
            <div className="relative w-full max-w-[800px] my-8 mx-4 rounded-[32px] overflow-hidden"
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
                            <ClipboardList size={24} style={{ color: P.info.main }} />
                        </div>
                        <div>
                            <h2 className="text-gray-900 font-outfit font-black text-2xl tracking-tight">New Assessment</h2>
                            <p className="text-gray-400 text-xs font-medium mt-1">Enter patient data for Cortex AI risk prediction</p>
                        </div>
                    </div>
                    <button onClick={onClose}
                        className="w-10 h-10 rounded-full flex items-center justify-center bg-white/60 border border-white/80 shadow-sm hover:bg-white hover:shadow-md transition-all duration-200">
                        <X size={18} className="text-gray-400" />
                    </button>
                </div>

                {/* ── Form Body ── */}
                <div className="relative z-10 px-8 pb-8 flex flex-col gap-4">

                    {prediction ? (
                        /* ═══ RESULTS VIEW ═══ */
                        <div className="flex flex-col gap-5 animate-fadeIn">
                            {/* Risk Category Banner */}
                            <div className="rounded-[24px] p-6 text-center relative overflow-hidden"
                                style={{
                                    background: prediction.risk_category === 'High'
                                        ? 'linear-gradient(135deg, rgba(239,74,74,0.12), rgba(149,22,27,0.06))'
                                        : prediction.risk_category === 'Medium'
                                            ? 'linear-gradient(135deg, rgba(246,142,11,0.12), rgba(130,64,14,0.06))'
                                            : 'linear-gradient(135deg, rgba(16,153,129,0.12), rgba(6,95,70,0.06))',
                                    border: `1.5px solid ${prediction.risk_category === 'High' ? P.danger.main + '30' : prediction.risk_category === 'Medium' ? P.warning.main + '30' : P.success.main + '30'}`,
                                }}>
                                <div className="flex items-center justify-center gap-3 mb-3">
                                    {prediction.safety_override && <ShieldAlert size={22} style={{ color: P.danger.main }} />}
                                    <span className="text-[44px] font-outfit font-black tracking-tight leading-none"
                                        style={{ color: prediction.risk_category === 'High' ? P.danger.main : prediction.risk_category === 'Medium' ? P.warning.main : P.success.main }}>
                                        {prediction.risk_category}
                                    </span>
                                </div>
                                <p className="text-gray-500 text-xs font-semibold">Risk Classification</p>
                                {prediction.safety_override && (
                                    <div className="mt-3 flex items-center justify-center gap-2 text-[11px] font-bold px-4 py-2 rounded-full mx-auto w-fit"
                                        style={{ background: P.danger.main + '15', color: P.danger.main }}>
                                        <ShieldAlert size={13} />
                                        Safety Override: {prediction.override_reason}
                                    </div>
                                )}
                            </div>

                            {/* All 3 Risk Probabilities */}
                            <div className="rounded-[20px] p-5 flex flex-col gap-4"
                                style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.8)' }}>
                                <h4 className="text-gray-900 font-outfit font-bold text-sm">Probability Breakdown</h4>
                                {[
                                    { label: 'Low Risk', value: prediction.probabilities.Low, color: P.success.main, isPredicted: prediction.risk_category === 'Low' },
                                    { label: 'Medium Risk', value: prediction.probabilities.Medium, color: P.warning.main, isPredicted: prediction.risk_category === 'Medium' },
                                    { label: 'High Risk', value: prediction.probabilities.High, color: P.danger.main, isPredicted: prediction.risk_category === 'High' },
                                ].map(bar => (
                                    <div key={bar.label} className="rounded-[14px] p-3.5"
                                        style={{
                                            background: bar.isPredicted ? `${bar.color}08` : 'transparent',
                                            border: bar.isPredicted ? `1.5px solid ${bar.color}25` : '1.5px solid transparent',
                                        }}>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2.5 h-2.5 rounded-full" style={{ background: bar.color }} />
                                                <span className="text-xs font-bold font-outfit text-gray-700">{bar.label}</span>
                                                {bar.isPredicted && (
                                                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                                                        style={{ background: `${bar.color}18`, color: bar.color }}>
                                                        Predicted
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-sm font-black font-mono" style={{ color: bar.color }}>
                                                {(bar.value * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                        <div className="w-full h-2.5 rounded-full bg-gray-100 overflow-hidden">
                                            <div className="h-full rounded-full transition-all duration-700"
                                                style={{ width: `${Math.max(bar.value * 100, 1)}%`, background: bar.color, opacity: bar.value > 0 ? 1 : 0.3 }} />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Stats Row */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="rounded-[16px] p-4 text-center"
                                    style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.8)' }}>
                                    <p className="text-lg font-outfit font-black text-gray-900">{(prediction.confidence * 100).toFixed(1)}%</p>
                                    <p className="text-[10px] text-gray-400 font-bold mt-0.5">Confidence</p>
                                </div>
                                <div className="rounded-[16px] p-4 text-center"
                                    style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.8)' }}>
                                    <p className="text-lg font-outfit font-black text-gray-900">{prediction.inference_ms.toFixed(1)}<span className="text-xs text-gray-400">ms</span></p>
                                    <p className="text-[10px] text-gray-400 font-bold mt-0.5">Inference</p>
                                </div>
                                <div className="rounded-[16px] p-4 text-center"
                                    style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.8)' }}>
                                    <p className="text-lg font-outfit font-black text-gray-900">{prediction.risk_score}<span className="text-xs text-gray-400">/3</span></p>
                                    <p className="text-[10px] text-gray-400 font-bold mt-0.5">Risk Score</p>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-between gap-4 mt-2">
                                <button onClick={() => { setPrediction(null); setApiError(null); }}
                                    className="flex items-center gap-2 px-5 py-3 rounded-[14px] font-outfit font-bold text-sm text-gray-600 bg-white/60 border border-gray-200 hover:bg-white transition-all duration-200">
                                    <ArrowRight size={14} className="rotate-180" />
                                    New Assessment
                                </button>
                                <button onClick={onClose}
                                    className="flex items-center gap-2 px-8 py-3 rounded-[14px] font-outfit font-bold text-sm transition-all duration-300 hover:-translate-y-0.5"
                                    style={{
                                        background: 'linear-gradient(135deg, #00DAAA, #109981)',
                                        color: '#FFFFFF',
                                        boxShadow: '0 8px 24px rgba(0,218,170,0.3)',
                                    }}>
                                    <CheckCircle2 size={15} />
                                    Done
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* ═══ FORM VIEW ═══ */
                        <>
                            {/* ═══ Section 1: Vital Signs ═══ */}
                            <SectionHeader
                                icon={Heart}
                                title="Vital Signs"
                                subtitle="Enter numeric clinical measurements"
                                color={P.danger.main}
                                isOpen={openSections.vitals}
                                onToggle={() => toggleSection('vitals')}
                                count={filledVitalsCount}
                            />
                            {openSections.vitals && (
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 pl-2 pr-1 animate-fadeIn">
                                    {VITALS_CONFIG.map(v => (
                                        <VitalInput
                                            key={v.key}
                                            config={v}
                                            value={vitals[v.key] || ''}
                                            onChange={handleVitalChange}
                                            error={errors[v.key]}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* ═══ Section 2: Symptoms ═══ */}
                            <SectionHeader
                                icon={AlertCircle}
                                title="Symptoms"
                                subtitle="Select all presenting symptoms"
                                color={P.warning.main}
                                isOpen={openSections.symptoms}
                                onToggle={() => toggleSection('symptoms')}
                                count={selectedSymptomCount}
                            />
                            {openSections.symptoms && (
                                <div className="flex flex-wrap gap-2.5 pl-2 pr-1 animate-fadeIn">
                                    {SYMPTOMS.map(s => (
                                        <CheckChip
                                            key={s}
                                            label={s}
                                            checked={!!symptoms[s]}
                                            onChange={() => handleSymptomToggle(s)}
                                            color={P.warning.main}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* ═══ Section 3: Medical History ═══ */}
                            <SectionHeader
                                icon={Stethoscope}
                                title="Medical History"
                                subtitle="Select pre-existing conditions"
                                color={P.purple.main}
                                isOpen={openSections.history}
                                onToggle={() => toggleSection('history')}
                                count={selectedHistoryCount}
                            />
                            {openSections.history && (
                                <div className="flex flex-wrap gap-2.5 pl-2 pr-1 animate-fadeIn">
                                    {MEDICAL_HISTORY.map(h => (
                                        <CheckChip
                                            key={h}
                                            label={h}
                                            checked={!!history[h]}
                                            onChange={() => handleHistoryToggle(h)}
                                            color={P.purple.main}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* API Error */}
                            {apiError && (
                                <div className="flex items-center gap-3 p-4 rounded-[16px] animate-fadeIn"
                                    style={{ background: P.danger.main + '10', border: `1px solid ${P.danger.main}25` }}>
                                    <AlertCircle size={16} style={{ color: P.danger.main }} />
                                    <span className="text-xs font-bold" style={{ color: P.danger.main }}>{apiError}</span>
                                </div>
                            )}

                            {/* ═══ Submit Button ═══ */}
                            <div className="mt-4 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2 text-[11px] text-gray-400 font-medium">
                                    <Zap size={13} style={{ color: P.info.main }} />
                                    <span>Powered by Cortex AI • XGBoost v3.0</span>
                                </div>
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="flex items-center gap-2.5 px-8 py-3.5 rounded-[16px] font-outfit font-bold text-sm transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                                    style={{
                                        background: 'linear-gradient(135deg, #00DAAA, #109981)',
                                        color: '#FFFFFF',
                                        boxShadow: '0 8px 24px rgba(0,218,170,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
                                        textShadow: '0 1px 2px rgba(0,0,0,0.15)',
                                    }}>
                                    {submitting ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            Analyzing...
                                        </>
                                    ) : (
                                        <>
                                            <Send size={15} />
                                            Submit Assessment
                                        </>
                                    )}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
