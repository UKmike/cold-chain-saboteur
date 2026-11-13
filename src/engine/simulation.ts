import { DISRUPTION_CARDS, VESSEL_NAMES } from './config';
import {
  ActiveDisruption,
  CardId,
  GameState,
  GameStatus,
  LogEvent,
  Shipment,
  SpeciesId,
  TransportMode,
} from './types';

function addLog(
  logs: LogEvent[],
  day: number,
  kind: LogEvent['kind'],
  message: string,
  nextId: number
): { logs: LogEvent[]; nextId: number } {
  const entry: LogEvent = {
    id: `log-${nextId}`,
    day: Math.floor(day),
    kind,
    message,
  };
  return {
    logs: [entry, ...logs].slice(0, 30),
    nextId: nextId + 1,
  };
}

export function hasDisruption(
  disruptions: ActiveDisruption[],
  cardId: CardId,
  targetId?: string
): boolean {
  return disruptions.some(
    (d) => d.cardId === cardId && (targetId === undefined || d.targetId === targetId)
  );
}

export function getAggregateBufferPercent(state: GameState): number {
  const tanks = Object.values(state.buffers);
  const totalCurrent = tanks.reduce((acc, t) => acc + t.currentTons, 0);
  const totalMax = tanks.reduce((acc, t) => acc + t.maxTons, 0);
  if (totalMax === 0) return 0;
  return Math.round((totalCurrent / totalMax) * 100);
}

export function playDisruptionCard(
  state: GameState,
  cardId: CardId,
  targetId: string
): GameState {
  if (state.status !== 'playing') return state;

  const card = DISRUPTION_CARDS.find((c) => c.id === cardId);
  if (!card) return state;

  if (state.disruptionPoints < card.cost) return state;
  if ((state.cardCooldowns[cardId] ?? 0) > 0) return state;

  // Prevent stacking identical disruption on same target
  if (hasDisruption(state.activeDisruptions, cardId, targetId)) {
    return state;
  }

  let nextId = state.nextId;
  let logs = state.logs;
  let shipments = state.shipments;
  let targetLabel = targetId;

  if (card.targetType === 'origin') {
    const origin = state.origins.find((o) => o.id === targetId);
    if (!origin) return state;
    targetLabel = origin.region;
  } else if (card.targetType === 'buffer') {
    const tank = state.buffers[targetId as SpeciesId];
    if (!tank) return state;
    targetLabel = tank.name;
  } else if (card.targetType === 'buyer') {
    const buyer = state.buyers.find((b) => b.id === targetId);
    if (!buyer) return state;
    targetLabel = buyer.name;
  } else if (card.targetType === 'hub') {
    targetLabel = 'Central Hub';
  } else if (card.targetType === 'shipment') {
    const ship = state.shipments.find((s) => s.id === targetId);
    if (!ship) return state;
    targetLabel = ship.vesselName;
    // Immediate spoilage & delay on targeted shipment
    shipments = state.shipments.map((s) =>
      s.id === targetId
        ? {
            ...s,
            tons: Math.max(1, Math.round(s.tons * 0.55 * 10) / 10),
            spoiled: true,
            delayed: true,
          }
        : s
    );
  }

  const newDisruption: ActiveDisruption = {
    id: `dis-${nextId}`,
    cardId: card.id,
    name: card.name,
    targetType: card.targetType,
    targetId,
    remainingDays: card.durationDays,
    totalDays: card.durationDays,
  };
  nextId += 1;

  const logRes = addLog(
    logs,
    state.day,
    'player',
    `${card.name} triggered on ${targetLabel} (${card.durationDays}d).`,
    nextId
  );
  logs = logRes.logs;
  nextId = logRes.nextId;

  return {
    ...state,
    disruptionPoints: state.disruptionPoints - card.cost,
    shipments,
    activeDisruptions: [...state.activeDisruptions, newDisruption],
    cardCooldowns: {
      ...state.cardCooldowns,
      [cardId]: card.cooldownDays,
    },
    logs,
    nextId,
  };
}

