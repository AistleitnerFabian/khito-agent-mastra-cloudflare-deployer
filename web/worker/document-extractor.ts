import { documentDataFields, documentDataFieldIds, type DocumentDataField, type ExtractedDocumentData } from "@khito/shared/documents";
import type { ExtractableDocumentType } from "@khito/shared/inbox";
import type { ServiceFetcher } from "./docling-client";

type GenerateResult = {
  object?: Partial<Record<DocumentDataField, unknown>>;
};

export type ExtractionSource = {
  markdown: string;
  name: string;
  documentType: ExtractableDocumentType;
};

export type DocumentExtraction = {
  data: ExtractedDocumentData;
  sources: Partial<Record<DocumentDataField, string[]>>;
};

const maximumErrorMessageLength = 1_000;
const maximumDocumentLength = 60_000;

function toFieldSchema(description: string) {
  return {
    type: "object",
    properties: {
      value: {
        type: "string",
        description: `The extracted value. ${description}. Use an empty string if the document does not contain it.`,
      },
      sources: {
        type: "array",
        items: { type: "string" },
        description: "Short verbatim quotes copied exactly from the document where this value was found. Empty array if not found.",
      },
    },
    required: ["value", "sources"],
    additionalProperties: false,
  };
}

const extractionSchema = {
  type: "object",
  properties: Object.fromEntries(documentDataFields.map(field => [field.id, toFieldSchema(field.description)])),
  required: [...documentDataFieldIds],
  additionalProperties: false,
};

export async function extractDocumentData(source: ExtractionSource, agent: ServiceFetcher, origin: string): Promise<DocumentExtraction> {
  const response = await agent.fetch(`${origin}/api/agents/khito-agent/generate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      messages: [{ role: "user", content: toExtractionPrompt(source) }],
      structuredOutput: { schema: extractionSchema },
    }),
  });

  if (!response.ok) {
    throw new Error(await toResponseError(response));
  }

  const result = await response.json<GenerateResult>();
  return toExtraction(result.object);
}

function toExtraction(object: unknown): DocumentExtraction {
  if (typeof object !== "object" || object === null) {
    throw new Error("The agent did not return extracted document data.");
  }

  const fields = object as Partial<Record<DocumentDataField, unknown>>;
  const data = {} as ExtractedDocumentData;
  const sources: Partial<Record<DocumentDataField, string[]>> = {};

  for (const fieldId of documentDataFieldIds) {
    const field = fields[fieldId];

    if (typeof field !== "object" || field === null || typeof (field as { value?: unknown }).value !== "string") {
      throw new Error(`The agent did not return a value for field "${fieldId}".`);
    }

    data[fieldId] = (field as { value: string }).value;
    sources[fieldId] = toSources((field as { sources?: unknown }).sources);
  }

  return { data, sources };
}

function toSources(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((quote): quote is string => typeof quote === "string" && quote.trim().length > 0);
}

function toExtractionPrompt(source: ExtractionSource) {
  const document = source.markdown.slice(0, maximumDocumentLength);
  return [
    `Extract the ${source.documentType} data below for a glass manufacturing company.`,
    "For every field, return the value and short verbatim source quotes copied exactly (character-for-character) from the document where the information was found. The quotes are used to locate the information on the page, so they must appear in the document text exactly as written.",
    `File name: ${source.name}`,
    `Document:\n\n${document}`,
  ].join("\n\n");
}

async function toResponseError(response: Response) {
  const details = (await response.text()).trim().slice(0, maximumErrorMessageLength);
  return details || `The agent returned ${response.status}.`;
}
