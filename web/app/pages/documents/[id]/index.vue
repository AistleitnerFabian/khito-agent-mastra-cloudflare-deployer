<template>
  <div v-if="loading || document?.extractionStatus === 'extracting'" class="flex h-full items-center justify-center bg-default px-6 text-center">
    <div>
      <UIcon :name="loading ? 'i-lucide-loader-circle' : 'i-lucide-sparkles'" class="mx-auto size-6 animate-spin text-dimmed" />
      <p class="mt-3 text-sm font-medium text-highlighted">{{ loading ? "Loading document…" : "Khito is extracting…" }}</p>
      <p v-if="!loading" class="mt-1 text-sm text-muted">{{ document?.name }}</p>
    </div>
  </div>

  <div v-else-if="document?.extractionStatus === 'failed'" class="flex h-full items-center justify-center bg-default px-6 text-center">
    <div>
      <UIcon name="i-lucide-circle-alert" class="mx-auto size-6 text-error" />
      <p class="mt-3 text-sm font-medium text-highlighted">Extraction failed</p>
      <p class="mt-2 max-w-md text-sm text-muted">{{ document.extractionError || "The document could not be extracted." }}</p>
      <UButton class="mt-4" size="xs" color="neutral" variant="outline" icon="i-lucide-arrow-left" label="Back to documents" to="/documents" />
    </div>
  </div>

  <div v-else-if="error" class="flex h-full items-center justify-center bg-default px-6 text-center">
    <div>
      <UIcon name="i-lucide-circle-alert" class="mx-auto size-6 text-error" />
      <p class="mt-3 text-sm font-medium text-highlighted">{{ error }}</p>
      <UButton class="mt-4" size="xs" color="neutral" variant="outline" icon="i-lucide-arrow-left" label="Back to documents" to="/documents" />
    </div>
  </div>

  <div v-else-if="document" class="flex h-full overflow-hidden bg-default" :class="resizingSidebar ? 'cursor-col-resize select-none' : ''">
    <aside
      ref="formSidebar"
      class="w-full shrink-0 overflow-y-auto border-r border-default px-5 py-6 sm:px-6"
      :class="resizingSidebar ? '' : 'transition-[max-width] duration-200 ease-out'"
      :style="{ maxWidth: viewerHidden ? sidebarExpandedWidth : `${sidebarWidth}px` }"
    >
      <div class="mb-4 flex items-center justify-between">
        <UButton
          color="neutral"
          variant="ghost"
          size="xs"
          icon="i-lucide-arrow-left"
          label="Documents"
          to="/documents"
        />
        <UButton
          color="neutral"
          variant="ghost"
          size="xs"
          :icon="sidebarExpanded ? 'i-lucide-panel-left-close' : 'i-lucide-panel-left-open'"
          :aria-label="sidebarExpanded ? 'Collapse form sidebar' : 'Expand form sidebar'"
          @click="sidebarExpanded ? collapseSidebar() : expandSidebar()"
        />
      </div>

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
        <div
          v-for="field in documentDataFields"
          :key="field.id"
          :ref="(element: unknown) => setFieldElement(field.id, element)"
          :class="fieldClass(field.id)"
          @focusin="selectField(field.id)"
        >
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
      :class="[resizingSidebar ? 'bg-primary' : '', viewerHidden ? 'pointer-events-none opacity-40' : '']"
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize form sidebar"
      @pointerdown="startSidebarResize"
      @pointermove="moveSidebarResize"
      @pointerup="stopSidebarResize"
      @pointercancel="stopSidebarResize"
      @dblclick="resetSidebarWidth"
    >
      <span
        class="absolute top-1/2 left-1/2 h-4 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accented transition-colors group-hover:bg-primary"
        :class="resizingSidebar ? 'bg-primary' : ''"
      />
    </div>

    <main class="relative hidden min-w-0 flex-1 flex-col overflow-hidden bg-elevated sm:flex">
      <div
        v-if="viewerHidden"
        class="absolute inset-0 z-20 grid cursor-pointer place-items-center bg-black/80 backdrop-blur-[2px]"
        role="button"
        :aria-label="viewerPoppedOut ? 'Close popped-out window and restore viewer' : 'Collapse form sidebar'"
        @click="dismissViewerOverlay"
      >
        <UIcon :name="viewerPoppedOut ? 'i-lucide-picture-in-picture-2' : 'i-lucide-panel-left-close'" class="size-5 text-white/50" />
      </div>

      <DocumentViewer
        v-if="document"
        v-model:active-field="activeField"
        :detail="document"
        :hud-hidden="viewerHidden"
        can-pop-out
        @popout="popoutViewer"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import { documentDataFields, documentDataFieldIds, type DocumentDataField, type ExtractedDocumentData } from "@khito/shared/documents";
