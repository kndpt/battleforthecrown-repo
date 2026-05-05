import { Slider } from '@/ui';
import { useState } from 'react';

export function SlidersSection() {
  const [volume, setVolume] = useState(70);
  const [difficulty, setDifficulty] = useState(50);
  const [warriors, setWarriors] = useState(10);
  const [archers, setArchers] = useState(5);
  const [knights, setKnights] = useState(2);

  const totalCost = warriors * 50 + archers * 75 + knights * 150;
  const trainingTime = warriors * 1 + archers * 2 + knights * 5;

  return (
    <section className="w-full max-w-4xl mt-12">
      <h2 className="font-cinzel text-2xl font-bold text-gray-700 mb-6 text-center">Curseurs (Sliders)</h2>
      
      <div className="space-y-6">
        {/* Variants */}
        <div className="space-y-4">
          <h3 className="font-game text-lg font-semibold text-gray-700">Variants</h3>
          
          <div className="space-y-3">
            <Slider variant="default" label="Default" defaultValue={50} />
            <Slider variant="success" label="Success" defaultValue={75} />
            <Slider variant="info" label="Info" defaultValue={60} />
            <Slider variant="warning" label="Warning" defaultValue={40} />
            <Slider variant="danger" label="Danger" defaultValue={20} />
          </div>
        </div>

        {/* Tailles */}
        <div className="space-y-4">
          <h3 className="font-game text-lg font-semibold text-gray-700">Tailles</h3>
          
          <div className="space-y-3">
            <Slider variant="info" size="sm" label="Small" defaultValue={50} />
            <Slider variant="info" size="md" label="Medium" defaultValue={50} />
            <Slider variant="info" size="lg" label="Large" defaultValue={50} />
          </div>
        </div>

        {/* Avec valeur affichée */}
        <div className="space-y-4">
          <h3 className="font-game text-lg font-semibold text-gray-700">Avec valeur affichée</h3>
          
          <div className="space-y-3">
            <Slider variant="success" label="Volume" showValue value={volume} onChange={(e) => setVolume(Number(e.target.value))} />
            <Slider variant="warning" label="Difficulté" showValue value={difficulty} onChange={(e) => setDifficulty(Number(e.target.value))} />
          </div>
        </div>

        {/* Exemples contextuels */}
        <div className="space-y-4">
          <h3 className="font-game text-lg font-semibold text-gray-700">Exemples contextuels</h3>
          
          {/* Configuration audio */}
          <div className="bg-white/50 rounded-lg p-4 border-2 border-[#d4c094]">
            <p className="text-sm text-gray-600 mb-3 font-semibold">Paramètres audio</p>
            <div className="space-y-3">
              <Slider
                variant="success"
                label="Volume musique"
                showValue
                min={0}
                max={100}
                defaultValue={70}
              />
              <Slider
                variant="info"
                label="Volume effets sonores"
                showValue
                min={0}
                max={100}
                defaultValue={85}
              />
            </div>
          </div>

          {/* Entraînement de troupes */}
          <div className="bg-white/50 rounded-lg p-4 border-2 border-[#d4c094]">
            <p className="text-sm text-gray-600 mb-3 font-semibold">Entraînement de troupes</p>
            <div className="space-y-4">
              <Slider
                variant="success"
                label="Guerriers 🗡️"
                showValue
                min={0}
                max={50}
                value={warriors}
                onChange={(e) => setWarriors(Number(e.target.value))}
              />
              
              <Slider
                variant="info"
                label="Archers 🏹"
                showValue
                min={0}
                max={30}
                value={archers}
                onChange={(e) => setArchers(Number(e.target.value))}
              />
              
              <Slider
                variant="warning"
                label="Chevaliers 🛡️"
                showValue
                min={0}
                max={10}
                value={knights}
                onChange={(e) => setKnights(Number(e.target.value))}
              />
              
              <div className="mt-4 pt-4 border-t-2 border-[#d4c094] space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-game">Coût total :</span>
                  <span className="font-game font-bold">💰 {totalCost} or</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-game">Temps :</span>
                  <span className="font-game font-bold">⏱️ {trainingTime} min</span>
                </div>
              </div>
            </div>
          </div>

          {/* Niveau avec min/max personnalisé */}
          <div className="bg-white/50 rounded-lg p-4 border-2 border-[#d4c094]">
            <p className="text-sm text-gray-600 mb-3 font-semibold">Configuration de partie</p>
            <div className="space-y-3">
              <Slider
                variant="warning"
                label="Niveau du château"
                showValue
                min={1}
                max={10}
                defaultValue={5}
              />
              <Slider
                variant="success"
                label="Or de départ"
                showValue
                min={500}
                max={5000}
                step={100}
                defaultValue={1000}
              />
              <Slider
                variant="danger"
                label="Taxes (%)"
                showValue
                min={0}
                max={100}
                step={5}
                defaultValue={15}
              />
            </div>
          </div>

          {/* Slider désactivé */}
          <div className="bg-white/50 rounded-lg p-4 border-2 border-[#d4c094]">
            <p className="text-sm text-gray-600 mb-3 font-semibold">Configuration verrouillée</p>
            <Slider
              variant="default"
              label="Paramètre verrouillé"
              showValue
              defaultValue={50}
              disabled
            />
          </div>
        </div>
      </div>
    </section>
  );
}
