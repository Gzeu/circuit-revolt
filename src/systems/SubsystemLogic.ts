import type { Condition, SubsystemDef, SubsystemState, SubsystemStatus } from '../types';

export class SubsystemLogic {
  constructor(private readonly def: SubsystemDef) {}

  evaluate(state: SubsystemState): SubsystemStatus {
    if (state.status === 'shutdown') {
      return 'shutdown';
    }

    const matches = this.def.rule.conditions.some(group =>
      group.every(condition => SubsystemLogic.evaluateCondition(condition, state)),
    );

    return matches ? 'overloaded' : 'active';
  }

  isExitConditionMet(state: SubsystemState): boolean {
    return SubsystemLogic.evaluateCondition(
      {
        field: this.def.exitCondition.field,
        operator: this.def.exitCondition.operator as Condition['operator'],
        value: this.def.exitCondition.value,
      },
      state,
    );
  }

  applyRoute(state: SubsystemState, junctionId: string, newColor: string): SubsystemState {
    const junctionBoost = junctionId.length % 7;
    const nextLoad = Math.max(0, state.load - (18 + junctionBoost));
    const projectedState = {
      ...state,
      load: nextLoad,
      coolant: true,
      routedColor: newColor,
    };
    const nextStatus = this.isExitConditionMet(projectedState) ? 'shutdown' : this.evaluate(projectedState);

    return {
      ...projectedState,
      status: nextStatus,
    };
  }

  static evaluateCondition(condition: Condition, state: SubsystemState): boolean {
    const value = state[condition.field as keyof SubsystemState];

    switch (condition.operator) {
      case '<':
        return Number(value) < Number(condition.value);
      case '>':
        return Number(value) > Number(condition.value);
      case '==':
        return value === condition.value;
      case '!=':
        return value !== condition.value;
      default:
        return false;
    }
  }
}
