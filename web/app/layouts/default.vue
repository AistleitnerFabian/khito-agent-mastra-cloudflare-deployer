<template>
  <div class="flex min-h-screen w-full bg-default">
    <AppSidebar />

    <main class="w-full min-w-0 flex-1">
      <slot />
    </main>
  </div>
</template>
