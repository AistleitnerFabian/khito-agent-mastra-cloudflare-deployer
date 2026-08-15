<template>
  <div class="min-h-screen bg-default">
    <section class="mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-start px-6 py-24">
      <div class="mx-auto w-full max-w-3xl">
        <div class="mb-10">
          <h1 class="text-2xl font-semibold tracking-tight text-highlighted sm:text-3xl">Welcome, <span class="bg-primary/10 px-1 text-primary">Fabian! 👋</span></h1>
          <p class="mt-1 text-xl font-medium tracking-tight text-muted sm:text-2xl">How can I help you today?</p>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <section class="border border-default p-4">
            <p class="flex items-center gap-2 text-xs text-dimmed"><UIcon name="i-lucide-files" class="size-3.5" /> Recently viewed files</p>
            <div class="mt-2 space-y-1.5">
              <button v-for="file in recentFiles" :key="file" class="block text-left text-xs text-default hover:text-primary" type="button" @click="prompt = `Open ${file}`">{{ file }}</button>
            </div>
          </section>

          <section class="border border-default p-4">
            <p class="flex items-center gap-2 text-xs text-dimmed"><UIcon name="i-lucide-sparkles" class="size-3.5" /> Continue working</p>
            <div class="mt-2 flex items-center gap-3">
              <div class="grid size-8 shrink-0 place-items-center bg-elevated text-muted"><UIcon name="i-lucide-file-text" class="size-3.5" /></div>
              <div>
                <p class="text-sm font-medium text-highlighted">Service request</p>
                <p class="mt-1 text-xs text-muted">Draft prepared today</p>
              </div>
            </div>
          </section>

          <button
            v-for="suggestion in suggestions"
            :key="suggestion.title"
            class="group border border-default p-4 text-left transition-colors hover:bg-elevated"
            type="button"
            @click="prompt = suggestion.prompt"
          >
            <p class="flex items-center gap-2 text-xs text-dimmed"><UIcon name="i-lucide-sparkles" class="size-3.5" /> Suggested task</p>
            <p class="mt-2 text-sm font-medium text-highlighted">{{ suggestion.title }}</p>
            <p class="mt-1 text-xs leading-5 text-muted">{{ suggestion.description }}</p>
          </button>
        </div>

        <section class="mt-4 border border-default p-4">
          <div class="flex items-center justify-between gap-4">
            <p class="text-sm font-medium text-highlighted">My tasks <span class="ms-1 text-muted">{{ tasks.length }}</span></p>
            <UButton color="neutral" variant="ghost" size="xs" label="View all" />
          </div>
          <button
            v-for="task in tasks"
            :key="task.title"
            class="flex w-full items-center gap-3 py-1.5 text-left text-sm text-default"
            type="button"
            @click="prompt = task.prompt"
          >
            <span class="size-1.5 shrink-0" :class="task.color" />
            <span>{{ task.title }}</span>
            <span class="ms-auto text-xs text-dimmed">{{ task.due }}</span>
          </button>
        </section>

        <div class="mt-6">
          <UChatPrompt
            v-model="prompt"
            placeholder="Message Khito..."
            :rows="3"
            :ui="{ body: 'text-sm', base: 'text-sm' }"
          >
            <UChatPromptSubmit aria-label="Send message to Khito" />
          </UChatPrompt>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const prompt = ref("");

const recentFiles = ["Sales order · Alpine Interiors", "Product catalogue · Q2", "Customer notes · Nordlicht GmbH"];

const suggestions = [
  {
    title: "Review an incoming document",
    description: "Extract the details and prepare a clear next step.",
    prompt: "Review an incoming document with me.",
  },
  {
    title: "Find the right master data",
    description: "Look up a customer, product, or existing record.",
    prompt: "Help me find the right master data.",
  },
];

const tasks = [
  { title: "Confirm delivery details", due: "Today", color: "bg-primary", prompt: "Help me confirm the delivery details." },
  { title: "Review pricing for the sales order", due: "Today", color: "bg-warning", prompt: "Review the pricing for the sales order." },
  { title: "Match a customer record", due: "Tomorrow", color: "bg-info", prompt: "Help me match a customer record." },
];
</script>
