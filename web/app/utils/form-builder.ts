export const formBuilderBreakpoints = ["sm", "md", "lg"] as const;

export type FormBuilderBreakpoint = (typeof formBuilderBreakpoints)[number];

export type FormBreakpointConfig = {
  label: string;
  icon: string;
  canvasWidth: number;
  columns: number;
  /** Preview fills the whole canvas pane instead of a fixed-width frame. */
  fluid?: boolean;
};

// All breakpoints share the 12-column grid, so a width fraction means the
// same thing everywhere and the canvas only previews how it flows. Large
// previews fluid — the full canvas pane — since its real-world target is the
// expanded/focus-mode sidebar rather than a fixed device width.
export const formBreakpointConfigs = {
  sm: { label: "Small", icon: "i-lucide-rectangle-vertical", canvasWidth: 384, columns: 12, fluid: false },
  md: { label: "Medium", icon: "i-lucide-square", canvasWidth: 640, columns: 12, fluid: false },
  lg: { label: "Large", icon: "i-lucide-rectangle-horizontal", canvasWidth: 960, columns: 12, fluid: true },
} as const satisfies Record<FormBuilderBreakpoint, FormBreakpointConfig>;

export const formFieldKinds = ["text", "textarea", "number", "select", "date", "checkbox"] as const;

export type FormFieldKind = (typeof formFieldKinds)[number];

export type FormFieldKindMeta = {
  kind: FormFieldKind;
  label: string;
  icon: string;
  description: string;
};

export const formFieldKindCatalog: readonly FormFieldKindMeta[] = [
  { kind: "text", label: "Text", icon: "i-lucide-type", description: "Single-line input" },
  { kind: "textarea", label: "Text area", icon: "i-lucide-align-left", description: "Multi-line input" },
  { kind: "number", label: "Number", icon: "i-lucide-hash", description: "Numeric input" },
  { kind: "select", label: "Select", icon: "i-lucide-list", description: "Dropdown choice" },
  { kind: "date", label: "Date", icon: "i-lucide-calendar", description: "Date picker" },
  { kind: "checkbox", label: "Checkbox", icon: "i-lucide-square-check", description: "Boolean toggle" },
];

// Widths are twelfths of the grid, offered as the fractions people actually
// think in. Anything else is still reachable via the canvas resize handle.
export const formWidthPresets = [
  { label: "Full", span: 12 },
  { label: "¾", span: 9 },
  { label: "½", span: 6 },
  { label: "⅓", span: 4 },
  { label: "¼", span: 3 },
] as const satisfies ReadonlyArray<{ label: string; span: number }>;

const widthPresetLabels = new Map<number, string>(formWidthPresets.map(preset => [preset.span, preset.label]));

export function fractionLabel(span: number): string {
  return widthPresetLabels.get(span) ?? `${span}/12`;
}

export type BuilderField = {
  id: string;
  kind: FormFieldKind;
  key: string;
  keyLocked: boolean;
  label: string;
  required: boolean;
  placeholder: string;
  description: string;
  options: string[];
  rows: number;
  min: number | null;
  max: number | null;
  span: number;
  overrides: Partial<Record<FormBuilderBreakpoint, number>>;
};

// The width a field renders with on a breakpoint: its own override when
// present, otherwise the default span every breakpoint inherits.
export function effectiveSpan(field: BuilderField, breakpoint: FormBuilderBreakpoint): number {
  return field.overrides[breakpoint] ?? field.span;
}

export const formFieldDragMime = "application/x-khito-form-field";

const schemaDialect = "https://json-schema.org/draft/2020-12/schema";
const formExtensionKey = "x-khito-form";
const fieldExtensionKey = "x-khito-field";

const defaultFieldLabels: Record<FormFieldKind, string> = {
  text: "Text field",
  textarea: "Text area",
  number: "Number",
  select: "Select",
  date: "Date",
  checkbox: "Checkbox",
};

export function formFieldKindLabel(kind: FormFieldKind): string {
  return formFieldKindCatalog.find(entry => entry.kind === kind)?.label ?? kind;
}

export function formFieldKindIcon(kind: FormFieldKind): string {
  return formFieldKindCatalog.find(entry => entry.kind === kind)?.icon ?? "i-lucide-circle-help";
}

export function slugifyKey(label: string): string {
  const slug = label
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || "field";
}

