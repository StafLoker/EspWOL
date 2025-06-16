<template>
  <div class="h-full">
    <div class="flex justify-between mb-2 items-center">
      <p class="text-2xl font-medium text">{{ $t('pages.home.hosts') }}</p>
      <button class="button-apply flex items-center" @click="addHostDialogOpen = true">
        <i class="material-symbols-outlined mr-1">add</i>
        {{ $t('pages.home.addHost') }}
      </button>
    </div>
    <Separator
      class="bg-stone-300/50 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px my-[15px]"
    />
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
  </div>
</template>

<script setup>
import HostCard from '@/components/HostCard.vue'
import { Separator } from 'reka-ui'
import { ref } from 'vue'

const addHostDialogOpen = ref(false)

const editHostDialogOpen = ref(false)

function handleAddHost() {
  editHostDialogOpen.value = true
}

async function handleTogglePower(index) {

}

function handleEditHost(index) {
  editHostDialogOpen.value = true
}

function handleDeleteHost(index) {

}

const hosts = ref([
  {
    name: 'Server',
    mac: 'e8:e0:5e:97:3d:af',
    ip: '192.168.2.7',
    periodicPing: 60,
  },
  {
    name: 'Server',
    mac: 'e8:e0:5e:97:3d:af',
    ip: '192.168.2.7',
    periodicPing: 60,
  },
  {
    name: 'Server',
    mac: 'e8:e0:5e:97:3d:af',
    ip: '192.168.2.7',
    periodicPing: 60,
  },
  {
    name: 'Server',
    mac: 'e8:e0:5e:97:3d:af',
    ip: '192.168.2.7',
    periodicPing: 60,
  },
  {
    name: 'Server',
    mac: 'e8:e0:5e:97:3d:af',
    ip: '192.168.2.7',
    periodicPing: 60,
  },
  {
    name: 'Server',
    mac: 'e8:e0:5e:97:3d:af',
    ip: '192.168.2.7',
    periodicPing: 60,
  },
  {
    name: 'Server',
    mac: 'e8:e0:5e:97:3d:af',
    ip: '192.168.2.7',
    periodicPing: 60,
  },
  {
    name: 'Server',
    mac: 'e8:e0:5e:97:3d:af',
    ip: '192.168.2.7',
    periodicPing: 60,
  },
])
</script>
