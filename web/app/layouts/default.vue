<template>
  <div class="flex h-dvh w-full overflow-hidden bg-default">
    <!-- The wrapper hugs the aside's (animating) width without clipping, so the
         toggle can straddle the sidebar border; the aside itself stays
         overflow-hidden to contain nav labels during the width transition. -->
    <div class="relative shrink-0">
      <AppSidebar v-model:open="sidebarOpen" />

      <div class="absolute top-4 right-0 z-20 translate-x-1/2 bg-default">
        <UButton
          icon="i-lucide-chevrons-right"
          color="neutral"
          variant="link"
          :class="{ 'rotate-180': sidebarOpen }"
          :ui="{ leadingIcon: 'size-4' }"
          aria-label="Toggle sidebar"
          @click="sidebarOpen = !sidebarOpen"
        />
      </div>
    </div>

    <main class="h-full w-full min-w-0 flex-1 overflow-y-auto">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const sidebarOpen = ref(true);
</script>
