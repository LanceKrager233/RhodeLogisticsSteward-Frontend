import { BrowserRouter, Route, Routes, useParams, useSearchParams } from "react-router";
import { createSampleSchedule, longTextSchedule, missingPortraitSchedule } from "../data/mockSchedule";
import { EditorShell } from "../components/editor/EditorShell";
import { normalizePosterMode, normalizePosterTemplateId } from "../domain/posterDefinitions";
import { AppErrorBoundary } from "./AppErrorBoundary";

function SampleRoute() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const sampleId = params.sampleId ?? "243";
  const queueCount = Number(searchParams.get("queues") ?? "");
  const document =
    sampleId === "long"
      ? longTextSchedule
      : sampleId === "missing"
        ? missingPortraitSchedule
        : createSampleSchedule(sampleId, {
            queueCount: Number.isFinite(queueCount) && queueCount > 0 ? queueCount : undefined,
            posterMode: normalizePosterMode(searchParams.get("mode")),
            posterTemplateId: normalizePosterTemplateId(searchParams.get("template")),
            strategy: searchParams.get("strategy") ?? undefined,
          });

  return <EditorShell initialDocument={document} key={`${sampleId}:${searchParams.toString()}`} />;
}

export default function App() {
  return (
    <AppErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route element={<EditorShell />} path="/" />
          <Route element={<SampleRoute />} path="/sample/:sampleId" />
        </Routes>
      </BrowserRouter>
    </AppErrorBoundary>
  );
}
