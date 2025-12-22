import React, { useRef } from 'react';

const StoriesCarousel = () => {
    const stories = [
        {
            icon: '🩸',
            badge: 'Blood Type',
            badgeColor: 'bg-red-50 text-red-500 border-red-100',
            iconBg: 'bg-red-50 shadow-red-100',
            quote: 'The real-time tracking gave me goosebumps. Knowing my donation saved a child instantly.',
            highlight: 'goosebumps',
            highlightColor: 'text-red-500 decoration-red-200',
            name: 'Marcus T.',
            id: '#DONOR-882',
            avatarGradient: 'from-red-400 to-orange-300',
        },
        {
            icon: '🏥',
            badge: 'Verified Partner',
            badgeColor: 'bg-blue-50 text-blue-500 border-blue-100',
            iconBg: 'bg-blue-50 shadow-blue-100',
            quote: "LIFORCE's AI dispatch lowered our emergency response time by 40%. A game changer for trauma.",
            highlight: '40%',
            highlightColor: 'text-blue-500 decoration-blue-200',
            name: 'Dr. Sarah L.',
            id: '#HOSP-104',
            avatarGradient: 'from-blue-400 to-indigo-300',
            delay: '1.2s',
        },
        {
            icon: '🛡️',
            badge: 'Security Audit',
            badgeColor: 'bg-emerald-50 text-emerald-500 border-emerald-100',
            iconBg: 'bg-emerald-50 shadow-emerald-100',
            quote: 'The transparency protocols are top-tier. Every unit is traceable, verifiable, and secure.',
            highlight: 'traceable',
            highlightColor: 'text-emerald-500 decoration-emerald-200',
            name: 'James R.',
            id: '#AUDIT-559',
            avatarGradient: 'from-emerald-400 to-teal-300',
            delay: '2.4s',
        },
    ];

    // Duplicate stories for seamless loop
    const allStories = [...stories, ...stories];

    const handleMouseMove = (e, card) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -10;
        const rotateY = ((x - centerX) / centerX) * 10;

        card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;

        const glow = card.querySelector('.glow-effect');
        if (glow) {
            glow.style.background = `radial-gradient(600px circle at ${x}px ${y}px, rgba(255,255,255,0.7), transparent 40%)`;
        }
    };

    const handleMouseLeave = (card) => {
        card.style.transform = 'rotateX(0) rotateY(0) scale(1)';
        const glow = card.querySelector('.glow-effect');
        if (glow) {
            glow.style.background = 'transparent';
        }
    };

    return (
        <section id="stories" className="section-base relative z-10 overflow-hidden py-24 bg-slate-50/50">
            <div className="max-w-[1400px] mx-auto px-8 md:px-12 mb-16 relative z-20">
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-[1.1]">
                    Where Technology<span className="text-red-500 font-serif"> Meets Heartbeats.</span>
                </h2>
            </div>

            <div className="w-full relative pause-on-hover">
                {/* Gradient Masks */}
                <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#fcfcfc] to-transparent z-20"></div>
                <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#fcfcfc] to-transparent z-20"></div>

                <div className="slider-row flex gap-8 w-max animate-[scroll-infinite_60s_linear_infinite] px-8 pl-12">
                    {allStories.map((story, index) => (
                        <div key={index} className="tilt-wrapper w-[350px]">
                            <div
                                className="tilt-card story-glass rounded-[1.5rem] p-8 relative overflow-hidden group cursor-default h-full"
                                onMouseMove={(e) => handleMouseMove(e, e.currentTarget)}
                                onMouseLeave={(e) => handleMouseLeave(e.currentTarget)}
                            >
                                <div className="glow-effect absolute inset-0 pointer-events-none z-0 mix-blend-overlay opacity-60 transition-opacity duration-300"></div>
                                <div className="relative z-10 flex flex-col h-full justify-between">
                                    <div>
                                        <div className="flex justify-between items-start mb-6 tilt-content">
                                            <div
                                                className={`w-12 h-12 ${story.iconBg} rounded-xl flex items-center justify-center float-icon shadow-lg`}
                                                style={{ animationDelay: story.delay }}
                                            >
                                                <span className="text-xl">{story.icon}</span>
                                            </div>
                                            <span className={`${story.badgeColor} px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm`}>
                                                {story.badge}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-800 leading-snug mb-6 tilt-content">
                                            "{story.quote.split(story.highlight)[0]}
                                            <span className={`${story.highlightColor} underline decoration-2 underline-offset-4`}>
                                                {story.highlight}
                                            </span>
                                            {story.quote.split(story.highlight)[1]}"
                                        </h3>
                                    </div>
                                    <div className="flex items-center gap-3 pt-5 border-t border-slate-200/50 tilt-content">
                                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${story.avatarGradient} shadow-md`}></div>
                                        <div>
                                            <div className="text-xs font-black text-slate-900">{story.name}</div>
                                            <div className="text-[10px] text-slate-500 font-mono">{story.id}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default StoriesCarousel;
