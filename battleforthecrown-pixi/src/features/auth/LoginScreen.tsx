import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { loginSchema } from '@battleforthecrown/shared/auth';
import { ApiError } from '@/api';
import { useLoginMutation } from '@/api/queries';
import { AuthLoginScreen } from '@/features/design-system/components';
import { useZodForm } from '@/lib/useZodForm';
import { AuthScreenViewport } from './AuthScreenViewport';

const status = {
  batteryLabel: '100%',
  networkLabel: 'LTE',
  timeLabel: '09:41',
};

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
      <AuthLoginScreen
        backLabel="Accueil"
        crownIcon="/assets/crown.png"
        dividerLabel="Indisponible"
        fields={{
          email: {
            autoComplete: 'email',
            disabled: login.isPending,
            error: errors.email,
            icon: '@',
            id: 'login-email',
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
            autoComplete: 'current-password',
            disabled: login.isPending,
            error: errors.password,
            icon: '•',
            id: 'login-password',
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
        forgotAction={{
          disabled: true,
          id: 'forgot-password',
          label: 'Mot de passe oublié',
        }}
        footerAction={{
          disabled: login.isPending,
          id: 'register',
          label: 'Prêter serment',
          onClick: () => navigate('/auth/register'),
        }}
        footerPrompt="Nouveau au royaume ?"
        onBack={() => navigate('/')}
        onSubmit={onSubmit}
        remember={{
          checked: remember,
          label: 'Rester connecté',
          onChange: setRemember,
        }}
        ssoActions={[
          {
            disabled: true,
            id: 'google',
            kind: 'google',
            label: 'Google',
          },
          {
            disabled: true,
            id: 'apple',
            kind: 'apple',
            label: 'Apple',
          },
        ]}
        status={status}
        stepLabel="Entrée"
        submitError={submitError}
        submitAction={{
          disabled: login.isPending,
          id: 'submit-login',
          label: login.isPending ? 'Connexion...' : 'Se connecter',
          type: 'submit',
          variant: 'success',
        }}
        subtitle="Accède à ton village avec tes identifiants."
        title="Rejoindre le royaume"
      />
    </AuthScreenViewport>
  );
}
