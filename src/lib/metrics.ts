"use client";

import { Meter, Counter, Histogram, UpDownCounter } from "@opentelemetry/api";

export interface MetricLabels {
  [key: string]: string;
}

export class MetricsCollector {
  private serviceName: string;
  private meter: Meter | null = null;
  
  // Counters
  private pageViewCounter: Counter | null = null;
  private formSubmissionCounter: Counter | null = null;
  private formValidationCounter: Counter | null = null;
  private formErrorCounter: Counter | null = null;
  private userActionCounter: Counter | null = null;
  
  // Histograms
  private formSubmissionDuration: Histogram | null = null;
  private formValidationDuration: Histogram | null = null;
  private pageLoadDuration: Histogram | null = null;
  
  // UpDown Counters
  private activeUsersGauge: UpDownCounter | null = null;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
    this.initializeMetrics();
  }

  private async initializeMetrics() {
    try {
      const { meter } = await import("./otel-client");
      this.meter = meter;
      
      if (this.meter) {
        // Initialize counters
        this.pageViewCounter = this.meter.createCounter("page_views_total", {
          description: "Total number of page views",
        });

        this.formSubmissionCounter = this.meter.createCounter("form_submissions_total", {
          description: "Total number of form submissions",
        });

        this.formValidationCounter = this.meter.createCounter("form_validations_total", {
          description: "Total number of form validations",
        });

        this.formErrorCounter = this.meter.createCounter("form_errors_total", {
          description: "Total number of form errors",
        });

        this.userActionCounter = this.meter.createCounter("user_actions_total", {
          description: "Total number of user actions",
        });

        // Initialize histograms
        this.formSubmissionDuration = this.meter.createHistogram("form_submission_duration", {
          description: "Duration of form submissions",
          unit: "ms",
        });

        this.formValidationDuration = this.meter.createHistogram("form_validation_duration", {
          description: "Duration of form validations",
          unit: "ms",
        });

        this.pageLoadDuration = this.meter.createHistogram("page_load_duration", {
          description: "Duration of page loads",
          unit: "ms",
        });

        // Initialize gauges
        this.activeUsersGauge = this.meter.createUpDownCounter("active_users", {
          description: "Number of active users",
        });
      }
    } catch (error) {
      console.warn("Failed to initialize metrics:", error);
    }
  }

  // Page view metrics
  recordPageView(page: string, labels: MetricLabels = {}) {
    this.pageViewCounter?.add(1, {
      page,
      service: this.serviceName,
      ...labels,
    });
  }

  recordPageLoadDuration(page: string, duration: number, labels: MetricLabels = {}) {
    this.pageLoadDuration?.record(duration, {
      page,
      service: this.serviceName,
      ...labels,
    });
  }

  // Form metrics
  recordFormSubmission(formName: string, success: boolean, labels: MetricLabels = {}) {
    this.formSubmissionCounter?.add(1, {
      form_name: formName,
      success: success.toString(),
      service: this.serviceName,
      ...labels,
    });
  }

  recordFormSubmissionDuration(formName: string, duration: number, success: boolean, labels: MetricLabels = {}) {
    this.formSubmissionDuration?.record(duration, {
      form_name: formName,
      success: success.toString(),
      service: this.serviceName,
      ...labels,
    });
  }

  recordFormValidation(formName: string, valid: boolean, errorCount: number = 0, labels: MetricLabels = {}) {
    this.formValidationCounter?.add(1, {
      form_name: formName,
      valid: valid.toString(),
      service: this.serviceName,
      ...labels,
    });

    if (!valid && errorCount > 0) {
      this.formErrorCounter?.add(errorCount, {
        form_name: formName,
        service: this.serviceName,
        ...labels,
      });
    }
  }

  recordFormValidationDuration(formName: string, duration: number, valid: boolean, labels: MetricLabels = {}) {
    this.formValidationDuration?.record(duration, {
      form_name: formName,
      valid: valid.toString(),
      service: this.serviceName,
      ...labels,
    });
  }

  // User action metrics
  recordUserAction(action: string, labels: MetricLabels = {}) {
    this.userActionCounter?.add(1, {
      action,
      service: this.serviceName,
      ...labels,
    });
  }

  // User session metrics
  recordUserSessionStart(userId: string, labels: MetricLabels = {}) {
    this.activeUsersGauge?.add(1, {
      user_id: userId,
      service: this.serviceName,
      ...labels,
    });
  }

  recordUserSessionEnd(userId: string, labels: MetricLabels = {}) {
    this.activeUsersGauge?.add(-1, {
      user_id: userId,
      service: this.serviceName,
      ...labels,
    });
  }

  // Field interaction metrics
  recordFieldInteraction(formName: string, fieldName: string, action: string, labels: MetricLabels = {}) {
    this.userActionCounter?.add(1, {
      action: `field_${action}`,
      form_name: formName,
      field_name: fieldName,
      service: this.serviceName,
      ...labels,
    });
  }

  // Business metrics
  recordBusinessEvent(event: string, value: number = 1, labels: MetricLabels = {}) {
    this.userActionCounter?.add(value, {
      action: event,
      category: "business_event",
      service: this.serviceName,
      ...labels,
    });
  }

  // Performance metrics
  recordPerformanceMetric(operation: string, duration: number, labels: MetricLabels = {}) {
    const performanceHistogram = this.meter?.createHistogram(`${operation}_duration`, {
      description: `Duration of ${operation} operations`,
      unit: "ms",
    });

    performanceHistogram?.record(duration, {
      operation,
      service: this.serviceName,
      ...labels,
    });
  }
}

// Create default metrics collector
export const metricsCollector = new MetricsCollector("form-example");

// Convenience functions for common metrics
export const recordPageView = (page: string, labels?: MetricLabels) => 
  metricsCollector.recordPageView(page, labels);

export const recordFormSubmission = (formName: string, success: boolean, labels?: MetricLabels) => 
  metricsCollector.recordFormSubmission(formName, success, labels);

export const recordFormValidation = (formName: string, valid: boolean, errorCount?: number, labels?: MetricLabels) => 
  metricsCollector.recordFormValidation(formName, valid, errorCount, labels);

export const recordUserAction = (action: string, labels?: MetricLabels) => 
  metricsCollector.recordUserAction(action, labels);

export const recordFieldInteraction = (formName: string, fieldName: string, action: string, labels?: MetricLabels) => 
  metricsCollector.recordFieldInteraction(formName, fieldName, action, labels);

export const recordBusinessEvent = (event: string, value?: number, labels?: MetricLabels) => 
  metricsCollector.recordBusinessEvent(event, value, labels);

export const recordPerformanceMetric = (operation: string, duration: number, labels?: MetricLabels) => 
  metricsCollector.recordPerformanceMetric(operation, duration, labels);
