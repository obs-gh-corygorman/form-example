// Metrics utility for consistent application metrics collection
export class AppMetrics {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private meter: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private counters: Map<string, any> = new Map();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private histograms: Map<string, any> = new Map();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private gauges: Map<string, any> = new Map();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(meter: any) {
    this.meter = meter;
    this.initializeMetrics();
  }

  private initializeMetrics() {
    if (!this.meter) return;

    // Form-related metrics
    this.counters.set('form_submissions_total', 
      this.meter.createCounter('form_submissions_total', {
        description: 'Total number of form submissions',
      })
    );

    this.counters.set('form_validation_errors_total', 
      this.meter.createCounter('form_validation_errors_total', {
        description: 'Total number of form validation errors',
      })
    );

    this.counters.set('page_views_total', 
      this.meter.createCounter('page_views_total', {
        description: 'Total number of page views',
      })
    );

    // Performance metrics
    this.histograms.set('form_submission_duration', 
      this.meter.createHistogram('form_submission_duration', {
        description: 'Duration of form submissions in milliseconds',
        unit: 'ms',
      })
    );

    this.histograms.set('page_load_duration', 
      this.meter.createHistogram('page_load_duration', {
        description: 'Duration of page loads in milliseconds',
        unit: 'ms',
      })
    );

    // User interaction metrics
    this.counters.set('user_interactions_total', 
      this.meter.createCounter('user_interactions_total', {
        description: 'Total number of user interactions',
      })
    );
  }

  // Counter methods
  incrementFormSubmissions(interest: string, status: 'success' | 'error') {
    const counter = this.counters.get('form_submissions_total');
    if (counter) {
      counter.add(1, { interest, status });
    }
  }

  incrementFormValidationErrors(fieldName: string, errorType: string) {
    const counter = this.counters.get('form_validation_errors_total');
    if (counter) {
      counter.add(1, { field: fieldName, error_type: errorType });
    }
  }

  incrementPageViews(pageName: string, pageType: string) {
    const counter = this.counters.get('page_views_total');
    if (counter) {
      counter.add(1, { page: pageName, type: pageType });
    }
  }

  incrementUserInteractions(action: string, component: string) {
    const counter = this.counters.get('user_interactions_total');
    if (counter) {
      counter.add(1, { action, component });
    }
  }

  // Histogram methods
  recordFormSubmissionDuration(duration: number, interest: string) {
    const histogram = this.histograms.get('form_submission_duration');
    if (histogram) {
      histogram.record(duration, { interest });
    }
  }

  recordPageLoadDuration(duration: number, pageName: string) {
    const histogram = this.histograms.get('page_load_duration');
    if (histogram) {
      histogram.record(duration, { page: pageName });
    }
  }

  // Generic metric recording
  recordCustomCounter(name: string, value: number, attributes: Record<string, string> = {}) {
    let counter = this.counters.get(name);
    if (!counter && this.meter) {
      counter = this.meter.createCounter(name, {
        description: `Custom counter: ${name}`,
      });
      this.counters.set(name, counter);
    }
    if (counter) {
      counter.add(value, attributes);
    }
  }

  recordCustomHistogram(name: string, value: number, attributes: Record<string, string> = {}) {
    let histogram = this.histograms.get(name);
    if (!histogram && this.meter) {
      histogram = this.meter.createHistogram(name, {
        description: `Custom histogram: ${name}`,
      });
      this.histograms.set(name, histogram);
    }
    if (histogram) {
      histogram.record(value, attributes);
    }
  }
}

// Factory function to create metrics instance
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createAppMetrics(meter: any): AppMetrics {
  return new AppMetrics(meter);
}
