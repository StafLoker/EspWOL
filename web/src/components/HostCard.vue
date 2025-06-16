<template>
  <div class="host-card">
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
