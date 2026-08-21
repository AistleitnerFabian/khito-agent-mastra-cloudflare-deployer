<template>
  <div class="flex flex-col overflow-hidden border border-default bg-elevated">
    <div ref="editorElement" class="min-h-96 flex-1 text-sm" />
    <p class="shrink-0 border-t border-default px-4 py-3 text-sm" :class="isValid ? 'text-success' : 'text-error'">
      {{ validationMessage }}
    </p>
  </div>
</template>

<script setup lang="ts">
import Ajv2020 from "ajv/dist/2020";
import { basicSetup } from "codemirror";
import { json } from "@codemirror/lang-json";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

const schema = defineModel<string>({ required: true });
const emit = defineEmits<{ validationChange: [isValid: boolean] }>();
const editorElement = ref<HTMLElement>();
const isValid = ref(false);
const validationMessage = ref("Enter a JSON Schema.");
const validator = new Ajv2020({ strict: false });
let editor: EditorView | undefined;

function validate(value: string) {
  try {
    const parsed = JSON.parse(value);
    validator.compile(parsed);
    isValid.value = true;
    validationMessage.value = "Valid JSON Schema";
  }
  catch (error) {
    isValid.value = false;
    validationMessage.value = error instanceof Error ? error.message : "Invalid JSON Schema";
  }
  emit("validationChange", isValid.value);
}

onMounted(() => {
  editor = new EditorView({
    parent: editorElement.value,
    state: EditorState.create({
      doc: schema.value,
      extensions: [
        basicSetup,
        json(),
        EditorView.theme({ "&": { height: "100%" }, ".cm-scroller": { overflow: "auto" } }),
        EditorView.updateListener.of((update) => {
          if (!update.docChanged) return;
          schema.value = update.state.doc.toString();
          validate(schema.value);
        }),
      ],
    }),
  });
  validate(schema.value);
});

watch(schema, (value) => {
  if (!editor || value === editor.state.doc.toString()) return;
  editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: value } });
  validate(value);
});

onBeforeUnmount(() => editor?.destroy());
</script>
