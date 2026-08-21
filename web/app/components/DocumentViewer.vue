<template>
  <article ref="viewerRoot" class="flex min-h-0 flex-1 flex-col overflow-hidden bg-elevated">
    <div v-if="!hudHidden" class="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 border-b border-default px-4 py-3">
      <div class="min-w-0">
        <p class="truncate text-xs font-medium text-highlighted">{{ detail.name }}</p>
        <p class="mt-1 text-xs text-muted">{{ activeFieldLabel }}</p>
      </div>

      <div class="flex items-center gap-0.5">
        <UButton
          color="neutral"
          variant="ghost"
          size="xs"
          icon="i-lucide-chevron-left"
          aria-label="Previous page"
          :disabled="activePage <= 1"
          @click="activePage--"
        />
        <span class="min-w-14 text-center text-xs font-medium text-highlighted tabular-nums">{{ activePage }} / {{ totalPages }}</span>
        <UButton
          color="neutral"
          variant="ghost"
          size="xs"
          icon="i-lucide-chevron-right"
          aria-label="Next page"
          :disabled="activePage >= totalPages"
          @click="activePage++"
        />
      </div>

      <div class="flex items-center justify-end gap-1">
        <UButton
          color="neutral"
          variant="outline"
          size="sm"
          icon="i-lucide-rotate-ccw"
          label="Reset to 100%"
          @click="resetPdfZoom"
        />
        <UButton
          v-if="canPopOut"
          color="neutral"
          variant="outline"
          size="sm"
          icon="i-lucide-external-link"
          aria-label="Open document in separate window"
          @click="emit('popout')"
        />
      </div>
    </div>

    <div class="relative min-h-0 flex-1 overflow-hidden">
      <div ref="panzoomTarget" class="absolute inset-0 p-3">
        <div
          class="relative mx-auto h-full max-w-full"
          :style="{ aspectRatio: pageAspectRatio }"
        >
          <canvas ref="pdfCanvas" class="size-full object-contain" />

          <template v-if="!hudHidden">
            <div
              v-for="(bound, boundIndex) in activeFieldBounds"
              :key="boundIndex"
              class="pointer-events-none absolute bg-primary/20"
              :style="boundStyle(bound)"
            >
              <span
                v-if="boundIndex === 0"
                class="absolute left-0 bg-primary px-1.5 py-0.5 text-[10px] leading-none whitespace-nowrap text-inverted"
                :style="boundingBoxLabelStyle"
              >
                {{ activeFieldIndex }} · {{ activeFieldLabel }}
              </span>
            </div>
          </template>
        </div>
      </div>

      <div v-if="!hudHidden" class="pointer-events-none absolute inset-0 z-10">
        <button
          v-for="marker in pageMarkers"
          :key="marker.id"
          class="panzoom-exclude pointer-events-auto absolute grid size-6 -translate-y-1/2 place-items-center border text-xs font-medium transition-colors"
          :class="marker.id === activeField ? 'border-primary bg-primary text-inverted' : 'border-primary/70 bg-default text-primary hover:bg-primary/10'"
          :style="markerStyle(marker)"
          type="button"
          :aria-label="`Locate ${marker.label}`"
          @click="activeField = marker.id"
        >
          {{ marker.index }}
        </button>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { PDFDocumentLoadingTask, PDFDocumentProxy } from "pdfjs-dist";
import Panzoom, { type PanzoomObject } from "@panzoom/panzoom";
import { documentDataFields, type DocumentDataField, type DocumentFieldBounds } from "@khito/shared/documents";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import type { DocumentDetail } from "~/types/documents";

const props = defineProps<{
  detail: DocumentDetail;
  canPopOut?: boolean;
  /** Hides all viewer HUD — header, field markers and bounding boxes — while
   * the inline viewer is covered by the blur overlay, so only the PDF itself
   * appears blurred instead of smeared overlays. */
  hudHidden?: boolean;
}>();

const activeField = defineModel<DocumentDataField>("activeField", { required: true });
const emit = defineEmits<{ popout: [] }>();

const { getToken } = useAuth();

const activePage = ref(1);
const totalPages = ref(props.detail.pageCount);
const pageAspectRatio = ref(1191 / 1684);
const pdfCanvas = useTemplateRef<HTMLCanvasElement>("pdfCanvas");
let pdfLoadingTask: PDFDocumentLoadingTask | undefined;
let pdfDocument: PDFDocumentProxy | undefined;
let renderToken = 0;

const viewerRoot = useTemplateRef<HTMLElement>("viewerRoot");
const panzoomTarget = useTemplateRef<HTMLElement>("panzoomTarget");
let panzoom: PanzoomObject | undefined;
let zoomWithWheel: PanzoomObject["zoomWithWheel"] | undefined;

const defaultZoom = 100;
const minZoom = 100;
const maxZoom = 400;
const documentScale = ref(defaultZoom / 100);

const activeFieldBounds = computed(() => (props.detail.bounds[activeField.value] ?? []).filter(bound => bound.pageNo === activePage.value));
const activeFieldLabel = computed(() => documentDataFields.find(field => field.id === activeField.value)?.label ?? "Document field");
const activeFieldIndex = computed(() => documentDataFields.find(field => field.id === activeField.value)?.index ?? "");
const pageMarkers = computed(() => {
  return documentDataFields
    .map(field => ({ field, bound: (props.detail.bounds[field.id] ?? []).find(bound => bound.pageNo === activePage.value) }))
    .filter((entry): entry is { field: typeof documentDataFields[number]; bound: DocumentFieldBounds } => entry.bound !== undefined)
    .map(({ field, bound }) => ({ id: field.id, index: field.index, label: field.label, top: bound.top }));
});

