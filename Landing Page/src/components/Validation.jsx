import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import ScrollReveal from './ScrollReveal';

const Validation = () => {
    return (
        <section id="validation" className="validation-section relative overflow-hidden py-[120px]">
            {/* Background green atmospheric glows */}
            <div className="val-bg-glow-1"></div>
            <div className="val-bg-glow-2"></div>

            <div className="max-w-6xl mx-auto px-6 relative z-10">

                <ScrollReveal className="text-center mb-16" animation="fade-up">
                    <h2 className="font-outfit font-bold text-4xl text-white mb-4">
                        Clinically Validated Performance
                    </h2>
                    <p className="font-inter text-gray-400 max-w-2xl mx-auto">
                        Trained on 1.41 million real patient records from 4 clinical datasets. Validated with 10-fold cross-validation and 9 clinical test cases.
                    </p>
                </ScrollReveal>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                    {/* Left: Glass Metrics Display */}
                    <ScrollReveal animation="slide-right">
                        <div className="val-glass-card">
                            <div className="space-y-8">

                                <div className="val-stat-block">
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="val-stat-label">Overall Accuracy</span>
                                        <span className="val-stat-value">99.98<span className="text-2xl">%</span></span>
                                    </div>
                                    <div className="val-progress-track">
                                        <div className="val-progress-fill" style={{ width: '99.98%' }}></div>
                                    </div>
                                </div>

                                <div className="val-stat-block">
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="val-stat-label">High-Risk Recall</span>
                                        <span className="val-stat-value">100.00<span className="text-2xl">%</span></span>
                                    </div>
                                    <div className="val-progress-track">
                                        <div className="val-progress-fill" style={{ width: '100%' }}></div>
                                    </div>
                                </div>

                                <div className="val-stat-block">
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="val-stat-label">Inference Time</span>
                                        <span className="val-stat-value">0.89<span className="text-2xl">ms</span></span>
                                    </div>
                                    <div className="val-progress-track">
                                        <div className="val-progress-fill" style={{ width: '99%' }}></div>
                                    </div>
                                </div>

                                <div className="val-stat-block">
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="val-stat-label">Train/Test Gap</span>
                                        <span className="val-stat-value">0.02<span className="text-2xl">%</span></span>
                                    </div>
                                    <div className="val-progress-track">
                                        <div className="val-progress-fill" style={{ width: '2%' }}></div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </ScrollReveal>

                    {/* Right: Pill Validation Points */}
                    <ScrollReveal animation="slide-left" delay="200ms">
                        <div className="space-y-4">

                            {[
                                "Trained on 1.41M real patient records from 4 clinical datasets",
                                "100% high-risk recall - zero critical patients missed",
                                "44 engineered features including emergency scores & critical flags",
                                "0.02% train/test gap - no overfitting, robust generalization",
                                "10-fold cross-validation: 99.98% ± 0.01% consistency"
                            ].map((point, idx) => (
                                <div key={idx} className="val-pill-card">
                                    <CheckCircle2 className="val-check-icon" />
                                    <span className="val-pill-text">{point}</span>
                                </div>
                            ))}

                        </div>
                    </ScrollReveal>

                </div>
            </div>
        </section>
    );
};

export default Validation;
