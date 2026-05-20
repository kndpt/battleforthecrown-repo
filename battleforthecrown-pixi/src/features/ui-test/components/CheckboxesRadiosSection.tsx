import { Checkbox, Radio, InputLabel, InputHelperText } from '@/ui';

interface CheckboxesRadiosSectionProps {
  acceptTerms: boolean;
  setAcceptTerms: (value: boolean) => void;
  difficulty: string;
  setDifficulty: (value: string) => void;
}

export function CheckboxesRadiosSection({ acceptTerms, setAcceptTerms, difficulty, setDifficulty }: CheckboxesRadiosSectionProps) {
  return (
    <section className="w-full max-w-4xl mt-12">
      <h2 className="font-cinzel text-2xl font-bold text-gray-700 mb-6 text-center">Checkboxes & Radios</h2>
      
      <div className="space-y-8">
        {/* Checkboxes */}
        <div className="space-y-4">
          <h3 className="font-game text-lg font-semibold text-gray-700">Checkboxes</h3>
          
          {/* Variants */}
          <div className="space-y-3">
            <p className="text-sm text-gray-600 font-semibold">Variants</p>
            <div className="flex flex-wrap gap-4">
              <Checkbox label="Default" variant="default" />
              <Checkbox label="Parchment" variant="parchment" />
              <Checkbox label="Success" variant="success" />
              <Checkbox label="Error" variant="error" />
              <Checkbox label="Disabled" variant="default" disabled />
            </div>
          </div>

          {/* Sizes */}
          <div className="space-y-3">
            <p className="text-sm text-gray-600 font-semibold">Tailles</p>
            <div className="flex flex-wrap gap-4 items-center">
              <Checkbox label="Small" variant="parchment" size="sm" />
              <Checkbox label="Medium" variant="parchment" size="md" />
              <Checkbox label="Large" variant="parchment" size="lg" />
            </div>
          </div>

          {/* Exemple contextuel */}
          <div className="bg-white/50 rounded-lg p-4 border-2 border-[#d4c094]">
            <div className="space-y-2">
              <InputLabel>Ressources à collecter automatiquement</InputLabel>
              <div className="space-y-2">
                <Checkbox label="🪵 Bois" name="resources" value="wood" variant="parchment" defaultChecked />
                <Checkbox label="🪨 Pierre" name="resources" value="stone" variant="parchment" defaultChecked />
                <Checkbox label="💰 Or" name="resources" value="gold" variant="parchment" />
                <Checkbox label="🍖 Nourriture" name="resources" value="food" variant="parchment" />
              </div>
              <InputHelperText variant="default">
                Les ressources sélectionnées seront collectées toutes les heures
              </InputHelperText>
            </div>
          </div>

          {/* Checkbox avec état contrôlé */}
          <div className="bg-white/50 rounded-lg p-4 border-2 border-[#d4c094]">
            <div className="space-y-2">
              <Checkbox 
                label="J'accepte les conditions d'utilisation"
                variant="success"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
              />
              <InputHelperText variant={acceptTerms ? "success" : "default"}>
                {acceptTerms ? "✓ Conditions acceptées" : "Veuillez accepter les conditions pour continuer"}
              </InputHelperText>
            </div>
          </div>
        </div>

        {/* Radios */}
        <div className="space-y-4">
          <h3 className="font-game text-lg font-semibold text-gray-700">Radios</h3>
          
          {/* Variants */}
          <div className="space-y-3">
            <p className="text-sm text-gray-600 font-semibold">Variants</p>
            <div className="flex flex-wrap gap-4">
              <Radio label="Default" name="variant-demo" value="default" variant="default" />
              <Radio label="Parchment" name="variant-demo" value="parchment" variant="parchment" />
              <Radio label="Success" name="variant-demo" value="success" variant="success" />
              <Radio label="Error" name="variant-demo" value="error" variant="error" />
              <Radio label="Disabled" name="variant-demo" value="disabled" variant="default" disabled />
            </div>
          </div>

          {/* Sizes */}
          <div className="space-y-3">
            <p className="text-sm text-gray-600 font-semibold">Tailles</p>
            <div className="flex flex-wrap gap-4 items-center">
              <Radio label="Small" name="size-demo" value="sm" variant="parchment" size="sm" />
              <Radio label="Medium" name="size-demo" value="md" variant="parchment" size="md" />
              <Radio label="Large" name="size-demo" value="lg" variant="parchment" size="lg" />
            </div>
          </div>

          {/* Exemple contextuel 1 */}
          <div className="bg-white/50 rounded-lg p-4 border-2 border-[#d4c094]">
            <div className="space-y-2">
              <InputLabel>Type de bâtiment à construire</InputLabel>
              <div className="space-y-2">
                <Radio label="🏰 Château" name="building-type" value="castle" variant="parchment" />
                <Radio label="⚔️ Caserne" name="building-type" value="barracks" variant="parchment" defaultChecked />
                <Radio label="🏘️ Quartier" name="building-type" value="quarter" variant="parchment" />
                <Radio label="📦 Entrepôt" name="building-type" value="warehouse" variant="parchment" />
              </div>
              <InputHelperText variant="default">
                Sélectionnez un bâtiment pour voir les coûts de construction
              </InputHelperText>
            </div>
          </div>

          {/* Exemple contextuel 2 avec état contrôlé */}
          <div className="bg-white/50 rounded-lg p-4 border-2 border-[#d4c094]">
            <div className="space-y-2">
              <InputLabel required>Difficulté de la partie</InputLabel>
              <div className="space-y-2">
                <Radio 
                  label="⭐ Facile - Ressources doublées"
                  name="difficulty" 
                  value="easy"
                  variant="success"
                  checked={difficulty === 'easy'}
                  onChange={(e) => setDifficulty(e.target.value)}
                />
                <Radio 
                  label="⭐⭐ Normal - Équilibré"
                  name="difficulty" 
                  value="normal"
                  variant="default"
                  checked={difficulty === 'normal'}
                  onChange={(e) => setDifficulty(e.target.value)}
                />
                <Radio 
                  label="⭐⭐⭐ Difficile - Ennemis renforcés"
                  name="difficulty" 
                  value="hard"
                  variant="error"
                  checked={difficulty === 'hard'}
                  onChange={(e) => setDifficulty(e.target.value)}
                />
              </div>
              <InputHelperText 
                variant={difficulty === 'hard' ? 'error' : difficulty === 'easy' ? 'success' : 'default'}
              >
                Difficulté sélectionnée : <strong className="uppercase">{difficulty}</strong>
              </InputHelperText>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
