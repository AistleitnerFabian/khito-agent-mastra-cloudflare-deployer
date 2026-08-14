<template>
  <div class="min-h-screen bg-default">
    <section class="mx-auto w-full max-w-3xl px-6 py-12">
      <div class="flex items-start justify-between gap-4">
        <div class="space-y-2">
          <h1 class="text-xl font-semibold text-highlighted">ERP connections</h1>
          <p class="text-sm text-muted">Where approved work should be sent.</p>
        </div>
        <UButton icon="i-lucide-plus" label="Add connection" @click="openCreate" />
      </div>

      <AdminCreateDialog v-model:open="showForm" :title="editingIndex === null ? 'Add ERP connection' : 'Edit ERP connection'" description="Add an ERP destination for approved work." form-id="erp-connection-form" :submit-label="editingIndex === null ? 'Add connection' : 'Save changes'">
        <form id="erp-connection-form" class="space-y-4" @submit.prevent="addConnection">
          <UFormField name="name" label="Connection name" required><UInput v-model="draft.name" size="lg" placeholder="e.g. Acme ERP production" /></UFormField>
          <UFormField name="provider" label="ERP provider" required><UInput v-model="draft.provider" size="lg" placeholder="e.g. Microsoft Dynamics 365" /></UFormField>
          <UFormField name="environment" label="Environment"><USelect v-model="draft.environment" size="lg" :items="['Sandbox', 'Production']" /></UFormField>
        </form>
      </AdminCreateDialog>

      <div class="mt-8 border-y border-default">
        <article v-for="(connection, index) in connections" :key="connection.name" class="flex items-center justify-between gap-4 border-b border-default py-5 last:border-b-0">
          <div>
            <p class="text-sm font-medium text-highlighted">{{ connection.name }}</p>
            <p class="mt-1 text-sm text-muted">{{ connection.provider }} · {{ connection.environment }}</p>
            <p class="mt-2 text-xs text-dimmed">Last checked {{ connection.lastChecked }}</p>
          </div>
          <div class="flex items-center gap-2"><UBadge :color="connection.status === 'Connected' ? 'success' : 'warning'" variant="subtle">{{ connection.status }}</UBadge><UButton color="neutral" variant="ghost" icon="i-lucide-arrow-up-right" aria-label="Edit connection" @click="openEdit(index)" /></div>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const showForm = ref(false);
const editingIndex = ref<number | null>(null);
const draft = reactive({ name: "", provider: "", environment: "Sandbox" });
const connections = ref([
  { name: "Acme ERP sandbox", provider: "Acme ERP", environment: "Sandbox", status: "Connected", lastChecked: "just now" },
  { name: "Finance export", provider: "SFTP", environment: "Production", status: "Needs setup", lastChecked: "never" },
]);

function addConnection() {
  if (!draft.name || !draft.provider) return;
  const connection = { ...draft, status: "Needs setup", lastChecked: "never" };
  if (editingIndex.value === null) connections.value.unshift(connection);
  else connections.value[editingIndex.value] = { ...connections.value[editingIndex.value], ...connection };
  Object.assign(draft, { name: "", provider: "", environment: "Sandbox" });
  showForm.value = false;
}

function openCreate() {
  editingIndex.value = null;
  Object.assign(draft, { name: "", provider: "", environment: "Sandbox" });
  showForm.value = true;
}

function openEdit(index: number) {
  const connection = connections.value[index];
  if (!connection) return;
  editingIndex.value = index;
  Object.assign(draft, { name: connection.name, provider: connection.provider, environment: connection.environment });
  showForm.value = true;
}
</script>
