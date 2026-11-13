export type SpeciesId = 'salmon' | 'shrimp' | 'tuna' | 'crab';

export type TransportMode = 'sea' | 'air';

export type TargetType = 'origin' | 'shipment' | 'hub' | 'buffer' | 'buyer';

export type CardId =
  | 'port_strike'
  | 'reefer_failure'
  | 'algae_bloom'
  | 'customs_hold'
  | 'compressor_failure'
  | 'viral_trend';

export interface MapPoint {
  x: number;
  y: number;
}

export interface Origin {
  id: string;
  name: string;
  region: string;
  species: SpeciesId;
  pos: MapPoint;
  seaDays: number;
  airDays: number;
  seaCost: number;
  airCost: number;
  batchSize: number;
}

export interface BufferTank {
  species: SpeciesId;
  name: string;
  color: string;
  currentTons: number;
  maxTons: number;
  safetyThresholdTons: number;
  criticalThresholdTons: number;
}

export interface Shipment {
  id: string;
  originId: string;
  species: SpeciesId;
  mode: TransportMode;
  tons: number;
  progress: number; // 0 to 1
  totalDays: number;
  delayed: boolean;
  spoiled: boolean;
  vesselName: string;
}

export interface EndBuyer {
  id: string;
  name: string;
  pos: MapPoint;
  demands: Partial<Record<SpeciesId, number>>; // tons per day
  patience: number; // 0 to 100
  isDelayed: boolean;
  delayCount: number;
}

export interface ActiveDisruption {
  id: string;
  cardId: CardId;
  name: string;
  targetType: TargetType;
  targetId: string; // originId, shipmentId, 'hub', speciesId, or buyerId
  remainingDays: number;
  totalDays: number;
}

export interface DisruptionCard {
  id: CardId;
  name: string;
  cost: number;
  durationDays: number;
  cooldownDays: number;
  targetType: TargetType;
  shortDesc: string;
  accentColor: string;
}

export interface LogEvent {
  id: string;
  day: number;
  kind: 'player' | 'broker' | 'alert' | 'strike';
  message: string;
}

export type GameStatus = 'playing' | 'player_won' | 'broker_won';

export type WinReason = 'delay_strikes' | 'broker_bankrupt' | 'season_survived' | null;

export interface GameState {
  day: number;
  maxDays: number;
  speed: 0 | 1 | 2 | 3; // 0 = paused
  status: GameStatus;
  winReason: WinReason;
  brokerCash: number;
  delayStrikes: number;
  maxDelayStrikes: number;
  disruptionPoints: number;
  maxDisruptionPoints: number;
  dpPerDay: number;
  origins: Origin[];
  buffers: Record<SpeciesId, BufferTank>;
  shipments: Shipment[];
  buyers: EndBuyer[];
  activeDisruptions: ActiveDisruption[];
  cardCooldowns: Record<CardId, number>;
  logs: LogEvent[];
  nextId: number;
}
