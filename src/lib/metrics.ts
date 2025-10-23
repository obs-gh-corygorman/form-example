import { metrics } from "@opentelemetry/api";

// Get the meter for metrics collection
const meter = metrics.getMeter("form-example-client");

// Create metrics instruments
export const formSubmissionCounter = meter.createCounter("form_submissions_total", {
  description: "Total number of form submissions",
});

export const formValidationErrorCounter = meter.createCounter("form_validation_errors_total", {
  description: "Total number of form validation errors",
});

export const formInteractionCounter = meter.createCounter("form_interactions_total", {
  description: "Total number of form field interactions",
});

export const formCompletionTime = meter.createHistogram("form_completion_time_seconds", {
  description: "Time taken to complete and submit the form",
  unit: "s",
});

// Helper function to record form submission
export function recordFormSubmission(interest: string, success: boolean) {
  formSubmissionCounter.add(1, {
    interest,
    success: success.toString(),
  });
}

// Helper function to record validation errors
export function recordValidationErrors(errorCount: number, errorFields: string[]) {
  formValidationErrorCounter.add(errorCount, {
    error_fields: errorFields.join(","),
  });
}

// Helper function to record form interactions
export function recordFormInteraction(fieldName: string) {
  formInteractionCounter.add(1, {
    field_name: fieldName,
  });
}

// Helper function to record form completion time
export function recordFormCompletionTime(timeInSeconds: number, interest: string) {
  formCompletionTime.record(timeInSeconds, {
    interest,
  });
}
