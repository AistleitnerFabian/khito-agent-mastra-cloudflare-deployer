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
import type { DocumentDetail } from "~/types/documents";

definePageMeta({ layout: false });

const route = useRoute();
const clerkFetch = useClerkFetch();

const document = ref<DocumentDetail | null>(null);
const loading = ref(true);
const error = ref("");
const activeField = ref<DocumentDataField>("project");

useTitle(() => document.value ? `${document.value.name} · Khito` : "Khito document viewer");

onMounted(async () => {
  loading.value = true;
  error.value = "";

  try {
    document.value = await clerkFetch<DocumentDetail>(`/api/documents/${route.params.id}`);
    activeField.value = documentDataFields.find(field => document.value?.bounds[field.id]?.length)?.id ?? "project";
  }
  catch (loadError) {
    error.value = loadError instanceof Error ? loadError.message : "The document could not be loaded.";
  }
  finally {
    loading.value = false;
  }
});
</script>
