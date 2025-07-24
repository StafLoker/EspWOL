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
        :class="{
          'status-online': isWake,
          'status-offline': !isWake,
          'ping-success-glow': pingGlow === 'success',
          'ping-fail-glow': pingGlow === 'fail',
        }"
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
      <!-- Ping Button -->
      <button
        class="action-button action-button-edit"
        @click="handlePing"
        @keydown.enter="handlePing"
        @keydown.space.prevent="handlePing"
        :disabled="isPinging"
      >
        <i class="material-symbols-outlined" :class="{ 'animate-pulse': isPinging }"
          >network_ping</i
        >
      </button>

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
import { ref, watch } from 'vue'

const props = defineProps({
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
  isPinging: {
    type: Boolean,
    default: false,
  },
  pingResult: {
    type: Boolean,
    default: null,
  },
})

// Emits
const emit = defineEmits(['toggle-power', 'ping', 'edit', 'delete'])

// Reactive state for glow effect
const pingGlow = ref(null)
let glowTimeout = null

// Watch for ping result changes
watch(
  () => props.pingResult,
  (newResult) => {
    if (newResult !== null && !props.isPinging) {
      // Clear any existing timeout
      if (glowTimeout) {
        clearTimeout(glowTimeout)
      }

      // Set glow effect based on ping result
      pingGlow.value = newResult ? 'success' : 'fail'

      // Remove glow effect after 3 seconds
      glowTimeout = setTimeout(() => {
        pingGlow.value = null
      }, 3000)
    }
  },
)

// Methods
const handlePowerAction = () => {
  emit('toggle-power')
}

const handleEdit = () => {
  emit('edit')
}

const handleDelete = () => {
  emit('delete')
}

const handlePing = () => {
  emit('ping')
}

// Cleanup timeout on unmount
import { onUnmounted } from 'vue'
onUnmounted(() => {
  if (glowTimeout) {
    clearTimeout(glowTimeout)
  }
})
</script>

<style scoped>
@import '@/assets/main.css';

.status-indicator {
  @apply flex items-center justify-center w-12 h-12 rounded-full mr-4 transition-all duration-500;
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

/* Ping Glow Effects */
.ping-success-glow {
  animation: successGlow 3s ease-in-out;
  @apply shadow-2xl;
}

.ping-fail-glow {
  animation: failGlow 3s ease-in-out;
  @apply shadow-2xl;
}

@keyframes successGlow {
  0% {
    box-shadow: 0 0 0 rgba(34, 197, 94, 0);
    background-color: rgb(34 197 94 / 0.1);
  }
  25% {
    box-shadow:
      0 0 20px rgba(34, 197, 94, 0.4),
      0 0 40px rgba(34, 197, 94, 0.2);
    background-color: rgb(34 197 94 / 0.2);
  }
  50% {
    box-shadow:
      0 0 30px rgba(34, 197, 94, 0.6),
      0 0 60px rgba(34, 197, 94, 0.3);
    background-color: rgb(34 197 94 / 0.3);
  }
  75% {
    box-shadow:
      0 0 20px rgba(34, 197, 94, 0.4),
      0 0 40px rgba(34, 197, 94, 0.2);
    background-color: rgb(34 197 94 / 0.2);
  }
  100% {
    box-shadow: 0 0 0 rgba(34, 197, 94, 0);
    background-color: rgb(34 197 94 / 0.1);
  }
}

@keyframes failGlow {
  0% {
    box-shadow: 0 0 0 rgba(239, 68, 68, 0);
    background-color: rgb(239 68 68 / 0.1);
  }
  25% {
    box-shadow:
      0 0 20px rgba(239, 68, 68, 0.4),
      0 0 40px rgba(239, 68, 68, 0.2);
    background-color: rgb(239 68 68 / 0.2);
  }
  50% {
    box-shadow:
      0 0 30px rgba(239, 68, 68, 0.6),
      0 0 60px rgba(239, 68, 68, 0.3);
    background-color: rgb(239 68 68 / 0.3);
  }
  75% {
    box-shadow:
      0 0 20px rgba(239, 68, 68, 0.4),
      0 0 40px rgba(239, 68, 68, 0.2);
    background-color: rgb(239 68 68 / 0.2);
  }
  100% {
    box-shadow: 0 0 0 rgba(239, 68, 68, 0);
    background-color: rgb(239 68 68 / 0.1);
  }
}

/* Dark mode glow effects */
.dark .ping-success-glow {
  animation: darkSuccessGlow 3s ease-in-out;
}

.dark .ping-fail-glow {
  animation: darkFailGlow 3s ease-in-out;
}

@keyframes darkSuccessGlow {
  0% {
    box-shadow: 0 0 0 rgba(74, 222, 128, 0);
    background-color: rgb(74 222 128 / 0.1);
  }
  25% {
    box-shadow:
      0 0 20px rgba(74, 222, 128, 0.4),
      0 0 40px rgba(74, 222, 128, 0.2);
    background-color: rgb(74 222 128 / 0.2);
  }
  50% {
    box-shadow:
      0 0 30px rgba(74, 222, 128, 0.6),
      0 0 60px rgba(74, 222, 128, 0.3);
    background-color: rgb(74 222 128 / 0.3);
  }
  75% {
    box-shadow:
      0 0 20px rgba(74, 222, 128, 0.4),
      0 0 40px rgba(74, 222, 128, 0.2);
    background-color: rgb(74 222 128 / 0.2);
  }
  100% {
    box-shadow: 0 0 0 rgba(74, 222, 128, 0);
    background-color: rgb(74 222 128 / 0.1);
  }
}

@keyframes darkFailGlow {
  0% {
    box-shadow: 0 0 0 rgba(248, 113, 113, 0);
    background-color: rgb(248 113 113 / 0.1);
  }
  25% {
    box-shadow:
      0 0 20px rgba(248, 113, 113, 0.4),
      0 0 40px rgba(248, 113, 113, 0.2);
    background-color: rgb(248 113 113 / 0.2);
  }
  50% {
    box-shadow:
      0 0 30px rgba(248, 113, 113, 0.6),
      0 0 60px rgba(248, 113, 113, 0.3);
    background-color: rgb(248 113 113 / 0.3);
  }
  75% {
    box-shadow:
      0 0 20px rgba(248, 113, 113, 0.4),
      0 0 40px rgba(248, 113, 113, 0.2);
    background-color: rgb(248 113 113 / 0.2);
  }
  100% {
    box-shadow: 0 0 0 rgba(248, 113, 113, 0);
    background-color: rgb(248 113 113 / 0.1);
  }
}

.action-button {
  @apply flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200;
  @apply border shadow-sm hover:shadow-md active:scale-95;
  @apply focus:outline-none focus:ring-2 focus:ring-offset-2;
}

.action-button:disabled {
  @apply opacity-50 cursor-not-allowed;
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
