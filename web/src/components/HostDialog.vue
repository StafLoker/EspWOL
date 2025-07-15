<template>
  <DialogRoot v-model:open="open">
    <DialogPortal>
      <DialogOverlay class="dialog-overlay" />
      <DialogContent class="dialog-content max-w-[500px]">
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

        <!-- Advertencia de límite de hosts -->
        <div
          v-if="!isEdit && !canAddMore"
          class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
        >
          <div class="flex items-center">
            <i class="material-symbols-outlined text-red-600 dark:text-red-400 mr-2 text-sm"
              >warning</i
            >
            <p class="text-red-800 dark:text-red-200 text-sm">
              {{ $t('components.hostDialog.hostLimitReached') }}
            </p>
          </div>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <!-- Name Field -->
          <div class="space-y-2">
            <label class="label-input">
              {{ $t('components.hostDialog.name') }}
              <span class="text-red-500">*</span>
            </label>
            <input
              v-model="formData.name"
              type="text"
              :placeholder="$t('components.hostDialog.namePlaceholder')"
              class="input-field"
              :class="{ 'border-red-500 dark:border-red-400': errors.name }"
              maxlength="32"
              required
            />
            <div class="flex justify-between text-xs">
              <span v-if="errors.name" class="text-red-600 dark:text-red-400">
                {{ errors.name }}
              </span>
              <span class="text-warm-gray-500 dark:text-stone-400 ml-auto">
                {{ formData.name.length }}/32
              </span>
            </div>
          </div>

          <!-- MAC Address Field -->
          <div class="space-y-2">
            <label class="label-input">
              {{ $t('components.hostDialog.mac') }}
              <span class="text-red-500">*</span>
            </label>
            <input
              v-model="formData.mac"
              type="text"
              :placeholder="$t('components.hostDialog.macPlaceholder')"
              class="input-field font-mono"
              :class="{ 'border-red-500 dark:border-red-400': errors.mac }"
              @input="formatMacAddress"
              maxlength="17"
              required
            />
            <div class="flex justify-between text-xs">
              <span v-if="errors.mac" class="text-red-600 dark:text-red-400">
                {{ errors.mac }}
              </span>
              <span v-else class="text-warm-gray-500 dark:text-stone-400">
                {{ $t('components.hostDialog.macFormat') }}
              </span>
            </div>
          </div>

          <!-- IP Address Field -->
          <div class="space-y-2">
            <label class="label-input">
              {{ $t('components.hostDialog.ip') }}
            </label>
            <input
              v-model="formData.ip"
              type="text"
              :placeholder="$t('components.hostDialog.ipPlaceholder')"
              class="input-field font-mono"
              :class="{ 'border-red-500 dark:border-red-400': errors.ip }"
            />
            <div class="flex justify-between text-xs">
              <span v-if="errors.ip" class="text-red-600 dark:text-red-400">
                {{ errors.ip }}
              </span>
              <span v-else class="text-warm-gray-500 dark:text-stone-400">
                {{ $t('components.hostDialog.ipOptional') }}
              </span>
            </div>
          </div>

          <!-- Auto Wake Switch -->
          <div
            class="flex items-center justify-between p-3 bg-stone-50 dark:bg-zinc-800 rounded-lg"
          >
            <div class="flex-1">
              <label class="font-medium text-warm-gray-900 dark:text-stone-100">
                {{ $t('components.hostDialog.autoWake') }}
              </label>
              <p class="text-sm text-warm-gray-600 dark:text-stone-400 mt-1">
                {{ $t('components.hostDialog.autoWakeDescription') }}
              </p>
            </div>
            <SwitchRoot v-model:checked="formData.autoWake" class="switch-root">
              <SwitchThumb class="switch-thumb" />
            </SwitchRoot>
          </div>

          <!-- Error general -->
          <div
            v-if="submitError"
            class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
          >
            <div class="flex items-center">
              <i class="material-symbols-outlined text-red-600 dark:text-red-400 mr-2 text-sm"
                >error</i
              >
              <p class="text-red-800 dark:text-red-200 text-sm">{{ submitError }}</p>
            </div>
          </div>
        </form>

        <div class="dialog-actions">
          <button
            type="button"
            @click="handleCancel"
            class="pill-button-cancel"
            :disabled="isSubmitting"
          >
            {{ $t('components.hostDialog.cancel') }}
          </button>
          <button
            type="button"
            @click="handleSubmit"
            class="pill-button-apply-solid"
            :disabled="isSubmitting || !isValid || (!isEdit && !canAddMore)"
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
            <span v-else class="flex items-center">
              <i class="material-symbols-outlined mr-1 text-sm">{{ isEdit ? 'save' : 'add' }}</i>
              {{ isEdit ? $t('components.hostDialog.save') : $t('components.hostDialog.add') }}
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
  SwitchThumb,
} from 'reka-ui'
import { ref, watch, computed, reactive } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// =============================================================================
// PROPS & EMITS
// =============================================================================

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  host: {
    type: Object,
    default: null,
  },
  canAddMore: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['update:open', 'save'])

