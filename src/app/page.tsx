"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { trace, context, SpanStatusCode, Tracer } from "@opentelemetry/api";
import { SeverityNumber } from "@opentelemetry/api-logs";
import type { Logger } from "@opentelemetry/api-logs";

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
  const [tracer, setTracer] = useState<Tracer | null>(null);
  const [logger, setLogger] = useState<Logger | null>(null);

  // Initialize OpenTelemetry components when available
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Get tracer and logger from the global registry after initialization
      const otelTracer = trace.getTracer("form-example-client");
      setTracer(otelTracer);

      // Import logger from client setup
      import("../../otel-client").then(({ logger: otelLogger }) => {
        setLogger(otelLogger);
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
    // Create a span for form submission if tracer is available
    if (tracer) {
      const span = tracer.startSpan("form.submit");
      try {
        // Set span in context
        trace.setSpan(context.active(), span);

        // Add form data as span attributes (excluding sensitive data)
        span.setAttributes({
          "form.interest": data.interest,
          "form.message_length": data.message.length,
          "form.terms_accepted": data.terms,
        });

        // Log form submission
        if (logger) {
          logger.emit({
            severityNumber: SeverityNumber.INFO,
            severityText: "INFO",
            body: "Form submitted successfully",
            attributes: {
              interest: data.interest,
              messageLength: data.message.length,
              termsAccepted: data.terms,
            },
          });
        }

        // Handle form submission logic here
        console.log("Form submitted:", data);

        span.setStatus({ code: SpanStatusCode.OK });
      } catch (error) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : "Unknown error"
        });

        if (logger) {
          logger.emit({
            severityNumber: SeverityNumber.ERROR,
            severityText: "ERROR",
            body: "Form submission failed",
            attributes: {
              error: error instanceof Error ? error.message : "Unknown error",
            },
          });
        }
        throw error;
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
