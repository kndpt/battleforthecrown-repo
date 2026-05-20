import { Select, InputLabel, InputHelperText } from '@/ui';

interface SelectsSectionProps {
  selectedBuilding: string;
  setSelectedBuilding: (value: string) => void;
  selectedTroop: string;
  setSelectedTroop: (value: string) => void;
}

export function SelectsSection({ selectedBuilding, setSelectedBuilding, selectedTroop, setSelectedTroop }: SelectsSectionProps) {
  return (
    <section className="w-full max-w-4xl mt-12">
      <h2 className="font-cinzel text-2xl font-bold text-gray-700 mb-6 text-center">Menus déroulants</h2>
      
      <div className="space-y-6">
        {/* Selects par variant */}
        <div className="space-y-4">
          <h3 className="font-game text-lg font-semibold text-gray-700">Variants</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Default</p>
              <Select
                variant="default"
                options={[
                  { value: 'castle', label: 'Château' },
                  { value: 'barracks', label: 'Caserne' },
                  { value: 'quarter', label: 'Quartier' },
                  { value: 'warehouse', label: 'Entrepôt' },
                ]}
                placeholder="Sélectionner un bâtiment"
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">Parchment (médiéval)</p>
              <Select
                variant="parchment"
                options={[
                  { value: 'warrior', label: 'Guerrier' },
                  { value: 'archer', label: 'Archer' },
                  { value: 'knight', label: 'Chevalier' },
                  { value: 'mage', label: 'Mage' },
                ]}
                placeholder="Choisir une troupe"
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">Success (validé)</p>
              <Select
                variant="success"
                options={[
                  { value: 'wood', label: 'Bois' },
                  { value: 'stone', label: 'Pierre' },
                  { value: 'gold', label: 'Or' },
                ]}
                defaultValue="gold"
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">Info</p>
              <Select
                variant="info"
                options={[
                  { value: 'attack', label: 'Attaque' },
                  { value: 'defense', label: 'Défense' },
                  { value: 'raid', label: 'Raid' },
                ]}
                placeholder="Type de bataille"
              />
            </div>
          </div>
        </div>

        {/* Selects par taille */}
        <div className="space-y-4">
          <h3 className="font-game text-lg font-semibold text-gray-700">Tailles</h3>
          
          <div className="space-y-3">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Small</p>
              <Select
                variant="parchment"
                size="sm"
                options={[
                  { value: '1', label: 'Niveau 1' },
                  { value: '2', label: 'Niveau 2' },
                  { value: '3', label: 'Niveau 3' },
                ]}
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">Medium (défaut)</p>
              <Select
                variant="parchment"
                size="md"
                options={[
                  { value: '1', label: 'Niveau 1' },
                  { value: '2', label: 'Niveau 2' },
                  { value: '3', label: 'Niveau 3' },
                ]}
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">Large</p>
              <Select
                variant="parchment"
                size="lg"
                options={[
                  { value: '1', label: 'Niveau 1' },
                  { value: '2', label: 'Niveau 2' },
                  { value: '3', label: 'Niveau 3' },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Exemples contextuels */}
        <div className="space-y-4">
          <h3 className="font-game text-lg font-semibold text-gray-700">Exemples contextuels</h3>
          
          {/* Sélecteur de bâtiment avec state */}
          <div className="bg-white/50 rounded-lg p-4 border-2 border-[#d4c094]">
            <div className="space-y-2">
              <InputLabel htmlFor="building-select">
                Bâtiment à améliorer
              </InputLabel>
              <Select
                id="building-select"
                variant="parchment"
                size="md"
                options={[
                  { value: 'castle', label: '🏰 Château' },
                  { value: 'barracks', label: '⚔️ Caserne' },
                  { value: 'quarter', label: '🏘️ Quartier' },
                  { value: 'warehouse', label: '📦 Entrepôt' },
                  { value: 'mine', label: '⛏️ Mine' },
                ]}
                placeholder="Choisir un bâtiment"
                value={selectedBuilding}
                onChange={(e) => setSelectedBuilding(e.target.value)}
              />
              <InputHelperText variant="default">
                {selectedBuilding 
                  ? `Vous avez sélectionné : ${selectedBuilding}`
                  : 'Sélectionnez le bâtiment que vous souhaitez améliorer'}
              </InputHelperText>
            </div>
          </div>

          {/* Sélecteur de troupe */}
          <div className="bg-white/50 rounded-lg p-4 border-2 border-[#d4c094]">
            <div className="space-y-2">
              <InputLabel htmlFor="troop-select" required>
                Type de troupe à entraîner
              </InputLabel>
              <Select
                id="troop-select"
                variant="success"
                size="md"
                options={[
                  { value: 'warrior', label: 'Guerrier (50 or)' },
                  { value: 'archer', label: 'Archer (75 or)' },
                  { value: 'knight', label: 'Chevalier (150 or)' },
                  { value: 'mage', label: 'Mage (200 or)' },
                ]}
                value={selectedTroop}
                onChange={(e) => setSelectedTroop(e.target.value)}
                required
              />
              <InputHelperText variant="success">
                Formation rapide : 5 minutes par unité
              </InputHelperText>
            </div>
          </div>

          {/* Sélecteur désactivé */}
          <div className="bg-white/50 rounded-lg p-4 border-2 border-[#d4c094]">
            <div className="space-y-2">
              <InputLabel htmlFor="disabled-select">
                Sélection indisponible
              </InputLabel>
              <Select
                id="disabled-select"
                variant="default"
                options={[
                  { value: '1', label: 'Option 1' },
                  { value: '2', label: 'Option 2' },
                ]}
                placeholder="Débloquer le niveau 5"
                disabled
              />
              <InputHelperText variant="error">
                Nécessite le niveau 5 du Château
              </InputHelperText>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
