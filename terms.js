/* Terms page logic */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
    const cursorGlow = document.getElementById('cursorGlow');
    if (!cursorGlow) {
        return;
    }

    const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reducedMotionEnabled = reduceMotionQuery.matches;
    if (reducedMotionEnabled) {
        cursorGlow.style.display = 'none';
    }

    let mouseX = 0;
    let mouseY = 0;
    let glowX = 0;
    let glowY = 0;
    let animationFrameId = null;
    let isAnimating = false;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    }, { passive: true });

    function animateGlow() {
        if (!isAnimating) {
            return;
        }

        glowX += (mouseX - glowX) * 0.1;
        glowY += (mouseY - glowY) * 0.1;

        cursorGlow.style.left = `${glowX}px`;
        cursorGlow.style.top = `${glowY}px`;

        animationFrameId = requestAnimationFrame(animateGlow);
    }

    function startAnimation() {
        if (isAnimating || reducedMotionEnabled || document.hidden) {
            return;
        }

        isAnimating = true;
        animationFrameId = requestAnimationFrame(animateGlow);
    }

    function stopAnimation() {
        isAnimating = false;
        if (animationFrameId !== null) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    }

    function handleReducedMotionChange(event) {
        reducedMotionEnabled = event.matches;

        if (event.matches) {
            stopAnimation();
            cursorGlow.style.display = 'none';
            return;
        }

        cursorGlow.style.display = '';
        startAnimation();
    }

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopAnimation();
        } else {
            startAnimation();
        }
    });

    if (typeof reduceMotionQuery.addEventListener === 'function') {
        reduceMotionQuery.addEventListener('change', handleReducedMotionChange);
    } else if (typeof reduceMotionQuery.addListener === 'function') {
        reduceMotionQuery.addListener(handleReducedMotionChange);
    }

    window.addEventListener('beforeunload', stopAnimation, { once: true });
    startAnimation();
});

