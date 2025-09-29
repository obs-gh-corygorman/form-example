"use client";

import { useEffect, useState } from "react";
import type { Tracer, Meter } from "@opentelemetry/api";
import type { Logger } from "@opentelemetry/api-logs";

interface OtelInstances {
  tracer: Tracer;
  logger: Logger;
  meter: Meter;
}

export function useOtel(): OtelInstances | null {
  const [otelInstances, setOtelInstances] = useState<OtelInstances | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Import OpenTelemetry client instances
      import("../../otel-client").then(({ tracer, logger, meter }) => {
        setOtelInstances({ tracer, logger, meter });
      }).catch((error) => {
        console.warn("Failed to load OpenTelemetry instances:", error);
      });
    }
  }, []);

  return otelInstances;
}
