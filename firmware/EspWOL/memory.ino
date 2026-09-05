#include "memory.h"

static MemoryInfo memory_get_info() {
  MemoryInfo info;
  uint32_t available_heap, available_flash;
  uint32_t max_hosts_ram, max_hosts_flash, max_hosts_calc;
  FSInfo fs_info;

  // RAM Info
  info.free_heap = ESP.getFreeHeap();
  info.total_heap = 81920;  // ESP8266 RAM for user ~80KB de RAM
  info.heap_usage_percent = ((info.total_heap - info.free_heap) * 100) / info.total_heap;

  // Flash Info.
  if (LittleFS.info(fs_info) && fs_info.totalBytes > 0) {
    info.free_flash = fs_info.totalBytes - fs_info.usedBytes;
    info.total_flash = fs_info.totalBytes;
    info.flash_usage_percent = (fs_info.usedBytes * 100) / fs_info.totalBytes;
  } else {
    info.free_flash = 0;
    info.total_flash = 0;
    info.flash_usage_percent = 100;
  }

  // Hosts info actual
  info.hosts_count = hosts.size();

  available_heap = (info.free_heap > MIN_FREE_HEAP) ? (info.free_heap - MIN_FREE_HEAP) : 0;
  available_flash = (info.free_flash > MIN_FREE_FLASH) ? (info.free_flash - MIN_FREE_FLASH) : 0;

  available_heap = (available_heap * (100 - SAFETY_MARGIN_PERCENT)) / 100;
  available_flash = (available_flash * (100 - SAFETY_MARGIN_PERCENT)) / 100;

  max_hosts_ram = available_heap / HOST_RAM_SIZE;
  max_hosts_flash = available_flash / HOST_FLASH_SIZE;

  max_hosts_calc = (max_hosts_ram < max_hosts_flash) ? max_hosts_ram : max_hosts_flash;
  if (max_hosts_calc > HARD_MAX_HOSTS) max_hosts_calc = HARD_MAX_HOSTS;

  info.max_hosts = max_hosts_calc;

  info.has_enough_memory = (info.free_heap >= MIN_FREE_HEAP) && (info.free_flash >= MIN_FREE_FLASH);

  return info;
}

bool memory_can_add_host() {
  MemoryInfo info = memory_get_info();

  return info.has_enough_memory && (info.hosts_count < info.max_hosts);
}

JsonObject memory_add_metadata(JsonDocument &doc) {
  JsonObject metadata, memory, storage, hosts_info;
  MemoryInfo info = memory_get_info();

  metadata = doc[F("metadata")].to<JsonObject>();
  memory = metadata[F("memory")].to<JsonObject>();
  storage = metadata[F("storage")].to<JsonObject>();
  hosts_info = metadata[F("hosts")].to<JsonObject>();

  // RAM Info
  memory[F("freeHeap")] = info.free_heap;
  memory[F("totalHeap")] = info.total_heap;
  memory[F("heapUsagePercent")] = info.heap_usage_percent;

  // Flash Info
  storage[F("freeFlash")] = info.free_flash;
  storage[F("totalFlash")] = info.total_flash;
  storage[F("flashUsagePercent")] = info.flash_usage_percent;

  // Hosts info
  hosts_info[F("count")] = info.hosts_count;
  hosts_info[F("maxAllowed")] = info.max_hosts;
  hosts_info[F("remaining")] = (info.max_hosts > info.hosts_count) ? (info.max_hosts - info.hosts_count) : 0;

  // General
  metadata[F("hasEnoughMemory")] = info.has_enough_memory;
  metadata[F("canAddMoreHosts")] = memory_can_add_host();

  return metadata;
}