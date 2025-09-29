"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { trace, metrics } from "@opentelemetry/api";
import { logs, SeverityNumber } from "@opentelemetry/api-logs";
import { useEffect } from "react";

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
  // Initialize OpenTelemetry components
  const tracer = trace.getTracer("form-example-client");
  const meter = metrics.getMeter("form-example-client");
  const logger = logs.getLogger("form-example-client");

  // Create metrics
  const formSubmissionCounter = meter.createCounter("form_submissions_total", {
    description: "Total number of form submissions",
  });

  const formValidationErrorCounter = meter.createCounter("form_validation_errors_total", {
    description: "Total number of form validation errors",
  });

  const formSubmissionDuration = meter.createHistogram("form_submission_duration_ms", {
    description: "Duration of form submission processing",
    unit: "ms",
  });

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

  // Monitor form validation errors
  useEffect(() => {
    const errors = form.formState.errors;
    const errorCount = Object.keys(errors).length;

    if (errorCount > 0) {
      // Record validation errors
      formValidationErrorCounter.add(errorCount);

      // Log validation errors
      logger.emit({
        severityNumber: SeverityNumber.WARN,
        severityText: "WARN",
        body: "Form validation errors detected",
        attributes: {
          "validation.error_count": errorCount,
          "validation.error_fields": Object.keys(errors).join(", "),
        },
      });

      // Create span for validation errors
      const span = tracer.startSpan("form_validation_error", {
        attributes: {
          "validation.error_count": errorCount,
          "validation.error_fields": Object.keys(errors).join(", "),
        },
      });

      span.addEvent("validation_errors_detected", {
        "error.fields": Object.keys(errors).join(", "),
      });

      span.end();
    }
  }, [form.formState.errors, formValidationErrorCounter, logger, tracer]);

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    const startTime = Date.now();

    // Create a span for form submission
    const span = tracer.startSpan("form_submission", {
      attributes: {
        "form.interest": data.interest,
        "form.message_length": data.message.length,
        "form.terms_accepted": data.terms,
      },
    });

    try {
      // Log form submission
      logger.emit({
        severityNumber: SeverityNumber.INFO,
        severityText: "INFO",
        body: "Form submission started",
        attributes: {
          "user.firstName": data.firstName,
          "user.lastName": data.lastName,
          "user.email": data.email,
          "form.interest": data.interest,
          "form.message_length": data.message.length,
        },
      });

      // Handle form submission logic here
      console.log("Form submitted:", data);

      // Record successful submission
      formSubmissionCounter.add(1, { status: "success", interest: data.interest });

      span.setStatus({ code: 1 }); // OK status
      span.addEvent("form_submitted_successfully");

      logger.emit({
        severityNumber: SeverityNumber.INFO,
        severityText: "INFO",
        body: "Form submission completed successfully",
        attributes: {
          "form.interest": data.interest,
          "submission.duration_ms": Date.now() - startTime,
        },
      });

    } catch (error) {
      // Record failed submission
      formSubmissionCounter.add(1, { status: "error", interest: data.interest });

      span.setStatus({ code: 2, message: (error as Error).message }); // ERROR status
      span.recordException(error as Error);

      logger.emit({
        severityNumber: SeverityNumber.ERROR,
        severityText: "ERROR",
        body: "Form submission failed",
        attributes: {
          error: (error as Error).message,
          "form.interest": data.interest,
        },
      });

      throw error;
    } finally {
      // Record submission duration
      const duration = Date.now() - startTime;
      formSubmissionDuration.record(duration, { interest: data.interest });

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
