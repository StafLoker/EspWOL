<template>
  <DialogRoot v-model:open="open">
    <DialogPortal>
      <DialogOverlay class="dialog-overlay" />
      <DialogContent class="dialog-content">
        <DialogTitle class="dialog-title">
          {{
            isEdit ? $t('components.hostDialog.editTitle') : $t('components.hostDialog.addTitle')
          }}
        </DialogTitle>

        <DialogDescription class="dialog-description">
          {{
            isEdit
              ? $t('components.hostDialog.editDescription')
              : $t('components.hostDialog.addDescription')
          }}
        </DialogDescription>

        <form @submit.prevent="handleSubmit" class="dialog-form">
          <!-- Hostname -->
          <div class="dialog-form-field">
            <label for="host-name" class="dialog-form-label">
              {{ $t('components.hostDialog.hostName') }}
            </label>
            <input
              id="host-name"
              v-model="formData.name"
              type="text"
              class="dialog-form-input"
              :placeholder="$t('components.hostDialog.hostNamePlaceholder')"
              required
            />
          </div>

          <!-- MAC Address -->
          <div class="dialog-form-field">
            <label for="host-mac" class="dialog-form-label">
              {{ $t('components.hostDialog.macAddress') }}
            </label>
            <input
              id="host-mac"
              v-model="formData.mac"
              type="text"
              class="dialog-form-input"
              :placeholder="$t('components.hostDialog.macAddressPlaceholder')"
              pattern="^([0-9A-Fa-f]{2}[:]){5}([0-9A-Fa-f]{2})$"
              required
            />
          </div>

          <!-- IP Address -->
          <div class="dialog-form-field">
            <label for="host-ip" class="dialog-form-label">
              {{ $t('components.hostDialog.ipAddress') }}
            </label>
            <input
              id="host-ip"
              v-model="formData.ip"
              type="text"
              class="dialog-form-input"
              :placeholder="$t('components.hostDialog.ipAddressPlaceholder')"
              pattern="^(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])(\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])){3}$"
              required
            />
          </div>

          <!-- Auto Wake on Ping Failure -->
          <div class="dialog-form-field">
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <label class="dialog-form-label mb-1">
                  {{ $t('components.hostDialog.autoWake') }}
                </label>
                <p class="text-xs text-warm-gray-500 dark:text-stone-400">
                  {{ $t('components.hostDialog.autoWakeDescription') }}
                </p>
              </div>
              <SwitchRoot
                v-model="formData.autoWake"
                class="w-[42px] h-[24px] shadow-sm flex data-[state=unchecked]:bg-stone-300 data-[state=checked]:bg-green-600 dark:data-[state=unchecked]:bg-zinc-600 dark:data-[state=checked]:bg-green-500 border border-stone-300 data-[state=checked]:border-green-600 dark:border-zinc-600 dark:data-[state=checked]:border-green-500 rounded-full relative transition-[background] focus-within:outline-none focus-within:shadow-[0_0_0_2px] focus-within:shadow-green-200 dark:focus-within:shadow-green-800"
              >
                <SwitchThumb
                  class="w-5 h-5 my-auto bg-white text-xs flex items-center justify-center shadow-lg rounded-full transition-transform translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[18px]"
                />
              </SwitchRoot>
            </div>
          </div>
        </form>

        <div class="dialog-actions">
          <DialogClose as-child>
            <button type="button" class="pill-button-cancel">
              {{ $t('components.hostDialog.cancel') }}
            </button>
          </DialogClose>
          <button
            type="submit"
            form="host-form"
            class="pill-button-apply-solid"
            :disabled="isSubmitting"
            @click="handleSubmit"
          >
            <span v-if="isSubmitting" class="flex items-center">
              <svg
                class="animate-spin -ml-1 mr-2 h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {{ isEdit ? $t('components.hostDialog.saving') : $t('components.hostDialog.adding') }}
            </span>
            <span v-else>
              <div class="flex items-center">
                <i class="material-symbols-outlined mr-1 text-sm">{{ isEdit ? 'save' : 'add' }}</i>
                {{ isEdit ? $t('components.hostDialog.save') : $t('components.hostDialog.add') }}
              </div>
            </span>
          </button>
        </div>

        <DialogClose class="dialog-close">
          <i class="material-symbols-outlined text-lg">close</i>
        </DialogClose>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<script setup>
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
  SwitchRoot,
  SwitchThumb
} from 'reka-ui'
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  host: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:open', 'save'])

const open = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value),
})

const isEdit = computed(() => !!props.host)
const isSubmitting = ref(false)

const formData = ref({
  name: '',
  mac: '',
  ip: '',
  autoWake: false,
})

watch(
  () => props.open,
  (newValue) => {
    if (newValue) {
      if (props.host) {
        // Modo edición - cargar datos del host
        formData.value = {
          name: props.host.name || '',
          mac: props.host.mac || '',
          ip: props.host.ip || '',
          autoWake: props.host.autoWake || false,
        }
      } else {
        // Modo agregar - limpiar formulario
        formData.value = {
          name: '',
          mac: '',
          ip: '',
          autoWake: false,
        }
      }
    }
  },
)