export function uniqueKey(base: string, occupiedKeys: readonly string[]): string {
  const occupied = new Set(occupiedKeys);
  if (!occupied.has(base)) return base;
  let suffix = 2;
  while (occupied.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

export function clampSpan(span: number): number {
  const value = Number.isFinite(span) ? Math.round(span) : 12;
  return Math.min(12, Math.max(1, value));
}

export function defaultSpanForKind(kind: FormFieldKind): number {
  if (kind === "textarea") return 12;
  if (kind === "checkbox") return 4;
  return 6;
}

export function createBuilderField(kind: FormFieldKind, occupiedKeys: readonly string[]): BuilderField {
  const label = defaultFieldLabels[kind];
  return {
    id: crypto.randomUUID(),
    kind,
    key: uniqueKey(slugifyKey(label), occupiedKeys),
    keyLocked: false,
    label,
    required: false,
    placeholder: "",
    description: "",
    options: kind === "select" ? ["Option 1"] : [],
    rows: 3,
    min: null,
    max: null,
    span: defaultSpanForKind(kind),
    overrides: {},
  };
}

function fieldToProperty(field: BuilderField): Record<string, unknown> {
  const property: Record<string, unknown> = { title: field.label };
  if (field.description.trim()) property.description = field.description.trim();

  if (field.kind === "checkbox") {
    property.type = "boolean";
  }
  else if (field.kind === "date") {
    property.type = "string";
    property.format = "date";
  }
  else if (field.kind === "number") {
    property.type = "number";
    if (field.min !== null) property.minimum = field.min;
    if (field.max !== null) property.maximum = field.max;
  }
  else {
    property.type = "string";
    if (field.kind === "select") {
      const options = field.options.map(option => option.trim()).filter(Boolean);
      if (options.length > 0) property.enum = options;
    }
  }

  const extension: Record<string, unknown> = {
    kind: field.kind,
    layout: { span: field.span, ...field.overrides },
  };
  if (field.kind !== "checkbox" && field.placeholder.trim()) extension.placeholder = field.placeholder.trim();
  if (field.kind === "textarea") extension.rows = field.rows;
  property[fieldExtensionKey] = extension;
  return property;
}

export function builderToSchema(fields: readonly BuilderField[]) {
  const properties: Record<string, Record<string, unknown>> = {};
  const required: string[] = [];
  for (const field of fields) {
    properties[field.key] = fieldToProperty(field);
    if (field.required) required.push(field.key);
  }

  return {
    $schema: schemaDialect,
    type: "object",
    properties,
    ...(required.length > 0 ? { required } : {}),
    [formExtensionKey]: {
      breakpoints: {
        sm: formBreakpointConfigs.sm.canvasWidth,
        md: formBreakpointConfigs.md.canvasWidth,
        lg: formBreakpointConfigs.lg.canvasWidth,
      },
      columns: 12,
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseKind(property: Record<string, unknown>): FormFieldKind {
  const extension = property[fieldExtensionKey];
  if (isRecord(extension) && typeof extension.kind === "string" && (formFieldKinds as readonly string[]).includes(extension.kind)) {
    return extension.kind as FormFieldKind;
  }
  if (property.type === "boolean") return "checkbox";
  if (Array.isArray(property.enum)) return "select";
  if (property.format === "date") return "date";
  if (property.type === "number" || property.type === "integer") return "number";
  return "text";
}

// Layout round-trip: "span" is the default every breakpoint inherits; a
// breakpoint key is only kept as an override when it differs from it. Older
// schemas that spelled out all three breakpoints collapse into span +
// overrides the same way.
function parseWidth(property: Record<string, unknown>, kind: FormFieldKind): Pick<BuilderField, "span" | "overrides"> {
  const extension = property[fieldExtensionKey];
  const rawLayout = isRecord(extension) ? extension.layout : undefined;
  const record = isRecord(rawLayout) ? rawLayout : {};

  const declaredSpans = formBuilderBreakpoints
    .map(breakpoint => record[breakpoint])
    .filter((value): value is number => typeof value === "number");
  const declaredDefault = typeof record.span === "number" ? record.span : declaredSpans[0];

  const span = clampSpan(declaredDefault ?? defaultSpanForKind(kind));
  const overrides: Partial<Record<FormBuilderBreakpoint, number>> = {};
  for (const breakpoint of formBuilderBreakpoints) {
    const value = record[breakpoint];
    if (typeof value === "number" && clampSpan(value) !== span) overrides[breakpoint] = clampSpan(value);
  }
  return { span, overrides };
}

function propertyToField(key: string, property: Record<string, unknown>, requiredKeys: ReadonlySet<string>): BuilderField {
  const kind = parseKind(property);
  const extension = isRecord(property[fieldExtensionKey]) ? property[fieldExtensionKey] as Record<string, unknown> : {};
  const options = Array.isArray(property.enum) ? property.enum.filter((entry): entry is string => typeof entry === "string") : [];

  return {
    id: crypto.randomUUID(),
    kind,
    key,
    keyLocked: true,
    label: typeof property.title === "string" && property.title.trim() ? property.title.trim() : key,
    required: requiredKeys.has(key),
    placeholder: typeof extension.placeholder === "string" ? extension.placeholder : "",
    description: typeof property.description === "string" ? property.description : "",
    options: kind === "select" ? options : [],
    rows: typeof extension.rows === "number" ? Math.min(12, Math.max(2, Math.round(extension.rows))) : 3,
    min: typeof property.minimum === "number" ? property.minimum : null,
    max: typeof property.maximum === "number" ? property.maximum : null,
    ...parseWidth(property, kind),
  };
}

export function parseSchemaIntoFields(schemaText: string): { fields: BuilderField[] } | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(schemaText);
  }
  catch {
    return null;
  }

  if (!isRecord(parsed) || (parsed.type !== undefined && parsed.type !== "object")) return null;
  const rawProperties = isRecord(parsed.properties) ? parsed.properties : {};
  const requiredKeys = new Set(
    Array.isArray(parsed.required) ? parsed.required.filter((key): key is string => typeof key === "string") : [],
  );

  const fields = Object.entries(rawProperties)
    .filter((entry): entry is [string, Record<string, unknown>] => isRecord(entry[1]))
    .map(([key, property]) => propertyToField(key, property, requiredKeys));
  return { fields };
}
