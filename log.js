/*****************************************************
 * Description: Logging and error handling functions *
 *****************************************************/

/*
 * Load JS Files
 */

// nothing needed

/*
 * Global variables
 */

var gvAppName = 'balu-console';
var gvScriptName_log = 'log';

/*
 * Logging control -- off by default
 */
var gvLogErrors = true;
var gvLogProcs  = false;
var gvLogRoutes = false;
var gvLogDebugs = false;
var gvLogInfos  = false;
var gvLogInits  = false;
var gvLogAJAX   = false;
var gvLogLstnrs = false;
var gvLogTemps  = false;

module.exports = {

    setLoggingMode: function(pvArgs){
        if(pvArgs.parseServerURL.includes('balu-parse-server-test') || pvArgs.parseServerURL.includes('localhost')) {
            gvLogProcs  = true;
            gvLogRoutes = true;
            gvLogDebugs = true;
            gvLogInfos  = true;
            gvLogInits  = true;
            gvLogLstnrs = true;
            gvLogTemps  = true;
        }
    },

    /*********************
     * Logging Functions *
     *********************/

    /*
     * Save an event to the log
     * Note, this is anonymous (no users)
     */
    logEvent: function(pvEventName,pvArgs,pvMessage) {

        var lvFunctionName = 'logEvent';
        log(gvScriptName_log + '.' + lvFunctionName + ': Start','PROCS');

        var log_event = new (Parse.Object.extend("Log_Event"))();

        var lvACL = new Parse.ACL();
        lvACL.setRoleReadAccess("Analytics",true);

        // For the log events that require no bespoke code...
        if(pvEventName === 'WEB_APP-PAGE_LOAD' ||
           pvEventName === 'WEB_APP-CATEGORY_FILTER_APPLIED' ||
           pvEventName === 'WEB_APP-CATEGORY_FILTER_REMOVED' ||
           pvEventName === 'WEB_APP-CATEGORY_FILTER_SHOW_MORE' ||
           pvEventName === 'WEB_APP-CATEGORY_FILTER_SHOW_LESS' ||
           pvEventName === 'WEB_APP-PRODUCT_GROUP_SEARCH' ||
           pvEventName === 'WEB_APP-PRODUCT_GROUP_SEARCH_EMPTY_ENTER' ||
           pvEventName === 'WEB_APP-PRODUCT_GROUP_SEARCH_NO_MATCH' ||
           pvEventName === 'WEB_APP-BRAND_SPIEL_SHOW_MORE' ||
           pvEventName === 'WEB_APP-BRAND_CLICK_THROUGH' ||
           pvEventName === 'WEB_APP-AD_CLICK_THROUGH' ||
           pvEventName === 'WEB_APP-GET_THE_APP_CLICK_THROUGH') {

            log_event.set('eventName',pvEventName);

            var lvProductGroup_pointer;
            var lvSearchCategory_pointer;
            var lvBrand_pointer;
            if(pvArgs !== null) {
                if(pvArgs.productGroupId !== null && typeof pvArgs.productGroupId !== 'undefined'){
                    lvProductGroup_pointer = {__type: "Pointer",className: "ProductGroup",objectId: pvArgs.productGroupId};
                }
                if(pvArgs.categoryId !== null && typeof pvArgs.categoryId !== 'undefined'){
                    lvSearchCategory_pointer = {__type: "Pointer",className: "SearchCategory",objectId: pvArgs.categoryId};
                }
                if(pvArgs.brandId !== null && typeof pvArgs.brandId !== 'undefined'){
                    lvBrand_pointer = {__type: "Pointer",className: "EthicalBrand",objectId: pvArgs.brandId};
                }

                log_event.set('productGroupId',lvProductGroup_pointer);
                log_event.set('productGroupName',pvArgs.productGroupName);
                log_event.set('searchCategoryId',lvSearchCategory_pointer);
                log_event.set('searchCategoryName',pvArgs.categoryName);
                log_event.set('brandId',lvBrand_pointer);
                log_event.set('brandName',pvArgs.brandName);

                if(typeof pvArgs.brandURL !== 'undefined') {
                    log_event.set('brandURL',pvArgs.brandURL);
                }
            }

            log_event.set('message',pvMessage);

            log_event.setACL(lvACL);

            log_event.save({
                success: function(){
                },
                error: parseErrorSave
            });

        } else {

            switch (pvEventName) {
                case(false):

                break;

                default:
                    log(gvScriptName_log + '.' + lvFunctionName + ': ERROR, unhandled event name (' + pvEventName + ') passed to logEvent()','ERROR');

            }
        }
    },

    /*
     * Save an error message to the error log
     */
    logError: function logError(pvEventName,pvData){

        var lvFunctionName = 'logError';
        log(gvScriptName_log + '.' + lvFunctionName + ': Start','PROCS');

        var lvACL = new Parse.ACL();
        acl.setRoleReadAccess("Analytics",true);

        var log_Error = new Parse.Object.extend("Log_Error")();

        log_Error.set('eventName',pvEventName);
        log_Error.set('message',pvData.message);

        log_Error.setACL(lvACL);

        log_Error.save({
            success: function(){

            },
            error: parseErrorSave
        });
    },


    /*
     * Outputs a log message to the console
     *
     * - Whether the message is output or not depends on the values set
     *   on the global variables at the top of this script
     * - Calls an internal function that does the work
     */
    log: function log(pvScriptName,pvFunctionName,pvMessage,pvLevel) {
        return l(pvScriptName,pvFunctionName,pvMessage,pvLevel);
    },

    /******************
     * Error handling *
     ******************/

    parseErrorSave: function parseErrorSave(pvObject,pvError) {
        var lvErrorMsg = "Parse error on .save() request: " + pvError.code + " " + pvError.message;
        l(gvScriptName_log,'parseErrorSave',lvErrorMsg,'ERROR');
    },

    parseErrorFind: function parseErrorFind(pvError) {
        var lvErrorMsg = "Parse error on .find() request: " + pvError.code + " " + pvError.message;
        l(gvScriptName_log,'parseErrorFind',lvErrorMsg,'ERROR');
    },

    parseErrorUser: function parseErrorUser(pvUser,pvError) {
        var lvErrorMsg = "Parse error on authentication request: " + pvError.code + " " + pvError.message;
        l(gvScriptName_log,'parseErrorUser',lvErrorMsg,'ERROR');
    },

    parseErrorGet: function parseErrorGet(pvUser,pvError) {
        var lvErrorMsg = "Parse error on .get() request: " + pvError.code + " " + pvError.message;
        l(gvScriptName_log,'parseErrorGet',lvErrorMsg,'ERROR');
    },

    parseErrorDestroyAll: function parseErrorDestroyAll(pvError) {
        var lvErrorMsg = "Parse error on .destroyAll() request: " + pvError.code + " " + pvError.message;
        l(gvScriptName_log,'parseErrorDestroyAll',lvErrorMsg,'ERROR');
    },

    parseErrorSimple: function parseErrorUserSimple(pvError) {
        var lvErrorMsg = "Parse error on user request: " + pvError.code + " " + pvError.message;
        l(gvScriptName_log,'parseErrorUserSimple',lvErrorMsg,'ERROR');
    }
};

/*
 * Outputs a log message to the console
 *
 * - Whether the message is output or not depends on the values set
 *   on the global variables at the top of this script
 */
function l(pvScriptName,pvFunctionName,pvMessage,pvLevel){

    // This function can be passed a pre-formatted log string, usually passed back from the balu-parse-server.
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
