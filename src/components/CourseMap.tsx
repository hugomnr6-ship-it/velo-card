"use client";

import { useEffect, useRef, useCallback, useMemo } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { GpxPoint } from "@/types";
import type { GradientSegment, ClimbSegment } from "@/lib/gpx-analysis";
import { type WindPoint, impactColors } from "@/lib/wind-analysis";

interface CourseMapProps {
  points: GpxPoint[];
  segments: GradientSegment[];
  centerLat: number;
  centerLon: number;
  climbs?: ClimbSegment[];
  hoveredKm?: number | null;
  onHoverKm?: (km: number | null) => void;
  windData?: WindPoint[] | null;
  onMapReady?: (map: maplibregl.Map) => void;
}

/** Interpolate lat/lon at a given km along the route */
function interpolateAtKm(
  points: GpxPoint[],
  km: number
): { lat: number; lon: number } | null {
  if (points.length === 0) return null;
  if (km <= 0) return { lat: points[0].lat, lon: points[0].lon };
  const last = points[points.length - 1];
  if (km >= last.distFromStart) return { lat: last.lat, lon: last.lon };

  for (let i = 1; i < points.length; i++) {
    if (points[i].distFromStart >= km) {
      const prev = points[i - 1];
      const segLen = points[i].distFromStart - prev.distFromStart;
      if (segLen <= 0) return { lat: prev.lat, lon: prev.lon };
      const ratio = (km - prev.distFromStart) / segLen;
      return {
        lat: prev.lat + (points[i].lat - prev.lat) * ratio,
        lon: prev.lon + (points[i].lon - prev.lon) * ratio,
      };
    }
  }
  return { lat: last.lat, lon: last.lon };
}