async function handleSubmit() {
  if (isSubmitting.value) return

  isSubmitting.value = true

  try {
    // Validación básica
    if (!formData.value.name.trim() || !formData.value.mac.trim() || !formData.value.ip.trim()) {
      throw new Error('Todos los campos son obligatorios')
    }

    // Emitir evento con los datos del formulario
    emit('save', {
      ...formData.value,
      periodicPing: 0, // Remove periodicPing since it's now global
    })

    // Cerrar el diálogo después de un pequeño delay para mostrar el estado de carga
    setTimeout(() => {
      open.value = false
      isSubmitting.value = false
    }, 500)
  } catch (error) {
    console.error('Error al guardar host:', error)
    isSubmitting.value = false
    // Aquí puedes mostrar una notificación de error
  }
}
</script>

<style scoped>
@reference "@/assets/main.css";

/* Dialog animations */
@keyframes overlayShow {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes contentShow {
  from {
    opacity: 0;
    transform: translate(-50%, -48%) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

@keyframes contentHide {
  from {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  to {
    opacity: 0;
    transform: translate(-50%, -48%) scale(0.96);
  }
}

@keyframes overlayHide {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

/* Dialog base styles */
.dialog-overlay {
  @apply bg-black/50 dark:bg-black/70 fixed inset-0 z-30 transition-all duration-200;
  animation: overlayShow 200ms cubic-bezier(0.16, 1, 0.3, 1);
}

.dialog-overlay[data-state='closed'] {
  animation: overlayHide 200ms cubic-bezier(0.16, 1, 0.3, 1);
}

.dialog-content {
  @apply z-[100] data-[state=open]:animate-none fixed top-[50%] left-[50%] max-h-[85vh] w-[90vw] max-w-[500px] translate-x-[-50%] translate-y-[-50%];
  @apply rounded-2xl bg-stone-50 dark:bg-zinc-800 p-6 shadow-2xl border border-stone-200 dark:border-zinc-700;
  @apply focus:outline-none transition-all duration-200;
  animation: contentShow 200ms cubic-bezier(0.16, 1, 0.3, 1);
}

.dialog-content[data-state='closed'] {
  animation: contentHide 150ms cubic-bezier(0.16, 1, 0.3, 1);
}

.dialog-title {
  @apply text-warm-gray-800 dark:text-stone-100 m-0 text-xl font-semibold mb-4;
}

.dialog-description {
  @apply text-warm-gray-600 dark:text-stone-300 text-sm leading-relaxed mb-6;
}

.dialog-close {
  @apply absolute top-4 right-4 inline-flex h-8 w-8 items-center justify-center rounded-lg;
  @apply text-warm-gray-500 dark:text-stone-400 hover:text-warm-gray-700 dark:hover:text-stone-200;
  @apply hover:bg-stone-200 dark:hover:bg-zinc-700 transition-all duration-200;
  @apply focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-600;
}

/* Form elements in dialogs */
.dialog-form {
  @apply space-y-4;
}

.dialog-form-field {
  @apply space-y-2;
}

.dialog-form-label {
  @apply block text-sm font-medium text-warm-gray-700 dark:text-stone-200;
}

.dialog-form-input {
  @apply w-full rounded-lg border border-stone-300 dark:border-zinc-600 bg-stone-100 dark:bg-zinc-700 px-4 py-2.5;
  @apply text-warm-gray-800 dark:text-stone-100 placeholder:text-warm-gray-400 dark:placeholder:text-zinc-400;
  @apply shadow-sm focus:border-slate-500 dark:focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-800;
  @apply transition-all duration-200;
}

.dialog-form-input:invalid {
  @apply border-red-300 dark:border-red-600 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-200 dark:focus:ring-red-800;
}

.dialog-form-select {
  @apply w-full rounded-lg border border-stone-300 dark:border-zinc-600 bg-stone-100 dark:bg-zinc-700 px-4 py-2.5;
  @apply text-warm-gray-800 dark:text-stone-100 shadow-sm focus:border-slate-500 dark:focus:border-slate-400;
  @apply focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-800 transition-all duration-200;
  @apply min-h-[42px] flex items-center justify-between cursor-pointer;
}

.dialog-form-select:hover {
  @apply bg-stone-200 dark:bg-zinc-600;
}

.dialog-actions {
  @apply flex justify-end gap-3 mt-6 pt-4 border-t border-stone-200 dark:border-zinc-700;
}

/* Select dropdown specific styles */
.select-content {
  @apply bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-lg shadow-lg z-[200];
  @apply min-w-[var(--reka-select-trigger-width)] max-h-[300px] overflow-hidden;
}

.select-viewport {
  @apply p-2;
}

.select-item {
  @apply px-3 py-2 rounded-md hover:bg-stone-200 dark:hover:bg-zinc-700 cursor-pointer;
  @apply text-warm-gray-800 dark:text-stone-200 transition-colors duration-150;
  @apply focus:outline-none focus:bg-stone-200 dark:focus:bg-zinc-700;
}

.select-item[data-state="checked"] {
  @apply bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100;
}

.select-item[data-disabled] {
  @apply opacity-50 cursor-not-allowed;
}
</style>
