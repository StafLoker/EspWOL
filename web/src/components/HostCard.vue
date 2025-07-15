<template>
  <div
    class="bg-stone-50 dark:bg-zinc-800 rounded-2xl p-6 shadow-sm border border-stone-200 dark:border-zinc-700 hover:shadow-md transition-all duration-200"
  >
    <!-- Host Name -->
    <h3 class="text-xl font-semibold text-warm-gray-800 dark:text-stone-100 mb-4">{{ name }}</h3>

    <!-- Status Indicator and IP/MAC -->
    <div class="flex items-center mb-4 bg-zinc-200 dark:bg-zinc-700 rounded-2xl px-2 py-3">
      <button
        type="button"
        class="status-indicator"
        :class="{ 'status-online': isWake, 'status-offline': !isWake }"
        @click="handlePowerAction"
        :aria-label="isWake ? 'Turn off device' : 'Wake up device'"
        tabindex="0"
        @keydown.enter="handlePowerAction"
        @keydown.space.prevent="handlePowerAction"
      >
        <i class="material-symbols-outlined status-icon">power_settings_new</i>
      </button>

      <div class="flex-1">
        <p class="text-lg font-medium text-warm-gray-700 dark:text-stone-200 mb-1">{{ ip }}</p>
        <p class="text-sm text-warm-gray-500 dark:text-stone-400 font-mono">{{ mac }}</p>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex items-center gap-3 justify-end">
      <!-- Edit Button -->
      <button
        class="action-button action-button-edit"
        @click="handleEdit"
        @keydown.enter="handleEdit"
        @keydown.space.prevent="handleEdit"
      >
        <i class="material-symbols-outlined">edit</i>
      </button>

      <!-- Delete Button -->
      <button
        class="action-button action-button-delete"
        @click="handleDelete"
        @keydown.enter="handleDelete"
        @keydown.space.prevent="handleDelete"
      >
        <i class="material-symbols-outlined">delete</i>
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  name: {
    type: String,
    required: true,
  },
  ip: {
    type: String,
    required: true,
  },
  mac: {
    type: String,
    required: true,
  },
  isWake: {
    type: Boolean,
    default: false,
  },
})

// Emits
const emit = defineEmits(['togglePower', 'edit', 'delete'])

// Methods
const handlePowerAction = () => {
  emit('togglePower')
}

const handleEdit = () => {
  emit('edit')
}

const handleDelete = () => {
  emit('delete')
}
</script>

<style scoped>
@reference "@/assets/main.css";

.status-indicator {
  @apply flex items-center justify-center w-12 h-12 rounded-full mr-4 transition-all duration-200;
  @apply cursor-pointer hover:scale-110 active:scale-95;
  @apply focus:outline-none focus:ring-2 focus:ring-offset-2;
}

.status-indicator:hover {
  @apply shadow-lg;
}

.status-online.status-indicator {
  @apply hover:bg-green-200 dark:hover:bg-green-800/50;
  @apply focus:ring-green-200 dark:focus:ring-green-800;
}

.status-offline.status-indicator {
  @apply hover:bg-red-200 dark:hover:bg-red-800/50;
  @apply focus:ring-red-200 dark:focus:ring-red-800;
}

.status-indicator .status-icon {
  @apply pointer-events-none;
}

/* Status icon animations */
.status-online .status-icon:hover {
  @apply animate-pulse;
}

.status-offline .status-icon:hover {
  @apply animate-bounce;
}

.status-online {
  @apply bg-green-100 dark:bg-green-900/30;
}

.status-offline {
  @apply bg-red-100 dark:bg-red-900/30;
}

.status-icon {
  @apply text-xl transition-colors duration-200;
}

.status-online .status-icon {
  @apply text-green-600 dark:text-green-400;
}

.status-offline .status-icon {
  @apply text-red-600 dark:text-red-400;
}

.action-button {
  @apply flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200;
  @apply border shadow-sm hover:shadow-md active:scale-95;
  @apply focus:outline-none focus:ring-2 focus:ring-offset-2;
}

.action-button-edit {
  @apply bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-500 hover:border-slate-500 hover:text-white;
  @apply dark:bg-slate-900/20 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-600 dark:hover:border-slate-600 dark:hover:text-white;
  @apply focus:ring-slate-200 dark:focus:ring-slate-800;
}

.action-button-delete {
  @apply bg-red-50 border-red-200 text-red-700 hover:bg-red-500 hover:border-red-500 hover:text-white;
  @apply dark:bg-red-900/20 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-600 dark:hover:border-red-600 dark:hover:text-white;
  @apply focus:ring-red-200 dark:focus:ring-red-800;
}

.action-button i {
  @apply text-lg transition-colors duration-200;
}
</style>
