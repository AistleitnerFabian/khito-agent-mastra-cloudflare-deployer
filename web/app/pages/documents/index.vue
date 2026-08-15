<template>
  <div class="flex min-h-screen bg-default">
    <aside class="w-full max-w-xs shrink-0 overflow-y-auto border-r border-default px-5 py-6 sm:px-6">
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="text-sm font-semibold text-highlighted">Glass order</p>
          <p class="mt-1 text-xs text-muted">Fill the extracted fields</p>
        </div>
        <UBadge color="warning" variant="subtle" size="sm">Draft</UBadge>
      </div>

      <USeparator class="my-6" />

      <form class="space-y-5" @submit.prevent>
        <UFormField label="Project" name="project">
          <UInput v-model="documentData.project" />
        </UFormField>

        <UFormField label="Position" name="position">
          <UTextarea v-model="documentData.position" :rows="3" />
        </UFormField>

        <UFormField label="Glass type" name="glass-type">
          <UTextarea v-model="documentData.glassType" :rows="3" />
        </UFormField>

        <UFormField label="Glass build-up" name="glass-build-up">
          <UTextarea v-model="documentData.glassBuildUp" :rows="5" />
        </UFormField>

        <UFormField label="Remark" name="remark">
          <UInput v-model="documentData.remark" />
        </UFormField>
      </form>

      <div class="sticky bottom-0 mt-8 bg-default pt-4">
        <UButton block label="Save document" />
      </div>
    </aside>

    <main class="min-w-0 flex-1 overflow-auto bg-elevated/40 p-5 sm:p-8">
      <div class="mx-auto mb-4 flex max-w-[55rem] items-center justify-between gap-4">
        <p class="truncate text-xs text-muted">Glas-Bestellung · 1. Tour · Packliste EG</p>
        <UButton color="neutral" variant="ghost" icon="i-lucide-expand" aria-label="Expand document" />
      </div>

      <article class="relative mx-auto aspect-[210/297] w-full max-w-[55rem] overflow-hidden border border-default bg-default">
        <img
          class="size-full object-contain"
          src="/documents/glas-packliste-page-1.png"
          alt="First page of the glass order packing list"
        >

        <div
          v-for="field in overlayFields"
          :key="field.label"
          class="pointer-events-none absolute border border-primary/60 bg-primary/10 px-2 py-1"
          :style="field.position"
        >
          <p class="text-[10px] leading-none font-medium text-primary">{{ field.label }}</p>
        </div>
      </article>
    </main>
  </div>
</template>

<script setup lang="ts">
const documentData = reactive({
  project: "2025-9467 · NB Kita Münster-Sarmsheim",
  position: "1.4 (105) / 1.4a (106) / 1.5 (107) / 1.6 (108)",
  glassType: "GT1 VSG 6 (0,38) / Float 4 / VSG 6 (0,38)",
  glassBuildUp: "Outside 6 VSG from Float 0,38\nMiddle 4 Floatglass\nInside 6 VSG from Float 0,38\nTotal ~51 mm",
  remark: "Sonnenschutzglas g=0,4",
});

const overlayFields = [
  { label: "Project", position: { top: "15.5%", left: "8%" } },
  { label: "Position", position: { top: "18%", left: "8%" } },
  { label: "Glass type", position: { top: "24%", left: "8%" } },
  { label: "Glass build-up", position: { top: "26.5%", left: "8%" } },
  { label: "Remark", position: { top: "47%", left: "8%" } },
];
</script>
