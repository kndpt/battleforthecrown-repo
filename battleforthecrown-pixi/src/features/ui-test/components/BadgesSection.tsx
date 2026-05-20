import { Badge, IconButton } from '@/ui';
import { Bell, Mail, Shield } from 'lucide-react';

export function BadgesSection() {
  return (
    <section className="w-full max-w-4xl mt-12">
      <h2 className="font-cinzel text-2xl font-bold text-gray-700 mb-6 text-center">Badges</h2>
      
      <div className="space-y-6">
        {/* Variants */}
        <div className="space-y-4">
          <h3 className="font-game text-lg font-semibold text-gray-700">Variants</h3>
          
          <div className="flex flex-wrap gap-4 items-center">
            <Badge variant="default">5</Badge>
            <Badge variant="success">MAX</Badge>
            <Badge variant="error">!</Badge>
            <Badge variant="warning">Niv.3</Badge>
            <Badge variant="info">NEW</Badge>
            <Badge variant="neutral">--</Badge>
          </div>
        </div>

        {/* Tailles */}
        <div className="space-y-4">
          <h3 className="font-game text-lg font-semibold text-gray-700">Tailles</h3>
          
          <div className="flex flex-wrap gap-4 items-center">
            <Badge variant="error" size="sm">3</Badge>
            <Badge variant="warning" size="md">12</Badge>
            <Badge variant="success" size="lg">99+</Badge>
          </div>
        </div>

        {/* Badges de notifications */}
        <div className="space-y-4">
          <h3 className="font-game text-lg font-semibold text-gray-700">Badges de notifications</h3>
          
          <div className="bg-white/50 rounded-lg p-4 border-2 border-[#d4c094]">
            <div className="flex gap-4">
              <div className="relative inline-block">
                <IconButton icon={Bell} variant="info" label="Notifications" />
                <Badge 
                  variant="error" 
                  size="sm"
                  className="absolute -top-1 -right-1"
                >
                  5
                </Badge>
              </div>

              <div className="relative inline-block">
                <IconButton icon={Mail} variant="info" label="Messages" />
                <Badge 
                  variant="warning" 
                  size="sm"
                  className="absolute -top-1 -right-1"
                >
                  12
                </Badge>
              </div>

              <div className="relative inline-block">
                <IconButton icon={Shield} variant="success" label="Défenses" />
                <Badge 
                  variant="success" 
                  size="sm"
                  className="absolute -top-1 -right-1"
                >
                  OK
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Badges de ressources */}
        <div className="space-y-4">
          <h3 className="font-game text-lg font-semibold text-gray-700">Badges de ressources</h3>
          
          <div className="bg-white/50 rounded-lg p-4 border-2 border-[#d4c094]">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🪵</span>
                  <span className="font-game">Bois</span>
                  <span className="text-gray-600">8.500 / 10.000</span>
                </div>
                <Badge variant="success" size="md">85%</Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🪨</span>
                  <span className="font-game">Pierre</span>
                  <span className="text-gray-600">3.200 / 5.000</span>
                </div>
                <Badge variant="info" size="md">64%</Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">💰</span>
                  <span className="font-game">Or</span>
                  <span className="text-gray-600">1.200 / 8.000</span>
                </div>
                <Badge variant="error" size="md">15%</Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🍖</span>
                  <span className="font-game">Nourriture</span>
                  <span className="text-gray-600">Production</span>
                </div>
                <Badge variant="info" size="sm">+120/h</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Badges de niveaux */}
        <div className="space-y-4">
          <h3 className="font-game text-lg font-semibold text-gray-700">Badges de niveaux</h3>
          
          <div className="bg-white/50 rounded-lg p-4 border-2 border-[#d4c094]">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🏰</span>
                  <span className="font-game">Château</span>
                </div>
                <Badge variant="info" size="lg">Niv. 3</Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">⚔️</span>
                  <span className="font-game">Caserne</span>
                </div>
                <Badge variant="warning" size="lg">Niv. 5</Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🏘️</span>
                  <span className="font-game">Quartier</span>
                </div>
                <Badge variant="success" size="lg">MAX</Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📦</span>
                  <span className="font-game">Entrepôt</span>
                </div>
                <Badge variant="neutral" size="lg">Niv. 0</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Badges de compteurs d'unités */}
        <div className="space-y-4">
          <h3 className="font-game text-lg font-semibold text-gray-700">Compteurs d&apos;unités</h3>
          
          <div className="bg-white/50 rounded-lg p-4 border-2 border-[#d4c094]">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl mb-2">🗡️</div>
                <div className="font-game text-sm mb-1">Guerrier</div>
                <Badge variant="success" size="lg">42</Badge>
              </div>

              <div className="text-center">
                <div className="text-3xl mb-2">🏹</div>
                <div className="font-game text-sm mb-1">Archer</div>
                <Badge variant="info" size="lg">28</Badge>
              </div>

              <div className="text-center">
                <div className="text-3xl mb-2">🛡️</div>
                <div className="font-game text-sm mb-1">Chevalier</div>
                <Badge variant="error" size="lg">3</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
