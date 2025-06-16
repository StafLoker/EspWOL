<template>
  <div class="h-full">
    <div class="flex justify-between items-center">
      <p class="text-2xl font-medium text">{{ $t('pages.home.hosts') }}</p>
      <button class="button-apply flex items-center" @click="handleAddHost()">
        <i class="material-symbols-outlined mr-1">add</i>
        {{ $t('pages.home.addHost') }}
      </button>
    </div>
    <Separator class="separator-bold" />
    <div class="mt-7 grid md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
      <HostCard
        v-for="(host, index) in hosts"
        :key="index"
        :name="host.name"
        :ip="host.ip"
        :mac="host.mac"
        :is-wake="host.isOnline"
        @toggle-power="handleTogglePower(index)"
        @edit="handleEditHost(index)"
        @delete="handleDeleteHost(index)"
      />
    </div>

    <!-- Alert Dialog para confirmar eliminación -->
    <AlertDialogRoot v-model:open="deleteDialogOpen">
      <AlertDialogPortal>
        <AlertDialogOverlay class="dialog-overlay" />
        <AlertDialogContent class="dialog-content max-w-[450px]">
          <AlertDialogTitle class="dialog-title">
            {{ $t('pages.home.deleteHost.title') }}
          </AlertDialogTitle>
          <AlertDialogDescription class="dialog-description">
            {{ $t('pages.home.deleteHost.description', {
              hostName: hostToDelete?.name,
              hostIp: hostToDelete?.ip
            }) }}
          </AlertDialogDescription>
          <div class="dialog-actions">
            <AlertDialogCancel class="pill-button-cancel">
              {{ $t('pages.home.deleteHost.cancel') }}
            </AlertDialogCancel>
            <AlertDialogAction
              class="pill-button-deny-solid"
              @click="confirmDeleteHost"
            >
              {{ $t('pages.home.deleteHost.confirm') }}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialogPortal>
    </AlertDialogRoot>

    <!-- Host Dialog para agregar/editar -->
    <HostDialog
      v-model:open="hostDialogOpen"
      :host="hostToEdit"
      :lastPing="hostToEdit?.lastPing"
      @save="handleSaveHost"
    />
  </div>
</template>

<script setup>
import HostCard from '@/components/HostCard.vue'
import HostDialog from '@/components/HostDialog.vue'
import {
  Separator,
  AlertDialogRoot,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction
} from 'reka-ui'
import { ref } from 'vue'
import { hostsMock } from '@/mocks/hosts'

const hosts = ref(hostsMock)

const hostDialogOpen = ref(false)
const deleteDialogOpen = ref(false)
const hostToDeleteIndex = ref(null)
const hostToDelete = ref(null)
const hostToEdit = ref(null)

function handleAddHost() {
  hostToEdit.value = null
  hostDialogOpen.value = true
}

async function handleTogglePower(index) {
  // Aquí puedes agregar la lógica para alternar el estado del host
  hosts.value[index].isOnline = !hosts.value[index].isOnline
}

function handleEditHost(index) {
  hostToEdit.value = { ...hosts.value[index], index }
  hostDialogOpen.value = true
}

function handleDeleteHost(index) {
  hostToDeleteIndex.value = index
  hostToDelete.value = hosts.value[index]
  deleteDialogOpen.value = true
}

function confirmDeleteHost() {
  if (hostToDeleteIndex.value !== null) {
    // Eliminar el host del array
    hosts.value.splice(hostToDeleteIndex.value, 1)

    // Resetear variables
    hostToDeleteIndex.value = null
    hostToDelete.value = null
    deleteDialogOpen.value = false

    // Aquí puedes agregar lógica adicional como:
    // - Mostrar una notificación de éxito
    // - Sincronizar con el backend
    // - Etc.
  }
}

async function handleSaveHost(hostData) {
  try {
    if (hostToEdit.value && hostToEdit.value.index !== undefined) {
      // Modo edición - actualizar host existente
      const index = hostToEdit.value.index
      hosts.value[index] = {
        ...hosts.value[index],
        ...hostData
      }
      console.log('Host editado:', hosts.value[index])
    } else {
      // Modo agregar - agregar nuevo host
      const newHost = {
        ...hostData,
        isOnline: false,
        lastPing: null
      }
      hosts.value.push(newHost)
      console.log('Host agregado:', newHost)
    }

    // Resetear variables
    hostToEdit.value = null

    // Aquí puedes agregar lógica adicional como:
    // - Sincronizar con el backend
    // - Mostrar notificación de éxito
    // - Etc.

  } catch (error) {
    console.error('Error al guardar host:', error)
    // Mostrar notificación de error
  }
}
</script>
