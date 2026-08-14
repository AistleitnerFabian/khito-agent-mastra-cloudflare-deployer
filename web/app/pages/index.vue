<template>
  <div class="flex min-h-screen flex-col bg-default">
    <header class="flex h-14 shrink-0 items-center justify-between border-b border-default px-6">
      <div class="flex items-center gap-3">
        <div class="grid size-7 place-items-center bg-primary text-inverted">
          <UIcon name="i-lucide-bot" class="size-4" />
        </div>
        <div>
          <h1 class="text-sm font-semibold text-highlighted">Khito</h1>
          <p class="text-xs text-muted">AI agent</p>
        </div>
      </div>

      <span class="flex items-center gap-2 text-xs text-toned">
        <span class="size-1.5 bg-primary" />
        Ready to help
      </span>
    </header>

    <section class="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-12">
      <div class="mb-8 flex items-start gap-4">
        <div class="grid size-11 shrink-0 place-items-center bg-primary text-inverted">
          <UIcon name="i-lucide-sparkles" class="size-5" />
        </div>
        <div class="space-y-2">
          <p class="text-sm font-medium text-primary">Khito AI</p>
          <h2 class="text-3xl font-semibold tracking-tight text-highlighted">What can I help you build?</h2>
          <p class="max-w-xl text-default">
            Ask Khito to plan work, reason through a problem, or help you move your project forward.
          </p>
        </div>
      </div>

      <UChatMessage
        id="khito-welcome"
        role="assistant"
        :parts="[]"
        content="Start a conversation whenever you’re ready."
        icon="i-lucide-bot"
        variant="naked"
        class="mb-6"
      />

      <UChatPrompt placeholder="Message Khito..." :rows="3">
        <UChatPromptSubmit aria-label="Send message to Khito" />
      </UChatPrompt>
    </section>
  </div>
</template>
