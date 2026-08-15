<template>
  <div class="flex min-h-screen bg-default">
    <aside class="w-full max-w-sm shrink-0 overflow-y-auto border-r border-default px-5 py-6 sm:px-6">
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="text-sm font-semibold text-highlighted">Glass order</p>
          <p class="mt-1 text-xs leading-5 text-muted">Select a field to locate its source in the document.</p>
        </div>
        <UBadge color="warning" variant="subtle" size="sm">Draft</UBadge>
      </div>

      <USeparator class="my-6" />

      <form class="space-y-4" @submit.prevent>
        <div :class="fieldClass('project')" @focusin="activeField = 'project'">
          <UFormField label="1 · Project" name="project" orientation="horizontal" :ui="horizontalFieldUi">
            <UInput v-model="documentData.project" class="w-full" />
          </UFormField>
        </div>

        <div :class="fieldClass('position')" @focusin="activeField = 'position'">
          <UFormField label="2 · Position" name="position" orientation="horizontal" :ui="horizontalFieldUi">
            <UTextarea v-model="documentData.position" class="w-full" :rows="3" />
          </UFormField>
        </div>

        <div :class="fieldClass('glass-type')" @focusin="activeField = 'glass-type'">
          <UFormField label="3 · Glass type" name="glass-type" orientation="horizontal" :ui="horizontalFieldUi">
            <UTextarea v-model="documentData.glassType" class="w-full" :rows="3" />
          </UFormField>
        </div>

        <div :class="fieldClass('glass-build-up')" @focusin="activeField = 'glass-build-up'">
          <UFormField label="4 · Glass build-up" name="glass-build-up" orientation="horizontal" :ui="horizontalFieldUi">
            <UTextarea v-model="documentData.glassBuildUp" class="w-full" :rows="5" />
          </UFormField>
        </div>

        <div :class="fieldClass('remark')" @focusin="activeField = 'remark'">
          <UFormField label="5 · Remark" name="remark" orientation="horizontal" :ui="horizontalFieldUi">
            <UInput v-model="documentData.remark" class="w-full" />
          </UFormField>
        </div>
      </form>

      <div class="sticky bottom-0 mt-7 border-t border-default bg-default pt-4">
        <UButton block label="Save document" />
      </div>
    </aside>

    <main ref="viewerElement" class="min-w-0 flex-1 overflow-hidden bg-elevated/40 p-5 sm:p-8">
      <div class="mx-auto mb-4 flex max-w-[55rem] items-center justify-between gap-4">
        <div class="min-w-0">
          <p class="truncate text-xs font-medium text-highlighted">Glas-Bestellung · 1. Tour · Packliste EG</p>
          <p class="mt-1 text-xs text-muted">Page 1 of 4 · {{ activeFieldLabel }}</p>
        </div>
        <div class="flex items-center gap-1">
          <UButton color="neutral" variant="ghost" icon="i-lucide-rotate-ccw" label="Reset view" @click="resetPdfZoom" />
        </div>
      </div>

      <article class="relative mx-auto aspect-[210/297] w-full max-w-[55rem] overflow-hidden border border-default bg-default">
        <div ref="panzoomTarget" class="absolute inset-0">
          <img
            class="size-full object-contain"
            src="/documents/glas-packliste-page-1.png"
            alt="First page of the glass order packing list"
          >

          <div
            v-if="activeOverlay"
            class="pointer-events-none absolute border-2 border-primary bg-primary/5"
            :style="boundingBoxStyle(activeOverlay.bounds)"
          >
            <span class="absolute -top-5 left-0 bg-primary px-1.5 py-0.5 text-[10px] leading-none whitespace-nowrap text-inverted" :style="boundingBoxLabelStyle">
              {{ activeOverlay.index }} · {{ activeOverlay.label }}
            </span>
          </div>

          <button
            v-for="field in overlayFields"
            :key="field.id"
            :ref="(element: Element | null) => setMarkerElement(field.id, element)"
            class="panzoom-exclude absolute grid size-5 place-items-center border transition-colors"
            :class="field.id === activeField ? 'border-primary bg-primary text-inverted' : 'border-primary/70 bg-default text-primary hover:bg-primary/10'"
            :style="markerStyle(field.position, field.id)"
            type="button"
            :aria-label="`Locate ${field.label}`"
            @click="activeField = field.id"
          >
            <span class="text-[10px] leading-none font-medium">{{ field.index }}</span>
          </button>
        </div>
      </article>
    </main>
  </div>
</template>

<script setup lang="ts">
import Panzoom, { type PanzoomObject } from "@panzoom/panzoom";
const documentData = reactive({
  project: "2025-9467 · NB Kita Münster-Sarmsheim",
  position: "1.4 (105) / 1.4a (106) / 1.5 (107) / 1.6 (108)",
  glassType: "GT1 VSG 6 (0,38) / Float 4 / VSG 6 (0,38)",
  glassBuildUp: "Outside 6 VSG from Float 0,38\nMiddle 4 Floatglass\nInside 6 VSG from Float 0,38\nTotal ~51 mm",
  remark: "Sonnenschutzglas g=0,4",
});

