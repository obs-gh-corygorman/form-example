"use client";

import { useEffect, useCallback } from "react";
import { formInstrumentation } from "@/lib/form-instrumentation";

export function useFormInstrumentation() {
  useEffect(() => {
    // Initialize instrumentation when hook is first used
    formInstrumentation.initialize();
  }, []);

  const trackFieldInteraction = useCallback((fieldName: string, action: string, value?: unknown) => {
    formInstrumentation.trackFieldInteraction(fieldName, action, value);
  }, []);

  const trackFormValidation = useCallback((isValid: boolean, errors: Record<string, unknown> = {}) => {
    formInstrumentation.trackFormValidation(isValid, errors);
  }, []);

  const trackFormSubmission = useCallback(async <T>(
    formData: T,
    submitFunction: (data: T) => Promise<void> | void
  ): Promise<void> => {
    return formInstrumentation.trackFormSubmission(formData, submitFunction);
  }, []);

  return {
    trackFieldInteraction,
    trackFormValidation,
    trackFormSubmission,
  };
}
