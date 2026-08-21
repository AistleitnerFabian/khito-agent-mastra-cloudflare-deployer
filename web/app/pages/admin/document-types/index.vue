<template>
  <div class="min-h-screen bg-default">
    <section class="mx-auto w-full max-w-3xl px-6 py-12">
      <div class="flex items-start justify-between gap-4">
        <div class="space-y-2">
          <h1 class="text-xl font-semibold text-highlighted">Document definitions</h1>
          <p class="text-sm text-muted">Define what Khito should prepare for this customer.</p>
        </div>
        <UButton icon="i-lucide-plus" label="New" @click="openCreate" />
      </div>

      <AdminEditorDialog
        v-model:open="showForm"
        description="Build the form Khito should fill for this document type."
        form-id="document-definition-form"
        :submit-label="editingIndex === null ? 'Create definition' : 'Save changes'"
        :submit-disabled="!draft.name.trim() || !isSchemaValid"
      >
        <template #title>
          <UInput
            v-model="draft.name"
            variant="none"
            placeholder="Untitled definition"
            aria-label="Definition name"
            class="w-full max-w-sm px-0 text-lg font-semibold text-highlighted placeholder:font-normal placeholder:text-dimmed"
          />
        </template>

        <form id="document-definition-form" class="flex h-full min-h-0 flex-col" @submit.prevent="addDocument">
          <AdminFormBuilder v-model="draft.schema" class="min-h-0 flex-1" @validation-change="isSchemaValid = $event" />
        </form>
      </AdminEditorDialog>

      <div class="mt-8 border-y border-default">
        <article v-for="(document, index) in documents" :key="document.name" class="flex items-center justify-between gap-4 border-b border-default py-5 last:border-b-0">
          <div>
            <p class="text-sm font-medium text-highlighted">{{ document.name }}</p>
            <p class="mt-1 text-sm text-muted">{{ document.description }}</p>
            <p class="mt-2 text-xs text-dimmed">{{ document.fields }} fields · {{ document.mappings }} mapped fields</p>
          </div>
          <UButton color="neutral" variant="ghost" icon="i-lucide-arrow-up-right" aria-label="Edit definition" @click="openEdit(index)" />
        </article>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const showForm = ref(false);
const editingIndex = ref<number | null>(null);
const isSchemaValid = ref(false);
const defaultSchema = JSON.stringify({
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: "object",
  properties: {},
}, null, 2);
const draft = reactive({ name: "", schema: defaultSchema });
const documents = ref([
  { name: "Sales order", description: "Valid JSON Schema", fields: 12, mappings: 4, schema: defaultSchema },
  { name: "Service request", description: "Valid JSON Schema", fields: 8, mappings: 2, schema: defaultSchema },
]);

function addDocument() {
  if (!draft.name || !isSchemaValid.value) return;
  const fields = Object.keys(JSON.parse(draft.schema).properties ?? {}).length;
  const document = { name: draft.name, description: "Valid JSON Schema", fields, mappings: 0, schema: draft.schema };
  if (editingIndex.value === null) documents.value.unshift(document);
  else documents.value[editingIndex.value] = { ...documents.value[editingIndex.value], ...document };
  Object.assign(draft, { name: "", schema: defaultSchema });
  editingIndex.value = null;
  showForm.value = false;
}

function openCreate() {
  editingIndex.value = null;
  Object.assign(draft, { name: "", schema: defaultSchema });
  showForm.value = true;
}

function openEdit(index: number) {
  const document = documents.value[index];
  if (!document) return;
  editingIndex.value = index;
  Object.assign(draft, { name: document.name, schema: document.schema });
  showForm.value = true;
}
</script>
