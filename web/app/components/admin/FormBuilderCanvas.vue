<template>
  <div class="flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-default bg-default shadow-xs">
    <div
      ref="gridElement"
      class="relative grid min-h-0 flex-1 content-start gap-3 overflow-y-auto p-4"
      :style="{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }"
      @dragover.prevent="onDragOver"
      @dragleave="onDragLeave"
      @drop.prevent="onDrop"
    >
      <div
        v-if="guides"
        aria-hidden="true"
        class="pointer-events-none absolute inset-4 grid gap-3"
        :style="{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }"
      >
        <div v-for="column in columns" :key="column" class="rounded-xs bg-primary/5" />
      </div>

      <template v-for="(field, index) in fields" :key="field.id">
        <div v-if="dropIndex === index" class="pointer-events-none h-1 rounded-full bg-primary" style="grid-column: 1 / -1" />
        <div
          :ref="(element: unknown) => setBlockElement(field.id, element)"
          class="group relative rounded-sm border bg-default p-3 transition-opacity"
          :class="[
            selectedId === field.id ? 'border-primary' : 'border-default hover:border-accented',
            draggingId === field.id ? 'opacity-40' : '',
          ]"
          :style="{ gridColumn: `span ${effectiveSpan(field, breakpoint)}`, cursor: draggingId === field.id ? 'grabbing' : 'grab' }"
          draggable="true"
          @dragstart="onBlockDragStart(field, $event)"
          @dragend="onDragEnd"
          @pointerdown="emit('select', field.id)"
        >
          <div class="flex items-center gap-2">
            <span class="grid size-5 shrink-0 place-items-center rounded-xs bg-elevated text-[10px] font-semibold text-dimmed">{{ index + 1 }}</span>
            <UIcon :name="formFieldKindIcon(field.kind)" class="size-3.5 shrink-0 text-dimmed" />
            <p class="min-w-0 flex-1 truncate text-xs font-medium text-highlighted">{{ field.label || field.key }}</p>
            <span v-if="field.required" class="text-xs leading-none text-error">*</span>
            <span v-if="resizingId === field.id" class="rounded-xs bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">{{ fractionLabel(resizingSpan) }}</span>
            <span
              v-else
              class="rounded-xs px-1.5 py-0.5 text-[10px] font-medium"
              :class="field.overrides[breakpoint] !== undefined ? 'bg-primary/10 text-primary' : 'text-dimmed'"
              :title="field.overrides[breakpoint] !== undefined ? `Overridden for ${breakpoint} — drag to ${fractionLabel(field.span)} to reset` : 'Default width'"
            >{{ fractionLabel(effectiveSpan(field, breakpoint)) }}</span>
            <UButton
              icon="i-lucide-x"
              size="xs"
              color="neutral"
              variant="ghost"
              class="opacity-0 group-hover:opacity-100"
              aria-label="Remove field"
              @click.stop="emit('remove', field.id)"
            />
          </div>

          <div class="pointer-events-none mt-2.5">
            <UInput
              v-if="field.kind === 'text' || field.kind === 'number' || field.kind === 'date'"
              :type="field.kind === 'number' ? 'number' : field.kind === 'date' ? 'date' : 'text'"
              :placeholder="field.placeholder || previewPlaceholder(field.kind)"
              readonly
              class="w-full"
            />
            <UTextarea
              v-else-if="field.kind === 'textarea'"
              :rows="Math.min(field.rows, 5)"
              :placeholder="field.placeholder || 'Multi-line text'"
              readonly
              class="w-full"
            />
            <USelect v-else-if="field.kind === 'select'" :items="field.options" placeholder="Choose an option" disabled class="w-full" />
            <UCheckbox v-else :model-value="false" :label="field.label || 'Checkbox'" disabled />
          </div>

          <div
            class="absolute inset-y-1 -right-1 z-20 flex w-2.5 cursor-col-resize touch-none items-center justify-center rounded-full transition-opacity"
            :class="selectedId === field.id || resizingId === field.id ? 'opacity-100' : 'bg-accented opacity-0 group-hover:opacity-100'"
            role="separator"
            aria-orientation="vertical"
            :aria-label="`Resize ${field.label || field.key} width`"
            @pointerdown.prevent="startResize(field, $event)"
          >
            <span v-if="selectedId === field.id || resizingId === field.id" class="h-8 w-1 rounded-full bg-primary" />
          </div>
        </div>
      </template>

      <div v-if="dropIndex === fields.length" class="pointer-events-none h-1 rounded-full bg-primary" style="grid-column: 1 / -1" />

      <div
        v-if="fields.length === 0"
        class="grid place-items-center rounded-md border-2 border-dashed border-accented px-6 py-16 text-center"
        style="grid-column: 1 / -1"
      >
        <div>
          <UIcon name="i-lucide-plus" class="size-5 text-dimmed" />
          <p class="mt-2 text-sm font-medium text-muted">No fields yet</p>
          <p class="mt-1 text-xs text-dimmed">Click a field in the palette or drag it onto the canvas.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  clampSpan,
  effectiveSpan,
  formBreakpointConfigs,
  formFieldDragMime,
  formFieldKindIcon,
  fractionLabel,
  type BuilderField,
  type FormBuilderBreakpoint,
  type FormFieldKind,
} from "~/utils/form-builder";

const props = defineProps<{
  fields: BuilderField[];
  breakpoint: FormBuilderBreakpoint;
  selectedId: string | null;
  guides: boolean;
}>();

