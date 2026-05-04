import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { z } from 'zod';
import { Button } from '@/ui/buttons';
import { Input, InputLabel } from '@/ui/inputs';
import { Spinner } from '@/ui/spinners';
import { useLoginMutation } from '@/api/queries';
import { ApiError } from '@/api';

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Mot de passe : 6 caractères minimum'),
});

export function LoginScreen() {
  const navigate = useNavigate();
  const login = useLoginMutation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Formulaire invalide');
      return;
    }

    login.mutate(parsed.data, {
      onSuccess: () => navigate('/my-worlds'),
      onError: (err) => {
        if (err instanceof ApiError) {
          setError(err.message || 'Identifiants invalides');
        } else {
          setError('Connexion impossible. Réessayer.');
        }
      },
    });
  };

  return (
    <div className="flex min-h-full items-center justify-center px-6 py-12">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md space-y-6 rounded-lg border-4 border-game-gold-border bg-[#2a1f12]/90 p-8 shadow-xl"
      >
        <header className="text-center">
          <h1 className="font-game text-3xl text-game-gold-light text-shadow-game">Connexion</h1>
          <p className="mt-1 text-sm text-parchment/80">Accède à ton royaume</p>
        </header>

        <div className="space-y-2">
          <InputLabel htmlFor="email">Email</InputLabel>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={login.isPending}
            required
          />
        </div>

        <div className="space-y-2">
          <InputLabel htmlFor="password">Mot de passe</InputLabel>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={login.isPending}
            required
          />
        </div>

        {error && (
          <p role="alert" className="rounded border border-game-red-border bg-game-red-dark/30 px-3 py-2 text-sm text-white">
            {error}
          </p>
        )}

        <Button type="submit" variant="success" size="lg" disabled={login.isPending} className="w-full">
          {login.isPending ? <Spinner size="sm" /> : 'Se connecter'}
        </Button>

        <p className="text-center text-sm text-parchment/80">
          Pas de compte ?{' '}
          <Link to="/auth/register" className="font-bold text-game-gold-light underline">
            Crée ton royaume
          </Link>
        </p>
      </form>
    </div>
  );
}
