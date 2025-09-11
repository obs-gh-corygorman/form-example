"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { SpanStatusCode } from "@opentelemetry/api";
import { SeverityNumber } from "@opentelemetry/api-logs";

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

// Types for OpenTelemetry objects
interface OtelSpan {
  setStatus: (status: { code: number; message?: string }) => void;
  setAttributes: (attributes: Record<string, string | number | boolean>) => void;
  recordException: (error: Error) => void;
  end: () => void;
}

interface OtelTracer {
  startSpan: (name: string, options?: { attributes?: Record<string, string | number> }) => OtelSpan;
}

interface OtelLogger {
  emit: (options: {
    severityNumber: number;
    severityText: string;
    body: string;
    attributes?: Record<string, string | number>;
  }) => void;
}

export default function Home() {
  // OpenTelemetry instrumentation state
  const [tracer, setTracer] = useState<OtelTracer | null>(null);
  const [logger, setLogger] = useState<OtelLogger | null>(null);

  // Initialize OpenTelemetry client-side instrumentation
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("../../otel-client").then(({ tracer: clientTracer, logger: clientLogger }) => {
        setTracer(clientTracer);
        setLogger(clientLogger);
      }).catch((error) => {
        console.error("Failed to load OpenTelemetry client instrumentation:", error);
      });
    }
  }, []);

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

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    const startTime = Date.now();

    // Create a span for form submission if tracer is available
    if (tracer) {
      const span = tracer.startSpan("form.submit", {
        attributes: {
          "form.type": "contact_form",
          "user.interest": data.interest,
          "form.fields_count": Object.keys(data).length,
        },
      });

      try {
        // Handle form submission logic here
        console.log("Form submitted:", data);

        // Log successful form submission
        if (logger) {
          logger.emit({
            severityNumber: SeverityNumber.INFO,
            severityText: "INFO",
            body: "Form submitted successfully",
            attributes: {
              "form.type": "contact_form",
              "user.interest": data.interest,
              "user.email": data.email,
              "form.message_length": data.message.length,
              "form.duration_ms": Date.now() - startTime,
            },
          });
        }

        span.setStatus({ code: SpanStatusCode.OK });
        span.setAttributes({
          "form.submission_success": true,
          "form.duration_ms": Date.now() - startTime,
        });
      } catch (error) {
        // Log form submission error
        if (logger) {
          logger.emit({
            severityNumber: SeverityNumber.ERROR,
            severityText: "ERROR",
            body: "Form submission failed",
            attributes: {
              "form.type": "contact_form",
              "error.message": error instanceof Error ? error.message : "Unknown error",
              "form.duration_ms": Date.now() - startTime,
            },
          });
        }

        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : "Form submission failed"
        });
        span.recordException(error instanceof Error ? error : new Error("Unknown error"));

        throw error; // Re-throw to maintain original error handling
      } finally {
        span.end();
      }
    } else {
      // Fallback when OpenTelemetry is not available
      console.log("Form submitted:", data);
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
