<template>
  <div class="flex min-h-screen flex-col bg-default">
    <header class="border-b border-default px-6 py-5">
      <p class="text-xs font-medium text-dimmed">Workspace</p>
      <h1 class="mt-1 text-lg font-semibold text-highlighted">Documents</h1>
    </header>

    <main class="flex-1 px-6 py-6">
      <div v-if="loading" class="py-16 text-center text-sm text-muted">Loading documents…</div>

      <div v-else-if="error" class="py-16 text-center">
        <p class="text-sm text-error">{{ error }}</p>
        <UButton class="mt-3" size="xs" color="neutral" variant="outline" icon="i-lucide-rotate-cw" label="Retry" @click="loadDocuments" />
      </div>

      <div v-else-if="!documents.length" class="py-16 text-center">
        <UIcon name="i-lucide-files" class="mx-auto size-6 text-dimmed" />
        <p class="mt-3 text-sm font-medium text-highlighted">No documents yet</p>
        <p class="mt-1 text-xs leading-5 text-muted">Extract an order, quotation, or invoice from the Inbox to create one.</p>
        <UButton class="mt-4" size="xs" variant="outline" icon="i-lucide-inbox" label="Go to Inbox" to="/inbox" />
      </div>

      <div v-else class="overflow-hidden rounded-lg border border-default">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-default bg-elevated/50 text-left text-xs text-dimmed">
              <th class="px-4 py-3 font-medium">Document</th>
              <th class="px-4 py-3 font-medium">Type</th>
              <th class="px-4 py-3 font-medium">Assignee</th>
              <th class="px-4 py-3 font-medium">Status</th>
              <th class="px-4 py-3 font-medium">Created</th>
              <th class="w-10 px-4 py-3" aria-label="Open document" />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="document in documents"
              :key="document.id"
              class="cursor-pointer border-b border-default transition-colors last:border-b-0 hover:bg-elevated"
              @click="openDocument(document)"
            >
              <td class="max-w-0 px-4 py-3">
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-file-text" class="size-4 shrink-0 text-dimmed" />
                  <span class="truncate font-medium text-highlighted">{{ document.name }}</span>
                </div>
              </td>
              <td class="px-4 py-3">
                <UBadge :color="documentTypeBadges[document.documentType].color" variant="subtle" size="xs">
                  {{ documentTypeBadges[document.documentType].label }}
                </UBadge>
              </td>
              <td class="px-4 py-3 text-default">{{ document.assignee ?? "Unassigned" }}</td>
              <td class="px-4 py-3">
                <span v-if="document.extractionStatus === 'extracting'" class="flex items-center gap-2 text-xs text-muted">
                  <UIcon name="i-lucide-loader-circle" class="size-3.5 animate-spin" />
                  Khito is extracting…
                </span>
                <span v-else-if="document.extractionStatus === 'failed'" class="flex items-center gap-2 text-xs text-error">
                  <UIcon name="i-lucide-circle-alert" class="size-3.5" />
                  Extraction failed
                </span>
                <span v-else class="flex items-center gap-2 text-xs text-muted">
                  <UIcon name="i-lucide-circle-check" class="size-3.5 text-success" />
                  Ready
                </span>
              </td>
              <td class="px-4 py-3 text-xs text-dimmed">{{ formatCreatedAt(document.createdAt) }}</td>
              <td class="px-4 py-3">
                <UIcon name="i-lucide-chevron-right" class="size-4 text-dimmed" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import type { DocumentExtractionStatus } from "@khito/shared/documents";
import type { ExtractableDocumentType } from "@khito/shared/inbox";

type DocumentListItem = {
  id: string;
  name: string;
  documentType: ExtractableDocumentType;
  assignee: string | null;
  extractionStatus: DocumentExtractionStatus;
  extractionError: string | null;
  createdAt: string;
  updatedAt: string;
};

const documents = ref<DocumentListItem[]>([]);
const loading = ref(true);
const error = ref("");
const clerkFetch = useClerkFetch();

const documentTypeBadges: Record<ExtractableDocumentType, { label: string; color: "primary" | "secondary" | "info" }> = {
  order: { label: "Order", color: "primary" },
  quotation: { label: "Quotation", color: "secondary" },
  invoice: { label: "Invoice", color: "info" },
};

const hasActiveExtractions = computed(() => documents.value.some(document => document.extractionStatus === "extracting"));

function formatCreatedAt(createdAt: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(createdAt));
}

function openDocument(document: DocumentListItem) {
  if (document.extractionStatus === "extracting") return;
  void navigateTo(`/documents/${document.id}`);
}

async function loadDocuments() {
  try {
    documents.value = await clerkFetch<DocumentListItem[]>("/api/documents");
  }
  catch {
    error.value = "The documents could not be loaded.";
  }
}

let extractionPoller: number | undefined;

onMounted(async () => {
  await loadDocuments();
  loading.value = false;

  extractionPoller = window.setInterval(() => {
    if (hasActiveExtractions.value) {
      void loadDocuments();
    }
  }, 3_000);
});

onBeforeUnmount(() => {
  if (extractionPoller) {
    clearInterval(extractionPoller);
  }
});
</script>
