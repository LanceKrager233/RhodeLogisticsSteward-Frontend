import { describe, expect, it } from "vitest";
import { createDefaultSchedule } from "../../src/domain/createDefaultSchedule";
import { setRoomProduct } from "../../src/domain/scheduleDocument";
import type { Operator, ScheduleDocument } from "../../src/domain/types";
import { scheduleDocumentToMaaCustomInfrast } from "../../src/export/maaCustomInfrast";

const operators: Operator[] = [
  {
    id: "op-amiya",
    name: "阿米娅",
    portraitPath: "/operators/portraits/amiya.webp",
    aliases: [],
    tags: [],
    source: "mock",
  },
  {
    id: "op-proviso",
    name: "但书",
    portraitPath: "/operators/portraits/proviso.webp",
    aliases: [],
    tags: [],
    source: "mock",
  },
];

describe("scheduleDocumentToMaaCustomInfrast", () => {
  it("exports official room keys, operator names and periods", () => {
    const source = createDefaultSchedule("243", 1);
    const queue = source.queues[0];
    const control = queue.roomAssignments.find((assignment) => assignment.roomType === "CONTROL")!;
    const trading = queue.roomAssignments.find((assignment) => assignment.roomType === "TRADING")!;
    const document: ScheduleDocument = {
      ...source,
      queues: [
        {
          ...queue,
          label: "早班",
          durationLabel: "06:00-18:00",
          roomAssignments: queue.roomAssignments.map((assignment) => {
            if (assignment.assignmentId === control.assignmentId) {
              return {
                ...assignment,
                operators: assignment.operators.map((slot, index) =>
                  index === 0 ? { ...slot, operatorId: "op-amiya" } : slot,
                ),
              };
            }
            if (assignment.assignmentId === trading.assignmentId) {
              return {
                ...assignment,
                operators: assignment.operators.map((slot, index) =>
                  index === 0 ? { ...slot, operatorId: "op-proviso" } : slot,
                ),
              };
            }
            return assignment;
          }),
        },
      ],
    };

    const exported = scheduleDocumentToMaaCustomInfrast(document, operators);

    expect(exported.plans?.[0].period).toEqual([["06:00", "18:00"]]);
    expect(exported.plans?.[0].rooms?.control?.[0].operators).toEqual(["阿米娅"]);
    expect(exported.plans?.[0].rooms?.trading?.[0]).toMatchObject({
      product: "LMD",
      operators: ["但书"],
      sort: true,
    });
    expect(exported.plans?.[0].rooms?.power?.[0]).toEqual({ skip: true });
  });

  it("maps shard manufacturing and the final trading post to the MAA originium products", () => {
    const source = createDefaultSchedule("333", 1);
    const manufacture = source.canvas.rooms.find((room) => room.roomType === "MANUFACTURE")!;
    const withShard = setRoomProduct(source, manufacture.roomNodeId, "OriginStone");
    const queue = withShard.queues[0];
    const lastTrading = queue.roomAssignments
      .filter((assignment) => assignment.roomType === "TRADING")
      .sort((first, second) => second.roomIndex - first.roomIndex)[0];
    const document: ScheduleDocument = {
      ...withShard,
      queues: [
        {
          ...queue,
          roomAssignments: queue.roomAssignments.map((assignment) => ({
            ...assignment,
            operators:
              assignment.assignmentId === lastTrading.assignmentId || assignment.roomNodeId === manufacture.roomNodeId
                ? assignment.operators.map((slot, index) =>
                    index === 0 ? { ...slot, overrideName: "测试干员" } : slot,
                  )
                : assignment.operators,
          })),
        },
      ],
    };

    const exported = scheduleDocumentToMaaCustomInfrast(document, []);
    const plan = exported.plans?.[0];

    expect(plan?.rooms?.manufacture?.[0].product).toBe("Originium Shard");
    expect(plan?.rooms?.trading?.at(-1)?.product).toBe("Orundum");
  });
});
