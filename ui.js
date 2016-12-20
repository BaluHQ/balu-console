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
    log.log(gvScriptName + '.' + lvFunctionName + ': Start','INITS');

})();


module.exports = {

    constructWebsiteSearchConfig: function(pvArgs, pvCallback){

        var lvFunctionName = 'constructWebsiteSearchConfig';
        log.log(gvScriptName + '.' + lvFunctionName + ': Start','PROCS');

        var lvArgs = {pageElements: {}};
        lvArgs.pageElements = {
            parseServerURL: pvArgs.parseServerURL,
            categoryWebsiteJoins: pvArgs.categoryWebsiteJoins,
            websites: pvArgs.websites,
            testWebsiteURL: pvArgs.testWebsiteURL
        };

        pvCallback(null,lvArgs);
    },

    constructWebsites: function(pvArgs, pvCallback){

        var lvFunctionName = 'constructWebsites';
        log.log(gvScriptName + '.' + lvFunctionName + ': Start','PROCS');

        var lvArgs = {pageElements: {}};
        lvArgs.pageElements = {
            parseServerURL: pvArgs.parseServerURL,
            websites: pvArgs.websites
        };

        pvCallback(null,lvArgs);
    },

    constructSearchCategories: function(pvArgs, pvCallback){

        var lvFunctionName = 'constructSearchCategories';
        log.log(gvScriptName + '.' + lvFunctionName + ': Start','PROCS');

        var lvArgs = {pageElements: {}};
        lvArgs.pageElements = {
            parseServerURL: pvArgs.parseServerURL,
            searchCategories: pvArgs.searchCategories
        };

        pvCallback(null,lvArgs);
    },

    constructSearchProducts: function(pvArgs, pvCallback){

        var lvFunctionName = 'constructSearchProducts';
        log.log(gvScriptName + '.' + lvFunctionName + ': Start','PROCS');

        var lvArgs = {pageElements: {}};
        lvArgs.pageElements = {
            parseServerURL: pvArgs.parseServerURL,
            searchProducts: pvArgs.searchProducts,
            searchCategories: pvArgs.searchCategories,
            productGroups: pvArgs.productGroups,
        };

        pvCallback(null,lvArgs);
    },

    constructProductGroups: function(pvArgs, pvCallback){

        var lvFunctionName = 'constructProductGroups';
        log.log(gvScriptName + '.' + lvFunctionName + ': Start','PROCS');

        var lvArgs = {pageElements: {}};
        lvArgs.pageElements = {
            parseServerURL: pvArgs.parseServerURL,
            productGroups: pvArgs.productGroups
        };

        pvCallback(null,lvArgs);
    },

    constructBrands: function(pvArgs, pvCallback){

        var lvFunctionName = 'constructBrands';
        log.log(gvScriptName + '.' + lvFunctionName + ': Start','PROCS');

        var lvArgs = {pageElements: {}};
        lvArgs.pageElements = {
            parseServerURL: pvArgs.parseServerURL,
            brands: pvArgs.brands
        };

        pvCallback(null,lvArgs);
    },

    constructRecommendations: function(pvArgs, pvCallback){

        var lvFunctionName = 'constructRecommendations';
        log.log(gvScriptName + '.' + lvFunctionName + ': Start','PROCS');

        var lvArgs = {pageElements: {}};
        lvArgs.pageElements = {
            parseServerURL: pvArgs.parseServerURL,
            recommendations: pvArgs.recommendations,
            productGroups: pvArgs.productGroups,
            brands: pvArgs.brands,
            searchCategories: pvArgs.searchCategories
        };

        pvCallback(null,lvArgs);
    },

    constructActivityDashboard: function(pvArgs, pvCallback){

        var lvFunctionName = 'constructActivityDashboard';
        log.log(gvScriptName + '.' + lvFunctionName + ': Start','PROCS');

        var lvArgs = {pageElements: {}};

        var lvRowLimit = 20;

        // Create page elements with each of the datasets in it
        lvArgs.pageElements = {
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
            blockedBrands: pvArgs.userLogBlockedBrands.slice(0,lvRowLimit)
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

    constructDataQuality: function(pvArgs, pvCallback){

        var lvFunctionName = 'constructDataQuality';
        log.log(gvScriptName + '.' + lvFunctionName + ': Start','PROCS');

        var lvArgs = {pageElements: {}};
        lvArgs.pageElements = {
            parseServerURL: pvArgs.parseServerURL,
        };

        pvCallback(null,lvArgs);
    },

    constructJobLog: function(pvArgs, pvCallback){

        var lvFunctionName = 'constructJobLog';
        log.log(gvScriptName + '.' + lvFunctionName + ': Start','PROCS');

        var lvArgs = {pageElements: {}};
        lvArgs.pageElements = {
            parseServerURL: pvArgs.parseServerURL,
        };

        pvCallback(null,lvArgs);
    },

    constructBTSDashboard: function(pvArgs, pvCallback){

        var lvFunctionName = 'constructBTSDashboard';
        log.log(gvScriptName + '.' + lvFunctionName + ': Start','PROCS');

        var lvArgs = {pageElements: {}};
        lvArgs.pageElements = {
            parseServerURL: pvArgs.parseServerURL,
        };

        pvCallback(null,lvArgs);
    }
};
