import React from 'react';
import { ArrowUp } from 'lucide-react';
import logoImg from '../assets/transparent-logo.png';
import ScrollReveal from './ScrollReveal';

const Features = () => {
    return (
        <section id="features" className="features-section">
            <div className="max-w-[1200px] mx-auto px-6 relative z-10">

                <ScrollReveal className="features-header-wrap" animation="fade-up">
                    <h2 className="features-main-heading">
                        The Clinical Intelligence Platform™<br />
                        for Proactive Patient Care.
                    </h2>
                    <p className="features-subheading">
                        Turn raw patient vitals and medical history into precise risk scores, early alerts, and<br />
                        explainable insights clinicians need to act before deterioration occurs.
                    </p>
                </ScrollReveal>

                <div className="features-grid">

                    {/* Column 1: Dark Glass — Predictive Analytics */}
                    <ScrollReveal animation="fade-up" delay="100ms">
                        <div className="fc-dark">
                            <div className="fc-dark-bg" />
                            <div className="fc-content">
                                <h3>Real-Time Risk Analytics</h3>
                                <p>Live predictions on patient deterioration risk, updated continuously as vitals change.</p>

                                <div className="fc-dark-mockup">
                                    <div className="fc-mockup-header">
                                        <div className="fc-logo-box">
                                            <img src={logoImg} alt="Cortex" className="w-5 h-5 object-contain" />
                                        </div>
                                        <div className="fc-header-text">
                                            <span className="fc-brand">Cortex AI</span>
                                            <span className="fc-subtitle">Patient summary - ICU Ward 3B:</span>
                                        </div>
                                    </div>

                                    <div className="fc-stat-row">
                                        <ArrowUp size={24} className="text-white" />
                                        <span className="fc-stat-number">99.98%</span>
                                        <span className="fc-stat-label">Prediction<br />Accuracy</span>
                                    </div>
                                    <div className="fc-stat-row">
                                        <ArrowUp size={24} className="text-white" />
                                        <span className="fc-stat-number">44</span>
                                        <span className="fc-stat-label">Clinical<br />Features</span>
                                    </div>
                                    <div className="fc-stat-row fc-stat-muted">
                                        <span className="fc-stat-symbol">&lt;</span>
                                        <span className="fc-stat-number">1ms</span>
                                        <span className="fc-stat-label">Inference<br />Latency</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ScrollReveal>

                    {/* Column 2: Light Glass — Clinical Feature Analysis */}
                    <ScrollReveal animation="fade-up" delay="200ms">
                        <div className="fc-light fc-col-2">
                            <div className="fc-light-bg" />
                            <div className="fc-content">
                                <h3 className="fc-light-title">Clinical Feature Analysis</h3>
                                <p className="fc-light-desc">Every prediction is driven by physiological signals, medical history, and derived clinical scores - all in real time.</p>

                                <div className="fc-floating-mockup">
                                    <div className="fc-bubble bg-red-50 text-red-700 bubble-pos-1">SpO₂ Levels</div>
                                    <div className="fc-bubble bg-gray-50 text-black bubble-pos-2">Heart Rate Trend</div>
                                    <div className="fc-bubble bg-teal-50 text-teal-700 bubble-pos-3">MEWS Score</div>
                                    <div className="fc-bubble bg-white text-black shadow-sm bubble-pos-4">Blood Pressure</div>
                                    <div className="fc-bubble bg-white text-black shadow-sm bubble-pos-5">Comorbidities</div>

                                    <div className="fc-prompt-box">
                                        <div className="fc-prompt-header">
                                            <div className="fc-logo-box-dark">
                                                <img src={logoImg} alt="Cortex" className="w-4 h-4 object-contain" />
                                            </div>
                                            <span className="fc-brand-dark">Cortex AI</span>
                                        </div>
                                        <p className="fc-prompt-text">Which features are driving the high risk score for Patient #4821?</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ScrollReveal>

                    {/* Column 3: Light Glass — Explainable AI */}
                    <ScrollReveal animation="fade-up" delay="300ms">
                        <div className="fc-light fc-col-3">
                            <div className="fc-light-bg-3" />
                            <div className="fc-content">
                                <h3 className="fc-light-title">Explainable AI Decisions</h3>
                                <p className="fc-light-desc">Clinicians understand exactly why the model flagged a patient, with transparent feature importance and safety overrides.</p>

                                <div className="fc-chat-mockup">
                                    <div className="fc-chat-bubble fc-user-message">
                                        <span className="text-teal-600 font-medium">@CortexAI</span> Why is Patient #4821 flagged as high risk?
                                    </div>

                                    <div className="fc-chat-response">
                                        <div className="fc-prompt-header mb-3">
                                            <div className="fc-logo-box-dark">
                                                <img src={logoImg} alt="Cortex" className="w-4 h-4 object-contain" />
                                            </div>
                                            <span className="fc-brand-dark">Cortex AI</span>
                                        </div>
                                        <p className="fc-response-title">SpO₂ dropped below 90% threshold</p>
                                        <div className="fc-skeleton-line w-full" />
                                        <div className="fc-skeleton-line w-5/6" />
                                        <div className="fc-skeleton-line w-4/6 mb-4" />

                                        <p className="fc-response-title font-normal mt-4">Elevated MEWS Score: 7</p>
                                        <div className="fc-skeleton-line w-full" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ScrollReveal>

                </div>
            </div>
        </section>
    );
};

export default Features;
