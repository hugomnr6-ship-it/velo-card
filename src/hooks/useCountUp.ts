"use client";

import { useState, useEffect, useRef } from "react";

export function useCountUp(
  target: number,
  duration: number = 1500,
  options?: { enabled?: boolean; delay?: number }
) {
  const [count, setCount] = useState(0);
  const enabled = options?.enabled ?? true;
  const delay = options?.delay ?? 0;
  const prevTarget = useRef(target);

  useEffect(() => {
    if (!enabled) {
      setCount(0);
      return;
    }

    const timeout = setTimeout(() => {
      const startValue = prevTarget.current !== target ? prevTarget.current : 0;
      const startTime = performance.now();

      function animate(now: number) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
        setCount(Math.round(startValue + (target - startValue) * eased));
        if (progress < 1) requestAnimationFrame(animate);
      }

      requestAnimationFrame(animate);
      prevTarget.current = target;
    }, delay);

    return () => clearTimeout(timeout);
  }, [target, duration, enabled, delay]);

  return count;
}
