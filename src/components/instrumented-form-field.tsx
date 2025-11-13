"use client";

import { ReactNode } from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Control, FieldPath, FieldValues } from "react-hook-form";

interface InstrumentedFormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  control: Control<TFieldValues>;
  name: TName;
  label: string;
  children: (field: { onChange: (value: unknown) => void; onBlur: () => void; onFocus: () => void; value: string; name: string }) => ReactNode;
  className?: string;
  onFieldInteraction?: (fieldName: string, action: string, value?: string | number | boolean) => void;
}

export function InstrumentedFormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  control,
  name,
  label,
  children,
  className,
  onFieldInteraction,
}: InstrumentedFormFieldProps<TFieldValues, TName>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        // Create instrumented field with telemetry
        const instrumentedField = {
          ...field,
          onChange: (value: unknown) => {
            field.onChange(value);
            onFieldInteraction?.(name, "change", String(value));
          },
          onBlur: () => {
            field.onBlur();
            onFieldInteraction?.(name, "blur", String(field.value));
          },
          onFocus: () => {
            onFieldInteraction?.(name, "focus", String(field.value));
          },
        };

        return (
          <FormItem className={className}>
            <FormLabel className="text-blue-400">{label}</FormLabel>
            <FormControl>
              {children(instrumentedField)}
            </FormControl>
            <FormMessage className="text-red-500" />
          </FormItem>
        );
      }}
    />
  );
}
