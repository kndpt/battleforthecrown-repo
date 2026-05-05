import { Button, IconButton } from '@/ui';
import { Plus, Trash2, Settings, X, Swords, Shield, Home, Users } from 'lucide-react';

export function ButtonsSection() {
  return (
    <section className="w-full max-w-4xl">
      <h2 className="font-cinzel text-2xl font-bold text-gray-700 mb-6 text-center">Boutons</h2>
      
      <div className="space-y-6">
        {/* Button classique */}
        <div>
          <h3 className="font-game text-lg font-semibold text-gray-700 mb-3">Button (avec texte)</h3>
          <div className="flex gap-4 justify-center mb-4 flex-wrap">
            <Button variant="success">OK</Button>
            <Button variant="info">ACCEPTER</Button>
            <Button variant="danger">NON</Button>
            <Button variant="warning">ATTENTION</Button>
            <Button variant="neutral">Retour</Button>
          </div>
          
          <div className="flex gap-4 justify-center mb-4 flex-wrap">
            <Button variant="success" size="sm">Small</Button>
            <Button variant="info" size="md">Medium</Button>
            <Button variant="danger" size="lg">Large</Button>
            <Button variant="warning" size="xl">Extra Large</Button>
          </div>
          
          <div className="flex gap-4 justify-center">
            <Button variant="success" disabled>Disabled</Button>
          </div>
        </div>

        {/* IconButton */}
        <div>
          <h3 className="font-game text-lg font-semibold text-gray-700 mb-3">IconButton (avec icône)</h3>
          
          <div className="flex gap-4 justify-center mb-4 flex-wrap items-center">
            <IconButton icon={Plus} variant="success" label="Ajouter" />
            <IconButton icon={Trash2} variant="danger" label="Supprimer" />
            <IconButton icon={Settings} variant="info" label="Paramètres" />
            <IconButton icon={X} variant="neutral" label="Fermer" />
            <IconButton icon={Swords} variant="warning" label="Attaquer" />
          </div>

          <div className="flex gap-4 justify-center mb-4 flex-wrap items-center">
            <IconButton icon={Shield} variant="success" size="sm" label="Défense (Small)" />
            <IconButton icon={Home} variant="info" size="md" label="Village (Medium)" />
            <IconButton icon={Users} variant="warning" size="lg" label="Troupes (Large)" />
            <IconButton icon={Swords} variant="danger" size="xl" label="Bataille (XL)" />
          </div>

          <div className="flex gap-4 justify-center">
            <IconButton icon={Settings} variant="neutral" label="Paramètres" disabled />
          </div>
        </div>
      </div>
    </section>
  );
}
