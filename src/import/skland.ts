import type { BuildingReference, Operator } from "../domain/types";

const SKLAND_ORIGIN = "https://zonai.skland.com";
const BINDING_PATH = "/api/v1/game/player/binding";
const CULTIVATION_PATH = "/api/v1/game/cultivate/player";

interface SklandCredentials {
  cred: string;
  token: string;
}

interface SklandBinding {
  uid: string;
  nickName?: string;
  isOfficial?: boolean;
}

export interface SklandCharacter {
  id: string;
  level?: number;
  evolvePhase?: number;
  potentialRank?: number;
}

interface SklandResponse<T> {
  code: number;
  message?: string;
  data?: T;
}

export interface SklandImportResult {
  operators: Operator[];
  nickname: string;
  ownedCount: number;
  matchedCount: number;
}

let deviceId: string | null = null;

function add32(first: number, second: number): number {
  return (first + second) | 0;
}

function common(q: number, a: number, b: number, x: number, s: number, t: number): number {
  const value = add32(add32(a, q), add32(x, t));
  return add32((value << s) | (value >>> (32 - s)), b);
}

function ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
  return common((b & c) | (~b & d), a, b, x, s, t);
}

function gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
  return common((b & d) | (c & ~d), a, b, x, s, t);
}

function hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
  return common(b ^ c ^ d, a, b, x, s, t);
}

function ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
  return common(c ^ (b | ~d), a, b, x, s, t);
}

function md5Cycle(state: number[], block: number[]) {
  let [a, b, c, d] = state;
  const [oa, ob, oc, od] = state;

  a = ff(a, b, c, d, block[0], 7, -680876936); d = ff(d, a, b, c, block[1], 12, -389564586);
  c = ff(c, d, a, b, block[2], 17, 606105819); b = ff(b, c, d, a, block[3], 22, -1044525330);
  a = ff(a, b, c, d, block[4], 7, -176418897); d = ff(d, a, b, c, block[5], 12, 1200080426);
  c = ff(c, d, a, b, block[6], 17, -1473231341); b = ff(b, c, d, a, block[7], 22, -45705983);
  a = ff(a, b, c, d, block[8], 7, 1770035416); d = ff(d, a, b, c, block[9], 12, -1958414417);
  c = ff(c, d, a, b, block[10], 17, -42063); b = ff(b, c, d, a, block[11], 22, -1990404162);
  a = ff(a, b, c, d, block[12], 7, 1804603682); d = ff(d, a, b, c, block[13], 12, -40341101);
  c = ff(c, d, a, b, block[14], 17, -1502002290); b = ff(b, c, d, a, block[15], 22, 1236535329);
  a = gg(a, b, c, d, block[1], 5, -165796510); d = gg(d, a, b, c, block[6], 9, -1069501632);
  c = gg(c, d, a, b, block[11], 14, 643717713); b = gg(b, c, d, a, block[0], 20, -373897302);
  a = gg(a, b, c, d, block[5], 5, -701558691); d = gg(d, a, b, c, block[10], 9, 38016083);
  c = gg(c, d, a, b, block[15], 14, -660478335); b = gg(b, c, d, a, block[4], 20, -405537848);
  a = gg(a, b, c, d, block[9], 5, 568446438); d = gg(d, a, b, c, block[14], 9, -1019803690);
  c = gg(c, d, a, b, block[3], 14, -187363961); b = gg(b, c, d, a, block[8], 20, 1163531501);
  a = gg(a, b, c, d, block[13], 5, -1444681467); d = gg(d, a, b, c, block[2], 9, -51403784);
  c = gg(c, d, a, b, block[7], 14, 1735328473); b = gg(b, c, d, a, block[12], 20, -1926607734);
  a = hh(a, b, c, d, block[5], 4, -378558); d = hh(d, a, b, c, block[8], 11, -2022574463);
  c = hh(c, d, a, b, block[11], 16, 1839030562); b = hh(b, c, d, a, block[14], 23, -35309556);
  a = hh(a, b, c, d, block[1], 4, -1530992060); d = hh(d, a, b, c, block[4], 11, 1272893353);
  c = hh(c, d, a, b, block[7], 16, -155497632); b = hh(b, c, d, a, block[10], 23, -1094730640);
  a = hh(a, b, c, d, block[13], 4, 681279174); d = hh(d, a, b, c, block[0], 11, -358537222);
  c = hh(c, d, a, b, block[3], 16, -722521979); b = hh(b, c, d, a, block[6], 23, 76029189);
  a = hh(a, b, c, d, block[9], 4, -640364487); d = hh(d, a, b, c, block[12], 11, -421815835);
  c = hh(c, d, a, b, block[15], 16, 530742520); b = hh(b, c, d, a, block[2], 23, -995338651);
  a = ii(a, b, c, d, block[0], 6, -198630844); d = ii(d, a, b, c, block[7], 10, 1126891415);
  c = ii(c, d, a, b, block[14], 15, -1416354905); b = ii(b, c, d, a, block[5], 21, -57434055);
  a = ii(a, b, c, d, block[12], 6, 1700485571); d = ii(d, a, b, c, block[3], 10, -1894986606);
  c = ii(c, d, a, b, block[10], 15, -1051523); b = ii(b, c, d, a, block[1], 21, -2054922799);
  a = ii(a, b, c, d, block[8], 6, 1873313359); d = ii(d, a, b, c, block[15], 10, -30611744);
  c = ii(c, d, a, b, block[6], 15, -1560198380); b = ii(b, c, d, a, block[13], 21, 1309151649);
  a = ii(a, b, c, d, block[4], 6, -145523070); d = ii(d, a, b, c, block[11], 10, -1120210379);
  c = ii(c, d, a, b, block[2], 15, 718787259); b = ii(b, c, d, a, block[9], 21, -343485551);

  state[0] = add32(a, oa); state[1] = add32(b, ob); state[2] = add32(c, oc); state[3] = add32(d, od);
}

