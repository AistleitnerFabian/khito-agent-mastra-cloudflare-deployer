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

    <main ref="viewerElement" class="flex min-w-0 flex-1 flex-col overflow-hidden bg-elevated">
      <article class="flex min-h-0 flex-1 flex-col overflow-hidden bg-elevated">
        <div class="flex items-center justify-between gap-4 border-b border-default px-4 py-3">
          <div class="min-w-0">
            <p class="truncate text-xs font-medium text-highlighted">Glas-Bestellung · 1. Tour · Packliste EG</p>
            <p class="mt-1 text-xs text-muted">Page 1 of 4 · {{ activeFieldLabel }}</p>
          </div>
          <UButton
            class="shrink-0"
            color="neutral"
            variant="outline"
            size="sm"
            icon="i-lucide-rotate-ccw"
            label="Reset to 100%"
            :disabled="documentScale === defaultZoom / 100"
            @click="resetPdfZoom"
          />
        </div>

        <div class="relative min-h-0 flex-1 overflow-hidden">
          <div ref="panzoomTarget" class="absolute inset-0 p-3">
            <div class="relative mx-auto aspect-[1191/1684] h-full max-w-full">
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
                <span class="absolute left-0 bg-primary px-1.5 py-0.5 text-[10px] leading-none whitespace-nowrap text-inverted" :style="boundingBoxLabelStyle">
                  {{ activeOverlay.index }} · {{ activeOverlay.label }}
                </span>
              </div>

            </div>
          </div>

          <div class="pointer-events-none absolute inset-0 z-10">
            <button
              v-for="field in overlayFields"
              :key="field.id"
              class="panzoom-exclude pointer-events-auto absolute grid size-6 -translate-y-1/2 place-items-center border text-xs font-medium transition-colors"
              :class="field.id === activeField ? 'border-primary bg-primary text-inverted' : 'border-primary/70 bg-default text-primary hover:bg-primary/10'"
              :style="markerStyle(field)"
              type="button"
              :aria-label="`Locate ${field.label}`"
              @click="activeField = field.id"
            >
              {{ field.index }}
            </button>
          </div>
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
const viewerElement = useTemplateRef<HTMLElement>("viewerElement");
const panzoomTarget = useTemplateRef<HTMLElement>("panzoomTarget");
let panzoom: PanzoomObject | undefined;
let zoomWithWheel: PanzoomObject["zoomWithWheel"] | undefined;
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
    bounds: { top: "15.8%", left: "27%", width: "32%", height: "2.2%" },
  },
  {
    id: "position",
    index: 2,
    label: "Position",
    position: { top: "19.5%", left: "0" },
    bounds: { top: "17.4%", left: "27%", width: "62%", height: "4.3%" },
  },
  {
    id: "glass-type",
    index: 3,
    label: "Glass type",
    position: { top: "24%", left: "0" },
    bounds: { top: "23%", left: "39%", width: "32%", height: "2.4%" },
  },
  {
    id: "glass-build-up",
    index: 4,
    label: "Glass build-up",
    position: { top: "28%", left: "0" },
    bounds: { top: "24.4%", left: "39%", width: "36%", height: "18.4%" },
  },
  {
    id: "remark",
    index: 5,
    label: "Remark",
    position: { top: "47%", left: "0" },
    bounds: { top: "47.1%", left: "39%", width: "19%", height: "2.3%" },
  },
];

const activeFieldLabel = computed(() => overlayFields.find(field => field.id === activeField.value)?.label ?? "Document field");
const activeOverlay = computed(() => overlayFields.find(field => field.id === activeField.value));
const markerPositions = ref<Record<string, { top: string; left: string }>>({});

function fieldClass(fieldId: string) {
  return activeField.value === fieldId ? "-m-2 rounded-sm bg-primary/10 p-2" : "-m-2 p-2";
}

function resetPdfZoom() {
  panzoom?.reset({ animate: false });
  documentScale.value = defaultZoom / 100;
}

function boundingBoxStyle(bounds: Record<string, string>) {
  return {
    ...bounds,
    borderWidth: `${2 / documentScale.value}px`,
  };
}

function markerStyle(field: typeof overlayFields[number]) {
  return markerPositions.value[field.id] ?? field.position;
}

function updateMarkerPositions() {
  const target = panzoomTarget.value;
  const canvas = target?.parentElement;
  const document = target?.firstElementChild;
  if (!canvas || !document) return;

  const canvasBounds = canvas.getBoundingClientRect();
  const documentBounds = document.getBoundingClientRect();
  const markerLeft = Math.max(0, documentBounds.left - canvasBounds.left);

  markerPositions.value = Object.fromEntries(overlayFields.map((field) => {
    const top = documentBounds.top - canvasBounds.top + (documentBounds.height * Number.parseFloat(field.position.top) / 100);
    return [field.id, { top: `${top}px`, left: `${markerLeft}px` }];
  }));
}

function handlePanzoomChange(event: Event) {
  documentScale.value = (event as CustomEvent<{ scale: number }>).detail.scale;
  nextTick(updateMarkerPositions);
}

const boundingBoxLabelStyle = computed(() => ({
  top: "0px",
  transform: `scale(${1 / documentScale.value}) translateY(-100%)`,
  transformOrigin: "top left",
}));

onMounted(() => {
  const target = panzoomTarget.value;
  const viewer = viewerElement.value;
  if (!target || !viewer) return;

  panzoom = Panzoom(target, {
    canvas: true,
    contain: "outside",
    cursor: "grab",
    maxScale: maxZoom / 100,
    minScale: minZoom / 100,
    panOnlyWhenZoomed: true,
    step: 0.25,
  });
  zoomWithWheel = panzoom.zoomWithWheel;
  viewer.addEventListener("wheel", zoomWithWheel);
  target.addEventListener("panzoomchange", handlePanzoomChange);
  window.addEventListener("resize", updateMarkerPositions);
  nextTick(updateMarkerPositions);
});

onBeforeUnmount(() => {
  if (zoomWithWheel) viewerElement.value?.removeEventListener("wheel", zoomWithWheel);
  panzoomTarget.value?.removeEventListener("panzoomchange", handlePanzoomChange);
  window.removeEventListener("resize", updateMarkerPositions);
  panzoom?.destroy();
});
</script>
