"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useCallback } from "react";
import { trace, metrics } from "@opentelemetry/api";
import { logs as logsApi, SeverityNumber } from "@opentelemetry/api-logs";

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
  // OpenTelemetry setup
  const tracer = trace.getTracer("form-example-client");
  const meter = metrics.getMeter("form-example-client");
  const logger = logsApi.getLogger("form-example-client");

  // Metrics
  const formSubmissionCounter = meter.createCounter("form_submissions_total", {
    description: "Total number of form submissions",
  });
  const formValidationErrorCounter = meter.createCounter("form_validation_errors_total", {
    description: "Total number of form validation errors",
  });
  const formFieldInteractionCounter = meter.createCounter("form_field_interactions_total", {
    description: "Total number of form field interactions",
  });
  const formSubmissionDuration = meter.createHistogram("form_submission_duration_ms", {
    description: "Duration of form submission process in milliseconds",
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

  // Track form initialization
  useEffect(() => {
    const span = tracer.startSpan("form_initialized");
    span.setAttributes({
      "form.type": "contact_form",
      "form.fields_count": 6,
      "form.validation_mode": "onSubmit",
    });

    logger.emit({
      severityNumber: SeverityNumber.INFO,
      severityText: "INFO",
      body: "Contact form initialized",
      attributes: {
        "form.type": "contact_form",
        "form.fields": ["firstName", "lastName", "email", "interest", "message", "terms"],
      },
    });

    span.end();
  }, [tracer, logger]);

  // Enhanced form submission with instrumentation
  const onSubmit = useCallback((data: z.infer<typeof formSchema>) => {
    const submissionStartTime = Date.now();
    const span = tracer.startSpan("form_submission");

    try {
      span.setAttributes({
        "form.type": "contact_form",
        "form.interest": data.interest,
        "form.message_length": data.message.length,
        "form.terms_accepted": data.terms,
        "user.email_domain": data.email.split("@")[1] || "unknown",
      });

      // Log form submission
      logger.emit({
        severityNumber: SeverityNumber.INFO,
        severityText: "INFO",
        body: "Form submission started",
        attributes: {
          "form.type": "contact_form",
          "form.interest": data.interest,
          "form.message_length": data.message.length,
          "user.email_domain": data.email.split("@")[1] || "unknown",
        },
      });

      // Simulate form processing (in real app, this would be an API call)
      console.log("Form submitted:", data);

      // Record successful submission
      formSubmissionCounter.add(1, {
        status: "success",
        interest: data.interest
      });

      const duration = Date.now() - submissionStartTime;
      formSubmissionDuration.record(duration, {
        status: "success"
      });

      span.setStatus({ code: 1 }); // OK
      span.end();

      logger.emit({
        severityNumber: SeverityNumber.INFO,
        severityText: "INFO",
        body: "Form submission completed successfully",
        attributes: {
          "form.submission_duration_ms": duration,
          "form.status": "success",
        },
      });

    } catch (error) {
      const duration = Date.now() - submissionStartTime;

      span.recordException(error as Error);
      span.setStatus({
        code: 2, // ERROR
        message: (error as Error).message
      });
      span.end();

      formSubmissionCounter.add(1, {
        status: "error",
        interest: data.interest
      });

      formSubmissionDuration.record(duration, {
        status: "error"
      });

      logger.emit({
        severityNumber: SeverityNumber.ERROR,
        severityText: "ERROR",
        body: "Form submission failed",
        attributes: {
          "form.submission_duration_ms": duration,
          "form.status": "error",
          "error.message": (error as Error).message,
        },
      });

      throw error;
    }
  }, [tracer, logger, formSubmissionCounter, formSubmissionDuration]);

  // Track form validation errors
  const handleFormError = useCallback((errors: Record<string, { message?: string }>) => {
    const span = tracer.startSpan("form_validation_error");
    const errorFields = Object.keys(errors);

    span.setAttributes({
      "form.validation_error_count": errorFields.length,
      "form.error_fields": errorFields.join(","),
    });

    errorFields.forEach(field => {
      formValidationErrorCounter.add(1, {
        field: field,
        error_type: "validation"
      });
    });

    logger.emit({
      severityNumber: SeverityNumber.WARN,
      severityText: "WARN",
      body: "Form validation errors occurred",
      attributes: {
        "form.error_count": errorFields.length,
        "form.error_fields": errorFields,
        "form.errors": JSON.stringify(errors),
      },
    });

    span.end();
  }, [tracer, logger, formValidationErrorCounter]);

  // Track field interactions
  const trackFieldInteraction = useCallback((fieldName: string, action: string) => {
    formFieldInteractionCounter.add(1, {
      field: fieldName,
      action: action
    });
  }, [formFieldInteractionCounter]);

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
          <form onSubmit={form.handleSubmit(onSubmit, handleFormError)}>
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
                        onFocus={() => trackFieldInteraction("firstName", "focus")}
                        onChange={(e) => {
                          field.onChange(e);
                          trackFieldInteraction("firstName", "change");
                        }}
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
                        onFocus={() => trackFieldInteraction("lastName", "focus")}
                        onChange={(e) => {
                          field.onChange(e);
                          trackFieldInteraction("lastName", "change");
                        }}
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
                      onFocus={() => trackFieldInteraction("email", "focus")}
                      onChange={(e) => {
                        field.onChange(e);
                        trackFieldInteraction("email", "change");
                      }}
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
                      onValueChange={(value) => {
                        field.onChange(value);
                        trackFieldInteraction("interest", "change");
                      }}
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
                      onFocus={() => trackFieldInteraction("message", "focus")}
                      onChange={(e) => {
                        field.onChange(e);
                        trackFieldInteraction("message", "change");
                      }}
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
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          trackFieldInteraction("terms", "change");
                        }}
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
