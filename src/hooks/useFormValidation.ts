import { useState, useCallback, useEffect } from 'react';
import { z } from 'zod';

interface ValidationState {
  [key: string]: {
    isValid: boolean;
    error: string;
    isTouched: boolean;
  };
}

interface UseFormValidationOptions<T> {
  schema: z.ZodSchema<T>;
  initialValues: T;
  debounceMs?: number;
}

export function useFormValidation<T extends Record<string, any>>({
  schema,
  initialValues,
  debounceMs = 300,
}: UseFormValidationOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [validationState, setValidationState] = useState<ValidationState>({});
  const [isValidating, setIsValidating] = useState(false);

  // Debounce timer
  const [debounceTimers, setDebounceTimers] = useState<Record<string, NodeJS.Timeout>>({});

  const validateField = useCallback(
    (fieldName: keyof T, value: any) => {
      try {
        // Get the field schema
        const fieldSchema = (schema as any).shape[fieldName];
        if (!fieldSchema) return;

        // Validate the field
        fieldSchema.parse(value);

        setValidationState((prev) => ({
          ...prev,
          [fieldName]: {
            isValid: true,
            error: '',
            isTouched: prev[fieldName]?.isTouched || false,
          },
        }));
      } catch (error) {
        if (error instanceof z.ZodError) {
          setValidationState((prev) => ({
            ...prev,
            [fieldName]: {
              isValid: false,
              error: error.errors[0]?.message || 'Invalid value',
              isTouched: prev[fieldName]?.isTouched || false,
            },
          }));
        }
      }
    },
    [schema]
  );

  const handleChange = useCallback(
    (fieldName: keyof T, value: any) => {
      setValues((prev) => ({ ...prev, [fieldName]: value }));

      // Mark field as touched
      setValidationState((prev) => ({
        ...prev,
        [fieldName]: {
          ...prev[fieldName],
          isTouched: true,
        },
      }));

      // Clear existing debounce timer for this field
      if (debounceTimers[fieldName as string]) {
        clearTimeout(debounceTimers[fieldName as string]);
      }

      // Set new debounce timer
      const timer = setTimeout(() => {
        validateField(fieldName, value);
      }, debounceMs);

      setDebounceTimers((prev) => ({
        ...prev,
        [fieldName as string]: timer,
      }));
    },
    [validateField, debounceMs, debounceTimers]
  );

  const validateAll = useCallback((): boolean => {
    try {
      schema.parse(values);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newValidationState: ValidationState = {};
        error.errors.forEach((err) => {
          const fieldName = err.path[0] as string;
          newValidationState[fieldName] = {
            isValid: false,
            error: err.message,
            isTouched: true,
          };
        });
        setValidationState(newValidationState);
      }
      return false;
    }
  }, [schema, values]);

  const resetValidation = useCallback(() => {
    setValidationState({});
    setValues(initialValues);
  }, [initialValues]);

  const isFormValid = useCallback((): boolean => {
    return Object.values(validationState).every((field) => field.isValid || !field.isTouched);
  }, [validationState]);

  // Cleanup debounce timers on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimers).forEach((timer) => clearTimeout(timer));
    };
  }, [debounceTimers]);

  return {
    values,
    validationState,
    handleChange,
    validateAll,
    resetValidation,
    isFormValid,
    isValidating,
  };
}
