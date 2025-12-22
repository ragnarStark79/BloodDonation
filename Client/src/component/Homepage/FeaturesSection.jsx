import React from 'react';

const FeaturesSection = () => {
    const features = [
        {
            icon: '⚡',
            title: 'AI Dispatch',
            subtitle: 'Routes blood 40% faster.',
            description: 'Our algorithm considers traffic, urgency, and compatibility to find the fastest path instantly.',
        },
        {
            icon: '🧬',
            title: 'Smart Match',
            subtitle: 'Precision compatibility.',
            description: 'Matches not just blood type but 15+ antigens to ensure zero rejection risk for patients.',
        },
        {
            icon: '🛡️',
            title: 'Expiry Guard',
            subtitle: 'Zero wastage policy.',
            description: 'Automated alerts move near-expiry units to high-demand centers before they go to waste.',
        },
        {
            icon: '🗺️',
            title: 'Live Map',
            subtitle: 'Real-time visibility.',
            description: 'Watch your donation travel from center to hospital in real-time on our transparency dashboard.',
        },
    ];

    return (
        <section id="features" className="section-base tint-tech max-w-none mx-auto px-12 relative z-10">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-20">
                    <h2 className="text-5xl font-black mb-6">
                        Intelligent <span className="text-red-500">Technology</span>
                    </h2>
                    <p className="text-slate-500 text-xl max-w-2xl mx-auto">
                        Built with next-generation protocols to ensure safety and speed.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="group glass p-8 cursor-pointer hover:bg-slate-900 hover:text-white transition-all duration-300 h-80 flex flex-col justify-between"
                        >
                            <div>
                                <div className="text-4xl mb-6 group-hover:scale-110 transition">{feature.icon}</div>
                                <h4 className="font-black text-xl mb-2">{feature.title}</h4>
                                <p className="text-sm opacity-70 mb-4 font-medium">{feature.subtitle}</p>
                            </div>
                            <div className="h-0 overflow-hidden group-hover:h-auto opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100">
                                <p className="text-xs leading-relaxed text-slate-300">{feature.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeaturesSection;
