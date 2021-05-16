#include <windows.h>
#include <tchar.h>
#include <string>

#define INFO_BUFFER_SIZE 32767

std::string queryPCName()
{
   static char infoBuf[INFO_BUFFER_SIZE];
   DWORD bufCharCount = INFO_BUFFER_SIZE;

   // Get and display the name of the computer.
   bufCharCount = INFO_BUFFER_SIZE;
   GetComputerNameA(infoBuf, &bufCharCount);
   std::string name(infoBuf);
   return name;
}