import type { DocumentDetail, DocumentViewerSyncMessage } from "~/types/documents";

const route = useRoute();
const clerkFetch = useClerkFetch();

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

// Field selection is linked with the popped-out viewer window: both windows
// broadcast their changes and adopt each other's, so form clicks highlight in
// the popup and marker clicks there highlight the form — like the inline viewer.
// One static channel is shared by all document windows and the document id
// rides inside each message — a name baked from route params at setup time
// goes stale when this page component is reused across documents.
const windowId = Math.random().toString(36).slice(2);
let viewerSyncChannel: BroadcastChannel | null = null;

onMounted(() => {
  viewerSyncChannel = new BroadcastChannel("khito-document-viewer");
  viewerSyncChannel.onmessage = (event: MessageEvent<DocumentViewerSyncMessage>) => {
    const message = event.data;
    if (message.source === windowId || message.docId !== String(route.params.id)) return;
    activeField.value = message.fieldId;
  };
});

onBeforeUnmount(() => {
  viewerSyncChannel?.close();
  viewerSyncChannel = null;
});

// Field rows keyed by id, so a selection arriving from the popped-out viewer
// can scroll its form row into view — without this, a highlight landing below
// the fold reads as the sync doing nothing.
const fieldElements: Partial<Record<DocumentDataField, HTMLElement>> = {};

function setFieldElement(fieldId: DocumentDataField, element: unknown) {
  if (element instanceof HTMLElement) fieldElements[fieldId] = element;
}

watch(activeField, (fieldId) => {
  viewerSyncChannel?.postMessage({ docId: String(route.params.id), source: windowId, fieldId });
  fieldElements[fieldId]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
});

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
const formSidebar = useTemplateRef<HTMLElement>("formSidebar");
// Width of the current drag, applied straight to the DOM (see moveSidebarResize).
let draggedSidebarWidth = defaultSidebarWidth;

// The viewer area shows the blur overlay while it is either in focus mode or
// popped out into its own window. Both give the form the full content viewport;
// closing either restores the sidebar to the width it had before, since
// sidebarWidth is never overwritten while the viewer is hidden.
const viewerPoppedOut = ref(false);
const viewerHidden = computed(() => sidebarExpanded.value || viewerPoppedOut.value);
let viewerPopoutWindow: Window | null = null;

const { pause: pausePopoutCheck, resume: resumePopoutCheck } = useIntervalFn(() => {
  if (viewerPopoutWindow?.closed) reattachViewer();
}, 1000, { immediate: false });

function popoutViewer() {
  if (viewerPoppedOut.value) return;

  // The current field rides along as a query param so the popup starts in the
  // same context; live changes afterwards flow through the broadcast channel.
  viewerPopoutWindow = window.open(`/documents/${route.params.id}/viewer?field=${activeField.value}`, "khito-document-viewer", "popup,width=1100,height=800");
  if (!viewerPopoutWindow) return;

  viewerPoppedOut.value = true;
  resumePopoutCheck();
}

function reattachViewer() {
  viewerPopoutWindow?.close();
  viewerPopoutWindow = null;
  viewerPoppedOut.value = false;
  formSidebar.value?.style.removeProperty("max-width");
  pausePopoutCheck();
}

function dismissViewerOverlay() {
  if (viewerPoppedOut.value) {
    reattachViewer();
  }
  else {
    collapseSidebar();
  }
}