export function stepSimulation(state: GameState, deltaDays: number): GameState {
  if (state.status !== 'playing' || deltaDays <= 0) return state;

  let nextId = state.nextId;
  let logs = state.logs;
  const prevDayInt = Math.floor(state.day);
  const newDay = Math.min(state.maxDays, state.day + deltaDays);
  const newDayInt = Math.floor(newDay);

  // 1. Regenerate Disruption Points & tick cooldowns
  const disruptionPoints = Math.min(
    state.maxDisruptionPoints,
    state.disruptionPoints + state.dpPerDay * deltaDays
  );

  const cardCooldowns = { ...state.cardCooldowns };
  (Object.keys(cardCooldowns) as CardId[]).forEach((k) => {
    cardCooldowns[k] = Math.max(0, cardCooldowns[k] - deltaDays);
  });

  // 2. Tick Active Disruptions
  const activeDisruptions: ActiveDisruption[] = [];
  for (const d of state.activeDisruptions) {
    const remaining = d.remainingDays - deltaDays;
    if (remaining > 0) {
      activeDisruptions.push({ ...d, remainingDays: remaining });
    } else {
      const logRes = addLog(logs, newDay, 'alert', `${d.name} on ${d.targetId} cleared.`, nextId);
      logs = logRes.logs;
      nextId = logRes.nextId;
    }
  }

  const customsHeld = hasDisruption(activeDisruptions, 'customs_hold', 'hub');

  // 3. Clone Buffers & Apply Compressor Failure spoilage
  const buffers = {
    salmon: { ...state.buffers.salmon },
    shrimp: { ...state.buffers.shrimp },
    tuna: { ...state.buffers.tuna },
    crab: { ...state.buffers.crab },
  };

  (Object.keys(buffers) as SpeciesId[]).forEach((sp) => {
    if (hasDisruption(activeDisruptions, 'compressor_failure', sp)) {
      const spoilAmount = buffers[sp].currentTons * 0.12 * deltaDays;
      buffers[sp].currentTons = Math.max(0, buffers[sp].currentTons - spoilAmount);
    }
  });

  // 4. Advance Shipments & Deliver to Buffers
  const remainingShipments: Shipment[] = [];
  for (const ship of state.shipments) {
    const seaBlocked =
      ship.mode === 'sea' &&
      (hasDisruption(activeDisruptions, 'port_strike', ship.originId) ||
        hasDisruption(activeDisruptions, 'algae_bloom', ship.originId));
    const reeferSlowed = hasDisruption(activeDisruptions, 'reefer_failure', ship.id);

    // If customs hold at hub and shipment is near arrival (>= 0.92), freeze it
    const heldAtCustoms = customsHeld && ship.progress >= 0.92;

    let speedFactor = 1;
    if (seaBlocked) speedFactor = 0.12; // crawls / stuck outside port
    if (reeferSlowed) speedFactor *= 0.45;
    if (heldAtCustoms) speedFactor = 0;

    const nextProgress = ship.progress + (deltaDays / ship.totalDays) * speedFactor;
    const isDelayed = seaBlocked || reeferSlowed || heldAtCustoms;

    if (nextProgress >= 1 && !heldAtCustoms) {
      const tank = buffers[ship.species];
      tank.currentTons = Math.min(tank.maxTons, tank.currentTons + ship.tons);
      const logRes = addLog(
        logs,
        newDay,
        'broker',
        `${ship.vesselName} delivered ${ship.tons.toFixed(1)}t ${tank.name} to buffer.`,
        nextId
      );
      logs = logRes.logs;
      nextId = logRes.nextId;
    } else {
      remainingShipments.push({
        ...ship,
        progress: Math.min(0.99, nextProgress),
        delayed: isDelayed,
      });
    }
  }

  // 5. End Buyer Demand & Patience / Delay Strikes
  let delayStrikes = state.delayStrikes;
  let brokerCash = state.brokerCash;
  const buyers = state.buyers.map((b) => ({ ...b, demands: { ...b.demands } }));

  for (const buyer of buyers) {
    const demandMultiplier = hasDisruption(activeDisruptions, 'viral_trend', buyer.id) ? 2.0 : 1.0;
    let missingAny = false;

    (Object.entries(buyer.demands) as [SpeciesId, number][]).forEach(([sp, dailyRate]) => {
      const needed = dailyRate * demandMultiplier * deltaDays;
      if (buffers[sp].currentTons >= needed) {
        buffers[sp].currentTons -= needed;
      } else {
        buffers[sp].currentTons = 0;
        missingAny = true;
      }
    });

    if (missingAny) {
      buyer.isDelayed = true;
      buyer.patience = Math.max(0, buyer.patience - 16 * deltaDays);
      brokerCash -= 14 * deltaDays; // SLA delay penalty

      if (buyer.patience <= 0) {
        delayStrikes += 1;
        buyer.delayCount += 1;
        buyer.patience = 65; // Buyer resets to strained state for next contract cycle
        brokerCash -= 45;
        const logRes = addLog(
          logs,
          newDay,
          'strike',
          `CONTRACT BREACH! ${buyer.name} suffered a critical stockout (${delayStrikes}/${state.maxDelayStrikes}).`,
          nextId
        );
        logs = logRes.logs;
        nextId = logRes.nextId;
      }
    } else {
      buyer.isDelayed = false;
      buyer.patience = Math.min(100, buyer.patience + 7 * deltaDays);
      brokerCash += 3.5 * deltaDays; // Steady fulfillment revenue
    }
  }

  // 6. Broker AI Replenishment (runs cleanly once per ~0.5 day or on day ticks)
  if (newDayInt > prevDayInt || Math.floor(newDay * 2) > Math.floor(state.day * 2)) {
    for (const origin of state.origins) {
      const tank = buffers[origin.species];
      const algaeBlocked = hasDisruption(activeDisruptions, 'algae_bloom', origin.id);
      if (algaeBlocked) continue;

      const seaBlocked = hasDisruption(activeDisruptions, 'port_strike', origin.id);
      const inTransit = remainingShipments.filter((s) => s.species === origin.species);
      const inTransitTons = inTransit.reduce((acc, s) => acc + s.tons, 0);
      const hasAirEnRoute = inTransit.some((s) => s.mode === 'air');
      const effectiveTons = tank.currentTons + inTransitTons;

      let chosenMode: TransportMode | null = null;

      if (
        (tank.currentTons <= tank.criticalThresholdTons || seaBlocked) &&
        effectiveTons < tank.safetyThresholdTons * 1.35 &&
        !hasAirEnRoute &&
        brokerCash >= origin.airCost
      ) {
        chosenMode = 'air';
      } else if (
        !seaBlocked &&
        effectiveTons < tank.safetyThresholdTons * 1.55 &&
        inTransit.length < 2 &&
        brokerCash >= origin.seaCost
      ) {
        chosenMode = 'sea';
      }

      if (chosenMode) {
        const cost = chosenMode === 'air' ? origin.airCost : origin.seaCost;
        const totalDays = chosenMode === 'air' ? origin.airDays : origin.seaDays;
        const tons = chosenMode === 'air' ? Math.round(origin.batchSize * 0.65) : origin.batchSize;
        const pool = VESSEL_NAMES[chosenMode];
        const vesselName = pool[nextId % pool.length];

        brokerCash -= cost;
        remainingShipments.push({
          id: `ship-${nextId}`,
          originId: origin.id,
          species: origin.species,
          mode: chosenMode,
          tons,
          progress: 0.02,
          totalDays,
          delayed: false,
          spoiled: false,
          vesselName,
        });
        nextId += 1;

        if (chosenMode === 'air') {
          const logRes = addLog(
            logs,
            newDay,
            'broker',
            `Broker chartered emergency AIR cargo (${vesselName}) from ${origin.region} (-$${cost}k).`,
            nextId
          );
          logs = logRes.logs;
          nextId = logRes.nextId;
        }
      }
    }
  }

  // 7. Evaluate Win / Loss
  let status: GameStatus = state.status;
  let winReason = state.winReason;

  if (delayStrikes >= state.maxDelayStrikes) {
    status = 'player_won';
    winReason = 'delay_strikes';
  } else if (brokerCash <= 0) {
    brokerCash = 0;
    status = 'player_won';
    winReason = 'broker_bankrupt';
  } else if (newDay >= state.maxDays) {
    status = 'broker_won';
    winReason = 'season_survived';
  }

  return {
    ...state,
    day: newDay,
    status,
    winReason,
    brokerCash: Math.round(brokerCash * 10) / 10,
    delayStrikes,
    disruptionPoints: Math.round(disruptionPoints * 10) / 10,
    buffers,
    shipments: remainingShipments,
    buyers,
    activeDisruptions,
    cardCooldowns,
    logs,
    nextId,
  };
}
