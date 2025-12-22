import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import khoonGif from '../../assets/Khoon.gif';

const HeroSection = () => {
    const navigate = useNavigate();
    const [selectedRole, setSelectedRole] = useState(null);

    const roles = [
        {
            id: 'donor',
            icon: '🩸',
            title: 'Donor',
            subtitle: 'Save Lives',
        },
        {
            id: 'hospital',
            icon: '🏥',
            title: 'Hospital',
            subtitle: 'Request Blood',
        },
        {
            id: 'bloodbank',
            icon: '🧪',
            title: 'Blood Bank',
            subtitle: 'Manage Supply',
        },
    ];

    return (
        <header className="relative z-10 max-w-[1400px] mx-auto px-8 md:px-12 pt-12 pb-32">
            <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="reveal text-left">
                    <h1 className="text-5xl md:text-7xl font-black leading-[1.05] mb-6 text-slate-800 tracking-tighter">
                        Bridging Lives. <br />
                        <span className="text-red-500">Future of Donation.</span>
                    </h1>
                    <p className="text-slate-600 text-lg md:text-xl mb-10 font-medium max-w-xl leading-relaxed">
                        Connect with our premium 3D network to save lives in your community with transparency, safety, and speed.
                    </p>
                    <div className="flex gap-6 mb-16">
                        <button
                            onClick={() => navigate('/signup')}
                            className="btn-gradient px-10 py-5 rounded-[2rem] font-black uppercase tracking-tighter text-lg active:scale-95 duration-200"
                        >
                            Register Now
                        </button>
                        <button
                            onClick={() => navigate('/login')}
                            className="glass px-10 py-5 rounded-[2rem] font-black uppercase tracking-tighter text-lg text-slate-700 active:scale-95 duration-200"
                        >
                            Learn More
                        </button>
                    </div>

                    {/* ROLE SELECTION */}
                    <div className="grid grid-cols-3 gap-4">
                        {roles.map((role) => (
                            <div
                                key={role.id}
                                onClick={() => setSelectedRole(role.id)}
                                className={`role-card glass p-4 cursor-pointer hover:bg-white/60 transition group ${selectedRole === role.id ? 'active' : ''
                                    }`}
                            >
                                <div className="text-2xl mb-2 group-hover:scale-110 transition">{role.icon}</div>
                                <h6 className="font-black text-sm text-slate-800">{role.title}</h6>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">
                                    {role.subtitle}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="reveal relative">
                    <div className="absolute inset-0 bg-gradient-to-tr from-red-500/20 to-blue-500/20 rounded-full blur-3xl -z-10"></div>
                    <img src={khoonGif} alt="3D Connected Blood Network" className="w-full drop-shadow-2xl animate-float" />
                </div>
            </div>
        </header>
    );
};

export default HeroSection;
