type DoclingResponse = {
  document?: {
    json_content?: unknown;
    md_content?: string;
  };
  errors?: Array<{ message?: string; error_message?: string }>;
  processing_time?: number;
  status: "success" | "partial_success" | "failure" | "skipped";
};

const maximumErrorMessageLength = 1_000;

export type DoclingExtraction = {
  document: unknown;
  markdown: string;
  processingTime: number | undefined;
};

export type DoclingSource = {
  bytes: ArrayBuffer;
  contentType: string;
  name: string;
};

export async function extractWithDocling(source: DoclingSource, processor: Fetcher): Promise<DoclingExtraction> {
  const formData = new FormData();
  formData.append("files", new File([source.bytes], source.name, { type: source.contentType }));
  formData.append("to_formats", "md");
  formData.append("to_formats", "json");

  const response = await processor.fetch("http://docling.internal/v1/convert/file", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await toResponseError(response));
  }

  const result = await response.json<DoclingResponse>();
  if (result.status !== "success" && result.status !== "partial_success") {
    const details = result.errors?.map(error => error.message ?? error.error_message).filter(Boolean).join(" ");
    throw new Error(details || `Docling conversion ${result.status}.`);
  }

  return {
    document: result.document?.json_content ?? {},
    markdown: result.document?.md_content ?? "",
    processingTime: result.processing_time,
  };
}

async function toResponseError(response: Response) {
  const details = (await response.text()).trim().slice(0, maximumErrorMessageLength);
  return details || `Docling returned ${response.status}.`;
}
