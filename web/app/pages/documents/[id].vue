<template>
  <div v-if="loading || document?.extractionStatus === 'extracting'" class="flex min-h-screen items-center justify-center bg-default px-6 text-center">
    <div>
      <UIcon :name="loading ? 'i-lucide-loader-circle' : 'i-lucide-sparkles'" class="mx-auto size-6 animate-spin text-dimmed" />
      <p class="mt-3 text-sm font-medium text-highlighted">{{ loading ? "Loading document…" : "Khito is extracting…" }}</p>
      <p v-if="!loading" class="mt-1 text-sm text-muted">{{ document?.name }}</p>
    </div>
  </div>

  <div v-else-if="document?.extractionStatus === 'failed'" class="flex min-h-screen items-center justify-center bg-default px-6 text-center">
    <div>
      <UIcon name="i-lucide-circle-alert" class="mx-auto size-6 text-error" />
      <p class="mt-3 text-sm font-medium text-highlighted">Extraction failed</p>
      <p class="mt-2 max-w-md text-sm text-muted">{{ document.extractionError || "The document could not be extracted." }}</p>
      <UButton class="mt-4" size="xs" color="neutral" variant="outline" icon="i-lucide-arrow-left" label="Back to documents" to="/documents" />
    </div>
  </div>

  <div v-else-if="error" class="flex min-h-screen items-center justify-center bg-default px-6 text-center">
    <div>
      <UIcon name="i-lucide-circle-alert" class="mx-auto size-6 text-error" />
      <p class="mt-3 text-sm font-medium text-highlighted">{{ error }}</p>
      <UButton class="mt-4" size="xs" color="neutral" variant="outline" icon="i-lucide-arrow-left" label="Back to documents" to="/documents" />
    </div>
  </div>

  <div v-else-if="document" class="flex min-h-screen bg-default" :class="resizingSidebar ? 'cursor-col-resize select-none' : ''">
    <aside
      class="w-full shrink-0 overflow-y-auto border-r border-default px-5 py-6 sm:px-6"
      :class="resizingSidebar ? '' : 'transition-[max-width] duration-200 ease-out'"
      :style="{ maxWidth: sidebarExpanded ? sidebarExpandedWidth : `${sidebarWidth}px` }"
    >
      <UButton
        class="mb-4"
        color="neutral"
        variant="ghost"
        size="xs"
        icon="i-lucide-arrow-left"
        label="Documents"
        to="/documents"
      />

      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="truncate text-sm font-semibold text-highlighted">{{ document.name }}</p>
          <p class="mt-1 text-xs leading-5 text-muted">Select a field to locate its source in the document.</p>
        </div>
        <UBadge color="warning" variant="subtle" size="sm">Draft</UBadge>
      </div>

      <UFormField class="mt-4" label="Assigned to">
        <USelect v-model="documentAssignee" :items="assigneeOptions" class="w-full" />
      </UFormField>

      <USeparator class="my-6" />

      <form class="space-y-4" @submit.prevent>
        <div v-for="field in documentDataFields" :key="field.id" :class="fieldClass(field.id)" @focusin="selectField(field.id)">
          <UFormField :label="`${field.index} · ${field.label}`" :name="field.id" orientation="horizontal" :ui="horizontalFieldUi">
            <UTextarea v-model="documentData[field.id]" class="w-full" :rows="field.id === 'glassBuildUp' || field.id === 'position' ? 4 : 2" />
          </UFormField>
        </div>
      </form>

      <div class="sticky bottom-0 mt-7 border-t border-default bg-default pt-4">
        <UButton block label="Save document" :loading="saving" :disabled="!dirty" @click="saveDocument" />
        <p v-if="saveError" class="mt-2 text-xs text-error">{{ saveError }}</p>
        <p v-else-if="savedAt" class="mt-2 text-xs text-dimmed">Saved {{ formatSavedAt(savedAt) }}</p>
      </div>
    </aside>

    <div
      class="group relative hidden w-1 shrink-0 cursor-col-resize touch-none bg-default transition-colors hover:bg-primary/60 sm:block"
      :class="resizingSidebar ? 'bg-primary' : ''"
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize form sidebar"
      @pointerdown="startSidebarResize"
      @dblclick="resetSidebarWidth"
    >
      <span
        class="absolute top-1/2 left-1/2 h-4 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accented transition-colors group-hover:bg-primary"
        :class="resizingSidebar ? 'bg-primary' : ''"
      />
    </div>

    <main ref="viewerElement" class="relative hidden min-w-0 flex-1 flex-col overflow-hidden bg-elevated sm:flex">
      <div
        v-if="sidebarExpanded"
        class="absolute inset-0 z-20 grid cursor-pointer place-items-center bg-black/60"
        role="button"
        aria-label="Collapse form sidebar"
        @click="collapseSidebar"
      >
        <UIcon name="i-lucide-panel-left-close" class="size-5 text-white/70" />
      </div>

      <article v-if="document" class="flex min-h-0 flex-1 flex-col overflow-hidden bg-elevated">
        <div class="flex items-center justify-between gap-4 border-b border-default px-4 py-3">
          <div class="min-w-0">
            <p class="truncate text-xs font-medium text-highlighted">{{ document.name }}</p>
            <p class="mt-1 text-xs text-muted">Page {{ activePage }} of {{ totalPages }} · {{ activeFieldLabel }}</p>
          </div>
          <div class="flex shrink-0 items-center gap-1">
            <UButton
              color="neutral"
              variant="outline"
              size="sm"
              icon="i-lucide-chevron-left"
              aria-label="Previous page"
              :disabled="activePage <= 1"
              @click="activePage--"
            />
            <UButton
              color="neutral"
              variant="outline"
              size="sm"
              icon="i-lucide-chevron-right"
              aria-label="Next page"
              :disabled="activePage >= totalPages"
              @click="activePage++"
            />
            <UButton
              color="neutral"
              variant="outline"
              size="sm"
              icon="i-lucide-rotate-ccw"
              label="Reset to 100%"
              @click="resetPdfZoom"
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
            </div>
          </div>

          <div class="pointer-events-none absolute inset-0 z-10">
            <button
              v-for="marker in pageMarkers"
              :key="marker.id"
              class="panzoom-exclude pointer-events-auto absolute grid size-6 -translate-y-1/2 place-items-center border text-xs font-medium transition-colors"
              :class="marker.id === activeField ? 'border-primary bg-primary text-inverted' : 'border-primary/70 bg-default text-primary hover:bg-primary/10'"
              :style="markerStyle(marker)"
              type="button"
              :aria-label="`Locate ${marker.label}`"
              @click="selectField(marker.id)"
            >
              {{ marker.index }}
            </button>
          </div>
        </div>
      </article>
    </main>
  </div>
