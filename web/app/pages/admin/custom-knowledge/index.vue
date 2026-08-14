<template>
  <div class="min-h-screen bg-default">
    <section class="mx-auto w-full max-w-3xl px-6 py-12">
      <div class="flex items-start justify-between gap-4">
        <div class="space-y-2">
          <h1 class="text-xl font-semibold text-highlighted">Custom Knowledge</h1>
          <p class="text-sm text-muted">Guidance and terminology Khito should use in this workspace.</p>
        </div>
        <UButton icon="i-lucide-plus" label="Add knowledge" @click="openCreate" />
      </div>

      <AdminCreateDialog v-model:open="showForm" :title="editingIndex === null ? 'Add custom knowledge' : 'Edit custom knowledge'" description="Add Markdown guidance that Khito should use." form-id="custom-knowledge-form" :submit-label="editingIndex === null ? 'Add knowledge' : 'Save changes'">
        <form id="custom-knowledge-form" class="space-y-4" @submit.prevent="addKnowledge">
          <UFormField name="title" label="Title" required><UInput v-model="draft.title" size="lg" placeholder="e.g. Delivery terms" /></UFormField>
          <UFormField name="content" label="Markdown" description="Use Markdown for headings, lists, and links." required><UTextarea v-model="draft.content" size="lg" autoresize :maxrows="24" :rows="12" placeholder="Write the context Khito should know." /></UFormField>
        </form>
      </AdminCreateDialog>

      <div class="mt-8 border-y border-default">
        <article v-for="(entry, index) in entries" :key="entry.title" class="flex items-start justify-between gap-4 border-b border-default py-5 last:border-b-0">
          <div><p class="text-sm font-medium text-highlighted">{{ entry.title }}</p><p class="mt-2 max-w-2xl text-sm leading-6 text-muted">{{ entry.content }}</p></div>
          <UButton color="neutral" variant="ghost" icon="i-lucide-arrow-up-right" aria-label="Edit knowledge" @click="openEdit(index)" />
        </article>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const showForm = ref(false);
const editingIndex = ref<number | null>(null);
const draft = reactive({ title: "", content: "" });
const entries = ref([
  { title: "Customer terminology", content: "Use “job” rather than “order” when speaking to customers. A site contact is the person who receives the work on location." },
  { title: "Delivery policy", content: "Never promise a date before it is confirmed. If a requested date is unavailable, prepare the closest alternative for review." },
]);

function addKnowledge() {
  if (!draft.title || !draft.content) return;
  const entry = { title: draft.title, content: draft.content };
  if (editingIndex.value === null) entries.value.unshift(entry);
  else entries.value[editingIndex.value] = entry;
  Object.assign(draft, { title: "", content: "" });
  showForm.value = false;
}

function openCreate() {
  editingIndex.value = null;
  Object.assign(draft, { title: "", content: "" });
  showForm.value = true;
}

function openEdit(index: number) {
  const entry = entries.value[index];
  if (!entry) return;
  editingIndex.value = index;
  Object.assign(draft, entry);
  showForm.value = true;
}
</script>
