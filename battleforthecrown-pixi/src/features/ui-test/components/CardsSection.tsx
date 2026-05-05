import { Button, Card, CardBanner, CardBody, CardFooter, CardImage, CardTitle, CardStats, StatsContent } from '@/ui';

export function CardsSection() {
  return (
    <section className="w-full max-w-6xl mt-12">
      <h2 className="font-cinzel text-2xl font-bold text-gray-700 mb-6 text-center">Cartes</h2>
      
      <div className="flex gap-6 justify-center flex-wrap">
        {/* Carte Parchment avec bannière */}
        <Card variant="parchment" size="md">
          <CardBody>
            <CardTitle>Archerie</CardTitle>
            <CardStats>
              <StatsContent value="420 + 100" label="LVL 1 → LVL 3" />
            </CardStats>
          </CardBody>
          <CardFooter>
            <Button variant="info" size="lg">
              10.000 G
            </Button>
          </CardFooter>
        </Card>

        {/* Carte Wood */}
        <Card variant="wood" size="md">
          <CardBody>
            <CardImage 
              src="/assets/wood.png" 
              alt="Camp de bûcherons"
              onError={(e) => {
                e.currentTarget.style.opacity = '0.15';
                e.currentTarget.style.filter = 'none';
              }}
            />
            <CardTitle>Camp de bûcherons</CardTitle>
            <CardStats>
              <StatsContent 
                value={<>+50 <span className="text-sm">bois/h</span></>} 
                label="Production niveau 1" 
              />
            </CardStats>
          </CardBody>
          <CardFooter>
            <Button variant="neutral" size="md">Annuler</Button>
            <Button variant="success" size="md">Construire</Button>
          </CardFooter>
        </Card>

        {/* Carte Stone - petite */}
        <Card variant="stone" size="sm">
          <CardBody>
            <CardTitle>Chevalier</CardTitle>
            <div className="text-center text-sm mt-2 space-y-1">
              <p className="font-bold">Coût : 100 G</p>
              <p>Attaque : 25</p>
              <p>Défense : 40</p>
            </div>
          </CardBody>
          <CardFooter>
            <Button variant="success" size="sm">Recruter</Button>
          </CardFooter>
        </Card>

        {/* Carte Victoire */}
        <Card variant="parchment" size="sm">
          <CardBanner variant="gold">VICTOIRE</CardBanner>
          <CardBody withBanner>
            <CardStats >
              <div>
                <div className="text-2xl">🏆</div>
                <div className="text-lg font-bold mt-1">+1500 XP</div>
                <div className="text-xs opacity-90">Bataille gagnée</div>
              </div>
            </CardStats>
          </CardBody>
          <CardFooter>
            <Button variant="warning" size="sm">Réclamer</Button>
          </CardFooter>
        </Card>
      </div>
    </section>
  );
}
