import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { z } from 'zod';
import { Button } from '@/ui/buttons';
import { Input, InputLabel } from '@/ui/inputs';
import { Spinner } from '@/ui/spinners';
import { useRegisterMutation } from '@/api/queries';
import { ApiError } from '@/api';

const registerSchema = z
  .object({
    email: z.string().email('Email invalide'),
    password: z.string().min(6, 'Mot de passe : 6 caractères minimum'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

export function RegisterScreen() {
  const navigate = useNavigate();
  const register = useRegisterMutation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const parsed = registerSchema.safeParse({ email, password, confirmPassword });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Formulaire invalide');
      return;
    }

    register.mutate(
      { email: parsed.data.email, password: parsed.data.password },
      {
        onSuccess: () => navigate('/worlds'),
        onError: (err) => {
          if (err instanceof ApiError) {
            setError(err.message || "Échec de l'inscription");
          } else {
            setError('Inscription impossible. Réessayer.');
          }
        },
      },
    );
  };

  return (
    <div className="flex min-h-full items-center justify-center px-6 py-12">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md space-y-6 rounded-lg border-4 border-game-gold-border bg-[#2a1f12]/90 p-8 shadow-xl"
      >
        <header className="text-center">
          <h1 className="font-game text-3xl text-game-gold-light text-shadow-game">Nouveau royaume</h1>
          <p className="mt-1 text-sm text-parchment/80">Forge ton compte de seigneur</p>
        </header>

        <div className="space-y-2">
          <InputLabel htmlFor="email">Email</InputLabel>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={register.isPending}
            required
          />
        </div>

        <div className="space-y-2">
          <InputLabel htmlFor="password">Mot de passe</InputLabel>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={register.isPending}
            required
          />
        </div>

        <div className="space-y-2">
          <InputLabel htmlFor="confirm-password">Confirmation</InputLabel>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={register.isPending}
            required
          />
        </div>

        {error && (
          <p role="alert" className="rounded border border-game-red-border bg-game-red-dark/30 px-3 py-2 text-sm text-white">
            {error}
          </p>
        )}

        <Button type="submit" variant="warning" size="lg" disabled={register.isPending} className="w-full">
          {register.isPending ? <Spinner size="sm" /> : 'Créer le compte'}
        </Button>

        <p className="text-center text-sm text-parchment/80">
          Déjà un compte ?{' '}
          <Link to="/auth/login" className="font-bold text-game-gold-light underline">
            Connecte-toi
          </Link>
        </p>
      </form>
    </div>
  );
}
