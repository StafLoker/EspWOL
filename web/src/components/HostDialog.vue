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

          <!-- Periodic Ping -->
          <div class="dialog-form-field">
            <label for="periodic-ping" class="dialog-form-label">
              {{ $t('components.hostDialog.periodicPing') }}
            </label>
            <SelectRoot v-model="formData.periodicPing">
              <SelectTrigger class="dialog-form-select">
                <SelectValue :placeholder="$t('components.hostDialog.periodicPingPlaceholder')" />
                <i class="material-symbols-outlined text-lg ml-2">expand_more</i>
              </SelectTrigger>
              <SelectPortal>
                <SelectContent class="select-content">
                  <SelectViewport class="select-viewport">
                    <SelectItem
                      v-for="option in periodicPingOptions"
                      :key="option.value"
                      :value="option.value"
                      class="select-item"
                    >
                      <SelectItemText>{{ option.label }}</SelectItemText>
                    </SelectItem>
                  </SelectViewport>
                </SelectContent>
              </SelectPortal>
            </SelectRoot>
          </div>

          <!-- Additional info for editing -->
          <div v-if="isEdit && lastPing" class="dialog-form-field">
            <p class="text-sm text-warm-gray-500 dark:text-stone-400 flex items-center">
              <i class="material-symbols-outlined text-sm mr-1">schedule</i>
              {{ $t('components.hostDialog.lastPing') }}: {{ formatLastPing(lastPing) }}
            </p>
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
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectPortal,
  SelectContent,
  SelectViewport,
  SelectItem,
  SelectItemText,
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
  lastPing: {
    type: Number,
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
  periodicPing: 0,
})

// Opciones de ping periódico con traducciones
const periodicPingOptions = computed(() => [
  { value: 0, label: t('components.hostDialog.periodicOptions.disabled') },
  { value: 60, label: t('components.hostDialog.periodicOptions.oneMinute') },
  { value: 300, label: t('components.hostDialog.periodicOptions.fiveMinutes') },
  { value: 600, label: t('components.hostDialog.periodicOptions.tenMinutes') },
  { value: 900, label: t('components.hostDialog.periodicOptions.fifteenMinutes') },
  { value: 1800, label: t('components.hostDialog.periodicOptions.thirtyMinutes') },
  { value: 2700, label: t('components.hostDialog.periodicOptions.fortyFiveMinutes') },
  { value: 3600, label: t('components.hostDialog.periodicOptions.oneHour') },
  { value: 10800, label: t('components.hostDialog.periodicOptions.threeHours') },
  { value: 21600, label: t('components.hostDialog.periodicOptions.sixHours') },
  { value: 43200, label: t('components.hostDialog.periodicOptions.twelveHours') },
  { value: 86400, label: t('components.hostDialog.periodicOptions.twentyFourHours') },
])

// Resetear formulario cuando se abre/cierra el diálogo
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
          periodicPing: props.host.periodicPing || 0,
        }
      } else {
        // Modo agregar - limpiar formulario
        formData.value = {
          name: '',
          mac: '',
          ip: '',
          periodicPing: 0,
        }
      }
    }
  },
)

function formatLastPing(seconds) {
  if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) {
    return t('components.hostDialog.notAvailable')
  }

  const minutes = Math.floor(seconds / 60)
  if (minutes === 0) {
    return t('components.hostDialog.timeFormats.lessThanMinute')
  } else if (minutes === 1) {
    return t('components.hostDialog.timeFormats.oneMinuteAgo')
  } else if (minutes < 60) {
    return t('components.hostDialog.timeFormats.minutesAgo', { minutes })
  } else {
    const hours = Math.floor(minutes / 60)
    return hours === 1
      ? t('components.hostDialog.timeFormats.oneHourAgo')
      : t('components.hostDialog.timeFormats.hoursAgo', { hours })
  }
}

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
      periodicPing: Number(formData.value.periodicPing),
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
