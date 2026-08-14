<template>
  <div class="min-h-screen bg-default">
    <section class="mx-auto w-full max-w-5xl px-6 py-12">
      <div class="flex items-start justify-between gap-4">
        <div class="space-y-2">
          <h1 class="text-xl font-semibold text-highlighted">Master data</h1>
          <p class="text-sm text-muted">Upload the customer and product files Khito can reference.</p>
        </div>
        <UButton icon="i-lucide-upload" label="Upload file" @click="fileInput?.click()" />
      </div>

      <input ref="fileInput" class="sr-only" type="file" accept=".csv,.json,text/csv,application/json" @change="handleFileUpload">

      <UAlert v-if="uploadError" class="mt-6" color="error" icon="i-lucide-circle-alert" title="Could not read this file" :description="uploadError" />

      <div class="mt-8 grid gap-8 lg:grid-cols-3">
        <section class="lg:col-span-1">
          <p class="mb-3 text-sm font-medium text-highlighted">Uploaded files</p>
          <div class="border-y border-default">
            <button
              v-for="file in uploadedFiles"
              :key="file.id"
              class="w-full border-b border-default px-1 py-4 text-left last:border-b-0"
              :class="selectedFile?.id === file.id ? 'bg-elevated' : 'hover:bg-elevated/60'"
              type="button"
              @click="selectedFile = file"
            >
              <div class="flex items-center justify-between gap-3">
                <p class="truncate text-sm font-medium text-highlighted">{{ file.name }}</p>
                <UBadge color="neutral" variant="subtle">{{ file.format }}</UBadge>
              </div>
              <p class="mt-1 text-xs text-dimmed">{{ file.rows.length }} rows · {{ file.uploadedAt }}</p>
            </button>
          </div>
        </section>

        <section class="min-w-0 lg:col-span-2">
          <template v-if="selectedFile">
            <div class="flex items-center justify-between gap-4">
              <div>
                <p class="text-sm font-medium text-highlighted">{{ selectedFile.name }}</p>
                <p class="mt-1 text-sm text-muted">Previewing {{ Math.min(selectedFile.rows.length, 5) }} of {{ selectedFile.rows.length }} rows</p>
              </div>
              <UBadge color="success" variant="subtle">Ready</UBadge>
            </div>

            <div class="mt-5 overflow-x-auto border-y border-default">
              <table class="w-full min-w-max text-left text-sm">
                <thead class="border-b border-default bg-elevated/50 text-dimmed">
                  <tr>
                    <th v-for="column in selectedColumns" :key="column" class="px-4 py-3 font-medium whitespace-nowrap">{{ column }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, rowIndex) in selectedFile.rows.slice(0, 5)" :key="rowIndex" class="border-b border-default last:border-b-0">
                    <td v-for="column in selectedColumns" :key="column" class="px-4 py-3 whitespace-nowrap text-muted">{{ formatValue(row[column]) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>

          <div v-else class="border-y border-default py-10 text-sm text-muted">Upload a CSV or JSON file to preview its rows.</div>
        </section>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
type MasterDataValue = boolean | null | number | string;
type MasterDataRow = Record<string, MasterDataValue>;

type UploadedMasterDataFile = {
  format: "CSV" | "JSON";
  id: string;
  name: string;
  rows: MasterDataRow[];
  uploadedAt: string;
};

const fileInput = ref<HTMLInputElement | null>(null);
const uploadError = ref("");
const uploadedFiles = ref<UploadedMasterDataFile[]>([
  {
    id: "customers-json",
    name: "customers.json",
    format: "JSON",
    uploadedAt: "Today",
    rows: [
      { customerId: "CUS-001", name: "Alpine Interiors", email: "orders@alpine.example", paymentTerms: "30 days" },
      { customerId: "CUS-002", name: "Nordlicht GmbH", email: "purchasing@nordlicht.example", paymentTerms: "14 days" },
      { customerId: "CUS-003", name: "Berg & Tal", email: "office@bergtal.example", paymentTerms: "30 days" },
    ],
  },
  {
    id: "product-catalogue-csv",
    name: "product-catalogue.csv",
    format: "CSV",
    uploadedAt: "Yesterday",
    rows: [
      { sku: "DESK-001", description: "Standing desk", unitPrice: 1290, currency: "EUR" },
      { sku: "CHAIR-002", description: "Ergonomic chair", unitPrice: 690, currency: "EUR" },
      { sku: "LAMP-014", description: "Task lamp", unitPrice: 145, currency: "EUR" },
    ],
  },
]);
const selectedFile = ref<UploadedMasterDataFile | null>(uploadedFiles.value[0] ?? null);

const selectedColumns = computed(() => Object.keys(selectedFile.value?.rows[0] ?? {}));

async function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  uploadError.value = "";

  try {
    const content = await file.text();
    const format = getFileFormat(file.name);
    const uploadedFile: UploadedMasterDataFile = {
      id: `${file.name}-${Date.now()}`,
      name: file.name,
      format,
      rows: format === "JSON" ? parseJsonRows(content) : parseSimpleCsv(content),
      uploadedAt: "Just now",
    };

    uploadedFiles.value.unshift(uploadedFile);
    selectedFile.value = uploadedFile;
  }
  catch (error) {
    uploadError.value = error instanceof Error ? error.message : "Choose a valid CSV or JSON file.";
  }
  finally {
    input.value = "";
  }
}

function formatValue(value: MasterDataValue | undefined) {
  if (value === null || value === undefined) return "—";
  return String(value);
}

function getFileFormat(name: string): UploadedMasterDataFile["format"] {
  if (name.toLowerCase().endsWith(".json")) return "JSON";
  if (name.toLowerCase().endsWith(".csv")) return "CSV";
  throw new Error("Only CSV and JSON files are supported.");
}

function isMasterDataRow(value: unknown): value is MasterDataRow {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseJsonRows(content: string): MasterDataRow[] {
  const parsed: unknown = JSON.parse(content);
  if (!Array.isArray(parsed) || !parsed.every(isMasterDataRow)) {
    throw new Error("JSON files must contain an array of rows.");
  }
  return parsed;
}

function parseSimpleCsv(content: string): MasterDataRow[] {
  const [headerLine, ...dataLines] = content.trim().split(/\r?\n/);
  if (!headerLine) return [];

  const headers = headerLine.split(",").map(header => header.trim()).filter(Boolean);
  if (!headers.length) throw new Error("The CSV file needs a header row.");

  return dataLines.filter(Boolean).map((line) => {
    const values = line.split(",").map(value => value.trim());
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}
</script>
