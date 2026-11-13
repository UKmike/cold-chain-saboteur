import {
  Activity,
  Anchor,
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

interface TopHudProps {
  state: GameState;
  activeView: 'map' | 'pipeline';
  onChangeView: (view: 'map' | 'pipeline') => void;
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
    <header className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-800/90 bg-[#0b1526]/95 px-3 py-1.5 backdrop-blur-md">
      {/* Brand + View Switcher */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/15 ring-1 ring-cyan-400/30">
            <Anchor className="h-3.5 w-3.5 text-cyan-400" />
          </div>
          <div className="hidden xl:block">
            <h1 className="text-xs font-bold tracking-wide text-slate-100 uppercase">
              ColdChain Saboteur
            </h1>
          </div>
        </div>

        <div className="flex rounded-lg bg-slate-900/90 p-0.5 ring-1 ring-slate-700/70">
          <button
            onClick={() => onChangeView('map')}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition ${
              activeView === 'map'
                ? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-400/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MapIcon className="h-3.5 w-3.5" />
            Global Map
          </button>
          <button
            onClick={() => onChangeView('pipeline')}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition ${
              activeView === 'pipeline'
                ? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-400/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            Buffer & Pipeline
          </button>
        </div>
      </div>

      {/* Center Tactical Metrics */}
      <div className="flex flex-wrap items-center gap-5">
        {/* Broker Cash */}
        <div className="flex flex-col">
          <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
            Broker Cash
          </span>
          <span className={`font-mono-num text-lg font-bold leading-tight ${cashColor}`}>
            ${Math.round(state.brokerCash)}k
          </span>
        </div>

        {/* Buffer Stock Gauge */}
        <div className="flex min-w-[140px] flex-col gap-1">
          <div className="flex items-center justify-between text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
            <span>Buffer Stock</span>
            <span className="font-mono-num text-slate-200">{bufferPct}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800 ring-1 ring-slate-700">
            <div
              className={`h-full transition-all duration-200 ${bufferBarColor}`}
              style={{ width: `${bufferPct}%` }}
            />
          </div>
        </div>

        {/* Buyer Strikes */}
        <div className="flex flex-col">
          <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
            Buyer Strikes
          </span>
          <span className="font-mono-num text-lg font-bold leading-tight text-rose-400">
            {state.delayStrikes}
            <span className="text-slate-500">/{state.maxDelayStrikes}</span>
          </span>
        </div>

        {/* Day Counter */}
        <div className="flex flex-col">
          <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
            Season Day
          </span>
          <span className="font-mono-num text-lg font-bold leading-tight text-slate-100">
            {Math.floor(state.day)}
            <span className="text-slate-500">/{state.maxDays}</span>
          </span>
        </div>

        {/* Player Disruption Points */}
        <div className="flex items-center gap-2 rounded-lg bg-violet-500/10 px-3 py-1 ring-1 ring-violet-400/30">
          <Zap className="h-4 w-4 text-violet-400" />
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold tracking-wider text-violet-300 uppercase">
              Disruption Pts
            </span>
            <span className="font-mono-num text-sm font-bold text-violet-200">
              {Math.floor(state.disruptionPoints)}
              <span className="text-violet-400/70">/{state.maxDisruptionPoints}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Speed Controls + Reset */}
      <div className="flex items-center gap-2">
        <div className="flex items-center rounded-lg bg-slate-900 p-0.5 ring-1 ring-slate-700/80">
          <button
            onClick={() => onSetSpeed(0)}
            title="Pause"
            className={`rounded-md p-1.5 transition ${
              state.speed === 0
                ? 'bg-amber-500/25 text-amber-300 ring-1 ring-amber-400/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Pause className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onSetSpeed(1)}
            title="1x Speed"
            className={`flex items-center gap-0.5 rounded-md px-2 py-1 text-xs font-semibold transition ${
              state.speed === 1
                ? 'bg-cyan-500/25 text-cyan-300 ring-1 ring-cyan-400/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Play className="h-3 w-3" />
            1x
          </button>
          <button
            onClick={() => onSetSpeed(2)}
            title="2x Speed"
            className={`flex items-center gap-0.5 rounded-md px-2 py-1 text-xs font-semibold transition ${
              state.speed === 2
                ? 'bg-cyan-500/25 text-cyan-300 ring-1 ring-cyan-400/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FastForward className="h-3 w-3" />
            2x
          </button>
          <button
            onClick={() => onSetSpeed(3)}
            title="3x Speed"
            className={`flex items-center gap-0.5 rounded-md px-2 py-1 text-xs font-semibold transition ${
              state.speed === 3
                ? 'bg-cyan-500/25 text-cyan-300 ring-1 ring-cyan-400/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="h-3 w-3" />
            3x
          </button>
        </div>

        <button
          onClick={onReset}
          title="Restart Match"
          className="rounded-lg bg-slate-800/80 p-2 text-slate-300 ring-1 ring-slate-700 transition hover:bg-slate-700 hover:text-white"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>
    </header>
  );
}
