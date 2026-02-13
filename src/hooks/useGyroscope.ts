"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface TiltValues {
  rotateX: number; // degrees
  rotateY: number; // degrees
}

const MAX_TILT_DESKTOP = 15;
const MAX_TILT_MOBILE = 8; // gentler on mobile
const SPRING_FACTOR = 0.06; // slightly smoother

function clamp(val: number, min: number, max: number) {
  return Math.min(max, Math.max(min, val));
}

export function useGyroscope(cardRef: React.RefObject<HTMLDivElement | null>) {
  const [tilt, setTilt] = useState<TiltValues>({ rotateX: 0, rotateY: 0 });
  const [isGyro, setIsGyro] = useState(false);
  const [needsIOSPermission, setNeedsIOSPermission] = useState(false);
  const targetRef = useRef<TiltValues>({ rotateX: 0, rotateY: 0 });
  const currentRef = useRef<TiltValues>({ rotateX: 0, rotateY: 0 });
  const rafRef = useRef<number>(0);

  // Smooth animation loop
  const animate = useCallback(() => {
    const target = targetRef.current;
    const current = currentRef.current;

    current.rotateX += (target.rotateX - current.rotateX) * SPRING_FACTOR;
    current.rotateY += (target.rotateY - current.rotateY) * SPRING_FACTOR;

    setTilt({ rotateX: current.rotateX, rotateY: current.rotateY });
    rafRef.current = requestAnimationFrame(animate);
  }, []);

  // Start animation loop
  useEffect(() => {
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [animate]);

  // Check if iOS permission is needed
  useEffect(() => {
    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof (DeviceOrientationEvent as any).requestPermission === "function"
    ) {
      setNeedsIOSPermission(true);
    }
  }, []);

  // Desktop: mouse tracking
  useEffect(() => {
    if (isGyro) return; // gyro takes priority

    function handleMouseMove(e: MouseEvent) {
      const card = cardRef.current;
      if (!card) return;

      const rect = card.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const offsetX = (e.clientX - centerX) / (rect.width / 2);
      const offsetY = (e.clientY - centerY) / (rect.height / 2);

      targetRef.current = {
        rotateX: clamp(-offsetY * MAX_TILT_DESKTOP, -MAX_TILT_DESKTOP, MAX_TILT_DESKTOP),
        rotateY: clamp(offsetX * MAX_TILT_DESKTOP, -MAX_TILT_DESKTOP, MAX_TILT_DESKTOP),
      };
    }

    function handleMouseLeave() {
      targetRef.current = { rotateX: 0, rotateY: 0 };
    }

    window.addEventListener("mousemove", handleMouseMove);
    const card = cardRef.current;
    card?.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      card?.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [cardRef, isGyro]);

  // Enable gyroscope (called on touch for iOS, auto for Android)
  const enableGyroscope = useCallback(async () => {
    try {
      // iOS permission
      if (
        typeof (DeviceOrientationEvent as any).requestPermission === "function"
      ) {
        const permission = await (
          DeviceOrientationEvent as any
        ).requestPermission();
        if (permission !== "granted") return;
      }

      function handleOrientation(e: DeviceOrientationEvent) {
        const beta = e.beta ?? 0;
        const gamma = e.gamma ?? 0;

        // Gentler multiplier for mobile (0.15 instead of 0.3)
        const normalizedX = clamp((beta - 45) * 0.15, -MAX_TILT_MOBILE, MAX_TILT_MOBILE);
        const normalizedY = clamp(gamma * 0.15, -MAX_TILT_MOBILE, MAX_TILT_MOBILE);

        targetRef.current = {
          rotateX: -normalizedX,
          rotateY: normalizedY,
        };
      }

      window.addEventListener("deviceorientation", handleOrientation);
      setIsGyro(true);
      setNeedsIOSPermission(false);
    } catch {
      console.warn("Gyroscope permission denied");
    }
  }, []);

  // iOS: auto-enable on first touch (requestPermission needs user gesture)
  useEffect(() => {
    if (!needsIOSPermission) return;

    function handleFirstTouch() {
      enableGyroscope();
      window.removeEventListener("touchstart", handleFirstTouch);
    }

    window.addEventListener("touchstart", handleFirstTouch, { once: true });
    return () => window.removeEventListener("touchstart", handleFirstTouch);
  }, [needsIOSPermission, enableGyroscope]);

  // Auto-enable gyroscope on non-iOS devices that support it
  useEffect(() => {
    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof (DeviceOrientationEvent as any).requestPermission !== "function"
    ) {
      let hasEvent = false;
      function testHandler(e: DeviceOrientationEvent) {
        if (e.beta !== null || e.gamma !== null) {
          hasEvent = true;
          enableGyroscope();
          window.removeEventListener("deviceorientation", testHandler);
        }
      }
      window.addEventListener("deviceorientation", testHandler);
      const timeout = setTimeout(() => {
        if (!hasEvent) {
          window.removeEventListener("deviceorientation", testHandler);
        }
      }, 1000);
      return () => {
        clearTimeout(timeout);
        window.removeEventListener("deviceorientation", testHandler);
      };
    }
  }, [enableGyroscope]);

  return { tilt, isGyro };
}