// =============================================================================
// STATE
// =============================================================================

const formData = reactive({
  name: '',
  mac: '',
  ip: '',
  autoWake: false,
})

const errors = reactive({
  name: '',
  mac: '',
  ip: '',
})

const isSubmitting = ref(false)
const submitError = ref('')

// =============================================================================
// COMPUTED
// =============================================================================

const open = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value),
})

const isEdit = computed(() => !!(props.host && props.host.id))

const isValid = computed(() => {
  return (
    formData.name.trim().length > 0 &&
    formData.name.length <= 32 &&
    isValidMACAddress(formData.mac) &&
    (formData.ip === '' || isValidIPv4(formData.ip)) &&
    !errors.name &&
    !errors.mac &&
    !errors.ip
  )
})

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

function isValidMACAddress(mac) {
  const macRegex = /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/
  return macRegex.test(mac)
}

function isValidIPv4(ip) {
  const ipRegex =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
  return ipRegex.test(ip)
}

function validateForm() {
  // Reset errors
  errors.name = ''
  errors.mac = ''
  errors.ip = ''

  // Validate name
  if (!formData.name.trim()) {
    errors.name = t('components.hostDialog.validation.nameRequired')
  } else if (formData.name.length > 32) {
    errors.name = t('components.hostDialog.validation.nameMaxLength')
  }

  // Validate MAC address
  if (!formData.mac) {
    errors.mac = t('components.hostDialog.validation.macRequired')
  } else if (!isValidMACAddress(formData.mac)) {
    errors.mac = t('components.hostDialog.validation.macInvalid')
  }

  // Validate IP address (optional)
  if (formData.ip && !isValidIPv4(formData.ip)) {
    errors.ip = t('components.hostDialog.validation.ipInvalid')
  }

  return !errors.name && !errors.mac && !errors.ip
}

// =============================================================================
// METHODS
// =============================================================================

function formatMacAddress(event) {
  let value = event.target.value.replace(/[^0-9A-Fa-f]/g, '').toUpperCase()

  // Add colons every 2 characters
  if (value.length > 0) {
    value = value.match(/.{1,2}/g).join(':')
    if (value.length > 17) {
      value = value.substring(0, 17)
    }
  }

  formData.mac = value
}

function resetForm() {
  formData.name = ''
  formData.mac = ''
  formData.ip = ''
  formData.autoWake = false

  errors.name = ''
  errors.mac = ''
  errors.ip = ''

  submitError.value = ''
  isSubmitting.value = false
}

function loadHostData() {
  if (props.host) {
    formData.name = props.host.name || ''
    formData.mac = props.host.mac || ''
    formData.ip = props.host.ip || ''
    formData.autoWake = props.host.autoWake || false
  } else {
    resetForm()
  }
}

function handleCancel() {
  open.value = false
}

async function handleSubmit() {
  if (!validateForm()) {
    return
  }

  if (!isEdit.value && !props.canAddMore) {
    submitError.value = t('components.hostDialog.validation.hostLimitReached')
    return
  }

  isSubmitting.value = true
  submitError.value = ''

  try {
    const hostData = {
      name: formData.name.trim(),
      mac: formData.mac,
      ip: formData.ip || undefined,
      autoWake: formData.autoWake,
    }

    emit('save', hostData)

    // El cierre del diálogo se maneja en el componente padre
    // después de que la operación sea exitosa
  } catch (error) {
    submitError.value = error.message || t('components.hostDialog.validation.generalError')
  } finally {
    isSubmitting.value = false
  }
}

// =============================================================================
// WATCHERS
// =============================================================================

watch(
  () => props.open,
  (newValue) => {
    if (newValue) {
      loadHostData()
    } else {
      // Delay reset to avoid visual glitches during closing animation
      setTimeout(resetForm, 300)
    }
  },
)

watch(() => props.host, loadHostData)

// Real-time validation
watch(
  () => formData.name,
  () => {
    if (errors.name) {
      if (!formData.name.trim()) {
        errors.name = t('components.hostDialog.validation.nameRequired')
      } else if (formData.name.length > 32) {
        errors.name = t('components.hostDialog.validation.nameMaxLength')
      } else {
        errors.name = ''
      }
    }
  },
)

watch(
  () => formData.mac,
  () => {
    if (errors.mac) {
      if (!formData.mac) {
        errors.mac = t('components.hostDialog.validation.macRequired')
      } else if (!isValidMACAddress(formData.mac)) {
        errors.mac = t('components.hostDialog.validation.macInvalid')
      } else {
        errors.mac = ''
      }
    }
  },
)

watch(
  () => formData.ip,
  () => {
    if (errors.ip) {
      if (formData.ip && !isValidIPv4(formData.ip)) {
        errors.ip = t('components.hostDialog.validation.ipInvalid')
      } else {
        errors.ip = ''
      }
    }
  },
)
</script>
