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

    <UNavigationMenu
      :items="chatNavigationItems"
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
        Khito <span class="ms-1 text-dimmed">AI chat</span>
      </template>
    </UNavigationMenu>

    <div v-if="open" class="px-4 pt-3 pb-1">
      <p class="text-xs font-medium text-dimmed">Workspace</p>
    </div>

    <UNavigationMenu
      :items="workspaceNavigationItems"
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

    <div v-if="open" class="px-4 pt-3 pb-1">
      <p class="text-xs font-medium text-dimmed">Admin</p>
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

    <div class="mt-auto border-t border-default p-2">
      <div class="mb-2 flex justify-center">
        <ClientOnly>
          <UserButton after-sign-out-url="/sign-in" />
        </ClientOnly>
      </div>
      <UButton
        v-if="!open"
        :icon="isDark ? 'i-lucide-moon' : 'i-lucide-sun'"
        color="neutral"
        variant="ghost"
        class="w-full"
        :aria-label="isDark ? 'Use light theme' : 'Use dark theme'"
        @click="isDark = !isDark"
      />
      <div v-else class="flex items-center gap-2 px-2 py-1.5">
        <UIcon :name="isDark ? 'i-lucide-moon' : 'i-lucide-sun'" class="size-4 text-muted" />
        <span class="text-xs text-highlighted">Dark mode</span>
        <USwitch v-model="isDark" class="ms-auto" aria-label="Toggle dark mode" />
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

const open = ref(true);
const isDark = useDark({ storageKey: "khito-theme" });
const { D_A_R_K: darkShortcut } = useMagicKeys();

watch(
  () => darkShortcut?.value,
  (isPressed) => {
    if (isPressed) isDark.value = !isDark.value;
  },
);

const chatNavigationItems: NavigationMenuItem[] = [
  {
    label: "Khito",
    icon: "i-lucide-bot",
    to: "/",
    slot: "khito",
  },
];

const workspaceNavigationItems: NavigationMenuItem[] = [
  {
    label: "Inbox",
    icon: "i-lucide-inbox",
    to: "/inbox",
  },
  {
    label: "Documents",
    icon: "i-lucide-files",
    to: "/documents",
  },
  {
    label: "Archive",
    icon: "i-lucide-search",
    disabled: true,
  },
];

const adminNavigationItems: NavigationMenuItem[] = [
  {
    label: "Document definitions",
    icon: "i-lucide-file-text",
    to: "/admin/document-types",
  },
  {
    label: "Master data",
    icon: "i-lucide-database",
    to: "/admin/master-data",
  },
  {
    label: "Custom Knowledge",
    icon: "i-lucide-notebook-pen",
    to: "/admin/custom-knowledge",
  },
  {
    label: "Connections",
    icon: "i-lucide-plug-zap",
    to: "/admin/connections",
  },
];
</script>
