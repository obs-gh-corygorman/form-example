"use client";

import { useEffect } from "react";

export function OtelProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize client-side OpenTelemetry
    const initClientOtel = async () => {
      if (typeof window !== "undefined") {
        const { initOtel } = await import("@/lib/otel-client");
        initOtel();
      }
    };

    initClientOtel().catch((error) => {
      console.error("Failed to initialize OpenTelemetry client:", error);
    });
  }, []);

  return <>{children}</>;
}
