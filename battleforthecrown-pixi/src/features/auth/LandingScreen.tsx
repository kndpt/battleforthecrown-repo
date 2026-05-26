import { useNavigate } from 'react-router';
import { AuthLandingScreen } from '@/features/design-system/components';
import { useAuthStore } from '@/stores/auth';
import { AuthScreenViewport } from './AuthScreenViewport';

const status = {
  batteryLabel: '100%',
  networkLabel: 'LTE',
  timeLabel: '09:41',
};

export function LandingScreen() {
  const navigate = useNavigate();
  const accessToken = useAuthStore((state) => state.accessToken);

  return (
    <AuthScreenViewport>
      <AuthLandingScreen
        actions={
          accessToken
            ? [
                {
                  id: 'resume',
                  label: "Reprendre l'aventure",
                  onClick: () => navigate('/game'),
                  size: 'lg',
                  variant: 'success',
                },
              ]
            : [
                {
                  id: 'login',
                  label: 'Connexion',
                  onClick: () => navigate('/auth/login'),
                  size: 'lg',
                  variant: 'warning',
                },
                {
                  id: 'register',
                  label: 'Créer un compte',
                  onClick: () => navigate('/auth/register'),
                  size: 'lg',
                  variant: 'success',
                },
              ]
        }
        castleIcon="/assets/castle.png"
        crownIcon="/assets/crown.png"
        eyebrow="MMORTS médiéval"
        secondaryActions={
          accessToken
            ? undefined
            : [
                {
                  disabled: true,
                  id: 'guest',
                  label: 'Visiteur indisponible',
                },
              ]
        }
        status={status}
        tagline="Construis, rallie, conquiers."
        titleLines={['Battle for', 'the Crown']}
        variant="dawn"
      />
    </AuthScreenViewport>
  );
}

