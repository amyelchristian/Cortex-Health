import React from 'react';
import ScrollReveal from './ScrollReveal';
import { ArrowRight } from 'lucide-react';

const FinalCTA = ({ onOpenAuth }) => {
    return (
        <section className="py-[120px] relative overflow-hidden flex items-center justify-center text-center px-4 bg-transparent">
            {/* Dark abstract lighting overlay to match full website */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-[120px] pointer-events-none z-0"></div>

            {/* Subtle grid pattern overlay */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay z-0"></div>

            <div className="relative z-10 max-w-4xl mx-auto w-full p-12 md:p-20 rounded-[32px] border border-white/10
                            bg-white/[0.03] backdrop-blur-[60px] saturate-150
                            shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-1px_0_rgba(255,255,255,0.02)]">

                <ScrollReveal animation="fade-up">
                    <h2 className="font-outfit font-bold text-4xl md:text-5xl text-white mb-6 leading-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)]">
                        Predict Deterioration.<br />Save Lives.
                    </h2>
                    <p className="font-inter font-normal text-lg text-white/70 max-w-2xl mx-auto mb-10">
                        Cortex AI analyzes 44 clinical features in under 1ms to predict patient deterioration with 99.98% accuracy and 100% high-risk recall - so your team can act first.
                    </p>

                    <button
                        className="group relative inline-flex items-center justify-center font-inter font-semibold transition-all duration-300 rounded-full px-8 py-4 md:px-12 md:py-5 overflow-hidden
                            bg-white/10 backdrop-blur-xl
                            text-white border border-white/20
                            shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.2),inset_0_-1px_0_rgba(0,0,0,0.2)]
                            hover:bg-white/20 hover:border-white/40 hover:scale-105 hover:shadow-[0_15px_40px_rgba(255,255,255,0.15),inset_0_1px_0_rgba(255,255,255,0.4)]"
                        onClick={() => window.location.href = '/signup/index.html'}
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            See Cortex AI in Action
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </span>
                    </button>

                    <p className="font-inter text-sm text-white/50 mt-6 font-medium">
                        Built for India Tech Summit Innovate 2026 • 99.98% Accuracy • Explainable AI
                    </p>
                </ScrollReveal>

            </div>
        </section>
    );
};

export default FinalCTA;
