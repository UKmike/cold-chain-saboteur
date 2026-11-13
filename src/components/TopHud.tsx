import {
  Activity,
  Bell,
  Layers,
  Pause,
  Play,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { getAggregateBufferPercent } from '../engine/simulation';
import { GameState } from '../engine/types';

export type OverlayDrawer = 'none' | 'pipeline' | 'feed';

interface TopHudProps {
  state: GameState;
  activeDrawer: OverlayDrawer;
  onToggleDrawer: (drawer: OverlayDrawer) => void;
  onSetSpeed: (speed: 0 | 1 | 2 | 3) => void;
  onReset: () => void;
}

export function TopHud({
  state,
  activeDrawer,
  onToggleDrawer,
  onSetSpeed,
  onReset,
}: TopHudProps) {
  const bufferPct = getAggregateBufferPercent(state);
  const bufferTextColor =
    bufferPct >= 55
      ? 'text-emerald-400'
      : bufferPct >= 28
        ? 'text-amber-400'
        : 'text-rose-400';
  const cashColor =
    state.brokerCash >= 300
      ? 'text-emerald-400'
      : state.brokerCash >= 130
        ? 'text-amber-400'
        : 'text-rose-400';

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-20 flex items-start justify-between gap-2 p-2 sm:p-3">
      {/* Top-Left Floating Stats Pill */}
      <div className="pointer-events-auto flex items-center gap-2.5 rounded-full border border-slate-700/70 bg-slate-950/75 px-3 py-1.5 shadow-lg backdrop-blur-md sm:gap-4 sm:px-4">
        <div className="flex items-baseline gap-1">
          <span className="text-[9px] font-semibold text-slate-400 uppercase">Cash</span>
          <span className={`font-mono-num text-xs font-bold sm:text-sm ${cashColor}`}>
            ${Math.round(state.brokerCash)}k
          </span>
        </div>

        <div className="flex items-baseline gap-1">
          <span className="text-[9px] font-semibold text-slate-400 uppercase">Buf</span>
          <span className={`font-mono-num text-xs font-bold sm:text-sm ${bufferTextColor}`}>
            {bufferPct}%
          </span>
        </div>

        <div className="flex items-baseline gap-1">
          <span className="text-[9px] font-semibold text-slate-400 uppercase">Strikes</span>
          <span className="font-mono-num text-xs font-bold text-rose-400 sm:text-sm">
            {state.delayStrikes}/{state.maxDelayStrikes}
          </span>
        </div>

        <div className="flex items-baseline gap-1">
          <span className="text-[9px] font-semibold text-slate-400 uppercase">Day</span>
          <span className="font-mono-num text-xs font-bold text-slate-100 sm:text-sm">
            {Math.floor(state.day)}/{state.maxDays}
          </span>
        </div>

        <div className="flex items-center gap-1 rounded-full bg-violet-500/20 px-2 py-0.5 ring-1 ring-violet-400/40">
          <Zap className="h-3 w-3 text-violet-300" />
          <span className="font-mono-num text-xs font-bold text-violet-200">
            {Math.floor(state.disruptionPoints)}
          </span>
        </div>
      </div>

      {/* Top-Right Floating Controls Pill */}
      <div className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-slate-700/70 bg-slate-950/75 p-1 shadow-lg backdrop-blur-md">
        <button
          onClick={() =>
            onToggleDrawer(activeDrawer === 'pipeline' ? 'none' : 'pipeline')
          }
          className={`flex min-h-[30px] items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition touch-manipulation ${
            activeDrawer === 'pipeline'
              ? 'bg-cyan-500/25 text-cyan-200 ring-1 ring-cyan-400/50'
              : 'text-slate-300 hover:bg-slate-800/80 active:bg-slate-800'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Buffer</span>
        </button>

        <button
          onClick={() => onToggleDrawer(activeDrawer === 'feed' ? 'none' : 'feed')}
          className={`relative flex min-h-[30px] items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition touch-manipulation ${
            activeDrawer === 'feed'
              ? 'bg-cyan-500/25 text-cyan-200 ring-1 ring-cyan-400/50'
              : 'text-slate-300 hover:bg-slate-800/80 active:bg-slate-800'
          }`}
        >
          <Bell className="h-3.5 w-3.5" />
          {state.activeDisruptions.length > 0 && (
            <span className="font-mono-num rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
              {state.activeDisruptions.length}
            </span>
          )}
        </button>

        <div className="h-4 w-px bg-slate-700/70" />

        <button
          onClick={() => onSetSpeed(0)}
          title="Pause"
          className={`flex min-h-[30px] min-w-[30px] items-center justify-center rounded-full transition touch-manipulation ${
            state.speed === 0
              ? 'bg-amber-500/30 text-amber-300 ring-1 ring-amber-400/50'
              : 'text-slate-300 active:bg-slate-800'
          }`}
        >
          <Pause className="h-3.5 w-3.5" />
        </button>

        <button
          onClick={() => onSetSpeed(1)}
          title="1x Speed"
          className={`flex min-h-[30px] items-center gap-0.5 rounded-full px-2 text-[11px] font-semibold transition touch-manipulation ${
            state.speed === 1
              ? 'bg-cyan-500/30 text-cyan-200 ring-1 ring-cyan-400/50'
              : 'text-slate-300 active:bg-slate-800'
          }`}
        >
          <Play className="h-3 w-3" />
          1x
        </button>

        <button
          onClick={() => onSetSpeed(3)}
          title="3x Speed"
          className={`flex min-h-[30px] items-center gap-0.5 rounded-full px-2 text-[11px] font-semibold transition touch-manipulation ${
            state.speed === 3
              ? 'bg-cyan-500/30 text-cyan-200 ring-1 ring-cyan-400/50'
              : 'text-slate-300 active:bg-slate-800'
          }`}
        >
          <Activity className="h-3 w-3" />
          3x
        </button>

        <button
          onClick={onReset}
          title="Restart Match"
          className="flex min-h-[30px] min-w-[30px] items-center justify-center rounded-full text-slate-300 transition hover:bg-slate-800 active:bg-slate-700 touch-manipulation"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>
    </header>
  );
}
