"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { GpxPoint } from "@/types";
import type { GradientSegment } from "@/lib/gpx-analysis";

interface CourseMapProps {
  points: GpxPoint[];
  segments: GradientSegment[];
  centerLat: number;
  centerLon: number;
  onMapReady?: (map: maplibregl.Map) => void;
}

export default function CourseMap({
  points,
  segments,
  centerLat,
  centerLon,
  onMapReady,
}: CourseMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || points.length < 2) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
      center: [centerLon, centerLat],
      zoom: 11,
      attributionControl: false,
    });

    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    map.on("load", () => {
      onMapReady?.(map);
      // Fit to route bounds
      const lngs = points.map((p) => p.lon);
      const lats = points.map((p) => p.lat);
      const bounds = new maplibregl.LngLatBounds(
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      );
      map.fitBounds(bounds, { padding: 40, duration: 0 });

      // Add gradient-colored segments as individual line layers
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
            geometry: {
              type: "LineString",
              coordinates: coords,
            },
          },
        });

        map.addLayer({
          id: `seg-layer-${idx}`,
          type: "line",
          source: sourceId,
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": seg.color,
            "line-width": 4,
            "line-opacity": 0.9,
          },
        });
      });

      // Start marker
      new maplibregl.Marker({ color: "#22C55E" })
        .setLngLat([points[0].lon, points[0].lat])
        .addTo(map);

      // End marker
      new maplibregl.Marker({ color: "#EF4444" })
        .setLngLat([points[points.length - 1].lon, points[points.length - 1].lat])
        .addTo(map);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [points, segments, centerLat, centerLon]);

  return (
    <div
      ref={mapContainer}
      className="h-[350px] w-full rounded-2xl overflow-hidden border border-white/[0.06]"
    />
  );
}
