<template>
  <UModal
    v-model:open="open"
    :title="title"
    :description="description"
    :ui="{
      content: '!h-[calc(100dvh-4rem)] !w-[calc(100vw-4rem)] !max-w-6xl',
      header: 'p-6 sm:px-10',
      body: 'p-6 sm:px-10',
      footer: 'justify-end p-6 sm:px-10',
    }"
  >
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
  title: string;
  description: string;
  formId: string;
  submitLabel: string;
  submitDisabled?: boolean;
}>();

const open = defineModel<boolean>("open", { default: false });
</script>
