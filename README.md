Live site: https://sarzzble.github.io/form-example/

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## 🔍 Observability

This project includes comprehensive OpenTelemetry instrumentation for monitoring and observability:

### Features
- **Distributed Tracing**: Automatic instrumentation for HTTP requests, form submissions, and user interactions
- **Structured Logging**: Contextual logging with trace correlation for debugging and monitoring
- **Metrics Collection**: Performance metrics including response times and resource usage
- **Error Tracking**: Automatic error capture and reporting with full context
- **Client & Server Monitoring**: Full-stack observability for both browser and server-side operations

### Configuration
Copy `.env.example` to `.env.local` and configure your OpenTelemetry endpoints:

```bash
cp .env.example .env.local
```

Set your Observe endpoint and authentication token:
- `OTEL_EXPORTER_OTLP_ENDPOINT`: Your OpenTelemetry collector endpoint
- `OTEL_EXPORTER_OTLP_BEARER_TOKEN`: Authentication token for secure data transmission
- `NEXT_PUBLIC_*` versions for client-side configuration

### Monitoring Endpoints
- `/api/health`: Health check endpoint with observability
- `/api/metrics`: Metrics demonstration endpoint with performance tracking

### What's Instrumented
- **Form Submissions**: Complete tracing and logging of form validation and submission
- **API Routes**: Automatic instrumentation of all API endpoints
- **Client Interactions**: Browser-side tracking of user interactions and page loads
- **HTTP Requests**: Automatic tracing of all HTTP requests and responses
- **Error Handling**: Comprehensive error tracking with context and stack traces

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
