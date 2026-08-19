import { documentTypes, isDocumentType, type DocumentType } from "@khito/shared/inbox";
import type { ServiceFetcher } from "./docling-client";

type GenerateResult = {
  object?: {
    documentType?: unknown;
  };
};

export type ClassificationSource = {
  markdown: string;
  name: string;
};

const maximumErrorMessageLength = 1_000;
const maximumDocumentLength = 60_000;

const documentTypeSchema = {
  type: "object",
  properties: {
    documentType: {
      type: "string",
      enum: [...documentTypes],
      description: "The type of the document.",
    },
  },
  required: ["documentType"],
  additionalProperties: false,
};

export async function classifyDocument(source: ClassificationSource, agent: ServiceFetcher, origin: string): Promise<DocumentType> {
  const response = await agent.fetch(`${origin}/api/agents/khito-agent/generate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      messages: [{ role: "user", content: toClassificationPrompt(source) }],
      structuredOutput: { schema: documentTypeSchema },
    }),
  });

  if (!response.ok) {
    throw new Error(await toResponseError(response));
  }

  const result = await response.json<GenerateResult>();
  const documentType = result.object?.documentType;
  if (!isDocumentType(documentType)) {
    throw new Error("The agent did not return a document type.");
  }

  return documentType;
}

function toClassificationPrompt(source: ClassificationSource) {
  const document = source.markdown.slice(0, maximumDocumentLength);
  return [
    "Classify the document below for a company inbox.",
    "Return \"order\" for purchase orders (Bestellung/Auftrag), \"quotation\" for offers (Angebot), and \"invoice\" for bills (Rechnung).",
    "Return \"other\" for everything else, including normal emails, letters, and documents without extractable commercial content.",
    `File name: ${source.name}`,
    `Document:\n\n${document}`,
  ].join("\n\n");
}

async function toResponseError(response: Response) {
  const details = (await response.text()).trim().slice(0, maximumErrorMessageLength);
  return details || `The agent returned ${response.status}.`;
}
