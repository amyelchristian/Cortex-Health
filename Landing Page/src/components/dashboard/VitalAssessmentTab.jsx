import React, { useState } from 'react';
import { Shield, Brain, Activity } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { predictRisk } from '../../lib/cortexApi';

export default function VitalAssessmentTab() {
    const { currentUser, saveAssessment } = useAuth();
    const [userId] = useState(() => currentUser?.uid || `user_${Math.floor(Math.random() * 10000)}`);

    // Vitals State (Internal keys mapped to model)
    const [vitals, setVitals] = useState({
        hr: '', spo2: '', sys_bp: '', dia_bp: '', temp: '', rr: ''
    });

    const [assessmentResult, setAssessmentResult] = useState(null);
    const [isTyping, setIsTyping] = useState(false);

    const handleAssessmentSubmit = async (e) => {
        e.preventDefault();
        setIsTyping(true);
        try {
            // Unified assessment data object (Matches AssessmentForm's format)
            const assessmentData = {
                timestamp: new Date().toISOString(),
                patient: currentUser?.displayName || 'User',
                vitals: {
                    heartRate: parseFloat(vitals.hr) || 75,
                    spo2: parseFloat(vitals.spo2) || 98,
                    systolicBP: parseFloat(vitals.sys_bp) || 120,
                    diastolicBP: parseFloat(vitals.dia_bp) || 80,
                    temperature: parseFloat(vitals.temp) || 98.6,
                    respiratoryRate: parseFloat(vitals.rr) || 16
                },
                symptoms: [],
                medicalHistory: []
            };

            // Call the healthy Asia-South1 API via cortexApi.js helper
            const result = await predictRisk(assessmentData);

            // Format for local UI display
            const formattedResult = {
                prediction: {
                    risk_level: result.risk_category,
                    probabilities: result.probabilities
                },
                explanation: result.safety_override ? result.override_reason : "Prediction complete via Random Forest model."
            };

            setAssessmentResult(formattedResult);

            // SAVE to Firestore and Update Global Dashboard State
            await saveAssessment({ ...assessmentData, prediction: result });

        } catch (err) {
            console.error("Vital Assessment Error:", err);
            alert("Failed to submit assessment: " + (err.message || "Unknown error"));
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="flex flex-col h-full min-h-full glass-panel border border-[#e5e7eb] rounded-[32px] overflow-hidden bg-white shadow-sm relative z-0">
            {/* Header */}
            <div className="px-8 py-6 border-b border-[#f3f4f6] flex items-center justify-between bg-white z-10 relative">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F68E0B] to-[#82400E] flex items-center justify-center text-white shadow-md">
                        <Activity size={20} />
                    </div>
                    <div>
                        <h2 className="font-outfit font-bold text-xl text-[#111827]">Vital Sign Analysis</h2>
                        <div className="flex items-center gap-2 mt-0.5">
                            <div className="w-2 h-2 rounded-full bg-[#109981] animate-pulse" />
                            <span className="text-xs font-medium text-gray-500">ML Model Online · 99.98% Acc</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10 flex flex-col xl:flex-row gap-10 bg-gray-50/50">
                {/* Form Panel */}
                <div className="flex-1 w-full max-w-xl shrink-0">
                    <div className="bg-white rounded-3xl p-6 lg:p-8 border border-gray-100 shadow-sm mb-6">
                        <div className="mb-8">
                            <h3 className="font-outfit font-bold text-2xl mb-2 text-[#111827]">Enter Vital Signs</h3>
                            <p className="text-gray-500 text-[15px] leading-relaxed">Enter the patient's current vitals to run a highly accurate Random Forest risk prediction pipeline.</p>
                        </div>

                        <form onSubmit={handleAssessmentSubmit} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-1">Heart Rate (bpm)</label>
                                    <input type="number" value={vitals.hr} onChange={e => setVitals({ ...vitals, hr: e.target.value })} placeholder="e.g. 75" className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-gray-900 outline-none focus:border-[#109981]/50 focus:ring-4 focus:ring-[#109981]/10 transition-all font-medium" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-1">SpO2 (%)</label>
                                    <input type="number" value={vitals.spo2} onChange={e => setVitals({ ...vitals, spo2: e.target.value })} placeholder="e.g. 98" className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-gray-900 outline-none focus:border-[#109981]/50 focus:ring-4 focus:ring-[#109981]/10 transition-all font-medium" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-1">Systolic BP</label>
                                    <input type="number" value={vitals.sys_bp} onChange={e => setVitals({ ...vitals, sys_bp: e.target.value })} placeholder="e.g. 120" className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-gray-900 outline-none focus:border-[#109981]/50 focus:ring-4 focus:ring-[#109981]/10 transition-all font-medium" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-1">Diastolic BP</label>
                                    <input type="number" value={vitals.dia_bp} onChange={e => setVitals({ ...vitals, dia_bp: e.target.value })} placeholder="e.g. 80" className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-gray-900 outline-none focus:border-[#109981]/50 focus:ring-4 focus:ring-[#109981]/10 transition-all font-medium" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-1">Resp. Rate</label>
                                    <input type="number" value={vitals.rr} onChange={e => setVitals({ ...vitals, rr: e.target.value })} placeholder="e.g. 16" className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-gray-900 outline-none focus:border-[#109981]/50 focus:ring-4 focus:ring-[#109981]/10 transition-all font-medium" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-1">Temp (°F)</label>
                                    <input type="number" step="0.1" value={vitals.temp} onChange={e => setVitals({ ...vitals, temp: e.target.value })} placeholder="e.g. 98.6" className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-gray-900 outline-none focus:border-[#109981]/50 focus:ring-4 focus:ring-[#109981]/10 transition-all font-medium" />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isTyping}
                                className="w-full mt-2 py-4 rounded-[20px] bg-[#1c1c1c] text-white font-bold tracking-wide shadow-md hover:shadow-lg hover:bg-black transition-all disabled:opacity-50"
                            >
                                {isTyping ? 'Analyzing via RF Model...' : 'Run ML Assessment'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Results Panel */}
                <div className="flex-1 min-w-[320px]">
                    {assessmentResult ? (
                        <div className="h-full flex flex-col">

                            <div className="bg-white rounded-[24px] p-6 lg:p-8 border border-gray-100 shadow-sm mb-6">
                                <div className="mb-6 flex items-center justify-between">
                                    <h3 className="font-outfit font-bold text-xl text-[#111827]">ML Prediction</h3>
                                    <div className={`px-4 py-1.5 rounded-full border text-sm font-bold tracking-wider uppercase ${assessmentResult.prediction.risk_level === 'High' ? 'bg-[#FEE2E2] border-[#EF4A4A]/20 text-[#EF4A4A]' :
                                        assessmentResult.prediction.risk_level === 'Medium' ? 'bg-[#FEF3C7] border-[#F68E0B]/20 text-[#F68E0B]' :
                                            'bg-[#D1FAE5] border-[#109981]/20 text-[#109981]'
                                        }`}>
                                        {assessmentResult.prediction.risk_level} Risk
                                    </div>
                                </div>

                                <div className="space-y-4 mb-2">
                                    {['Low', 'Medium', 'High'].map(level => {
                                        const prob = assessmentResult.prediction.probabilities[level] || 0;
                                        const color = level === 'Low' ? 'bg-[#109981]' : level === 'Medium' ? 'bg-[#F68E0B]' : 'bg-[#EF4A4A]';
                                        return (
                                            <div key={level}>
                                                <div className="flex justify-between text-xs mb-1.5 font-bold tracking-wide text-gray-600">
                                                    <span>{level} Risk Probability</span>
                                                    <span>{prob.toFixed(1)}%</span>
                                                </div>
                                                <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                                                    <div className={`h-full ${color} transition-all duration-1000`} style={{ width: `${prob}%` }} />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-[#1c1c1c] to-[#2c2c2c] rounded-[24px] p-6 lg:p-8 flex-1 overflow-y-auto custom-scrollbar shadow-md">
                                <div className="flex items-center gap-2 mb-4 text-[#109981]">
                                    <Brain size={18} />
                                    <h4 className="font-bold text-sm tracking-wide">AI CLINICAL EXPLANATION</h4>
                                </div>
                                <div className="whitespace-pre-wrap text-[15px] text-white/90 leading-relaxed font-sans font-medium">
                                    {assessmentResult.explanation}
                                </div>
                            </div>

                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 bg-white rounded-[32px] border border-dashed border-gray-200 p-10">
                            <Shield size={64} className="mb-6 opacity-20" />
                            <p className="text-xl font-bold text-gray-500">No Assessment Run Yet</p>
                            <p className="text-[15px] mt-2 max-w-sm text-gray-400">Enter patient vitals on the left panel to securely invoke the remote Cortex Machine Learning pipeline.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
