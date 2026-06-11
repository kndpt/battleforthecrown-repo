import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiClient, ApiError } from '@/api';
import { useAuthStore } from '@/stores/auth';
import { LandingScreen } from './LandingScreen';
import { LoginScreen } from './LoginScreen';
import { RegisterScreen } from './RegisterScreen';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  });
}

function authResponse(email: string, displayName = 'Sire Test') {
  return {
    accessToken: 'access-token',
    displayName,
    email,
    refreshToken: 'refresh-token',
    userId: 'user-1',
  };
}

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location-path">{location.pathname}</div>;
}

function renderAuthRoute(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <QueryClientProvider client={makeQueryClient()}>
        <Routes>
          <Route path="/" element={<LandingScreen />} />
          <Route path="/auth/login" element={<LoginScreen />} />
          <Route path="/auth/register" element={<RegisterScreen />} />
          <Route path="/game" element={<div>Game</div>} />
          <Route path="/worlds" element={<div>Worlds</div>} />
        </Routes>
        <LocationProbe />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
  useAuthStore.getState().clearSession();
  localStorage.clear();
});

describe('auth design-system runtime screens', () => {
  it('routes landing actions according to authentication state', async () => {
    const user = userEvent.setup();
    const { unmount } = renderAuthRoute('/');

    await user.click(screen.getByRole('button', { name: 'Connexion' }));
    expect(screen.getByTestId('location-path')).toHaveTextContent('/auth/login');
    unmount();

    useAuthStore.getState().setSession({
      accessToken: 'access',
      refreshToken: 'refresh',
      user: { displayName: 'Player', email: 'player@example.test', id: 'user-1' },
    });

    renderAuthRoute('/');

    await user.click(screen.getByRole('button', { name: "Reprendre l'aventure" }));
    expect(screen.getByTestId('location-path')).toHaveTextContent('/game');
  });

  it('submits login with email and password only, then navigates to the game', async () => {
    const user = userEvent.setup();
    const post = vi
      .spyOn(apiClient, 'post')
      .mockResolvedValue(authResponse('player@example.test'));

    renderAuthRoute('/auth/login');

    await user.type(screen.getByLabelText('Email'), 'player@example.test');
    await user.type(screen.getByLabelText('Mot de passe'), 'secret-pass');
    await user.click(screen.getByRole('button', { name: 'Se connecter' }));

    await waitFor(() => {
      expect(post).toHaveBeenCalledWith(
        '/auth/login',
        { email: 'player@example.test', password: 'secret-pass' },
        { skipAuth: true },
      );
    });
    await waitFor(() => {
      expect(screen.getByTestId('location-path')).toHaveTextContent('/game');
    });
    expect(useAuthStore.getState().user?.email).toBe('player@example.test');
  });

  it('shows the server login error without navigating', async () => {
    const user = userEvent.setup();
    vi.spyOn(apiClient, 'post').mockRejectedValue(new ApiError('Identifiants invalides', 401));

    renderAuthRoute('/auth/login');

    await user.type(screen.getByLabelText('Email'), 'player@example.test');
    await user.type(screen.getByLabelText('Mot de passe'), 'bad-pass');
    await user.click(screen.getByRole('button', { name: 'Se connecter' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Identifiants invalides');
    expect(screen.getByTestId('location-path')).toHaveTextContent('/auth/login');
  });

  it('submits register with display name, email and password after local confirmation', async () => {
    const user = userEvent.setup();
    const post = vi
      .spyOn(apiClient, 'post')
      .mockResolvedValue(authResponse('new-player@example.test', 'New Player'));

    renderAuthRoute('/auth/register');

    await user.type(screen.getByLabelText('Nom de joueur'), 'New Player');
    await user.type(screen.getByLabelText('Email'), 'new-player@example.test');
    await user.type(screen.getByLabelText('Mot de passe'), 'Strongpass1');
    await user.type(screen.getByLabelText('Confirmation'), 'Strongpass1');
    await user.click(screen.getByRole('button', { name: 'Créer le compte' }));

    await waitFor(() => {
      expect(post).toHaveBeenCalledWith(
        '/auth/register',
        {
          displayName: 'New Player',
          email: 'new-player@example.test',
          password: 'Strongpass1',
        },
        { skipAuth: true },
      );
    });
    expect(post.mock.calls[0][1]).not.toHaveProperty('confirmPassword');
    expect(post.mock.calls[0][1]).not.toHaveProperty('lord');
    await waitFor(() => {
      expect(screen.getByTestId('location-path')).toHaveTextContent('/worlds');
    });
  });

  it('removes useless placeholders and keeps unsupported visual controls inert', () => {
    const { unmount } = renderAuthRoute('/');

    expect(screen.queryByRole('button', { name: 'Visiteur indisponible' })).not.toBeInTheDocument();
    unmount();

    const loginRender = renderAuthRoute('/auth/login');

    expect(screen.queryByText('Entrée')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mot de passe oublié' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Google' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Apple' })).toBeDisabled();

    loginRender.unmount();

    renderAuthRoute('/auth/register');

    expect(screen.queryByText('Serment')).not.toBeInTheDocument();
  });

  it('blocks register when the local confirmation does not match', async () => {
    const user = userEvent.setup();
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue(authResponse('new-player@example.test'));

    renderAuthRoute('/auth/register');

    await user.type(screen.getByLabelText('Email'), 'new-player@example.test');
    await user.type(screen.getByLabelText('Mot de passe'), 'Strongpass1');
    await user.type(screen.getByLabelText('Confirmation'), 'different-pass');
    fireEvent.click(screen.getByRole('button', { name: 'Créer le compte' }));

    expect(await screen.findByText('Les mots de passe ne correspondent pas')).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });
});
