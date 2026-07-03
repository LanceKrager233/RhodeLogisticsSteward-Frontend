import { migrateScheduleDocument } from "../domain/migrateScheduleDocument";
import type { ScheduleDocument } from "../domain/types";

const storageKey = "rhode-logistics-schedule-draft-v2";
const saveDelayMs = 500;
let pendingSave: number | undefined;

export function loadLocalDraft(): ScheduleDocument | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as unknown;
    return migrateScheduleDocument(parsed);
  } catch {
    return null;
  }
}

export function saveLocalDraft(document: ScheduleDocument): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(document));
}

export function scheduleLocalDraftSave(document: ScheduleDocument): void {
  if (typeof window === "undefined") {
    return;
  }

  if (pendingSave !== undefined) {
    window.clearTimeout(pendingSave);
  }

  pendingSave = window.setTimeout(() => {
    pendingSave = undefined;
    saveLocalDraft(document);
  }, saveDelayMs);
}

export function flushLocalDraftSave(document: ScheduleDocument): void {
  if (typeof window === "undefined") {
    return;
  }

  if (pendingSave !== undefined) {
    window.clearTimeout(pendingSave);
    pendingSave = undefined;
  }

  saveLocalDraft(document);
}

export function clearLocalDraft(): void {
  if (typeof window === "undefined") {
    return;
  }

  if (pendingSave !== undefined) {
    window.clearTimeout(pendingSave);
    pendingSave = undefined;
  }

  window.localStorage.removeItem(storageKey);
}
