<template>
  <aside
    class="relative flex h-full shrink-0 flex-col overflow-hidden border-r border-default bg-default transition-[width] duration-200"
    :class="open ? 'w-56' : 'w-14'"
  >
    <div class="flex h-14 items-center gap-2 px-3">
      <div class="flex size-8 shrink-0">
        <AppLogo class="m-auto" />
      </div>
      <span v-if="open" class="text-sm font-semibold tracking-wide text-highlighted">Khito</span>
    </div>

    <USeparator class="w-full" />

    <div class="min-h-0 flex-1 overflow-y-auto">
      <UNavigationMenu
        :items="chatNavigationItems"
      :collapsed="!open"
      orientation="vertical"
      class="p-2"
      :tooltip="{
        delayDuration: 0,
        content: { side: 'right' },
      }"
      :ui="navMenuUi"
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
      :ui="navMenuUi"
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
      :ui="navMenuUi"
      />
    </div>

    <div class="mt-auto border-t border-default p-2">
      <ClientOnly>
        <UDropdownMenu
          :items="userMenuItems"
          :content="{ align: open ? 'start' : 'center', side: 'top', sideOffset: 8 }"
          :ui="{ content: 'min-w-48' }"
        >
          <button
            type="button"
            class="flex w-full items-center gap-2 rounded-md p-1.5 transition-colors hover:bg-elevated/60 focus-visible:outline-none"
            :class="open ? '' : 'justify-center'"
          >
            <UAvatar :src="user?.imageUrl" :alt="userFullName" :text="userInitials" size="sm" />
            <span v-if="open" class="min-w-0 flex-1 text-left">
              <span class="block truncate text-xs font-medium text-highlighted">{{ userFullName }}</span>
              <span v-if="userEmail" class="block truncate text-xs text-muted">{{ userEmail }}</span>
            </span>
            <UIcon v-if="open" name="i-lucide-chevrons-up-down" class="size-3.5 shrink-0 text-dimmed" />
          </button>
        </UDropdownMenu>

        <template #fallback>
          <div class="flex w-full items-center gap-2 p-1.5" :class="open ? '' : 'justify-center'">
            <USkeleton class="size-8 rounded-full" />
            <USkeleton v-if="open" class="h-6 flex-1" />
          </div>
        </template>
      </ClientOnly>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { DropdownMenuItem, NavigationMenuItem } from "@nuxt/ui";

// Owned by the layout: the collapse toggle lives outside this aside (its
// straddling overhang must not be clipped by the aside's overflow-hidden,
// which exists to keep nav labels inside during the width transition).
const open = defineModel<boolean>("open", { default: true });

// Collapsed links hide their label, which leaves the lone leading icon parked
// at the row's start edge — center it explicitly.
const navMenuUi = computed(() => ({
  link: open.value ? "overflow-hidden p-2" : "overflow-hidden justify-center p-2",
  linkLeadingIcon: "size-4",
  linkLabel: "text-xs font-light text-highlighted",
  list: "flex flex-col gap-1",
}));
// @nuxt/ui's color-mode integration owns the <html> class; this is the
// single app-side handle for reading and switching it.
const colorMode = useColorMode();
const isDark = computed(() => colorMode.value === "dark");
const { D_A_R_K: darkShortcut } = useMagicKeys();
const { user } = useUser();
const { signOut } = useAuth();

function toggleTheme() {
  colorMode.preference = isDark.value ? "light" : "dark";
}

watch(
  () => darkShortcut?.value,
  (isPressed) => {
    if (isPressed) toggleTheme();
  },
);

const userFullName = computed(() => user.value?.fullName ?? user.value?.username ?? "Account");
const userEmail = computed(() => user.value?.primaryEmailAddress?.emailAddress ?? "");
const userInitials = computed(() => userFullName.value
  .split(/\s+/)
  .slice(0, 2)
  .map(part => part.charAt(0))
  .join("")
  .toUpperCase() || "?");

const userMenuItems = computed<DropdownMenuItem[]>(() => [
  {
    label: isDark.value ? "Light mode" : "Dark mode",
    icon: isDark.value ? "i-lucide-sun" : "i-lucide-moon",
    onSelect: toggleTheme,
  },
  { type: "separator" },
  {
    label: "Log out",
    icon: "i-lucide-log-out",
    color: "error",
    onSelect: async () => {
      await signOut.value();
      await navigateTo("/sign-in");
    },
  },
]);

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
