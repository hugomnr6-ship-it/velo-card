"use client";

import { useState, useEffect } from "react";

export function useCountUp(target: number, duration: number = 1500) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const startTime = performance.now();

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
  }, [target, duration]);

  return count;
}
