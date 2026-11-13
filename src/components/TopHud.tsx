import {
  Activity,
  Anchor,
  Bell,
  FastForward,
  Layers,
  Map as MapIcon,
  Pause,
  Play,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { getAggregateBufferPercent } from '../engine/simulation';
import { GameState } from '../engine/types';

export type ActiveView = 'map' | 'pipeline' | 'feed';

interface TopHudProps {
  state: GameState;
  activeView: ActiveView;
  onChangeView: (view: ActiveView) => void;
  onSetSpeed: (speed: 0 | 1 | 2 | 3) => void;
  onReset: () => void;
}

export function TopHud({
  state,
  activeView,
  onChangeView,
  onSetSpeed,
  onReset,
}: TopHudProps) {
  const bufferPct = getAggregateBufferPercent(state);
  const bufferBarColor =
    bufferPct >= 55 ? 'bg-emerald-400' : bufferPct >= 28 ? 'bg-amber-400' : 'bg-rose-500';
  const cashColor =
    state.brokerCash >= 300
      ? 'text-emerald-400'
      : state.brokerCash >= 130
        ? 'text-amber-400'
        : 'text-rose-400';

  return (
    <header className="flex shrink-0 items-center justify-between gap-1.5 border-b border-slate-800/90 bg-[#0b1526]/95 px-2 py-1 backdrop-blur-md sm:gap-2 sm:px-3 sm:py-1.5">
      {/* View Switcher (Touch-friendly) */}
      <div className="flex items-center gap-1.5">
        <div className="hidden h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/15 ring-1 ring-cyan-400/30 md:flex">
          <Anchor className="h-3.5 w-3.5 text-cyan-400" />
        </div>

        <div className="flex rounded-lg bg-slate-900/90 p-0.5 ring-1 ring-slate-700/70">
          <button
            onClick={() => onChangeView('map')}
            className={`flex min-h-[32px] items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold transition touch-manipulation ${
              activeView === 'map'
                ? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-400/40'
                : 'text-slate-400 active:bg-slate-800'
            }`}
          >
            <MapIcon className="h-3.5 w-3.5" />
            <span>Map</span>
          </button>
          <button
            onClick={() => onChangeView('pipeline')}
            className={`flex min-h-[32px] items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold transition touch-manipulation ${
              activeView === 'pipeline'
                ? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-400/40'
                : 'text-slate-400 active:bg-slate-800'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Buffer</span>
          </button>
          <button
            onClick={() => onChangeView('feed')}
            className={`relative flex min-h-[32px] items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold transition touch-manipulation lg:hidden ${
              activeView === 'feed'
                ? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-400/40'
                : 'text-slate-400 active:bg-slate-800'
            }`}
          >
            <Bell className="h-3.5 w-3.5" />
            {state.activeDisruptions.length > 0 && (
              <span className="font-mono-num rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                {state.activeDisruptions.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Compact Mobile-First Tactical Metrics */}
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="flex flex-col items-center sm:items-start">
          <span className="text-[9px] font-semibold text-slate-400 uppercase">Cash</span>
          <span className={`font-mono-num text-xs font-bold sm:text-sm ${cashColor}`}>
            ${Math.round(state.brokerCash)}k
          </span>
        </div>

        <div className="flex min-w-[64px] flex-col gap-0.5 sm:min-w-[110px]">
          <div className="flex items-center justify-between text-[9px] font-semibold text-slate-400 uppercase">
            <span>Buf</span>
            <span className="font-mono-num text-slate-200">{bufferPct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800 ring-1 ring-slate-700">
            <div
              className={`h-full transition-all duration-200 ${bufferBarColor}`}
              style={{ width: `${bufferPct}%` }}
            />
          </div>
        </div>

        <div className="flex flex-col items-center sm:items-start">
          <span className="text-[9px] font-semibold text-slate-400 uppercase">Strikes</span>
          <span className="font-mono-num text-xs font-bold text-rose-400 sm:text-sm">
            {state.delayStrikes}/{state.maxDelayStrikes}
          </span>
        </div>

        <div className="flex flex-col items-center sm:items-start">
          <span className="text-[9px] font-semibold text-slate-400 uppercase">Day</span>
          <span className="font-mono-num text-xs font-bold text-slate-100 sm:text-sm">
            {Math.floor(state.day)}/{state.maxDays}
          </span>
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-violet-500/15 px-2 py-1 ring-1 ring-violet-400/30">
          <Zap className="h-3.5 w-3.5 text-violet-400" />
          <span className="font-mono-num text-xs font-bold text-violet-200">
            {Math.floor(state.disruptionPoints)}
          </span>
        </div>
      </div>

      {/* Touch-Sized Speed Controls */}
      <div className="flex items-center gap-1">
        <div className="flex items-center rounded-lg bg-slate-900 p-0.5 ring-1 ring-slate-700/80">
          <button
            onClick={() => onSetSpeed(0)}
            title="Pause"
            className={`min-h-[32px] min-w-[32px] rounded-md p-1.5 flex items-center justify-center transition touch-manipulation ${
              state.speed === 0
                ? 'bg-amber-500/25 text-amber-300 ring-1 ring-amber-400/40'
                : 'text-slate-400 active:bg-slate-800'
            }`}
          >
            <Pause className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onSetSpeed(1)}
            title="1x Speed"
            className={`min-h-[32px] rounded-md px-2 py-1 text-[11px] font-semibold flex items-center gap-0.5 transition touch-manipulation ${
              state.speed === 1
                ? 'bg-cyan-500/25 text-cyan-300 ring-1 ring-cyan-400/40'
                : 'text-slate-400 active:bg-slate-800'
            }`}
          >
            <Play className="h-3 w-3" />
            1x
          </button>
          <button
            onClick={() => onSetSpeed(2)}
            title="2x Speed"
            className={`hidden min-h-[32px] rounded-md px-2 py-1 text-[11px] font-semibold sm:flex items-center gap-0.5 transition touch-manipulation ${
              state.speed === 2
                ? 'bg-cyan-500/25 text-cyan-300 ring-1 ring-cyan-400/40'
                : 'text-slate-400 active:bg-slate-800'
            }`}
          >
            <FastForward className="h-3 w-3" />
            2x
          </button>
          <button
            onClick={() => onSetSpeed(3)}
            title="3x Speed"
            className={`min-h-[32px] rounded-md px-2 py-1 text-[11px] font-semibold flex items-center gap-0.5 transition touch-manipulation ${
              state.speed === 3
                ? 'bg-cyan-500/25 text-cyan-300 ring-1 ring-cyan-400/40'
                : 'text-slate-400 active:bg-slate-800'
            }`}
          >
            <Activity className="h-3 w-3" />
            3x
          </button>
        </div>

        <button
          onClick={onReset}
          title="Restart Match"
          className="flex min-h-[32px] min-w-[32px] items-center justify-center rounded-lg bg-slate-800/80 p-1.5 text-slate-300 ring-1 ring-slate-700 transition active:bg-slate-700 touch-manipulation"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>
    </header>
  );
}
