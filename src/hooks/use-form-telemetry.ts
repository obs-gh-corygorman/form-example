"use client";

import { useCallback, useEffect } from "react";
import { trace, SpanStatusCode, SpanKind } from "@opentelemetry/api";
import { SeverityNumber } from "@opentelemetry/api-logs";
import { withSpan, addSpanAttributes, recordSpanEvent, createLogAttributes } from "@/lib/otel-utils";

interface FormTelemetryOptions {
  formName: string;
  userId?: string;
}

interface FormData {
  [key: string]: string | number | boolean;
}

export function useFormTelemetry({ formName, userId }: FormTelemetryOptions) {
  // Initialize telemetry instances
  const getTracer = () => trace.getTracer("form-telemetry");
  const getLogger = async () => {
    try {
      const { logger } = await import("@/lib/otel-client");
      return logger;
    } catch {
      return null;
    }
  };
  const getMeter = async () => {
    try {
      const { meter } = await import("@/lib/otel-client");
      return meter;
    } catch {
      return null;
    }
  };

  // Track form initialization
  useEffect(() => {
    const trackFormInit = async () => {
      const logger = await getLogger();
      const tracer = getTracer();
      
      const span = tracer.startSpan("form.initialize", {
        kind: SpanKind.CLIENT,
        attributes: {
          "form.name": formName,
          "user.id": userId || "anonymous",
        },
      });

      try {
        logger?.emit({
          severityNumber: SeverityNumber.INFO,
          severityText: "INFO",
          body: "Form initialized",
          attributes: createLogAttributes({
            formName,
            userId: userId || "anonymous",
            event: "form.initialize",
          }),
        });

        span.setStatus({ code: SpanStatusCode.OK });
      } catch (error) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: (error as Error).message,
        });
        span.recordException(error as Error);
      } finally {
        span.end();
      }
    };

    trackFormInit();
  }, [formName, userId]);

  // Track form field interactions
  const trackFieldInteraction = useCallback(async (fieldName: string, action: string, value?: string | number | boolean) => {
    const logger = await getLogger();
    const tracer = getTracer();
    
    const span = tracer.startSpan("form.field_interaction", {
      kind: SpanKind.CLIENT,
      attributes: {
        "form.name": formName,
        "form.field": fieldName,
        "form.action": action,
        "user.id": userId || "anonymous",
      },
    });

    try {
      logger?.emit({
        severityNumber: SeverityNumber.DEBUG,
        severityText: "DEBUG",
        body: `Form field ${action}`,
        attributes: createLogAttributes({
          formName,
          fieldName,
          action,
          value: typeof value === "string" ? value : JSON.stringify(value),
          userId: userId || "anonymous",
          event: "form.field_interaction",
        }),
      });

      span.setStatus({ code: SpanStatusCode.OK });
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: (error as Error).message,
      });
      span.recordException(error as Error);
    } finally {
      span.end();
    }
  }, [formName, userId]);

  // Track form validation
  const trackValidation = useCallback(async (isValid: boolean, errors?: Record<string, unknown>) => {
    const logger = await getLogger();
    const meter = await getMeter();
    const errorCount = errors ? Object.keys(errors).length : 0;

    return withSpan(
      "form.validation",
      async () => {
        addSpanAttributes({
          "form.name": formName,
          "form.valid": isValid,
          "form.error_count": errorCount,
          "user.id": userId || "anonymous",
        });

        recordSpanEvent("validation_completed", {
          valid: isValid,
          errorCount,
        });

        logger?.emit({
          severityNumber: isValid ? SeverityNumber.INFO : SeverityNumber.WARN,
          severityText: isValid ? "INFO" : "WARN",
          body: `Form validation ${isValid ? "passed" : "failed"}`,
          attributes: createLogAttributes({
            formName,
            isValid,
            errorCount,
            errors: errors ? JSON.stringify(errors) : undefined,
            userId: userId || "anonymous",
            event: "form.validation",
          }),
        });

        // Track validation metrics
        const validationCounter = meter?.createCounter("form_validation_total", {
          description: "Total number of form validations",
        });

        validationCounter?.add(1, {
          form_name: formName,
          valid: isValid.toString(),
        });

        if (!isValid && errorCount > 0) {
          const errorCounter = meter?.createCounter("form_validation_errors_total", {
            description: "Total number of form validation errors",
          });

          errorCounter?.add(errorCount, {
            form_name: formName,
          });
        }
      },
      {
        "form.name": formName,
        "form.valid": isValid,
        "form.error_count": errorCount,
      }
    );
  }, [formName, userId]);

  // Track form submission
  const trackSubmission = useCallback(async (data: FormData, success: boolean = true, error?: Error) => {
    const logger = await getLogger();
    const meter = await getMeter();
    const dataSize = JSON.stringify(data).length;

    return withSpan(
      "form.submission",
      async () => {
        
        addSpanAttributes({
          "form.name": formName,
          "form.success": success,
          "form.data_size": dataSize,
          "user.id": userId || "anonymous",
        });

        recordSpanEvent("submission_attempted", {
          success,
          dataSize,
        });

        logger?.emit({
          severityNumber: success ? SeverityNumber.INFO : SeverityNumber.ERROR,
          severityText: success ? "INFO" : "ERROR",
          body: `Form submission ${success ? "successful" : "failed"}`,
          attributes: createLogAttributes({
            formName,
            success,
            dataSize,
            error: error?.message,
            userId: userId || "anonymous",
            event: "form.submission",
            submittedData: JSON.stringify(data),
          }),
        });

        // Track submission metrics
        const submissionCounter = meter?.createCounter("form_submission_total", {
          description: "Total number of form submissions",
        });
        
        submissionCounter?.add(1, {
          form_name: formName,
          success: success.toString(),
        });

        const submissionDuration = meter?.createHistogram("form_submission_duration", {
          description: "Duration of form submissions",
          unit: "ms",
        });
        
        // Record submission duration (this would be measured from form start to submission)
        submissionDuration?.record(Date.now(), {
          form_name: formName,
          success: success.toString(),
        });

        if (error) {
          throw error;
        }
      },
      {
        "form.name": formName,
        "form.success": success,
        "form.data_size": dataSize,
      }
    );
  }, [formName, userId]);

  return {
    trackFieldInteraction,
    trackValidation,
    trackSubmission,
  };
}
