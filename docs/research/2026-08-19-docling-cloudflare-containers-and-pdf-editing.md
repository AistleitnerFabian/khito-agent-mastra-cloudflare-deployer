# Docling on Cloudflare Containers and PDF image replacement

**Question.** Is the existing Docling Cloudflare Container a good fit, is there a Cloudflare-native alternative that can replace images in PDFs, or should the service move to a VPS?

## Current implementation

The web Worker accepts an inbox queue item, obtains its source from R2, addresses a `DoclingContainer` by inbox-item ID, and writes Docling JSON/Markdown back to R2. The container uses `ghcr.io/docling-project/docling-serve-cpu:v1.30.0`, disables Internet access, allows at most three `standard-2` instances, and sleeps after 30 seconds. `standard-2` currently provides 1 vCPU, 6 GiB memory, and 12 GB disk. [Cloudflare instance limits](https://developers.cloudflare.com/containers/platform-details/limits/)

This is a sensible architecture for **asynchronous, low-to-moderate-volume, CPU-only extraction of bounded PDFs**: R2 is the durable source/artifact store and the Queue already decouples user-facing requests from cold starts and conversion duration. A Container is explicitly intended for existing Linux/containerized, resource-intensive applications. [Cloudflare Containers overview](https://developers.cloudflare.com/containers/)

## Important limits of the current choice

Containers are not durable compute nodes. Their disk is ephemeral after sleep, and `sleepAfter` deliberately stops an idle instance; therefore model caches, temporary source files, and output artifacts must remain in the image/R2 rather than be relied on locally. [Cloudflare container lifecycle](https://developers.cloudflare.com/containers/platform-details/architecture/)

The current configuration deliberately gives each document a separate named instance and caps all work at three 1-vCPU containers. This is safe isolation, but it also means no pooling of warmed Docling model state across documents and a predictable throughput ceiling. Cloudflare currently requires manual instance selection/routing for this pattern rather than built-in stateless autoscaling. [Cloudflare scaling and routing](https://developers.cloudflare.com/containers/platform-details/scaling-and-routing/)

Cloudflare's documented Container sizes top out at 4 vCPUs, 12 GiB RAM, and 20 GB disk. In contrast, Docling supports CUDA acceleration and documents GPU-oriented configurations and benchmarks; Cloudflare's Container sizes document CPU, memory, and disk—not a GPU instance type. This makes the present CPU image appropriate only when measured conversion time, page count, and queue delay meet product targets. It is not the right compute plane for VLM/GPU Docling or sustained heavy OCR/layout workloads. [Cloudflare limits](https://developers.cloudflare.com/containers/platform-details/limits/) [Docling GPU support](https://docling-project.github.io/docling/usage/gpu/)

## PDF image replacement is a separate capability

Docling is a document conversion/extraction system. Its supported output formats do not include PDF, so it cannot round-trip a source PDF and replace its embedded images. It can preserve/export page, picture, and table images for downstream use, but that is extraction, not mutation. [Docling supported formats](https://docling-project.github.io/docling/usage/supported_formats/) [Docling figure export example](https://github.com/docling-project/docling/blob/main/docs/examples/export_figures.py)

Cloudflare Images is also not an alternative: its supported inputs and outputs are image formats such as PNG, JPEG, WebP, SVG, and AVIF—PDF is absent—and its transformations concern optimizing/delivering images. Browser Rendering can create a **new** PDF from a URL or HTML, rather than edit an uploaded source PDF. [Cloudflare Images formats](https://developers.cloudflare.com/images/get-started/limits/) [Browser Rendering PDF endpoint](https://developers.cloudflare.com/browser-rendering/rest-api/pdf-endpoint/)

For an embedded-image substitution, use a dedicated PDF editor such as PyMuPDF. Its `Page.replace_image(xref, ...)` replaces an image object; the associated documentation warns that the replacement is global where the same image xref is reused, so the edit service must make that product rule explicit. PyMuPDF also supports inserting images and redaction, which may be the safer semantic operation when the request is "cover this area with a replacement" rather than "mutate the shared image object." [PyMuPDF Page API](https://pymupdf.readthedocs.io/en/latest/page.html) [PyMuPDF image recipes](https://pymupdf.readthedocs.io/en/latest/recipes-images.html)

## Recommendation

Keep Cloudflare as the front door and orchestration layer: upload originals and versioned outputs in R2, enqueue work, and record job state in D1. Do **not** replace Docling with a Cloudflare-native product for this requirement; none of the relevant managed products edits source PDFs.

For the current extraction-only use case, retain the Container **provided a representative benchmark demonstrates acceptable queue delay, conversion latency, memory use, and cost**. The first improvement should be a separately named PDF-transformation service/API, not trying to extend Docling into an editor.

Host that service where the workload demands it:

- Keep the new PyMuPDF-based image-replacement worker in a Cloudflare Container if edits are occasional, CPU-bound, bounded in size, and the same serverless operational model is valuable. It can coexist with Docling but should emit a new, versioned PDF to R2; never overwrite the original.
- Move Docling plus the PyMuPDF editing service to a VPS when documents are large/frequent, predictable low latency matters, jobs need more than the Container resource ceiling, or VLM/GPU acceleration is required. A GPU VPS is specifically warranted for GPU/VLM Docling; a normal CPU VPS may be enough for ordinary extraction plus PDF mutation.

The practical default is therefore a **hybrid**: keep Cloudflare Worker/Queue/R2/D1, keep the existing Container while it satisfies measured CPU extraction demand, and introduce a private VPS processing service only when the heavier workload or GPU requirement arrives. That avoids prematurely operating a VPS while retaining a clean migration boundary.

## Suggested proof before committing to either path

1. Benchmark a representative set: born-digital PDFs, scans/OCR, dense tables, image-heavy files, and the largest accepted file; record p50/p95 end-to-end queue latency, conversion seconds, peak memory, failures, and cost per document.
2. Define the exact edit semantics: replace every occurrence of a shared PDF image object, replace only one visual placement, or redact/overlay a page rectangle. These are different operations and affect the PDF-library implementation.
3. If the Container is retained, add output versioning and an explicit artifact contract for source PDF, extracted figures, proposed replacement assets, and edited PDF. This works unchanged whether the processor later moves to a VPS.
