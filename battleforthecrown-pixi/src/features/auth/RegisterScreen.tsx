import { useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { registerSchema } from '@battleforthecrown/shared/auth';
import { z } from 'zod';
import { ApiError } from '@/api';
import { useRegisterMutation } from '@/api/queries';
import {
  AuthBackButton,
  AuthButton,
  AuthField,
  AuthStrengthMeter,
} from '@/features/design-system/components';
import { useZodForm } from '@/lib/useZodForm';
import { AuthRuntimePanel, AuthScreenViewport } from './AuthScreenViewport';

const registerFormSchema = registerSchema
  .extend({ confirmPassword: z.string() })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

function getPasswordStrength(password: string): number {
  const hasLength = password.length >= 8;
  const hasMixedCase = /[a-z]/.test(password) && /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  return Math.max(1, [hasLength, hasMixedCase, hasDigit, hasSymbol].filter(Boolean).length);
}

export function RegisterScreen() {
  const navigate = useNavigate();
  const register = useRegisterMutation();
  const { errors, validate, clearErrors } = useZodForm(registerFormSchema);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

  const clearFormErrors = () => {
    if (submitError) setSubmitError(null);
    clearErrors();
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);

    const data = validate({ email, password, confirmPassword });
    if (!data) return;

    register.mutate(
      { email: data.email, password: data.password },
      {
        onSuccess: () => navigate('/worlds'),
        onError: (err) => {
          setSubmitError(
            err instanceof ApiError
              ? err.message || "Échec de l'inscription"
              : 'Inscription impossible. Réessayer.',
          );
        },
      },
    );
  };

  return (
    <AuthScreenViewport>
      <AuthRuntimePanel>
        <div className="mb-4 flex items-center justify-between">
          <AuthBackButton label="Accueil" onClick={() => navigate('/')} />
          <span className="font-game text-[10px] font-bold uppercase tracking-[.3em] text-[#6d5838]">
            Serment
          </span>
        </div>

        <div className="mb-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-[#9e7b0d] bg-[linear-gradient(to_bottom,#f6d57b,#c59e3f)] px-2.5 py-1 font-game text-[9.5px] font-extrabold uppercase tracking-[.18em] text-[#3a2a00] shadow-[inset_0_1px_0_rgba(255,255,255,.5)]">
            Compte joueur
          </div>
          <h1 className="mt-2 font-game text-[24px] font-black leading-[1.05] tracking-[.02em] text-[#3c2619] [text-shadow:1px_1px_0_rgba(255,255,255,.5)]">
            Prêter serment
          </h1>
        </div>

        <form className="grid gap-3" noValidate onSubmit={onSubmit}>
          <AuthField
            autoComplete="email"
            disabled={register.isPending}
            error={errors.email}
            icon="@"
            id="register-email"
            label="Email"
            name="email"
            onChange={(value) => {
              clearFormErrors();
              setEmail(value);
            }}
            placeholder="toi@royaume.test"
            required
            type="email"
            value={email}
          />
          <div className="grid gap-1">
            <AuthField
              autoComplete="new-password"
              disabled={register.isPending}
              error={errors.password}
              icon="•"
              id="register-password"
              label="Mot de passe"
              name="password"
              onChange={(value) => {
                clearFormErrors();
                setPassword(value);
              }}
              onPasswordVisibleChange={setPasswordVisible}
              passwordVisible={passwordVisible}
              required
              secure
              value={password}
            />
            <AuthStrengthMeter
              labels={['faible', 'correct', 'solide', 'royal']}
              score={passwordStrength}
              titlePrefix="Sécurité"
            />
          </div>
          <AuthField
            autoComplete="new-password"
            disabled={register.isPending}
            error={errors.confirmPassword}
            icon="✓"
            id="register-confirm-password"
            label="Confirmation"
            name="confirmPassword"
            onChange={(value) => {
              clearFormErrors();
              setConfirmPassword(value);
            }}
            onPasswordVisibleChange={setConfirmPasswordVisible}
            passwordVisible={confirmPasswordVisible}
            required
            secure
            value={confirmPassword}
          />

          {submitError ? (
            <div className="font-game text-[11px] font-semibold text-[#a13a2a]" role="alert">
              {submitError}
            </div>
          ) : null}

          <label className="flex cursor-pointer items-start gap-2 font-game text-[10.5px] font-semibold leading-[1.35] text-[#6d5838]">
            <input
              checked={termsAccepted}
              className="sr-only"
              onChange={(event) => setTermsAccepted(event.target.checked)}
              type="checkbox"
            />
            <span className="mt-px flex size-4 shrink-0 items-center justify-center rounded border-[1.5px] border-[#3a6c1f] bg-[linear-gradient(to_bottom,#6ebf49,#4a8c2a)] text-[11px] font-black leading-none text-white">
              {termsAccepted ? '✓' : ''}
            </span>
            <span className="min-w-0 flex-1">
              J&apos;accepte les <span className="border-b border-dotted border-current text-[#3c2619]">conditions</span> et la{' '}
              <span className="border-b border-dotted border-current text-[#3c2619]">charte du royaume</span>.
            </span>
          </label>

          <AuthButton
            disabled={register.isPending || !termsAccepted}
            full
            size="lg"
            type="submit"
            variant="warning"
          >
            {register.isPending ? 'Création...' : 'Créer le compte'}
          </AuthButton>
        </form>

        <div className="mt-3 text-center font-game text-[11px] font-bold text-[#6d5838]">
          Déjà citoyen du royaume ?
          <button
            className="ml-1.5 border-0 border-b-[1.5px] border-solid border-[rgba(60,38,25,.5)] bg-transparent p-0 pb-px font-game font-bold text-[#3c2619] disabled:opacity-[.55]"
            disabled={register.isPending}
            onClick={() => navigate('/auth/login')}
            type="button"
          >
            Entrer au château
          </button>
        </div>
      </AuthRuntimePanel>
    </AuthScreenViewport>
  );
}

