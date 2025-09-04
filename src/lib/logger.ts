"use client";

import { SeverityNumber } from "@opentelemetry/api-logs";
import { createLogAttributes } from "./otel-utils";

export interface LogContext {
  userId?: string;
  sessionId?: string;
  component?: string;
  action?: string;
  [key: string]: string | number | boolean | undefined;
}

export class StructuredLogger {
  private serviceName: string;
  private defaultContext: LogContext;

  constructor(serviceName: string, defaultContext: LogContext = {}) {
    this.serviceName = serviceName;
    this.defaultContext = defaultContext;
  }

  private async getLogger() {
    try {
      const { logger } = await import("./otel-client");
      return logger;
    } catch {
      return null;
    }
  }

  private createLogEntry(
    level: SeverityNumber,
    levelText: string,
    message: string,
    context: LogContext = {}
  ) {
    const combinedContext = {
      ...this.defaultContext,
      ...context,
    };

    return {
      severityNumber: level,
      severityText: levelText,
      body: message,
      attributes: createLogAttributes({
        service: this.serviceName,
        ...combinedContext,
      }),
    };
  }

  async debug(message: string, context: LogContext = {}) {
    const logger = await this.getLogger();
    const logEntry = this.createLogEntry(SeverityNumber.DEBUG, "DEBUG", message, context);
    
    logger?.emit(logEntry);
    
    // Also log to console in development
    if (process.env.NODE_ENV === "development") {
      console.debug(`[${this.serviceName}] ${message}`, context);
    }
  }

  async info(message: string, context: LogContext = {}) {
    const logger = await this.getLogger();
    const logEntry = this.createLogEntry(SeverityNumber.INFO, "INFO", message, context);
    
    logger?.emit(logEntry);
    
    if (process.env.NODE_ENV === "development") {
      console.info(`[${this.serviceName}] ${message}`, context);
    }
  }

  async warn(message: string, context: LogContext = {}) {
    const logger = await this.getLogger();
    const logEntry = this.createLogEntry(SeverityNumber.WARN, "WARN", message, context);
    
    logger?.emit(logEntry);
    
    if (process.env.NODE_ENV === "development") {
      console.warn(`[${this.serviceName}] ${message}`, context);
    }
  }

  async error(message: string, error?: Error, context: LogContext = {}) {
    const logger = await this.getLogger();
    const errorContext = {
      ...context,
      error: error?.message,
      stack: error?.stack,
    };
    
    const logEntry = this.createLogEntry(SeverityNumber.ERROR, "ERROR", message, errorContext);
    
    logger?.emit(logEntry);
    
    if (process.env.NODE_ENV === "development") {
      console.error(`[${this.serviceName}] ${message}`, errorContext);
    }
  }

  async fatal(message: string, error?: Error, context: LogContext = {}) {
    const logger = await this.getLogger();
    const errorContext = {
      ...context,
      error: error?.message,
      stack: error?.stack,
    };
    
    const logEntry = this.createLogEntry(SeverityNumber.FATAL, "FATAL", message, errorContext);
    
    logger?.emit(logEntry);
    
    console.error(`[${this.serviceName}] FATAL: ${message}`, errorContext);
  }

  // Convenience method for logging user actions
  async logUserAction(action: string, context: LogContext = {}) {
    await this.info(`User action: ${action}`, {
      ...context,
      category: "user_action",
      action,
    });
  }

  // Convenience method for logging performance metrics
  async logPerformance(operation: string, duration: number, context: LogContext = {}) {
    await this.info(`Performance: ${operation}`, {
      ...context,
      category: "performance",
      operation,
      duration,
      unit: "ms",
    });
  }

  // Convenience method for logging business events
  async logBusinessEvent(event: string, context: LogContext = {}) {
    await this.info(`Business event: ${event}`, {
      ...context,
      category: "business_event",
      event,
    });
  }
}

// Create default logger instances
export const appLogger = new StructuredLogger("form-example-app");
export const formLogger = new StructuredLogger("form-example-form");
export const uiLogger = new StructuredLogger("form-example-ui");

// Convenience functions for quick logging
export const logUserAction = (action: string, context?: LogContext) => 
  appLogger.logUserAction(action, context);

export const logPerformance = (operation: string, duration: number, context?: LogContext) => 
  appLogger.logPerformance(operation, duration, context);

export const logBusinessEvent = (event: string, context?: LogContext) => 
  appLogger.logBusinessEvent(event, context);

export const logError = (message: string, error?: Error, context?: LogContext) => 
  appLogger.error(message, error, context);

export const logInfo = (message: string, context?: LogContext) => 
  appLogger.info(message, context);

export const logDebug = (message: string, context?: LogContext) => 
  appLogger.debug(message, context);

export const logWarn = (message: string, context?: LogContext) => 
  appLogger.warn(message, context);
