import React from 'react';
import logoUrl from '../assets/transparent-logo.png'; // Using the navbar logo

const Footer = () => {
    return (
        <footer className="pt-20 pb-10 border-t border-white/5 relative overflow-hidden">

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-12 mb-16">

                    {/* Left: Brand */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <img src={logoUrl} alt="Cortex AI Logo" className="w-12 h-12 object-contain drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]" />
                            <span className="font-outfit font-bold text-[28px] tracking-wide text-white">CORTEX</span>
                        </div>
                        <p className="font-inter text-white font-medium tracking-widest text-sm uppercase">
                            Predict. Prevent. Protect.
                        </p>
                    </div>

                    {/* Right: Horizontal Links */}
                    <div className="space-y-6 flex flex-col items-center">

                        {/* Product Row */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-8">
                            <h4 className="font-outfit font-semibold text-white w-24">Product:</h4>
                            <ul className="flex flex-wrap items-center gap-6">
                                <li><a href="#" className="font-inter text-white/60 hover:text-mint-accent transition-colors text-sm">Features</a></li>
                                <li><a href="#" className="font-inter text-white/60 hover:text-mint-accent transition-colors text-sm">How It Works</a></li>
                                <li><a href="#" className="font-inter text-white/60 hover:text-mint-accent transition-colors text-sm">Demo</a></li>
                            </ul>
                        </div>

                        {/* Resources Row */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-8">
                            <h4 className="font-outfit font-semibold text-white w-24">Resources:</h4>
                            <ul className="flex flex-wrap items-center gap-6">
                                <li><a href="https://github.com/#readme" target="_blank" rel="noopener noreferrer" className="font-inter text-white/60 hover:text-mint-accent transition-colors text-sm">Documentation</a></li>
                                <li><a href="https://cortex-agent-472595500035.us-central1.run.app/docs" target="_blank" rel="noopener noreferrer" className="font-inter text-white/60 hover:text-mint-accent transition-colors text-sm">API Docs</a></li>
                                <li><a href="https://github.com/" target="_blank" rel="noopener noreferrer" className="font-inter text-white/60 hover:text-mint-accent transition-colors text-sm">GitHub</a></li>
                            </ul>
                        </div>

                    </div>

                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-white/10 flex flex-col justify-center items-center text-center">
                    <p className="font-inter text-white/50 text-xs">
                        © 2026 Cortex Health. Built for India Tech Summit Innovate 2026
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
