import { createDefaultSchedule } from "../domain/createDefaultSchedule";
import type {
  BentoRoomTypeId,
  Operator,
  ProductKind,
  RoomAssignment,
  ScheduleDocument,
  SlotAssignment,
} from "../domain/types";

type MaaRoomKey =
  | "control"
  | "trading"
  | "manufacture"
  | "power"
  | "dormitory"
  | "meeting"
  | "hire"
  | "processing";

export interface MaaRoom {
  skip?: boolean;
  product?: string;
  operators?: string[];
  sort?: boolean;
  autofill?: boolean;
}

export interface MaaPlan {
  name?: string;
  description?: string;
  period?: [string, string][];
  drones?: {
    room?: string;
    index?: number;
    enable?: boolean;
    order?: string;
  };
  rooms?: Partial<Record<MaaRoomKey, MaaRoom[]>>;
}

export interface MaaCustomInfrast {
  title?: string;
  author?: string;
  description?: string;
  planTimes?: string;
  plans?: MaaPlan[];
}

export interface MaaImportReport {
  document: ScheduleDocument;
  unmatchedOperatorNames: string[];
  importedPlanCount: number;
  skippedPlanCount: number;
  dronePlanCount: number;
}

const MAX_IMPORT_PLAN_COUNT = 3;

const productMap: Record<string, ProductKind> = {
  lmd: "Money",
  "pure gold": "PureGold",
  puregold: "PureGold",
  "battle record": "CombatRecord",
  battlerecord: "CombatRecord",
  "originium shard": "OriginStone",
  originstone: "OriginStone",
  "origin stone": "OriginStone",
};

const roomTypeMap: Partial<Record<MaaRoomKey, BentoRoomTypeId>> = {
  control: "CONTROL",
  trading: "TRADING",
  manufacture: "MANUFACTURE",
  power: "POWER",
  meeting: "MEETING",
  hire: "HIRE",
};

function isMaaCustomInfrast(value: unknown): value is MaaCustomInfrast {
  const candidate = value as MaaCustomInfrast;
  return (
    typeof candidate === "object" &&
    candidate !== null &&
    Array.isArray(candidate.plans) &&
    candidate.plans.some((plan) => typeof plan === "object" && plan !== null && plan.rooms)
  );
}

function activeRoomCount(rooms: MaaRoom[] | undefined): number {
  return rooms?.filter((room) => !room.skip).length ?? 0;
}

function inferLayoutId(plans: MaaPlan[]): string {
  const counts = plans.reduce(
    (maxCounts, plan) => ({
      trading: Math.max(maxCounts.trading, activeRoomCount(plan.rooms?.trading)),
      manufacture: Math.max(maxCounts.manufacture, activeRoomCount(plan.rooms?.manufacture)),
      power: Math.max(maxCounts.power, activeRoomCount(plan.rooms?.power)),
    }),
    { trading: 0, manufacture: 0, power: 0 },
  );
  const inferred = `${counts.trading}${counts.manufacture}${counts.power}`;

  return ["153", "243", "252", "333", "342"].includes(inferred) ? inferred : "243";
}

