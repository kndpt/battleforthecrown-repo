import { Panel, PanelHeader, PanelBody, PanelFooter, Button, ProgressBar } from '@/ui';
import { Settings, X } from 'lucide-react';
import { useState } from 'react';

export function PanelsSection() {
  const [isUpgrading, setIsUpgrading] = useState(false);

  return (
    <section className="w-full max-w-6xl mt-12">
      <h2 className="font-cinzel text-2xl font-bold text-gray-700 mb-6 text-center">Panneaux (Panels)</h2>

      <div className="space-y-6">
        {/* Variants */}
        <div className="space-y-4">
          <h3 className="font-game text-lg font-semibold text-gray-700">Variants</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Panel variant="default">
              <p className="text-sm">Panel Default</p>
            </Panel>

            <Panel variant="parchment">
              <p className="text-sm">Panel Parchment (recommandé)</p>
            </Panel>

            <Panel variant="wood">
              <p className="text-sm text-[#f5e6d3]">Panel Wood</p>
            </Panel>

            <Panel variant="stone">
              <p className="text-sm text-white">Panel Stone</p>
            </Panel>

            <Panel variant="success">
              <p className="text-sm text-white">Panel Success</p>
            </Panel>

            <Panel variant="info">
              <p className="text-sm text-white">Panel Info</p>
            </Panel>

            <Panel variant="warning">
              <p className="text-sm">Panel Warning</p>
            </Panel>

            <Panel variant="danger">
              <p className="text-sm text-white">Panel Danger</p>
            </Panel>
          </div>
        </div>

        {/* Avec Header */}
        <div className="space-y-4">
          <h3 className="font-game text-lg font-semibold text-gray-700">Avec Header et Body</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Panel variant="parchment" padding="none">
              <PanelHeader variant="parchment">
                <span>Panel Parchment</span>
              </PanelHeader>
              <PanelBody>
                <p className="text-sm">Contenu du panel avec style médiéval.</p>
              </PanelBody>
            </Panel>

            <Panel variant="wood" padding="none">
              <PanelHeader variant="wood">
                <span>Panel Wood</span>
              </PanelHeader>
              <PanelBody>
                <p className="text-sm">Parfait pour les bâtiments en bois.</p>
              </PanelBody>
            </Panel>
          </div>
        </div>

        {/* Header avec actions */}
        <div className="space-y-4">
          <h3 className="font-game text-lg font-semibold text-gray-700">Header avec actions</h3>

          <Panel variant="info" padding="none">
            <PanelHeader variant="info">
              <span>Paramètres</span>
              <div className="flex gap-2">
                <button className="text-white hover:opacity-80">
                  <Settings size={18} />
                </button>
                <button className="text-white hover:opacity-80">
                  <X size={18} />
                </button>
              </div>
            </PanelHeader>
            <PanelBody>
              <p className="text-sm">Configuration du jeu et des préférences utilisateur.</p>
            </PanelBody>
          </Panel>
        </div>

        {/* Panel complet avec Footer */}
        <div className="space-y-4">
          <h3 className="font-game text-lg font-semibold text-gray-700">Panel complet (Header + Body + Footer)</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Panel variant="warning" padding="none">
              <PanelHeader variant="warning">
                <span>⚠️ Confirmation</span>
              </PanelHeader>
              <PanelBody>
                <p className="text-sm">Êtes-vous sûr de vouloir supprimer ce bâtiment ?</p>
              </PanelBody>
              <PanelFooter variant="warning">
                <Button variant="neutral" size="sm">Annuler</Button>
                <Button variant="danger" size="sm">Supprimer</Button>
              </PanelFooter>
            </Panel>

            <Panel variant="success" padding="none">
              <PanelHeader variant="success">
                <span>✓ Succès</span>
              </PanelHeader>
              <PanelBody>
                <p className="text-sm">Le bâtiment a été amélioré avec succès !</p>
              </PanelBody>
              <PanelFooter variant="success">
                <Button variant="success" size="sm">Continuer</Button>
              </PanelFooter>
            </Panel>
          </div>
        </div>

        {/* Exemples contextuels */}
        <div className="space-y-4">
          <h3 className="font-game text-lg font-semibold text-gray-700">Exemples contextuels</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Panel de ressources */}
            <Panel variant="parchment" padding="none">
              <PanelHeader variant="parchment">
                <span>Ressources</span>
                <span className="text-sm font-normal">+120/h</span>
              </PanelHeader>
              <PanelBody>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm">🪵 Bois</span>
                      <span className="text-sm font-bold">8.500 / 10.000</span>
                    </div>
                    <ProgressBar value={85} variant="success" size="sm" />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm">💰 Or</span>
                      <span className="text-sm font-bold">1.500 / 8.000</span>
                    </div>
                    <ProgressBar value={19} variant="danger" size="sm" />
                  </div>
                </div>
              </PanelBody>
            </Panel>

            {/* Panel d'amélioration */}
            <Panel variant="wood" padding="none">
              <PanelHeader variant="wood">
                <span>Château - Niveau 3</span>
                {isUpgrading && <span className="text-sm font-normal">⏱️ 2:30</span>}
              </PanelHeader>
              <PanelBody>
                {isUpgrading ? (
                  <div className="space-y-2">
                    <p className="text-sm">Amélioration en cours...</p>
                    <ProgressBar value={45} animated variant="warning" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Améliorer au niveau 4</p>
                    <ul className="text-xs space-y-1">
                      <li>Coût : 5.000 or</li>
                      <li>Temps : 10 minutes</li>
                    </ul>
                  </div>
                )}
              </PanelBody>
              <PanelFooter variant="wood">
                {isUpgrading ? (
                  <Button variant="danger" size="sm" onClick={() => setIsUpgrading(false)}>
                    Annuler
                  </Button>
                ) : (
                  <>
                    <Button variant="neutral" size="sm">Détails</Button>
                    <Button variant="warning" size="sm" onClick={() => setIsUpgrading(true)}>
                      Améliorer
                    </Button>
                  </>
                )}
              </PanelFooter>
            </Panel>

            Panel de statistiques
            <Panel variant="stone" padding="none">
              <PanelHeader variant="stone">
                <span>Statistiques</span>
              </PanelHeader>
              <PanelBody>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold">42</div>
                    <div className="text-xs">Guerriers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">28</div>
                    <div className="text-xs">Archers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">15</div>
                    <div className="text-xs">Chevaliers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">85</div>
                    <div className="text-xs">Total</div>
                  </div>
                </div>
              </PanelBody>
            </Panel>

            {/* Panel de liste */}
            <Panel variant="parchment" padding="none">
              <PanelHeader variant="parchment">
                <span>Bâtiments</span>
                <span className="text-sm font-normal">5 / 10</span>
              </PanelHeader>
              <PanelBody>
                <ul className="space-y-2">
                  <li className="flex justify-between items-center p-2 bg-white/20 rounded">
                    <span className="text-sm">🏰 Château</span>
                    <span className="text-xs font-bold">Niv. 3</span>
                  </li>
                  <li className="flex justify-between items-center p-2 bg-white/20 rounded">
                    <span className="text-sm">⚔️ Caserne</span>
                    <span className="text-xs font-bold">Niv. 5</span>
                  </li>
                  <li className="flex justify-between items-center p-2 bg-white/20 rounded">
                    <span className="text-sm">🌾 Ferme</span>
                    <span className="text-xs font-bold">Niv. 8</span>
                  </li>
                </ul>
              </PanelBody>
              <PanelFooter variant="parchment">
                <Button variant="success" size="sm">Construire</Button>
              </PanelFooter>
            </Panel>
          </div>
        </div>
      </div>
    </section>
  );
}
