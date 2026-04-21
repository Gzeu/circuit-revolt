export type Point = {
  x: number;
  y: number;
};

export type Condition = {
  field: string;
  operator: '<' | '>' | '==' | '!=';
  value: number | boolean;
};

export type SubsystemDef = {
  id: string;
  name: string;
  rule: {
    conditions: Condition[][];
    interval: number;
  };
  exitCondition: {
    field: string;
    operator: string;
    value: number;
  };
  pathPoints: Point[];
  color: string;
};

export type MachineDef = {
  id: string;
  name: string;
  subsystems: SubsystemDef[];
};

export type SubsystemStatus = 'active' | 'overloaded' | 'shutdown';

export type SubsystemState = {
  id: string;
  status: SubsystemStatus;
  load: number;
  coolant: boolean;
  routedColor?: string;
};

export type GameState = {
  subsystems: Record<string, SubsystemState>;
  meltdownProgress: number;
  playerHits: number;
};

export interface RunStats {
  floorsCleared: number;
  totalHits: number;
  routeActions: number;
  elapsedMs: number;
}
