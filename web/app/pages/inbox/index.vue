<template>
  <div class="flex min-h-screen bg-default">
    <section class="flex w-full max-w-sm shrink-0 flex-col border-r border-default">
      <header class="border-b border-default px-5 py-4">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-xs font-medium text-dimmed">Inbox</p>
            <h1 class="mt-1 text-lg font-semibold text-highlighted">Forwarded emails</h1>
          </div>
          <UPopover v-model:open="uploadPopoverOpen">
            <UButton icon="i-lucide-plus" color="neutral" variant="ghost" size="xs" aria-label="Upload file" />

            <template #content>
              <div class="w-64 p-3">
                <p class="text-sm font-medium text-highlighted">Upload file</p>
                <p class="mt-1 text-xs leading-5 text-muted">Add a file to the Inbox for review.</p>
                <UFileUpload
                  v-model="uploadedFiles"
                  class="mt-3"
                  multiple
                  size="sm"
                  accept="application/pdf,image/*,.doc,.docx,.xlsx"
                  label="Drop files here or choose files"
                  description="PDF, image, Word, or Excel"
                />
                <p v-if="uploadError" class="mt-3 text-xs text-error">{{ uploadError }}</p>
                <UButton class="mt-3" block size="sm" label="Create" :disabled="!uploadedFiles.length" :loading="uploadingFile" @click="uploadFiles" />
              </div>
            </template>
          </UPopover>
        </div>
      </header>

      <div class="min-h-0 flex-1 overflow-y-auto">
        <div v-if="!forwardedEmails.length" class="px-5 py-10 text-center">
          <UIcon name="i-lucide-inbox" class="mx-auto size-5 text-dimmed" />
          <p class="mt-3 text-sm font-medium text-highlighted">Your Inbox is empty</p>
          <p class="mt-1 text-xs leading-5 text-muted">Upload a file to add it for review.</p>
        </div>
        <article
          v-for="email in forwardedEmails"
          :key="email.id"
          class="border-b border-default transition-colors hover:bg-elevated"
          :class="selectedEmailId === email.id ? 'bg-elevated' : ''"
        >
          <button class="w-full px-5 pt-4 text-left" type="button" @click="selectedEmailId = email.id">
            <div class="flex items-center justify-between gap-3">
              <div class="flex min-w-0 items-center gap-2">
                <UIcon :name="email.sourceType === 'Email' ? 'i-lucide-mail' : 'i-lucide-file-up'" class="size-3.5 shrink-0 text-dimmed" />
                <p class="truncate text-sm font-medium text-highlighted">{{ email.sender }}</p>
              </div>
              <time class="shrink-0 text-xs text-dimmed">{{ email.receivedAt }}</time>
            </div>
            <p class="mt-1 truncate text-sm text-default">{{ email.subject }}</p>
            <p class="mt-1 line-clamp-2 text-xs leading-5 text-muted">{{ email.preview }}</p>
            <div class="mt-3 flex items-center gap-1.5">
              <UBadge color="neutral" variant="subtle" size="xs">{{ email.sourceType }}</UBadge>
              <UBadge
                v-if="email.documentType"
                :color="documentTypeBadges[email.documentType].color"
                variant="subtle"
                size="xs"
              >{{ documentTypeBadges[email.documentType].label }}</UBadge>
            </div>
            <p v-if="email.status !== 'Needs triage'" class="mt-3 text-xs text-dimmed">{{ email.status }}</p>
          </button>
          <div class="flex items-center gap-1 px-5 pt-2 pb-3 text-xs text-dimmed">
            <span>Assigned:</span>
            <USelect v-model="email.assignee" :items="teamMemberOptions" size="xs" variant="none" class="max-w-40" aria-label="Assign email" />
          </div>
        </article>
      </div>
    </section>

    <section v-if="selectedEmail" class="flex min-w-0 flex-1 flex-col">
      <header class="border-b border-default px-6 py-5">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-xs font-medium text-dimmed">Forwarded by {{ selectedEmail.forwardedBy }}</p>
            <h2 class="mt-1 text-xl font-semibold text-highlighted">{{ selectedEmail.subject }}</h2>
          </div>
          <div class="flex shrink-0 items-center gap-1">
            <UButton
              v-if="selectedEmail.processingStatus === 'failed'"
              size="sm"
              color="neutral"
              variant="outline"
              icon="i-lucide-rotate-cw"
              label="Retry Docling"
              :loading="retryingDocling"
              @click="retryDocling"
            />
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-info"
              size="sm"
              aria-label="Show Docling output"
              :aria-pressed="doclingOutputOpen"
              @click="toggleDoclingOutput"
            />
          </div>
        </div>
        <div class="mt-4 flex items-center gap-3 text-xs text-muted">
          <span>{{ selectedEmail.sender }}</span>
          <span aria-hidden="true">•</span>
          <span>{{ selectedEmail.receivedAt }}</span>
        </div>
      </header>

      <section v-if="doclingOutputOpen" class="border-b border-default bg-elevated/30 px-6 py-4">
        <p class="text-sm font-medium text-highlighted">Docling output</p>
        <p v-if="doclingOutputError" class="mt-2 text-sm text-error">{{ doclingOutputError }}</p>
        <p v-else-if="doclingOutputLoading" class="mt-2 text-sm text-muted">Loading extraction…</p>
        <template v-else-if="doclingOutput">
          <p class="mt-2 text-xs text-muted">
            {{ doclingOutput.processingStatus }}
            <template v-if="doclingOutput.processingTime !== undefined"> · {{ doclingOutput.processingTime.toFixed(2) }}s</template>
          </p>
          <pre class="mt-3 max-h-72 overflow-auto rounded-md bg-default p-3 text-xs leading-5 whitespace-pre-wrap text-default">{{ doclingOutputText }}</pre>
        </template>
        <template v-else>
          <p class="mt-2 text-sm text-muted">{{ doclingOutputStatus || "Docling has not produced an extraction for this item yet." }}</p>
          <UButton
            v-if="selectedEmail?.processingStatus === 'failed'"
            class="mt-3"
            size="xs"
            color="neutral"
            variant="outline"
            icon="i-lucide-rotate-cw"
            label="Retry Docling"
            :loading="retryingDocling"
            @click="retryDocling"
          />
        </template>
      </section>

      <div class="flex min-h-0 flex-1 flex-col xl:flex-row">
        <article class="max-w-3xl flex-1 px-6 py-7 text-sm leading-7 whitespace-pre-line text-default">
          {{ selectedEmail.body }}
        </article>

        <aside class="border-t border-default p-6 xl:w-80 xl:border-t-0 xl:border-l">
          <div class="space-y-2">
            <UButton
              v-if="isExtractableDocumentType(selectedEmail.documentType)"
              block
              icon="i-lucide-file-plus-2"
              label="Extract document"
              @click="extractDocument"
            />
            <p v-else-if="selectedEmail.processingStatus === 'completed'" class="text-xs leading-5 text-muted">
              Not an order, quotation, or invoice — nothing to extract.
            </p>
            <UButton block color="neutral" variant="outline" label="Ignore" @click="ignoreEmail" />
          </div>

        </aside>
      </div>
    </section>
    <section v-else class="flex flex-1 items-center justify-center px-6 text-center">
      <div>
        <UIcon name="i-lucide-file-search" class="mx-auto size-6 text-dimmed" />
        <p class="mt-3 text-sm font-medium text-highlighted">Select an Inbox item</p>
        <p class="mt-1 text-sm text-muted">Choose an uploaded file to review it.</p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { isExtractableDocumentType, type DocumentType } from "@khito/shared/inbox";

