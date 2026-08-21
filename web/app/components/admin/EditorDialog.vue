<template>
  <UModal
    v-model:open="open"
    :title="title"
    :description="description"
    :ui="{
      content: '!h-[calc(100dvh-2rem)] !w-[calc(100vw-2rem)] !max-w-none sm:!max-h-[calc(100dvh-2rem)]',
      header: 'px-4 py-3 sm:px-6',
      body: 'flex min-h-0 flex-1 flex-col overflow-hidden p-0',
      footer: 'justify-end px-4 py-3 sm:px-6',
    }"
  >
    <template #title>
      <slot name="title">{{ title }}</slot>
    </template>
    <template #body>
      <slot />
    </template>

    <template #footer>
      <UButton color="neutral" variant="outline" label="Cancel" @click="open = false" />
      <UButton type="submit" :form="formId" :label="submitLabel" :disabled="submitDisabled" />
    </template>
  </UModal>
</template>

<script setup lang="ts">
defineProps<{
  title?: string;
  description: string;
  formId: string;
  submitLabel: string;
  submitDisabled?: boolean;
}>();

const open = defineModel<boolean>("open", { default: false });
</script>
