import {
  HeaderBar,
  PlayerProfile,
  ResourceDisplay,
  HeaderActions,
  type ResourceDisplayItem,
} from "@/ui";
import { useState } from "react";

export function HeaderBarSection() {
  const [notificationCount] = useState(5);

  // Données exemple
  const mockResources: ResourceDisplayItem[] = [
    { type: "wood", current: 8500, max: 10000, production: 120 },
    { type: "stone", current: 3200, max: 5000, production: 80 },
    { type: "gold", current: 1500, max: 8000, production: 50 },
    { type: "food", current: 12000, max: 15000, production: 200 },
  ];

  const mockResourcesLow: ResourceDisplayItem[] = [
    { type: "wood", current: 9800, max: 10000, production: 120 },
    { type: "stone", current: 1200, max: 5000, production: 80 },
    { type: "gold", current: 150, max: 8000, production: 50 },
  ];

  return (
    <section className="w-full max-w-full mt-12">
      <h2 className="font-cinzel text-2xl font-bold text-gray-700 mb-6 text-center">
        Barre d'en-tête (HeaderBar)
      </h2>

      <div className="space-y-6">
        {/* HeaderBar complète */}
        <div className="space-y-4">
          <h3 className="font-game text-lg font-semibold text-gray-700">
            HeaderBar complète
          </h3>

          <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
            <HeaderBar>
              <PlayerProfile playerName="Sire Kelvin" level={12} />

              <ResourceDisplay resources={mockResources} />

              <HeaderActions
                notificationCount={notificationCount}
                onSettingsClick={() => console.log("Settings")}
                onNotificationsClick={() => console.log("Notifications")}
              />
            </HeaderBar>
          </div>
        </div>

        {/* HeaderBar avec ressources faibles */}
        <div className="space-y-4">
          <h3 className="font-game text-lg font-semibold text-gray-700">
            Ressources faibles (alertes visuelles)
          </h3>

          <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
            <HeaderBar>
              <PlayerProfile playerName="Baron Nicolas" level={8} />

              <ResourceDisplay resources={mockResourcesLow} />

              <HeaderActions
                notificationCount={12}
                onSettingsClick={() => console.log("Settings")}
                onNotificationsClick={() => console.log("Notifications")}
              />
            </HeaderBar>
          </div>
        </div>

        {/* HeaderBar compacte */}
        <div className="space-y-4">
          <h3 className="font-game text-lg font-semibold text-gray-700">
            Version compacte (mobile)
          </h3>

          <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
            <HeaderBar>
              <PlayerProfile playerName="Dame Sarah" level={25} />

              <ResourceDisplay resources={mockResources.slice(0, 3)} compact />

              <HeaderActions
                notificationCount={3}
                onMenuClick={() => console.log("Menu")}
              />
            </HeaderBar>
          </div>
        </div>

        {/* Cas d'usage */}
        <div className="space-y-4">
          <h3 className="font-game text-lg font-semibold text-gray-700">
            Cas d'usage typiques
          </h3>

          <div className="space-y-3">
            {/* Joueur débutant */}
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Joueur débutant (niveau 1-5)
              </p>
              <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
                <HeaderBar>
                  <PlayerProfile playerName="Novice" level={3} />
                  <ResourceDisplay
                    resources={[
                      { type: "wood", current: 150, production: 10 },
                      { type: "stone", current: 80, production: 5 },
                      { type: "gold", current: 50, production: 2 },
                    ]}
                    compact
                  />
                  <HeaderActions notificationCount={1} />
                </HeaderBar>
              </div>
            </div>

            {/* Joueur expérimenté */}
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Joueur expérimenté (niveau 20+)
              </p>
              <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
                <HeaderBar>
                  <PlayerProfile playerName="Maître du Royaume" level={34} />
                  <ResourceDisplay
                    resources={[
                      {
                        type: "wood",
                        current: 45000,
                        max: 50000,
                        production: 500,
                      },
                      {
                        type: "stone",
                        current: 32000,
                        max: 40000,
                        production: 350,
                      },
                      {
                        type: "gold",
                        current: 8500,
                        max: 25000,
                        production: 200,
                      },
                      {
                        type: "food",
                        current: 78000,
                        max: 100000,
                        production: 800,
                      },
                    ]}
                  />
                  <HeaderActions notificationCount={15} />
                </HeaderBar>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
