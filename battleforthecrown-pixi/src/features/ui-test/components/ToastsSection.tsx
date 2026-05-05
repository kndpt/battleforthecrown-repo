import { Button } from '@/ui';

interface ToastsSectionProps {
  addToast: (options: {
    variant?: 'success' | 'error' | 'warning' | 'info' | 'default';
    title?: string;
    message: string;
    duration?: number;
  }) => void;
}

export function ToastsSection({ addToast }: ToastsSectionProps) {
  return (
    <section className="w-full max-w-4xl mt-12">
      <h2 className="font-cinzel text-2xl font-bold text-gray-700 mb-6 text-center">Notifications (Toasts)</h2>
      
      <div className="space-y-6">
        {/* Variants */}
        <div className="space-y-4">
          <h3 className="font-game text-lg font-semibold text-gray-700">Variants</h3>
          
          <div className="bg-white/50 rounded-lg p-4 border-2 border-[#d4c094]">
            <p className="text-sm text-gray-600 mb-3">Cliquez sur les boutons pour afficher les toasts</p>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="success" 
                size="sm"
                onClick={() => addToast({
                  variant: 'success',
                  title: 'Succès !',
                  message: 'Bâtiment amélioré avec succès',
                  duration: 3000,
                })}
              >
                Toast Success
              </Button>

              <Button 
                variant="danger" 
                size="sm"
                onClick={() => addToast({
                  variant: 'error',
                  title: 'Erreur',
                  message: 'Ressources insuffisantes',
                  duration: 4000,
                })}
              >
                Toast Error
              </Button>

              <Button 
                variant="warning" 
                size="sm"
                onClick={() => addToast({
                  variant: 'warning',
                  title: 'Attention',
                  message: 'Or faible : 15% restant',
                  duration: 5000,
                })}
              >
                Toast Warning
              </Button>

              <Button 
                variant="info" 
                size="sm"
                onClick={() => addToast({
                  variant: 'info',
                  title: 'Nouvelle recherche',
                  message: 'Templier niveau 2 disponible',
                  duration: 4000,
                })}
              >
                Toast Info
              </Button>

              <Button 
                variant="neutral" 
                size="sm"
                onClick={() => addToast({
                  variant: 'default',
                  message: 'Notification standard',
                  duration: 3000,
                })}
              >
                Toast Default
              </Button>
            </div>
          </div>
        </div>

        {/* Exemples contextuels */}
        <div className="space-y-4">
          <h3 className="font-game text-lg font-semibold text-gray-700">Exemples contextuels</h3>
          
          <div className="bg-white/50 rounded-lg p-4 border-2 border-[#d4c094]">
            <p className="text-sm text-gray-600 mb-3 font-semibold">Actions de jeu</p>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="warning" 
                size="md"
                onClick={() => {
                  addToast({
                    variant: 'info',
                    message: 'Amélioration en cours...',
                    duration: 2000,
                  });
                  setTimeout(() => {
                    addToast({
                      variant: 'success',
                      title: 'Amélioration terminée !',
                      message: 'Château niveau 3 → 4',
                      duration: 4000,
                    });
                  }, 2000);
                }}
              >
                Améliorer Château
              </Button>

              <Button 
                variant="success" 
                size="md"
                onClick={() => addToast({
                  variant: 'success',
                  title: 'Ressources collectées',
                  message: '+1.200 🪵  +800 🪨  +500 💰',
                  duration: 3000,
                })}
              >
                Collecter ressources
              </Button>

              <Button 
                variant="danger" 
                size="md"
                onClick={() => addToast({
                  variant: 'error',
                  title: 'Attaque échouée',
                  message: 'Vos troupes ont été vaincues',
                  duration: 5000,
                })}
              >
                Attaquer
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
