#include "memory.h"

MemoryInfo getMemoryInfo() {
  MemoryInfo info;

  // RAM Info
  info.freeHeap = ESP.getFreeHeap();
  info.totalHeap = 81920;  // ESP8266 RAM for user ~80KB de RAM
  info.heapUsagePercent = ((info.totalHeap - info.freeHeap) * 100) / info.totalHeap;

  // Flash Info
  FSInfo fsInfo;
  LittleFS.begin();
  LittleFS.info(fsInfo);
  LittleFS.end();
  info.freeFlash = fsInfo.totalBytes - fsInfo.usedBytes;
  info.totalFlash = fsInfo.totalBytes;
  info.flashUsagePercent = (fsInfo.usedBytes * 100) / fsInfo.totalBytes;

  // Hosts info actual
  info.hostsCount = hosts.size();

  uint32_t availableHeapForHosts = (info.freeHeap > MIN_FREE_HEAP) ? (info.freeHeap - MIN_FREE_HEAP) : 0;
  uint32_t availableFlashForHosts = (info.freeFlash > MIN_FREE_FLASH) ? (info.freeFlash - MIN_FREE_FLASH) : 0;

  availableHeapForHosts = (availableHeapForHosts * (100 - SAFETY_MARGIN_PERCENT)) / 100;
  availableFlashForHosts = (availableFlashForHosts * (100 - SAFETY_MARGIN_PERCENT)) / 100;

  uint32_t maxHostsRAM = availableHeapForHosts / HOST_RAM_SIZE;
  uint32_t maxHostsFlash = availableFlashForHosts / HOST_FLASH_SIZE;

  uint32_t maxHostsCalculated = (maxHostsRAM < maxHostsFlash) ? maxHostsRAM : maxHostsFlash;
  if (maxHostsCalculated > HARD_MAX_HOSTS) maxHostsCalculated = HARD_MAX_HOSTS;

  info.maxHosts = maxHostsCalculated;

  info.hasEnoughMemory = (info.freeHeap >= MIN_FREE_HEAP) && (info.freeFlash >= MIN_FREE_FLASH);

  return info;
}

bool hasEnoughMemoryForHost() {
  MemoryInfo info = getMemoryInfo();

  return info.hasEnoughMemory && (info.hostsCount < info.maxHosts);
}

JsonObject createMemoryMetadata(JsonDocument &doc) {
  MemoryInfo info = getMemoryInfo();

  JsonObject metadata = doc.createNestedObject(F("metadata"));

  // RAM Info
  JsonObject memory = metadata.createNestedObject(F("memory"));
  memory[F("freeHeap")] = info.freeHeap;
  memory[F("totalHeap")] = info.totalHeap;
  memory[F("heapUsagePercent")] = info.heapUsagePercent;

  // Flash Info
  JsonObject storage = metadata.createNestedObject(F("storage"));
  storage[F("freeFlash")] = info.freeFlash;
  storage[F("totalFlash")] = info.totalFlash;
  storage[F("flashUsagePercent")] = info.flashUsagePercent;

   // Hosts info
  JsonObject hostsInfo = metadata.createNestedObject(F("hosts"));
  hostsInfo[F("count")] = info.hostsCount;
  hostsInfo[F("maxAllowed")] = info.maxHosts;
  hostsInfo[F("remaining")] = info.maxHosts - info.hostsCount;

  // General
  metadata[F("hasEnoughMemory")] = info.hasEnoughMemory;
  metadata[F("canAddMoreHosts")] = hasEnoughMemoryForHost();

  return metadata;
}