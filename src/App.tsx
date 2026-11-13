import { useEffect, useState } from 'react';
import { BufferPipelinePanel } from './components/BufferPipelinePanel';
import { DisruptionHand } from './components/DisruptionHand';
import { EventFeed } from './components/EventFeed';
import { GameOverModal } from './components/GameOverModal';
import { ActiveView, TopHud } from './components/TopHud';
import { WorldMap } from './components/WorldMap';
import { createInitialGameState, DISRUPTION_CARDS } from './engine/config';
import { playDisruptionCard, stepSimulation } from './engine/simulation';
import { CardId, GameState, TargetType } from './engine/types';

export function App() {
  const [state, setState] = useState<GameState>(() => createInitialGameState());
  const [activeView, setActiveView] = useState<ActiveView>('map');
  const [selectedCard, setSelectedCard] = useState<CardId | null>(null);

  // Real-time simulation loop (100ms ticks)
  useEffect(() => {
    if (state.speed === 0 || state.status !== 'playing') return;
    const interval = setInterval(() => {
      setState((prev) => stepSimulation(prev, 0.04 * prev.speed));
    }, 100);
    return () => clearInterval(interval);
  }, [state.speed, state.status]);

  // Spacebar toggles Pause / Resume on keyboard devices
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        setState((prev) => ({ ...prev, speed: prev.speed === 0 ? 1 : 0 }));
      } else if (e.code === 'Escape') {
        setSelectedCard(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleSelectCard = (cardId: CardId | null) => {
    setSelectedCard(cardId);
    if (!cardId) return;
    const card = DISRUPTION_CARDS.find((c) => c.id === cardId);
    if (!card) return;
    if (card.targetType === 'buffer') {
      setActiveView('pipeline');
    } else if (card.targetType === 'origin' || card.targetType === 'hub') {
      setActiveView('map');
    } else if (activeView === 'feed') {
      setActiveView('map');
    }
  };

  const handleTargetClick = (targetType: TargetType, targetId: string) => {
    if (!selectedCard) return;
    const card = DISRUPTION_CARDS.find((c) => c.id === selectedCard);
    if (!card || card.targetType !== targetType) return;

    setState((prev) => playDisruptionCard(prev, selectedCard, targetId));
    setSelectedCard(null);
  };

  const handleReset = () => {
    setState(createInitialGameState());
    setSelectedCard(null);
  };

  return (
    <div className="flex h-dvh w-screen select-none flex-col overflow-hidden bg-[#070f1c] text-slate-100">
      <TopHud
        state={state}
        activeView={activeView}
        onChangeView={setActiveView}
        onSetSpeed={(speed) => setState((prev) => ({ ...prev, speed }))}
        onReset={handleReset}
      />

      <main className="grid min-h-0 flex-1 grid-cols-1 gap-2 p-2 lg:grid-cols-12 lg:gap-2.5 lg:p-2.5">
        <div className="min-h-0 lg:col-span-9">
          {activeView === 'map' && (
            <WorldMap
              state={state}
              selectedCard={selectedCard}
              onTargetClick={handleTargetClick}
            />
          )}
          {activeView === 'pipeline' && (
            <BufferPipelinePanel
              state={state}
              selectedCard={selectedCard}
              onTargetClick={handleTargetClick}
            />
          )}
          {activeView === 'feed' && (
            <div className="h-full lg:hidden">
              <EventFeed logs={state.logs} activeDisruptions={state.activeDisruptions} />
            </div>
          )}
        </div>

        <div className="hidden min-h-0 lg:col-span-3 lg:block">
          <EventFeed logs={state.logs} activeDisruptions={state.activeDisruptions} />
        </div>
      </main>

      <DisruptionHand
        state={state}
        selectedCard={selectedCard}
        onSelectCard={handleSelectCard}
      />

      <GameOverModal state={state} onRestart={handleReset} />
    </div>
  );
}

export default App;
