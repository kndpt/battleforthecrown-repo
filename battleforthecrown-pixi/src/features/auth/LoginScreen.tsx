import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { LogIn } from 'lucide-react';
import { loginSchema } from '@battleforthecrown/shared/auth';
import {
  Button,
  Input,
  InputHelperText,
  InputLabel,
  Panel,
  PanelBody,
  PanelHeader,
  Spinner,
} from '@/ui';
import { useLoginMutation } from '@/api/queries';
import { ApiError } from '@/api';
import { useZodForm } from '@/lib/useZodForm';

export function LoginScreen() {
  const navigate = useNavigate();
  const login = useLoginMutation();
  const { errors, validate, clearErrors } = useZodForm(loginSchema);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);

    const data = validate({ email, password });
    if (!data) return;

    login.mutate(data, {
      onSuccess: () => navigate('/my-worlds'),
      onError: (err) => {
        if (err instanceof ApiError) {
          setSubmitError(err.message || 'Identifiants invalides');
        } else {
          setSubmitError('Connexion impossible. Réessayer.');
        }
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e8d5b7] via-[#f5e6d3] to-[#d4c094] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Panel variant="parchment" padding="none" className="shadow-lg">
          <PanelHeader variant="default" className="border-b-2 border-[#8b7355]">
            <div className="flex items-center gap-3">
              <LogIn size={24} className="text-gray-700" />
              <div>
                <h1 className="font-cinzel text-2xl font-bold text-gray-800">
                  Rejoindre le Royaume
                </h1>
                <p className="text-sm text-gray-600 font-game">
                  Connecte-toi pour accéder à ton village
                </p>
              </div>
            </div>
          </PanelHeader>

          <PanelBody className="p-6">
            <form
              onSubmit={onSubmit}
              className="space-y-4"
              noValidate
              onChange={() => {
                if (submitError) setSubmitError(null);
                clearErrors();
              }}
            >
              <div className="space-y-1">
                <InputLabel htmlFor="email">Email</InputLabel>
                <Input
                  id="email"
                  type="email"
                  variant="parchment"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={login.isPending}
                  required
                />
                {errors.email && (
                  <InputHelperText variant="error">{errors.email}</InputHelperText>
                )}
              </div>

              <div className="space-y-1">
                <InputLabel htmlFor="password">Mot de passe</InputLabel>
                <Input
                  id="password"
                  type="password"
                  variant="parchment"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={login.isPending}
                  required
                />
                {errors.password && (
                  <InputHelperText variant="error">{errors.password}</InputHelperText>
                )}
              </div>

              {submitError && (
                <div role="alert">
                  <InputHelperText variant="error">{submitError}</InputHelperText>
                </div>
              )}

              <Button
                type="submit"
                variant="success"
                size="lg"
                disabled={login.isPending}
                className="w-full"
              >
                {login.isPending ? <Spinner size="sm" /> : 'Se connecter'}
              </Button>
            </form>
          </PanelBody>

          <div className="px-6 py-4 bg-[#e8d5b7] border-t-2 border-[#8b7355] text-center">
            <p className="text-sm text-gray-700 font-game">
              Nouveau au royaume ?{' '}
              <Link
                to="/auth/register"
                className="font-semibold text-gray-800 hover:text-gray-900 underline transition-colors"
              >
                Prêter serment
              </Link>
            </p>
          </div>
        </Panel>
      </div>
    </div>
  );
}
