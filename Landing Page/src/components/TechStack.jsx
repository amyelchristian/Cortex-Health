import React from 'react';
import ScrollReveal from './ScrollReveal';
import { TrendingUp, Network, Zap, Presentation, Rocket } from 'lucide-react';
import kimiLogo from '../assets/kimi-logo.png';
import antigravityLogo from '../assets/antigravity-logo.png';
import openaiLogo from '../assets/openai-logo.png';
import googleAIStudioLogo from '../assets/google-ai-studio-logo.png';

// Logo component - uses SimpleIcons CDN for official colored brand SVGs
const Logo = ({ src, alt }) => {
    const [error, setError] = React.useState(false);
    if (error) return <span className="text-white/60 text-xs font-bold">{alt.slice(0, 2)}</span>;
    return (
        <img
            src={src}
            alt={alt}
            className="w-6 h-6 object-contain"
            onError={() => setError(true)}
        />
    );
};

const technologies = [
    {
        group: "AI Workspace",
        tech: "Google AI Studio",
        icon: <img src={googleAIStudioLogo} alt="Google AI Studio" className="w-7 h-7 object-contain" />,
    },
    {
        group: "LLM / AI",
        tech: "Gemini",
        icon: <Logo src="https://cdn.simpleicons.org/googlegemini" alt="Gemini" fallback="Ge" />,
    },
    {
        group: "LLM / AI",
        tech: "Chat GPT",
        icon: <img src={openaiLogo} alt="OpenAI" className="w-7 h-7 object-contain" />,
    },
    {
        group: "Presentation",
        tech: "Kimi Slides",
        icon: <img src={kimiLogo} alt="Kimi Slides" className="w-7 h-7 object-contain" />,
    },
    {
        group: "Agentic AI",
        tech: "Antigravity",
        icon: <img src={antigravityLogo} alt="Antigravity" className="w-7 h-7 object-contain" />,
    },
    {
        group: "LLM / AI",
        tech: "Claude",
        icon: <Logo src="https://cdn.simpleicons.org/anthropic" alt="Anthropic Claude" fallback="Cl" />,
    },
    {
        group: "Deployment",
        tech: "Vercel",
        icon: <Logo src="https://cdn.simpleicons.org/vercel" alt="Vercel" fallback="V" />,
    },
    {
        group: "Frontend",
        tech: "React",
        icon: <Logo src="https://cdn.simpleicons.org/react" alt="React" fallback="Re" />,
    },
    {
        group: "Cloud Infra",
        tech: "Google Cloud",
        icon: <Logo src="https://cdn.simpleicons.org/googlecloud" alt="Google Cloud" fallback="GC" />,
    },
    {
        group: "Backend / Auth",
        tech: "Google Firebase",
        icon: <Logo src="https://cdn.simpleicons.org/firebase" alt="Firebase" fallback="Fb" />,
    },
    {
        group: "Backend API",
        tech: "Fast API",
        icon: <Logo src="https://cdn.simpleicons.org/fastapi" alt="FastAPI" fallback="FA" />,
    },
    {
        group: "Search / AI",
        tech: "Perplexity",
        icon: <Logo src="https://cdn.simpleicons.org/perplexity" alt="Perplexity" fallback="Px" />,
    },
    {
        group: "ML Library",
        tech: "Sci-kit learn",
        icon: <Logo src="https://cdn.simpleicons.org/scikitlearn" alt="Scikit-learn" fallback="Sk" />,
    },
    {
        group: "Backend Core",
        tech: "Python",
        icon: <Logo src="https://cdn.simpleicons.org/python" alt="Python" fallback="Py" />,
    },
    {
        group: "Build Tool",
        tech: "Vite",
        icon: <Logo src="https://cdn.simpleicons.org/vite" alt="Vite" fallback="Vi" />,
    },
    {
        group: "Data Format",
        tech: "JSON",
        icon: <Logo src="https://cdn.simpleicons.org/json" alt="JSON" fallback="{}" />,
    },
    {
        group: "ML Model",
        tech: "Extra Trees",
        icon: <TrendingUp className="w-5 h-5" />,
    },
    {
        group: "ML Model",
        tech: "Random Forest",
        icon: <Network className="w-5 h-5" />,
    },
    {
        group: "ML Model",
        tech: "XGBoost",
        icon: <Logo src="https://cdn.simpleicons.org/xgboost" alt="XGBoost" fallback={<Zap className="w-5 h-5" />} />,
    },
    {
        group: "LLM / AI",
        tech: "Meta Llama 3",
        icon: <Logo src="https://cdn.simpleicons.org/meta" alt="Meta Llama 3" fallback="L3" />,
    },
    {
        group: "Deployment",
        tech: "Docker",
        icon: <Logo src="https://cdn.simpleicons.org/docker" alt="Docker" fallback="Dk" />,
    },
];

const TechStack = () => {
    return (
        <section className="py-[120px] relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                <ScrollReveal className="text-center mb-16" animation="fade-up">
                    <h2 className="font-outfit font-semibold text-4xl text-white mb-4">
                        Built With Cutting-Edge Technology
                    </h2>
                    <p className="font-inter text-white/60">A robust stack designed for scale, speed, and absolute reliability.</p>
                </ScrollReveal>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
                    {technologies.map((item, idx) => (
                        <ScrollReveal key={idx} delay={`${(idx % 4) * 50}ms`}>
                            <div className="glass-card-dark p-5 flex flex-col items-center justify-center gap-3 group hover:bg-mint-accent/10 hover:border-mint-accent/50 transition-all duration-300 h-full min-h-[130px]">
                                <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/80 group-hover:text-mint-accent group-hover:bg-mint-accent/20 transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(0,212,170,0.35)]">
                                    {item.icon}
                                </div>
                                <div className="text-center">
                                    <h4 className="font-inter font-semibold text-white/90 text-[14px] group-hover:text-white transition-colors leading-snug">
                                        {item.tech}
                                    </h4>
                                    <span className="text-[10px] font-mono text-mint-accent/70 uppercase tracking-widest mt-1 block">
                                        {item.group}
                                    </span>
                                </div>
                            </div>
                        </ScrollReveal>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default TechStack;
