import { DISRUPTION_CARDS, HUB_POS } from '../engine/config';
import { getAggregateBufferPercent, hasDisruption } from '../engine/simulation';
import { CardId, GameState, MapPoint, TargetType } from '../engine/types';

interface WorldMapProps {
  state: GameState;
  selectedCard: CardId | null;
  onTargetClick: (targetType: TargetType, targetId: string) => void;
}

// Maritime sea-lane waypoints so ships sail through real oceans & canals instead of over land
const SEA_WAYPOINTS: Record<string, MapPoint[]> = {
  norway: [
    { x: 508, y: 92 },
    { x: 472, y: 112 },
    HUB_POS,
  ],
  alaska: [
    { x: 105, y: 112 },
    { x: 140, y: 195 },
    { x: 225, y: 235 },
    { x: 318, y: 215 },
    { x: 395, y: 175 },
    HUB_POS,
  ],
  ecuador: [
    { x: 248, y: 252 },
    { x: 256, y: 226 },
    { x: 315, y: 210 },
    { x: 395, y: 175 },
    HUB_POS,
  ],
  japan: [
    { x: 878, y: 158 },
    { x: 825, y: 235 },
    { x: 720, y: 268 },
    { x: 595, y: 235 },
    { x: 552, y: 185 },
    { x: 475, y: 178 },
    HUB_POS,
  ],
};

function getAirControlPoint(from: MapPoint, to: MapPoint): MapPoint {
  return {
    x: (from.x + to.x) / 2,
    y: Math.min(from.y, to.y) - 42,
  };
}

function pointOnQuadratic(p0: MapPoint, p1: MapPoint, p2: MapPoint, t: number): MapPoint {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
  };
}

function getPointAndAngleOnPolyline(
  pts: MapPoint[],
  t: number
): { pos: MapPoint; angleDeg: number } {
  if (pts.length < 2) return { pos: pts[0], angleDeg: 0 };
  const segLengths: number[] = [];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const dx = pts[i + 1].x - pts[i].x;
    const dy = pts[i + 1].y - pts[i].y;
    const len = Math.hypot(dx, dy);
    segLengths.push(len);
    total += len;
  }
  let targetDist = Math.max(0, Math.min(1, t)) * total;
  for (let i = 0; i < segLengths.length; i++) {
    if (targetDist <= segLengths[i] || i === segLengths.length - 1) {
      const localT = segLengths[i] === 0 ? 0 : targetDist / segLengths[i];
      const p0 = pts[i];
      const p1 = pts[i + 1];
      return {
        pos: {
          x: p0.x + (p1.x - p0.x) * localT,
          y: p0.y + (p1.y - p0.y) * localT,
        },
        angleDeg: (Math.atan2(p1.y - p0.y, p1.x - p0.x) * 180) / Math.PI,
      };
    }
    targetDist -= segLengths[i];
  }
  return { pos: pts[pts.length - 1], angleDeg: 0 };
}

function buildSmoothPolylinePath(pts: MapPoint[]): string {
  if (pts.length < 2) return '';
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const xc = (pts[i].x + pts[i + 1].x) / 2;
    const yc = (pts[i].y + pts[i + 1].y) / 2;
    d += ` Q ${pts[i].x} ${pts[i].y}, ${xc} ${yc}`;
  }
  const last = pts[pts.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
}

