import React, { useEffect, useState } from 'react';
import MeshBackground from './MeshBackground';
import ThreeJSParticles from './ThreeJSParticles';
import PremiumNavbar from './PremiumNavbar';
import HeroSection from './HeroSection';
import WhyDonateSection from './WhyDonateSection';
import HowItWorksSection from './HowItWorksSection';
import WhoWeServeSection from './WhoWeServeSection';
import ComparisonSection from './ComparisonSection';
import FeaturesSection from './FeaturesSection';
import ImpactMetrics from './ImpactMetrics';
import StoriesCarousel from './StoriesCarousel';
import PremiumFooter from './PremiumFooter';
import './premium-home.css';

const NewHome = () => {
    const [scrollProgress, setScrollProgress] = useState(0);

    useEffect(() => {
        // Import Google Font
        const link = document.createElement('link');
        link.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;800&display=swap';
        link.rel = 'stylesheet';
        document.head.appendChild(link);

        // Scroll progress handler
        const handleScroll = () => {
            const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = (winScroll / height) * 100;
            setScrollProgress(scrolled);
        };

        window.addEventListener('scroll', handleScroll);

        // Scroll reveal observer
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('active');
                    }
                });
            },
            { threshold: 0.1 }
        );

        document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

        return () => {
            window.removeEventListener('scroll', handleScroll);
            observer.disconnect();
            document.head.removeChild(link);
        };
    }, []);

    return (
        <div className="bg-white min-h-screen font-['Plus_Jakarta_Sans',sans-serif] overflow-x-hidden">
            {/* Scroll Progress Bar */}
            <div className="scroll-progress" style={{ width: `${scrollProgress}%` }}></div>

            {/* Background Effects */}
            <MeshBackground />
            <ThreeJSParticles />

            {/* Navigation */}
            <PremiumNavbar />

            {/* Main Content */}
            <main>
                <HeroSection />
                <WhyDonateSection />
                <HowItWorksSection />
                <WhoWeServeSection />
                <ComparisonSection />
                <FeaturesSection />
                <ImpactMetrics />
                <StoriesCarousel />
            </main>

            {/* Footer */}
            <PremiumFooter />
        </div>
    );
};

export default NewHome;
