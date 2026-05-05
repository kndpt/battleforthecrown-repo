import { FloatingButton } from '@/ui';
import { Plus, Hammer, Bell, Swords, Menu, Clock, HelpCircle, Shield, Users, Settings } from 'lucide-react';
import { useState } from 'react';

export function FloatingButtonsSection() {
  const [showDemo, setShowDemo] = useState(false);

  return (
    <div className="w-full max-w-4xl bg-white rounded-lg shadow-md p-8">
      <h2 className="font-cinzel text-2xl font-bold text-gray-800 mb-6">
        FloatingButton
      </h2>

      {/* Variants ronds */}
      <div className="mb-8">
        <h3 className="font-game text-xl font-semibold text-gray-700 mb-4">
          Boutons ronds (shape=&quot;round&quot;)
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Idéal pour les actions principales avec icône. Position fixe sur l&apos;écran.
        </p>
        <div className="flex flex-wrap gap-4 items-center justify-center p-8 bg-gray-100 rounded-md relative min-h-[200px]">
          {/* Default */}
          <div className="flex flex-col items-center gap-2">
            <FloatingButton 
              variant="default" 
              shape="round"
              position="bottom-right"
              icon={<Plus size={24} />}
              style={{ position: 'relative', bottom: 'auto', right: 'auto' }}
            />
            <span className="text-xs text-gray-600">default</span>
          </div>

          {/* Success */}
          <div className="flex flex-col items-center gap-2">
            <FloatingButton 
              variant="success" 
              shape="round"
              icon={<Hammer size={24} />}
              style={{ position: 'relative', bottom: 'auto', right: 'auto' }}
            />
            <span className="text-xs text-gray-600">success</span>
          </div>

          {/* Info */}
          <div className="flex flex-col items-center gap-2">
            <FloatingButton 
              variant="info" 
              shape="round"
              icon={<Bell size={24} />}
              badge={5}
              style={{ position: 'relative', bottom: 'auto', right: 'auto' }}
            />
            <span className="text-xs text-gray-600">info + badge</span>
          </div>

          {/* Warning */}
          <div className="flex flex-col items-center gap-2">
            <FloatingButton 
              variant="warning" 
              shape="round"
              icon={<Clock size={24} />}
              badge={3}
              style={{ position: 'relative', bottom: 'auto', right: 'auto' }}
            />
            <span className="text-xs text-gray-600">warning + badge</span>
          </div>

          {/* Danger */}
          <div className="flex flex-col items-center gap-2">
            <FloatingButton 
              variant="danger" 
              shape="round"
              icon={<Swords size={24} />}
              badge="!"
              style={{ position: 'relative', bottom: 'auto', right: 'auto' }}
            />
            <span className="text-xs text-gray-600">danger + badge</span>
          </div>
        </div>
      </div>

      {/* Tailles ronds */}
      <div className="mb-8">
        <h3 className="font-game text-xl font-semibold text-gray-700 mb-4">
          Tailles (shape=&quot;round&quot;)
        </h3>
        <div className="flex flex-wrap gap-6 items-end justify-center p-8 bg-gray-100 rounded-md">
          <div className="flex flex-col items-center gap-2">
            <FloatingButton 
              variant="success" 
              shape="round"
              size="sm"
              icon={<Shield size={16} />}
              style={{ position: 'relative', bottom: 'auto', right: 'auto' }}
            />
            <span className="text-xs text-gray-600">sm (48px)</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <FloatingButton 
              variant="success" 
              shape="round"
              size="md"
              icon={<Shield size={20} />}
              style={{ position: 'relative', bottom: 'auto', right: 'auto' }}
            />
            <span className="text-xs text-gray-600">md (56px)</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <FloatingButton 
              variant="success" 
              shape="round"
              size="lg"
              icon={<Shield size={24} />}
              style={{ position: 'relative', bottom: 'auto', right: 'auto' }}
            />
            <span className="text-xs text-gray-600">lg (64px)</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <FloatingButton 
              variant="success" 
              shape="round"
              size="xl"
              icon={<Shield size={28} />}
              style={{ position: 'relative', bottom: 'auto', right: 'auto' }}
            />
            <span className="text-xs text-gray-600">xl (80px)</span>
          </div>
        </div>
      </div>

      {/* Boutons edge (rectangulaires) */}
      <div className="mb-8">
        <h3 className="font-game text-xl font-semibold text-gray-700 mb-4">
          Boutons rectangulaires (shape=&quot;edge&quot;)
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Parfait pour les bords de l&apos;écran : file d&apos;attente, menus latéraux, notifications groupées.
        </p>
        <div className="flex flex-col gap-4 p-8 bg-gray-100 rounded-md">
          {/* Success edge */}
          <FloatingButton 
            variant="success" 
            shape="edge"
            size="md"
            icon={<Hammer size={20} />}
            badge={3}
            style={{ position: 'relative', bottom: 'auto', right: 'auto' }}
          >
            Construction
          </FloatingButton>

          {/* Info edge */}
          <FloatingButton 
            variant="info" 
            shape="edge"
            size="md"
            icon={<Bell size={20} />}
            badge={12}
            style={{ position: 'relative', bottom: 'auto', right: 'auto' }}
          >
            Notifications
          </FloatingButton>

          {/* Warning edge */}
          <FloatingButton 
            variant="warning" 
            shape="edge"
            size="md"
            icon={<Clock size={20} />}
            badge={2}
            style={{ position: 'relative', bottom: 'auto', right: 'auto' }}
          >
            File d&apos;attente
          </FloatingButton>

          {/* Danger edge */}
          <FloatingButton 
            variant="danger" 
            shape="edge"
            size="md"
            icon={<Swords size={20} />}
            badge="!"
            style={{ position: 'relative', bottom: 'auto', right: 'auto' }}
          >
            Attaque en cours
          </FloatingButton>

          {/* Default edge */}
          <FloatingButton 
            variant="default" 
            shape="edge"
            size="md"
            icon={<Menu size={20} />}
            style={{ position: 'relative', bottom: 'auto', right: 'auto' }}
          >
            Menu principal
          </FloatingButton>
        </div>
      </div>

      {/* Tailles edge */}
      <div className="mb-8">
        <h3 className="font-game text-xl font-semibold text-gray-700 mb-4">
          Tailles (shape=&quot;edge&quot;)
        </h3>
        <div className="flex flex-col gap-4 p-8 bg-gray-100 rounded-md">
          <FloatingButton 
            variant="info" 
            shape="edge"
            size="sm"
            icon={<Users size={16} />}
            style={{ position: 'relative', bottom: 'auto', right: 'auto' }}
          >
            Alliances (sm)
          </FloatingButton>

          <FloatingButton 
            variant="info" 
            shape="edge"
            size="md"
            icon={<Users size={20} />}
            style={{ position: 'relative', bottom: 'auto', right: 'auto' }}
          >
            Alliances (md)
          </FloatingButton>

          <FloatingButton 
            variant="info" 
            shape="edge"
            size="lg"
            icon={<Users size={24} />}
            style={{ position: 'relative', bottom: 'auto', right: 'auto' }}
          >
            Alliances (lg)
          </FloatingButton>

          <FloatingButton 
            variant="info" 
            shape="edge"
            size="xl"
            icon={<Users size={28} />}
            style={{ position: 'relative', bottom: 'auto', right: 'auto' }}
          >
            Alliances (xl)
          </FloatingButton>
        </div>
      </div>

      {/* Démonstration avec position fixe */}
      <div className="mb-8">
        <h3 className="font-game text-xl font-semibold text-gray-700 mb-4">
          Démonstration en position fixe
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Cliquez pour voir les boutons flottants en action (position réelle sur l&apos;écran).
        </p>
        <button
          onClick={() => setShowDemo(!showDemo)}
          className="px-4 py-2 bg-game-blue-dark text-white font-game font-semibold rounded-md hover:brightness-110 transition-all"
        >
          {showDemo ? 'Masquer la démo' : 'Afficher la démo'}
        </button>

        {showDemo && (
          <>
            {/* Bottom-right round */}
            <FloatingButton 
              variant="success" 
              shape="round"
              position="bottom-right"
              size="lg"
              icon={<Plus size={28} />}
              onClick={() => alert('Nouvelle construction')}
            />

            {/* Right-center edge */}
            <FloatingButton 
              variant="warning" 
              shape="edge"
              position="right-center"
              icon={<Clock size={20} />}
              badge={3}
              onClick={() => alert('File d\'attente')}
            >
              File d&apos;attente
            </FloatingButton>

            {/* Top-right round */}
            <FloatingButton 
              variant="info" 
              shape="round"
              position="top-right"
              icon={<Bell size={24} />}
              badge={12}
              onClick={() => alert('Notifications')}
            />

            {/* Left-center edge */}
            <FloatingButton 
              variant="default" 
              shape="edge"
              position="left-center"
              icon={<Menu size={20} />}
              onClick={() => alert('Menu')}
            >
              Menu
            </FloatingButton>

            {/* Bottom-left round */}
            <FloatingButton 
              variant="info" 
              shape="round"
              position="bottom-left"
              icon={<HelpCircle size={24} />}
              onClick={() => alert('Aide')}
            />

            {/* Top-left round */}
            <FloatingButton 
              variant="danger" 
              shape="round"
              position="top-left"
              icon={<Swords size={24} />}
              badge="!"
              onClick={() => alert('Attaque !')}
            />

            {/* Bottom-center edge */}
            <FloatingButton 
              variant="success" 
              shape="edge"
              position="bottom-center"
              icon={<Settings size={20} />}
              onClick={() => alert('Paramètres')}
            >
              Paramètres
            </FloatingButton>
          </>
        )}
      </div>

      {/* Exemples contextuels (jeu) */}
      <div>
        <h3 className="font-game text-xl font-semibold text-gray-700 mb-4">
          Exemples contextuels (usage dans le jeu)
        </h3>
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-md border-l-4 border-game-green-dark">
            <h4 className="font-semibold text-sm mb-2">✅ Action principale : Nouvelle construction</h4>
            <div className="flex items-center gap-2">
              <FloatingButton 
                variant="success" 
                shape="round"
                icon={<Hammer size={24} />}
                style={{ position: 'relative', bottom: 'auto', right: 'auto' }}
              />
              <code className="text-xs bg-gray-200 px-2 py-1 rounded">
                position=&quot;bottom-right&quot; shape=&quot;round&quot; variant=&quot;success&quot;
              </code>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-md border-l-4 border-game-gold-dark">
            <h4 className="font-semibold text-sm mb-2">⚠️ File d&apos;attente de construction (collé au bord)</h4>
            <div className="flex items-center gap-2">
              <FloatingButton 
                variant="warning" 
                shape="edge"
                icon={<Clock size={20} />}
                badge={3}
                style={{ position: 'relative', bottom: 'auto', right: 'auto' }}
              >
                Constructions
              </FloatingButton>
              <code className="text-xs bg-gray-200 px-2 py-1 rounded">
                position=&quot;right-center&quot; shape=&quot;edge&quot; badge=&#123;3&#125;
              </code>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-md border-l-4 border-game-blue-dark">
            <h4 className="font-semibold text-sm mb-2">ℹ️ Notifications</h4>
            <div className="flex items-center gap-2">
              <FloatingButton 
                variant="info" 
                shape="round"
                icon={<Bell size={24} />}
                badge={12}
                style={{ position: 'relative', bottom: 'auto', right: 'auto' }}
              />
              <code className="text-xs bg-gray-200 px-2 py-1 rounded">
                position=&quot;top-right&quot; shape=&quot;round&quot; badge=&#123;12&#125;
              </code>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-md border-l-4 border-game-red-dark">
            <h4 className="font-semibold text-sm mb-2">🚨 Alerte attaque urgente</h4>
            <div className="flex items-center gap-2">
              <FloatingButton 
                variant="danger" 
                shape="round"
                size="lg"
                icon={<Swords size={28} />}
                badge="!"
                style={{ position: 'relative', bottom: 'auto', right: 'auto' }}
              />
              <code className="text-xs bg-gray-200 px-2 py-1 rounded">
                variant=&quot;danger&quot; size=&quot;lg&quot; badge=&quot;!&quot;
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