function md5Block(value: string): number[] {
  const block = Array<number>(16).fill(0);
  for (let index = 0; index < 64; index += 1) {
    block[index >> 2] |= value.charCodeAt(index) << ((index % 4) * 8);
  }
  return block;
}

function hexWord(value: number): string {
  let output = "";
  for (let index = 0; index < 4; index += 1) {
    output += ((value >> (index * 8 + 4)) & 0x0f).toString(16);
    output += ((value >> (index * 8)) & 0x0f).toString(16);
  }
  return output;
}

export function md5Ascii(value: string): string {
  const state = [1732584193, -271733879, -1732584194, 271733878];
  let offset = 0;
  for (; offset + 64 <= value.length; offset += 64) {
    md5Cycle(state, md5Block(value.slice(offset, offset + 64)));
  }

  const tail = Array<number>(16).fill(0);
  const remaining = value.slice(offset);
  for (let index = 0; index < remaining.length; index += 1) {
    tail[index >> 2] |= remaining.charCodeAt(index) << ((index % 4) * 8);
  }
  tail[remaining.length >> 2] |= 0x80 << ((remaining.length % 4) * 8);
  if (remaining.length > 55) {
    md5Cycle(state, tail);
    tail.fill(0);
  }
  tail[14] = value.length * 8;
  md5Cycle(state, tail);
  return state.map(hexWord).join("");
}

function byteArrayToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function createDeviceId(): string {
  if (!deviceId) {
    deviceId =
      typeof crypto.randomUUID === "function"
        ? crypto.randomUUID().toUpperCase()
        : `RHODE-${Date.now()}-${Math.random().toString(16).slice(2)}`.toUpperCase();
  }
  return deviceId;
}

