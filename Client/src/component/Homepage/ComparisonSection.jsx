import React from 'react';

const ComparisonSection = () => {
    const traditional = [
        'Manual phone calls & delays',
        'No real-time inventory visibility',
        'High wastage due to expiry',
        'Opaque supply chain',
    ];

    const liforce = [
        'AI-Assisted Instant Dispatch',
        'Live Inventory & Tracking',
        'Predictive Supply Allocation',
        '100% Transparent Journey',
    ];

    return (
        <section id="comparison" className="section-base tint-glass-container max-w-none mx-auto px-12 relative z-10">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-24">
                    <h2 className="text-5xl font-black mb-6">
                        Why <span className="text-red-500">LIFORCE?</span>
                    </h2>
                    <p className="text-slate-500 text-xl font-medium">The clear advantage over traditional systems.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-12">
                    {/* Traditional */}
                    <div className="p-10 rounded-[2.5rem] bg-slate-100 border border-slate-200 opacity-70">
                        <h4 className="text-2xl font-black text-slate-500 mb-8 uppercase tracking-widest">Traditional System</h4>
                        <ul className="space-y-6 text-slate-500 font-medium">
                            {traditional.map((item, index) => (
                                <li key={index} className="flex items-center gap-4">
                                    <span className="text-xl">❌</span> {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* LIFORCE */}
                    <div className="reveal glass p-10 relative overflow-hidden ring-4 ring-red-500/10">
                        <div className="absolute top-0 right-0 p-4 bg-red-500 text-white text-xs font-black uppercase tracking-widest rounded-bl-2xl shadow-lg">
                            Recommended
                        </div>
                        <h4 className="text-2xl font-black text-slate-800 mb-8 uppercase tracking-widest">LIFORCE Network</h4>
                        <ul className="space-y-6 text-slate-800 font-bold">
                            {liforce.map((item, index) => (
                                <li key={index} className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                        ✓
                                    </div>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ComparisonSection;
