// https://github.com/cy-gh/CuDirectHiddenRunner
// June 2021

var bUseArrayOutput = false;

var iSleepStep      = 33;
var iElapsed        = 0;
var iMaxWait        = 10000;
var oWSH            = WScript.CreateObject("WScript.Shell");
var oEnvVolatile    = oWSH.Environment("Volatile");
var oScriptArgs     = WScript.Arguments;
var sCommand        = '';
var sPrefix         = '';

var myFullName      = WScript.ScriptFullName;
var myName          = WScript.ScriptName.replace(/.js$/, '');


if (oScriptArgs.length === 1) {
    bUseArrayOutput = false;
    sCommand = oScriptArgs(0);
} else if (oScriptArgs.length === 2) {
    bUseArrayOutput = true;
    sPrefix = oScriptArgs(0);
    sCommand = oScriptArgs(1);
} else {
    WScript.Echo(
        'Usage:\n' +
        '  As single string:\n' +
        '  ' + myFullName + ' <command_line>\n' +
        '  As pseudo-arrays:\n' +
        '  ' + myFullName + ' <prefix> <command_line>\n'
    );
    WScript.Quit(1);
}

// WScript.Echo('Got ' + oScriptArgs.length + ' parameters.\n\nUsing arrays: ' + bUseArrayOutput + '\nPrefix: ' + sPrefix + '\nCommand: ' + sCommand);


if (WScript.FullName.toLowerCase().indexOf('wscript') >= 0) {
    // rerun this script with cscript and pass the command we got
    // oWSH.popup('Command to run:\n' + sCommand);
    var sReentryLine = 'cscript.exe //nologo ' + WScript.ScriptFullName;
    if (bUseArrayOutput) {
        sReentryLine += ' "' + sPrefix + '" "' + sCommand + '"';
    } else {
        sReentryLine += ' "' + sCommand + '"';
    }
    // WScript.Echo(sReentryLine);
    oWSH.Run(sReentryLine, 0, true); // 0: hidden, true: wait


    // rebuild and consumption example
    var iStart = new Date().getTime();;
    var ec, stdout = '', stderr = '', stdoutlines, stderrlines;
    if (!sPrefix) {
        ec     = oEnvVolatile(myName + 'EC');
        stdout = oEnvVolatile(myName + 'OUT');
        stderr = oEnvVolatile(myName + 'ERR');
        oWSH.popup('Exit code: ' + ec + '\nSTDOUT:\n' + stdout + '\n\nSTDERR:\n' + stderr);
    } else {
        ec          = oEnvVolatile(sPrefix + 'EC');
        stdoutlines = oEnvVolatile(sPrefix + 'OUT0');
        stderrlines = oEnvVolatile(sPrefix + 'ERR0');

        for(var j = 0; j < stdoutlines; j++) {
            stdout += oEnvVolatile(sPrefix + 'OUT' + (j+1)) + '\n';
        }
        for(var k = 0; k < stderrlines; k++) {
            stderr += oEnvVolatile(sPrefix + 'ERR' + (k+1)) + '\n';
        }
        var iElapsed = new Date().getTime() - iStart;
        oWSH.popup('Rebuild duration: ' + iElapsed + ' ms\nExit code: ' + ec + '\nSTDOUT (' + stdoutlines + '):\n' + stdout + ' \nSTDERR (' + stderrlines + '):\n' + stderr);
    }

} else {
    var line,
        sStdOut      = '',
        sStdErr      = '',
        aStdOutLines = [],
        aStdErrLines = [];

    sCommand = '"' + sCommand.replace(/''/g, '"') + '"';

    // oWSH.popup('Prefix: ' + sPrefix + '\nCommand: ' + sCommand);
    // var oExec = oWSH.Exec(sCommand); // alternative if you want to run your command without cmd.exe
    var oExec = oWSH.Exec('%comspec% /c ' + sCommand);

    // idea from https://stackoverflow.com/a/22752797
    do {
        WScript.Sleep(iSleepStep);
        iElapsed += iSleepStep;
        while (!oExec.StdOut.AtEndOfStream) {
            line = oExec.StdOut.ReadLine();
            aStdOutLines.push((line));
            sStdOut += line + '\n';
        }
        while (!oExec.StdErr.AtEndOfStream) {
            line = oExec.StdErr.ReadLine();
            aStdErrLines.push((line));
            sStdErr += line + '\n';
        }
    } while (0 == oExec.Status && !oExec.AtEndOfStream && iElapsed <= iMaxWait)


    if (!sPrefix) {
        oEnvVolatile(myName + 'EC')     = oExec.ExitCode;
        oEnvVolatile(myName + 'OUT')    = sStdOut;
        oEnvVolatile(myName + 'ERR')    = sStdErr;
    } else {
        // var iStart = new Date().getTime();
        // WARNING these 2 loops are definitely expensive!
        for(var j = 0; j < aStdOutLines.length; j++) {
            oEnvVolatile(sPrefix + 'OUT' + (j+1)) = aStdOutLines[j];
        }
        for(var k = 0; k < aStdErrLines.length; k++) {
            oEnvVolatile(sPrefix + 'ERR' + (k+1)) = aStdErrLines[k];
        }
        // var iElapsed = new Date().getTime() - iStart;
        oEnvVolatile(sPrefix + 'EC')    = oExec.ExitCode;
        oEnvVolatile(sPrefix + 'OUT0')  = aStdOutLines.length;
        oEnvVolatile(sPrefix + 'ERR0')  = aStdErrLines.length;
    }

    // oWSH.popup( 'Prefix: ' + sPrefix + '\n' +
    //             'EXITCODE:\n' + oExec.ExitCode + '\nSTDOUT:\n' + sStdOut + '\n--------\nSTDERR:\n' + sStdErr
    // );
}
