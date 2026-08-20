import { documentDataFieldIds, type DocumentBounds, type DocumentFieldBounds } from "@khito/shared/documents";

type DoclingProvenance = {
  page_no?: number;
  bbox?: { l?: number; t?: number; r?: number; b?: number };
  coord_origin?: string;
};

type DoclingText = {
  text?: string;
  prov?: DoclingProvenance[];
};

type DoclingPage = {
  size?: { width?: number; height?: number };
};

type DoclingDocument = {
  texts?: DoclingText[];
  pages?: Record<string, DoclingPage>;
};

/**
 * Locates the agent's verbatim source quotes on the document pages and returns
 * their bounding boxes as page-relative percentages.
 */
export function locateDocumentBounds(doclingDocument: unknown, sources: Partial<Record<(typeof documentDataFieldIds)[number], string[]>>): DocumentBounds {
  const document = isDoclingDocument(doclingDocument) ? doclingDocument : {};
  const pages = toPageSizes(document.pages ?? {});
  const locatedQuotes = toLocatedQuotes(document.texts ?? [], pages);
  const bounds: DocumentBounds = {};

  for (const fieldId of documentDataFieldIds) {
    const fieldBounds = dedupeBounds((sources[fieldId] ?? []).flatMap(quote => locateQuote(quote, locatedQuotes)));

    if (fieldBounds.length > 0) {
      bounds[fieldId] = fieldBounds;
    }
  }

  return bounds;
}

type LocatedQuote = {
  normalizedText: string;
  bounds: DocumentFieldBounds;
};

type PageSizes = Map<number, { width: number; height: number }>;

function toLocatedQuotes(texts: DoclingText[], pages: PageSizes): LocatedQuote[] {
  const located: LocatedQuote[] = [];

  for (const text of texts) {
    const normalizedText = normalizeText(text.text ?? "");
    if (!normalizedText) continue;

    for (const provenance of text.prov ?? []) {
      const bounds = toFieldBounds(provenance, pages);
      if (bounds) {
        located.push({ normalizedText, bounds });
      }
    }
  }

  return located;
}

function locateQuote(quote: string, locatedQuotes: LocatedQuote[]): DocumentFieldBounds[] {
  const normalizedQuote = normalizeText(quote);

  if (normalizedQuote) {
    const located = locatedQuotes.filter(entry => entry.normalizedText.includes(normalizedQuote)).map(entry => entry.bounds);
    if (located.length > 0) {
      return located;
    }
  }

  return locateLongestWords(quote, locatedQuotes);
}

/**
 * Docling can split a quote across several text items (e.g. label and value in
 * separate cells). When the full quote cannot be located, fall back to the
 * longest words of the quote so at least the relevant region is highlighted.
 */
function locateLongestWords(quote: string, locatedQuotes: LocatedQuote[]): DocumentFieldBounds[] {
  const words = quote.split(/\s+/).filter(Boolean).sort((a, b) => b.length - a.length).slice(0, 3);

  return words.flatMap(word => locatedQuotes.filter(entry => entry.normalizedText.includes(normalizeText(word))).map(entry => entry.bounds));
}

function toFieldBounds(provenance: DoclingProvenance, pages: PageSizes): DocumentFieldBounds | null {
  const pageNo = provenance.page_no;
  const bbox = provenance.bbox;

  if (typeof pageNo !== "number" || !bbox) return null;

  const size = pages.get(pageNo);
  const left = bbox.l;
  const right = bbox.r;
  const top = typeof bbox.t === "number" ? bbox.t : undefined;
  const bottom = typeof bbox.b === "number" ? bbox.b : undefined;

  if (!size || typeof left !== "number" || typeof right !== "number" || top === undefined || bottom === undefined) {
    return null;
  }

  // Docling emits BOTTOMLEFT coordinates by default: t is the upper, b the lower edge.
  const isBottomLeft = provenance.coord_origin !== "TOPLEFT";
  const upperEdge = isBottomLeft ? Math.max(top, bottom) : Math.min(top, bottom);
  const lowerEdge = isBottomLeft ? Math.min(top, bottom) : Math.max(top, bottom);

  return {
    pageNo,
    top: toPercent(size.height - upperEdge, size.height),
    left: toPercent(left, size.width),
    width: toPercent(right - left, size.width),
    height: toPercent(upperEdge - lowerEdge, size.height),
  };
}

function toPageSizes(pages: Record<string, DoclingPage>): PageSizes {
  const sizes: PageSizes = new Map();

  for (const [key, page] of Object.entries(pages)) {
    const pageNo = Number(key);
    const width = page?.size?.width;
    const height = page?.size?.height;

    if (!Number.isNaN(pageNo) && typeof width === "number" && typeof height === "number" && width > 0 && height > 0) {
      sizes.set(pageNo, { width, height });
    }
  }

  return sizes;
}

function toPercent(value: number, total: number) {
  return Math.min(100, Math.max(0, (value / total) * 100));
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function dedupeBounds(bounds: DocumentFieldBounds[]): DocumentFieldBounds[] {
  const seen = new Set<string>();
  const unique: DocumentFieldBounds[] = [];

  for (const bound of bounds) {
    const key = `${bound.pageNo}:${bound.top.toFixed(1)}:${bound.left.toFixed(1)}:${bound.width.toFixed(1)}:${bound.height.toFixed(1)}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(bound);
    }
  }

  return unique.sort((a, b) => a.pageNo - b.pageNo || a.top - b.top);
}

function isDoclingDocument(value: unknown): value is DoclingDocument {
  return typeof value === "object" && value !== null;
}
