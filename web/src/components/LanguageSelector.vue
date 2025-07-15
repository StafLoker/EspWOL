<template>
  <div class="relative">
    <SelectRoot v-model="currentLocale" @update:model-value="changeLanguage">
      <SelectTrigger class="pill-button flex items-center min-w-[120px]">
        <div class="flex items-center">
          <i class="material-symbols-outlined text-lg mr-2">language</i>
          <SelectValue :placeholder="currentLanguageName" />
        </div>
        <i class="material-symbols-outlined text-sm ml-1">expand_more</i>
      </SelectTrigger>

      <SelectPortal>
        <SelectContent
          class="select-content bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-lg shadow-lg z-[200] min-w-[120px]"
        >
          <SelectViewport class="p-2">
            <SelectItem
              v-for="lang in availableLanguages"
              :key="lang.code"
              :value="lang.code"
              class="select-item px-3 py-2 rounded-md hover:bg-stone-200 dark:hover:bg-zinc-700 cursor-pointer text-warm-gray-800 dark:text-stone-200 transition-colors duration-150 focus:outline-none focus:bg-stone-200 dark:focus:bg-zinc-700 relative"
              :class="{
                'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100':
                  currentLocale === lang.code,
              }"
            >
              <SelectItemIndicator
                class="absolute left-1 w-[20px] inline-flex items-center justify-center"
              >
                <i class="material-symbols-outlined text-sm">check</i>
              </SelectItemIndicator>
              <SelectItemText class="pl-6">
                {{ lang.name }}
              </SelectItemText>
            </SelectItem>
          </SelectViewport>
        </SelectContent>
      </SelectPortal>
    </SelectRoot>
  </div>
</template>

<script setup>
import {
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectPortal,
  SelectContent,
  SelectViewport,
  SelectItem,
  SelectItemText,
  SelectItemIndicator,
} from 'reka-ui'
import { useLanguage } from '@/composables/useLanguage'

const { currentLocale, currentLanguageName, availableLanguages, changeLanguage } = useLanguage()
</script>
