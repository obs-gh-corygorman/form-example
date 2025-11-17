"use client";

import { trace, metrics } from "@opentelemetry/api";
import { logs, SeverityNumber } from "@opentelemetry/api-logs";

// Get OpenTelemetry instances for client-side usage
export const tracer = trace.getTracer("form-example-client");
export const meter = metrics.getMeter("form-example-client");

// Logger function that safely gets logger
export function getLogger() {
  try {
    return logs.getLogger("form-example-client");
  } catch {
    // Fallback to console if OpenTelemetry is not initialized
    console.warn("OpenTelemetry logger not available, falling back to console");
    return null;
  }
}

// Helper function to log with OpenTelemetry
export function logEvent(
  level: "INFO" | "WARN" | "ERROR",
  message: string,
  attributes?: Record<string, string | number | boolean>
) {
  const logger = getLogger();
  if (logger) {
    const severityMap = {
      INFO: SeverityNumber.INFO,
      WARN: SeverityNumber.WARN,
      ERROR: SeverityNumber.ERROR,
    };

    logger.emit({
      severityNumber: severityMap[level],
      severityText: level,
      body: message,
      attributes: attributes || {},
    });
  } else {
    // Fallback to console
    const consoleMethod = level === "ERROR" ? "error" : level === "WARN" ? "warn" : "log";
    console[consoleMethod](message, attributes);
  }
}
