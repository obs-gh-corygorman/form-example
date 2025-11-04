"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { trace, context, SpanStatusCode } from "@opentelemetry/api";
import { createAppLogger } from "@/lib/logger";
import { createAppMetrics } from "@/lib/metrics";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

export default function Home() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [tracer, setTracer] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [appLogger, setAppLogger] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [appMetrics, setAppMetrics] = useState<any>(null);
  const [pageLoadStart] = useState<number>(Date.now());

  useEffect(() => {
    // Initialize OpenTelemetry instances on client side
    if (typeof window !== 'undefined') {
      import('@/lib/otel-client').then(({ tracer, logger, meter }) => {
        setTracer(tracer);

        // Create structured logger
        const structuredLogger = createAppLogger(logger, true);
        setAppLogger(structuredLogger);

        // Create metrics instance
        const metrics = createAppMetrics(meter);
        setAppMetrics(metrics);

        // Record page load metrics
        const pageLoadDuration = Date.now() - pageLoadStart;
        metrics.recordPageLoadDuration(pageLoadDuration, "home");
        metrics.incrementPageViews("home", "form");

        // Log page load
        structuredLogger.info("Form page loaded", {
          "page.name": "home",
          "page.type": "form",
          "page.loadDuration": pageLoadDuration,
          "user.action": "page_load"
        });
      }).catch(console.error);
    }
  }, [pageLoadStart]);

  const formSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    interest: z.enum(["Frontend", "Backend", "Fullstack"]),
    message: z
      .string()
      .min(10, "Message must be at least 10 characters long")
      .max(500, "Message must be at most 500 characters long"),
    terms: z.boolean().refine((val) => val === true, {
      message: "You must accept the terms and conditions",
    }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      interest: "Frontend",
      message: "",
      terms: false,
    },
    reValidateMode: "onSubmit",
  });

  // Add form validation logging and metrics
  useEffect(() => {
    if (appLogger && appMetrics && form.formState.errors && Object.keys(form.formState.errors).length > 0) {
      const errorFields = Object.keys(form.formState.errors);

      appLogger.warn("Form validation errors", {
        "form.errors": errorFields,
        "form.errorCount": errorFields.length,
        "user.action": "form_validation_error"
      });

      // Record metrics for each validation error
      errorFields.forEach(field => {
        const error = form.formState.errors[field as keyof typeof form.formState.errors];
        appMetrics.incrementFormValidationErrors(field, error?.type || 'unknown');
      });
    }
  }, [form.formState.errors, appLogger, appMetrics, form]);

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    // Create a span for form submission
    const span = tracer?.startSpan("form_submission");
    const submissionStart = Date.now();

    try {
      // Set span attributes
      if (span) {
        span.setAttributes({
          "form.firstName": data.firstName,
          "form.lastName": data.lastName,
          "form.email": data.email,
          "form.interest": data.interest,
          "form.messageLength": data.message.length,
          "form.termsAccepted": data.terms,
        });

        // Set span in context
        trace.setSpan(context.active(), span);
      }

      // Log form submission
      if (appLogger) {
        appLogger.info("Form submitted successfully", {
          "form.firstName": data.firstName,
          "form.lastName": data.lastName,
          "form.email": data.email,
          "form.interest": data.interest,
          "form.messageLength": data.message.length,
          "form.termsAccepted": data.terms,
          "user.action": "form_submit"
        });
      }

      // Record metrics
      if (appMetrics) {
        const submissionDuration = Date.now() - submissionStart;
        appMetrics.incrementFormSubmissions(data.interest, "success");
        appMetrics.recordFormSubmissionDuration(submissionDuration, data.interest);
        appMetrics.incrementUserInteractions("submit", "form");
      }

      // Handle form submission logic here
      console.log("Form submitted:", data);

      // Set successful status
      if (span) {
        span.setStatus({ code: SpanStatusCode.OK });
      }
    } catch (error) {
      // Record error metrics
      if (appMetrics) {
        appMetrics.incrementFormSubmissions(data.interest, "error");
      }

      // Log error
      if (appLogger) {
        appLogger.error("Form submission failed", {
          error: (error as Error).message,
          "user.action": "form_submit_error"
        });
      }

      // Set error status on span
      if (span) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: (error as Error).message
        });
      }

      throw error;
    } finally {
      // End the span
      if (span) {
        span.end();
      }
    }
  };

  return (
    <Card className="w-200 shadow-md border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center justify-center text-blue-400 text-2xl font-semibold">
          Form Example
        </CardTitle>
        <CardDescription className="flex items-center justify-center text-blue-300 text-sm">
          Form example with React Hook Form, zod, Next.js, shadcn and Tailwind
          CSS
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex items-baseline justify-between gap-8 mb-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem className="w-1/2">
                    <FormLabel className="text-blue-400">First Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="border-blue-200 text-blue-400 focus:border-blue-400"
                      />
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem className="w-1/2">
                    <FormLabel className="text-blue-400">Last Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="border-blue-200 text-blue-400 focus:border-blue-400"
                      />
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel className="text-blue-400">Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="border-blue-200 text-blue-400 focus:border-blue-400"
                    />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="interest"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel className="text-blue-400">
                    What&apos;s your interest
                  </FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex items-center justify-between"
                    >
                      <FormItem className="flex items-center gap-2 ">
                        <FormControl>
                          <RadioGroupItem value="Frontend" />
                        </FormControl>
                        <FormLabel className="font-normal text-blue-400">
                          Frontend
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center gap-2">
                        <FormControl>
                          <RadioGroupItem value="Backend" />
                        </FormControl>
                        <FormLabel className="font-normal text-blue-400">
                          Backend
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center gap-2">
                        <FormControl>
                          <RadioGroupItem value="Fullstack" />
                        </FormControl>
                        <FormLabel className="font-normal text-blue-400">
                          Fullstack
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel className="text-blue-400">Message</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      className="border-blue-200 text-blue-400 focus:border-blue-400 resize-none"
                    />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="terms"
              render={({ field }) => (
                <div className="flex flex-col gap-2 mb-4">
                  <FormItem className="flex items-center">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="border-blue-200 text-blue-400 focus:border-blue-400"
                      />
                    </FormControl>
                    <FormLabel className="ml-2 text-blue-400">
                      I accept the terms and conditions
                    </FormLabel>
                  </FormItem>
                  <FormMessage className="text-red-500" />
                </div>
              )}
            />

            <Button
              type="submit"
              className="text-blue-400 border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors"
            >
              Submit
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