const emit = defineEmits<{
  select: [id: string];
  remove: [id: string];
  addAt: [kind: FormFieldKind, index: number];
  moveTo: [id: string, index: number];
  resize: [id: string, span: number];
}>();

const columns = computed(() => formBreakpointConfigs[props.breakpoint].columns);
const gridElement = useTemplateRef<HTMLDivElement>("gridElement");

// Blocks keyed by field id, so drag-over hit testing follows the rendered
// order without depending on template ref invocation order.
const blockElements = new Map<string, HTMLElement>();

function setBlockElement(fieldId: string, element: unknown) {
  if (element instanceof HTMLElement) blockElements.set(fieldId, element);
  else blockElements.delete(fieldId);
}

const draggingId = ref<string | null>(null);
const dropIndex = ref<number | null>(null);
const resizingId = ref<string | null>(null);
const resizingSpan = ref(12);

type BlockRect = { index: number; left: number; right: number; top: number; bottom: number };

function blockRects(): BlockRect[] {
  return props.fields
    .map((field, index) => ({ element: blockElements.get(field.id), index }))
    .filter((block): block is { element: HTMLElement; index: number } => block.element instanceof HTMLElement)
    .map(({ element, index }) => {
      const rect = element.getBoundingClientRect();
      return { index, left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
    });
}

// Insertion point in the flat field order: find the row the pointer is in
// (rows detected via shared grid top), then count blocks left of the pointer.
function computeInsertionIndex(x: number, y: number): number {
  const blocks = blockRects().sort((a, b) => a.top - b.top || a.left - b.left);
  const rows: BlockRect[][] = [];
  let rowTop: number | undefined;
  for (const block of blocks) {
    if (rowTop !== undefined && Math.abs(rowTop - block.top) < 4) rows.at(-1)?.push(block);
    else {
      rows.push([block]);
      rowTop = block.top;
    }
  }

  for (const row of rows) {
    const rowBottom = Math.max(...row.map(block => block.bottom));
    if (y > rowBottom + 6) continue;
    const blockAfterPointer = row.filter(block => block.left + (block.right - block.left) / 2 <= x).at(-1);
    const firstInRow = row[0];
    return blockAfterPointer ? blockAfterPointer.index + 1 : (firstInRow?.index ?? blocks.length);
  }
  return blocks.length;
}

function onDragOver(event: DragEvent) {
  if (!event.dataTransfer) return;
  event.dataTransfer.dropEffect = "copy";
  dropIndex.value = computeInsertionIndex(event.clientX, event.clientY);
}

function onDragLeave(event: DragEvent) {
  if (gridElement.value?.contains(event.relatedTarget as Node)) return;
  dropIndex.value = null;
}

function onBlockDragStart(field: BuilderField, event: DragEvent) {
  draggingId.value = field.id;
  event.dataTransfer?.setData(formFieldDragMime, JSON.stringify({ op: "move", id: field.id }));
  if (event.dataTransfer) event.dataTransfer.effectAllowed = "copy";
}

function onDragEnd() {
  draggingId.value = null;
  dropIndex.value = null;
}

function onDrop(event: DragEvent) {
  const index = dropIndex.value ?? props.fields.length;
  onDragEnd();

  const rawPayload = event.dataTransfer?.getData(formFieldDragMime);
  if (!rawPayload) return;
  try {
    const payload = JSON.parse(rawPayload) as { op?: string; id?: string; kind?: FormFieldKind };
    if (payload.op === "add" && payload.kind) emit("addAt", payload.kind, index);
    else if (payload.op === "move" && payload.id) emit("moveTo", payload.id, index);
  }
  catch {
    return;
  }
}

// Span resizing: pointer capture on the full-height edge handle, span derived
// from pointer travel in column-width units. The live fraction badge on the
// block header mirrors the span the drag would commit.
function startResize(field: BuilderField, event: PointerEvent) {
  const handle = event.currentTarget;
  const grid = gridElement.value;
  if (!(handle instanceof HTMLElement) || !grid) return;
  const target: HTMLElement = handle;

  target.setPointerCapture(event.pointerId);
  const startX = event.clientX;
  const startSpan = effectiveSpan(field, props.breakpoint);
  const styles = getComputedStyle(grid);
  const contentWidth = grid.clientWidth - Number.parseFloat(styles.paddingLeft) - Number.parseFloat(styles.paddingRight);
  const columnGap = Number.parseFloat(styles.columnGap) || 0;
  const columnStride = (contentWidth - (columns.value - 1) * columnGap) / columns.value + columnGap;

  resizingId.value = field.id;
  resizingSpan.value = startSpan;

  function onResizeMove(moveEvent: PointerEvent) {
    const spanDelta = Math.round((moveEvent.clientX - startX) / columnStride);
    resizingSpan.value = clampSpan(startSpan + spanDelta);
    emit("resize", field.id, resizingSpan.value);
  }

  function stopResize() {
    target.removeEventListener("pointermove", onResizeMove);
    target.removeEventListener("pointerup", stopResize);
    target.removeEventListener("pointercancel", stopResize);
    resizingId.value = null;
  }

  target.addEventListener("pointermove", onResizeMove);
  target.addEventListener("pointerup", stopResize);
  target.addEventListener("pointercancel", stopResize);
}

function previewPlaceholder(kind: FormFieldKind): string {
  if (kind === "number") return "42";
  if (kind === "date") return "";
  return "Single-line text";
}
</script>
