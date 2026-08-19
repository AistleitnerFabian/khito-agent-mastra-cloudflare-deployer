import { Container } from "@cloudflare/containers";

type DoclingResponse = {
  document?: {
    json_content?: unknown;
    md_content?: string;
  };
  errors?: Array<{ message?: string; error_message?: string }>;
  processing_time?: number;
  status: "success" | "partial_success" | "failure" | "skipped";
};

const doclingPort = 5001;
const startupTimeoutMs = 120_000;
const readinessPollIntervalMs = 1_000;
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

export class DoclingContainer extends Container {
  override defaultPort = doclingPort;
  override sleepAfter = "5m";
  override enableInternet = false;
  override pingEndpoint = "localhost/ready";

  async extract(source: DoclingSource): Promise<DoclingExtraction> {
    await this.waitUntilReady();

    const formData = new FormData();
    formData.append("files", new File([source.bytes], source.name, { type: source.contentType }));
    formData.append("to_formats", "md");
    formData.append("to_formats", "json");

    const response = await this.containerFetch("http://container/v1/convert/file", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(await this.toResponseError(response));
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

  private async waitUntilReady() {
    await this.startAndWaitForPorts({
      ports: doclingPort,
      cancellationOptions: {
        instanceGetTimeoutMS: 30_000,
        portReadyTimeoutMS: startupTimeoutMs,
      },
    });

    const deadline = Date.now() + startupTimeoutMs;
    while (Date.now() < deadline) {
      const response = await this.containerFetch("http://localhost/ready");
      if (response.ok) {
        return;
      }

      await new Promise(resolve => setTimeout(resolve, readinessPollIntervalMs));
    }

    throw new Error("Docling did not become ready before the startup timeout.");
  }

  private async toResponseError(response: Response) {
    const details = (await response.text()).trim().slice(0, maximumErrorMessageLength);
    return details || `Docling returned ${response.status}.`;
  }
}
