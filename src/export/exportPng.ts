import { toPng } from "html-to-image";
import type { ScheduleDocument } from "../domain/types";

function safeFileName(value: string): string {
  return value.replace(/[\\/:*?"<>|]/g, "-").trim() || "schedule";
}

async function waitForImages(element: HTMLElement): Promise<void> {
  const images = Array.from(element.querySelectorAll("img"));

  await Promise.all(
    images.map(async (image) => {
      if (image.complete && image.naturalWidth > 0) {
        return;
      }

      try {
        if (typeof image.decode === "function") {
          await image.decode();
          return;
        }
      } catch {
        // Fall back to load/error listeners below so one broken image does not cancel export.
      }

      await new Promise<void>((resolve) => {
        const cleanup = () => {
          image.removeEventListener("load", cleanup);
          image.removeEventListener("error", cleanup);
          resolve();
        };

        image.addEventListener("load", cleanup, { once: true });
        image.addEventListener("error", cleanup, { once: true });
      });
    }),
  );
}

export async function exportSchedulePng(element: HTMLElement, document: ScheduleDocument): Promise<void> {
  const hadExportingAttribute = element.hasAttribute("data-exporting");
  const previousExportingAttribute = element.getAttribute("data-exporting");

  element.setAttribute("data-exporting", "true");

  try {
    await waitForImages(element);

    const dataUrl = await toPng(element, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: "#fffdf4",
      filter: (node) =>
        node instanceof HTMLElement
          ? !node.matches("[data-resize-handle], [data-export-hidden]")
          : true,
    });
    const anchor = globalThis.document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);

    anchor.href = dataUrl;
    anchor.download = `${safeFileName(document.title)}-${date}.png`;
    anchor.click();
  } finally {
    if (hadExportingAttribute && previousExportingAttribute !== null) {
      element.setAttribute("data-exporting", previousExportingAttribute);
    } else {
      element.removeAttribute("data-exporting");
    }
  }
}
