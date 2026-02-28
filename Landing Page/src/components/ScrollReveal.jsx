import React, { useEffect, useRef, useState } from 'react';

const ScrollReveal = ({ children, className = '', animation = 'fade-up', duration = '700ms', delay = '0ms' }) => {
    const [isVisible, setIsVisible] = useState(false);
    const domRef = useRef();

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        const { current } = domRef;
        if (current) {
            observer.observe(current);
        }

        return () => {
            if (current) {
                observer.unobserve(current);
            }
        };
    }, []);

    const getAnimationClass = () => {
        switch (animation) {
            case 'fade-up':
                return isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10';
            case 'fade-in':
                return isVisible ? 'opacity-100' : 'opacity-0';
            case 'slide-left':
                return isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10';
            case 'slide-right':
                return isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10';
            default:
                return isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10';
        }
    };

    return (
        <div
            ref={domRef}
            className={`transition-all ease-out ${getAnimationClass()} ${className}`}
            style={{ transitionDuration: duration, transitionDelay: delay }}
        >
            {children}
        </div>
    );
};

export default ScrollReveal;