function clampSidebarWidth(width: number) {
  return Math.round(Math.min(Math.max(width, sidebarMinWidth), Math.min(sidebarMaxWidth, window.innerWidth - 480)));
}

function startSidebarResize(event: PointerEvent) {
  if (viewerHidden.value) return;

  // Capture the pointer on the handle: from here on, every move of the gesture
  // is targeted at this element, so the element-attached listeners in the
  // template fire even when the cursor crosses the re-rendering viewer or
  // leaves the window. Suppress the default too, so no text selection or
  // native drag competes with the resize.
  event.preventDefault();
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);

  resizingSidebar.value = true;
  sidebarDragOrigin = { pointerX: event.clientX, width: sidebarWidth.value };
}

function moveSidebarResize(event: PointerEvent) {
  if (!resizingSidebar.value) return;

  const draggedWidth = sidebarDragOrigin.width + event.clientX - sidebarDragOrigin.pointerX;

  if (draggedWidth > sidebarMaxWidth + sidebarExpandSnapPadding) {
    if (!sidebarExpanded.value) expandSidebar();
    return;
  }

  sidebarExpanded.value = false;
  // Paint the width straight to the DOM instead of through the reactive style
  // binding: mid-gesture reactive updates proved unreliable (width visibly
  // stuck until pointerup), while direct writes always paint immediately. The
  // viewer's ResizeObserver sees the real layout change and follows the field
  // markers along. State syncs back on release in stopSidebarResize.
  draggedSidebarWidth = clampSidebarWidth(draggedWidth);
  const sidebar = formSidebar.value;
  if (sidebar) sidebar.style.maxWidth = `${draggedSidebarWidth}px`;
}

function stopSidebarResize() {
  if (!resizingSidebar.value) return;

  resizingSidebar.value = false;

  if (!viewerHidden.value) {
    sidebarWidth.value = draggedSidebarWidth;
  }
}

function resetSidebarWidth() {
  sidebarExpanded.value = false;
  sidebarWidth.value = defaultSidebarWidth;
  formSidebar.value?.style.removeProperty("max-width");
}

function expandSidebar() {
  sidebarExpanded.value = true;
  formSidebar.value?.style.removeProperty("max-width");
}

function collapseSidebar() {
  if (!sidebarExpanded.value) return;

  sidebarExpanded.value = false;
  formSidebar.value?.style.removeProperty("max-width");
}

const horizontalFieldUi = {
  root: "grid grid-cols-[7rem_minmax(0,1fr)] items-start gap-3",
  labelWrapper: "pt-2 text-left",
  label: "text-xs font-normal text-muted",
  container: "w-full min-w-0 justify-self-end",
};

const dirty = computed(() => JSON.stringify(documentData.value) !== initialDataJson.value || (document.value?.assignee ?? "Unassigned") !== documentAssignee.value);

function fieldClass(fieldId: DocumentDataField) {
  return activeField.value === fieldId ? "-m-2 rounded-sm bg-primary/10 p-2" : "-m-2 p-2";
}

function selectField(fieldId: DocumentDataField) {
  activeField.value = fieldId;
}

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
  // Leave the loading state before the viewer branch mounts — the DocumentViewer
  // loads and paints the PDF itself once it is in the DOM.
  loading.value = false;
  documentData.value = { ...detail.data };
  initialDataJson.value = JSON.stringify(detail.data);
  documentAssignee.value = detail.assignee ?? "Unassigned";
  activeField.value = documentDataFields.find(field => detail.bounds[field.id]?.length)?.id ?? "project";
}

let extractionPoller: number | undefined;

function startExtractionPolling() {
  extractionPoller = window.setInterval(async () => {
    try {
      const detail = await clerkFetch<DocumentDetail>(`/api/documents/${route.params.id}`);

      if (detail.extractionStatus !== "extracting") {
        stopExtractionPolling();
        await applyDocument(detail);
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

onMounted(async () => {
  sidebarWidth.value = clampSidebarWidth(sidebarWidth.value);

  await loadDocument();
});

onBeforeUnmount(() => {
  stopExtractionPolling();
  viewerPopoutWindow?.close();
});
</script>
