import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { Crown, Scroll, Shield } from 'lucide-react';
import { z } from 'zod';
import { registerSchema } from '@battleforthecrown/shared/auth';
import {
  Button,
  Card,
  CardBanner,
  CardBody,
  CardFooter,
  Input,
  InputHelperText,
  InputLabel,
  Spinner,
} from '@/ui';
import { useRegisterMutation } from '@/api/queries';
import { ApiError } from '@/api';
import { useZodForm } from '@/lib/useZodForm';

// confirmPassword est purement front (pas envoyé au backend) → on étend le schema partagé localement.
const registerFormSchema = registerSchema
  .extend({ confirmPassword: z.string() })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

export function RegisterScreen() {
  const navigate = useNavigate();
  const register = useRegisterMutation();
  const { errors, validate, clearErrors } = useZodForm(registerFormSchema);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

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
          if (err instanceof ApiError) {
            setSubmitError(err.message || "Échec de l'inscription");
          } else {
            setSubmitError('Inscription impossible. Réessayer.');
          }
        },
      },
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e8d5b7] via-[#f5e6d3] to-[#d4c094] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <Shield className="absolute top-20 left-10 text-[#8b7355]/10" size={120} />
        <Crown className="absolute bottom-20 right-10 text-[#8b7355]/10" size={140} />
      </div>

      <div className="relative w-full max-w-md">
        <Card variant="parchment" size="fluid" className="shadow-2xl">
          <CardBanner variant="warning">Serment au Royaume</CardBanner>

          <CardBody className="pt-24 px-6 pb-6 space-y-4">
            <div className="flex items-center justify-center gap-3 text-center">
              <Crown size={24} className="text-game-gold-dark" />
              <p className="text-sm text-gray-600 font-game">
                Deviens citoyen du royaume et entame ton épopée
              </p>
              <Crown size={24} className="text-game-gold-dark" />
            </div>

            <div className="flex items-center gap-3">
              <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-game-gold-border to-transparent" />
              <Scroll size={16} className="text-game-gold-dark" />
              <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-game-gold-border to-transparent" />
            </div>

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
                <InputLabel htmlFor="register-email">Email</InputLabel>
                <Input
                  id="register-email"
                  type="email"
                  variant="parchment"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={register.isPending}
                  required
                />
                {errors.email && (
                  <InputHelperText variant="error">{errors.email}</InputHelperText>
                )}
              </div>

              <div className="space-y-1">
                <InputLabel htmlFor="register-password">Mot de passe</InputLabel>
                <Input
                  id="register-password"
                  type="password"
                  variant="parchment"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={register.isPending}
                  required
                />
                {errors.password && (
                  <InputHelperText variant="error">{errors.password}</InputHelperText>
                )}
              </div>

              <div className="space-y-1">
                <InputLabel htmlFor="register-confirm">Confirmation</InputLabel>
                <Input
                  id="register-confirm"
                  type="password"
                  variant="parchment"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={register.isPending}
                  required
                />
                {errors.confirmPassword && (
                  <InputHelperText variant="error">{errors.confirmPassword}</InputHelperText>
                )}
              </div>

              {submitError && (
                <div role="alert">
                  <InputHelperText variant="error">{submitError}</InputHelperText>
                </div>
              )}

              <Button
                type="submit"
                variant="warning"
                size="lg"
                disabled={register.isPending}
                className="w-full"
              >
                {register.isPending ? <Spinner size="sm" /> : 'Créer le compte'}
              </Button>
            </form>
          </CardBody>

          <CardFooter className="border-t-2 !py-2 border-[#d4c094] bg-[#e8d5b7]">
            <p className="text-sm text-gray-700 font-game text-center w-full">
              Déjà citoyen du royaume ?{' '}
              <Link
                to="/auth/login"
                className="font-semibold text-game-gold-dark hover:text-game-gold-border transition-colors underline"
              >
                Entrer au château
              </Link>
            </p>
          </CardFooter>
        </Card>

        <p className="mt-6 text-center text-sm text-gray-700 font-cinzel italic">
          « À ceux qui osent, le royaume offre gloire et richesses. »
        </p>
      </div>
    </div>
  );
}
