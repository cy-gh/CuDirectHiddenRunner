/*
https://github.com/cy-gh/CuDirectHiddenRunner
This file is automatically created by CuMediaExternder DOpus script
in order to get MediaInfo output without using temporary files.

From DOpus you can consume it like this:


    function(oItem) {}
        // VERY IMPORTANT: remove the volatile variables once you consume the output
        function removeVolVar(sVar) {
            util.shellGlobal.Environment("Volatile").remove(sVar);
        }
        function getUniqueIDForString(sString) {
            var blob = DOpus.create().blob();
            blob.copyFrom(sString);
            return DOpus.fsUtil().hash(blob, 'md5');
        }
        var OUTPUT;
        var exit_code;
        var cmd;
        var sVarName;
        var iChunkSize = 32768;

        // check the hidden runner helper file which gets command output without temporary files
        var sDirectRunnerPath = GetDirectRunnerPath();
        if (!DOpus.fsUtil().exists(sDirectRunnerPath)) {
            // create the file below, for once
        }
        // get a unique ID for this file
        var sPrefix = getUniqueIDForString('' + oItem.realpath);

        // run the helper - sprintf from here https://hexmen.com/blog/2007/03/14/printf-sprintf/
        // this one runs: ''mediainfo'' --output=JSON ''file'' - note the double single quotes
        var cmd = sprintf(
            'wscript.exe "%s" "%s" "%s" "\'\'%s\'\' --Output=JSON \'\'%s\'\'"',
            sDirectRunnerPath,
            sPrefix,
            iChunkSize,
            config.get('mediainfo_path'),
            oItem.realpath
        );
        exit_code = util.shellGlobal.Run(cmd, 0, true); // 0: hidden, true: wait

        // get the output environment variables
        var sExitCode = DOpus.fsUtil().resolve('%' + sPrefix + 'EC%'),
            iStdOutChunks   = parseInt(DOpus.fsUtil().resolve('%' + sPrefix + 'OUT0%'), 10),
            iStdErrChunks   = parseInt(DOpus.fsUtil().resolve('%' + sPrefix + 'ERR0%'), 10);

        DOpus.output(sprintf(
            '\nHelper path: %s\nPrefix: %s\nExit Code: %d\nSTDOUT Chunks: %d\nSTDERR Chunks: %d',
            sDirectRunnerPath,
            sPrefix,
            sExitCode,
            iStdOutChunks,
            iStdErrChunks
        ));

        if (!sExitCode || parseInt(sExitCode, 10) !== 0) {
            DOpus.output(oItem.name + ', error occurred while executing MediaInfo, exit code: ' + sExitCode);
            // join STDERR, like STDOUT below
            return;
        }
        var OUTPUT = '';
        // note the output chunks start at 1
        for(var i = 1; i <= iStdOutChunks; i++) {
            // get the var
            sVarName = sPrefix + 'OUT' + i;
            OUTPUT += '' + DOpus.fsUtil().resolve('%' + sVarName + '%');
            // delete the var
            removeVolVar(sVarName);
        }
        removeVolVar(sPrefix + 'EC');
        removeVolVar(sPrefix + 'OUT0');
        removeVolVar(sPrefix + 'ERR0');
        return OUTPUT;
    }
*/


var oScriptArgs     = WScript.Arguments;
if (oScriptArgs.length !== 3) {
    /*
    WScript.Echo(
        'Usage:\n' +
        '  As single string:\n' +
        '  ' + myFullName + ' <command_line>\n' +
        '  As pseudo-arrays:\n' +
        '  ' + myFullName + ' <prefix> <command_line>\n'
    );
    */
    WScript.Quit(1);
}
var sPrefix         = oScriptArgs(0),
    iChunkSize      = parseInt(oScriptArgs(1), 10),
    sCommand        = oScriptArgs(2),
    oWSH            = WScript.CreateObject("WScript.Shell"),
    oEnvVolatile    = oWSH.Environment("Volatile");
if (WScript.FullName.toLowerCase().indexOf('wscript') >= 0) {
    // rerun this script with cscript and pass the command we got - 0: hidden, true: wait
    oWSH.Run('cscript.exe //nologo "' + WScript.ScriptFullName + '" "' + sPrefix + '" "' + iChunkSize + '" "' + sCommand + '"', 0, true);
} else {
    var sStdOut = '',
        sStdErr = '',
        iStdOutLines = 0,
        iStdErrLines = 0,
        iPtr    = 0,
        sChunk  = '';
    sCommand = '"' + sCommand.replace(/''/g, '"') + '"';
    var oExec = oWSH.Exec('%comspec% /c ' + sCommand);
    do {
        while (!oExec.StdOut.AtEndOfStream) sStdOut += oExec.StdOut.ReadLine() + '\n';
        while (!oExec.StdErr.AtEndOfStream) sStdErr += oExec.StdErr.ReadLine() + '\n';
    } while (0 == oExec.Status && !oExec.AtEndOfStream);
    oEnvVolatile(sPrefix + 'EC')    = oExec.ExitCode;
    if (sStdOut.length === 0) {
        oEnvVolatile(sPrefix + 'OUT0')  = 0;
    } else if (sStdOut.length > iChunkSize) {
        // split
        for (iPtr = 0; iPtr < sStdOut.length; iStdOutLines++, iPtr += iChunkSize) {
            sChunk = sStdOut.slice(iPtr, iPtr + iChunkSize);
            oEnvVolatile(sPrefix + 'OUT' + (iStdOutLines + 1)) = sChunk;
        }
        oEnvVolatile(sPrefix + 'OUT0')  = iStdOutLines;
    } else {
        oEnvVolatile(sPrefix + 'OUT0')  = 1;
        oEnvVolatile(sPrefix + 'OUT1')  = sStdOut;
    }
    if (sStdErr.length === 0) {
        oEnvVolatile(sPrefix + 'ERR0')  = 0;
    } else if (sStdErr.length > iChunkSize) {
        // split
        for (iPtr = 0; iPtr < sStdErr.length; iStdErrLines++, iPtr += iChunkSize) {
            sChunk = sStdErr.slice(iPtr, iPtr + iChunkSize);
            oEnvVolatile(sPrefix + 'ERR' + (iStdErrLines + 1)) = sChunk;
        }
        oEnvVolatile(sPrefix + 'ERR0')  = iStdErrLines;
    } else {
        oEnvVolatile(sPrefix + 'ERR0')  = 1;
        oEnvVolatile(sPrefix + 'ERR1')  = sStdErr;
    }
}
