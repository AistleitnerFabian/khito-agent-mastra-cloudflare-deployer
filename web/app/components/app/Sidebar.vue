<template>
  <aside
    class="relative flex min-h-screen shrink-0 flex-col border-r border-default bg-default transition-[width] duration-200"
    :class="open ? 'w-56' : 'w-14'"
  >
    <div class="flex h-14 items-center gap-2 px-3">
      <div class="flex size-8 shrink-0">
        <AppLogo class="m-auto" />
      </div>
      <span v-if="open" class="text-sm font-semibold tracking-wide text-highlighted">Khito</span>
    </div>

    <div class="absolute top-4 right-0 translate-x-1/2 bg-default">
      <UButton
        icon="i-lucide-chevrons-right"
        color="neutral"
        variant="link"
        :class="{ 'rotate-180': open }"
        :ui="{ leadingIcon: 'size-4' }"
        aria-label="Toggle sidebar"
        @click="open = !open"
      />
    </div>

    <USeparator class="w-full" />

    <UInput
      v-if="open"
      icon="i-lucide-search"
      placeholder="Search..."
      class="mx-2 mt-2 w-auto overflow-hidden"
      variant="soft"
      :ui="{
        leading: 'pointer-events-none ps-2',
        leadingIcon: 'size-4',
        base: '!outline-0',
      }"
      @click="open = true"
    />

    <UNavigationMenu
      :items="primaryNavigationItems"
      :collapsed="!open"
      orientation="vertical"
      class="p-2"
      :tooltip="{
        delayDuration: 0,
        content: { side: 'right' },
      }"
      :ui="{
        link: 'overflow-hidden p-2',
        linkLeadingIcon: 'size-4',
        linkLabel: 'text-xs font-light text-highlighted',
        list: 'flex flex-col gap-1',
      }"
    >
      <template #khito-label>
        Khito <span class="ms-1 text-muted">AI chat</span>
      </template>
    </UNavigationMenu>

    <div v-if="open" class="px-4 pt-3 pb-1">
      <p class="text-xs font-medium text-muted">Admin</p>
    </div>

    <UNavigationMenu
      :items="adminNavigationItems"
      :collapsed="!open"
      orientation="vertical"
      class="p-2 pt-0"
      :tooltip="{
        delayDuration: 0,
        content: { side: 'right' },
      }"
      :ui="{
        link: 'overflow-hidden p-2',
        linkLeadingIcon: 'size-4',
        linkLabel: 'text-xs font-light text-highlighted',
        list: 'flex flex-col gap-1',
      }"
    />
  </aside>
</template>

<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

const open = ref(true);

const primaryNavigationItems: NavigationMenuItem[] = [
  {
    label: "Khito",
    icon: "i-lucide-bot",
    to: "/",
    slot: "khito",
  },
  {
    label: "Memory",
    icon: "i-lucide-brain-circuit",
    disabled: true,
  },
  {
    label: "Settings",
    icon: "i-lucide-settings-2",
    disabled: true,
  },
];

const adminNavigationItems: NavigationMenuItem[] = [
  {
    label: "Admin",
    icon: "i-lucide-shield-check",
    disabled: true,
  },
];
</script>
