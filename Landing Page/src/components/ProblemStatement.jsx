import React from 'react';
import { AlertTriangle, Database, Clock, TrendingDown, ArrowRight } from 'lucide-react';
import ScrollReveal from './ScrollReveal';

const problems = [
    {
        iconType: 'shape-sphere',
        title: 'Reactive, Not Proactive',
        desc: 'Patients seek care only after experiencing noticeable symptoms. Healthcare systems lack the infrastructure to assess risk before conditions become severe.',
    },
    {
        iconType: 'shape-disks',
        title: 'Untapped Health Data',
        desc: 'Vast volumes of patient data (medical history, lifestyle factors, clinical measurements) are generated but rarely leveraged for proactive individual risk assessment.',
    },
    {
        iconType: 'shape-ring',
        title: 'Manual & Generalized Methods',
        desc: 'Existing risk assessment methods are often manual, generalized, or inaccessible, making it difficult for individuals to understand their personal risk levels.',
    },
    {
        iconType: 'shape-pill',
        title: 'Missed Interventions',
        desc: 'Patients miss critical early intervention windows, leading to delayed diagnosis, increased treatment costs, and significantly poorer long-term health outcomes.',
    },
];

const ProblemStatement = () => {
    return (
        <section className="ps-section">

            {/* Decorative blurred orbs */}
            <div className="absolute top-[-200px] left-[-100px] w-[500px] h-[500px] bg-mint-accent/5 rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute bottom-[-200px] right-[-100px] w-[400px] h-[400px] bg-mint-accent/3 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-[1200px] mx-auto px-6 relative z-10">

                {/* Section Header */}
                <ScrollReveal className="text-center mb-16" animation="fade-up">
                    <div className="ps-badge">
                        <span className="ps-badge-dot" />
                        The Problem With Reactive Healthcare
                    </div>
                    <h2 className="ps-heading">
                        Stop Reacting to Health Crises.
                        <span className="ps-heading-highlight"> Start Predicting Them.</span>
                    </h2>
                    <p className="ps-subheading">
                        Millions of Patients Face Preventable Risks - The Data Exists. The Gap Is Acting On It Early.
                    </p>
                </ScrollReveal>

                {/* Problem Cards Grid */}
                <div className="ps-problem-grid">
                    {problems.map((p, i) => {
                        return (
                            <ScrollReveal
                                key={i}
                                className="ps-problem-card"
                                animation="fade-up"
                                delay={`${i * 100}ms`}
                            >
                                <div className="ps-card-inner">
                                    <div className="ps-card-shine" />

                                    {/* Custom Apple-Style 3D CSS Illustration */}
                                    <div className={`ps-ui-illustration ui-${p.iconType}`}>
                                        {p.iconType === 'shape-sphere' && (
                                            <div className="ui-sphere">
                                                <div className="ui-sphere-highlight" />
                                                <div className="ui-sphere-glow" />
                                            </div>
                                        )}
                                        {p.iconType === 'shape-disks' && (
                                            <div className="ui-disks-container">
                                                <div className="ui-disk ui-disk-1" />
                                                <div className="ui-disk ui-disk-2" />
                                                <div className="ui-disk ui-disk-3" />
                                                <div className="ui-disk-glow" />
                                            </div>
                                        )}
                                        {p.iconType === 'shape-ring' && (
                                            <div className="ui-ring-container">
                                                <div className="ui-ring-outer" />
                                                <div className="ui-ring-inner">
                                                    <div className="ui-ring-dot" />
                                                </div>
                                                <div className="ui-ring-glow" />
                                            </div>
                                        )}
                                        {p.iconType === 'shape-pill' && (
                                            <div className="ui-pill-container">
                                                <div className="ui-pill ui-pill-main" />
                                                <div className="ui-pill ui-pill-shadow" />
                                                <div className="ui-pill-glow" />
                                            </div>
                                        )}
                                    </div>

                                    <h3 className="ps-problem-title">{p.title}</h3>
                                    <p className="ps-problem-desc">{p.desc}</p>
                                </div>
                            </ScrollReveal>
                        );
                    })}
                </div>

                {/* Full Statement Block */}
                <ScrollReveal animation="fade-up" delay="200ms">
                    <div className="ps-statement-card">
                        <div className="ps-card-shine" />
                        <div className="ps-statement-inner">
                            <div className="ps-statement-left">
                                <div className="ps-statement-label">Problem Statement</div>
                                <p className="ps-statement-body">
                                    Patients often remain unaware of their health risks until medical conditions become
                                    severe and symptomatic. Although large volumes of patient health data, medical
                                    history, lifestyle factors, and clinical measurements, are generated over time,
                                    this information is rarely used to proactively assess individual health risks.
                                </p>
                                <p className="ps-statement-body">
                                    Current healthcare systems primarily follow a <strong>reactive approach</strong>, where
                                    patients seek care only after experiencing noticeable symptoms. Existing risk assessment
                                    methods are often manual, generalized, or inaccessible to patients.
                                </p>
                                <p className="ps-statement-body">
                                    As a result, many patients miss critical opportunities for early intervention and
                                    preventive care, leading to <strong>delayed diagnosis</strong>, increased treatment
                                    costs, and poorer health outcomes.
                                </p>
                            </div>

                            <div className="ps-statement-right">
                                <div className="ps-need-card">
                                    <div className="ps-need-label">The Need</div>
                                    <p className="ps-need-text">
                                        A scalable, data-driven healthcare analytics solution that empowers patients with
                                        early risk insights and supports proactive health decision-making.
                                    </p>
                                    <div className="ps-need-tags">
                                        <span className="ps-tag">Scalable</span>
                                        <span className="ps-tag">Data-Driven</span>
                                        <span className="ps-tag">Patient-Centric</span>
                                        <span className="ps-tag">Proactive</span>
                                    </div>
                                    <button className="ps-need-cta">
                                        See Our Solution <ArrowRight size={16} />
                                    </button>
                                </div>

                                <div className="ps-impact-row">
                                    {[
                                        { val: '3×', label: 'Higher Treatment Cost\nwhen diagnosed late' },
                                        { val: '70%', label: 'Conditions Preventable\nwith early action' },
                                    ].map((stat, i) => (
                                        <div className="ps-impact-stat" key={i}>
                                            <span className="ps-impact-val">{stat.val}</span>
                                            <span className="ps-impact-label" style={{ whiteSpace: 'pre-line' }}>{stat.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </ScrollReveal>

            </div>
        </section>
    );
};

export default ProblemStatement;
