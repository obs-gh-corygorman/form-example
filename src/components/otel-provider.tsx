"use client";

import { useEffect } from "react";

export function OtelProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize OpenTelemetry on the client side
    const initClientOtel = async () => {
      try {
        const { initOtel } = await import("@/lib/otel-client");
        initOtel();
      } catch (error) {
        console.error("Failed to initialize OpenTelemetry client:", error);
      }
    };

    initClientOtel();
  }, []);

  return <>{children}</>;
}
