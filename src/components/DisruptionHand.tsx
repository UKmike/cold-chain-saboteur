import {
  AlertTriangle,
  Biohazard,
  FileWarning,
  Flame,
  Snowflake,
  TrendingUp,
  X,
} from 'lucide-react';
import { DISRUPTION_CARDS } from '../engine/config';
import { CardId, DisruptionCard, GameState } from '../engine/types';

interface DisruptionHandProps {
  state: GameState;
  selectedCard: CardId | null;
  onSelectCard: (cardId: CardId | null) => void;
}

const CARD_ICONS: Record<CardId, typeof AlertTriangle> = {
  port_strike: AlertTriangle,
  reefer_failure: Snowflake,
  algae_bloom: Biohazard,
  customs_hold: FileWarning,
  compressor_failure: Flame,
  viral_trend: TrendingUp,
};

const TARGET_HINTS: Record<DisruptionCard['targetType'], string> = {
  origin: 'Click a glowing Origin Port on the Global Map',
  shipment: 'Click an active Ship/Plane on the Map or Supply Pipeline',
  hub: 'Click the Central Hub on the Global Map',
  buffer: 'Switch to Buffer & Pipeline and click a Seafood Tank',
  buyer: 'Click an End Buyer on the Map or Contracts panel',
};

export function DisruptionHand({
  state,
  selectedCard,
  onSelectCard,
}: DisruptionHandProps) {
  const armedCard = DISRUPTION_CARDS.find((c) => c.id === selectedCard) ?? null;

  return (
    <section className="relative shrink-0 border-t border-slate-800/90 bg-[#0b1526]/95 px-3 py-2 backdrop-blur-md">
      {armedCard && (
        <div className="absolute -top-9 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 rounded-full bg-slate-900/95 px-4 py-1 text-xs text-cyan-200 shadow-lg ring-1 ring-cyan-400/50 backdrop-blur">
          <span>
            <strong className="uppercase tracking-wide text-cyan-300">
              {armedCard.name}:
            </strong>{' '}
            {TARGET_HINTS[armedCard.targetType]}
          </span>
          <button
            onClick={() => onSelectCard(null)}
            className="flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 text-[11px] text-slate-200 hover:bg-slate-700"
          >
            <X className="h-3 w-3" />
            Cancel
          </button>
        </div>
      )}

      <div className="grid grid-cols-6 gap-2">
        {DISRUPTION_CARDS.map((card) => {
          const Icon = CARD_ICONS[card.id];
          const cooldown = state.cardCooldowns[card.id] ?? 0;
          const canAfford = state.disruptionPoints >= card.cost;
          const isDisabled = cooldown > 0 || !canAfford || state.status !== 'playing';
          const isSelected = selectedCard === card.id;

          return (
            <button
              key={card.id}
              disabled={isDisabled}
              onClick={() => onSelectCard(isSelected ? null : card.id)}
              className={`group relative flex flex-col justify-between rounded-xl border p-2.5 text-left transition-all ${
                isSelected
                  ? ' -translate-y-1 border-cyan-400 bg-slate-800/95 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/50'
                  : isDisabled
                    ? 'cursor-not-allowed border-slate-800 bg-slate-900/50 opacity-50'
                    : 'border-slate-700/80 bg-slate-900/90 hover:-translate-y-0.5 hover:border-slate-500 hover:bg-slate-800/90'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${card.accentColor}22`, color: card.accentColor }}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span className="font-mono-num rounded-md bg-slate-950/90 px-1.5 py-0.5 text-[11px] font-bold text-violet-300 ring-1 ring-violet-500/30">
                  {card.cost} DP
                </span>
              </div>

              <div className="mt-2">
                <div className="text-xs font-bold text-slate-100">{card.name}</div>
                <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-slate-400">
                  {card.shortDesc}
                </p>
              </div>

              {cooldown > 0 && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-slate-950/75 backdrop-blur-[1px]">
                  <span className="font-mono-num rounded-md bg-slate-900 px-2 py-1 text-xs font-bold text-amber-300 ring-1 ring-amber-400/30">
                    CD {Math.ceil(cooldown)}d
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
