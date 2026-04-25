import { useRef, useEffect, useCallback } from 'react';

interface UseTouchScrollOptions {
    enabled?: boolean;
    speed?: number;
}

export function useTouchScroll(options: UseTouchScrollOptions = {}) {
    const { enabled = true, speed = 1 } = options;
    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);
    const startY = useRef(0);
    const scrollTop = useRef(0);
    const lastY = useRef(0);
    const velocity = useRef(0);
    const lastTime = useRef(0);
    const animationFrame = useRef<number>();

    const handleTouchStart = useCallback((e: TouchEvent) => {
        if (!enabled) return;
        
        isDragging.current = true;
        startY.current = e.touches[0].clientY;
        lastY.current = e.touches[0].clientY;
        scrollTop.current = containerRef.current?.scrollTop || 0;
        lastTime.current = Date.now();
        velocity.current = 0;

        if (animationFrame.current) {
            cancelAnimationFrame(animationFrame.current);
        }
    }, [enabled]);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (!enabled || !isDragging.current) return;
        
        const currentY = e.touches[0].clientY;
        const deltaY = (lastY.current - currentY) * speed;
        const currentTime = Date.now();
        const deltaTime = currentTime - lastTime.current;

        if (deltaTime > 0) {
            velocity.current = deltaY / deltaTime;
        }

        lastY.current = currentY;
        lastTime.current = currentTime;

        if (containerRef.current) {
            containerRef.current.scrollTop = scrollTop.current + (startY.current - currentY) * speed;
        }
    }, [enabled, speed]);

    const handleTouchEnd = useCallback(() => {
        if (!enabled) return;
        
        isDragging.current = false;

        const applyMomentum = () => {
            if (Math.abs(velocity.current) > 0.1 && containerRef.current) {
                containerRef.current.scrollTop += velocity.current * 16;
                velocity.current *= 0.95;
                animationFrame.current = requestAnimationFrame(applyMomentum);
            }
        };

        if (Math.abs(velocity.current) > 0.5) {
            applyMomentum();
        }
    }, [enabled]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container || !enabled) return;

        container.addEventListener('touchstart', handleTouchStart, { passive: true });
        container.addEventListener('touchmove', handleTouchMove, { passive: false });
        container.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchmove', handleTouchMove);
            container.removeEventListener('touchend', handleTouchEnd);
            if (animationFrame.current) {
                cancelAnimationFrame(animationFrame.current);
            }
        };
    }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

    return { containerRef };
}