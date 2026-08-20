<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>

<script setup lang="ts">
// Applied at the app root so layout-less windows — like the popped-out
// document viewer — follow the persisted theme too, not just the main shell.
useDark({ storageKey: "khito-theme" });
</script>
