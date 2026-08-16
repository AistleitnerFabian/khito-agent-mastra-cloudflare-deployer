import { Container, type OutboundHandlerContext } from "@cloudflare/containers";

type DoclingResponse = {
  document?: {
    json_content?: unknown;
    md_content?: string;
  };
  errors?: Array<{ message?: string }>;
  processing_time?: number;
  status: "success" | "partial_success" | "failure" | "skipped";
};

export type DoclingExtraction = {
  document: unknown;
  markdown: string;
  processingTime: number | undefined;
};

export class DoclingContainer extends Container {
  override defaultPort = 5001;
  override sleepAfter = "30s";
  override enableInternet = false;
  override pingEndpoint = "health";

  static override outboundByHost = {
    "inbox.r2": async (request: Request, env: unknown, _context: OutboundHandlerContext) => {
      const key = decodeURIComponent(new URL(request.url).pathname.slice(1));

      if (!key.startsWith("inbox/")) {
        return new Response("Invalid inbox source key.", { status: 400 });
      }

      const bucket = (env as Cloudflare.Env).INBOX_FILES;
      const object = await bucket.get(key);

      if (!object) {
        return new Response("Inbox source not found.", { status: 404 });
      }

      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set("Content-Length", String(object.size));
      return new Response(object.body, { headers });
    },
  };

  async extract(sourceKey: string): Promise<DoclingExtraction> {
    try {
      const response = await this.containerFetch("http://container/v1/convert/source", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sources: [{ kind: "http", url: `http://inbox.r2/${encodeURIComponent(sourceKey)}` }],
          options: { to_formats: ["md", "json"] },
        }),
      });

      if (!response.ok) {
        const details = await response.text();
        throw new Error(details || `Docling returned ${response.status}.`);
      }

      const result = await response.json<DoclingResponse>();
      if (result.status !== "success" && result.status !== "partial_success") {
        const details = result.errors?.map(error => error.message).filter(Boolean).join(" ");
        throw new Error(details || `Docling conversion ${result.status}.`);
      }

      return {
        document: result.document?.json_content ?? {},
        markdown: result.document?.md_content ?? "",
        processingTime: result.processing_time,
      };
    }
    finally {
      await this.stop();
    }
  }
}
