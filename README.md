Live site: https://sarzzble.github.io/form-example/

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Observability

This project includes comprehensive OpenTelemetry instrumentation for monitoring and observability:

### Features

- **Distributed Tracing**: Automatic instrumentation for HTTP requests, form submissions, and user interactions
- **Structured Logging**: Contextual logging with trace correlation for both client and server-side events
- **Metrics Collection**: Performance metrics including response times, form validation errors, and user engagement
- **Error Tracking**: Automatic error capture and reporting with full context
- **Client & Server Monitoring**: Full-stack observability covering both browser and Node.js environments

### Configuration

1. Copy the environment configuration:
   ```bash
   cp .env.example .env.local
   ```

2. Configure your OpenTelemetry endpoint and authentication:
   ```env
   # For local development (using OTEL Collector)
   OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
   NEXT_PUBLIC_OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318

   # For Observe.inc (replace with your tenant URL and token)
   OTEL_EXPORTER_OTLP_ENDPOINT=https://your-tenant.observeinc.com/v1/otel
   OTEL_EXPORTER_OTLP_BEARER_TOKEN=your_observe_bearer_token
   NEXT_PUBLIC_OTEL_EXPORTER_OTLP_ENDPOINT=https://your-tenant.observeinc.com/v1/otel
   NEXT_PUBLIC_OTEL_EXPORTER_OTLP_BEARER_TOKEN=your_observe_bearer_token
   ```

### Architecture

- **Server-side**: Uses NodeSDK with automatic instrumentation for Next.js API routes and server components
- **Client-side**: Uses WebTracerProvider with browser-specific instrumentation for user interactions
- **Data Export**: OTLP HTTP exporters send traces, metrics, and logs to configured endpoints
- **Integration**: Designed for seamless integration with Observe.inc and other OpenTelemetry-compatible platforms

### Monitored Events

- Form component mounting and initialization
- Form field validation errors with detailed context
- Form submission attempts and completion status
- HTTP requests and responses (automatic)
- Page load performance (automatic)
- JavaScript errors and exceptions (automatic)

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
