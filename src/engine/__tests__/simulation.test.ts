import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../config';
import { playDisruptionCard, stepSimulation } from '../simulation';

describe('ColdChain Saboteur Simulation', () => {
  it('drains buffer stock over time when end buyers consume seafood', () => {
    const initial = createInitialGameState();
    const initialSalmon = initial.buffers.salmon.currentTons;

    const next = stepSimulation(initial, 1.0);
    expect(next.buffers.salmon.currentTons).toBeLessThan(initialSalmon);
    expect(next.day).toBe(2);
  });

  it('triggers buyer delay and contract breach strike when buffer hits 0', () => {
    let state = createInitialGameState();
    state.buffers.crab.currentTons = 0;
    state.shipments = [];
    state = playDisruptionCard(state, 'algae_bloom', 'alaska');

    // Step several days so Coastal Grill runs out of crab & loses patience
    for (let i = 0; i < 8; i++) {
      state = stepSimulation(state, 1.0);
    }

    const coastalGrill = state.buyers.find((b) => b.id === 'coastal_grill');
    expect(coastalGrill).toBeDefined();
    expect(state.delayStrikes).toBeGreaterThanOrEqual(1);
  });

  it('allows playing Port Strike and forces shipment delay', () => {
    const initial = createInitialGameState();
    const afterCard = playDisruptionCard(initial, 'port_strike', 'norway');

    expect(afterCard.disruptionPoints).toBe(initial.disruptionPoints - 30);
    expect(afterCard.activeDisruptions).toHaveLength(1);
    expect(afterCard.cardCooldowns.port_strike).toBe(5);

    const afterStep = stepSimulation(afterCard, 0.5);
    const norwayShip = afterStep.shipments.find((s) => s.originId === 'norway');
    expect(norwayShip?.delayed).toBe(true);
  });

  it('spoils 45% of targeted shipment on Reefer Failure', () => {
    const initial = createInitialGameState();
    const shipBefore = initial.shipments[0];
    const afterCard = playDisruptionCard(initial, 'reefer_failure', shipBefore.id);
    const shipAfter = afterCard.shipments.find((s) => s.id === shipBefore.id);

    expect(shipAfter).toBeDefined();
    expect(shipAfter!.spoiled).toBe(true);
    expect(shipAfter!.tons).toBeLessThan(shipBefore.tons);
  });

  it('declares player victory on 5 delay strikes', () => {
    let state = createInitialGameState();
    state.delayStrikes = 4;
    state.buffers.crab.currentTons = 0;
    state.buyers = state.buyers.map((b) =>
      b.id === 'coastal_grill' ? { ...b, patience: 2 } : b
    );

    state = stepSimulation(state, 1.0);
    expect(state.status).toBe('player_won');
    expect(state.winReason).toBe('delay_strikes');
  });

  it('declares broker victory when 60 days elapse', () => {
    let state = createInitialGameState();
    state.day = 59.5;
    state = stepSimulation(state, 1.0);

    expect(state.status).toBe('broker_won');
    expect(state.winReason).toBe('season_survived');
  });
});
