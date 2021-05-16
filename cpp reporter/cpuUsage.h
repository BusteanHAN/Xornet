#include <windows.h>
#include <stdio.h>
#include <stdint.h>

//------------------------------------------------------------------------------------------------------------------
// Prototype(s)...
//------------------------------------------------------------------------------------------------------------------
uint8_t cpuusage(void);

//-----------------------------------------------------
typedef BOOL(__stdcall *pfnGetSystemTimes)(LPFILETIME lpIdleTime, LPFILETIME lpKernelTime, LPFILETIME lpUserTime);
static pfnGetSystemTimes s_pfnGetSystemTimes = NULL;

static HMODULE s_hKernel = NULL;
//-----------------------------------------------------
void GetSystemTimesAddress()
{
    if (s_hKernel == NULL)
    {
        s_hKernel = LoadLibrary("Kernel32.dll");
        if (s_hKernel != NULL)
        {
            s_pfnGetSystemTimes = (pfnGetSystemTimes)GetProcAddress(s_hKernel, "GetSystemTimes");
            if (s_pfnGetSystemTimes == NULL)
            {
                FreeLibrary(s_hKernel);
                s_hKernel = NULL;
            }
        }
    }
}
//----------------------------------------------------------------------------------------------------------------

//----------------------------------------------------------------------------------------------------------------
// cpuusage(void)
// ==============
// Return a CHAR value in the range 0 - 100 representing actual CPU usage in percent.
//----------------------------------------------------------------------------------------------------------------
uint8_t cpuusage()
{
    FILETIME ft_sys_idle;
    FILETIME ft_sys_kernel;
    FILETIME ft_sys_user;

    ULARGE_INTEGER ul_sys_idle;
    ULARGE_INTEGER ul_sys_kernel;
    ULARGE_INTEGER ul_sys_user;

    static ULARGE_INTEGER ul_sys_idle_old;
    static ULARGE_INTEGER ul_sys_kernel_old;
    static ULARGE_INTEGER ul_sys_user_old;

    uint8_t usage = 0;

    // we cannot directly use GetSystemTimes on C language
    /* add this line :: pfnGetSystemTimes */
    s_pfnGetSystemTimes(&ft_sys_idle,   /* System idle time */
                        &ft_sys_kernel, /* system kernel time */
                        &ft_sys_user);  /* System user time */

    CopyMemory(&ul_sys_idle, &ft_sys_idle, sizeof(FILETIME));     // Could been optimized away...
    CopyMemory(&ul_sys_kernel, &ft_sys_kernel, sizeof(FILETIME)); // Could been optimized away...
    CopyMemory(&ul_sys_user, &ft_sys_user, sizeof(FILETIME));     // Could been optimized away...

    usage =
        (((((ul_sys_kernel.QuadPart - ul_sys_kernel_old.QuadPart) + 
        (ul_sys_user.QuadPart - ul_sys_user_old.QuadPart)) - 
        (ul_sys_idle.QuadPart - ul_sys_idle_old.QuadPart)) * (100)) / ((ul_sys_kernel.QuadPart - ul_sys_kernel_old.QuadPart) + (ul_sys_user.QuadPart - ul_sys_user_old.QuadPart)));

    ul_sys_idle_old.QuadPart = ul_sys_idle.QuadPart;
    ul_sys_user_old.QuadPart = ul_sys_user.QuadPart;
    ul_sys_kernel_old.QuadPart = ul_sys_kernel.QuadPart;

    return usage;
}