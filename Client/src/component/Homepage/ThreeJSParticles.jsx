import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const ThreeJSParticles = () => {
    const containerRef = useRef(null);

    useEffect(() => {
        if (!containerRef.current) return;

        let renderer, geometry, material, animationId;

        try {
            // Scene setup
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(
                75,
                window.innerWidth / window.innerHeight,
                0.1,
                1000
            );

            // Try to create WebGL renderer with error handling
            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            containerRef.current.appendChild(renderer.domElement);

            // Particles
            geometry = new THREE.BufferGeometry();
            const count = 4000;
            const positions = new Float32Array(count * 3);

            for (let i = 0; i < count * 3; i++) {
                positions[i] = (Math.random() - 0.5) * 16;
            }

            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

            material = new THREE.PointsMaterial({
                color: '#ff4d4d',
                size: 0.035,
                transparent: true,
                opacity: 0.9,
            });

            const mesh = new THREE.Points(geometry, material);
            scene.add(mesh);
            camera.position.z = 6;

            // Animation loop
            const animate = () => {
                animationId = requestAnimationFrame(animate);
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
                if (animationId) {
                    cancelAnimationFrame(animationId);
                }
                if (containerRef.current && renderer && renderer.domElement) {
                    try {
                        containerRef.current.removeChild(renderer.domElement);
                    } catch (e) {
                        // Element might already be removed
                    }
                }
                if (geometry) geometry.dispose();
                if (material) material.dispose();
                if (renderer) renderer.dispose();
            };
        } catch (error) {
            console.warn('WebGL not available, skipping 3D particles:', error.message);
            // Silently fail - the homepage will work without particles
            return () => {
                // Cleanup in case of partial initialization
                if (animationId) cancelAnimationFrame(animationId);
                if (geometry) geometry.dispose();
                if (material) material.dispose();
                if (renderer) renderer.dispose();
            };
        }
    }, []);

    return <div id="canvas-container" ref={containerRef}></div>;
};

export default ThreeJSParticles;
