import { Button, IconButton, Tooltip } from '@/ui';
import { Plus, Trash2, Settings, Info, HelpCircle } from 'lucide-react';

export function TooltipsSection() {
  return (
    <section className="w-full max-w-4xl mt-12">
      <h2 className="font-cinzel text-2xl font-bold text-gray-700 mb-6 text-center">Tooltips</h2>
      
      <div className="space-y-6">
        {/* Variants */}
        <div className="space-y-4">
          <h3 className="font-game text-lg font-semibold text-gray-700">Variants</h3>
          
          <div className="flex flex-wrap gap-4 items-center">
            <Tooltip content="Tooltip default" variant="default">
              <IconButton icon={Info} variant="neutral" label="Default" />
            </Tooltip>
            
            <Tooltip content="Tooltip dark" variant="dark">
              <IconButton icon={Info} variant="neutral" label="Dark" />
            </Tooltip>
            
            <Tooltip content="Tooltip success" variant="success">
              <IconButton icon={Info} variant="success" label="Success" />
            </Tooltip>
            
            <Tooltip content="Tooltip error" variant="error">
              <IconButton icon={Info} variant="danger" label="Error" />
            </Tooltip>
            
            <Tooltip content="Tooltip info" variant="info">
              <IconButton icon={Info} variant="info" label="Info" />
            </Tooltip>
          </div>
        </div>

        {/* Positions */}
        <div className="space-y-4">
          <h3 className="font-game text-lg font-semibold text-gray-700">Positions</h3>
          
          <div className="flex justify-center">
            <div className="grid grid-cols-3 gap-8 items-center">
              <div></div>
              <Tooltip content="Position: Top" position="top" variant="default">
                <Button variant="info" size="sm">Top</Button>
              </Tooltip>
              <div></div>
              
              <Tooltip content="Position: Left" position="left" variant="default">
                <Button variant="info" size="sm">Left</Button>
              </Tooltip>
              <div className="text-center text-gray-500 font-game">
                Survolez les boutons
              </div>
              <Tooltip content="Position: Right" position="right" variant="default">
                <Button variant="info" size="sm">Right</Button>
              </Tooltip>
              
              <div></div>
              <Tooltip content="Position: Bottom" position="bottom" variant="default">
                <Button variant="info" size="sm">Bottom</Button>
              </Tooltip>
              <div></div>
            </div>
          </div>
        </div>

        {/* Exemples contextuels */}
        <div className="space-y-4">
          <h3 className="font-game text-lg font-semibold text-gray-700">Exemples contextuels</h3>
          
          {/* Barre d'actions avec tooltips */}
          <div className="bg-white/50 rounded-lg p-4 border-2 border-[#d4c094]">
            <p className="text-sm text-gray-600 mb-3 font-semibold">Barre d&apos;actions</p>
            <div className="flex gap-2">
              <Tooltip content="Ajouter une unité" position="top" variant="success">
                <IconButton icon={Plus} variant="success" label="Ajouter" />
              </Tooltip>
              
              <Tooltip content="Paramètres avancés" position="top" variant="info">
                <IconButton icon={Settings} variant="info" label="Paramètres" />
              </Tooltip>
              
              <Tooltip content="Supprimer définitivement" position="top" variant="error">
                <IconButton icon={Trash2} variant="danger" label="Supprimer" />
              </Tooltip>
              
              <Tooltip content="Aide disponible" position="top" variant="dark">
                <IconButton icon={HelpCircle} variant="neutral" label="Aide" />
              </Tooltip>
            </div>
          </div>

          {/* Ressources avec tooltips */}
          <div className="bg-white/50 rounded-lg p-4 border-2 border-[#d4c094]">
            <p className="text-sm text-gray-600 mb-3 font-semibold">Ressources du joueur</p>
            <div className="flex gap-4">
              <Tooltip 
                content={
                  <div className="text-center">
                    <div className="font-bold">Bois</div>
                    <div>8.500 / 10.000</div>
                    <div className="text-xs">+120 / heure</div>
                  </div>
                }
                position="top"
                variant="success"
              >
                <div className="cursor-help bg-game-green-light/20 border-2 border-game-green-border rounded px-3 py-2">
                  <span className="text-2xl">🪵</span>
                  <span className="ml-2 font-game font-bold">8.500</span>
                </div>
              </Tooltip>

              <Tooltip 
                content={
                  <div className="text-center">
                    <div className="font-bold">Pierre</div>
                    <div>3.200 / 5.000</div>
                    <div className="text-xs">+80 / heure</div>
                  </div>
                }
                position="top"
                variant="default"
              >
                <div className="cursor-help bg-gray-200 border-2 border-gray-400 rounded px-3 py-2">
                  <span className="text-2xl">🪨</span>
                  <span className="ml-2 font-game font-bold">3.200</span>
                </div>
              </Tooltip>

              <Tooltip 
                content={
                  <div className="text-center">
                    <div className="font-bold">Or</div>
                    <div className="text-red-200">1.500 / 8.000</div>
                    <div className="text-xs">+50 / heure</div>
                  </div>
                }
                position="top"
                variant="error"
              >
                <div className="cursor-help bg-game-gold-light/20 border-2 border-game-gold-border rounded px-3 py-2">
                  <span className="text-2xl">💰</span>
                  <span className="ml-2 font-game font-bold">1.500</span>
                </div>
              </Tooltip>
            </div>
          </div>

          {/* Bâtiments avec tooltips */}
          <div className="bg-white/50 rounded-lg p-4 border-2 border-[#d4c094]">
            <p className="text-sm text-gray-600 mb-3 font-semibold">Bâtiments</p>
            <div className="flex gap-3">
              <Tooltip 
                content="Caserne Niv.5 - Production: 2 unités/h"
                position="top"
                variant="default"
              >
                <div className="cursor-help bg-white border-2 border-[#d4c094] rounded-lg p-3 text-center">
                  <div className="text-3xl mb-1">⚔️</div>
                  <div className="text-xs font-game">Caserne</div>
                </div>
              </Tooltip>

              <Tooltip 
                content={
                  <div>
                    <strong>Château</strong>
                    <div>Niveau 3</div>
                    <div className="text-xs mt-1">Amélioration: 5000 Or</div>
                  </div>
                }
                position="top"
                variant="info"
              >
                <div className="cursor-help bg-white border-2 border-game-blue-border rounded-lg p-3 text-center">
                  <div className="text-3xl mb-1">🏰</div>
                  <div className="text-xs font-game">Château</div>
                </div>
              </Tooltip>

              <Tooltip
                content="Quartier Niv.8 - Population max!"
                position="top"
                variant="success"
              >
                <div className="cursor-help bg-white border-2 border-game-green-border rounded-lg p-3 text-center">
                  <div className="text-3xl mb-1">🏘️</div>
                  <div className="text-xs font-game">Quartier</div>
                </div>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
