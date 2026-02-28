import React from 'react';
import { ActivitySquare, BrainCircuit, Activity, Lightbulb, User, Check, Settings } from 'lucide-react';
import ScrollReveal from './ScrollReveal';

const HowItWorks = () => {
    return (
        <section id="how-it-works" className="hiw-section">

            {/* Glowing background orbs */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-mint-accent/5 rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-mint-accent/5 rounded-full blur-[150px] pointer-events-none" />

            <div className="max-w-[1200px] mx-auto px-6 relative z-10">
                <ScrollReveal className="text-center mb-16" animation="fade-up">
                    <div className="hiw-badge">
                        <span className="hiw-badge-dot" />
                        HOW IT WORKS
                    </div>
                    <h2 className="hiw-heading">
                        Start In Four Steps And Grow With<br />
                        Secured, AI-Backed Predictions.
                    </h2>
                </ScrollReveal>

                <div className="hiw-glass-container">
                    {/* Step 1 */}
                    <div className="hiw-step-col">
                        <div className="hiw-step-header">
                            <span className="hiw-step-label">STEP ONE</span>
                            <h3 className="hiw-step-title">Create Account</h3>
                        </div>
                        <div className="hiw-card">
                            <div className="hiw-card-inner hiw-card-1">
                                <div className="hiw-glow-blob hiw-blob-purple" />
                                <div className="hiw-mockup hiw-window">
                                    <div className="hiw-avatar-placeholder">
                                        <User size={16} strokeWidth={2.5} color="#FFFFFF" />
                                    </div>
                                    <div className="hiw-line hiw-line-short" />
                                    <div className="hiw-line hiw-line-long" />
                                </div>
                                <div className="hiw-glass-panel" />
                            </div>
                        </div>
                        <div className="hiw-step-footer">
                            <span className="hiw-tag">Easy Setup!</span>
                        </div>
                    </div>

                    <div className="hiw-arrow-col">
                        <div className="hiw-arrow-circle">→</div>
                    </div>

                    {/* Step 2 */}
                    <div className="hiw-step-col">
                        <div className="hiw-step-header">
                            <span className="hiw-step-label">STEP TWO</span>
                            <h3 className="hiw-step-title">Input Patient Data</h3>
                        </div>
                        <div className="hiw-card">
                            <div className="hiw-card-inner hiw-card-2">
                                <div className="hiw-glow-blob hiw-blob-green" />
                                <div className="hiw-mockup hiw-browser">
                                    <div className="hiw-browser-header">
                                        <div className="hiw-dot" /><div className="hiw-dot" /><div className="hiw-dot" />
                                    </div>
                                    <div className="hiw-browser-body">
                                        <div className="hiw-search-bar" />
                                        <div className="hiw-check-circle">
                                            <Check size={12} strokeWidth={3} color="#FFFFFF" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="hiw-step-footer">
                            <span className="hiw-tag">Super Fast!</span>
                        </div>
                    </div>

                    <div className="hiw-arrow-col">
                        <div className="hiw-arrow-circle">→</div>
                    </div>

                    {/* Step 3 */}
                    <div className="hiw-step-col">
                        <div className="hiw-step-header">
                            <span className="hiw-step-label">STEP THREE</span>
                            <h3 className="hiw-step-title">AI Processing</h3>
                        </div>
                        <div className="hiw-card">
                            <div className="hiw-card-inner hiw-card-3">
                                <div className="hiw-glow-blob hiw-blob-orange" />
                                <div className="hiw-mockup hiw-cards-stack">
                                    <div className="hiw-stack-bg" />
                                    <div className="hiw-stack-fg">
                                        <div className="hiw-icon-circle">
                                            <Settings size={20} strokeWidth={2} className="animate-[spin_4s_linear_infinite]" />
                                        </div>
                                        <div className="hiw-line hiw-line-short mt-4" />
                                        <div className="hiw-line hiw-line-long" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="hiw-step-footer">
                            <span className="hiw-tag">Smart AI!</span>
                        </div>
                    </div>

                    <div className="hiw-arrow-col">
                        <div className="hiw-arrow-circle">→</div>
                    </div>

                    {/* Step 4 */}
                    <div className="hiw-step-col">
                        <div className="hiw-step-header">
                            <span className="hiw-step-label">STEP FOUR</span>
                            <h3 className="hiw-step-title">Instant Results</h3>
                        </div>
                        <div className="hiw-card">
                            <div className="hiw-card-inner hiw-card-4">
                                <div className="hiw-mockup hiw-floating-tags">
                                    <div className="hiw-float-tag hiw-tag-1">Finally</div>
                                    <div className="hiw-float-tag hiw-tag-2 hiw-tag-dark">Get Accurate Risk Prediction</div>
                                    <div className="hiw-float-tag hiw-tag-3">Act Early!</div>
                                </div>
                            </div>
                        </div>
                        <div className="hiw-step-footer">
                            <span className="hiw-tag">Proactive Care!</span>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default HowItWorks;
