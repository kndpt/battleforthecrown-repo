import { Button, Spinner, Card, CardBody } from '@/ui';

interface SpinnersSectionProps {
  isLoading: boolean;
  setIsLoading: (value: boolean) => void;
}

export function SpinnersSection({ isLoading, setIsLoading }: SpinnersSectionProps) {
  return (
    <section className="w-full max-w-4xl mt-12">
      <h2 className="font-cinzel text-2xl font-bold text-gray-700 mb-6 text-center">Indicateurs de chargement (Spinners)</h2>
      
      <div className="space-y-6">
        {/* Variants */}
        <div className="space-y-4">
          <h3 className="font-game text-lg font-semibold text-gray-700">Variants</h3>
          
          <div className="flex flex-wrap gap-6 items-center justify-center bg-white/50 rounded-lg p-6 border-2 border-[#d4c094]">
            <Spinner variant="default" />
            <Spinner variant="success" />
            <Spinner variant="error" />
            <Spinner variant="warning" />
            <Spinner variant="info" />
            <Spinner variant="neutral" />
          </div>
        </div>

        {/* Tailles */}
        <div className="space-y-4">
          <h3 className="font-game text-lg font-semibold text-gray-700">Tailles</h3>
          
          <div className="flex flex-wrap gap-6 items-center justify-center bg-white/50 rounded-lg p-6 border-2 border-[#d4c094]">
            <Spinner variant="info" size="sm" />
            <Spinner variant="info" size="md" />
            <Spinner variant="info" size="lg" />
            <Spinner variant="info" size="xl" />
          </div>
        </div>

        {/* Avec labels */}
        <div className="space-y-4">
          <h3 className="font-game text-lg font-semibold text-gray-700">Avec labels</h3>
          
          <div className="flex flex-wrap gap-8 items-start justify-center bg-white/50 rounded-lg p-6 border-2 border-[#d4c094]">
            <Spinner variant="default" size="lg" label="Chargement..." />
            <Spinner variant="success" size="lg" label="Amélioration en cours" />
            <Spinner variant="warning" size="lg" label="Construction..." />
          </div>
        </div>

        {/* Exemples contextuels */}
        <div className="space-y-4">
          <h3 className="font-game text-lg font-semibold text-gray-700">Exemples contextuels</h3>
          
          {/* Dans un bouton */}
          <div className="bg-white/50 rounded-lg p-4 border-2 border-[#d4c094]">
            <p className="text-sm text-gray-600 mb-3 font-semibold">Bouton avec chargement</p>
            <Button 
              variant="warning"
              onClick={() => {
                setIsLoading(true);
                setTimeout(() => setIsLoading(false), 3000);
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Spinner size="sm" variant="default" />
                  Amélioration en cours...
                </span>
              ) : (
                'Améliorer le Château'
              )}
            </Button>
          </div>

          {/* Dans une card */}
          <div className="bg-white/50 rounded-lg p-4 border-2 border-[#d4c094]">
            <p className="text-sm text-gray-600 mb-3 font-semibold">Chargement de données</p>
            <Card>
              <CardBody>
                <div className="flex justify-center py-8">
                  <Spinner 
                    size="lg" 
                    variant="default" 
                    label="Chargement du village..."
                  />
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