const activeField = ref("project");
const defaultZoom = 100;
const minZoom = 100;
const maxZoom = 400;
const documentScale = ref(defaultZoom / 100);
const markerElements = new Map<string, HTMLElement>();
const markerOffsets = reactive<Record<string, number>>({});
const viewerElement = useTemplateRef<HTMLElement>("viewerElement");
const panzoomTarget = useTemplateRef<HTMLElement>("panzoomTarget");
let panzoom: PanzoomObject | undefined;
const horizontalFieldUi = {
  root: "grid grid-cols-[7rem_minmax(0,1fr)] items-start gap-3",
  labelWrapper: "pt-2 text-left",
  label: "text-xs font-normal text-muted",
  container: "w-full min-w-0 justify-self-end",
};

const overlayFields = [
  {
    id: "project",
    index: 1,
    label: "Project",
    position: { top: "15.5%", left: "0" },
    bounds: { top: "15.5%", left: "36%", width: "38%", height: "2.4%" },
  },
  {
    id: "position",
    index: 2,
    label: "Position",
    position: { top: "19.5%", left: "0" },
    bounds: { top: "17.8%", left: "36%", width: "56%", height: "4.4%" },
  },
  {
    id: "glass-type",
    index: 3,
    label: "Glass type",
    position: { top: "24%", left: "0" },
    bounds: { top: "23.9%", left: "40%", width: "43%", height: "2.2%" },
  },
  {
    id: "glass-build-up",
    index: 4,
    label: "Glass build-up",
    position: { top: "28%", left: "0" },
    bounds: { top: "26.5%", left: "40%", width: "42%", height: "14.5%" },
  },
  {
    id: "remark",
    index: 5,
    label: "Remark",
    position: { top: "47%", left: "0" },
    bounds: { top: "46.6%", left: "40%", width: "31%", height: "2.1%" },
  },
];

const activeFieldLabel = computed(() => overlayFields.find(field => field.id === activeField.value)?.label ?? "Document field");
const activeOverlay = computed(() => overlayFields.find(field => field.id === activeField.value));

function fieldClass(fieldId: string) {
  return activeField.value === fieldId ? "-m-2 rounded-sm bg-primary/10 p-2" : "-m-2 p-2";
}

function resetPdfZoom() {
  panzoom?.zoom(defaultZoom / 100, { animate: false });
  panzoom?.pan(0, 0, { animate: false });
}

function overlayStyle(position: Record<string, string>) {
  return {
    ...position,
    transform: `scale(${1 / documentScale.value})`,
    transformOrigin: "top left",
  };
}

function boundingBoxStyle(bounds: Record<string, string>) {
  return {
    ...bounds,
    borderWidth: `${2 / documentScale.value}px`,
  };
}

const boundingBoxLabelStyle = computed(() => ({
  transform: `scale(${1 / documentScale.value})`,
  transformOrigin: "bottom left",
}));

function markerStyle(position: Record<string, string>, fieldId: string) {
  const offset = markerOffsets[fieldId] ?? 0;

  return {
    ...overlayStyle(position),
    transform: `translateY(${offset / documentScale.value}px) scale(${1 / documentScale.value})`,
  };
}

function setMarkerElement(fieldId: string, element: Element | null) {
  if (element instanceof HTMLElement) markerElements.set(fieldId, element);
  else markerElements.delete(fieldId);
}

async function layoutMarkers() {
  for (const field of overlayFields) markerOffsets[field.id] = 0;
  await nextTick();

  let previousBottom = Number.NEGATIVE_INFINITY;

  for (const field of overlayFields) {
    const marker = markerElements.get(field.id);
    if (!marker) continue;

    const markerBounds = marker.getBoundingClientRect();
    const offset = Math.max(0, previousBottom + 1 - markerBounds.top);

    markerOffsets[field.id] = offset;
    previousBottom = markerBounds.bottom + offset;
  }
}

onMounted(() => {
  const target = panzoomTarget.value;
  const viewer = viewerElement.value;
  if (!target || !viewer) return;

  panzoom = Panzoom(target, { canvas: true, cursor: "grab", maxScale: maxZoom / 100, minScale: minZoom / 100, step: 0.25 });
  viewer.addEventListener("wheel", panzoom.zoomWithWheel);
  target.addEventListener("panzoomchange", (event) => {
    documentScale.value = (event as CustomEvent<{ scale: number }>).detail.scale;
    void layoutMarkers();
  });
  window.addEventListener("resize", layoutMarkers);
  void layoutMarkers();
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", layoutMarkers);
  panzoom?.destroy();
});
</script>
