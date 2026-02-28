import React, { useState, useEffect } from 'react';
import logoImg from '../assets/transparent-logo.png';
import { useAuth } from '../context/AuthContext';
import { LogOut, User } from 'lucide-react';

const Navbar = ({ onOpenAuth }) => {
    const [scrolled, setScrolled] = useState(false);
    const { currentUser, logout } = useAuth();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);

        // Smooth scrolling for exact request
        const links = document.querySelectorAll('.nav-center a');
        const handleLinkClick = (e) => {
            e.preventDefault();
            const target = document.querySelector(e.currentTarget.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        };

        links.forEach(link => {
            link.addEventListener('click', handleLinkClick);
        });

        return () => {
            window.removeEventListener('scroll', handleScroll);
            links.forEach(link => {
                link.removeEventListener('click', handleLinkClick);
            });
        };
    }, []);

    return (
        <nav className="navbar">
            <div className="nav-left">
                <div className="logo cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    <img src={logoImg} alt="Cortex Logo" className="navbar-logo-img" />
                    <span className="logo-text">CORTEX</span>
                </div>
            </div>

            <div className="nav-center">
                <a href="#home">Home</a>
                <a href="#features">Features</a>
                <a href="#how-it-works">How It Works</a>
            </div>

            <div className="nav-right flex items-center gap-4">
                {currentUser ? (
                    <div className="flex items-center gap-4">
                        <a href="/dashboard?tab=home" className="flex items-center gap-2.5 px-4 py-2 rounded-full backdrop-blur-xl text-sm transition-all hover:bg-white/10"
                            style={{
                                background: 'rgba(255,255,255,0.08)',
                                border: '1px solid rgba(255,255,255,0.12)',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.06)',
                                textDecoration: 'none'
                            }}>
                            <span className="text-white/90 font-medium">
                                {currentUser.displayName || currentUser.email?.split('@')[0] || 'User'}
                            </span>
                        </a>
                        <button
                            onClick={logout}
                            className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2 text-sm"
                            title="Log out"
                        >
                            <LogOut size={16} />
                            <span className="hidden md:inline">Log Out</span>
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => window.location.href = '/login/index.html'}
                            className="cta-button text-sm px-4 py-2"
                        >
                            Log In
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