</template>

<script setup lang="ts">
import type { PDFDocumentLoadingTask, PDFDocumentProxy } from "pdfjs-dist";
import Panzoom, { type PanzoomObject } from "@panzoom/panzoom";
import { documentDataFields, documentDataFieldIds, type DocumentBounds, type DocumentExtractionStatus, type DocumentFieldBounds, type DocumentDataField, type ExtractedDocumentData } from "@khito/shared/documents";
import type { ExtractableDocumentType } from "@khito/shared/inbox";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

type DocumentDetail = {
  id: string;
  name: string;
  contentType: string;
  documentType: ExtractableDocumentType;
  assignee: string | null;
  data: ExtractedDocumentData;
  bounds: DocumentBounds;
  pageCount: number;
  extractionStatus: DocumentExtractionStatus;
  extractionError: string | null;
  createdAt: string;
  updatedAt: string;
};

const route = useRoute();
const clerkFetch = useClerkFetch();
const { getToken } = useAuth();

const document = ref<DocumentDetail | null>(null);
const loading = ref(true);
const error = ref("");
const saving = ref(false);
const saveError = ref("");
const savedAt = ref<Date | null>(null);
const documentAssignee = ref("Unassigned");
const assigneeOptions = ["Unassigned", "Fabian Aistleitner", "Lena Hoffmann", "Max Berger"];

function toEmptyDocumentData(): ExtractedDocumentData {
  return Object.fromEntries(documentDataFieldIds.map(fieldId => [fieldId, ""])) as ExtractedDocumentData;
}

