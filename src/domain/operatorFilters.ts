import type {
  BuildingReference,
  BuildingRoomTypeId,
  Operator,
  OperatorBuildingSkill,
  ProductionFormulaTypeId,
} from "./types";

export interface OperatorFilterState {
  text: string;
  roomTypes: BuildingRoomTypeId[];
  formulaTypes: ProductionFormulaTypeId[];
  assignedOnly: boolean;
}

export interface FilteredOperator extends Operator {
  buildingSkills: OperatorBuildingSkill[];
}

export type OperatorSkillIndex = Map<string, OperatorBuildingSkill[]>;

const emptyFilters: OperatorFilterState = {
  text: "",
  roomTypes: [],
  formulaTypes: [],
  assignedOnly: false,
};

function normalizeText(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function skillMatchesOperator(skill: OperatorBuildingSkill, operator: Operator): boolean {
  return (
    skill.operatorId === operator.id ||
    skill.operatorName === operator.name ||
    operator.aliases.some((alias) => alias === skill.operatorName)
  );
}

function addSkillIndexEntry(
  index: OperatorSkillIndex,
  key: string | undefined,
  skill: OperatorBuildingSkill,
): void {
  if (!key) {
    return;
  }

  const existing = index.get(key);
  if (existing) {
    existing.push(skill);
  } else {
    index.set(key, [skill]);
  }
}

export function buildOperatorSkillIndex(reference: BuildingReference | null): OperatorSkillIndex {
  const index: OperatorSkillIndex = new Map();

  if (!reference) {
    return index;
  }

  for (const skill of reference.operatorSkills) {
    addSkillIndexEntry(index, skill.operatorId, skill);
    addSkillIndexEntry(index, skill.operatorName, skill);
  }

  return index;
}

export function getOperatorSkillList(
  operator: Operator,
  reference: BuildingReference | null,
  skillIndex: OperatorSkillIndex = buildOperatorSkillIndex(reference),
): OperatorBuildingSkill[] {
  if (!reference && skillIndex.size === 0) {
    return [];
  }

  const skills = new Map<string, OperatorBuildingSkill>();
  const addMatches = (matches: OperatorBuildingSkill[] | undefined) => {
    for (const skill of matches ?? []) {
      skills.set(skill.buffId, skill);
    }
  };

  addMatches(skillIndex.get(operator.id));
  addMatches(skillIndex.get(operator.name));
  for (const alias of operator.aliases) {
    addMatches(skillIndex.get(alias));
  }

  return [...skills.values()].filter((skill) => skillMatchesOperator(skill, operator));
}

export function filterOperators(
  operators: Operator[],
  reference: BuildingReference | null,
  filters: Partial<OperatorFilterState>,
  assignedOperatorIds: Set<string> = new Set(),
): FilteredOperator[] {
  const state = { ...emptyFilters, ...filters };
  const text = normalizeText(state.text);
  const skillIndex = buildOperatorSkillIndex(reference);

  return operators
    .map((operator) => ({
      ...operator,
      buildingSkills: getOperatorSkillList(operator, reference, skillIndex),
    }))
    .filter((operator) => {
      if (state.assignedOnly && !assignedOperatorIds.has(operator.id)) {
        return false;
      }

      if (text) {
        const haystack = [operator.name, operator.id, ...operator.aliases]
          .join(" ")
          .toLocaleLowerCase();
        if (!haystack.includes(text)) {
          return false;
        }
      }

      if (state.roomTypes.length > 0) {
        const hasRoom = operator.buildingSkills.some((skill) =>
          state.roomTypes.includes(skill.roomType),
        );
        if (!hasRoom) {
          return false;
        }
      }

      if (state.formulaTypes.length > 0) {
        const hasFormula = operator.buildingSkills.some((skill) =>
          skill.targetFormulaTypes.some((formulaType) => state.formulaTypes.includes(formulaType)),
        );
        if (!hasFormula) {
          return false;
        }
      }

      return true;
    });
}
