<template>
  <div class="h-full flex flex-col items-center justify-center">
    <img src="@/assets/brand/espwol.svg" alt="" class="size-24" />
    <h1 class="mt-6 mb-8 text-center text-2xl font-bold text-warm-gray-800 dark:text-stone-100">
      {{ $t('pages.login.title') }}
    </h1>
    <!-- Card -->
    <div class="card">
      <p class="mb-6 text-center text-lg font-medium text-warm-gray-600 dark:text-stone-200">
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
            required
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
            required
          />
        </div>

        <p v-if="invalidCredentials" class="text-red-500 dark:text-red-400 text-sm">
          {{ $t('pages.login.invalidCredentials') }}
        </p>

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
</template>

<script setup>
import { Label } from 'reka-ui'
import { ref } from 'vue';

const invalidCredentials = ref(false)

async function handleSubmit() {

}
</script>