export function WorldMap({ state, selectedCard, onTargetClick }: WorldMapProps) {
  const armedCard = DISRUPTION_CARDS.find((c) => c.id === selectedCard) ?? null;
  const hubBufferPct = getAggregateBufferPercent(state);
  const customsHeld = hasDisruption(state.activeDisruptions, 'customs_hold', 'hub');

  const isTargetable = (type: TargetType) => armedCard?.targetType === type;

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#040c18]">
      <svg
        viewBox="0 0 1000 430"
        className="h-full w-full select-none"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Deep Ocean Radial Vignette */}
          <radialGradient id="oceanDepth" cx="50%" cy="45%" r="65%">
            <stop offset="0%" stopColor="#0b1d36" />
            <stop offset="65%" stopColor="#061224" />
            <stop offset="100%" stopColor="#030812" />
          </radialGradient>

          {/* Continent Fill */}
          <linearGradient id="landMass" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#192c47" />
            <stop offset="100%" stopColor="#0f1c30" />
          </linearGradient>

          {/* Subtle Latitude/Longitude Grid */}
          <pattern id="geoGrid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path
              d="M 50 0 L 0 0 0 50"
              fill="none"
              stroke="#173052"
              strokeWidth="0.6"
              opacity="0.45"
            />
          </pattern>

          <filter id="cyanGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="coastGlow" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="1.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ocean Background & Graticule */}
        <rect width="1000" height="430" fill="url(#oceanDepth)" />
        <rect width="1000" height="430" fill="url(#geoGrid)" />

        {/* Equator & Tropic Reference Lines */}
        <line
          x1="0"
          y1="238"
          x2="1000"
          y2="238"
          stroke="#1e3a5f"
          strokeWidth="0.8"
          strokeDasharray="4 6"
          opacity="0.55"
        />
        <line
          x1="0"
          y1="175"
          x2="1000"
          y2="175"
          stroke="#162e4d"
          strokeWidth="0.6"
          strokeDasharray="2 6"
          opacity="0.4"
        />

        {/* Hub Radar Rings */}
        <g opacity="0.22" stroke="#22d3ee" fill="none">
          <circle cx={HUB_POS.x} cy={HUB_POS.y} r={55} strokeWidth="0.7" strokeDasharray="3 4" />
          <circle cx={HUB_POS.x} cy={HUB_POS.y} r={105} strokeWidth="0.6" strokeDasharray="2 6" />
        </g>

        {/* Detailed World Continents */}
        <g
          fill="url(#landMass)"
          stroke="#2d4c75"
          strokeWidth="1.1"
          strokeLinejoin="round"
          filter="url(#coastGlow)"
        >
          {/* North America & Central America */}
          <path d="M 68 95 L 92 78 L 135 66 L 185 58 L 245 55 L 285 68 L 270 86 L 295 95 L 325 112 L 308 134 L 285 148 L 270 168 L 252 178 L 238 192 L 222 184 L 218 198 L 232 212 L 245 224 L 236 229 L 216 218 L 195 198 L 178 176 L 165 154 L 146 142 L 135 128 L 108 122 L 82 115 Z" />

          {/* Greenland */}
          <path d="M 328 34 L 378 28 L 395 48 L 374 78 L 342 84 L 325 62 Z" />

          {/* Caribbean Islands */}
          <path d="M 255 198 L 278 196 L 285 204 L 260 205 Z" />

          {/* South America */}
          <path d="M 245 229 L 272 225 L 302 238 L 334 260 L 348 286 L 336 318 L 315 346 L 296 378 L 282 404 L 270 398 L 268 368 L 260 330 L 252 292 L 244 264 L 238 242 Z" />

          {/* UK & Ireland */}
          <path d="M 444 108 L 454 104 L 458 120 L 446 124 Z" />

          {/* Continental Europe & Scandinavia */}
          <path d="M 455 134 L 468 126 L 484 122 L 494 102 L 502 82 L 522 68 L 548 64 L 560 76 L 544 96 L 535 112 L 552 124 L 575 132 L 568 148 L 546 154 L 532 152 L 524 162 L 512 156 L 498 158 L 484 152 L 468 156 L 454 150 Z" />

          {/* Africa */}
          <path d="M 458 168 L 492 164 L 532 170 L 558 178 L 574 202 L 594 224 L 588 252 L 572 282 L 558 318 L 538 352 L 518 354 L 506 322 L 498 286 L 490 256 L 468 244 L 448 228 L 444 202 L 450 182 Z" />

          {/* Madagascar */}
          <path d="M 582 294 L 592 290 L 590 318 L 580 316 Z" />

          {/* Middle East & Asia */}
          <path d="M 562 154 L 585 148 L 605 162 L 622 182 L 605 202 L 584 198 L 572 176 Z" />
          <path d="M 560 92 L 615 72 L 690 62 L 775 64 L 855 74 L 912 92 L 902 114 L 872 126 L 852 146 L 842 172 L 818 192 L 792 208 L 775 232 L 760 226 L 748 202 L 728 198 L 704 228 L 690 224 L 675 196 L 648 188 L 625 182 L 602 156 L 575 148 L 565 126 Z" />

          {/* Japan */}
          <path d="M 868 136 L 882 130 L 886 150 L 876 168 L 864 164 L 868 148 Z" />

          {/* Southeast Asia Islands / Indonesia */}
          <path d="M 744 242 L 768 248 L 772 258 L 748 254 Z" />
          <path d="M 782 246 L 808 244 L 812 256 L 784 256 Z" />

          {/* Australia & New Zealand */}
          <path d="M 776 296 L 816 286 L 854 294 L 872 322 L 858 354 L 826 364 L 786 352 L 768 326 Z" />
          <path d="M 896 348 L 908 342 L 906 366 L 892 368 Z" />
        </g>

        {/* Sea & Air Routes (Origins -> Hub) */}
        {state.origins.map((origin) => {
          const seaPts = SEA_WAYPOINTS[origin.id] ?? [origin.pos, HUB_POS];
          const seaPath = buildSmoothPolylinePath(seaPts);
          const airCtrl = getAirControlPoint(origin.pos, HUB_POS);
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
                d={seaPath}
                fill="none"
                stroke={seaBlocked ? '#ef4444' : '#22d3ee'}
                strokeWidth={seaBlocked ? 2.2 : 1.9}
                strokeDasharray="6 6"
                className={seaBlocked ? '' : 'animate-sea-flow'}
                opacity={seaBlocked ? 0.65 : 0.72}
                filter={seaBlocked ? undefined : 'url(#cyanGlow)'}
              />

              {/* Air Route */}
              <path
                d={`M ${origin.pos.x} ${origin.pos.y} Q ${airCtrl.x} ${airCtrl.y} ${HUB_POS.x} ${HUB_POS.y}`}
                fill="none"
                stroke="#fbbf24"
                strokeWidth={hasAir ? 1.8 : 0.9}
                strokeDasharray="3 5"
                className={hasAir ? 'animate-air-flow' : ''}
                opacity={hasAir ? 0.88 : 0.16}
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
            strokeWidth={2}
            strokeDasharray={buyer.isDelayed ? '4 4' : undefined}
            opacity={0.78}
          />
        ))}

        {/* Moving Shipments (Rotated Ship & Plane SVG Silhouettes) */}
        {state.shipments.map((ship) => {
          const origin = state.origins.find((o) => o.id === ship.originId);
          if (!origin) return null;

          let pos: MapPoint;
          let angleDeg = 0;

          if (ship.mode === 'sea') {
            const pts = SEA_WAYPOINTS[origin.id] ?? [origin.pos, HUB_POS];
            const res = getPointAndAngleOnPolyline(pts, ship.progress);
            pos = res.pos;
            angleDeg = res.angleDeg;
          } else {
            const ctrl = getAirControlPoint(origin.pos, HUB_POS);
            pos = pointOnQuadratic(origin.pos, ctrl, HUB_POS, ship.progress);
            const ahead = pointOnQuadratic(
              origin.pos,
              ctrl,
              HUB_POS,
              Math.min(1, ship.progress + 0.02)
            );
            angleDeg = (Math.atan2(ahead.y - pos.y, ahead.x - pos.x) * 180) / Math.PI;
          }

          const targetable = isTargetable('shipment');
          const fill = ship.spoiled
            ? '#ef4444'
            : ship.mode === 'air'
              ? '#fbbf24'
              : '#38bdf8';

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

              {/* Rotated Vessel Icon */}
              <g transform={`rotate(${angleDeg})`}>
                {ship.mode === 'air' ? (
                  <path
                    d="M -7 -2 L 1 -2 L 4 -7 L 6 -7 L 4 -2 L 8 -2 L 10 0 L 8 2 L 4 2 L 6 7 L 4 7 L 1 2 L -7 2 L -9 4 L -10 4 L -8 0 L -10 -4 L -9 -4 Z"
                    fill={fill}
                    stroke="#040c18"
                    strokeWidth="0.9"
                  />
                ) : (
                  <path
                    d="M -8 -3.5 L 4 -3.5 L 9 0 L 4 3.5 L -8 3.5 Z"
                    fill={fill}
                    stroke="#040c18"
                    strokeWidth="1.1"
                  />
                )}
              </g>

              <text
                y={-11}
                textAnchor="middle"
                className="fill-slate-100 text-[8.5px] font-bold"
                style={{ textShadow: '0 1px 3px #000' }}
              >
                {ship.tons.toFixed(0)}t
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
                    r={23}
                    fill="rgba(34, 211, 238, 0.14)"
                    stroke="#22d3ee"
                    strokeWidth={2}
                    strokeDasharray="4 3"
                    className="animate-hazard-pulse"
                  />
                </>
              )}
              <circle
                r={14}
                fill={disrupted ? '#45121b' : '#0a1c33'}
                stroke={disrupted ? '#ef4444' : '#38bdf8'}
                strokeWidth={2}
              />
              <text y={3.5} textAnchor="middle" className="fill-slate-100 text-[9px] font-bold">
                {origin.species.slice(0, 3).toUpperCase()}
              </text>
              <text
                y={25}
                textAnchor="middle"
                className="fill-slate-200 text-[10px] font-semibold"
                style={{ textShadow: '0 1px 4px #000' }}
              >
                {origin.region}
              </text>
              {disrupted && (
                <g transform="translate(12, -12)">
                  <circle r={7.5} fill="#ef4444" />
                  <text y={3} textAnchor="middle" className="fill-white text-[9.5px] font-bold">
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
                r={30}
                fill="rgba(245, 158, 11, 0.18)"
                stroke="#fbbf24"
                strokeWidth={2.2}
                strokeDasharray="4 3"
                className="animate-hazard-pulse"
              />
            </>
          )}
          <circle
            r={20}
            fill={customsHeld ? '#422006' : '#0b223b'}
            stroke={customsHeld ? '#f59e0b' : '#22d3ee'}
            strokeWidth={2.4}
          />
          <text y={-2} textAnchor="middle" className="fill-cyan-300 text-[8.5px] font-bold uppercase">
            HUB
          </text>
          <text y={9.5} textAnchor="middle" className="fill-white text-[10.5px] font-bold">
            {hubBufferPct}%
          </text>
          <text
            y={32}
            textAnchor="middle"
            className="fill-slate-200 text-[9.5px] font-semibold"
            style={{ textShadow: '0 1px 4px #000' }}
          >
            Cold-Storage Hub
          </text>
          {customsHeld && (
            <text y={-25} textAnchor="middle" className="fill-amber-400 text-[9.5px] font-bold">
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
                    r={23}
                    fill="rgba(236, 72, 153, 0.16)"
                    stroke="#ec4899"
                    strokeWidth={2}
                    strokeDasharray="4 3"
                    className="animate-hazard-pulse"
                  />
                </>
              )}
              <rect
                x={-15}
                y={-15}
                width={30}
                height={30}
                rx={7}
                fill={buyer.isDelayed ? '#4c0519' : '#092420'}
                stroke={buyer.isDelayed ? '#f43f5e' : '#34d399'}
                strokeWidth={2}
              />
              <text y={3.5} textAnchor="middle" className="fill-white text-[9.5px] font-bold">
                {Math.round(buyer.patience)}%
              </text>
              <text
                y={26}
                textAnchor="middle"
                className="fill-slate-200 text-[10px] font-semibold"
                style={{ textShadow: '0 1px 4px #000' }}
              >
                {buyer.name}
              </text>
              {buyer.isDelayed && (
                <text y={-20} textAnchor="middle" className="fill-rose-400 text-[9.5px] font-extrabold">
                  DELAYED!
                </text>
              )}
              {!buyer.isDelayed && surge && (
                <text y={-20} textAnchor="middle" className="fill-pink-400 text-[9.5px] font-bold">
                  2x DEMAND
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
