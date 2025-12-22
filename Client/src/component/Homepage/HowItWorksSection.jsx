import React from 'react';

const HowItWorksSection = () => {
    const steps = [
        {
            number: '01',
            title: 'Register',
            description: 'Sign up online or visit a donation center. Fill out a quick health questionnaire.',
        },
        {
            number: '02',
            title: 'Health Check',
            description: 'Quick health screening including blood pressure, temperature, and hemoglobin levels.',
        },
        {
            number: '03',
            title: 'Donate',
            description: 'The donation process takes about 10 minutes. Relax while our staff takes care of you.',
        },
        {
            number: '04',
            title: 'Save Lives',
            description: 'Your blood is tested, processed, and delivered to hospitals to help patients in need.',
        },
    ];

    return (
        <section id="how-it-works" className="section-base tint-cool max-w-7xl mx-auto px-12 relative z-10">
            <div className="separator-glow"></div>
            <div className="text-center mb-24">
                <h2 className="text-5xl font-black mb-6">
                    How It <span className="text-red-500">Works</span>
                </h2>
                <p className="text-slate-500 text-xl font-medium">
                    The donation process is simple, safe, and takes less than an hour.
                </p>
            </div>

            {/* Timeline Grid */}
            <div className="grid md:grid-cols-4 gap-8 relative">
                {/* Connecting Line (Desktop) */}
                <div className="hidden md:block absolute top-12 left-0 w-full h-1 bg-gradient-to-r from-red-100 via-red-200 to-red-100 -z-10 transform scale-x-90"></div>

                {steps.map((step, index) => (
                    <div
                        key={index}
                        className="reveal glass p-8 relative pt-16 hover:-translate-y-2 transition duration-500"
                        style={{ transitionDelay: `${index * 100}ms` }}
                    >
                        <div className="absolute -top-6 left-8 w-14 h-14 rounded-full bg-gradient-to-br from-red-600 to-red-400 border-4 border-white shadow-xl flex items-center justify-center text-white font-black text-lg z-10 step-shadow">
                            {step.number}
                        </div>
                        <h4 className="font-black text-xl mb-3 text-slate-800">{step.title}</h4>
                        <p className="text-slate-500 text-sm leading-relaxed">{step.description}</p>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default HowItWorksSection;
