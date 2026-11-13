import { DISRUPTION_CARDS, HUB_POS } from '../engine/config';
import { getAggregateBufferPercent, hasDisruption } from '../engine/simulation';
import { CardId, GameState, MapPoint, TargetType } from '../engine/types';

interface WorldMapProps {
  state: GameState;
  selectedCard: CardId | null;
  onTargetClick: (targetType: TargetType, targetId: string) => void;
}

function getControlPoint(from: MapPoint, to: MapPoint, mode: 'sea' | 'air'): MapPoint {
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const offset = mode === 'air' ? -45 : 42;
  return {
    x: midX,
    y: midY + (dx >= 0 ? offset : -offset * 0.7),
  };
}

function pointOnQuadratic(p0: MapPoint, p1: MapPoint, p2: MapPoint, t: number): MapPoint {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
  };
}

export function WorldMap({ state, selectedCard, onTargetClick }: WorldMapProps) {
  const armedCard = DISRUPTION_CARDS.find((c) => c.id === selectedCard) ?? null;
  const hubBufferPct = getAggregateBufferPercent(state);
  const customsHeld = hasDisruption(state.activeDisruptions, 'customs_hold', 'hub');

  const isTargetable = (type: TargetType) => armedCard?.targetType === type;

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-slate-800/90 bg-[#071120] shadow-inner">
      <svg
        viewBox="0 0 1000 450"
        className="h-full w-full select-none"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <pattern id="oceanGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="#12233d"
              strokeWidth="0.7"
              opacity="0.5"
            />
          </pattern>
          <filter id="cyanGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ocean Grid */}
        <rect width="1000" height="450" fill="url(#oceanGrid)" />

        {/* Stylized Continent Silhouettes */}
        <g fill="#16243a" stroke="#253b5c" strokeWidth="1.2">
          {/* North America */}
          <path d="M 85 75 L 285 62 L 340 120 L 295 190 L 235 235 L 185 205 L 135 160 L 90 135 Z" />
          {/* South America */}
          <path d="M 235 250 L 315 268 L 348 330 L 300 415 L 258 405 L 240 325 Z" />
          {/* Europe */}
          <path d="M 455 75 L 575 62 L 605 125 L 545 155 L 470 148 L 448 115 Z" />
          {/* Africa */}
          <path d="M 465 178 L 575 175 L 615 245 L 568 370 L 508 360 L 478 265 Z" />
          {/* Asia */}
          <path d="M 590 70 L 845 78 L 895 165 L 840 240 L 740 250 L 645 220 L 595 155 Z" />
          {/* Australia */}
          <path d="M 765 305 L 860 305 L 878 368 L 790 380 L 758 345 Z" />
        </g>

        {/* Sea & Air Routes (Origins -> Hub) */}
        {state.origins.map((origin) => {
          const seaCtrl = getControlPoint(origin.pos, HUB_POS, 'sea');
          const airCtrl = getControlPoint(origin.pos, HUB_POS, 'air');
          const seaBlocked =
            hasDisruption(state.activeDisruptions, 'port_strike', origin.id) ||
            hasDisruption(state.activeDisruptions, 'algae_bloom', origin.id);
          const hasAir = state.shipments.some(
            (s) => s.originId === origin.id && s.mode === 'air'
          );

          return (
            <g key={`route-${origin.id}`}>
              {/* Sea Route */}
              <path
                d={`M ${origin.pos.x} ${origin.pos.y} Q ${seaCtrl.x} ${seaCtrl.y} ${HUB_POS.x} ${HUB_POS.y}`}
                fill="none"
                stroke={seaBlocked ? '#ef4444' : '#22d3ee'}
                strokeWidth={seaBlocked ? 2.2 : 2}
                strokeDasharray="6 6"
                className={seaBlocked ? '' : 'animate-sea-flow'}
                opacity={seaBlocked ? 0.65 : 0.75}
                filter={seaBlocked ? undefined : 'url(#cyanGlow)'}
              />

              {/* Air Route (shown when active or faint guide) */}
              <path
                d={`M ${origin.pos.x} ${origin.pos.y} Q ${airCtrl.x} ${airCtrl.y} ${HUB_POS.x} ${HUB_POS.y}`}
                fill="none"
                stroke="#fbbf24"
                strokeWidth={hasAir ? 2 : 1}
                strokeDasharray="3 5"
                className={hasAir ? 'animate-air-flow' : ''}
                opacity={hasAir ? 0.85 : 0.18}
              />
            </g>
          );
        })}

        {/* End Buyer Supply Lines (Hub -> Buyers) */}
        {state.buyers.map((buyer) => (
          <line
            key={`buyer-line-${buyer.id}`}
            x1={HUB_POS.x}
            y1={HUB_POS.y}
            x2={buyer.pos.x}
            y2={buyer.pos.y}
            stroke={buyer.isDelayed ? '#f43f5e' : '#34d399'}
            strokeWidth={2.2}
            strokeDasharray={buyer.isDelayed ? '4 4' : undefined}
            opacity={0.75}
          />
        ))}

        {/* Moving Shipments */}
        {state.shipments.map((ship) => {
          const origin = state.origins.find((o) => o.id === ship.originId);
          if (!origin) return null;
          const ctrl = getControlPoint(origin.pos, HUB_POS, ship.mode);
          const pos = pointOnQuadratic(origin.pos, ctrl, HUB_POS, ship.progress);
          const targetable = isTargetable('shipment');

          return (
            <g
              key={ship.id}
              transform={`translate(${pos.x}, ${pos.y})`}
              onClick={() => targetable && onTargetClick('shipment', ship.id)}
              className={targetable ? 'cursor-pointer touch-manipulation' : ''}
            >
              {targetable && (
                <>
                  <circle r={26} fill="transparent" />
                  <circle
                    r={16}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    strokeDasharray="3 2"
                    className="animate-hazard-pulse"
                  />
                </>
              )}
              <circle
                r={8}
                fill={ship.spoiled ? '#ef4444' : ship.mode === 'air' ? '#f59e0b' : '#0ea5e9'}
                stroke="#071120"
                strokeWidth={2}
              />
              <text
                y={-12}
                textAnchor="middle"
                className="fill-slate-200 text-[9px] font-bold"
              >
                {ship.mode === 'air' ? '✈' : '🚢'} {ship.tons.toFixed(0)}t
              </text>
            </g>
          );
        })}

        {/* Origin Nodes */}
        {state.origins.map((origin) => {
          const portStrike = hasDisruption(state.activeDisruptions, 'port_strike', origin.id);
          const algae = hasDisruption(state.activeDisruptions, 'algae_bloom', origin.id);
          const disrupted = portStrike || algae;
          const targetable = isTargetable('origin');

          return (
            <g
              key={origin.id}
              transform={`translate(${origin.pos.x}, ${origin.pos.y})`}
              onClick={() => targetable && onTargetClick('origin', origin.id)}
              className={targetable ? 'cursor-pointer touch-manipulation' : ''}
            >
              {targetable && (
                <>
                  <circle r={32} fill="transparent" />
                  <circle
                    r={24}
                    fill="rgba(34, 211, 238, 0.14)"
                    stroke="#22d3ee"
                    strokeWidth={2}
                    strokeDasharray="4 3"
                    className="animate-hazard-pulse"
                  />
                </>
              )}
              <circle
                r={15}
                fill={disrupted ? '#45121b' : '#0d223d'}
                stroke={disrupted ? '#ef4444' : '#38bdf8'}
                strokeWidth={2.2}
              />
              <text y={4} textAnchor="middle" className="fill-slate-100 text-[10px] font-bold">
                {origin.species.slice(0, 3).toUpperCase()}
              </text>
              <text y={28} textAnchor="middle" className="fill-slate-200 text-[11px] font-semibold">
                {origin.region}
              </text>
              {disrupted && (
                <g transform="translate(13, -13)">
                  <circle r={8} fill="#ef4444" />
                  <text y={3} textAnchor="middle" className="fill-white text-[10px] font-bold">
                    !
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Central Cold-Storage Hub */}
        <g
          transform={`translate(${HUB_POS.x}, ${HUB_POS.y})`}
          onClick={() => isTargetable('hub') && onTargetClick('hub', 'hub')}
          className={isTargetable('hub') ? 'cursor-pointer touch-manipulation' : ''}
        >
          {isTargetable('hub') && (
            <>
              <circle r={38} fill="transparent" />
              <circle
                r={32}
                fill="rgba(245, 158, 11, 0.18)"
                stroke="#fbbf24"
                strokeWidth={2.2}
                strokeDasharray="4 3"
                className="animate-hazard-pulse"
              />
            </>
          )}
          <circle
            r={22}
            fill={customsHeld ? '#422006' : '#0f2942'}
            stroke={customsHeld ? '#f59e0b' : '#22d3ee'}
            strokeWidth={2.5}
          />
          <text y={-2} textAnchor="middle" className="fill-cyan-300 text-[9px] font-bold uppercase">
            HUB
          </text>
          <text y={10} textAnchor="middle" className="fill-white text-[11px] font-bold">
            {hubBufferPct}%
          </text>
          <text y={35} textAnchor="middle" className="fill-slate-300 text-[10px] font-semibold">
            Cold-Storage Hub
          </text>
          {customsHeld && (
            <text y={-28} textAnchor="middle" className="fill-amber-400 text-[10px] font-bold">
              ⚠ CUSTOMS HOLD
            </text>
          )}
        </g>

        {/* End Buyer Nodes */}
        {state.buyers.map((buyer) => {
          const surge = hasDisruption(state.activeDisruptions, 'viral_trend', buyer.id);
          const targetable = isTargetable('buyer');

          return (
            <g
              key={buyer.id}
              transform={`translate(${buyer.pos.x}, ${buyer.pos.y})`}
              onClick={() => targetable && onTargetClick('buyer', buyer.id)}
              className={targetable ? 'cursor-pointer touch-manipulation' : ''}
            >
              {targetable && (
                <>
                  <circle r={32} fill="transparent" />
                  <circle
                    r={24}
                    fill="rgba(236, 72, 153, 0.16)"
                    stroke="#ec4899"
                    strokeWidth={2}
                    strokeDasharray="4 3"
                    className="animate-hazard-pulse"
                  />
                </>
              )}
              <rect
                x={-16}
                y={-16}
                width={32}
                height={32}
                rx={8}
                fill={buyer.isDelayed ? '#4c0519' : '#0d2b26'}
                stroke={buyer.isDelayed ? '#f43f5e' : '#34d399'}
                strokeWidth={2}
              />
              <text y={4} textAnchor="middle" className="fill-white text-[10px] font-bold">
                {Math.round(buyer.patience)}%
              </text>
              <text y={29} textAnchor="middle" className="fill-slate-200 text-[11px] font-semibold">
                {buyer.name}
              </text>
              {buyer.isDelayed && (
                <text y={-22} textAnchor="middle" className="fill-rose-400 text-[10px] font-extrabold">
                  DELAYED!
                </text>
              )}
              {!buyer.isDelayed && surge && (
                <text y={-22} textAnchor="middle" className="fill-pink-400 text-[10px] font-bold">
                  2x DEMAND
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Map Legend */}
      <div className="pointer-events-none absolute bottom-3 left-3 flex flex-wrap gap-3 rounded-lg bg-slate-950/80 px-3 py-1.5 text-[11px] text-slate-300 ring-1 ring-slate-800">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-4 rounded-full bg-cyan-400" /> Sea Freight
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-4 rounded-full bg-amber-400" /> Air Cargo
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-4 rounded-full bg-emerald-400" /> Buyer Supply
        </span>
      </div>
    </div>
  );
}
