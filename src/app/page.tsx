"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFormTelemetry } from "@/hooks/use-form-telemetry";
import { InstrumentedFormField } from "@/components/instrumented-form-field";
import { formLogger, logUserAction, logBusinessEvent } from "@/lib/logger";
import { recordPageView, recordFormSubmission, recordUserAction, recordBusinessEvent } from "@/lib/metrics";
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

  // Initialize form telemetry
  const { trackFieldInteraction, trackValidation, trackSubmission } = useFormTelemetry({
    formName: "contact-form",
    userId: "anonymous", // In a real app, this would come from auth context
  });

  // Log component initialization and record metrics
  useEffect(() => {
    const pageLoadStart = performance.now();

    formLogger.info("Contact form component initialized", {
      component: "ContactForm",
      formName: "contact-form",
      userId: "anonymous",
    });

    logUserAction("form_page_viewed", {
      formName: "contact-form",
      timestamp: new Date().toISOString(),
    });

    // Record page view metrics
    recordPageView("contact-form", {
      userId: "anonymous",
      timestamp: new Date().toISOString(),
    });

    recordUserAction("page_viewed", {
      page: "contact-form",
      userId: "anonymous",
    });

    // Record page load performance
    const pageLoadDuration = performance.now() - pageLoadStart;
    recordBusinessEvent("page_load_completed", 1, {
      page: "contact-form",
      duration: pageLoadDuration.toString(),
    });
  }, []);

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

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    const startTime = Date.now();

    try {
      // Log form submission attempt
      await formLogger.info("Form submission started", {
        component: "ContactForm",
        formName: "contact-form",
        userId: "anonymous",
        hasFirstName: !!data.firstName,
        hasLastName: !!data.lastName,
        hasEmail: !!data.email,
        interest: data.interest,
        messageLength: data.message.length,
        termsAccepted: data.terms,
      });

      // Track form validation before submission
      const isValid = Object.keys(form.formState.errors).length === 0;
      await trackValidation(isValid, form.formState.errors);

      // Track form submission
      await trackSubmission(data, true);

      // Log successful submission and record metrics
      const duration = Date.now() - startTime;
      await logBusinessEvent("form_submitted_successfully", {
        formName: "contact-form",
        userId: "anonymous",
        duration,
        interest: data.interest,
      });

      // Record form submission metrics
      recordFormSubmission("contact-form", true, {
        userId: "anonymous",
        interest: data.interest,
        duration: duration.toString(),
      });

      recordBusinessEvent("form_submission_success", 1, {
        formName: "contact-form",
        interest: data.interest,
        duration: duration.toString(),
      });

      // Handle form submission logic here
      console.log("Form submitted:", data);
    } catch (error) {
      // Track failed submission
      await trackSubmission(data, false, error as Error);

      // Log submission error and record metrics
      const errorDuration = Date.now() - startTime;
      await formLogger.error("Form submission failed", error as Error, {
        component: "ContactForm",
        formName: "contact-form",
        userId: "anonymous",
        duration: errorDuration,
      });

      // Record failed submission metrics
      recordFormSubmission("contact-form", false, {
        userId: "anonymous",
        error: (error as Error).message,
        duration: errorDuration.toString(),
      });

      recordBusinessEvent("form_submission_error", 1, {
        formName: "contact-form",
        error: (error as Error).message,
        duration: errorDuration.toString(),
      });

      console.error("Form submission failed:", error);
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

            <InstrumentedFormField
              control={form.control}
              name="email"
              label="Email"
              className="mb-4"
              onFieldInteraction={trackFieldInteraction}
            >
              {(field) => (
                <Input
                  {...field}
                  className="border-blue-200 text-blue-400 focus:border-blue-400"
                />
              )}
            </InstrumentedFormField>

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
