import { describe, expect, it } from "vitest";
import type { BuildingReference, Operator } from "../../src/domain/types";
import { applySklandCultivation, md5Ascii, parseSklandCredentials } from "../../src/import/skland";

const operators: Operator[] = [
  {
    id: "R001",
    name: "阿米娅",
    portraitPath: "",
    aliases: ["Amiya"],
    tags: [],
    source: "mock",
  },
  {
    id: "A41",
    name: "夜刀",
    portraitPath: "",
    aliases: ["Yato"],
    tags: [],
    source: "mock",
  },
];

const reference = {
  operatorSkills: [
    { operatorId: "char_002_amiya", operatorName: "阿米娅" },
    { operatorId: "char_502_nblade", operatorName: "夜刀" },
  ],
} as BuildingReference;

describe("Skland cultivation import", () => {
  it("produces the MD5 signature required by Skland", () => {
    expect(md5Ascii("hello")).toBe("5d41402abc4b2a76b9719d911017c592");
  });

  it("parses the copied cred and token pair", () => {
    expect(parseSklandCredentials(`  ${"c".repeat(16)},${"t".repeat(16)}  `)).toEqual({
      cred: "c".repeat(16),
      token: "t".repeat(16),
    });
  });

  it("maps Skland character ids to the current operator catalog by building reference", () => {
    const result = applySklandCultivation(operators, reference, [
      { id: "char_002_amiya", evolvePhase: 2, level: 80, potentialRank: 3 },
    ]);

    expect(result.matchedCount).toBe(1);
    expect(result.operators[0].cultivation).toEqual({
      characterId: "char_002_amiya",
      owned: true,
      elitePhase: 2,
      level: 80,
      potential: 4,
    });
    expect(result.operators[1].cultivation?.owned).toBe(false);
  });
});
