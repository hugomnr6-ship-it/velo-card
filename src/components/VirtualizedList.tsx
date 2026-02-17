"use client";

import { useRef, useState, useEffect, useCallback, type ReactNode } from "react";

interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  overscan?: number;
  renderItem: (item: T, index: number) => ReactNode;
  className?: string;
  maxHeight?: number;
}

export default function VirtualizedList<T>({
  items,
  itemHeight,
  overscan = 5,
  renderItem,
  className = "",
  maxHeight = 600,
}: VirtualizedListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  const totalHeight = items.length * itemHeight;
  const visibleCount = Math.ceil(maxHeight / itemHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(items.length, startIndex + visibleCount + overscan * 2);

  const visibleItems = items.slice(startIndex, endIndex);

  // For small lists, skip virtualization
  if (items.length <= 20) {
    return (
      <div className={className}>
        {items.map((item, i) => renderItem(item, i))}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={`overflow-y-auto ${className}`}
      style={{ maxHeight }}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        <div
          style={{
            position: "absolute",
            top: startIndex * itemHeight,
            width: "100%",
          }}
        >
          {visibleItems.map((item, i) => renderItem(item, startIndex + i))}
        </div>
      </div>
    </div>
  );
}
