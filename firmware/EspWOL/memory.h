#ifndef MEMORY_H
#define MEMORY_H

#define HOST_FLASH_SIZE 120  // FLASH bytes aprox por host
#define HOST_RAM_SIZE 140    // RAM bytes aprox por host
#define MIN_FREE_HEAP 8192   // Min 8KB of RAM free
#define MIN_FREE_FLASH 4096  // Min 4KB of flash free
#define HARD_MAX_HOSTS 50
#define SAFETY_MARGIN_PERCENT 10

struct MemoryInfo {
  uint32_t free_heap;
  uint32_t total_heap;
  uint32_t heap_usage_percent;
  uint32_t free_flash;
  uint32_t total_flash;
  uint32_t flash_usage_percent;
  bool has_enough_memory;
  uint32_t hosts_count;
  uint32_t max_hosts;
};

bool memory_can_add_host();
JsonObject memory_add_metadata(JsonDocument &doc);

#endif
