<template>
  <div class="h-screen bg-green-tea-300 dark:bg-nero-800">
    <div class="flex h-full flex-col items-center justify-center">
      <img src="@/assets/brand/espwol.svg" alt="" class="size-30" />
      <h1 class="mt-6 mb-8 text-center text-2xl font-bold text">
        {{ $t('pages.login.title') }}
      </h1>
      <!-- Card -->
      <div class="min-w-[25rem] rounded-2xl bg-white p-8 shadow-lg dark:shadow-neutral-700 dark:bg-espresso-700">
        <p class="mb-6 text-center text-lg font-medium text-gray-700 dark:text-white">
          {{ $t('pages.login.message') }}
        </p>
        <form class="space-y-6" @submit.prevent="handleSubmit">
          <!-- Username -->
          <div class="space-y-1">
            <Label for="username" class="form-label">
              {{ $t('pages.login.username') }}
            </Label>
            <input
              id="username-field"
              name="username"
              type="text"
              :placeholder="$t('pages.login.placeholderUsername')"
              class="form-input"
            />
          </div>

          <!-- Password -->
          <div class="space-y-1">
            <Label for="password" class="form-label">
              {{ $t('pages.login.password') }}
            </Label>
            <input
              id="password-field"
              name="password"
              type="password"
              :placeholder="$t('pages.login.placeholderPassword')"
              class="form-input"
            />
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            class="button"
          >
            {{ $t('pages.login.signin') }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Label } from 'reka-ui'

async function handleSubmit() {
  
}
</script>
