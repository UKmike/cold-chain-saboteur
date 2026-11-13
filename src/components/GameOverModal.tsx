import { RotateCcw, ShieldAlert, Trophy } from 'lucide-react';
import { GameState } from '../engine/types';

interface GameOverModalProps {
  state: GameState;
  onRestart: () => void;
}

export function GameOverModal({ state, onRestart }: GameOverModalProps) {
  if (state.status === 'playing') return null;

  const playerWon = state.status === 'player_won';
  const subtitle =
    state.winReason === 'delay_strikes'
      ? 'You forced 5 critical End-Buyer contract breaches!'
      : state.winReason === 'broker_bankrupt'
        ? 'Emergency air-freight & SLA penalties bankrupted the Broker!'
        : 'The Broker survived the 60-day season with buffers intact.';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#0d192e] p-6 text-center shadow-2xl">
        <div
          className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${
            playerWon
              ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-400/40'
              : 'bg-rose-500/20 text-rose-400 ring-1 ring-rose-400/40'
          }`}
        >
          {playerWon ? <Trophy className="h-7 w-7" /> : <ShieldAlert className="h-7 w-7" />}
        </div>

        <h2 className="text-2xl font-extrabold text-white">
          {playerWon ? 'Supply Chain Shattered!' : 'Broker Held the Line'}
        </h2>
        <p className="mt-2 text-sm text-slate-300">{subtitle}</p>

        <div className="mt-5 grid grid-cols-3 gap-2 rounded-xl bg-slate-900/90 p-3 ring-1 ring-slate-800">
          <div>
            <div className="text-[10px] text-slate-400 uppercase">Day</div>
            <div className="font-mono-num text-base font-bold text-white">
              {Math.floor(state.day)}/{state.maxDays}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase">Strikes</div>
            <div className="font-mono-num text-base font-bold text-rose-400">
              {state.delayStrikes}/{state.maxDelayStrikes}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase">Broker Cash</div>
            <div className="font-mono-num text-base font-bold text-emerald-400">
              ${Math.round(state.brokerCash)}k
            </div>
          </div>
        </div>

        <button
          onClick={onRestart}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-400"
        >
          <RotateCcw className="h-4 w-4" />
          Play Again
        </button>
      </div>
    </div>
  );
}
