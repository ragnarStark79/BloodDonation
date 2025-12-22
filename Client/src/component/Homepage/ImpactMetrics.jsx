import React, { useEffect, useRef, useState } from 'react';

const ImpactMetrics = () => {
    const [isVisible, setIsVisible] = useState(false);
    const sectionRef = useRef(null);

    const metrics = [
        { value: 15420, label: 'Lives Saved', color: 'text-red-500' },
        { value: 8500, label: 'Units Donated', color: 'text-slate-400' },
        { value: 120, label: 'Hospitals', color: 'text-slate-400' },
        { value: 35, label: 'Cities', color: 'text-slate-400' },
        { value: 15, label: 'Avg Response', suffix: 'm', color: 'text-green-500' },
    ];

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !isVisible) {
                        setIsVisible(true);
                    }
                });
            },
            { threshold: 0.5 }
        );

        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }

        return () => {
            if (sectionRef.current) {
                observer.unobserve(sectionRef.current);
            }
        };
    }, [isVisible]);

    return (
        <section
            ref={sectionRef}
            id="impact"
            className="section-base tint-warm max-w-none mx-auto px-12 relative z-10 border-y border-red-100/50"
        >
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-12 text-center">
                    {metrics.map((metric, index) => (
                        <MetricCounter
                            key={index}
                            target={metric.value}
                            label={metric.label}
                            suffix={metric.suffix}
                            color={metric.color}
                            isVisible={isVisible}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

const MetricCounter = ({ target, label, suffix = '', color, isVisible }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!isVisible) return;

        const speed = 200;
        const increment = target / speed;
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                setCount(target);
                clearInterval(timer);
            } else {
                setCount(Math.ceil(current));
            }
        }, 15);

        return () => clearInterval(timer);
    }, [isVisible, target]);

    return (
        <div>
            <div className="text-5xl font-black text-slate-800 mb-2 tracking-tighter flex justify-center items-end gap-1">
                <span>{count.toLocaleString()}</span>
                {suffix && <span className="text-2xl">{suffix}</span>}
            </div>
            <div className={`text-xs font-black uppercase tracking-widest ${color}`}>{label}</div>
        </div>
    );
};

export default ImpactMetrics;
