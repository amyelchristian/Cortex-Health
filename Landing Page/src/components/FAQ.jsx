import React, { useState } from 'react';
import ScrollReveal from './ScrollReveal';
import { Plus, Minus } from 'lucide-react';

const faqs = [
    {
        q: "How accurate is the AI model?",
        a: "99.98% overall accuracy with 100% high-risk recall. Our XGBoost v3.0 model is trained on 1.41 million real patient records from 4 clinical datasets, with zero high-risk patients missed in testing."
    },
    {
        q: "What vital signs do I need to input?",
        a: "7 core vitals: Heart Rate, SpO₂, Blood Pressure (Systolic/Diastolic), MAP, Respiratory Rate, and Temperature. Along with age, gender, and medical history, the model engineers 44 clinical features for prediction."
    },
    {
        q: "How fast are predictions?",
        a: "Under 1ms (P95: 0.89ms) with batch throughput of 251,000+ predictions per second - providing true real-time risk assessment as vitals are entered."
    },
    {
        q: "What data was the model trained on?",
        a: "1.41 million real patient records from 4 clinical sources: PhysioNet Sepsis Challenge (1.55M records), MIMIC-III CHARTEVENTS (758K records), Kaggle Stroke Dataset (5.1K records), and MIMIC-IV Emergency Department data. 100% real patient data - no synthetic data used."
    },
    {
        q: "Is it safe for clinical use?",
        a: "Yes. Built-in safety checks automatically flag critical vitals (e.g., SpO₂ <90%, HR >150, SBP >180). The model passed 8/9 clinical test cases with all 3 safety-critical scenarios operational. Class weights penalize high-risk misses 8x more heavily."
    },
    {
        q: "Can it detect deterioration early?",
        a: "Yes. With 44 engineered features including emergency scores, critical flags, and composite risk indices, Cortex catches subtle deterioration patterns that manual assessment may overlook - with 100% recall on high-risk patients."
    },
    {
        q: "How does it compare to traditional monitoring?",
        a: "Cortex evaluates 44 features simultaneously in under 1ms, compared to manual MEWS/NEWS scoring which checks 6-7 parameters. With 99.98% accuracy and 10-fold cross-validation consistency of ±0.01%, it far exceeds traditional assessment reliability."
    }
];

const FAQ = () => {
    const [openIdx, setOpenIdx] = useState(null);

    return (
        <section className="py-[120px] relative overflow-hidden">

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                <ScrollReveal className="text-center mb-16" animation="fade-up">
                    <h2 className="font-outfit font-semibold text-4xl text-white mb-4">
                        Frequently Asked Questions
                    </h2>
                </ScrollReveal>

                <div className="space-y-4">
                    {faqs.map((faq, idx) => {
                        const isOpen = openIdx === idx;
                        return (
                            <ScrollReveal key={idx} delay={`${idx * 50}ms`}>
                                <div className={`glass-card-dark transition-all duration-300 ${isOpen ? 'shadow-[0_10px_30px_rgba(0,212,170,0.15)] border-mint-accent/50 bg-white/[0.08]' : 'hover:bg-white/[0.05]'}`}>
                                    <button
                                        className="w-full text-left px-6 py-5 flex justify-between items-center focus:outline-none"
                                        onClick={() => setOpenIdx(isOpen ? null : idx)}
                                    >
                                        <span className="font-outfit font-medium text-lg text-white pr-4">{faq.q}</span>
                                        <span className={`shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                                            {isOpen ? <Minus className="w-5 h-5 text-mint-accent" /> : <Plus className="w-5 h-5 text-mint-accent" />}
                                        </span>
                                    </button>
                                    <div
                                        className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 pb-6 opacity-100' : 'max-h-0 pb-0 opacity-0'}`}
                                    >
                                        <p className="font-inter text-white/70 leading-relaxed border-t border-white/10 pt-4">
                                            {faq.a}
                                        </p>
                                    </div>
                                </div>
                            </ScrollReveal>
                        )
                    })}
                </div>

            </div>
        </section>
    );
};

export default FAQ;
