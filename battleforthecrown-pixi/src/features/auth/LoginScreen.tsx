import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { loginSchema } from '@battleforthecrown/shared/auth';
import { ApiError } from '@/api';
import { useLoginMutation } from '@/api/queries';
import {
  AuthBackButton,
  AuthButton,
  AuthDivider,
  AuthField,
  AuthSsoChip,
} from '@/features/design-system/components';
import { useZodForm } from '@/lib/useZodForm';
import { AuthRuntimePanel, AuthScreenViewport } from './AuthScreenViewport';

export function LoginScreen() {
  const navigate = useNavigate();
  const login = useLoginMutation();
  const { errors, validate, clearErrors } = useZodForm(loginSchema);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [remember, setRemember] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const clearFormErrors = () => {
    if (submitError) setSubmitError(null);
    clearErrors();
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);

    const data = validate({ email, password });
    if (!data) return;

    login.mutate(data, {
      onSuccess: () => navigate('/game'),
      onError: (err) => {
        setSubmitError(
          err instanceof ApiError
            ? err.message || 'Identifiants invalides'
            : 'Connexion impossible. Réessayer.',
        );
      },
    });
  };

  return (
    <AuthScreenViewport>
      <AuthRuntimePanel>
        <div className="mb-4 flex items-center justify-between">
          <AuthBackButton label="Accueil" onClick={() => navigate('/')} />
          <span className="font-game text-[10px] font-bold uppercase tracking-[.3em] text-[#6d5838]">
            Entrée
          </span>
        </div>

        <div className="mb-5 text-center">
          <h1 className="font-game text-[24px] font-black tracking-[.02em] text-[#3c2619] [text-shadow:1px_1px_0_rgba(255,255,255,.5)]">
            Rejoindre le royaume
          </h1>
          <p className="mt-1 font-game text-[12px] italic text-[#6d5838]">
            Accède à ton village avec tes identifiants.
          </p>
        </div>

        <form className="grid gap-3.5" noValidate onSubmit={onSubmit}>
          <AuthField
            autoComplete="email"
            disabled={login.isPending}
            error={errors.email}
            icon="@"
            id="login-email"
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
          <AuthField
            autoComplete="current-password"
            disabled={login.isPending}
            error={errors.password}
            icon="•"
            id="login-password"
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

          {submitError ? (
            <div className="font-game text-[11px] font-semibold text-[#a13a2a]" role="alert">
              {submitError}
            </div>
          ) : null}

          <div className="flex items-center justify-between font-game text-[11px] font-bold text-[#6d5838]">
            <label className="inline-flex cursor-pointer items-center gap-1.5">
              <input
                checked={remember}
                className="sr-only"
                onChange={(event) => setRemember(event.target.checked)}
                type="checkbox"
              />
              <span className="flex size-4 items-center justify-center rounded border-[1.5px] border-[#3a6c1f] bg-[linear-gradient(to_bottom,#6ebf49,#4a8c2a)] text-[11px] font-black leading-none text-white">
                {remember ? '✓' : ''}
              </span>
              Rester connecté
            </label>
            <button
              className="cursor-not-allowed border-0 border-b-[1.5px] border-solid border-[rgba(60,38,25,.35)] bg-transparent p-0 pb-px font-game font-bold text-[#6d5838] disabled:opacity-[.58]"
              disabled
              type="button"
            >
              Mot de passe oublié
            </button>
          </div>

          <AuthButton disabled={login.isPending} full size="lg" type="submit" variant="success">
            {login.isPending ? 'Connexion...' : 'Se connecter'}
          </AuthButton>
        </form>

        <div className="mt-4 grid gap-3">
          <AuthDivider label="Indisponible" />
          <div className="flex gap-2">
            <AuthSsoChip disabled id="google" kind="google" label="Google" />
            <AuthSsoChip disabled id="apple" kind="apple" label="Apple" />
          </div>
          <div className="text-center font-game text-[11.5px] font-bold text-[#6d5838]">
            Nouveau au royaume ?
            <button
              className="ml-1.5 border-0 border-b-[1.5px] border-solid border-[rgba(60,38,25,.5)] bg-transparent p-0 pb-px font-game font-bold text-[#3c2619] disabled:opacity-[.55]"
              disabled={login.isPending}
              onClick={() => navigate('/auth/register')}
              type="button"
            >
              Prêter serment
            </button>
          </div>
        </div>
      </AuthRuntimePanel>
    </AuthScreenViewport>
  );
}

