#include <windows.h>
#include <stdint.h>

uint64_t querySM(uint8_t index)
{
    MEMORYSTATUSEX statex;

    statex.dwLength = sizeof(statex);

    GlobalMemoryStatusEx(&statex);

    switch (index)
    {
    case 0:
        return statex.ullTotalPhys;
        break;
    case 1:
        return statex.ullAvailPhys;
        break;
    default:
        return 0;
        break;
    }
}