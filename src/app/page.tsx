"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { trace, context, SpanStatusCode, Tracer, Meter } from "@opentelemetry/api";
import { SeverityNumber, Logger } from "@opentelemetry/api-logs";

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
  // OpenTelemetry instances
  const [otelInstances, setOtelInstances] = useState<{
    tracer: Tracer;
    logger: Logger;
    meter: Meter;
  } | null>(null);

  useEffect(() => {
    // Get OpenTelemetry instances after client initialization
    const getOtelInstances = async () => {
      try {
        const { tracer, logger, meter } = await import("@/lib/otel-client");
        setOtelInstances({ tracer, logger, meter });
      } catch (error) {
        console.error("Failed to get OpenTelemetry instances:", error);
      }
    };

    // Wait a bit for OpenTelemetry to initialize
    const timer = setTimeout(getOtelInstances, 100);
    return () => clearTimeout(timer);
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
    mode: "onChange", // Enable real-time validation for metrics
  });

  // Track validation errors for metrics
  useEffect(() => {
    const errors = form.formState.errors;
    const meter = otelInstances?.meter;
    const logger = otelInstances?.logger;

    if (meter && Object.keys(errors).length > 0) {
      const validationErrorCounter = meter.createCounter("form_validation_errors_total", {
        description: "Total number of form validation errors",
      });

      // Count errors by field
      Object.keys(errors).forEach((fieldName) => {
        validationErrorCounter.add(1, {
          field: fieldName,
          errorType: errors[fieldName as keyof typeof errors]?.type || "unknown",
        });
      });

      // Log validation errors
      if (logger) {
        logger.emit({
          severityNumber: SeverityNumber.WARN,
          severityText: "WARN",
          body: "Form validation errors detected",
          attributes: {
            "validation.errorCount": Object.keys(errors).length,
            "validation.fields": Object.keys(errors).join(","),
          },
        });
      }
    }
  }, [form.formState.errors, otelInstances]);

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    // Create a span for form submission
    const tracer = otelInstances?.tracer || trace.getTracer("form-example-client");
    const logger = otelInstances?.logger;
    const meter = otelInstances?.meter;

    const span = tracer.startSpan("form_submission");

    try {
      // Set span in context
      trace.setSpan(context.active(), span);

      // Add span attributes
      span.setAttributes({
        "form.firstName": data.firstName,
        "form.lastName": data.lastName,
        "form.email": data.email,
        "form.interest": data.interest,
        "form.messageLength": data.message.length,
        "form.termsAccepted": data.terms,
      });

      // Log form submission
      if (logger) {
        logger.emit({
          severityNumber: SeverityNumber.INFO,
          severityText: "INFO",
          body: "Form submitted successfully",
          attributes: {
            "user.email": data.email,
            "user.interest": data.interest,
            "form.messageLength": data.message.length,
          },
        });
      }

      // Increment form submission counter
      if (meter) {
        const submissionCounter = meter.createCounter("form_submissions_total", {
          description: "Total number of form submissions",
        });
        submissionCounter.add(1, {
          interest: data.interest,
          status: "success",
        });
      }

      // Set span status as OK
      span.setStatus({ code: SpanStatusCode.OK });

      // Handle form submission logic here
      console.log("Form submitted:", data);
    } catch (error) {
      // Set span status as error
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: (error as Error).message
      });

      // Log error
      if (logger) {
        logger.emit({
          severityNumber: SeverityNumber.ERROR,
          severityText: "ERROR",
          body: "Form submission failed",
          attributes: {
            "error.message": (error as Error).message,
            "user.email": data.email,
          },
        });
      }

      // Increment error counter
      if (meter) {
        const submissionCounter = meter.createCounter("form_submissions_total", {
          description: "Total number of form submissions",
        });
        submissionCounter.add(1, {
          interest: data.interest,
          status: "error",
        });
      }

      throw error;
    } finally {
      span.end();
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