function normalizeKey(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function normalizeProduct(product?: string): ProductKind | undefined {
  if (!product) {
    return undefined;
  }
  return productMap[normalizeKey(product)];
}

function operatorNameMap(operators: Operator[]): Map<string, Operator> {
  const map = new Map<string, Operator>();
  for (const operator of operators) {
    map.set(normalizeKey(operator.name), operator);
    map.set(normalizeKey(operator.id), operator);
    for (const alias of operator.aliases) {
      map.set(normalizeKey(alias), operator);
    }
  }
  return map;
}

function setOperators(
  assignment: RoomAssignment,
  names: string[],
  operatorsByName: Map<string, Operator>,
  unmatchedOperatorNames: Set<string>,
): RoomAssignment {
  const slots: SlotAssignment[] = assignment.operators.map((slot, index) => {
    const name = names[index]?.trim();
    if (!name) {
      return { slotIndex: slot.slotIndex, isOptional: slot.isOptional };
    }

    const operator = operatorsByName.get(normalizeKey(name));
    if (!operator) {
      unmatchedOperatorNames.add(name);
    }

    return {
      slotIndex: slot.slotIndex,
      ...(operator ? { operatorId: operator.id } : { overrideName: name }),
      ...(slot.isOptional !== undefined ? { isOptional: slot.isOptional } : {}),
    };
  });

  return {
    ...assignment,
    operators: slots,
  };
}

function findAssignment(
  assignments: RoomAssignment[],
  roomType: BentoRoomTypeId,
  roomIndex: number,
  product?: ProductKind,
): RoomAssignment | undefined {
  const roomAssignments = assignments
    .filter((assignment) => assignment.roomType === roomType)
    .sort((first, second) => first.roomIndex - second.roomIndex);

  if (roomType === "TRADING" || roomType === "MANUFACTURE") {
    if (!product) {
      return roomAssignments[roomIndex - 1];
    }

    return roomAssignments.filter((assignment) => assignment.product === product)[roomIndex - 1];
  }

  return roomAssignments.find((assignment) => assignment.roomIndex === roomIndex);
}

function productForRoom(roomType: BentoRoomTypeId, room: MaaRoom): ProductKind | undefined {
  if (roomType === "TRADING") {
    return "Money";
  }
  if (roomType === "MANUFACTURE") {
    return normalizeProduct(room.product);
  }
  return undefined;
}

function applyRoomList(
  assignments: RoomAssignment[],
  key: MaaRoomKey,
  rooms: MaaRoom[] | undefined,
  operatorsByName: Map<string, Operator>,
  unmatchedOperatorNames: Set<string>,
): RoomAssignment[] {
  if (!rooms?.length) {
    return assignments;
  }

  const roomType = roomTypeMap[key];
  if (!roomType) {
    return assignments;
  }

  const productOrdinals = new Map<string, number>();
  return rooms.reduce((current, room, index) => {
    if (room.skip) {
      return current;
    }

    const product = productForRoom(roomType, room);
    const productKey = `${roomType}:${product ?? ""}`;
    const nextOrdinal = (productOrdinals.get(productKey) ?? 0) + 1;
    productOrdinals.set(productKey, nextOrdinal);

    const roomIndex = roomType === "MANUFACTURE" || roomType === "TRADING" ? nextOrdinal : index + 1;
    const target = findAssignment(current, roomType, roomIndex, product);
    if (!target) {
      return current;
    }

    return current.map((assignment) =>
      assignment.assignmentId === target.assignmentId
        ? setOperators(assignment, room.operators ?? [], operatorsByName, unmatchedOperatorNames)
        : assignment,
    );
  }, assignments);
}

function queueDuration(plan: MaaPlan, index: number): string {
  const period = plan.period?.[0];
  if (period) {
    return `${period[0]}-${period[1]}`;
  }
  if (plan.description) {
    return plan.description;
  }
  return index === 0 ? "第一班" : index === 1 ? "第二班" : `轮换 ${index + 1}`;
}

function droneRoomLabel(room?: string): string {
  if (room === "manufacture") {
    return "制造站";
  }
  if (room === "trading") {
    return "贸易站";
  }
  return "目标房间";
}

function describeDrone(plan: MaaPlan): string | null {
  const drones = plan.drones;
  if (!drones || drones.enable === false) {
    return null;
  }

  return `${droneRoomLabel(drones.room)} ${drones.index ?? 1}，${drones.order ?? "pre"}`;
}

function droneSummary(plans: MaaPlan[]): ScheduleDocument["droneSummary"] {
  const droneDescriptions = plans
    .map((plan, index) => {
      const description = describeDrone(plan);
      return description ? `${plan.name ?? `轮换 ${index + 1}`}: ${description}` : null;
    })
    .filter((item): item is string => Boolean(item));

  if (!droneDescriptions.length) {
    return {
      enabled: false,
      targetRoomLabel: "未配置",
      summaryText: "无人机加速未配置",
    };
  }

  if (droneDescriptions.length === 1) {
    return {
      enabled: true,
      targetRoomLabel: droneDescriptions[0].replace(/^.*: /, ""),
      summaryText: `无人机加速：${droneDescriptions[0]}`,
    };
  }

  return {
    enabled: true,
    targetRoomLabel: "按班次配置",
    summaryText: `无人机加速按班次配置：${droneDescriptions.join("；")}`,
  };
}

export function maaCustomInfrastToScheduleImport(
  value: unknown,
  operators: Operator[],
): MaaImportReport | null {
  if (!isMaaCustomInfrast(value)) {
    return null;
  }

  const sourcePlans = value.plans ?? [];
  const plans = sourcePlans.slice(0, MAX_IMPORT_PLAN_COUNT);
  const layoutId = inferLayoutId(sourcePlans);
  const document = createDefaultSchedule(layoutId, Math.max(1, plans.length));
  const operatorsByName = operatorNameMap(operators);
  const unmatchedOperatorNames = new Set<string>();

  const importedDocument: ScheduleDocument = {
    ...document,
    title: value.title ?? document.title,
    subtitle: `${layoutId} MAA 基建排班图`,
    authorText: value.author ?? document.authorText,
    queues: document.queues.map((queue, index) => {
      const plan = plans[index];
      if (!plan) {
        return queue;
      }

      let roomAssignments = queue.roomAssignments;
      if (plan.rooms) {
        roomAssignments = applyRoomList(roomAssignments, "control", plan.rooms.control, operatorsByName, unmatchedOperatorNames);
        roomAssignments = applyRoomList(roomAssignments, "trading", plan.rooms.trading, operatorsByName, unmatchedOperatorNames);
        roomAssignments = applyRoomList(roomAssignments, "manufacture", plan.rooms.manufacture, operatorsByName, unmatchedOperatorNames);
        roomAssignments = applyRoomList(roomAssignments, "power", plan.rooms.power, operatorsByName, unmatchedOperatorNames);
        roomAssignments = applyRoomList(roomAssignments, "meeting", plan.rooms.meeting, operatorsByName, unmatchedOperatorNames);
        roomAssignments = applyRoomList(roomAssignments, "hire", plan.rooms.hire, operatorsByName, unmatchedOperatorNames);
      }

      return {
        ...queue,
        label: plan.name ?? queue.label,
        durationLabel: queueDuration(plan, index),
        roomAssignments,
      };
    }),
    productionSummary: {
      ...document.productionSummary,
      customLine: "由 MAA custom_infrast JSON 导入，仅用于排班图展示",
    },
    droneSummary: droneSummary(plans),
    notes: value.description ? value.description.split("\n").filter(Boolean).slice(0, 3) : document.notes,
    updatedAt: new Date().toISOString(),
  };

  return {
    document: importedDocument,
    unmatchedOperatorNames: [...unmatchedOperatorNames].sort((left, right) => left.localeCompare(right)),
    importedPlanCount: plans.length,
    skippedPlanCount: Math.max(0, sourcePlans.length - plans.length),
    dronePlanCount: plans.filter((plan) => Boolean(describeDrone(plan))).length,
  };
}

const maaRoomKeyByType: Partial<Record<BentoRoomTypeId, MaaRoomKey>> = {
  CONTROL: "control",
  TRADING: "trading",
  MANUFACTURE: "manufacture",
  POWER: "power",
  MEETING: "meeting",
  HIRE: "hire",
};

const maaProductByKind: Partial<Record<ProductKind, string>> = {
  Money: "LMD",
  PureGold: "Pure Gold",
  CombatRecord: "Battle Record",
  OriginStone: "Originium Shard",
};

function operatorNameById(operators: Operator[]): Map<string, string> {
  return new Map(operators.map((operator) => [operator.id, operator.name]));
}

function assignedOperatorNames(
  assignment: RoomAssignment,
  namesById: Map<string, string>,
): string[] {
  return assignment.operators.flatMap((slot) => {
    const name = slot.operatorId ? namesById.get(slot.operatorId) : slot.overrideName;
    return name?.trim() ? [name.trim()] : [];
  });
}

function schedulePeriod(label: string): [string, string][] | undefined {
  const match = label.match(/\b([01]\d|2[0-3]):([0-5]\d)\s*[-~—至]\s*([01]\d|2[0-3]):([0-5]\d)\b/);
  return match ? [[`${match[1]}:${match[2]}`, `${match[3]}:${match[4]}`]] : undefined;
}

function exportDrone(document: ScheduleDocument): MaaPlan["drones"] | undefined {
  if (!document.droneSummary.enabled) {
    return undefined;
  }

  const summary = `${document.droneSummary.targetRoomLabel} ${document.droneSummary.summaryText}`;
  const room = /贸易|trading/i.test(summary) ? "trading" : "manufacture";
  const index = Number(summary.match(/(?:站|room)\s*(\d+)/i)?.[1] ?? 1);

  return { enable: true, room, index, order: "pre" };
}

function exportRoom(
  assignment: RoomAssignment,
  namesById: Map<string, string>,
  useOrundum: boolean,
): MaaRoom {
  const operators = assignedOperatorNames(assignment, namesById);
  if (operators.length === 0) {
    return { skip: true };
  }

  const product =
    assignment.roomType === "TRADING" && useOrundum
      ? "Orundum"
      : maaProductByKind[assignment.product ?? "Money"];

  return {
    operators,
    sort: true,
    ...(product ? { product } : {}),
  };
}

function exportRooms(
  assignments: RoomAssignment[],
  namesById: Map<string, string>,
): MaaPlan["rooms"] {
  const rooms: MaaPlan["rooms"] = {};
  const hasOriginiumShard = assignments.some(
    (assignment) => assignment.roomType === "MANUFACTURE" && assignment.product === "OriginStone",
  );
  const lastTradingIndex = Math.max(
    0,
    ...assignments
      .filter((assignment) => assignment.roomType === "TRADING")
      .map((assignment) => assignment.roomIndex),
  );

  for (const roomType of Object.keys(maaRoomKeyByType) as BentoRoomTypeId[]) {
    const key = maaRoomKeyByType[roomType];
    if (!key) continue;

    const roomAssignments = assignments
      .filter((assignment) => assignment.roomType === roomType)
      .sort((first, second) => first.roomIndex - second.roomIndex)
      .map((assignment) =>
        exportRoom(
          assignment,
          namesById,
          roomType === "TRADING" && hasOriginiumShard && assignment.roomIndex === lastTradingIndex,
        ),
      );

    if (roomAssignments.length > 0) {
      rooms[key] = roomAssignments;
    }
  }

  return rooms;
}

export function scheduleDocumentToMaaCustomInfrast(
  document: ScheduleDocument,
  operators: Operator[],
): MaaCustomInfrast {
  const namesById = operatorNameById(operators);
  const drones = exportDrone(document);

  return {
    title: document.title,
    description: [document.subtitle, ...document.notes].filter(Boolean).join("\n"),
    plans: document.queues.map((queue) => ({
      name: queue.label,
      description: queue.durationLabel,
      ...(schedulePeriod(queue.durationLabel) ? { period: schedulePeriod(queue.durationLabel) } : {}),
      ...(drones ? { drones } : {}),
      rooms: exportRooms(queue.roomAssignments, namesById),
    })),
  };
}
