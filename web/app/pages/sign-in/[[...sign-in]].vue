<template>
  <main class="grid min-h-screen place-items-center bg-default px-6 py-12">
    <SignIn force-redirect-url="/inbox" />
  </main>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
});
</script>