export default function CourseMap({
  points,
  segments,
  centerLat,
  centerLon,
  climbs = [],
  hoveredKm = null,
  onHoverKm,
  windData,
  onMapReady,
}: CourseMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const hoverMarkerRef = useRef<maplibregl.Marker | null>(null);
  const climbMarkersRef = useRef<maplibregl.Marker[]>([]);
  const boundsRef = useRef<maplibregl.LngLatBounds | null>(null);
  const mapLoadedRef = useRef(false);

  // Store callbacks in refs to avoid re-init
  const onMapReadyRef = useRef(onMapReady);
  onMapReadyRef.current = onMapReady;
  const onHoverKmRef = useRef(onHoverKm);
  onHoverKmRef.current = onHoverKm;
  const pointsRef = useRef(points);
  pointsRef.current = points;

  // Recenter handler
  const handleRecenter = useCallback(() => {
    const map = mapRef.current;
    const bounds = boundsRef.current;
    if (!map || !bounds) return;
    map.fitBounds(bounds, { padding: 40, duration: 500 });
  }, []);

  // ═══ Initialize map — only depends on points & segments (route data) ═══
  useEffect(() => {
    if (!mapContainer.current || points.length < 2) return;

    mapLoadedRef.current = false;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
      center: [centerLon, centerLat],
      zoom: 11,
      attributionControl: false,
    });

    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    // Force resize when container becomes visible (fixes black screen
    // when map initializes inside an animated/hidden parent)
    const ro = new ResizeObserver(() => {
      if (mapRef.current) mapRef.current.resize();
    });
    ro.observe(mapContainer.current);

    map.on("load", () => {
      mapLoadedRef.current = true;
      // Ensure canvas matches container after style load
      map.resize();
      onMapReadyRef.current?.(map);

      // Fit to route bounds
      const lngs = points.map((p) => p.lon);
      const lats = points.map((p) => p.lat);
      const bounds = new maplibregl.LngLatBounds(
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)]
      );
      boundsRef.current = bounds;
      map.fitBounds(bounds, { padding: 40, duration: 0 });

      // ═══ Background outline (dark stroke under route) ═══
      const allCoords = points.map((p) => [p.lon, p.lat]);
      map.addSource("route-outline", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: allCoords },
        },
      });
      map.addLayer({
        id: "route-outline-layer",
        type: "line",
        source: "route-outline",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": "#000000",
          "line-width": 7,
          "line-opacity": 0.6,
        },
      });

      // ═══ Gradient-colored segments ═══
      segments.forEach((seg, idx) => {
        const segPoints = points.slice(seg.startIdx, seg.endIdx + 1);
        if (segPoints.length < 2) return;

        const coords = segPoints.map((p) => [p.lon, p.lat]);
        const sourceId = `seg-${idx}`;

        map.addSource(sourceId, {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: { type: "LineString", coordinates: coords },
          },
        });

        map.addLayer({
          id: `seg-layer-${idx}`,
          type: "line",
          source: sourceId,
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": seg.color,
            "line-width": 4,
            "line-opacity": 0.9,
          },
        });
      });

      // ═══ Start / End markers ═══
      new maplibregl.Marker({ color: "#22C55E", scale: 0.8 })
        .setLngLat([points[0].lon, points[0].lat])
        .addTo(map);

      new maplibregl.Marker({ color: "#EF4444", scale: 0.8 })
        .setLngLat([points[points.length - 1].lon, points[points.length - 1].lat])
        .addTo(map);

      // ═══ Touch/click interaction for km sync ═══
      const findNearestKm = (lngLat: { lng: number; lat: number }) => {
        const pts = pointsRef.current;
        let closestKm = 0;
        let minDist = Infinity;
        const step = Math.max(1, Math.floor(pts.length / 300));
        for (let i = 0; i < pts.length; i += step) {
          const p = pts[i];
          const dx = p.lon - lngLat.lng;
          const dy = p.lat - lngLat.lat;
          const dist = dx * dx + dy * dy;
          if (dist < minDist) {
            minDist = dist;
            closestKm = p.distFromStart;
          }
        }
        return Math.round(closestKm * 10) / 10;
      };

      map.on("mousemove", (e: any) => {
        onHoverKmRef.current?.(findNearestKm(e.lngLat));
      });
      map.on("touchmove", (e: any) => {
        if (e.lngLat) {
          onHoverKmRef.current?.(findNearestKm(e.lngLat));
        }
      });
      map.on("mouseleave", () => {
        onHoverKmRef.current?.(null);
      });
    });

    return () => {
      ro.disconnect();
      climbMarkersRef.current.forEach((m) => m.remove());
      climbMarkersRef.current = [];
      hoverMarkerRef.current?.remove();
      hoverMarkerRef.current = null;
      mapLoadedRef.current = false;
      map.remove();
      mapRef.current = null;
    };
    // Only re-init map when route data truly changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, segments, centerLat, centerLon]);

  // ═══ Climb markers — separate effect ═══
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoadedRef.current) return;

    // Remove old climb markers
    climbMarkersRef.current.forEach((m) => m.remove());
    climbMarkersRef.current = [];

    climbs.forEach((climb) => {
      const peakIdx = climb.endIdx;
      if (peakIdx >= 0 && peakIdx < points.length) {
        const peak = points[peakIdx];
        const el = document.createElement("div");
        el.className = "climb-marker";
        el.innerHTML = `<svg width="20" height="24" viewBox="0 0 20 24"><polygon points="10,2 18,20 2,20" fill="#F59E0B" fill-opacity="0.85" stroke="#0A0A0F" stroke-width="1.5"/><text x="10" y="16" text-anchor="middle" font-size="7" font-weight="800" fill="#0A0A0F">${climb.avgGradient}%</text></svg>`;
        el.style.cursor = "pointer";

        const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
          .setLngLat([peak.lon, peak.lat])
          .addTo(map);

        climbMarkersRef.current.push(marker);
      }
    });
  }, [climbs, points]);

  // ═══ Hover marker sync ═══
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoadedRef.current) return;

    if (hoveredKm === null) {
      hoverMarkerRef.current?.remove();
      hoverMarkerRef.current = null;
      return;
    }

    const pos = interpolateAtKm(points, hoveredKm);
    if (!pos) return;

    if (!hoverMarkerRef.current) {
      const el = document.createElement("div");
      el.className = "hover-sync-marker";
      el.style.cssText = `
        width: 16px; height: 16px;
        border-radius: 50%;
        background: #6366F1;
        border: 3px solid #fff;
        box-shadow: 0 0 12px rgba(99,102,241,0.6), 0 0 4px rgba(255,255,255,0.3);
        pointer-events: none;
        animation: pulse-sync 1.5s ease-in-out infinite;
      `;
      hoverMarkerRef.current = new maplibregl.Marker({ element: el, anchor: "center" })
        .setLngLat([pos.lon, pos.lat])
        .addTo(map);
    } else {
      hoverMarkerRef.current.setLngLat([pos.lon, pos.lat]);
    }
  }, [hoveredKm, points]);

  // ═══ Wind arrows ═══
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoadedRef.current) return;

    // Clean up old wind layers
    try {
      if (map.getLayer("wind-arrows")) map.removeLayer("wind-arrows");
      if (map.getLayer("wind-circles")) map.removeLayer("wind-circles");
      if (map.getLayer("wind-speed-labels")) map.removeLayer("wind-speed-labels");
      if (map.getSource("wind-arrows")) map.removeSource("wind-arrows");
    } catch {}

    if (!windData || windData.length === 0) return;

    // Create arrow images for each impact
    const colorIds: Record<string, string> = {};
    (Object.entries(impactColors) as [string, string][]).forEach(([impact, color]) => {
      const imageId = `wind-arrow-${impact}`;
      colorIds[impact] = imageId;
      createArrowImage(map, imageId, color);
    });

    const features = windData.map((w) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [w.lon, w.lat],
      },
      properties: {
        windDirection: w.windDirection,
        color: impactColors[w.impact],
        impact: w.impact,
        speed: w.windSpeed,
        speedLabel: `${Math.round(w.windSpeed)}`,
        arrowImage: colorIds[w.impact] || colorIds["neutral"],
      },
    }));

    map.addSource("wind-arrows", {
      type: "geojson",
      data: { type: "FeatureCollection", features },
    });

    map.addLayer({
      id: "wind-circles",
      type: "circle",
      source: "wind-arrows",
      paint: {
        "circle-radius": 16,
        "circle-color": "#0B1120",
        "circle-opacity": 0.85,
        "circle-stroke-width": 1.5,
        "circle-stroke-color": ["get", "color"],
        "circle-stroke-opacity": 0.5,
      },
    });

    map.addLayer({
      id: "wind-arrows",
      type: "symbol",
      source: "wind-arrows",
      layout: {
        "icon-image": ["get", "arrowImage"],
        "icon-size": 1,
        "icon-rotate": ["get", "windDirection"],
        "icon-rotation-alignment": "map",
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
        "icon-offset": [0, -4],
      },
    });

    map.addLayer({
      id: "wind-speed-labels",
      type: "symbol",
      source: "wind-arrows",
      layout: {
        "text-field": ["concat", ["get", "speedLabel"], " km/h"],
        "text-size": 8,
        "text-font": ["Open Sans Bold"],
        "text-offset": [0, 2.2],
        "text-allow-overlap": true,
        "text-ignore-placement": true,
      },
      paint: {
        "text-color": ["get", "color"],
        "text-halo-color": "#0B1120",
        "text-halo-width": 1.5,
      },
    });
  }, [windData]);

  return (
    <div className="relative">
      <div
        ref={mapContainer}
        className="h-[min(300px,50vh)] min-h-[200px] w-full rounded-2xl overflow-hidden border border-white/[0.06]"
      />

      {/* Recenter button */}
      <button
        onClick={handleRecenter}
        className="absolute bottom-3 left-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg bg-[#16161F]/90 border border-white/[0.08] text-white/50 active:scale-95 transition"
        aria-label="Recentrer"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12" y2="16" />
          <line x1="8" y1="12" x2="12" y2="12" />
          <line x1="16" y1="12" x2="12" y2="12" />
        </svg>
      </button>

      {/* CSS for pulsing hover marker */}
      <style jsx global>{`
        @keyframes pulse-sync {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}

/** Create a wind arrow image for use as MapLibre symbol */
function createArrowImage(map: maplibregl.Map, id: string, color: string) {
  const size = 28;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(size / 2, 2);
  ctx.lineTo(size - 4, size - 4);
  ctx.lineTo(size / 2, size - 9);
  ctx.lineTo(4, size - 4);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#0B1120";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.strokeStyle = `${color}80`;
  ctx.lineWidth = 0.5;
  ctx.stroke();

  const imageData = ctx.getImageData(0, 0, size, size);
  if (!map.hasImage(id)) {
    map.addImage(id, imageData, { sdf: false });
  }
}
