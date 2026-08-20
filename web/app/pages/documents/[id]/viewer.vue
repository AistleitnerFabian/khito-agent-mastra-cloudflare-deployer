<template>
  <div class="flex h-dvh flex-col overflow-hidden bg-default">
    <div v-if="loading" class="flex flex-1 items-center justify-center px-6 text-center">
      <UIcon name="i-lucide-loader-circle" class="size-6 animate-spin text-dimmed" />
    </div>

    <div v-else-if="error" class="flex flex-1 items-center justify-center px-6 text-center">
      <div>
        <UIcon name="i-lucide-circle-alert" class="mx-auto size-6 text-error" />
        <p class="mt-3 text-sm font-medium text-highlighted">{{ error }}</p>
        <p class="mt-2 text-sm text-muted">Close this window and reopen the viewer from the document page.</p>
      </div>
    </div>

    <DocumentViewer v-else-if="document" v-model:active-field="activeField" :detail="document" />
  </div>
</template>

<script setup lang="ts">
import { documentDataFields, type DocumentDataField } from "@khito/shared/documents";
import type { DocumentDetail, DocumentViewerSyncMessage } from "~/types/documents";

definePageMeta({ layout: false });

const route = useRoute();
const clerkFetch = useClerkFetch();

const document = ref<DocumentDetail | null>(null);
const loading = ref(true);
const error = ref("");
const activeField = ref<DocumentDataField>("project");

// Field selection is linked with the main document window: both broadcast
// their changes and adopt each other's, so form clicks highlight here and
// marker clicks here highlight the form — like the inline viewer. One static
// channel is shared by all document windows; the document id rides inside
// each message so the link can never go stale.
const windowId = Math.random().toString(36).slice(2);
let syncChannel: BroadcastChannel | null = null;

onMounted(() => {
  syncChannel = new BroadcastChannel("khito-document-viewer");
  syncChannel.onmessage = (event: MessageEvent<DocumentViewerSyncMessage>) => {
    const message = event.data;
    if (message.source === windowId || message.docId !== String(route.params.id)) return;
    activeField.value = message.fieldId;
  };
});

onBeforeUnmount(() => {
  syncChannel?.close();
  syncChannel = null;
});

watch(activeField, (fieldId) => {
  syncChannel?.postMessage({ docId: String(route.params.id), source: windowId, fieldId });
});

useTitle(() => document.value ? `${document.value.name} · Khito` : "Khito document viewer");

onMounted(async () => {
  loading.value = true;
  error.value = "";

  try {
    document.value = await clerkFetch<DocumentDetail>(`/api/documents/${route.params.id}`);
    activeField.value = documentDataFields.find(field => document.value?.bounds[field.id]?.length)?.id ?? "project";

    // Adopt the main window's current field instead of resetting to the first
    // bounded one — the popout continues the context it was opened from.
    const queryField = route.query.field;
    if (typeof queryField === "string" && documentDataFields.some(field => field.id === queryField)) {
      activeField.value = queryField as DocumentDataField;
    }
  }
  catch (loadError) {
    error.value = loadError instanceof Error ? loadError.message : "The document could not be loaded.";
  }
  finally {
    loading.value = false;
  }
});
</script>
