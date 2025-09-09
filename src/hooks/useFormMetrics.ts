"use client";

import { useRef } from "react";
import { metrics } from "@opentelemetry/api";

export function useFormMetrics() {
  const meter = metrics.getMeter("form-example-client");
  const formInteractionCounter = useRef(
    meter.createCounter("form.interactions", {
      description: "Number of form interactions",
    })
  );
  const formSubmissionCounter = useRef(
    meter.createCounter("form.submissions", {
      description: "Number of form submissions",
    })
  );
  const formValidationErrorCounter = useRef(
    meter.createCounter("form.validation_errors", {
      description: "Number of form validation errors",
    })
  );

  const trackInteraction = (field: string, action: string) => {
    formInteractionCounter.current.add(1, {
      field,
      action,
    });
  };

  const trackSubmission = (success: boolean, interest?: string) => {
    formSubmissionCounter.current.add(1, {
      success: success.toString(),
      interest: interest || "unknown",
    });
  };

  const trackValidationError = (field: string, errorType: string) => {
    formValidationErrorCounter.current.add(1, {
      field,
      error_type: errorType,
    });
  };

  return {
    trackInteraction,
    trackSubmission,
    trackValidationError,
  };
}
