Live site: https://sarzzble.github.io/form-example/

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## OpenTelemetry Instrumentation

This application is instrumented with OpenTelemetry for comprehensive observability including:

- **Distributed Tracing**: Automatic and custom spans for form interactions
- **Metrics**: Form submission counters, validation error tracking, and performance metrics
- **Structured Logging**: Correlated logs with trace context for debugging

### Environment Variables

The following environment variables are required for OpenTelemetry:

```bash
# Server-side (automatically available in production)
OTEL_EXPORTER_OTLP_ENDPOINT=https://your-observe-endpoint.com
OTEL_EXPORTER_OTLP_BEARER_TOKEN=your-bearer-token-here

# Client-side (for browser telemetry)
NEXT_PUBLIC_OTEL_EXPORTER_OTLP_ENDPOINT=https://your-observe-endpoint.com
NEXT_PUBLIC_OTEL_EXPORTER_OTLP_BEARER_TOKEN=your-bearer-token-here
```

Copy `.env.local.example` to `.env.local` and configure your endpoints.

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
