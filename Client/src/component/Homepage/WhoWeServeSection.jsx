import React from 'react';

const WhoWeServeSection = () => {
    const stakeholders = [
        {
            icon: '🏥',
            title: 'Hospitals',
            description: 'Instant access to blood inventory, AI-driven demand forecasting, and emergency dispatch protocols.',
            color: 'red',
            link: '#',
            linkText: 'Partner with us →',
        },
        {
            icon: '👨‍👩‍👧',
            title: 'Donors',
            description: 'Transparent tracking of your blood request and direct connection to compatible donors in real-time.',
            color: 'blue',
            link: '#',
            linkText: 'Find Help →',
        },
        {
            icon: '🏥',
            title: 'Blood Bank',
            description: 'Efficient inventory management, cold-chain monitoring, and automated distribution.',
            color: 'teal',
            link: '#',
            linkText: 'Connect System →',
        },
    ];

    const colorClasses = {
        red: {
            bg: 'bg-red-100',
            text: 'text-red-500',
            btnBg: 'bg-red-500',
        },
        blue: {
            bg: 'bg-blue-100',
            text: 'text-blue-500',
            btnBg: 'bg-blue-500',
        },
        teal: {
            bg: 'bg-teal-100',
            text: 'text-teal-600',
            btnBg: 'bg-teal-500',
        },
    };

    return (
        <section id="serve" className="section-base tint-cool max-w-7xl mx-auto px-12 relative z-10">
            <div className="separator-glow"></div>
            <div className="text-center mb-20">
                <h2 className="text-5xl font-black mb-6">
                    Who We <span className="text-red-500">Serve</span>
                </h2>
                <p className="text-slate-500 text-xl max-w-2xl mx-auto">
                    Our ecosystem connects every stakeholder in the healthcare chain to ensure no life is lost due to shortage.
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-10">
                {stakeholders.map((item, index) => {
                    const colors = colorClasses[item.color];
                    return (
                        <div
                            key={index}
                            className="reveal glass p-10 relative overflow-hidden group hover:bg-white/60 transition duration-500"
                        >
                            <div className={`absolute top-0 right-0 w-32 h-32 ${colors.bg} rounded-bl-full -mr-8 -mt-8 transition group-hover:scale-110`}></div>
                            <div className="relative z-10">
                                <div className={`w-16 h-16 ${colors.btnBg} rounded-2xl flex items-center justify-center text-3xl shadow-lg mb-8 text-white`}>
                                    {item.icon}
                                </div>
                                <h3 className="text-2xl font-black mb-4 text-slate-800">{item.title}</h3>
                                <p className="text-slate-600 leading-relaxed mb-6">{item.description}</p>
                                <a href={item.link} className={`${colors.text} font-black uppercase text-xs tracking-widest hover:underline`}>
                                    {item.linkText}
                                </a>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

export default WhoWeServeSection;
