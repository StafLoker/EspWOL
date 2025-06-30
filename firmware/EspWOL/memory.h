#ifndef MEMORY_H
#define MEMORY_H

struct MemoryInfo {
  uint32_t freeHeap;
  uint32_t totalHeap;
  uint32_t heapUsagePercent;
  uint32_t freeFlash;
  uint32_t totalFlash;
  uint32_t flashUsagePercent;
  bool hasEnoughMemory;
  uint32_t hostsCount;
  uint32_t maxHosts;
};

MemoryInfo getMemoryInfo();
bool hasEnoughMemoryForHost();
bool validateFieldLengths(const String &hostName, const String &username = "", const String &password = "");
JsonObject createMemoryMetadata(JsonDocument &doc);

#endif