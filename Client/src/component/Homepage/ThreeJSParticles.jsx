import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const ThreeJSParticles = () => {
    const containerRef = useRef(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Scene setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        containerRef.current.appendChild(renderer.domElement);

        // Particles
        const geometry = new THREE.BufferGeometry();
        const count = 4000;
        const positions = new Float32Array(count * 3);

        for (let i = 0; i < count * 3; i++) {
            positions[i] = (Math.random() - 0.5) * 16;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: '#ff4d4d',
            size: 0.018,
            transparent: true,
            opacity: 0.75,
        });

        const mesh = new THREE.Points(geometry, material);
        scene.add(mesh);
        camera.position.z = 6;

        // Animation loop
        const animate = () => {
            requestAnimationFrame(animate);
            mesh.rotation.y += 0.0007;
            mesh.rotation.x += 0.0002;
            renderer.render(scene, camera);
        };
        animate();

        // Handle resize
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            if (containerRef.current && renderer.domElement) {
                containerRef.current.removeChild(renderer.domElement);
            }
            geometry.dispose();
            material.dispose();
            renderer.dispose();
        };
    }, []);

    return <div id="canvas-container" ref={containerRef}></div>;
};

export default ThreeJSParticles;