async function createHeaders(path: string, credentials: SklandCredentials): Promise<HeadersInit> {
  const timestamp = `${Math.floor(Date.now() / 1000)}`;
  const platform = "3";
  const dId = createDeviceId();
  const vName = "1.0.0";
  const signPayload = `${path.replace(/\?/, "")}${timestamp}${JSON.stringify({
    platform,
    timestamp,
    dId,
    vName,
  })}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(credentials.token),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign("HMAC", key, encoder.encode(signPayload));

  return {
    Cred: credentials.cred,
    Sign: md5Ascii(byteArrayToHex(digest)),
    dId,
    platform,
    timestamp,
    vName,
  };
}

async function fetchSkland<T>(path: string, credentials: SklandCredentials): Promise<T> {
  const response = await fetch(`${SKLAND_ORIGIN}${path}`, {
    headers: await createHeaders(path, credentials),
  });
  const body = (await response.json().catch(() => null)) as SklandResponse<T> | null;
  if (!response.ok || !body || body.code !== 0 || !body.data) {
    throw new Error(body?.message || `森空岛请求失败（HTTP ${response.status}）`);
  }
  return body.data;
}

export function parseSklandCredentials(value: string): SklandCredentials {
  const normalized = value.trim().replace(/^['"]|['"]$/g, "").replace(/\s+/g, "");
  const comma = normalized.indexOf(",");
  const cred = comma >= 0 ? normalized.slice(0, comma) : "";
  const token = comma >= 0 ? normalized.slice(comma + 1) : "";
  if (cred.length < 16 || token.length < 16) {
    throw new Error("凭据格式不正确，请粘贴完整的“cred,token”。");
  }
  return { cred, token };
}

function selectBinding(data: {
  list?: Array<{ appCode?: string; defaultUid?: string; bindingList?: SklandBinding[] }>;
}): SklandBinding {
  const app = data.list?.find((entry) => entry.appCode === "arknights");
  const bindings = app?.bindingList ?? [];
  const selected =
    bindings.find((binding) => binding.uid === app?.defaultUid) ??
    bindings.find((binding) => binding.isOfficial) ??
    bindings[0];
  if (!selected?.uid) {
    throw new Error("森空岛账号没有绑定明日方舟角色。");
  }
  return selected;
}

function normalizeName(value: string): string {
  return value.trim().toLocaleLowerCase().replace(/[\s·・]/g, "");
}

function safeNumber(value: number | undefined, fallback: number): number {
  return Number.isFinite(value) ? Number(value) : fallback;
}

export function applySklandCultivation(
  operators: Operator[],
  reference: BuildingReference,
  characters: SklandCharacter[],
): { operators: Operator[]; matchedCount: number } {
  const characterById = new Map(characters.map((character) => [character.id, character]));
  const characterIdByName = new Map<string, string>();
  for (const skill of reference.operatorSkills) {
    characterIdByName.set(normalizeName(skill.operatorName), skill.operatorId);
  }

  let matchedCount = 0;
  const nextOperators = operators.map((operator) => {
    const names = [operator.name, ...operator.aliases].map(normalizeName);
    const characterId = names.map((name) => characterIdByName.get(name)).find(Boolean);
    if (!characterId) {
      return operator;
    }

    const character = characterById.get(characterId);
    if (!character) {
      return {
        ...operator,
        cultivation: { characterId, owned: false, elitePhase: 0 as const, level: 0, potential: 1 },
      };
    }

    matchedCount += 1;
    const elitePhase = Math.max(0, Math.min(2, safeNumber(character.evolvePhase, 0))) as 0 | 1 | 2;
    return {
      ...operator,
      cultivation: {
        characterId,
        owned: true,
        elitePhase,
        level: safeNumber(character.level, 1),
        potential: safeNumber(character.potentialRank, 0) + 1,
      },
    };
  });

  return { operators: nextOperators, matchedCount };
}

export async function importSklandCultivation(
  rawCredentials: string,
  operators: Operator[],
  reference: BuildingReference,
): Promise<SklandImportResult> {
  const credentials = parseSklandCredentials(rawCredentials);
  const bindingData = await fetchSkland<{
    list?: Array<{ appCode?: string; defaultUid?: string; bindingList?: SklandBinding[] }>;
  }>(BINDING_PATH, credentials);
  const binding = selectBinding(bindingData);
  const path = `${CULTIVATION_PATH}?uid=${encodeURIComponent(binding.uid)}`;
  const cultivation = await fetchSkland<{ characters?: SklandCharacter[] }>(path, credentials);
  const characters = cultivation.characters ?? [];
  if (characters.length === 0) {
    throw new Error("森空岛没有返回干员练度数据。");
  }

  const applied = applySklandCultivation(operators, reference, characters);
  return {
    operators: applied.operators,
    nickname: binding.nickName || binding.uid,
    ownedCount: characters.length,
    matchedCount: applied.matchedCount,
  };
}
