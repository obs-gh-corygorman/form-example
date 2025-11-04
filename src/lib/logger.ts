import { SeverityNumber } from "@opentelemetry/api-logs";
import { trace } from "@opentelemetry/api";

// Logger utility for consistent structured logging with trace correlation
export class AppLogger {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private logger: any;
  private isClient: boolean;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(logger: any, isClient = false) {
    this.logger = logger;
    this.isClient = isClient;
  }

  private getTraceContext() {
    try {
      const span = trace.getActiveSpan();
      if (span) {
        const spanContext = span.spanContext();
        return {
          traceId: spanContext.traceId,
          spanId: spanContext.spanId,
        };
      }
    } catch {
      // Ignore trace context errors
    }
    return {};
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private log(level: SeverityNumber, levelText: string, message: string, attributes: Record<string, any> = {}) {
    if (!this.logger || !this.logger.emit) {
      // Fallback to console logging
      console.log(`[${levelText}] ${message}`, attributes);
      return;
    }

    const traceContext = this.getTraceContext();
    
    this.logger.emit({
      severityNumber: level,
      severityText: levelText,
      body: message,
      attributes: {
        ...attributes,
        ...traceContext,
        environment: this.isClient ? 'client' : 'server',
        timestamp: new Date().toISOString(),
      },
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  info(message: string, attributes?: Record<string, any>) {
    this.log(SeverityNumber.INFO, "INFO", message, attributes);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  warn(message: string, attributes?: Record<string, any>) {
    this.log(SeverityNumber.WARN, "WARN", message, attributes);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error(message: string, attributes?: Record<string, any>) {
    this.log(SeverityNumber.ERROR, "ERROR", message, attributes);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  debug(message: string, attributes?: Record<string, any>) {
    this.log(SeverityNumber.DEBUG, "DEBUG", message, attributes);
  }
}

// Factory function to create logger instances
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createAppLogger(logger: any, isClient = false): AppLogger {
  return new AppLogger(logger, isClient);
}
