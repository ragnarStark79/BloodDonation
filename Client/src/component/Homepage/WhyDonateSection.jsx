import React from 'react';

const WhyDonateSection = () => {
    const benefits = [
        {
            icon: (
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
            ),
            title: 'Save Lives',
            description: 'One blood donation can save up to three lives. Your contribution makes a real difference.',
        },
        {
            icon: (
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            ),
            title: 'Help Community',
            description: 'Blood is always needed in hospitals for emergencies, surgeries, and cancer treatments.',
        },
        {
            icon: (
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            ),
            title: 'Health Benefits',
            description: 'Regular donation can reduce harmful iron stores and maintain cardiovascular health.',
        },
        {
            icon: (
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
            ),
            title: 'Be a Hero',
            description: 'Join thousands of donors making an impact. Your act of kindness is invaluable.',
        },
    ];

    return (
        <section id="why-donate" className="section-base tint-warm max-w-7xl mx-auto px-12 relative z-10">
            <div className="separator-glow"></div>
            <div className="text-center mb-20">
                <h2 className="text-5xl font-black mb-6">
                    Why Donate <span className="text-red-500">Blood?</span>
                </h2>
                <p className="text-slate-500 text-xl font-medium">
                    Every pint of blood donated can make a life-saving difference.
                </p>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
                {benefits.map((benefit, index) => (
                    <div key={index} className="reveal glass p-8 text-left hover:scale-105 transition duration-500">
                        <div className="h-24 mb-6 flex items-center justify-start">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-100 to-red-50 flex items-center justify-center shadow-[0_10px_20px_rgba(239,68,68,0.15)] border border-white/50">
                                {benefit.icon}
                            </div>
                        </div>
                        <h4 className="font-black text-xl mb-3 text-slate-800">{benefit.title}</h4>
                        <p className="text-slate-500 text-sm leading-relaxed">{benefit.description}</p>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default WhyDonateSection;
