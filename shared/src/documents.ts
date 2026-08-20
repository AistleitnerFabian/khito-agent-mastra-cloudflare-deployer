export const documentDataFieldIds = ["project", "position", "glassType", "glassBuildUp", "remark"] as const;

export type DocumentDataField = (typeof documentDataFieldIds)[number];

export const documentDataFields = [
  { id: "project", index: 1, label: "Project", description: "Project name or number the document belongs to" },
  { id: "position", index: 2, label: "Position", description: "Position number(s) referenced by the document" },
  { id: "glassType", index: 3, label: "Glass type", description: "Glass type designation (e.g. GT1 VSG 6)" },
  { id: "glassBuildUp", index: 4, label: "Glass build-up", description: "Glass build-up layer structure from outside to inside" },
  { id: "remark", index: 5, label: "Remark", description: "Additional remarks on the document" },
] as const satisfies ReadonlyArray<{ id: DocumentDataField; index: number; label: string; description: string }>;

export type ExtractedDocumentData = Record<DocumentDataField, string>;

export function toEmptyDocumentData(): ExtractedDocumentData {
  return Object.fromEntries(documentDataFieldIds.map(fieldId => [fieldId, ""])) as ExtractedDocumentData;
}

export const documentExtractionStatuses = ["extracting", "ready", "failed"] as const;

export type DocumentExtractionStatus = (typeof documentExtractionStatuses)[number];

export type DocumentFieldBounds = {
  pageNo: number;
  /** Percent of the page height, measured from the top. */
  top: number;
  /** Percent of the page width, measured from the left. */
  left: number;
  width: number;
  height: number;
};

export type DocumentBounds = Partial<Record<DocumentDataField, DocumentFieldBounds[]>>;

const documentDataFieldValues = new Set<string>(documentDataFieldIds);

export function isExtractedDocumentData(value: unknown): value is ExtractedDocumentData {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  return documentDataFieldIds.every(fieldId => {
    const fieldValue = (value as Record<string, unknown>)[fieldId];
    return typeof fieldValue === "string";
  }) && Object.entries(value).every(([key, fieldValue]) => documentDataFieldValues.has(key) && typeof fieldValue === "string");
}
