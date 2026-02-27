export interface OtelSpan {
  setAttributes: (attributes: Record<string, string | number | boolean>) => void;
  setStatus: (status: { code: number; message?: string }) => void;
  recordException: (error: Error) => void;
  end: () => void;
}

export interface OtelTracer {
  startSpan: (name: string) => OtelSpan;
}

export interface OtelLogger {
  emit: (log: {
    severityNumber: number;
    severityText: string;
    body: string;
    attributes?: Record<string, string | number | boolean>;
  }) => void;
}

export interface OtelCounter {
  add: (value: number, attributes?: Record<string, string | number | boolean>) => void;
}

export interface OtelHistogram {
  record: (value: number, attributes?: Record<string, string | number | boolean>) => void;
}

export interface OtelMeter {
  createCounter: (name: string, options: { description: string }) => OtelCounter;
  createHistogram: (name: string, options: { description: string }) => OtelHistogram;
}
