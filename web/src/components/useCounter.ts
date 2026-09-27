import { useEffect, useRef, useState } from 'react';

export function useCounter(finalValue: string, duration: number = 1500) {
  const [displayValue, setDisplayValue] = useState('0');
  const countRef = useRef(0);
  const animationRef = useRef<number | undefined>(undefined);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimatedRef.current) {
          hasAnimatedRef.current = true;
          
          // Extract the numeric part from the value (handle cases like "20+", "100+", "6", "1:1")
          const numericValue = parseInt(finalValue.replace(/\D/g, '')) || 0;
          const nonNumericPart = finalValue.replace(/\d/g, '');
          
          const startTime = Date.now();
          
          const animate = () => {
            const now = Date.now();
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for smooth animation
            const easeOutQuad = 1 - Math.pow(1 - progress, 2);
            const currentValue = Math.floor(numericValue * easeOutQuad);
            
            setDisplayValue(currentValue + nonNumericPart);
            
            if (progress < 1) {
              animationRef.current = requestAnimationFrame(animate);
            } else {
              setDisplayValue(finalValue);
            }
          };
          
          animationRef.current = requestAnimationFrame(animate);
        }
      },
      { threshold: 0.1 }
    );

    const element = document.querySelector('.learning-numbers__value');
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      observer.disconnect();
    };
  }, [finalValue, duration]);

  return displayValue;
}
