import { useState } from 'react';
import { Link } from 'react-router';
import { ToastProvider, useToast } from '@/ui';
import {
  AvatarsSection,
  BadgesSection,
  ButtonsSection,
  CardsSection,
  CheckboxesRadiosSection,
  FloatingButtonsSection,
  HeaderBarSection,
  InputsSection,
  ModalsSection,
  PanelsSection,
  ProgressBarsSection,
  SelectsSection,
  SlidersSection,
  SpinnersSection,
  TextareasSection,
  ToastsSection,
  TooltipsSection,
} from './components';

function UiTestSections() {
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedTroop, setSelectedTroop] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [difficulty, setDifficulty] = useState('normal');
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();

  return (
    <div className="min-h-screen bg-parchment flex flex-col gap-8 items-center justify-start p-8">
      <header className="w-full max-w-5xl flex items-center justify-between">
        <h1 className="font-cinzel text-4xl font-bold text-gray-800">UI Library Demo</h1>
        <Link to="/" className="text-sm text-gray-700 hover:text-gray-900 underline">
          ← Retour
        </Link>
      </header>

      <ButtonsSection />
      <FloatingButtonsSection />
      <AvatarsSection />
      <ModalsSection />
      <CardsSection />
      <InputsSection />
      <CheckboxesRadiosSection
        acceptTerms={acceptTerms}
        setAcceptTerms={setAcceptTerms}
        difficulty={difficulty}
        setDifficulty={setDifficulty}
      />
      <SelectsSection
        selectedBuilding={selectedBuilding}
        setSelectedBuilding={setSelectedBuilding}
        selectedTroop={selectedTroop}
        setSelectedTroop={setSelectedTroop}
      />
      <TooltipsSection />
      <BadgesSection />
      <ToastsSection addToast={addToast} />
      <SpinnersSection isLoading={isLoading} setIsLoading={setIsLoading} />
      <SlidersSection />
      <PanelsSection />
      <TextareasSection />
      <HeaderBarSection />
      <ProgressBarsSection />
    </div>
  );
}

export function UiTestScreen() {
  return (
    <ToastProvider position="top-right">
      <UiTestSections />
    </ToastProvider>
  );
}
