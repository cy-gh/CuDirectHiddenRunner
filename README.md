# WHAT IS IT?

This WSH JScript runs a Windows shell command via ```%comspec% /c <your command>``` completely hidden and captures the output **without** using temporary files, usually implemented as ```<your command>  >  %TEMP%\mytempfile.txt```.

While running a command hidden and capturing output of commands without temp files - usually with WSH.Exec() - are both universally used, the combination seems to be much rarer. There are programs which do the console hiding perfectly, but for eliminating the temp files, I found no satisfactory and reusable solution, so I wrote mine, particularly my favorite file manager [Directory Opus](https://www.gpsoft.com.au/) in mind. However, you can use this script universally. Simply replace the final step where environment variables are set with a WSH.popup(), a balloon tip or copy the output to clipboard and you're done.

Normally I'd write this with AHK since it can achieve the same perfectly and can be converted to an .EXE file. Since I write many DOpus scripts which I eventually release for public use, I instead needed a small .js script which my DOpus script create **once** and reuse for all spawned commands, e.g. launching mediainfo.exe, b3sum.exe, etc. for hundreds of single files without creating a temp file for each one. If temp files do not bother you at all, check out AHK Run command or the [suggestions on this page](https://www.raymond.cc/blog/hidden-start-runs-batch-files-silently-without-flickering-console/view-all/).

It is best suitable for callers which call a lot of small external commands.

One possible usage is to run it on read-only/protected media, e.g. a survival USB drive, which does not create and delete files on the host system or USB drive.

It also helps if you use an MVC, QVC-type SSDs which are highly inefficient for writing and you are cautious about TBW & SSD wear and tear.


# HOW TO USE

The output is put into one or more environment variables, depending on if there are 1 or 2 arguments passed to the script.

## 1st variant (without prefix):

```{batch}
DirectHiddenRunner.js "your command goes here"
```

| Output Environment Variable | Meaning                                                |
| --------------------------- | ------------------------------------------------------ |
| %DirectHiddenRunnerOUT%     | standard output of the command (STDOUT)                |
| %DirectHiddenRunnerERR%     | standard error of the command (STDERR)                 |
| %DirectHiddenRunnerEC%      | Exit Code of your command, usually 0 indicates success |

As you can reckon, every call to the script would overwrite old values! Be careful when using this variant.



## 2nd variant (with a custom prefix for EnvVars):

```{batch}
  DirectHiddenRunner.js "yourEnvVarPrefix" "your command goes here"
```


| Output Environment Variable | Meaning                                                      |
| --------------------------- | ------------------------------------------------------------ |
| %yourEnvVarPrefixOUT0%      | number of lines standard output of the command (STDOUT)      |
| %yourEnvVarPrefixOUT1%      | 1st line of STDOUT                                           |
| %yourEnvVarPrefixOUT2%      | 2nd line of STDOUT                                           |
| %yourEnvVarPrefixOUT3%      | 3rd line of STDOUT                                           |
| ...                         | the suffices are not zero padded, i.e. they go like OUT9, OUT10... OUT99, OUT100... |
| %yourEnvVarPrefixERR0%      | number of lines standard error of the command (STDERR)       |
| %yourEnvVarPrefixERR1%      | 1st line of STDERR                                           |
| %yourEnvVarPrefixERR2%      | 2nd line of STDERR                                           |
| %yourEnvVarPrefixERR3%      | 3rd line of STDERR                                           |
| ...                         |                                                              |
| %yourEnvVarPrefixEC%        | Exit Code of your command, usually 0 indicates success       |

This is a very cheap emulation of arrays. The caller of this script should generate a unique prefix, e.g. based on timestamp, a normalized, cleaned up filename, etc. Then it can be called in parallel and each output will be separated.

While While Windows allows a single environment variable to be maximum 32767 bytes, command-line lengths to set environments are limited to 8192 bytes, so your command might exceed the limits very quickly! The pseudo-array overcomes this limitation if the output of your program is expected to be big.

More info: https://docs.microsoft.com/en-us/windows/win32/procthread/environment-variables

# PROs and CONs

Simple variant is much faster but command output length is limited. Use it for simpler commands.

Pseudo-array variant is slower but it's more flexible and command output length is practically unlimited.


# IMPORTANT REMINDER

REMEMBER TO REMOVE THE PSEUDO-ARRAY ENVIRONMENT VARIABLES AFTER YOU CONSUME THEM, OTHERWISE YOUR ENVIRONMENT WILL BE OVERFLOWN IN NO TIME!

FOR CMD.EXE REMOVING IS AS EASY AS ```"SET MY_ENV_VAR_XYZ="``` (without quotes).

The variables are created in **volatile** environment, i.e. not persistent over reboots.

# TIPS:

To embed double quotes in the command argument use 2 single quotes, e.g.
```{batch}
tasklist.exe /fi "imagename eq firefox.exe"
```
should be passed to the script as
```{batch}
DirectHiddenRunner.js "myPrefix" "tasklist /fi ''imagename eq firefox.exe''"
```

# Samples:

Pseudo-array, will work, output in myPrefixOUT and myPrefixEC (will be 0):
```{batch}
DirectHiddenRunner.js "myPrefix" "tasklist.exe /fi ''imagename eq firefox.exe''"
```

Pseudo-array, will NOT work due to wrong syntax, myPrefixERR and myPrefixEC will be filled:
```{batch}
DirectHiddenRunner.js "myPrefix" "tasklist.exe firefox.exe"
```

Standard call, will work:
```{batch}
DirectHiddenRunner.js "tasklist /fi ''imagename eq firefox.exe''"
```

Standard call, will NOT work due to wrong syntax:
```{batch}
DirectHiddenRunner.js "tasklist firefox"
```


# HOME PAGE & CREDITS

https://github.com/cy-gh/CuDirectHiddenRunner - June 2021


Portions inspired by

* https://groups.google.com/g/microsoft.public.scripting.vbscript/c/VNPfLikhG60/m/nIpAfwKaEbYJ
  adjusted to accept command-line parameters to the script and re-written in JS
* https://stackoverflow.com/a/22752797
  removed unnecessary stuff and added STDERR support

Although I haven't used it, a very simple script which shows the basic idea behind running programs invisibly and capturing their output can be found here:
https://www.codegrepper.com/code-examples/vb/vbs+exec+hidden
