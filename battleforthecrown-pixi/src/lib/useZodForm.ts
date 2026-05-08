import { useState } from 'react';

export type FormErrors = Partial<Record<string, string>>;

type SafeParseResult<T> =
  | { success: true; data: T }
  | {
      success: false;
      error: { issues: ReadonlyArray<{ path: ReadonlyArray<PropertyKey>; message: string }> };
    };

interface ParsableSchema<T> {
  safeParse(input: unknown): SafeParseResult<T>;
}

export function useZodForm<T>(schema: ParsableSchema<T>) {
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = (input: unknown): T | null => {
    const parsed = schema.safeParse(input);
    if (parsed.success) {
      setErrors({});
      return parsed.data;
    }
    const next: FormErrors = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      const field = typeof key === 'string' ? key : '_form';
      if (!next[field]) next[field] = issue.message;
    }
    setErrors(next);
    return null;
  };

  const clearErrors = () => setErrors({});

  return { errors, validate, clearErrors };
}
