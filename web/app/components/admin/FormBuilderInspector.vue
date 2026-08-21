<template>
  <aside v-if="field" class="flex w-72 shrink-0 flex-col overflow-y-auto rounded-md border border-default bg-default p-4">
    <div class="flex items-center justify-between">
      <p class="text-xs font-semibold tracking-wide text-dimmed uppercase">Field</p>
      <div class="flex items-center gap-0.5">
        <UButton icon="i-lucide-copy" size="xs" color="neutral" variant="ghost" aria-label="Duplicate field" @click="emit('duplicate')" />
        <UButton icon="i-lucide-trash-2" size="xs" color="error" variant="ghost" aria-label="Delete field" @click="emit('remove')" />
      </div>
    </div>

    <div class="mt-3 space-y-4">
      <UFormField name="label" label="Label">
        <UInput :model-value="field.label" placeholder="e.g. Project" @update:model-value="value => emit('update', { label: String(value) })" />
      </UFormField>
      <UFormField name="key" label="Key" hint="Property name in the JSON Schema">
        <UInput v-model="keyDraft" placeholder="project" @change="commitKey" />
      </UFormField>
      <UFormField name="required" label="Required">
        <UCheckbox :model-value="field.required" label="Value must be present" @update:model-value="value => emit('update', { required: value === true })" />
      </UFormField>
      <UFormField name="description" label="Description">
        <UTextarea :model-value="field.description" :rows="2" placeholder="Shown as help text" @update:model-value="value => emit('update', { description: String(value) })" />
      </UFormField>
    </div>

    <USeparator class="my-5" />
    <p class="text-xs font-semibold tracking-wide text-dimmed uppercase">{{ formFieldKindLabel(field.kind) }} settings</p>
    <div class="mt-3 space-y-4">
      <UFormField v-if="field.kind !== 'checkbox'" name="placeholder" label="Placeholder">
        <UInput :model-value="field.placeholder" placeholder="e.g. GT1 VSG 6" @update:model-value="value => emit('update', { placeholder: String(value) })" />
      </UFormField>
      <UFormField v-if="field.kind === 'textarea'" name="rows" label="Rows">
        <UInput type="number" :min="2" :max="12" :model-value="field.rows" @update:model-value="value => emitNumber('rows', value)" />
      </UFormField>
      <template v-else-if="field.kind === 'number'">
        <UFormField name="min" label="Min">
          <UInput type="number" :model-value="field.min === null ? '' : String(field.min)" @update:model-value="value => emitNumber('min', value)" />
        </UFormField>
        <UFormField name="max" label="Max">
          <UInput type="number" :model-value="field.max === null ? '' : String(field.max)" @update:model-value="value => emitNumber('max', value)" />
        </UFormField>
      </template>
      <UFormField v-else-if="field.kind === 'select'" name="options" label="Options">
        <div class="w-full space-y-2">
          <div v-for="(option, index) in field.options" :key="index" class="flex items-center gap-1.5">
            <UInput :model-value="option" class="min-w-0 flex-1" @update:model-value="value => setOption(index, String(value))" />
            <UButton icon="i-lucide-x" size="xs" color="neutral" variant="ghost" aria-label="Remove option" @click="removeOption(index)" />
          </div>
          <UButton block variant="outline" size="xs" icon="i-lucide-plus" label="Add option" class="border-dashed" @click="addOption" />
        </div>
      </UFormField>
    </div>

    <USeparator class="my-5" />
    <p class="text-xs font-semibold tracking-wide text-dimmed uppercase">Width</p>
    <div class="mt-2 grid grid-cols-5 gap-1">
      <button
        v-for="preset in formWidthPresets"
        :key="preset.span"
        type="button"
        class="rounded-sm border px-1 py-1.5 text-xs font-medium transition-colors"
        :class="field.span === preset.span ? 'border-primary bg-primary/10 text-primary' : 'border-default text-muted hover:border-accented hover:text-highlighted'"
        @click="emit('update', { span: preset.span })"
      >
        {{ preset.label }}
      </button>
    </div>
    <p class="mt-2 text-[10px] leading-4 text-dimmed">Applies to every breakpoint. Override one by dragging the field's edge on the canvas while that breakpoint is selected.</p>

    <div v-if="overrideEntries.length" class="mt-3 space-y-1.5">
      <div v-for="entry in overrideEntries" :key="entry.breakpoint" class="flex items-center justify-between rounded-sm border border-default px-2.5 py-1.5 text-xs">
        <span class="flex items-center gap-1.5 text-muted">
          <UIcon :name="formBreakpointConfigs[entry.breakpoint].icon" class="size-3.5" />
          {{ formBreakpointConfigs[entry.breakpoint].label }}
        </span>
        <span class="flex items-center gap-1">
          <span class="font-medium text-highlighted">{{ fractionLabel(entry.span) }}</span>
          <UButton icon="i-lucide-rotate-ccw" size="xs" color="neutral" variant="ghost" aria-label="Reset override" @click="resetOverride(entry.breakpoint)" />
        </span>
      </div>
    </div>
  </aside>

  <aside v-else class="grid w-72 shrink-0 place-items-center rounded-md border border-default bg-default p-6 text-center">
    <div>
      <UIcon name="i-lucide-mouse-pointer-2" class="size-5 text-dimmed" />
      <p class="mt-2 text-sm text-muted">Nothing selected</p>
      <p class="mt-1 text-xs text-dimmed">Select a field on the canvas to edit its properties.</p>
    </div>
  </aside>
</template>

<script setup lang="ts">
import {
  formBreakpointConfigs,
  formBuilderBreakpoints,
  formFieldKindLabel,
  formWidthPresets,
  fractionLabel,
  type BuilderField,
  type FormBuilderBreakpoint,
} from "~/utils/form-builder";

const props = defineProps<{ field: BuilderField | null }>();

const emit = defineEmits<{
  update: [patch: Partial<BuilderField>];
  remove: [];
  duplicate: [];
}>();

const overrideEntries = computed(() =>
  formBuilderBreakpoints
    .filter(breakpoint => props.field?.overrides[breakpoint] !== undefined)
    .map(breakpoint => ({ breakpoint, span: props.field!.overrides[breakpoint]! })),
);

function resetOverride(breakpoint: FormBuilderBreakpoint) {
  if (!props.field) return;
  const { [breakpoint]: _reset, ...overrides } = props.field.overrides;
  emit("update", { overrides });
}

// Key edits commit slugged on blur/enter, so typing spaces stays possible.
const keyDraft = ref("");

watch(
  () => props.field,
  (field) => {
    keyDraft.value = field?.key ?? "";
  },
  { immediate: true },
);

function commitKey() {
  if (!props.field || keyDraft.value === props.field.key) return;
  emit("update", { key: keyDraft.value });
}

function emitNumber(name: "rows" | "min" | "max", value: string | number) {
  const parsed = typeof value === "number" ? value : Number.parseFloat(value);
  if (name === "rows") {
    emit("update", { rows: Math.min(12, Math.max(2, Number.isFinite(parsed) ? Math.round(parsed) : 3)) });
    return;
  }
  emit("update", { [name]: Number.isFinite(parsed) ? parsed : null });
}

function setOption(index: number, value: string) {
  if (!props.field) return;
  const options = [...props.field.options];
  options[index] = value;
  emit("update", { options });
}

function addOption() {
  if (!props.field) return;
  emit("update", { options: [...props.field.options, ""] });
}

function removeOption(index: number) {
  if (!props.field) return;
  emit("update", { options: props.field.options.filter((_, optionIndex) => optionIndex !== index) });
}
</script>
