import { useState } from 'react';
import { Button, NumericKeypad, NumericKeypadSheet } from '@/ui';

export function KeypadsSection() {
  const [troops, setTroops] = useState(0);
  const [resources, setResources] = useState(0);
  const [sheetValue, setSheetValue] = useState(42);
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <section className="w-full max-w-4xl mt-12">
      <h2 className="font-cinzel text-2xl font-bold text-gray-700 mb-6 text-center">
        Pavés numériques (Keypads)
      </h2>

      <div className="space-y-8">
        <div className="bg-white/50 rounded-lg p-4 border-2 border-[#d4c094]">
          <p className="text-sm text-gray-600 mb-3 font-semibold">
            Recrutement de troupes (variant info, max 50)
          </p>
          <div className="max-w-xs mx-auto">
            <NumericKeypad
              variant="info"
              value={troops}
              onChange={setTroops}
              max={50}
            />
          </div>
        </div>

        <div className="bg-white/50 rounded-lg p-4 border-2 border-[#d4c094]">
          <p className="text-sm text-gray-600 mb-3 font-semibold">
            Échange de ressources (variant warning, max 10 000)
          </p>
          <div className="max-w-xs mx-auto">
            <NumericKeypad
              variant="warning"
              value={resources}
              onChange={setResources}
              max={10000}
              unitLabel={`max ${(10000).toLocaleString('fr-FR')}`}
            />
          </div>
        </div>

        <div className="bg-white/50 rounded-lg p-4 border-2 border-[#d4c094]">
          <p className="text-sm text-gray-600 mb-3 font-semibold">
            Sheet déclenchée par tap (mobile-first)
          </p>
          <div className="flex items-center justify-center gap-4">
            <span className="font-cinzel text-3xl font-bold text-kingdom-900">
              {sheetValue.toLocaleString('fr-FR')}
            </span>
            <Button variant="info" size="md" onClick={() => setSheetOpen(true)}>
              Modifier
            </Button>
          </div>
          <NumericKeypadSheet
            open={sheetOpen}
            onClose={() => setSheetOpen(false)}
            onConfirm={setSheetValue}
            value={sheetValue}
            max={9999}
            title="ÉCUYER"
            variant="info"
          />
        </div>

        <div className="bg-white/50 rounded-lg p-4 border-2 border-[#d4c094]">
          <p className="text-sm text-gray-600 mb-3 font-semibold">
            Verrouillé (max = 0)
          </p>
          <div className="max-w-xs mx-auto opacity-90">
            <NumericKeypad variant="info" value={0} onChange={() => undefined} max={0} />
          </div>
        </div>
      </div>
    </section>
  );
}