const documentData = ref<ExtractedDocumentData>(toEmptyDocumentData());
const initialDataJson = ref("");
const activeField = ref<DocumentDataField>("project");

const activePage = ref(1);
const totalPages = ref(1);
const pageAspectRatio = ref(1191 / 1684);
const pdfCanvas = useTemplateRef<HTMLCanvasElement>("pdfCanvas");
let pdfLoadingTask: PDFDocumentLoadingTask | undefined;
let pdfDocument: PDFDocumentProxy | undefined;
let renderToken = 0;

const viewerElement = useTemplateRef<HTMLElement>("viewerElement");
const panzoomTarget = useTemplateRef<HTMLElement>("panzoomTarget");
let panzoom: PanzoomObject | undefined;
let zoomWithWheel: PanzoomObject["zoomWithWheel"] | undefined;

const defaultSidebarWidth = 384;
const sidebarMinWidth = 384;
const sidebarMaxWidth = 960;
// Percentage of the page root (content viewport, excluding the app sidebar),
// not vw — the aside's containing block is the flex row that fills the content area.
const sidebarExpandedWidth = "90%";
// How far past the max width the user must drag before the focus-mode snap engages.
const sidebarExpandSnapPadding = 160;
const sidebarWidth = useLocalStorage("khito:document-sidebar-width", defaultSidebarWidth);
const sidebarExpanded = ref(false);
const resizingSidebar = ref(false);
let sidebarDragOrigin = { pointerX: 0, width: defaultSidebarWidth };

function clampSidebarWidth(width: number) {
  return Math.round(Math.min(Math.max(width, sidebarMinWidth), Math.min(sidebarMaxWidth, window.innerWidth - 480)));
}

function startSidebarResize(event: PointerEvent) {
  resizingSidebar.value = true;
  sidebarDragOrigin = { pointerX: event.clientX, width: sidebarWidth.value };
}

function moveSidebarResize(event: PointerEvent) {
  if (!resizingSidebar.value) return;

  const draggedWidth = sidebarDragOrigin.width + event.clientX - sidebarDragOrigin.pointerX;

  if (draggedWidth > sidebarMaxWidth + sidebarExpandSnapPadding) {
    sidebarExpanded.value = true;
  }
  else {
    sidebarExpanded.value = false;
    sidebarWidth.value = clampSidebarWidth(draggedWidth);
  }

  nextTick(updateMarkerPositions);
}

function stopSidebarResize() {
  resizingSidebar.value = false;
}

function resetSidebarWidth() {
  sidebarExpanded.value = false;
  sidebarWidth.value = defaultSidebarWidth;
}

function collapseSidebar() {
  if (!sidebarExpanded.value) return;

  sidebarExpanded.value = false;
  sidebarWidth.value = sidebarMinWidth;
  nextTick(updateMarkerPositions);
}

const defaultZoom = 100;
const minZoom = 100;
const maxZoom = 400;
const documentScale = ref(defaultZoom / 100);

const horizontalFieldUi = {
  root: "grid grid-cols-[7rem_minmax(0,1fr)] items-start gap-3",
  labelWrapper: "pt-2 text-left",
  label: "text-xs font-normal text-muted",
  container: "w-full min-w-0 justify-self-end",
};

const dirty = computed(() => JSON.stringify(documentData.value) !== initialDataJson.value || (document.value?.assignee ?? "Unassigned") !== documentAssignee.value);
const activeFieldBounds = computed(() => (document.value?.bounds[activeField.value] ?? []).filter(bound => bound.pageNo === activePage.value));
const activeFieldLabel = computed(() => documentDataFields.find(field => field.id === activeField.value)?.label ?? "Document field");
const activeFieldIndex = computed(() => documentDataFields.find(field => field.id === activeField.value)?.index ?? "");
const pageMarkers = computed(() => {
  if (!document.value) return [];

  return documentDataFields
    .map(field => ({ field, bound: (document.value?.bounds[field.id] ?? []).find(bound => bound.pageNo === activePage.value) }))
    .filter((entry): entry is { field: typeof documentDataFields[number]; bound: DocumentFieldBounds } => entry.bound !== undefined)
    .map(({ field, bound }) => ({ id: field.id, index: field.index, label: field.label, top: bound.top }));
});

