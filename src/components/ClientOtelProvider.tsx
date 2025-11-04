"use client";

import { useEffect } from "react";
import { initOtel } from "@/lib/otel-client";

interface ClientOtelProviderProps {
  children: React.ReactNode;
}

export function ClientOtelProvider({ children }: ClientOtelProviderProps) {
  useEffect(() => {
    // Initialize OpenTelemetry on the client side
    if (typeof window !== 'undefined') {
      try {
        initOtel();
      } catch (error) {
        console.error('Failed to initialize OpenTelemetry client:', error);
      }
    }
  }, []);

  return <>{children}</>;
}
