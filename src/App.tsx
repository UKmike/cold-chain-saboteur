import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { BufferPipelinePanel } from './components/BufferPipelinePanel';
import { DisruptionHand } from './components/DisruptionHand';
import { EventFeed } from './components/EventFeed';
import { GameOverModal } from './components/GameOverModal';
import { OverlayDrawer, TopHud } from './components/TopHud';
import { WorldMap } from './components/WorldMap';
import { createInitialGameState, DISRUPTION_CARDS } from './engine/config';
import { playDisruptionCard, stepSimulation } from './engine/simulation';
import { CardId, GameState, TargetType } from './engine/types';

export function App() {
  const [state, setState] = useState<GameState>(() => createInitialGameState());
  const [activeDrawer, setActiveDrawer] = useState<OverlayDrawer>('none');
  const [selectedCard, setSelectedCard] = useState<CardId | null>(null);

  // Real-time simulation loop (100ms ticks)
  useEffect(() => {
    if (state.speed === 0 || state.status !== 'playing') return;
    const interval = setInterval(() => {
      setState((prev) => stepSimulation(prev, 0.04 * prev.speed));
    }, 100);
    return () => clearInterval(interval);
  }, [state.speed, state.status]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        setState((prev) => ({ ...prev, speed: prev.speed === 0 ? 1 : 0 }));
      } else if (e.code === 'Escape') {
        setSelectedCard(null);
        setActiveDrawer('none');
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
      setActiveDrawer('pipeline');
    } else if (card.targetType === 'origin' || card.targetType === 'hub') {
      setActiveDrawer('none');
    } else if (activeDrawer === 'feed') {
      setActiveDrawer('none');
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
    setActiveDrawer('none');
  };

  return (
    <div className="relative h-dvh w-screen select-none overflow-hidden bg-[#071120] text-slate-100">
      {/* Full-Screen Map Stage */}
      <main className="absolute inset-0">
        <WorldMap
          state={state}
          selectedCard={selectedCard}
          onTargetClick={handleTargetClick}
        />
      </main>

      {/* Floating Top HUD */}
      <TopHud
        state={state}
        activeDrawer={activeDrawer}
        onToggleDrawer={setActiveDrawer}
        onSetSpeed={(speed) => setState((prev) => ({ ...prev, speed }))}
        onReset={handleReset}
      />

      {/* Floating Bottom Disruption Cards */}
      <DisruptionHand
        state={state}
        selectedCard={selectedCard}
        onSelectCard={handleSelectCard}
      />

      {/* Overlay Drawer for Buffer & Pipeline or Feed */}
      {activeDrawer !== 'none' && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/60 p-3 pt-14 pb-24 backdrop-blur-sm sm:p-6 sm:pt-16 sm:pb-28"
          onClick={() => setActiveDrawer('none')}
        >
          <div
            className="relative h-full w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-700/80 bg-[#081224]/95 p-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveDrawer('none')}
              className="absolute top-2.5 right-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-800/90 text-slate-300 ring-1 ring-slate-700 hover:bg-slate-700 hover:text-white touch-manipulation"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>

            {activeDrawer === 'pipeline' ? (
              <BufferPipelinePanel
                state={state}
                selectedCard={selectedCard}
                onTargetClick={handleTargetClick}
              />
            ) : (
              <div className="h-full max-w-xl mx-auto">
                <EventFeed logs={state.logs} activeDisruptions={state.activeDisruptions} />
              </div>
            )}
          </div>
        </div>
      )}

      <GameOverModal state={state} onRestart={handleReset} />
    </div>
  );
}

export default App;