type ForwardedEmail = {
  id: string;
  sender: string;
  sourceType: "Email" | "File upload";
  forwardedBy: string;
  subject: string;
  receivedAt: string;
  preview: string;
  body: string;
  assignee: string;
  status: "Needs triage" | "Ready to create" | "Not a document";
  documentType: DocumentType | null;
  processingStatus: StoredInboxFile["processingStatus"];
  storedInboxItem: boolean;
};

type StoredInboxFile = {
  id: string;
  name: string;
  contentType: string;
  size: number;
  documentType: DocumentType | null;
  processingStatus: "pending" | "processing" | "completed" | "failed";
  uploadedAt: string;
};

type DoclingOutput = {
  document: unknown;
  markdown: string;
  processingTime?: number;
  processingStatus: "completed";
};

const forwardedEmails = ref<ForwardedEmail[]>([]);

const selectedEmailId = ref<string | null>(null);
const selectedEmail = computed(() => forwardedEmails.value.find(email => email.id === selectedEmailId.value));
const uploadedFiles = ref<File[]>([]);
const uploadPopoverOpen = ref(false);
const uploadingFile = ref(false);
const uploadError = ref("");
const doclingOutputOpen = ref(false);
const doclingOutput = ref<DoclingOutput | null>(null);
const doclingOutputError = ref("");
const doclingOutputLoading = ref(false);
const doclingOutputStatus = ref("");
const retryingDocling = ref(false);
const teamMemberOptions = ["Unassigned", "Fabian Aistleitner", "Lena Hoffmann", "Max Berger"];
const documentTypeBadges: Record<DocumentType, { label: string; color: "primary" | "secondary" | "info" | "neutral" }> = {
  order: { label: "Order", color: "primary" },
  quotation: { label: "Quotation", color: "secondary" },
  invoice: { label: "Invoice", color: "info" },
  other: { label: "Other", color: "neutral" },
};
const clerkFetch = useClerkFetch();

const doclingOutputText = computed(() => {
  if (!doclingOutput.value) return "";
  return doclingOutput.value.markdown || JSON.stringify(doclingOutput.value.document, null, 2);
});

