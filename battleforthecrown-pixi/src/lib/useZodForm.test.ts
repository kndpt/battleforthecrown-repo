import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { z } from 'zod';
import { useZodForm } from './useZodForm';

const schema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Mot de passe trop court'),
});

describe('useZodForm', () => {
  it('returns parsed data and clears errors when input is valid', () => {
    const { result } = renderHook(() => useZodForm(schema));

    let parsed: ReturnType<typeof result.current.validate> = null;
    act(() => {
      parsed = result.current.validate({ email: 'a@b.com', password: 'longenough' });
    });

    expect(parsed).toEqual({ email: 'a@b.com', password: 'longenough' });
    expect(result.current.errors).toEqual({});
  });

  it('returns null and exposes errors per field on invalid input', () => {
    const { result } = renderHook(() => useZodForm(schema));

    let parsed: ReturnType<typeof result.current.validate> = null;
    act(() => {
      parsed = result.current.validate({ email: 'nope', password: 'x' });
    });

    expect(parsed).toBeNull();
    expect(result.current.errors.email).toBe('Email invalide');
    expect(result.current.errors.password).toBe('Mot de passe trop court');
  });

  it('keeps only the first issue per field', () => {
    const tightSchema = z.object({
      password: z
        .string()
        .min(8, 'Mot de passe trop court')
        .regex(/\d/, 'Doit contenir un chiffre'),
    });
    const { result } = renderHook(() => useZodForm(tightSchema));

    act(() => {
      result.current.validate({ password: 'x' });
    });

    expect(result.current.errors.password).toBe('Mot de passe trop court');
  });

  it('attributes refine errors to the targeted path', () => {
    const refineSchema = z
      .object({ password: z.string(), confirm: z.string() })
      .refine((d) => d.password === d.confirm, {
        message: 'Les mots de passe ne correspondent pas',
        path: ['confirm'],
      });
    const { result } = renderHook(() => useZodForm(refineSchema));

    act(() => {
      result.current.validate({ password: 'aaa', confirm: 'bbb' });
    });

    expect(result.current.errors.confirm).toBe('Les mots de passe ne correspondent pas');
  });

  it('clears errors after a successful validation', () => {
    const { result } = renderHook(() => useZodForm(schema));

    act(() => {
      result.current.validate({ email: 'nope', password: 'x' });
    });
    expect(result.current.errors.email).toBeDefined();

    act(() => {
      result.current.validate({ email: 'a@b.com', password: 'longenough' });
    });
    expect(result.current.errors).toEqual({});
  });

  it('clears errors via clearErrors', () => {
    const { result } = renderHook(() => useZodForm(schema));

    act(() => {
      result.current.validate({ email: 'nope', password: 'x' });
    });
    act(() => {
      result.current.clearErrors();
    });

    expect(result.current.errors).toEqual({});
  });
});
