<template>
  <div class="min-h-screen bg-default">
    <section class="mx-auto w-full max-w-3xl px-6 py-12">
      <div class="flex items-start justify-between gap-4">
        <div class="space-y-2">
          <h1 class="text-xl font-semibold text-highlighted">Master data</h1>
          <p class="text-sm text-muted">Files Khito can reference while working.</p>
        </div>
        <UButton icon="i-lucide-upload" label="Upload file" @click="uploadDialogOpen = true" />
      </div>

      <UModal
        v-model:open="uploadDialogOpen"
        title="Upload master data"
        description="Choose a CSV or JSON file."
        :ui="{
          content: '!h-[calc(100dvh-4rem)] !w-[calc(100vw-4rem)] !max-w-6xl',
          header: 'p-6 sm:px-10',
          body: 'flex items-center justify-center p-6 sm:px-10',
        }"
      >
        <template #body>
          <UFileUpload
            v-model="selectedUpload"
            accept=".csv,.json,text/csv,application/json"
            class="w-full max-w-3xl"
            description="Drop a file here or click to select it."
            label="Upload a CSV or JSON file"
            variant="area"
          />
        </template>
      </UModal>

      <UAlert v-if="uploadError" class="mt-6" color="error" icon="i-lucide-circle-alert" title="Could not read this file" :description="uploadError" />

      <div class="mt-8 border-y border-default">
        <article v-for="file in uploadedFiles" :key="file.id" class="flex items-start justify-between gap-4 border-b border-default py-5 last:border-b-0">
          <div>
            <div class="flex items-center gap-2">
              <p class="text-sm font-medium text-highlighted">{{ file.name }}</p>
              <UBadge color="neutral" variant="subtle">{{ file.format }}</UBadge>
            </div>
            <p class="mt-2 text-sm text-muted">{{ file.rows.length }} rows · {{ getColumns(file).length }} columns · {{ file.uploadedAt }}</p>
          </div>

          <UButton color="neutral" variant="ghost" icon="i-lucide-arrow-up-right" :aria-label="`View ${file.name}`" @click="openViewerId = file.id" />

          <UModal
            :open="openViewerId === file.id"
            :title="file.name"
            :description="`${file.rows.length} rows · ${getColumns(file).length} columns`"
            :ui="{
              content: '!h-[calc(100dvh-4rem)] !w-[calc(100vw-4rem)] !max-w-6xl',
              header: 'p-6 sm:px-10',
              body: 'p-0',
            }"
            @update:open="setViewerOpen(file.id, $event)"
          >
            <template #body>
              <section class="overflow-hidden">
                <div class="flex justify-end border-b border-default px-6 py-4 sm:px-10"><UBadge color="success" variant="subtle">Database view</UBadge></div>

                <div class="h-[calc(100dvh-13rem)] overflow-auto">
                  <table class="w-full min-w-max text-left text-sm">
                    <thead class="sticky top-0 border-b border-default bg-elevated text-dimmed">
                      <tr>
                        <th v-for="column in getColumns(file)" :key="column" class="px-4 py-3 font-medium whitespace-nowrap">{{ column }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(row, rowIndex) in file.rows" :key="rowIndex" class="border-b border-default last:border-b-0">
                        <td v-for="column in getColumns(file)" :key="column" class="max-w-64 truncate px-4 py-3 text-muted">{{ formatValue(row[column]) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            </template>
          </UModal>
        </article>
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

const uploadError = ref("");
const openViewerId = ref<string | null>(null);
const selectedUpload = ref<File | null>(null);
const uploadDialogOpen = ref(false);
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

async function uploadMasterDataFile(file: File) {
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
    uploadDialogOpen.value = false;
  }
  catch (error) {
    uploadError.value = error instanceof Error ? error.message : "Choose a valid CSV or JSON file.";
  }
  finally {
    selectedUpload.value = null;
  }
}

watch(selectedUpload, (file) => {
  if (file) void uploadMasterDataFile(file);
});

function formatValue(value: MasterDataValue | undefined) {
  if (value === null || value === undefined) return "—";
  return String(value);
}

function getColumns(file: UploadedMasterDataFile) {
  return Object.keys(file.rows[0] ?? {});
}

function setViewerOpen(fileId: string, isOpen: boolean) {
  openViewerId.value = isOpen ? fileId : null;
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
