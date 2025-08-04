// src/hooks/useStats.ts
import { useEffect, useRef } from "react";

interface StatsJSInstance {
  begin(): void;
  end(): void;
  showPanel(id: number): void;
  dom: HTMLElement;
}

export function useStats(enabled: boolean = true) {
  const statsRef = useRef<StatsJSInstance | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    // Dynamically import stats.js to avoid SSR issues (Astro way)
    import("stats.js")
      .then((Stats) => {
        const stats = new Stats.default();
        stats.showPanel(1); // 0: FPS, 1: ms, 2: mb

        // Style the stats panel
        stats.dom.style.position = "fixed";
        stats.dom.style.top = "0px";
        stats.dom.style.right = "0px";
        stats.dom.style.zIndex = "10000";

        document.body.appendChild(stats.dom);
        statsRef.current = stats;
      })
      .catch((error) => {
        console.warn("Failed to load stats.js:", error);
      });

    // Cleanup function
    return () => {
      if (statsRef.current && statsRef.current.dom.parentNode) {
        statsRef.current.dom.parentNode.removeChild(statsRef.current.dom);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      statsRef.current = null;
    };
  }, [enabled]);

  // Return functions to begin/end monitoring
  const begin = () => {
    if (statsRef.current) {
      statsRef.current.begin();
    }
  };

  const end = () => {
    if (statsRef.current) {
      statsRef.current.end();
    }
  };

  return { begin, end, stats: statsRef.current };
}
