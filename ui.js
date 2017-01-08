/************************************************************************
 * Description: Constructs the data elements to be bed to ejs templates *
 ************************************************************************/

/*
 * Load modules
 */
//var Parse = require('parse/node');
//var Promise = require('bluebird');

/*
 * Load JS files
 */
var log = require('./log.js');

/*
 * Global variables
 */

/* Logging control */
var gvScriptName = 'ui';

/*
 * Initialise the script
 */
(function initialise(){

    var lvFunctionName = 'initialise';
    log.log(gvScriptName,lvFunctionName,'Start','INITS');

})();


module.exports = {

    constructWebsiteSearchConfig: function(pvArgs, pvCallback){

        var lvLog = pvArgs.log;
        var lvFunctionName = 'constructWebsiteSearchConfig';
        lvLog += log.log(gvScriptName,lvFunctionName,'Start','PROCS');

        var lvArgs = {pageElements: {}};
        lvArgs.pageElements = {
            databaseURI: pvArgs.databaseURI,
            parseServerURL: pvArgs.parseServerURL,
            categoryWebsiteJoins: pvArgs.categoryWebsiteJoins,
            websites: pvArgs.websites,
            testWebsiteURL: pvArgs.testWebsiteURL,
            log: lvLog
        };

        pvCallback(null,lvArgs);
    },

    constructWebsites: function(pvArgs, pvCallback){

        var lvLog = pvArgs.log;
        var lvFunctionName = 'constructWebsites';
        lvLog += log.log(gvScriptName,lvFunctionName,'Start','PROCS');

        var lvArgs = {pageElements: {}};
        lvArgs.pageElements = {
            databaseURI: pvArgs.databaseURI,
            parseServerURL: pvArgs.parseServerURL,
            websites: pvArgs.websites,
            log: lvLog
        };

        pvCallback(null,lvArgs);
    },

    constructSearchCategories: function(pvArgs, pvCallback){

        var lvLog = pvArgs.log;
        var lvFunctionName = 'constructSearchCategories';
        lvLog += log.log(gvScriptName,lvFunctionName,'Start','PROCS');

        var lvArgs = {pageElements: {}};
        lvArgs.pageElements = {
            databaseURI: pvArgs.databaseURI,
            parseServerURL: pvArgs.parseServerURL,
            searchCategories: pvArgs.searchCategories,
            log: lvLog
        };

        pvCallback(null,lvArgs);
    },

    constructSearchProducts: function(pvArgs, pvCallback){

        var lvLog = pvArgs.log;
        var lvFunctionName = 'constructSearchProducts';
        lvLog += log.log(gvScriptName,lvFunctionName,'Start','PROCS');

        var lvArgs = {pageElements: {}};
        lvArgs.pageElements = {
            databaseURI: pvArgs.databaseURI,
            parseServerURL: pvArgs.parseServerURL,
            searchProducts: pvArgs.searchProducts,
            searchCategories: pvArgs.searchCategories,
            productGroups: pvArgs.productGroups,
            log: lvLog
        };

        pvCallback(null,lvArgs);
    },

    constructProductGroups: function(pvArgs, pvCallback){

        var lvLog = pvArgs.log;
        var lvFunctionName = 'constructProductGroups';
        lvLog += log.log(gvScriptName,lvFunctionName,'Start','PROCS');

        var lvArgs = {pageElements: {}};
        lvArgs.pageElements = {
            databaseURI: pvArgs.databaseURI,
            parseServerURL: pvArgs.parseServerURL,
            productGroups: pvArgs.productGroups,
            log: lvLog
        };

        pvCallback(null,lvArgs);
    },

    constructBrands: function(pvArgs, pvCallback){

        var lvLog = pvArgs.log;
        var lvFunctionName = 'constructBrands';
        lvLog += log.log(gvScriptName,lvFunctionName,'Start','PROCS');

        var lvArgs = {pageElements: {}};
        lvArgs.pageElements = {
            databaseURI: pvArgs.databaseURI,
            parseServerURL: pvArgs.parseServerURL,
            brands: pvArgs.brands,
            log: lvLog
        };

        pvCallback(null,lvArgs);
    },

    constructRecommendations: function(pvArgs, pvCallback){

        var lvLog = pvArgs.log;
        var lvFunctionName = 'constructRecommendations';
        lvLog += log.log(gvScriptName,lvFunctionName,'Start','PROCS');

        var lvArgs = {pageElements: {}};
        lvArgs.pageElements = {
            databaseURI: pvArgs.databaseURI,
            parseServerURL: pvArgs.parseServerURL,
            recommendations: pvArgs.recommendations,
            productGroups: pvArgs.productGroups,
            brands: pvArgs.brands,
            searchCategories: pvArgs.searchCategories,
            log: lvLog
        };

        pvCallback(null,lvArgs);
    },

    constructActivityDashboard: function(pvArgs, pvCallback){

        var lvLog = pvArgs.log;
        var lvFunctionName = 'constructActivityDashboard';
        lvLog += log.log(gvScriptName,lvFunctionName,'Start','PROCS');

        var lvArgs = {pageElements: {}};

        var lvRowLimit = 20;

        // Create page elements with each of the datasets in it
        lvArgs.pageElements = {
            databaseURI: pvArgs.databaseURI,
            parseServerURL: pvArgs.parseServerURL,
            //
            users: pvArgs.users.slice(0,lvRowLimit),
            clickThroughs: pvArgs.userLogRecClickThroughs.slice(0,lvRowLimit),
            autoRecs: pvArgs.userLogRecommendations.slice(0,lvRowLimit),
            manualSearches: pvArgs.userLogManualSearches.slice(0,lvRowLimit),
            userSubmittedRecs: pvArgs.userSubmittedRecs_notProcessed,
            userSubmittedWebsites: pvArgs.userSubmittedWebsiteRecs_notProcessed,
            brokenLinks: pvArgs.userLogTrackedTabErrors_notProcessed,
            manualSearches_noResult: pvArgs.userLogManualSearches_noResult.slice(0,lvRowLimit),
            onOffs: pvArgs.userLogs_onOff.slice(0,lvRowLimit),
            showHides: pvArgs.userLogs_showHide.slice(0,lvRowLimit),
            hideUntilRefreshRestarts: pvArgs.userLogs_hideUntilRefreshRestart.slice(0,lvRowLimit),
            blockedBrands: pvArgs.userLogBlockedBrands.slice(0,lvRowLimit),
            log: lvLog
        };

        // And then add an extra object with the summary data (row counts)
        lvArgs.pageElements.summaryData = {
            numberOfUsers: pvArgs.summaryData.numberOfUsers,
            numberOfClickThroughs: pvArgs.summaryData.numberOfuserLogRecClickThroughs,
            numberOfAutoRecs: pvArgs.summaryData.numberOfUserLogRecommendations,
            numberOfManualSearches: pvArgs.summaryData.numberOfUserLogManualSearches,
            numberOfUserSubmittedRecs: pvArgs.summaryData.numberOfUserSubmittedRecs_notProcessed,
            numberofUserSubmittedWebsites: pvArgs.summaryData.numberofUserSubmittedWebsites_notProcessed,
            numberOfBrokenLinks: pvArgs.summaryData.numberOfuserLogTrackedTabErrors_notProcessed,
            numberOfManualSearches_noResult: pvArgs.summaryData.numberOfUserLogManualSearches_noResult,
            numberOfOnOffs: pvArgs.summaryData.numberOfUserLogs_onOff,
            numberOfShowHides: pvArgs.summaryData.numberOfUserLogs_showHide,
            numberOfHideUntilRefreshRestarts: pvArgs.summaryData.numberOfUserLogs_hideUntilRefreshRestart,
            numberOfBlockedBrands: pvArgs.summaryData.numberOfUserLogBlockedBrands
        };
        pvCallback(null,lvArgs);
    },

    constructUserReport: function(pvArgs, pvCallback){

        var lvLog = pvArgs.log;
        var lvFunctionName = 'constructUserReport';
        lvLog += log.log(gvScriptName,lvFunctionName,'Start','PROCS');

        var lvArgs = {pageElements: {}};
        lvArgs.pageElements = {
            databaseURI: pvArgs.databaseURI,
            parseServerURL: pvArgs.parseServerURL,
            users: pvArgs.users,
            log: lvLog
        };

        pvCallback(null,lvArgs);
    },

    constructDataQuality: function(pvArgs, pvCallback){

        var lvLog = pvArgs.log;
        var lvFunctionName = 'constructDataQuality';
        lvLog += log.log(gvScriptName,lvFunctionName,'Start','PROCS');

        var lvArgs = {pageElements: {}};
        lvArgs.pageElements = {
            databaseURI: pvArgs.databaseURI,
            parseServerURL: pvArgs.parseServerURL,
            log: lvLog
        };

        pvCallback(null,lvArgs);
    },

    constructJobLog: function(pvArgs, pvCallback){

        var lvLog = pvArgs.log;
        var lvFunctionName = 'constructJobLog';
        lvLog += log.log(gvScriptName,lvFunctionName,'Start','PROCS');

        var lvArgs = {pageElements: {}};
        lvArgs.pageElements = {
            databaseURI: pvArgs.databaseURI,
            parseServerURL: pvArgs.parseServerURL,
            log: lvLog
        };

        pvCallback(null,lvArgs);
    },

    constructBTSDashboard: function(pvArgs, pvCallback){

        var lvLog = pvArgs.log;
        var lvFunctionName = 'constructBTSDashboard';
        lvLog += log.log(gvScriptName,lvFunctionName,'Start','PROCS');

        var lvArgs = {pageElements: {}};
        lvArgs.pageElements = {
            databaseURI: pvArgs.databaseURI,
            parseServerURL: pvArgs.parseServerURL,
            log: lvLog
        };

        pvCallback(null,lvArgs);
    }
};
