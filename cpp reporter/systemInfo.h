#include <stdint.h>
#include <string>

class systemInfo
{
private:
    uint8_t cpuUsage;
    uint64_t totalRam;
    uint64_t freeRam;
    std::string PCName;

public:
    systemInfo();
    ~systemInfo();

    void update();
    uint8_t getCpuUsage(){return cpuUsage;};
    uint64_t getTotalRam(){return totalRam;};
    uint64_t getFreeRam(){return freeRam;};
    std::string getPCName(){return PCName;};
};