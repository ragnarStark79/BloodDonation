import React from 'react';
import { useNavigate } from 'react-router-dom';

const PremiumNavbar = () => {
    const navigate = useNavigate();

    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <nav className="flex justify-between items-center px-8 md:px-12 py-8 w-full max-w-[1400px] mx-auto relative z-20">
            <div className="text-3xl font-black tracking-tighter flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500 rounded-2xl flex items-center justify-center shadow-xl rotate-12">
                    <span className="text-white text-lg">🩸</span>
                </div>
                <span className="text-slate-800">
                    LIF<span className="text-red-500 underline decoration-red-200 underline-offset-4">ORCE</span>
                </span>
            </div>

            <div className="hidden md:flex gap-12 text-[11px] font-black uppercase tracking-[0.25em] text-slate-500">
                <button onClick={() => scrollToSection('how-it-works')} className="hover:text-red-500 transition">
                    Process
                </button>
                <button onClick={() => scrollToSection('serve')} className="hover:text-red-500 transition">
                    Impact
                </button>
                <button onClick={() => scrollToSection('features')} className="hover:text-red-500 transition">
                    Features
                </button>
                <button onClick={() => scrollToSection('stories')} className="hover:text-red-500 transition">
                    Stories
                </button>
            </div>

            <button
                onClick={() => navigate('/login')}
                className="glass px-10 py-3 text-xs font-black shadow-lg hover:bg-white transition uppercase active:scale-95 duration-200"
            >
                Login
            </button>
        </nav>
    );
};

export default PremiumNavbar;
