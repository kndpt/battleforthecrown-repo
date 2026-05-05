import { Avatar, Badge, Card, CardBody } from '@/ui';

export function AvatarsSection() {
  return (
    <section className="w-full max-w-4xl mt-12">
      <h2 className="font-cinzel text-2xl font-bold text-gray-700 mb-6 text-center">Avatars</h2>
      
      <div className="space-y-6">
        {/* Variants */}
        <div className="space-y-4">
          <h3 className="font-game text-lg font-semibold text-gray-700">Variants</h3>
          
          <div className="flex flex-wrap gap-4 items-center">
            <Avatar alt="Default" variant="default" />
            <Avatar alt="Stone" variant="stone" />
            <Avatar alt="Gold" variant="gold" />
            <Avatar alt="Success" variant="success" />
            <Avatar alt="Info" variant="info" />
            <Avatar alt="Danger" variant="danger" />
          </div>
        </div>

        {/* Tailles */}
        <div className="space-y-4">
          <h3 className="font-game text-lg font-semibold text-gray-700">Tailles</h3>
          
          <div className="flex flex-wrap gap-4 items-center">
            <Avatar alt="XS" size="xs" fallback="XS" />
            <Avatar alt="SM" size="sm" fallback="SM" />
            <Avatar alt="MD" size="md" fallback="MD" />
            <Avatar alt="LG" size="lg" fallback="LG" />
            <Avatar alt="XL" size="xl" fallback="XL" />
            <Avatar alt="2XL" size="2xl" fallback="2X" />
            <Avatar alt="3XL" size="3xl" fallback="3X" />
          </div>
        </div>

        {/* Fallbacks personnalisés */}
        <div className="space-y-4">
          <h3 className="font-game text-lg font-semibold text-gray-700">Fallbacks personnalisés</h3>
          
          <div className="flex flex-wrap gap-4 items-center">
            <Avatar alt="Roi Arthur" fallback="RA" variant="gold" size="lg" />
            <Avatar alt="Chevalier Lancelot" fallback="CL" variant="success" size="lg" />
            <Avatar alt="Sorcier Merlin" fallback="SM" variant="info" size="lg" />
            <Avatar alt="Ennemi" fallback="EN" variant="danger" size="lg" />
          </div>
        </div>

        {/* Avatars avec émojis */}
        <div className="space-y-4">
          <h3 className="font-game text-lg font-semibold text-gray-700">Avatars avec émojis</h3>
          
          <div className="flex flex-wrap gap-4 items-center">
            <Avatar fallback="👑" variant="gold" size="lg" />
            <Avatar fallback="⚔️" variant="danger" size="lg" />
            <Avatar fallback="🛡️" variant="info" size="lg" />
            <Avatar fallback="🏰" variant="default" size="lg" />
            <Avatar fallback="🌾" variant="success" size="lg" />
            <Avatar fallback="💰" variant="default" size="lg" />
          </div>
        </div>

  

        {/* Liste de joueurs */}
        <div className="space-y-4">
          <h3 className="font-game text-lg font-semibold text-gray-700">Liste de joueurs</h3>
          
          <div className="bg-white/50 rounded-lg p-4 border-2 border-[#d4c094]">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Avatar size="sm" alt="Roi Arthur" fallback="RA" variant="gold" />
                <div className="flex-1">
                  <div className="font-game">Roi Arthur</div>
                  <div className="text-xs text-gray-600">Niveau 42 • Alliance du Nord</div>
                </div>
                <Badge variant="warning" size="sm">Niv. 42</Badge>
              </div>

              <div className="flex items-center gap-3">
                <Avatar size="sm" alt="Chevalier Lancelot" fallback="CL" variant="success" />
                <div className="flex-1">
                  <div className="font-game">Chevalier Lancelot</div>
                  <div className="text-xs text-gray-600">Niveau 38 • Alliance du Nord</div>
                </div>
                <Badge variant="info" size="sm">Niv. 38</Badge>
              </div>

              <div className="flex items-center gap-3">
                <Avatar size="sm" alt="Sorcier Morgane" fallback="SM" variant="danger" />
                <div className="flex-1">
                  <div className="font-game">Sorcier Morgane</div>
                  <div className="text-xs text-gray-600">Niveau 45 • Alliance du Sud</div>
                </div>
                <Badge variant="error" size="sm">Niv. 45</Badge>
              </div>

              <div className="flex items-center gap-3">
                <Avatar size="sm" alt="Marchand Thomas" fallback="MT" variant="default" />
                <div className="flex-1">
                  <div className="font-game">Marchand Thomas</div>
                  <div className="text-xs text-gray-600">Niveau 28 • Neutre</div>
                </div>
                <Badge variant="neutral" size="sm">Niv. 28</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Avatars avec badges de statut */}
        <div className="space-y-4">
          <h3 className="font-game text-lg font-semibold text-gray-700">Avatars avec badges de statut</h3>
          
          <div className="flex flex-wrap gap-6">
            <div className="relative inline-block">
              <Avatar size="lg" alt="Joueur en ligne" fallback="ON" variant="success" />
              <Badge 
                variant="success" 
                size="sm"
                className="absolute bottom-0 right-0 border-2 border-white"
              >
                •
              </Badge>
            </div>

            <div className="relative inline-block">
              <Avatar size="lg" alt="Joueur occupé" fallback="OC" variant="info" />
              <Badge 
                variant="info" 
                size="sm"
                className="absolute bottom-0 right-0 border-2 border-white"
              >
                •
              </Badge>
            </div>

            <div className="relative inline-block">
              <Avatar size="lg" alt="Joueur hors ligne" fallback="OFF" variant="stone" />
              <Badge 
                variant="neutral" 
                size="sm"
                className="absolute bottom-0 right-0 border-2 border-white"
              >
                •
              </Badge>
            </div>

            <div className="relative inline-block">
              <Avatar size="xl" alt="Héros" fallback="HR" variant="gold" />
              <Badge 
                variant="warning" 
                size="sm"
                className="absolute -top-1 -right-1"
              >
                15
              </Badge>
            </div>
          </div>
        </div>

        {/* Groupe d'avatars (alliance) */}
        <div className="space-y-4">
          <h3 className="font-game text-lg font-semibold text-gray-700">Groupe d&apos;avatars (Alliance)</h3>
          
          <div className="bg-white/50 rounded-lg p-4 border-2 border-[#d4c094]">
            <div className="space-y-4">
              {/* Groupe compact */}
              <div>
                <div className="text-sm text-gray-600 mb-2">Membres récemment actifs</div>
                <div className="flex -space-x-2">
                  <Avatar size="sm" alt="Membre 1" fallback="M1" variant="success" />
                  <Avatar size="sm" alt="Membre 2" fallback="M2" variant="info" />
                  <Avatar size="sm" alt="Membre 3" fallback="M3" variant="default" />
                  <Avatar size="sm" alt="Plus" fallback="+5" variant="stone" />
                </div>
              </div>

              {/* Alliance avec avatar principal */}
              <div className="flex items-center gap-3">
                <Avatar size="md" alt="Alliance Nord" fallback="AN" variant="gold" />
                <div className="flex-1">
                  <div className="font-game">Alliance du Nord</div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <div className="flex -space-x-1">
                      <Avatar size="xs" fallback="1" />
                      <Avatar size="xs" fallback="2" />
                      <Avatar size="xs" fallback="3" />
                    </div>
                    <span>12 membres • Top 5</span>
                  </div>
                </div>
                <Badge variant="warning" size="sm">TOP 5</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Carte de profil */}
        <div className="space-y-4">
          <h3 className="font-game text-lg font-semibold text-gray-700">Carte de profil</h3>
          
          <Card variant="parchment" className="max-w-sm mx-auto">
            <CardBody className="text-center">
              <Avatar 
                size="3xl" 
                alt="Roi du royaume" 
                fallback="RR" 
                variant="gold"
                className="mx-auto mb-4"
              />
              <h3 className="font-game text-xl mb-2">Roi du Royaume</h3>
              <p className="text-sm text-gray-600 mb-4">
                Souverain du royaume du Nord
              </p>
              <div className="flex justify-around text-sm">
                <div>
                  <div className="font-bold">1,234</div>
                  <div className="text-xs text-gray-600">Victoires</div>
                </div>
                <div>
                  <div className="font-bold">42</div>
                  <div className="text-xs text-gray-600">Niveau</div>
                </div>
                <div>
                  <div className="font-bold">8</div>
                  <div className="text-xs text-gray-600">Villages</div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </section>
  );
}
