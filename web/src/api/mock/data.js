export const HARD_MAX_HOSTS = 50

export let currentHostId = 4
export const sessionToken = 'abc123def456ghij789klmno012pqrs'

export const mockUser = {
  username: 'testful',
  password: 'kerChik#Percik2131',
}

export const mockMemoryInfo = {
  memory: {
    freeHeap: 45632,
    totalHeap: 81920,
    heapUsagePercent: 44,
  },
  storage: {
    freeFlash: 2048000,
    totalFlash: 3145728,
    flashUsagePercent: 35,
  },
  hosts: {
    count: 3,
    maxAllowed: HARD_MAX_HOSTS,
    remaining: HARD_MAX_HOSTS - 3,
  },
  hasEnoughMemory: true,
  canAddMoreHosts: true,
}