function boundStyle(bound: DocumentFieldBounds) {
  return {
    top: `${bound.top - verticalBoxPadding()}%`,
    left: `${bound.left - horizontalBoxPadding()}%`,
    width: `${bound.width + 2 * horizontalBoxPadding()}%`,
    height: `${bound.height + 2 * verticalBoxPadding()}%`,
  };
}

const boundingBoxPadding = 2;
// Page size normalized to 100% zoom: the padding percentage is stable in page
// space, so the rendered padding scales with the panzoom scale.
const pageSize = ref({ width: 0, height: 0 });

function horizontalBoxPadding() {
  return pageSize.value.width > 0 ? boundingBoxPadding / pageSize.value.width * 100 : 0;
}

function verticalBoxPadding() {
  return pageSize.value.height > 0 ? boundingBoxPadding / pageSize.value.height * 100 : 0;
}

function markerStyle(marker: { id: DocumentDataField; top: number }) {
  return markerPositions.value[marker.id] ?? { top: `${marker.top}%`, left: "0" };
}

const markerPositions = ref<Record<string, { top: string; left: string }>>({});

function updateMarkerPositions() {
  const target = panzoomTarget.value;
  const canvas = target?.parentElement;
  const page = target?.firstElementChild;
  if (!canvas || !page) return;

  const canvasBounds = canvas.getBoundingClientRect();
  const pageBounds = page.getBoundingClientRect();
  pageSize.value = {
    width: pageBounds.width / documentScale.value,
    height: pageBounds.height / documentScale.value,
  };
  const markerLeft = Math.max(0, pageBounds.left - canvasBounds.left);
  const positions: Record<string, { top: string; left: string }> = {};

  for (const marker of pageMarkers.value) {
    const top = pageBounds.top - canvasBounds.top + pageBounds.height * marker.top / 100;
    positions[marker.id] = { top: `${top}px`, left: `${markerLeft}px` };
  }

  markerPositions.value = positions;
}

function resetPdfZoom() {
  panzoom?.reset({ animate: false });
  documentScale.value = defaultZoom / 100;
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

async function loadPdf() {
  const detail = props.detail;
  if (!detail.contentType.includes("pdf")) return;

  const token = await getToken.value();
  const response = await fetch(`/api/documents/${detail.id}/source`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    throw new Error("The document preview could not be loaded.");
  }

  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  pdfLoadingTask = pdfjs.getDocument({ data: await response.arrayBuffer() });
  pdfDocument = await pdfLoadingTask.promise;
  totalPages.value = pdfDocument.numPages;

  await renderActivePage();
}

async function renderActivePage() {
  const canvas = pdfCanvas.value;
  const page = pdfDocument ? await pdfDocument.getPage(activePage.value) : undefined;
  if (!canvas || !page) return;

  const token = ++renderToken;
  const scale = 2;
  const viewport = page.getViewport({ scale });
  const context = canvas.getContext("2d");
  if (!context) return;

  canvas.width = viewport.width;
  canvas.height = viewport.height;
  pageAspectRatio.value = viewport.width / viewport.height;

  await page.render({ canvas, viewport }).promise;

  if (token === renderToken) {
    nextTick(updateMarkerPositions);
  }
}

function initViewer() {
  const target = panzoomTarget.value;
  const viewer = viewerRoot.value;
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
  nextTick(updateMarkerPositions);
}

// Field markers are derived from live layout: pan/zoom transforms, the form
// sidebar drag and its CSS transition, window and popup-window resizes,
// aspect-ratio changes. Instead of chasing every possible layout source, the
// positions are re-measured every animation frame — two getBoundingClientRect
// calls plus arithmetic stay far below a frame budget, and the loop cannot miss
// a layout change the way individual listeners did.
let markersAnimationFrame = 0;

function markersFrame() {
  updateMarkerPositions();
  markersAnimationFrame = requestAnimationFrame(markersFrame);
}

watch(activePage, () => {
  void renderActivePage();
});

watch(activeField, () => {
  // Markers only exist for fields with a bound on the current page, so a
  // marker click must keep that page; navigating to the field's first bound
  // here used to teleport every marker click back to page 1. Selections from
  // the form or the popout window still jump to the first occurrence.
  const bounds = props.detail.bounds[activeField.value] ?? [];
  const firstBound = bounds[0];
  if (firstBound && !bounds.some(bound => bound.pageNo === activePage.value)) {
    activePage.value = firstBound.pageNo;
  }

  nextTick(updateMarkerPositions);
});

onMounted(async () => {
  markersAnimationFrame = requestAnimationFrame(markersFrame);

  await nextTick();
  await loadPdf();
  initViewer();
});

onBeforeUnmount(() => {
  cancelAnimationFrame(markersAnimationFrame);
  if (zoomWithWheel) viewerRoot.value?.removeEventListener("wheel", zoomWithWheel);
  panzoomTarget.value?.removeEventListener("panzoomchange", handlePanzoomChange);
  panzoom?.destroy();
  void pdfLoadingTask?.destroy();
});
</script>
