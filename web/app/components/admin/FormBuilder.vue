<template>
  <div class="flex h-full min-h-0 gap-4">
    <AdminFormBuilderPalette @add="addField" />

    <div class="flex min-h-0 min-w-0 flex-1 flex-col rounded-md bg-elevated/50 p-4">
      <div class="grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2 pb-3">
        <UButton
          :color="guides ? 'primary' : 'neutral'"
          variant="ghost"
          size="xs"
          icon="i-lucide-layout-grid"
          class="justify-self-start"
          aria-label="Toggle column guides"
          :aria-pressed="guides"
          @click="guides = !guides"
        />
        <div class="flex items-center gap-0.5 rounded-sm border border-default bg-default p-0.5" role="group" aria-label="Canvas breakpoint">
          <button
            v-for="entry in formBuilderBreakpoints"
            :key="entry"
            type="button"
            class="flex items-center gap-1.5 rounded-xs px-2.5 py-1 text-xs font-medium transition-colors"
            :class="breakpoint === entry ? 'bg-elevated text-highlighted' : 'text-muted hover:text-highlighted'"
            :title="`${formBreakpointConfigs[entry].label} · ${formBreakpointConfigs[entry].canvasWidth}px`"
            :aria-pressed="breakpoint === entry"
            @click="breakpoint = entry"
          >
            <UIcon :name="formBreakpointConfigs[entry].icon" class="size-3.5" />
            <span class="hidden sm:inline">{{ formBreakpointConfigs[entry].label }}</span>
          </button>
        </div>
        <p class="justify-self-end text-xs text-dimmed">{{ breakpointConfig.fluid ? "Full width" : `${breakpointConfig.canvasWidth} px` }} · {{ breakpointConfig.columns }} columns</p>
      </div>

      <div class="min-h-0 flex-1 overflow-auto">
        <div class="mx-auto h-full" :style="{ width: breakpointConfig.fluid ? '100%' : `${breakpointConfig.canvasWidth}px` }">
          <AdminFormBuilderCanvas
            :fields="fields"
            :breakpoint="breakpoint"
            :selected-id="selectedId"
            :guides="guides"
            @select="selectedId = $event"
            @remove="removeField"
            @add-at="insertField"
            @move-to="moveField"
            @resize="resizeField"
          />
        </div>
      </div>
    </div>

    <AdminFormBuilderInspector :field="selectedField" @update="applyUpdate" @remove="removeSelectedField" @duplicate="duplicateSelectedField" />
  </div>
</template>

<script setup lang="ts">
import {
  builderToSchema,
  clampSpan,
  createBuilderField,
  formBreakpointConfigs,
  formBuilderBreakpoints,
  parseSchemaIntoFields,
  slugifyKey,
  uniqueKey,
  type BuilderField,
  type FormBuilderBreakpoint,
  type FormFieldKind,
} from "~/utils/form-builder";

const schema = defineModel<string>({ required: true });
const emit = defineEmits<{ validationChange: [isValid: boolean] }>();

const fields = ref<BuilderField[]>([]);
const selectedId = ref<string | null>(null);
const breakpoint = ref<FormBuilderBreakpoint>("md");
const guides = ref(false);

// The last schema string this component emitted; distinguishes its own model
// updates from external ones (openCreate/openEdit) that must be re-ingested.
let emittedSchema = "";

const selectedField = computed(() => fields.value.find(field => field.id === selectedId.value) ?? null);
const breakpointConfig = computed(() => formBreakpointConfigs[breakpoint.value]);

function occupiedKeys(excludeId?: string): string[] {
  return fields.value.filter(field => field.id !== excludeId).map(field => field.key);
}

function publishSchema(schemaText: string) {
  emittedSchema = schemaText;
  schema.value = schemaText;
  emit("validationChange", true);
}

// Hand-written JSON Schemas (even without extensions) are ingested here; the
// builder then always emits valid schemas of its own.
function ingestSchema(schemaText: string) {
  fields.value = parseSchemaIntoFields(schemaText)?.fields ?? [];
  selectedId.value = null;
  publishSchema(JSON.stringify(builderToSchema(fields.value), null, 2));
}

ingestSchema(schema.value);

watch(fields, () => publishSchema(JSON.stringify(builderToSchema(fields.value), null, 2)), { deep: true });

watch(schema, (value) => {
  if (value !== emittedSchema) ingestSchema(value);
});

function addField(kind: FormFieldKind) {
  insertField(kind, fields.value.length);
}

function insertField(kind: FormFieldKind, index: number) {
  const field = createBuilderField(kind, occupiedKeys());
  fields.value.splice(Math.min(index, fields.value.length), 0, field);
  selectedId.value = field.id;
}

function moveField(id: string, index: number) {
  const from = fields.value.findIndex(field => field.id === id);
  if (from === -1) return;
  const [field] = fields.value.splice(from, 1);
  if (!field) return;
  const to = index > from ? index - 1 : index;
  fields.value.splice(Math.min(to, fields.value.length), 0, field);
  selectedId.value = id;
}

function resizeField(id: string, span: number) {
  const field = fields.value.find(entry => entry.id === id);
  if (!field) return;
  const clamped = clampSpan(span);
  // Dragging to the default width clears the override — the chip's tint and
  // the inspector entry follow automatically.
  const { [breakpoint.value]: _cleared, ...inherited } = field.overrides;
  field.overrides = clamped === field.span ? inherited : { ...inherited, [breakpoint.value]: clamped };
}

function removeField(id: string) {
  const index = fields.value.findIndex(field => field.id === id);
  if (index === -1) return;
  fields.value.splice(index, 1);
  if (selectedId.value === id) selectedId.value = null;
}

function removeSelectedField() {
  if (selectedId.value) removeField(selectedId.value);
}

function duplicateSelectedField() {
  const field = selectedField.value;
  if (!field) return;
  const clone = JSON.parse(JSON.stringify(field)) as BuilderField;
  clone.id = crypto.randomUUID();
  clone.label = `${field.label} (copy)`;
  clone.key = uniqueKey(slugifyKey(clone.label), occupiedKeys(field.id));
  clone.keyLocked = false;
  fields.value.splice(fields.value.indexOf(field) + 1, 0, clone);
  selectedId.value = clone.id;
}

function applyUpdate(patch: Partial<BuilderField>) {
  const field = fields.value.find(entry => entry.id === selectedId.value);
  if (!field) return;

  const { key, label, span, ...rest } = patch;
  if (typeof key === "string") {
    field.keyLocked = true;
    field.key = uniqueKey(slugifyKey(key), occupiedKeys(field.id));
  }
  if (typeof label === "string") {
    field.label = label;
    if (!field.keyLocked) field.key = uniqueKey(slugifyKey(label), occupiedKeys(field.id));
  }
  if (typeof span === "number") {
    field.span = clampSpan(span);
    field.overrides = Object.fromEntries(
      Object.entries(field.overrides).filter(([, value]) => value !== field.span),
    ) as typeof field.overrides;
  }
  Object.assign(field, rest);
}
</script>
