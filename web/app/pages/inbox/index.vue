<template>
  <div class="flex min-h-screen bg-default">
    <section class="flex w-full max-w-sm shrink-0 flex-col border-r border-default">
      <header class="border-b border-default px-5 py-4">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-xs font-medium text-dimmed">Inbox</p>
            <h1 class="mt-1 text-lg font-semibold text-highlighted">Forwarded emails</h1>
          </div>
        </div>
      </header>

      <div class="min-h-0 flex-1 overflow-y-auto">
        <article
          v-for="email in forwardedEmails"
          :key="email.id"
          class="border-b border-default transition-colors hover:bg-elevated"
          :class="selectedEmailId === email.id ? 'bg-elevated' : ''"
        >
          <button class="w-full px-5 pt-4 text-left" type="button" @click="selectedEmailId = email.id">
            <div class="flex items-center justify-between gap-3">
              <p class="truncate text-sm font-medium text-highlighted">{{ email.sender }}</p>
              <time class="shrink-0 text-xs text-dimmed">{{ email.receivedAt }}</time>
            </div>
            <p class="mt-1 truncate text-sm text-default">{{ email.subject }}</p>
            <p class="mt-1 line-clamp-2 text-xs leading-5 text-muted">{{ email.preview }}</p>
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
        <p class="text-xs font-medium text-dimmed">Forwarded by {{ selectedEmail.forwardedBy }}</p>
        <h2 class="mt-1 text-xl font-semibold text-highlighted">{{ selectedEmail.subject }}</h2>
        <div class="mt-4 flex items-center gap-3 text-xs text-muted">
          <span>{{ selectedEmail.sender }}</span>
          <span aria-hidden="true">•</span>
          <span>{{ selectedEmail.receivedAt }}</span>
        </div>
      </header>

      <div class="flex min-h-0 flex-1 flex-col xl:flex-row">
        <article class="max-w-3xl flex-1 px-6 py-7 text-sm leading-7 text-default whitespace-pre-line">
          {{ selectedEmail.body }}
        </article>

        <aside class="border-t border-default p-6 xl:w-80 xl:border-t-0 xl:border-l">
          <div class="space-y-2">
            <UButton block icon="i-lucide-file-plus-2" label="Extract document" @click="extractDocument" />
            <UButton block color="neutral" variant="outline" label="Ignore" @click="ignoreEmail" />
          </div>

        </aside>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
type ForwardedEmail = {
  id: string;
  sender: string;
  forwardedBy: string;
  subject: string;
  receivedAt: string;
  preview: string;
  body: string;
  assignee: string;
  status: "Needs triage" | "Ready to create" | "Not a document";
};

const forwardedEmails = ref<ForwardedEmail[]>([
  {
    id: "supplier-order-update",
    sender: "orders@alpine.example",
    forwardedBy: "Fabian Aistleitner",
    subject: "Order update – Alpine Interiors",
    receivedAt: "10:42",
    preview: "Please find the revised order confirmation attached. The delivery date has changed...",
    body: "Hi Fabian,\n\nPlease find the revised order confirmation attached. The delivery date has changed to 24 August.\n\nCould you please confirm that this still works for you?\n\nBest regards,\nAlpine Interiors",
    assignee: "Unassigned",
    status: "Needs triage",
  },
  {
    id: "pricing-request",
    sender: "purchasing@nordlicht.example",
    forwardedBy: "Fabian Aistleitner",
    subject: "Request for updated pricing",
    receivedAt: "Yesterday",
    preview: "We are preparing our next purchase order and would appreciate an updated price list...",
    body: "Hello,\n\nWe are preparing our next purchase order and would appreciate an updated price list for the Q3 catalogue.\n\nThank you,\nNordlicht purchasing team",
    assignee: "Fabian Aistleitner",
    status: "Needs triage",
  },
  {
    id: "delivery-question",
    sender: "service@bergundtal.example",
    forwardedBy: "Fabian Aistleitner",
    subject: "Question about delivery address",
    receivedAt: "Monday",
    preview: "Before dispatching the replacement parts, could you confirm the receiving address?...",
    body: "Hi Fabian,\n\nBefore dispatching the replacement parts, could you confirm the receiving address for this service request?\n\nKind regards,\nBerg & Tal service team",
    assignee: "Unassigned",
    status: "Needs triage",
  },
]);

const selectedEmailId = ref("supplier-order-update");
const selectedEmail = computed(() => forwardedEmails.value.find((email) => email.id === selectedEmailId.value));
const teamMemberOptions = ["Unassigned", "Fabian Aistleitner", "Lena Hoffmann", "Max Berger"];

function extractDocument() {
  if (!selectedEmail.value) return;
  selectedEmail.value.status = "Ready to create";
}

function ignoreEmail() {
  if (!selectedEmail.value) return;
  selectedEmail.value.status = "Not a document";
}
</script>
