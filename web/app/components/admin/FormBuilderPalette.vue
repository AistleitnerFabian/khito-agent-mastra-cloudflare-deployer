<template>
  <aside class="flex w-44 shrink-0 flex-col gap-1 overflow-y-auto rounded-md border border-default bg-default p-2">
    <p class="px-2 pt-1 pb-2 text-xs font-semibold tracking-wide text-dimmed uppercase">Fields</p>
    <button
      v-for="entry in formFieldKindCatalog"
      :key="entry.kind"
      type="button"
      class="flex cursor-grab items-center gap-2.5 rounded-sm border border-default p-2.5 text-left transition-colors hover:border-primary/40 hover:bg-elevated active:cursor-grabbing"
      draggable="true"
      :title="entry.description"
      @dragstart="onDragStart(entry.kind, $event)"
      @click="emit('add', entry.kind)"
    >
      <UIcon :name="entry.icon" class="size-4 shrink-0 text-muted" />
      <span class="min-w-0">
        <span class="block truncate text-xs font-medium text-highlighted">{{ entry.label }}</span>
        <span class="block truncate text-[10px] text-dimmed">{{ entry.description }}</span>
      </span>
    </button>
    <p class="mt-2 px-2 text-[10px] leading-4 text-dimmed">Click to append, or drag onto the canvas to place.</p>
  </aside>
</template>

<script setup lang="ts">
import { formFieldDragMime, formFieldKindCatalog, type FormFieldKind } from "~/utils/form-builder";

const emit = defineEmits<{ add: [kind: FormFieldKind] }>();

function onDragStart(kind: FormFieldKind, event: DragEvent) {
  event.dataTransfer?.setData(formFieldDragMime, JSON.stringify({ op: "add", kind }));
  if (event.dataTransfer) event.dataTransfer.effectAllowed = "copy";
}
</script>
