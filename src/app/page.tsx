"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { trace, context, SpanStatusCode } from "@opentelemetry/api";
import { SeverityNumber } from "@opentelemetry/api-logs";
import { getOtelComponents } from "@/lib/otel-client";

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
  const { tracer, logger, meter } = getOtelComponents();

  // Create metrics
  const formSubmissionCounter = meter.createCounter("form_submissions_total", {
    description: "Total number of form submissions",
  });

  const formValidationErrorCounter = meter.createCounter("form_validation_errors_total", {
    description: "Total number of form validation errors",
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

  // Track page load and component mount
  useEffect(() => {
    const span = tracer.startSpan("form_page_load");

    try {
      trace.setSpan(context.active(), span);
      span.setAttributes({
        "page.name": "form-example",
        "component.name": "Home",
        "user.session_id": crypto.randomUUID(),
      });

      logger.emit({
        severityNumber: SeverityNumber.INFO,
        severityText: "INFO",
        body: "Form page loaded",
        attributes: {
          page: "form-example",
          timestamp: new Date().toISOString(),
        },
      });

      span.setStatus({ code: SpanStatusCode.OK });
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : "Unknown error"
      });

      logger.emit({
        severityNumber: SeverityNumber.ERROR,
        severityText: "ERROR",
        body: "Error during page load",
        attributes: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      });
    } finally {
      span.end();
    }
  }, [tracer, logger]);

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    const span = tracer.startSpan("form_submission");
    const submissionId = crypto.randomUUID();

    try {
      trace.setSpan(context.active(), span);

      // Set span attributes
      span.setAttributes({
        "form.submission_id": submissionId,
        "form.interest": data.interest,
        "form.message_length": data.message.length,
        "form.email_domain": data.email.split("@")[1] || "unknown",
        "user.first_name": data.firstName,
        "user.last_name": data.lastName,
        "form.terms_accepted": data.terms,
      });

      // Log form submission start
      logger.emit({
        severityNumber: SeverityNumber.INFO,
        severityText: "INFO",
        body: "Form submission started",
        attributes: {
          submission_id: submissionId,
          interest: data.interest,
          email_domain: data.email.split("@")[1] || "unknown",
          message_length: data.message.length,
          timestamp: new Date().toISOString(),
        },
      });

      // Simulate form processing (in a real app, this would be an API call)
      console.log("Form submitted:", data);

      // Record successful submission
      formSubmissionCounter.add(1, {
        status: "success",
        interest: data.interest,
      });

      // Log successful submission
      logger.emit({
        severityNumber: SeverityNumber.INFO,
        severityText: "INFO",
        body: "Form submission completed successfully",
        attributes: {
          submission_id: submissionId,
          status: "success",
          timestamp: new Date().toISOString(),
        },
      });

      span.setStatus({ code: SpanStatusCode.OK });

    } catch (error) {
      // Record failed submission
      formSubmissionCounter.add(1, {
        status: "error",
        interest: data.interest,
      });

      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : "Form submission failed"
      });

      logger.emit({
        severityNumber: SeverityNumber.ERROR,
        severityText: "ERROR",
        body: "Form submission failed",
        attributes: {
          submission_id: submissionId,
          error: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString(),
        },
      });

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
          <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
            // Track validation errors
            const span = tracer.startSpan("form_validation_error");

            try {
              trace.setSpan(context.active(), span);

              const errorFields = Object.keys(errors);
              const errorMessages = Object.values(errors).map(error => error?.message).filter(Boolean);

              span.setAttributes({
                "form.validation_error_count": errorFields.length,
                "form.error_fields": errorFields.join(","),
              });

              formValidationErrorCounter.add(1, {
                error_count: errorFields.length.toString(),
              });

              logger.emit({
                severityNumber: SeverityNumber.WARN,
                severityText: "WARN",
                body: "Form validation errors occurred",
                attributes: {
                  error_fields: errorFields,
                  error_messages: errorMessages,
                  error_count: errorFields.length,
                  timestamp: new Date().toISOString(),
                },
              });

              span.setStatus({ code: SpanStatusCode.OK });
            } catch (error) {
              span.setStatus({
                code: SpanStatusCode.ERROR,
                message: error instanceof Error ? error.message : "Error tracking validation"
              });
            } finally {
              span.end();
            }
          })}>
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
