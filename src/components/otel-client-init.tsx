"use client";

import { useEffect } from "react";

export default function OtelClientInit() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Import and initialize client-side OpenTelemetry
      import("../../otel-client").then(({ initOtel }) => {
        initOtel();
      }).catch((error) => {
        console.warn("Failed to initialize OpenTelemetry client:", error);
      });
    }
  }, []);

  // This component doesn't render anything
  return null;
}