const hasActiveDoclingJobs = computed(() => forwardedEmails.value.some(email => email.processingStatus === "pending" || email.processingStatus === "processing"));

function extractDocument() {
  if (!selectedEmail.value) return;
  selectedEmail.value.status = "Ready to create";
}

function ignoreEmail() {
  if (!selectedEmail.value) return;
  selectedEmail.value.status = "Not a document";
}

function inboxEntryFromFile(file: StoredInboxFile): ForwardedEmail {
  return {
    id: file.id,
    sender: "File upload",
    sourceType: "File upload",
    forwardedBy: "Inbox upload",
    subject: file.name,
    receivedAt: formatUploadedAt(file.uploadedAt),
    preview: `${file.contentType} · ${formatFileSize(file.size)}`,
    body: `File uploaded to the Inbox.\n\n${file.name}`,
    assignee: "Unassigned",
    status: "Needs triage",
    documentType: file.documentType,
    storedInboxItem: true,
    processingStatus: file.processingStatus,
  };
}

function formatUploadedAt(uploadedAt: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(uploadedAt));
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

async function loadInboxFiles() {
  try {
    const files = await clerkFetch<StoredInboxFile[]>("/api/inbox/files");
    forwardedEmails.value = files.map(inboxEntryFromFile);

    if (!selectedEmail.value) {
      selectedEmailId.value = forwardedEmails.value[0]?.id ?? null;
    }
  }
  catch {
    return;
  }
}

async function refreshActiveDoclingJobs() {
  await loadInboxFiles();

  if (doclingOutputOpen.value && selectedEmail.value?.storedInboxItem) {
    await loadDoclingOutput();
  }
}

async function uploadFiles() {
  if (!uploadedFiles.value.length) return;

  uploadingFile.value = true;
  uploadError.value = "";

  try {
    const files = await Promise.all(uploadedFiles.value.map(uploadFile));
    const inboxEntries = files.map(inboxEntryFromFile);

    forwardedEmails.value.unshift(...inboxEntries);
    selectedEmailId.value = inboxEntries[0]?.id ?? selectedEmailId.value;
    uploadedFiles.value = [];
    uploadPopoverOpen.value = false;
  }
  catch (error) {
    uploadError.value = error instanceof Error ? error.message : "The file could not be uploaded.";
  }
  finally {
    uploadingFile.value = false;
  }
}

async function uploadFile(file: File): Promise<StoredInboxFile> {
  const formData = new FormData();
  formData.set("file", file);

  return clerkFetch<StoredInboxFile>("/api/inbox/files", { method: "POST", body: formData });
}

async function loadDoclingOutput() {
  const email = selectedEmail.value;
  if (!email?.storedInboxItem) return;

  doclingOutputLoading.value = true;
  doclingOutputError.value = "";
  doclingOutputStatus.value = "";

  try {
    const response = await clerkFetch<DoclingOutput | { processingError: string | null; processingStatus: string }>(`/api/inbox/files/${email.id}/docling`);

    if ("document" in response) {
      doclingOutput.value = response;
      return;
    }

    doclingOutput.value = null;
    doclingOutputError.value = response.processingError || "";
    doclingOutputStatus.value = response.processingError ? "" : `Docling is ${response.processingStatus}.`;
  }
  catch (error) {
    doclingOutput.value = null;
    doclingOutputError.value = error instanceof Error ? error.message : "The Docling output could not be loaded.";
  }
  finally {
    doclingOutputLoading.value = false;
  }
}

async function retryDocling() {
  const email = selectedEmail.value;
  if (!email?.storedInboxItem || email.processingStatus !== "failed") return;

  retryingDocling.value = true;
  doclingOutputError.value = "";

  try {
    await clerkFetch(`/api/inbox/files/${email.id}/retry`, { method: "POST" });
    email.processingStatus = "pending";
    doclingOutputStatus.value = "Docling is pending.";
  }
  catch (error) {
    doclingOutputError.value = error instanceof Error ? error.message : "The Docling retry could not be started.";
  }
  finally {
    retryingDocling.value = false;
  }
}

function toggleDoclingOutput() {
  doclingOutputOpen.value = !doclingOutputOpen.value;

  if (doclingOutputOpen.value) {
    void loadDoclingOutput();
  }
}

watch(selectedEmailId, () => {
  doclingOutput.value = null;
  doclingOutputError.value = "";
  doclingOutputStatus.value = "";
  doclingOutputOpen.value = false;
});

let inboxRefreshTimer: number | undefined;

onMounted(() => {
  void loadInboxFiles();
  inboxRefreshTimer = window.setInterval(() => {
    if (hasActiveDoclingJobs.value) {
      void refreshActiveDoclingJobs();
    }
  }, 5_000);
});

onBeforeUnmount(() => {
  if (inboxRefreshTimer) {
    clearInterval(inboxRefreshTimer);
  }
});
</script>
