import { AlertTriangle, Flame, Plane, Ship, ThermometerSnowflake } from 'lucide-react';
import { DISRUPTION_CARDS } from '../engine/config';
import { hasDisruption } from '../engine/simulation';
import { CardId, GameState, SpeciesId, TargetType } from '../engine/types';

interface BufferPipelinePanelProps {
  state: GameState;
  selectedCard: CardId | null;
  onTargetClick: (targetType: TargetType, targetId: string) => void;
}

export function BufferPipelinePanel({
  state,
  selectedCard,
  onTargetClick,
}: BufferPipelinePanelProps) {
  const armedCard = DISRUPTION_CARDS.find((c) => c.id === selectedCard) ?? null;
  const isTargetable = (t: TargetType) => armedCard?.targetType === t;

  return (
    <div className="grid h-full grid-cols-1 gap-4 overflow-y-auto lg:grid-cols-3">
      {/* Column 1: Buffer Storage Tanks */}
      <div className="flex flex-col rounded-xl border border-slate-800/90 bg-[#0b1526]/90 p-3.5">
        <div className="mb-3 flex items-center justify-between border-b border-slate-800 pb-2">
          <h2 className="text-xs font-bold tracking-wider text-slate-200 uppercase">
            Buffer Storage
          </h2>
          <span className="text-[11px] text-slate-400">Cold-Room Inventory</span>
        </div>

        <div className="flex flex-col gap-3">
          {(Object.values(state.buffers) as GameState['buffers'][SpeciesId][]).map((tank) => {
            const pct = Math.round((tank.currentTons / tank.maxTons) * 100);
            const isStockout = tank.currentTons <= 0.1;
            const isCritical = tank.currentTons <= tank.criticalThresholdTons;
            const compressorFault = hasDisruption(
              state.activeDisruptions,
              'compressor_failure',
              tank.species
            );
            const targetable = isTargetable('buffer');

            const statusLabel = isStockout
              ? 'STOCKOUT!'
              : isCritical
                ? 'CRITICAL'
                : pct < 50
                  ? 'LOW'
                  : 'HEALTHY';

            const barColor = isStockout
              ? 'bg-rose-600'
              : isCritical
                ? 'bg-rose-500'
                : pct < 50
                  ? 'bg-amber-400'
                  : 'bg-cyan-400';

            return (
              <div
                key={tank.species}
                onClick={() => targetable && onTargetClick('buffer', tank.species)}
                className={`rounded-xl border p-3 transition ${
                  targetable
                    ? 'cursor-pointer border-purple-400 bg-purple-950/25 ring-1 ring-purple-400/50 hover:bg-purple-950/40'
                    : isStockout
                      ? 'border-rose-500/70 bg-rose-950/25'
                      : 'border-slate-800 bg-slate-900/75'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-100">{tank.name}</span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-extrabold tracking-wide ${
                      isStockout || isCritical
                        ? 'bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/40'
                        : pct < 50
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    {statusLabel}
                  </span>
                </div>

                <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-slate-950 ring-1 ring-slate-800">
                  <div
                    className={`h-full transition-all duration-200 ${barColor}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="mt-1.5 flex items-center justify-between text-xs text-slate-400">
                  <span className="font-mono-num">
                    {tank.currentTons.toFixed(1)}t / {tank.maxTons}t ({pct}%)
                  </span>
                  {compressorFault && (
                    <span className="flex items-center gap-1 font-semibold text-purple-300">
                      <Flame className="h-3.5 w-3.5" /> Spoiling
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Column 2: Supply Pipeline (Live Conveyor) */}
      <div className="flex flex-col rounded-xl border border-slate-800/90 bg-[#0b1526]/90 p-3.5">
        <div className="mb-3 flex items-center justify-between border-b border-slate-800 pb-2">
          <h2 className="text-xs font-bold tracking-wider text-slate-200 uppercase">
            Supply Pipeline
          </h2>
          <span className="text-[11px] text-slate-400">
            {state.shipments.length} Active Shipments
          </span>
        </div>

        <div className="flex flex-col gap-2.5 overflow-y-auto">
          {state.shipments.length === 0 ? (
            <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-slate-800 text-xs text-slate-500">
              No active shipments in transit
            </div>
          ) : (
            state.shipments.map((ship) => {
              const origin = state.origins.find((o) => o.id === ship.originId);
              const etaDays = Math.max(0.1, (1 - ship.progress) * ship.totalDays);
              const targetable = isTargetable('shipment');

              return (
                <div
                  key={ship.id}
                  onClick={() => targetable && onTargetClick('shipment', ship.id)}
                  className={`rounded-xl border p-3 transition ${
                    targetable
                      ? 'cursor-pointer border-sky-400 bg-sky-950/30 ring-1 ring-sky-400/50 hover:bg-sky-950/50'
                      : ship.delayed || ship.spoiled
                        ? 'border-rose-500/50 bg-rose-950/20'
                        : 'border-slate-800 bg-slate-900/75'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {ship.mode === 'air' ? (
                        <Plane className="h-4 w-4 text-amber-400" />
                      ) : (
                        <Ship className="h-4 w-4 text-cyan-400" />
                      )}
                      <div>
                        <div className="text-xs font-bold text-slate-100">{ship.vesselName}</div>
                        <div className="text-[10px] text-slate-400">
                          {origin?.region} • {ship.tons.toFixed(1)}t {ship.species.toUpperCase()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {ship.spoiled && (
                        <span className="flex items-center gap-0.5 rounded bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-bold text-rose-300">
                          <ThermometerSnowflake className="h-3 w-3" /> SPOILED
                        </span>
                      )}
                      {ship.delayed && (
                        <span className="flex items-center gap-0.5 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
                          <AlertTriangle className="h-3 w-3" /> DELAYED
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-2.5 flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-950">
                      <div
                        className={`h-full transition-all duration-200 ${
                          ship.delayed
                            ? 'bg-rose-500'
                            : ship.mode === 'air'
                              ? 'bg-amber-400'
                              : 'bg-cyan-400'
                        }`}
                        style={{ width: `${Math.round(ship.progress * 100)}%` }}
                      />
                    </div>
                    <span className="font-mono-num text-[11px] font-semibold text-slate-300">
                      ETA {etaDays.toFixed(1)}d
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Column 3: End Buyer Contracts */}
      <div className="flex flex-col rounded-xl border border-slate-800/90 bg-[#0b1526]/90 p-3.5">
        <div className="mb-3 flex items-center justify-between border-b border-slate-800 pb-2">
          <h2 className="text-xs font-bold tracking-wider text-slate-200 uppercase">
            End Buyer Contracts
          </h2>
          <span className="text-[11px] text-slate-400">Daily Demand & SLA</span>
        </div>

        <div className="flex flex-col gap-3">
          {state.buyers.map((buyer) => {
            const targetable = isTargetable('buyer');
            const surge = hasDisruption(state.activeDisruptions, 'viral_trend', buyer.id);

            return (
              <div
                key={buyer.id}
                onClick={() => targetable && onTargetClick('buyer', buyer.id)}
                className={`relative overflow-hidden rounded-xl border p-3 transition ${
                  targetable
                    ? 'cursor-pointer border-pink-400 bg-pink-950/25 ring-1 ring-pink-400/50 hover:bg-pink-950/40'
                    : buyer.isDelayed
                      ? 'border-rose-500/70 bg-rose-950/25'
                      : 'border-slate-800 bg-slate-900/75'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-100">{buyer.name}</span>
                  <div className="flex items-center gap-1.5">
                    {surge && (
                      <span className="rounded bg-pink-500/20 px-1.5 py-0.5 text-[10px] font-bold text-pink-300">
                        2x DEMAND
                      </span>
                    )}
                    {buyer.isDelayed && (
                      <span className="rounded border border-rose-400/60 bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-black tracking-wider text-rose-300">
                        DELAYED
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-1.5 flex flex-wrap gap-2 text-[11px] text-slate-400">
                  {Object.entries(buyer.demands).map(([sp, rate]) => (
                    <span
                      key={sp}
                      className="rounded bg-slate-950/80 px-2 py-0.5 font-mono-num text-slate-300"
                    >
                      {sp.toUpperCase()}: {((rate ?? 0) * (surge ? 2 : 1)).toFixed(1)}t/d
                    </span>
                  ))}
                </div>

                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Buyer Patience</span>
                    <span className="font-mono-num font-bold text-slate-200">
                      {Math.round(buyer.patience)}%
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-950">
                    <div
                      className={`h-full transition-all duration-200 ${
                        buyer.patience > 60
                          ? 'bg-emerald-400'
                          : buyer.patience > 30
                            ? 'bg-amber-400'
                            : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.round(buyer.patience)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
