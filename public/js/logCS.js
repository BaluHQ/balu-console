/*****************************************************
 * Description: Logging and error handling functions *
 *****************************************************/

// To do: logging errors is wrong! there's no log_error collection, for starters. And this needs merging into a single log file with all other apps too
/********
 * Init *
 ********/

/*
 * Global variables
 */

var gvAppName = 'balu-console (CS)';
var gvScriptName_log = 'log';

/* Logging control */
var gvLogErrors = true;
var gvLogProcs  = true;
var gvLogRoutes = true;
var gvLogDebugs = true;
var gvLogInfos  = true;
var gvLogInits  = true;
var gvLogAJAX   = true;
var gvLogLstnrs = true;
var gvLogTemps  = true;

/*
 * Outputs a log message to the console
 *
 * - Whether the message is output or not depends on the values set
 *   on the global variables at the top of this script
 */
function log(pvScriptName,pvFunctionName,pvMessage,pvLevel){

    // This function can be passed a pre-formatted log string
    // In this case, just console.log it, without the preceeding or trailing carriage returns
    if(typeof pvFunctionName === 'undefined' &&
       typeof pvMessage === 'undefined' &&
       typeof pvLevel === 'undefined') {
        console.log(pvScriptName.substring(1,pvScriptName.length));
        return '\n' + pvScriptName.substring(1,pvScriptName.length);
    }

    var lvMaxAppNameLength = 22;
    var lvPadding = '                      '.substring(0,lvMaxAppNameLength - gvAppName.length + 1);
    var lvLogText = '';

    switch(pvLevel) {

        case 'ERROR':
            if (gvLogErrors) {
                lvLogText = gvAppName.substring(0,lvMaxAppNameLength) + lvPadding + '| ' + pvLevel + ': ' + pvScriptName + '.' + pvFunctionName + ': ' + pvMessage;
                console.log(lvLogText);
                lvLogText = '\n' + lvLogText;
            }
        break;

        case 'PROCS':
            // Short for "process", these are the ubiquitous logs that
            // track (at the least) the start of every function, as well
            // as other key points
            // On by default
            if (gvLogProcs) {
                lvLogText = gvAppName.substring(0,lvMaxAppNameLength) + lvPadding + '| ' + pvLevel + ': ' + pvScriptName + '.' + pvFunctionName + ': ' + pvMessage;
                console.log(lvLogText);
                lvLogText = '\n' + lvLogText;
            }
        break;

        case 'ROUTE':
            // Similar to PROCS, but for the web server routes
            // On by default
            if (gvLogRoutes) {
               lvLogText = gvAppName.substring(0,lvMaxAppNameLength) + lvPadding + '| ' + pvLevel + ': ' + pvScriptName + '.' + pvFunctionName + ': ' + pvMessage;
               console.log(lvLogText);
               lvLogText = '\n' + lvLogText;
            }
        break;

        case ' INFO':
            // Additional to PROCS, these don't just track process, they
            // record information as well. Similar to DEBUG.
            // Off by default
            if (gvLogInfos){
               lvLogText = gvAppName.substring(0,lvMaxAppNameLength) + lvPadding + '| ' + pvLevel + ': ' + pvScriptName + '.' + pvFunctionName + ': ' + pvMessage;
               console.log(lvLogText);
               lvLogText = '\n' + lvLogText;
            }
        break;

        case 'DEBUG':
            // Useful log points for debugging
            // Off by default
            if (gvLogDebugs){
               lvLogText = gvAppName.substring(0,lvMaxAppNameLength) + lvPadding + '| ' + pvLevel + ': ' + pvScriptName + '.' + pvFunctionName + ': ' + pvMessage;
               console.log(lvLogText);
               lvLogText = '\n' + lvLogText;
            }
        break;

        case 'INITS':
            // Rather than putting PROCS in init functions (which always fire
            // and, once the app is working reliably, aren't particularly interesting)
            // Off by default
            if (gvLogInits){
               lvLogText = gvAppName.substring(0,lvMaxAppNameLength) + lvPadding + '| ' + pvLevel + ': ' + pvScriptName + '.' + pvFunctionName + ': ' + pvMessage;
               console.log(lvLogText);
               lvLogText = '\n' + lvLogText;
            }
        break;

        case ' AJAX':
            if (gvLogAJAX){
               lvLogText = gvAppName.substring(0,lvMaxAppNameLength) + lvPadding + '| ' + pvLevel + ': ' + pvScriptName + '.' + pvFunctionName + ': ' + pvMessage;
               console.log(lvLogText);
               lvLogText = '\n' + lvLogText;
            }
        break;

        case 'LSTNR':
            // Rather than putting PROCS in listeners (which can fire
            // continually in some scenarios), use LSTNR and keep them ...
            // Off by default
            if (gvLogLstnrs){
               lvLogText = gvAppName.substring(0,lvMaxAppNameLength) + lvPadding + '| ' + pvLevel + ': ' + pvScriptName + '.' + pvFunctionName + ': ' + pvMessage;
               console.log(lvLogText);
               lvLogText = '\n' + lvLogText;
            }
        break;

        case ' TEMP':
            // What it says on the tin. These should not stay in the code for long
            // On by default
            if (gvLogTemps){
               lvLogText = gvAppName.substring(0,lvMaxAppNameLength) + lvPadding + '| ' + pvLevel + ': ' + pvScriptName + '.' + pvFunctionName + ': ' + pvMessage;
               console.log(lvLogText);
               lvLogText = '\n' + lvLogText;
            }
        break;

        default:
            lvLogText = gvAppName.substring(0,lvMaxAppNameLength) + lvPadding + '| ' + 'UNKWN' + ': ' + pvScriptName + '.' + pvFunctionName + ': ' + pvMessage;
            console.log(lvLogText);
            lvLogText = '\n' + lvLogText;
    }
    return lvLogText; // Set to '' if logging is off for the given level.
}
