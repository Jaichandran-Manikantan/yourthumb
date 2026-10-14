export type CanvaExportInput = {
  generationId?: string;
  imageUrl?: string;
  title?: string;
};

type ExportResponse = {
  error?: string;
  edit_url?: string;
  design_id?: string;
  processing?: boolean;
  upload_job_id?: string;
  generation_id?: string;
  title?: string;
};

export class CanvaNotConnectedError extends Error {
  constructor() {
    super("Canva is not connected.");
    this.name = "CanvaNotConnectedError";
  }
}

function isNotConnected(response: Response, data: ExportResponse) {
  return data.error === "CANVA_NOT_CONNECTED" ||
    (response.status === 401 && data.error !== "Unauthorized");
}

async function readJson(response: Response): Promise<ExportResponse> {
  return (await response.json().catch(() => ({}))) as ExportResponse;
}

type StartExportResult =
  | { editUrl: string }
  | { response: Response; data: ExportResponse };

async function startExport(input: CanvaExportInput): Promise<StartExportResult> {
  const response = await fetch("/api/canva/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...(input.generationId ? { generationId: input.generationId } : {}),
      ...(!input.generationId && input.imageUrl ? { imageUrl: input.imageUrl } : {}),
      title: input.title ?? "YouTube Thumbnail",
    }),
  });
  const data = await readJson(response);
  if (isNotConnected(response, data)) throw new CanvaNotConnectedError();
  if (response.ok && data.edit_url) return { editUrl: data.edit_url };
  return { response, data };
}

/** Performs the existing asynchronous Canva export flow and resolves to edit_url. */
export async function exportThumbnailToCanva(input: CanvaExportInput): Promise<string> {
  const title = input.title?.trim() || "YouTube Thumbnail";
  let started = await startExport({ ...input, title });
  if ("editUrl" in started) return started.editUrl;

  let { response, data } = started;
  if (response.status !== 202 || !data.processing || !data.generation_id) {
    throw new Error(data.error ?? "Could not export this thumbnail to Canva.");
  }

  let generationId = data.generation_id;
  let uploadJobId = data.upload_job_id;
  let exportTitle = data.title ?? title;

  for (let attempt = 0; attempt < 12; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 2500));
    const statusUrl = new URL("/api/canva/export/status", window.location.origin);
    statusUrl.searchParams.set("generationId", generationId);
    if (uploadJobId) statusUrl.searchParams.set("jobId", uploadJobId);
    statusUrl.searchParams.set("title", exportTitle);

    const statusResponse = await fetch(statusUrl.toString(), { cache: "no-store" });
    const statusData = await readJson(statusResponse);
    if (isNotConnected(statusResponse, statusData)) throw new CanvaNotConnectedError();
    if (statusResponse.ok && statusData.edit_url) return statusData.edit_url;

    if (
      statusResponse.status === 409 &&
      statusData.error === "Canva upload state is missing its job id"
    ) {
      const retry = await startExport({
        ...(input.generationId ? { generationId: input.generationId } : { generationId }),
        ...(!input.generationId && !generationId && input.imageUrl ? { imageUrl: input.imageUrl } : {}),
        title: exportTitle,
      });
      if ("editUrl" in retry) return retry.editUrl;
      if (retry.response.status !== 202 || !retry.data.processing || !retry.data.generation_id) {
        throw new Error(retry.data.error ?? "Canva export could not be restarted.");
      }
      generationId = retry.data.generation_id;
      uploadJobId = retry.data.upload_job_id;
      exportTitle = retry.data.title ?? exportTitle;
      continue;
    }

    if (statusResponse.status >= 400 && !statusData.processing) {
      throw new Error(statusData.error ?? "Canva export failed.");
    }
    if (statusData.generation_id) generationId = statusData.generation_id;
    if (statusData.upload_job_id) uploadJobId = statusData.upload_job_id;
    if (statusData.title) exportTitle = statusData.title;
  }

  throw new Error("Canva is still preparing your thumbnail. Please try Edit in Canva again in a moment.");
}
