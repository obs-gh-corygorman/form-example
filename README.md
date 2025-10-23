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

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## 📊 Observability

This project includes comprehensive OpenTelemetry instrumentation for monitoring and observability.

### Features

- **Distributed Tracing**: Automatic and manual tracing for form submissions and user interactions
- **Structured Logging**: JSON-formatted logs with trace correlation and contextual information
- **Metrics Collection**: Application metrics including form submission counters and message length histograms
- **Error Tracking**: Exception recording and error correlation across traces and logs
- **Client & Server Monitoring**: Full-stack observability for both browser and server-side operations

### Configuration

The observability setup uses OTLP (OpenTelemetry Protocol) exporters and can be configured via environment variables:

```bash
# Server-side configuration
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
OTEL_EXPORTER_OTLP_BEARER_TOKEN=your-token-here

# Client-side configuration (Next.js)
NEXT_PUBLIC_OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
NEXT_PUBLIC_OTEL_EXPORTER_OTLP_BEARER_TOKEN=your-token-here
```

### Architecture

- **Server-side**: Uses NodeSDK with automatic instrumentation for Node.js frameworks
- **Client-side**: Uses WebTracerProvider with browser-specific instrumentations
- **Next.js Integration**: Leverages Next.js 15's built-in instrumentation support
- **Type Safety**: Full TypeScript support with custom type definitions

### Collected Data

#### Traces
- Form submission spans with user interaction context
- Automatic HTTP request/response tracing
- Document load and navigation events

#### Logs
- Form submission events with user data (anonymized)
- Error logs with full context and stack traces
- Application lifecycle events

#### Metrics
- `form_submissions_total`: Counter of form submissions by interest type
- `form_message_length`: Histogram of message lengths by interest type
- Automatic HTTP request metrics
- Browser performance metrics

### Local Development

For local development with an OpenTelemetry Collector:

1. Start an OTEL Collector on port 4318
2. Configure the endpoints in your environment variables
3. Run the development server: `npm run dev`

The instrumentation will automatically begin collecting telemetry data.
