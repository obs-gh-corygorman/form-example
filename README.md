Live site: https://sarzzble.github.io/form-example/

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Features

- **Form Validation**: React Hook Form with Zod schema validation
- **UI Components**: Shadcn/ui components with Tailwind CSS
- **Observability**: Comprehensive OpenTelemetry instrumentation for tracing, logging, and metrics
- **TypeScript**: Full TypeScript support with strict type checking

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

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Saira](https://fonts.google.com/specimen/Saira), a Google Font.

## Observability

This project includes comprehensive observability instrumentation using OpenTelemetry. See [OBSERVABILITY.md](./OBSERVABILITY.md) for detailed setup and usage instructions.

### Quick Start with Observability

1. Copy the environment configuration:
   ```bash
   cp .env.example .env.local
   ```

2. Configure your OpenTelemetry endpoint:
   ```bash
   # Edit .env.local
   OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
   NEXT_PUBLIC_OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
   ```

3. The application will automatically instrument:
   - HTTP requests and responses
   - Form submissions with custom attributes
   - Client-side interactions
   - Error tracking and logging

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
