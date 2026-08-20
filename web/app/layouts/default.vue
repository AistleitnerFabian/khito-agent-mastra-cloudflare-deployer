<template>
  <div class="flex h-dvh w-full overflow-hidden bg-default">
    <AppSidebar />

    <main class="h-full w-full min-w-0 flex-1 overflow-y-auto">
      <slot />
    </main>
  </div>
</template>
