#include <windows.h>
#include <tchar.h>
#include <stdio.h>

#define INFO_BUFFER_SIZE 32767

TCHAR queryPCName()
{
   TCHAR infoBuf[INFO_BUFFER_SIZE];
   DWORD bufCharCount = INFO_BUFFER_SIZE;

   // Get and display the name of the computer.
   bufCharCount = INFO_BUFFER_SIZE;
   GetComputerName(infoBuf, &bufCharCount);
   return *infoBuf;
}