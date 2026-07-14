import type { ScheduleDocument } from "../domain/types";
import type { Operator } from "../domain/types";
import { scheduleDocumentToMaaCustomInfrast } from "./maaCustomInfrast";

function safeFileName(value: string): string {
  return value.replace(/[\\/:*?"<>|]/g, "-").trim() || "schedule";
}

function downloadValue(value: unknown, fileName: string): void {
  const blob = new Blob([JSON.stringify(value, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = globalThis.document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function downloadJson(document: ScheduleDocument): void {
  const date = new Date().toISOString().slice(0, 10);
  downloadValue(document, `${safeFileName(document.title)}-${date}.json`);
}

export function downloadMaaJson(document: ScheduleDocument, operators: Operator[]): void {
  const date = new Date().toISOString().slice(0, 10);
  downloadValue(
    scheduleDocumentToMaaCustomInfrast(document, operators),
    `${safeFileName(document.title)}-MAA-${date}.json`,
  );
}