function fieldClass(fieldId: DocumentDataField) {
  return activeField.value === fieldId ? "-m-2 rounded-sm bg-primary/10 p-2" : "-m-2 p-2";
}

function selectField(fieldId: DocumentDataField) {
  activeField.value = fieldId;

  const firstBound = document.value?.bounds[fieldId]?.[0];
  if (firstBound && firstBound.pageNo !== activePage.value) {
    activePage.value = firstBound.pageNo;
  }
}

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

function formatSavedAt(time: Date) {
  return new Intl.DateTimeFormat(undefined, { timeStyle: "short" }).format(time);
}

async function loadDocument() {
  loading.value = true;
  error.value = "";

  try {
    const detail = await clerkFetch<DocumentDetail>(`/api/documents/${route.params.id}`);

    if (detail.extractionStatus === "extracting") {
      document.value = detail;
      loading.value = false;
      startExtractionPolling();
      return;
    }

    await applyDocument(detail);
  }
  catch (loadError) {
    error.value = loadError instanceof Error ? loadError.message : "The document could not be loaded.";
  }
  finally {
    loading.value = false;
  }
}

async function applyDocument(detail: DocumentDetail) {
  document.value = detail;
  // Leave the loading state before painting so the viewer branch — and its
  // canvas — is mounted when renderActivePage looks for it.
  loading.value = false;
  documentData.value = { ...detail.data };
  initialDataJson.value = JSON.stringify(detail.data);
  documentAssignee.value = detail.assignee ?? "Unassigned";
  totalPages.value = detail.pageCount;
  activeField.value = documentDataFields.find(field => detail.bounds[field.id]?.length)?.id ?? "project";

  await nextTick();
  await loadPdf();
}

let extractionPoller: number | undefined;

function startExtractionPolling() {
  extractionPoller = window.setInterval(async () => {
    try {
      const detail = await clerkFetch<DocumentDetail>(`/api/documents/${route.params.id}`);

      if (detail.extractionStatus !== "extracting") {
        stopExtractionPolling();
        await applyDocument(detail);
        await nextTick();
        await initViewer();
      }
    }
    catch {
      // Keep polling — the document detail endpoint may recover.
    }
  }, 3_000);
}

function stopExtractionPolling() {
  if (extractionPoller) {
    clearInterval(extractionPoller);
    extractionPoller = undefined;
  }
}

async function loadPdf() {
  const detail = document.value;
  if (!detail || !detail.contentType.includes("pdf")) return;

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

async function saveDocument() {
  if (!document.value) return;

  saving.value = true;
  saveError.value = "";

  try {
    document.value = await clerkFetch<DocumentDetail>(`/api/documents/${document.value.id}`, {
      method: "PATCH",
      body: { data: documentData.value, assignee: documentAssignee.value === "Unassigned" ? null : documentAssignee.value },
    });
    initialDataJson.value = JSON.stringify(document.value.data);
    savedAt.value = new Date();
  }
  catch (saveError_) {
    saveError.value = saveError_ instanceof Error ? saveError_.message : "The document could not be saved.";
  }
  finally {
    saving.value = false;
  }
}

watch(activePage, () => {
  void renderActivePage();
});

watch(activeField, () => {
  nextTick(updateMarkerPositions);
});

async function initViewer() {
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
}

onMounted(async () => {
  sidebarWidth.value = clampSidebarWidth(sidebarWidth.value);
  useEventListener(window, "pointermove", moveSidebarResize);
  useEventListener(window, "pointerup", stopSidebarResize);
  useEventListener(window, "pointercancel", stopSidebarResize);

  await loadDocument();

  if (document.value && document.value.extractionStatus !== "extracting") {
    await nextTick();
    await initViewer();
  }
});

onBeforeUnmount(() => {
  stopExtractionPolling();
  if (zoomWithWheel) viewerElement.value?.removeEventListener("wheel", zoomWithWheel);
  panzoomTarget.value?.removeEventListener("panzoomchange", handlePanzoomChange);
  window.removeEventListener("resize", updateMarkerPositions);
  panzoom?.destroy();
  void pdfLoadingTask?.destroy();
});
</script>
