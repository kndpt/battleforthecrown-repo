import { useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { registerSchema } from '@battleforthecrown/shared/auth';
import { z } from 'zod';
import { ApiError } from '@/api';
import { useRegisterMutation } from '@/api/queries';
import { AuthRegisterScreen } from '@/features/design-system/components';
import { useZodForm } from '@/lib/useZodForm';
import { AuthScreenViewport } from './AuthScreenViewport';

const registerFormSchema = registerSchema
  .extend({ confirmPassword: z.string() })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

const status = {
  batteryLabel: '100%',
  networkLabel: 'LTE',
  timeLabel: '09:41',
};

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
      <AuthRegisterScreen
        backLabel="Accueil"
        badgeIcon="/assets/crown.png"
        badgeLabel="Compte joueur"
        fields={{
          confirmPassword: {
            autoComplete: 'new-password',
            disabled: register.isPending,
            error: errors.confirmPassword,
            icon: '✓',
            id: 'register-confirm-password',
            label: 'Confirmation',
            name: 'confirmPassword',
            onChange: (value) => {
              clearFormErrors();
              setConfirmPassword(value);
            },
            onPasswordVisibleChange: setConfirmPasswordVisible,
            passwordVisible: confirmPasswordVisible,
            required: true,
            secure: true,
            value: confirmPassword,
          },
          email: {
            autoComplete: 'email',
            disabled: register.isPending,
            error: errors.email,
            icon: '@',
            id: 'register-email',
            label: 'Email',
            name: 'email',
            onChange: (value) => {
              clearFormErrors();
              setEmail(value);
            },
            placeholder: 'toi@royaume.test',
            required: true,
            type: 'email',
            value: email,
          },
          password: {
            autoComplete: 'new-password',
            disabled: register.isPending,
            error: errors.password,
            icon: '•',
            id: 'register-password',
            label: 'Mot de passe',
            name: 'password',
            onChange: (value) => {
              clearFormErrors();
              setPassword(value);
            },
            onPasswordVisibleChange: setPasswordVisible,
            passwordVisible,
            required: true,
            secure: true,
            value: password,
          },
        }}
        footerAction={{
          disabled: register.isPending,
          id: 'login',
          label: 'Entrer au château',
          onClick: () => navigate('/auth/login'),
        }}
        footerPrompt="Déjà citoyen du royaume ?"
        onBack={() => navigate('/')}
        onSubmit={onSubmit}
        status={status}
        stepLabel="Serment"
        strength={{
          labels: ['faible', 'correct', 'solide', 'royal'],
          score: passwordStrength,
          titlePrefix: 'Sécurité',
        }}
        submitError={submitError}
        submitAction={{
          disabled: register.isPending || !termsAccepted,
          id: 'submit-register',
          label: register.isPending ? 'Création...' : 'Créer le compte',
          type: 'submit',
          variant: 'warning',
        }}
        terms={{
          checked: termsAccepted,
          firstLinkLabel: 'conditions',
          firstText: "J'accepte les",
          onChange: setTermsAccepted,
          secondLinkLabel: 'charte du royaume',
          secondText: 'et la',
          suffix: '.',
        }}
        titleLines={['Prêter', 'serment']}
      />
    </AuthScreenViewport>
  );
}

