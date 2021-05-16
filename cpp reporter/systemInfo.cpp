#include "cpuUsage.h"
#include "memUsage.h"
#include "networkInfo.h"
#include "systemInfo.h"
#include <iostream>

systemInfo::systemInfo()
{
}

systemInfo::~systemInfo()
{
}

void systemInfo::update()
{
    GetSystemTimesAddress();
    cpuUsage = cpuusage(); //value from 0 - 100 %
    totalRam = querySM(0); //in bytes
    freeRam = querySM(1);
    PCName = queryPCName();
}