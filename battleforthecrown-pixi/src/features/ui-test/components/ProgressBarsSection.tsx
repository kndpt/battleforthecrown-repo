import { ProgressBar } from '@/ui';

export function ProgressBarsSection() {
  return (
    <section className="w-full max-w-4xl mt-12">
      <h2 className="font-cinzel text-2xl font-bold text-gray-700 mb-6 text-center">Barres de progression</h2>
      
      <div className="space-y-6">
        {/* Barres par variant */}
        <div className="space-y-4">
          <h3 className="font-game text-lg font-semibold text-gray-700">Variants</h3>
          
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Success - Construction en cours</p>
            <ProgressBar value={75} showPercentage variant="success" animated />
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-600">Info - Recherche en cours</p>
            <ProgressBar value={45} label="5:30 restantes" variant="info" animated />
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-600">Warning - Ressources faibles</p>
            <ProgressBar value={25} showPercentage variant="warning" />
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-600">Danger - Santé critique</p>
            <ProgressBar value={15} showPercentage variant="danger" />
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-600">Default - Barre générique</p>
            <ProgressBar value={60} showPercentage variant="default" />
          </div>
        </div>

        {/* Barres par taille */}
        <div className="space-y-4">
          <h3 className="font-game text-lg font-semibold text-gray-700">Tailles</h3>
          
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Small</p>
            <ProgressBar value={50} showPercentage variant="success" size="sm" />
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-600">Medium (défaut)</p>
            <ProgressBar value={50} showPercentage variant="info" size="md" />
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-600">Large</p>
            <ProgressBar value={50} showPercentage variant="warning" size="lg" />
          </div>
        </div>

        {/* Exemples contextuels */}
        <div className="space-y-4">
          <h3 className="font-game text-lg font-semibold text-gray-700">Exemples contextuels</h3>
          
          {/* Construction de bâtiment */}
          <div className="bg-white/50 rounded-lg p-4 border-2 border-[#d4c094]">
            <div className="flex justify-between items-center mb-2">
              <span className="font-game font-semibold text-gray-800">Amélioration du Château</span>
              <span className="text-sm text-gray-600">Niveau 2 → 3</span>
            </div>
            <ProgressBar value={82} label="2:15 restantes" variant="success" animated size="lg" />
          </div>

          {/* Recherche d&apos;unité */}
          <div className="bg-white/50 rounded-lg p-4 border-2 border-[#d4c094]">
            <div className="flex justify-between items-center mb-2">
              <span className="font-game font-semibold text-gray-800">Recherche : Templier</span>
              <span className="text-sm text-gray-600">En cours...</span>
            </div>
            <ProgressBar value={38} showPercentage variant="info" animated size="md" />
          </div>

          {/* Stockage de ressources */}
          <div className="bg-white/50 rounded-lg p-4 border-2 border-[#d4c094]">
            <div className="flex justify-between items-center mb-2">
              <span className="font-game font-semibold text-gray-800">Bois stocké</span>
              <span className="text-sm text-gray-600">8.500 / 10.000</span>
            </div>
            <ProgressBar value={85} showPercentage variant="success" size="sm" />
          </div>
        </div>
      </div>
    </section>
  );
}
