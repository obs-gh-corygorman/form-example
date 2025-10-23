Live site: https://sarzzble.github.io/form-example/

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## 🔍 Observability

This application is instrumented with OpenTelemetry for comprehensive observability including:

- **Distributed Tracing**: Automatic instrumentation for HTTP requests, form submissions, and API calls
- **Structured Logging**: JSON-formatted logs with trace correlation
- **Metrics Collection**: Application performance and business metrics
- **Health Monitoring**: Health check and metrics endpoints

### OpenTelemetry Configuration

The application uses OpenTelemetry with OTLP exporters for both client-side and server-side telemetry:

- **Server-side**: `otel-server.ts` - Node.js SDK with auto-instrumentation
- **Client-side**: `otel-client.ts` - Web SDK with browser instrumentation
- **Instrumentation**: `instrumentation.ts` - Next.js instrumentation hook

### Environment Variables

Configure OpenTelemetry endpoints using environment variables:

```bash
# Server-side (optional, defaults to http://localhost:4318)
OTEL_EXPORTER_OTLP_ENDPOINT=http://your-otel-collector:4318
OTEL_EXPORTER_OTLP_BEARER_TOKEN=your-auth-token

# Client-side (optional, defaults to http://localhost:4318)
NEXT_PUBLIC_OTEL_EXPORTER_OTLP_ENDPOINT=http://your-otel-collector:4318
NEXT_PUBLIC_OTEL_EXPORTER_OTLP_BEARER_TOKEN=your-auth-token
```

### Monitoring Endpoints

- **Health Check**: `/api/health` - Application health status
- **Metrics**: `/api/metrics` - Basic application metrics

### Instrumented Features

- Form submission tracking with validation metrics
- Page load performance monitoring
- API request/response tracing
- Error tracking and exception handling
- User interaction analytics

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

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
