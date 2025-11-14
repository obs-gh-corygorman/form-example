"use client";

import { trace, context, SpanStatusCode, Tracer } from "@opentelemetry/api";
import { SeverityNumber } from "@opentelemetry/api-logs";
import type { Logger } from "@opentelemetry/api-logs";

// Form instrumentation utilities
export class FormInstrumentation {
  private tracer: Tracer | null = null;
  private logger: Logger | null = null;
  private meter: unknown = null;
  private formSubmissionCounter: unknown = null;
  private formValidationCounter: unknown = null;
  private formSubmissionDuration: unknown = null;

  async initialize() {
    if (typeof window !== "undefined") {
      try {
        const { tracer, logger } = await import("@/lib/otel-client");
        this.tracer = tracer;
        this.logger = logger;
        
        // Create metrics (Note: Web SDK doesn't support metrics by default, but we can prepare for it)
        // For now, we'll focus on traces and logs
      } catch (error) {
        console.warn("Failed to initialize form instrumentation:", error);
      }
    }
  }

  // Track form field interactions
  trackFieldInteraction(fieldName: string, action: string, value?: unknown) {
    if (!this.tracer) return;

    const span = this.tracer.startSpan(`form.field.${action}`, {
      attributes: {
        "form.field.name": fieldName,
        "form.field.action": action,
        "form.field.has_value": value !== undefined && value !== "",
      },
    });

    if (this.logger) {
      this.logger.emit({
        severityNumber: SeverityNumber.DEBUG,
        severityText: "DEBUG",
        body: `Form field ${action}`,
        attributes: {
          "form.field.name": fieldName,
          "form.field.action": action,
          "form.field.has_value": value !== undefined && value !== "",
        },
      });
    }

    span.end();
  }

  // Track form validation
  trackFormValidation(isValid: boolean, errors: Record<string, unknown> = {}) {
    if (!this.tracer) return;

    const span = this.tracer.startSpan("form.validation", {
      attributes: {
        "form.validation.is_valid": isValid,
        "form.validation.error_count": Object.keys(errors).length,
        "form.validation.error_fields": Object.keys(errors).join(","),
      },
    });

    if (this.logger) {
      this.logger.emit({
        severityNumber: isValid ? SeverityNumber.INFO : SeverityNumber.WARN,
        severityText: isValid ? "INFO" : "WARN",
        body: `Form validation ${isValid ? "passed" : "failed"}`,
        attributes: {
          "form.validation.is_valid": isValid,
          "form.validation.error_count": Object.keys(errors).length,
          "form.validation.errors": JSON.stringify(errors),
        },
      });
    }

    if (!isValid) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: "Form validation failed" });
    }

    span.end();
  }

  // Track form submission
  async trackFormSubmission<T>(
    formData: T,
    submitFunction: (data: T) => Promise<void> | void
  ): Promise<void> {
    if (!this.tracer) {
      return submitFunction(formData);
    }

    const span = this.tracer.startSpan("form.submission", {
      attributes: {
        "form.submission.timestamp": new Date().toISOString(),
        "form.submission.data_size": JSON.stringify(formData).length,
      },
    });

    const startTime = Date.now();

    try {
      // Set span in context
      trace.setSpan(context.active(), span);

      if (this.logger) {
        this.logger.emit({
          severityNumber: SeverityNumber.INFO,
          severityText: "INFO",
          body: "Form submission started",
          attributes: {
            "form.submission.timestamp": new Date().toISOString(),
            "form.submission.data": JSON.stringify(formData),
          },
        });
      }

      await submitFunction(formData);

      const duration = Date.now() - startTime;
      
      span.setAttributes({
        "form.submission.success": true,
        "form.submission.duration_ms": duration,
      });

      if (this.logger) {
        this.logger.emit({
          severityNumber: SeverityNumber.INFO,
          severityText: "INFO",
          body: "Form submission completed successfully",
          attributes: {
            "form.submission.success": true,
            "form.submission.duration_ms": duration,
          },
        });
      }

      span.setStatus({ code: SpanStatusCode.OK });
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      span.setAttributes({
        "form.submission.success": false,
        "form.submission.duration_ms": duration,
        "form.submission.error": errorMessage,
      });

      span.setStatus({ code: SpanStatusCode.ERROR, message: errorMessage });

      if (this.logger) {
        this.logger.emit({
          severityNumber: SeverityNumber.ERROR,
          severityText: "ERROR",
          body: "Form submission failed",
          attributes: {
            "form.submission.success": false,
            "form.submission.duration_ms": duration,
            "form.submission.error": errorMessage,
          },
        });
      }

      throw error;
    } finally {
      span.end();
    }
  }
}

// Singleton instance
export const formInstrumentation = new FormInstrumentation();
