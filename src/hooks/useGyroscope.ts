"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface TiltValues {
  rotateX: number; // degrees, -15 to 15
  rotateY: number; // degrees, -15 to 15
}

const MAX_TILT = 15;
const SPRING_FACTOR = 0.08; // smooth interpolation

function clamp(val: number, min: number, max: number) {
  return Math.min(max, Math.max(min, val));
}

export function useGyroscope(cardRef: React.RefObject<HTMLDivElement | null>) {
  const [tilt, setTilt] = useState<TiltValues>({ rotateX: 0, rotateY: 0 });
  const [isGyro, setIsGyro] = useState(false);
  const [permissionNeeded, setPermissionNeeded] = useState(false);
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

  // Check if gyroscope permission is needed (iOS)
  useEffect(() => {
    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof (DeviceOrientationEvent as any).requestPermission === "function"
    ) {
      setPermissionNeeded(true);
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
        rotateX: clamp(-offsetY * MAX_TILT, -MAX_TILT, MAX_TILT),
        rotateY: clamp(offsetX * MAX_TILT, -MAX_TILT, MAX_TILT),
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

  // Mobile: gyroscope
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
        const beta = e.beta ?? 0; // front-back tilt (-180 to 180)
        const gamma = e.gamma ?? 0; // left-right tilt (-90 to 90)

        // Normalize: beta ~45 is "phone held naturally", gamma ~0 is centered
        const normalizedX = clamp((beta - 45) * 0.3, -MAX_TILT, MAX_TILT);
        const normalizedY = clamp(gamma * 0.3, -MAX_TILT, MAX_TILT);

        targetRef.current = {
          rotateX: -normalizedX,
          rotateY: normalizedY,
        };
      }

      window.addEventListener("deviceorientation", handleOrientation);
      setIsGyro(true);
      setPermissionNeeded(false);
    } catch {
      console.warn("Gyroscope permission denied");
    }
  }, []);

  // Auto-enable gyroscope on non-iOS devices that support it
  useEffect(() => {
    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof (DeviceOrientationEvent as any).requestPermission !== "function"
    ) {
      // Android / non-iOS: no permission needed, check if events fire
      let hasEvent = false;
      function testHandler(e: DeviceOrientationEvent) {
        if (e.beta !== null || e.gamma !== null) {
          hasEvent = true;
          enableGyroscope();
          window.removeEventListener("deviceorientation", testHandler);
        }
      }
      window.addEventListener("deviceorientation", testHandler);
      // Cleanup if no event fires within 1 second (desktop)
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

  return { tilt, isGyro, permissionNeeded, enableGyroscope };
}
