#include "../systemInfo.h"
// #include "../memUsage.h"
#include <iostream>
#include <windows.h>
#include <stdint.h>

using namespace std;

systemInfo mySystem;

int main(void)
{
    //CPU THROUGH OBJECT TEST
    // while (1)
    // {
    //     mySystem.update();
    //     cout << (int)mySystem.getCpuUsage() << endl;
    //     Sleep(500);
    // }

    //RAM TEST
    // while(1) {
    //     cout << querySM(0) << endl;
    //     Sleep(500);
    // }

    //RAM THROUGH OBJECT TEST
    while (1)
    {
        mySystem.update();
        cout << (uint64_t)mySystem.getFreeRam() << endl;
        Sleep(500);
    }
}