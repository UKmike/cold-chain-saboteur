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
    <section className="pointer-events-none fixed inset-x-0 bottom-0 z-20 px-2 pb-2 sm:px-3 sm:pb-3">
      {armedCard && (
        <div className="pointer-events-auto mx-auto mb-2 flex w-max max-w-[94vw] items-center gap-2 rounded-full border border-cyan-400/50 bg-slate-950/90 px-3 py-1 text-xs text-cyan-200 shadow-lg backdrop-blur-md">
          <span className="truncate">
            <strong className="uppercase tracking-wide text-cyan-300">
              {armedCard.name}:
            </strong>{' '}
            {TARGET_HINTS[armedCard.targetType]}
          </span>
          <button
            onClick={() => onSelectCard(null)}
            className="flex min-h-[26px] shrink-0 items-center gap-1 rounded-full bg-slate-800 px-2.5 py-0.5 text-[11px] font-semibold text-slate-100 active:bg-slate-700 touch-manipulation"
          >
            <X className="h-3.5 w-3.5" />
            Cancel
          </button>
        </div>
      )}

      <div className="pointer-events-auto mx-auto flex max-w-5xl snap-x snap-mandatory gap-1.5 overflow-x-auto pb-0.5 md:grid md:grid-cols-6 md:gap-2 md:overflow-visible md:pb-0">
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
              className={`group relative flex min-w-[110px] shrink-0 snap-start flex-col justify-between rounded-xl border p-2 text-left backdrop-blur-md transition-all touch-manipulation md:min-w-0 ${
                isSelected
                  ? 'border-cyan-400 bg-slate-900/90 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/50'
                  : isDisabled
                    ? 'cursor-not-allowed border-slate-800/70 bg-slate-950/55 opacity-50'
                    : 'border-slate-700/70 bg-slate-950/75 active:scale-95 hover:border-slate-500 hover:bg-slate-900/85'
              }`}
            >
              <div className="flex items-start justify-between gap-1.5">
                <div
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md sm:h-7 sm:w-7 sm:rounded-lg"
                  style={{ backgroundColor: `${card.accentColor}22`, color: card.accentColor }}
                >
                  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </div>
                <span className="font-mono-num rounded-md bg-slate-950/90 px-1.5 py-0.5 text-[10px] font-bold text-violet-300 ring-1 ring-violet-500/30">
                  {card.cost} DP
                </span>
              </div>

              <div className="mt-1.5">
                <div className="truncate text-[11px] font-bold text-slate-100 sm:text-xs">
                  {card.name}
                </div>
                <p className="mt-0.5 hidden line-clamp-2 text-[10px] leading-snug text-slate-400 lg:block">
                  {card.shortDesc}
                </p>
              </div>

              {cooldown > 0 && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-slate-950/75 backdrop-blur-[1px]">
                  <span className="font-mono-num rounded-md bg-slate-900 px-2 py-0.5 text-xs font-bold text-amber-300 ring-1 ring-amber-400/30">
                    {Math.ceil(cooldown)}d
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
