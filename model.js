/*********************************************************
 * Description: Pulls data out of the DB and prepares it *
 *********************************************************/

/*
 * Load modules
 */
//var CacheManager = require('cache-manager')
var Promise = require('bluebird');
var Parse = require('parse/node');

/*
 * Load JS files
 */
var log = require('./log.js');

/*
 * Global variables
 */

var gvTestWebsiteURL = 'balutestwebsite.html';

/* Logging control */
var gvScriptName_model = 'model';

/* Parse SDK Config */
var gvParseServerURL_LOCAL = 'http://localhost:1337/parse';
var gvParseServerURL_PRD = process.env.PARSE_SERVER_PRD || 'https://balu-parse-server.herokuapp.com/parse';
var gvParseServerURL_TST = process.env.PARSE_SERVER_TST || 'https://balu-parse-server-test.herokuapp.com/parse';
var gvActiveParseServerURL = gvParseServerURL_LOCAL; // default to localhost

if(process.env.PARSE_SERVER_ACTIVE === 'TST') {
    var gvActiveParseServerURL =  gvParseServerURL_TST;
} else if (process.env.PARSE_SERVER_ACTIVE === 'PRD') {
    var gvActiveParseServerURL =  gvParseServerURL_TST;
} // console run with no environment vars, i.e. localhost, always points to localhost parse server

var gvAppId = 'mmhyD9DKGeOanjpRLHCR3bX8snue22oOd3NGfWKu';

/*
 * Initialise the script
 */
(function initialise(){

    var lvFunctionName = 'initialise';
    log.log(gvScriptName_model + '.' + lvFunctionName + ': Start','INITS');

    /*
     * Initialize Parse Server
     */
    Parse.initialize(gvAppId);
    Parse.serverURL = gvActiveParseServerURL;

    log.log(gvScriptName_model + '.' + lvFunctionName + ': Initialised Balu Parse Server to ' + gvActiveParseServerURL,' INFO');


    // Set up the cache. This is very static data. Let's refresh it only every 5 hours (18000 seconds) */
    //var memoryCache = cacheManager.caching({store: 'memory', max: 100, ttl: 18000});
    //var ttl = 18000;

})();


module.exports = {

    getBaluParseServerURL: function(){
        return gvActiveParseServerURL;
    },

    setBaluParseServerURL: function(pvSetTo){
        if(pvSetTo === 'TST') {
            gvActiveParseServerURL = gvParseServerURL_TST;
            Parse.initialize(gvAppId);
            Parse.serverURL = gvActiveParseServerURL;
        } else if (pvSetTo === 'PRD'){
            gvActiveParseServerURL = gvParseServerURL_PRD;
            Parse.initialize(gvAppId);
            Parse.serverURL = gvActiveParseServerURL;
        } else if (pvSetTo === 'LOCAL'){
            gvActiveParseServerURL = gvParseServerURL_LOCAL;
            Parse.initialize(gvAppId);
            Parse.serverURL = gvActiveParseServerURL;
        } else {
            log.log(gvScriptName_model + '.' + lvFunctionName + ': Tried to set to an unknown server. pvSetTo == ' + pvSetTo,'ERROR');
        }
        return gvActiveParseServerURL;
    },
    /*********************************
     * RETRIEVING DATA FROM DATABASE *
     *********************************/

    getUsers: function(pvArgs, pvCallback){

        var lvFunctionName = 'getUsers';
        log.log(gvScriptName_model + '.' + lvFunctionName + ': Start','PROCS');

        var lvArgs = {rowCount: null, users: []}; // to return the data to the callback

        var userQuery = new Parse.Query(Parse.User);
        userQuery.limit(1000);
        if(pvArgs.user_systemUsers === 'EXCLUDE') {
            userQuery.notContainedIn('email',['dev.baluhq@gmail.com','brian.spurling@gmail.com','brian@outlandish.com','gisellecory@gmail.com']);
            userQuery.notContainedIn('whoIs',['TEST']);
        } else if(pvArgs.user_systemUsers === 'ONLY') {
            userQuery.containedIn('email',['dev.baluhq@gmail.com','brian.spurling@gmail.com','brian@outlandish.com','gisellecory@gmail.com']);
            userQuery.containedIn('whoIs',['TEST']);
        } else if(pvArgs.user_systemUsers === 'BOTH') {
            // Do nothing
        }
        userQuery.descending('createdAt');

        userQuery.find({sessionToken: pvArgs.sessionToken}).then(
            function(users){
                log.log(gvScriptName_model + '.' + lvFunctionName + ': retrieved ' + users.length + ' users from DB',' INFO');
                if(users.length >= 1000) {
                    log.log(gvScriptName_model + '.' + lvFunctionName + ': find() is exceeding Parse Server row limit. Code needs upgrading otherwise data will be ignored!','ERROR');
                }
                lvArgs.rowCount = users.length;
                for(var i = 0; i < users.length; i++){
                    lvArgs.users.push({
                        createdAt: users[i].createdAt.toLocaleString(),
                        userId: users[i].id,
                        email: users[i].get('email'),
                        emailVerified: users[i].get('emailVerified'),
                        joyrideStatus: users[i].get('joyrideStatus'),
                        whoIs: users[i].get('whoIs')
                    });
                }
                pvCallback(null,lvArgs);
            },
            function (error) {
                log.log(gvScriptName_model + '.' + lvFunctionName + ': ' + error.message,'ERROR');
                lvArgs.responseMessage = error.message;
                pvCallback(error,lvArgs);
            }
        );
    },

    getCategoryWebsiteJoins: function(pvArgs, pvCallback){

        var lvFunctionName = 'getCategoryWebsiteJoins';
        log.log(gvScriptName_model + '.' + lvFunctionName + ': Start', 'PROCS');
        log.log(gvScriptName_model + '.' + lvFunctionName + ': pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

        // to return the data to the callback
        var lvArgs = {rowCount: null,
                      categoryWebsiteJoins: [],
                      testWebsiteURL: gvTestWebsiteURL};

        var categoryWebsiteJoinQuery = new Parse.Query(Parse.Object.extend('CategoryWebsiteJoin'));
        categoryWebsiteJoinQuery.include('searchCategory');
        categoryWebsiteJoinQuery.include('website');
        categoryWebsiteJoinQuery.limit(1000);
        categoryWebsiteJoinQuery.ascending('categoryName_sort,websiteURL_sort');

        categoryWebsiteJoinQuery.find({sessionToken: pvArgs.sessionToken}).then(
            function(categoryWebsiteJoins){
                log.log(gvScriptName_model + '.' + lvFunctionName + ': retrieved ' + categoryWebsiteJoins.length + ' categoryWebsiteJoins from DB',' INFO');
                if(categoryWebsiteJoins.length >= 1000) {
                    log.log(gvScriptName_model + '.' + lvFunctionName + ': find() is exceeding Parse Server row limit. Code needs upgrading otherwise data will be ignored!','ERROR');
                }
                lvArgs.rowCount = categoryWebsiteJoins.length;
                for(var i = 0; i < categoryWebsiteJoins.length; i++){
                    lvArgs.categoryWebsiteJoins.push({
                        categoryWebsiteJoinId: categoryWebsiteJoins[i].id,
                        searchCategoryId: categoryWebsiteJoins[i].get('searchCategory').id,
                        websiteId: categoryWebsiteJoins[i].get('website').id,
                        createdAt: categoryWebsiteJoins[i].createdAt.toLocaleString(),
                        departments: categoryWebsiteJoins[i].get('departments'),
                        searchCategoryName: categoryWebsiteJoins[i].get('searchCategory').get('categoryName'),
                        searchCategoryShortName: categoryWebsiteJoins[i].get('searchCategory').get('categoryShortName'),
                        websiteURL: categoryWebsiteJoins[i].get('website').get('websiteURL'),
                        isWebsiteOnOrOff: categoryWebsiteJoins[i].get('website').get('isWebsiteOnOrOff'),
                        isWebsiteLevelRec: categoryWebsiteJoins[i].get('isWebsiteLevelRec')
                    });
                }
                pvCallback(null,lvArgs);
            },
            function (error) {
                log.log(gvScriptName_model + '.' + lvFunctionName + ': ' + error.message,'ERROR');
                lvArgs.responseMessage = error.message;
                pvCallback(error,lvArgs);
            }
        );
    },

    getEthicalBrands: function(pvArgs, pvCallback){

        var lvFunctionName = 'getEthicalBrands';
        log.log(gvScriptName_model + '.' + lvFunctionName + ': Start', 'PROCS');
        //log.log(gvScriptName_model + '.' + lvFunctionName + ': pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

        var lvArgs = {rowCount: null, brands: []}; // to return the data to the callback

        var ethicalBrandQuery = new Parse.Query(Parse.Object.extend('EthicalBrand'));
        //ethicalBrandQuery.include('');
        ethicalBrandQuery.limit(1000);
        ethicalBrandQuery.ascending('brandName_LC');

        ethicalBrandQuery.find({sessionToken: pvArgs.sessionToken}).then(
            function(ethicalBrands){
                log.log(gvScriptName_model + '.' + lvFunctionName + ': retrieved ' + ethicalBrands.length + ' ethicalBrands from DB',' INFO');
                if(ethicalBrands.length >= 1000) {
                    log.log(gvScriptName_model + '.' + lvFunctionName + ': find() is exceeding Parse Server row limit. Code needs upgrading otherwise data will be ignored!','ERROR');
                }
                lvArgs.rowCount = ethicalBrands.length;
                for(var i = 0; i < ethicalBrands.length; i++){
                    lvBaluFavourite = null;
                    if(ethicalBrands[i].get('baluFavourite') !== null && typeof(ethicalBrands[i].get('baluFavourite')) !== 'undefined'){
                        lvBaluFavourite = ethicalBrands[i].get('baluFavourite').toString();
                    }
                    lvArgs.brands.push({
                        createdAt: ethicalBrands[i].createdAt.toLocaleString(),
                        brandId: ethicalBrands[i].id,
                        brandName: ethicalBrands[i].get('brandName'),
                        homepage: ethicalBrands[i].get('homepage'),
                        twitterHandle: ethicalBrands[i].get('twitterHandle'),
                        baluFavourite: lvBaluFavourite,
                        brandSpiel: ethicalBrands[i].get('brandSpiel')
                    });
                }
                pvCallback(null,lvArgs);
            },
            function (error) {
                log.log(gvScriptName_model + '.' + lvFunctionName + ': ' + error.message,'ERROR');
                lvArgs.responseMessage = error.message;
                pvCallback(error,lvArgs);
            }
        );
    },


    getJobLogs: function(pvArgs, pvCallback){

        var lvFunctionName = 'getJobLogs';
        log.log(gvScriptName_model + '.' + lvFunctionName + ': Start', 'PROCS');
        log.log(gvScriptName_model + '.' + lvFunctionName + ': pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

        var lvArgs = {rowCount: null, jobLogs: []}; // to return the data to the callback

        var jobLogQuery = new Parse.Query(Parse.Object.extend('JobLog'));
        //jobLogQuery.include('');
        jobLogQuery.limit(1000);
        //jobLogQuery.ascending('');

        jobLogQuery.find({sessionToken: pvArgs.sessionToken}).then(
            function(jobLogs){
                log.log(gvScriptName_model + '.' + lvFunctionName + ': retrieved ' + jobLogs.length + ' jobLogs from DB',' INFO');
                if(jobLogs.length >= 1000) {
                    log.log(gvScriptName_model + '.' + lvFunctionName + ': find() is exceeding Parse Server row limit. Code needs upgrading otherwise data will be ignored!','ERROR');
                }
                lvArgs.rowCount = jobLogs.length;
                for(var i = 0; i < jobLogs.length; i++){
                    lvArgs.jobLogs.push({
                        createdAt: jobLogs[i].createdAt.toLocaleString(),
                    });
                }
                pvCallback(null,lvArgs);
            },
            function (error) {
                log.log(gvScriptName_model + '.' + lvFunctionName + ': ' + error.message,'ERROR');
                lvArgs.responseMessage = error.message;
                pvCallback(error,lvArgs);
            }
        );
    },

    getLog_Events: function(pvArgs, pvCallback){

        var lvFunctionName = 'getLog_Events';
        log.log(gvScriptName_model + '.' + lvFunctionName + ': Start', 'PROCS');
        log.log(gvScriptName_model + '.' + lvFunctionName + ': pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

        var lvArgs = {rowCount: null, logEvents: []}; // to return the data to the callback

        var log_EventQuery = new Parse.Query(Parse.Object.extend('Log_Event'));
        //log_EventQuery.include('');
        log_EventQuery.limit(1000);
        //log_EventQuery.ascending('');

        log_EventQuery.find({sessionToken: pvArgs.sessionToken}).then(
            function(log_Events){
                log.log(gvScriptName_model + '.' + lvFunctionName + ': retrieved ' + log_Events.length + ' log_Events from DB',' INFO');
                if(log_Events.length >= 1000) {
                    log.log(gvScriptName_model + '.' + lvFunctionName + ': find() is exceeding Parse Server row limit. Code needs upgrading otherwise data will be ignored!','ERROR');
                }
                lvArgs.rowCount = log_Events.length;
                for(var i = 0; i < log_Events.length; i++){
                    lvArgs.log_Events.push({
                        createdAt: log_Events[i].createdAt.toLocaleString(),
                    });
                }
                pvCallback(null,lvArgs);
            },
            function (error) {
                log.log(gvScriptName_model + '.' + lvFunctionName + ': ' + error.message,'ERROR');
                lvArgs.responseMessage = error.message;
                pvCallback(error,lvArgs);
            }
        );
    },

    getProductGroups: function(pvArgs, pvCallback){

        var lvFunctionName = 'getProductGroups';
        log.log(gvScriptName_model + '.' + lvFunctionName + ': Start', 'PROCS');
        //log.log(gvScriptName_model + '.' + lvFunctionName + ': pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

        var lvArgs = {rowCount: null, productGroups: []}; // to return the data to the callback

        var productGroupQuery = new Parse.Query(Parse.Object.extend('ProductGroup'));
        productGroupQuery.limit(1000);
        productGroupQuery.ascending('productGroupName_LC');

        productGroupQuery.find({sessionToken: pvArgs.sessionToken}).then(
            function(productGroups){
                log.log(gvScriptName_model + '.' + lvFunctionName + ': retrieved ' + productGroups.length + ' productGroups from DB',' INFO');
                if(productGroups.length >= 1000) {
                    log.log(gvScriptName_model + '.' + lvFunctionName + ': find() is exceeding Parse Server row limit. Code needs upgrading otherwise data will be ignored!','ERROR');
                }
                lvArgs.rowCount = productGroups.length;
                for(var i = 0; i < productGroups.length; i++){
                    var lvChristmasBanner = '';
                    if(productGroups[i].get('christmasBanner') !== null && typeof(productGroups[i].get('christmasBanner')) !== 'undefined'){
                        lvChristmasBanner = productGroups[i].get('christmasBanner').toString();
                    }
                    lvArgs.productGroups.push({
                        createdAt: productGroups[i].createdAt.toLocaleString(),
                        productGroupId: productGroups[i].id,
                        productGroupName: productGroups[i].get('productGroupName'),
                        christmasBanner: lvChristmasBanner
                    });
                }
                pvCallback(null,lvArgs);
            },
            function (error) {
                log.log(gvScriptName_model + '.' + lvFunctionName + ': ' + error.message,'ERROR');
                lvArgs.responseMessage = error.message;
                pvCallback(error,lvArgs);
            }
        );
    },

    getRecommendations: function(pvArgs, pvCallback){

        var lvFunctionName = 'getRecommendations';
        log.log(gvScriptName_model + '.' + lvFunctionName + ': Start', 'PROCS');
        log.log(gvScriptName_model + '.' + lvFunctionName + ': pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

        var lvArgs = {rowCount: null, recommendations: []}; // to return the data to the callback

        var recommendationQuery = new Parse.Query(Parse.Object.extend('Recommendation'));
        recommendationQuery.include('productGroups'); // should be singular
        recommendationQuery.include('ethicalBrand');
        recommendationQuery.include('searchCategory');
        recommendationQuery.limit(1000);
        //recommendationQuery.ascending('');

        recommendationQuery.find({sessionToken: pvArgs.sessionToken}).then(
            function(recommendations){
                log.log(gvScriptName_model + '.' + lvFunctionName + ': retrieved ' + recommendations.length + ' recommendations from DB',' INFO');
                if(recommendations.length >= 1000) {
                    log.log(gvScriptName_model + '.' + lvFunctionName + ': find() is exceeding Parse Server row limit. Code needs upgrading otherwise data will be ignored!','ERROR');
                }
                lvArgs.rowCount = recommendations.length;
                for(var i = 0; i < recommendations.length; i++){
                    var lvProductGroupId = null;
                    var lvProductGroupName = null;
                    if(recommendations[i].get('productGroups')){
                        lvProductGroupId = recommendations[i].get('productGroups').id;
                        lvProductGroupName = recommendations[i].get('productGroups').get('productGroupName');
                    }
                    var lvSearchCategoryId = null;
                    var lvSearchCategoryName = null;
                    if(recommendations[i].get('searchCategory')){
                        lvSearchCategoryId = recommendations[i].get('searchCategory').id;
                        lvSearchCategoryName = recommendations[i].get('searchCategory').get('categoryName');
                    }
                    lvArgs.recommendations.push({
                        createdAt: recommendations[i].createdAt.toLocaleString(),
                        recommendationId: recommendations[i].id,
                        productName: recommendations[i].get('productName'),
                        productURL: recommendations[i].get('productURL'),
                        productGroupId: lvProductGroupId,
                        productGroupName: lvProductGroupName,
                        brandId: recommendations[i].get('ethicalBrand').id,
                        brandName: recommendations[i].get('ethicalBrand').get('brandName'),
                        pageConfirmationSearch: recommendations[i].get('pageConfirmationSearch'),
                        searchCategoryId: lvSearchCategoryId,
                        searchCategoryName: lvSearchCategoryName
                    });
                }
                pvCallback(null,lvArgs);
            },
            function (error) {
                log.log(gvScriptName_model + '.' + lvFunctionName + ': ' + error.message,'ERROR');
                lvArgs.responseMessage = error.message;
                pvCallback(error,lvArgs);
            }
        );
    },

    getRecommendationClickCounts: function(pvArgs, pvCallback){

        var lvFunctionName = 'getRecommendationClickCounts';
        log.log(gvScriptName_model + '.' + lvFunctionName + ': Start', 'PROCS');
        log.log(gvScriptName_model + '.' + lvFunctionName + ': pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

        var lvArgs = {rowCount: null, recommendationClickCounts: []}; // to return the data to the callback

        var recommendationClickCountQuery = new Parse.Query(Parse.Object.extend('RecommendationClickCount'));
        //recommendationClickCountQuery.include('');
        recommendationClickCountQuery.limit(1000);
        //recommendationClickCountQuery.ascending('');

        recommendationClickCountQuery.find({sessionToken: pvArgs.sessionToken}).then(
            function(recommendationClickCounts){
                log.log(gvScriptName_model + '.' + lvFunctionName + ': retrieved ' + recommendationClickCounts.length + ' recommendationClickCounts from DB',' INFO');
                if(recommendationClickCounts.length >= 1000) {
                    log.log(gvScriptName_model + '.' + lvFunctionName + ': find() is exceeding Parse Server row limit. Code needs upgrading otherwise data will be ignored!','ERROR');
                }
                lvArgs.rowCount = recommendationClickCounts.length;
                for(var i = 0; i < recommendationClickCounts.length; i++){
                    lvArgs.recommendationClickCounts.push({
                        createdAt: recommendationClickCounts[i].createdAt.toLocaleString(),
                    });
                }
                pvCallback(null,lvArgs);
            },
            function (error) {
                log.log(gvScriptName_model + '.' + lvFunctionName + ': ' + error.message,'ERROR');
                lvArgs.responseMessage = error.message;
                pvCallback(error,lvArgs);
            }
        );
    },

    getSearchCategories: function(pvArgs, pvCallback){

        var lvFunctionName = 'getSearchCategories';
        log.log(gvScriptName_model + '.' + lvFunctionName + ': Start', 'PROCS');
        //log.log(gvScriptName_model + '.' + lvFunctionName + ': pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

        var lvArgs = {rowCount: null, searchCategories: []}; // to return the data to the callback

        var searchCategoryQuery = new Parse.Query(Parse.Object.extend('SearchCategory'));
        //searchCategoryQuery.include('');
        searchCategoryQuery.limit(1000);
        searchCategoryQuery.ascending('categoryName_LC');

        searchCategoryQuery.find({sessionToken: pvArgs.sessionToken}).then(
            function(searchCategories){
                log.log(gvScriptName_model + '.' + lvFunctionName + ': retrieved ' + searchCategories.length + ' searchCategories from DB',' INFO');
                if(searchCategories.length >= 1000) {
                    log.log(gvScriptName_model + '.' + lvFunctionName + ': find() is exceeding Parse Server row limit. Code needs upgrading otherwise data will be ignored!','ERROR');
                }
                lvArgs.rowCount = searchCategories.length;
                for(var i = 0; i < searchCategories.length; i++){
                    lvArgs.searchCategories.push({
                        createdAt: searchCategories[i].createdAt.toLocaleString(),
                        searchCategoryId: searchCategories[i].id,
                        categoryName: searchCategories[i].get('categoryName'),
                        categoryShortName: searchCategories[i].get('categoryShortName'),
                        whyDoWeCare: searchCategories[i].get('whyDoWeCare')
                    });
                }
                pvCallback(null,lvArgs);
            },
            function (error) {
                log.log(gvScriptName_model + '.' + lvFunctionName + ': ' + error.message,'ERROR');
                lvArgs.responseMessage = error.message;
                pvCallback(error,lvArgs);
            }
        );
    },

    getSearchProducts: function(pvArgs, pvCallback){

        var lvFunctionName = 'getSearchProducts';
        log.log(gvScriptName_model + '.' + lvFunctionName + ': Start', 'PROCS');
        log.log(gvScriptName_model + '.' + lvFunctionName + ': pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

        var lvArgs = {rowCount: null, searchProducts: []}; // to return the data to the callback

        var searchProductQuery = new Parse.Query(Parse.Object.extend('SearchProduct'));
        searchProductQuery.include('productGroups'); // should be singular. Mistake when setting up DB
        searchProductQuery.include('searchCategories'); // should be singular. Mistake when setting up DB

        searchProductQuery.limit(1000);
        searchProductQuery.ascending('productName_LC');
        searchProductQuery.ascending('productGroup_sort');
        searchProductQuery.ascending('searchCategory_sort');

        searchProductQuery.find({sessionToken: pvArgs.sessionToken}).then(
            function(searchProducts){
                log.log(gvScriptName_model + '.' + lvFunctionName + ': retrieved ' + searchProducts.length + ' searchProducts from DB',' INFO');
                if(searchProducts.length >= 1000) {
                    log.log(gvScriptName_model + '.' + lvFunctionName + ': find() is exceeding Parse Server row limit. Code needs upgrading otherwise data will be ignored!','ERROR');
                }
                lvArgs.rowCount = searchProducts.length;
                for(var i = 0; i < searchProducts.length; i++){
                    lvArgs.searchProducts.push({
                        createdAt: searchProducts[i].createdAt.toLocaleString(),
                        searchProductId: searchProducts[i].id,
                        productGroupId: searchProducts[i].get('productGroups').id,
                        productGroupName: searchProducts[i].get('productGroups').get('productGroupName'),
                        searchCategoryId: searchProducts[i].get('searchCategories').id,
                        searchCategoryName: searchProducts[i].get('searchCategories').get('categoryName'),
                        productName: searchProducts[i].get('productName'),
                        brand: searchProducts[i].get('brand'),
                        andOr: searchProducts[i].get('andOr'),
                        searchTerm1: searchProducts[i].get('searchTerm1'),
                        searchTerm2: searchProducts[i].get('searchTerm2'),
                        searchTerm3: searchProducts[i].get('searchTerm3'),
                        searchTerm4: searchProducts[i].get('searchTerm4'),
                        searchTerm5: searchProducts[i].get('searchTerm5'),
                        searchTerm6: searchProducts[i].get('searchTerm6'),
                        searchTerm7: searchProducts[i].get('searchTerm7'),
                        sex: searchProducts[i].get('sex'),
                        negativeSearchTerm1: searchProducts[i].get('negativeSearchTerm1'),
                        negativeSearchTerm2: searchProducts[i].get('negativeSearchTerm2'),
                        negativeSearchTerm3: searchProducts[i].get('negativeSearchTerm3'),
                        negativeSearchTerm4: searchProducts[i].get('negativeSearchTerm4'),
                        negativeAndOr: searchProducts[i].get('negativeAndOr')
                    });
                }
                pvCallback(null,lvArgs);
            },
            function (error) {
                log.log(gvScriptName_model + '.' + lvFunctionName + ': ' + error.message,'ERROR');
                lvArgs.responseMessage = error.message;
                pvCallback(error,lvArgs);
            }
        );
    },

    getStats_RecClickThroughs: function(pvArgs, pvCallback){

        var lvFunctionName = 'getStats_RecClickThroughs';
        log.log(gvScriptName_model + '.' + lvFunctionName + ': Start', 'PROCS');
        log.log(gvScriptName_model + '.' + lvFunctionName + ': pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

        var lvArgs = {rowCount: null, statsRecClickThroughs: []}; // to return the data to the callback

        var stats_RecClickThroughQuery = new Parse.Query(Parse.Object.extend('Stats_RecClickThrough'));
        //stats_RecClickThroughQuery.include('');
        stats_RecClickThroughQuery.limit(1000);
        //stats_RecClickThroughQuery.ascending('');

        stats_RecClickThroughQuery.find({sessionToken: pvArgs.sessionToken}).then(
            function(stats_RecClickThroughs){
                log.log(gvScriptName_model + '.' + lvFunctionName + ': retrieved ' + stats_RecClickThroughs.length + ' stats_RecClickThroughs from DB',' INFO');
                if(stats_RecClickThroughs.length >= 1000) {
                    log.log(gvScriptName_model + '.' + lvFunctionName + ': find() is exceeding Parse Server row limit. Code needs upgrading otherwise data will be ignored!','ERROR');
                }
                lvArgs.rowCount = stats_RecClickThroughs.length;
                for(var i = 0; i < stats_RecClickThroughs.length; i++){
                    lvArgs.stats_RecClickThroughs.push({
                        createdAt: stats_RecClickThroughs[i].createdAt.toLocaleString(),
                    });
                }
                pvCallback(null,lvArgs);
            },
            function (error) {
                log.log(gvScriptName_model + '.' + lvFunctionName + ': ' + error.message,'ERROR');
                lvArgs.responseMessage = error.message;
                pvCallback(error,lvArgs);
            }
        );
    },

    getStats_Recommendations: function(pvArgs, pvCallback){

        var lvFunctionName = 'getStats_Recommendations';
        log.log(gvScriptName_model + '.' + lvFunctionName + ': Start', 'PROCS');
        log.log(gvScriptName_model + '.' + lvFunctionName + ': pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

        var lvArgs = {rowCount: null, statsRecommendations: []}; // to return the data to the callback

        var stats_RecommendationQuery = new Parse.Query(Parse.Object.extend('Stats_Recommendation'));
        //stats_RecommendationQuery.include('');
        stats_RecommendationQuery.limit(1000);
        //stats_RecommendationQuery.ascending('');

        stats_RecommendationQuery.find({sessionToken: pvArgs.sessionToken}).then(
            function(stats_Recommendations){
                log.log(gvScriptName_model + '.' + lvFunctionName + ': retrieved ' + stats_Recommendations.length + ' stats_Recommendations from DB',' INFO');
                if(stats_Recommendations.length >= 1000) {
                    log.log(gvScriptName_model + '.' + lvFunctionName + ': find() is exceeding Parse Server row limit. Code needs upgrading otherwise data will be ignored!','ERROR');
                }
                lvArgs.rowCount = stats_Recommendations.length;
                for(var i = 0; i < stats_Recommendations.length; i++){
                    lvArgs.stats_Recommendations.push({
                        createdAt: stats_Recommendations[i].createdAt.toLocaleString(),
                    });
                }
                pvCallback(null,lvArgs);
            },
            function (error) {
                log.log(gvScriptName_model + '.' + lvFunctionName + ': ' + error.message,'ERROR');
                lvArgs.responseMessage = error.message;
                pvCallback(error,lvArgs);
            }
        );
    },

    getTest_Pages: function(pvArgs, pvCallback){

        var lvFunctionName = 'getTest_Pages';
        log.log(gvScriptName_model + '.' + lvFunctionName + ': Start', 'PROCS');
        log.log(gvScriptName_model + '.' + lvFunctionName + ': pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

        var lvArgs = {rowCount: null, testPages: []}; // to return the data to the callback

        var test_PageQuery = new Parse.Query(Parse.Object.extend('Test_Page'));
        //test_PageQuery.include('');
        test_PageQuery.limit(1000);
        //test_PageQuery.ascending('');

        test_PageQuery.find({sessionToken: pvArgs.sessionToken}).then(
            function(test_Pages){
                log.log(gvScriptName_model + '.' + lvFunctionName + ': retrieved ' + test_Pages.length + ' test_Pages from DB',' INFO');
                if(test_Pages.length >= 1000) {
                    log.log(gvScriptName_model + '.' + lvFunctionName + ': find() is exceeding Parse Server row limit. Code needs upgrading otherwise data will be ignored!','ERROR');
                }
                lvArgs.rowCount = test_Pages.length;
                for(var i = 0; i < test_Pages.length; i++){
                    lvArgs.test_Pages.push({
                        createdAt: test_Pages[i].createdAt.toLocaleString(),
                    });
                }
                pvCallback(null,lvArgs);
            },
            function (error) {
                log.log(gvScriptName_model + '.' + lvFunctionName + ': ' + error.message,'ERROR');
                lvArgs.responseMessage = error.message;
                pvCallback(error,lvArgs);
            }
        );
    },

    getUserLogs: function(pvArgs, pvCallback){

        var lvFunctionName = 'getUserLogs';
        log.log(gvScriptName_model + '.' + lvFunctionName + ': Start', 'PROCS');
        log.log(gvScriptName_model + '.' + lvFunctionName + ': pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

        var lvArgs = {rowCount: null, userLogs: []}; // to return the data to the callback

        userLog_query = new Parse.Query(Parse.Object.extend('UserLog'));

        userLog_query.include('user');
        userLog_query.limit(1000);
        userLog_query.descending('createdAt');

        var lvEventNameQuery = 'NO FILTER';
        if(typeof(pvArgs.userLog_eventNames) !== 'undefined' && pvArgs.userLog_eventNames !== null) {
            userLog_query.containedIn('eventName', pvArgs.userLog_eventNames);
            lvEventNameQuery = pvArgs.userLog_eventNames;
        }
        userLog_query.find({sessionToken: pvArgs.sessionToken}).then(
            function(userLogs){
                log.log(gvScriptName_model + '.' + lvFunctionName + ': retrieved ' + userLogs.length + ' userLogs from DB (' + lvEventNameQuery + ')',' INFO');
                if(userLogs.length >= 1000) {
                    log.log(gvScriptName_model + '.' + lvFunctionName + ': find() is exceeding Parse Server row limit. Code needs upgrading otherwise data will be ignored!','ERROR');
                }
                lvArgs.rowCount = userLogs.length;
                for(var i = 0; i < userLogs.length; i++){
                    // In case we don't always have a user
                    var lvEmail = null;
                    if (typeof(userLogs[i].get('user')) !== 'undefined'){
                         lvEmail = userLogs[i].get('user').get('email');
                    }
                    lvArgs.userLogs.push({
                        createdAt: userLogs[i].createdAt.toLocaleString(),
                        email: lvEmail,
                        eventName: userLogs[i].get('eventName'),
                        tabURL: userLogs[i].get('tabURL')
                    });
                }
                pvCallback(null,lvArgs);
            },
            function(error){
                log.log(gvScriptName_model + '.' + lvFunctionName + ': ' + error.message,'ERROR');

                lvArgs.responseMessage = error.message;
                pvCallback(error,lvArgs);
            }
        );
    },

    getUserLogs_blockBrand: function(pvArgs, pvCallback){

        var lvFunctionName = 'getUserLogs_blockBrand';
        log.log(gvScriptName_model + '.' + lvFunctionName + ': Start', 'PROCS');
        log.log(gvScriptName_model + '.' + lvFunctionName + ': pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

        var lvArgs = {rowCount: null, userLogBlockBrands: []}; // to return the data to the callback

        userLog_blockBrand_query = new Parse.Query(Parse.Object.extend('UserLog_BlockBrand'));

        userLog_blockBrand_query.include('user');
        userLog_blockBrand_query.limit(1000);
        userLog_blockBrand_query.ascending('user');
        userLog_blockBrand_query.descending('createdAt');
        userLog_blockBrand_query.find({sessionToken: pvArgs.sessionToken}).then(
            function(userLogBockedBrands){
                log.log(gvScriptName_model + '.' + lvFunctionName + ': retrieved ' + userLogBockedBrands.length + ' userLogBockedBrands from DB',' INFO');
                if(userLogBockedBrands.length >= 1000) {
                    log.log(gvScriptName_model + '.' + lvFunctionName + ': find() is exceeding Parse Server row limit. Code needs upgrading otherwise data will be ignored!','ERROR');
                }
                lvArgs.rowCount = userLogBockedBrands.length;
                for(var i = 0; i < userLogBockedBrands.length; i++){
                    // In case we don't always have a user
                    var lvEmail = null;
                    if (typeof(userLogBockedBrands[i].get('user')) !== 'undefined'){
                         lvEmail = userLogBockedBrands[i].get('user').get('email');
                    }
                    lvArgs.userLogBlockBrands.push({
                        createdAt: userLogBockedBrands[i].createdAt.toLocaleString(),
                        email: lvEmail,
                        reason: userLogBockedBrands[i].get('reason'),
                        eventName: userLogBockedBrands[i].get('eventName'),
                        brandName: userLogBockedBrands[i].get('brandName'),
                        productName: userLogBockedBrands[i].get('productName'),
                        tabURL: userLogBockedBrands[i].get('tabURL')
                    });
                }
                pvCallback(null,lvArgs);
            },
            function(error){
                log.log(gvScriptName_model + '.' + lvFunctionName + ': ' + error.message,'ERROR');

                lvArgs.responseMessage = error.message;
                pvCallback(error,lvArgs);
            }
        );
    },

    getUserLogs_Joyride: function(pvArgs, pvCallback){

        var lvFunctionName = 'getUserLogs_Joyride';
        log.log(gvScriptName_model + '.' + lvFunctionName + ': Start', 'PROCS');
        log.log(gvScriptName_model + '.' + lvFunctionName + ': pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

        var lvArgs = {rowCount: null, userLogJoyRides: []}; // to return the data to the callback

        var userLog_JoyrideQuery = new Parse.Query(Parse.Object.extend('UserLog_Joyride'));
        //userLog_JoyrideQuery.include('');
        userLog_JoyrideQuery.limit(1000);
        //userLog_JoyrideQuery.ascending('');

        userLog_JoyrideQuery.find({sessionToken: pvArgs.sessionToken}).then(
            function(userLogs_Joyride){
                log.log(gvScriptName_model + '.' + lvFunctionName + ': retrieved ' + userLogs_Joyride.length + ' userLogs_Joyride from DB',' INFO');
                if(userLogs_Joyride.length >= 1000) {
                    log.log(gvScriptName_model + '.' + lvFunctionName + ': find() is exceeding Parse Server row limit. Code needs upgrading otherwise data will be ignored!','ERROR');
                }
                lvArgs.rowCount = userLogs_Joyride.length;
                for(var i = 0; i < userLogs_Joyride.length; i++){
                    lvArgs.userLogs_Joyride.push({
                        createdAt: userLogs_Joyride[i].createdAt.toLocaleString(),
                    });
                }
                pvCallback(null,lvArgs);
            },
            function (error) {
                log.log(gvScriptName_model + '.' + lvFunctionName + ': ' + error.message,'ERROR');
                lvArgs.responseMessage = error.message;
                pvCallback(error,lvArgs);
            }
        );
    },

    getUserLogs_ManualSearch: function(pvArgs, pvCallback){

        var lvFunctionName = 'getUserLogs_ManualSearch';
        log.log(gvScriptName_model + '.' + lvFunctionName + ': Start', 'PROCS');
        log.log(gvScriptName_model + '.' + lvFunctionName + ': pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

        var lvArgs = {rowCount: null, userLogManualSearches: []}; // to return the data to the callback

        userLog_ManualSearch_query = new Parse.Query(Parse.Object.extend('UserLog_ManualSearch'));
        userLog_ManualSearch_query.include('user');

        if(lvArgs.userLogManualSearch_noResults === 'ONLY'){
            userLog_ManualSearch_query.equalTo('eventName','MANUAL_SEARCH_NO_RESULTS');
        } else if(lvArgs.userLogManualSearch_noResults === 'EXCLUDE'){
            userLog_ManualSearch_query.notEqualTo('eventName','MANUAL_SEARCH_NO_RESULTS');
        } else if(lvArgs.userLogManualSearch_noResults === 'BOTH'){
            // Do nothing
        }

        userLog_ManualSearch_query.limit(1000);
        userLog_ManualSearch_query.descending('createdAt');
        userLog_ManualSearch_query.find({sessionToken: pvArgs.sessionToken}).then(
            function(userLogManualSearches){
                log.log(gvScriptName_model + '.' + lvFunctionName + ': retrieved ' + userLogManualSearches.length + ' userLogManualSearches from DB',' INFO');
                if(userLogManualSearches.length >= 1000) {
                    log.log(gvScriptName_model + '.' + lvFunctionName + ': find() is exceeding Parse Server row limit. Code needs upgrading otherwise data will be ignored!','ERROR');
                }
                lvArgs.rowCount = userLogManualSearches.length;
                for(var i = 0; i < userLogManualSearches.length; i++){
                    // In case we don't always have a user (some click throughs are anonymous, if done from a manual search without logging in)
                    var lvEmail = null;
                    if (typeof(userLogManualSearches[i].get('user')) !== 'undefined' && userLogManualSearches[i].get('user') !== null){
                         lvEmail = userLogManualSearches[i].get('user').get('email');
                    }
                    lvArgs.userLogManualSearches.push({
                        createdAt: userLogManualSearches[i].createdAt.toLocaleString(),
                        email: lvEmail,
                        eventName: userLogManualSearches[i].get('eventName'),
                        searchTerm: userLogManualSearches[i].get('searchTerm'),
                    });
                }
                pvCallback(null,lvArgs);
            },
            function(error){
                log.log(gvScriptName_model + '.' + lvFunctionName + ': ' + error.message,'ERROR');

                lvArgs.responseMessage = error.message;
                pvCallback(error,lvArgs);
            }
        );

    },

    getUserLogs_ManualSearch_Results: function(pvArgs, pvCallback){

        var lvFunctionName = 'getUserLogs_ManualSearch_Results';
        log.log(gvScriptName_model + '.' + lvFunctionName + ': Start', 'PROCS');
        log.log(gvScriptName_model + '.' + lvFunctionName + ': pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

        var lvArgs = {rowCount: null, userLogManualSearchResults: []}; // to return the data to the callback

        var userLog_ManualSearch_ResultsQuery = new Parse.Query(Parse.Object.extend('UserLog_ManualSearch_Results'));
        //userLog_ManualSearch_ResultsQuery.include('');
        userLog_ManualSearch_ResultsQuery.limit(1000);
        //userLog_ManualSearch_ResultsQuery.ascending('');

        userLog_ManualSearch_ResultsQuery.find({sessionToken: pvArgs.sessionToken}).then(
            function(userLogs_ManualSearch_Results){
                log.log(gvScriptName_model + '.' + lvFunctionName + ': retrieved ' + userLogs_ManualSearch_Results.length + ' userLogs_ManualSearch_Results from DB',' INFO');
                if(userLogs_ManualSearch_Results.length >= 1000) {
                    log.log(gvScriptName_model + '.' + lvFunctionName + ': find() is exceeding Parse Server row limit. Code needs upgrading otherwise data will be ignored!','ERROR');
                }
                lvArgs.rowCount = userLogs_ManualSearch_Results.length;
                for(var i = 0; i < userLogs_ManualSearch_Results.length; i++){
                    lvArgs.userLogs_ManualSearch_Results.push({
                        createdAt: userLogs_ManualSearch_Results[i].createdAt.toLocaleString(),
                    });
                }
                pvCallback(null,lvArgs);
            },
            function (error) {
                log.log(gvScriptName_model + '.' + lvFunctionName + ': ' + error.message,'ERROR');
                lvArgs.responseMessage = error.message;
                pvCallback(error,lvArgs);
            }
        );
    },

    getUserLogs_RecClickThrough: function(pvArgs, pvCallback){

        var lvFunctionName = 'getUserLogs_RecClickThrough';
        log.log(gvScriptName_model + '.' + lvFunctionName + ': Start', 'PROCS');
        log.log(gvScriptName_model + '.' + lvFunctionName + ': pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

        var lvArgs = {rowCount: null, userLogRecClickThroughs: []}; // to return the data to the callback

        userLog_recClickThrough_query = new Parse.Query(Parse.Object.extend('UserLog_RecClickThrough'));

        userLog_recClickThrough_query.include('user');
        userLog_recClickThrough_query.include('recommendation');
        userLog_recClickThrough_query.include('recommendation.ethicalBrand');
        userLog_recClickThrough_query.limit(1000);
        userLog_recClickThrough_query.descending('createdAt');
        userLog_recClickThrough_query.find({sessionToken: pvArgs.sessionToken}).then(
            function(userLogRecClickThroughs){
                log.log(gvScriptName_model + '.' + lvFunctionName + ': retrieved ' + userLogRecClickThroughs.length + ' userLogRecClickThroughs from DB',' INFO');
                if(userLogRecClickThroughs.length >= 1000) {
                    log.log(gvScriptName_model + '.' + lvFunctionName + ': find() is exceeding Parse Server row limit. Code needs upgrading otherwise data will be ignored!','ERROR');
                }
                lvArgs.rowCount = userLogRecClickThroughs.length;
                for(var i = 0; i < userLogRecClickThroughs.length; i++){
                    // In case we don't always have a user (some click throughs are anonymous, if done from a manual search without logging in)
                    var lvEmail = null;
                    if (typeof(userLogRecClickThroughs[i].get('user')) !== 'undefined'){
                         lvEmail = userLogRecClickThroughs[i].get('user').get('email');
                    }
                    // We don't always have a recommendation (some have been deleted from the DB, prior to archiving implemented)
                    var lvBrandName = null;
                    if (typeof(userLogRecClickThroughs[i].get('recommendation')) !== 'undefined'){
                         lvBrandName = userLogRecClickThroughs[i].get('recommendation').get('ethicalBrand').get('brandName');
                    }
                    lvArgs.userLogRecClickThroughs.push({
                        createdAt: userLogRecClickThroughs[i].createdAt.toLocaleString(),
                        email: lvEmail,
                        brandName: lvBrandName,
                        productName: userLogRecClickThroughs[i].get('recProductName'),
                        tabURL: userLogRecClickThroughs[i].get('tabURL'),
                        hyperlinkURL: userLogRecClickThroughs[i].get('hyperlinkURL')
                    });
                }
                pvCallback(null,lvArgs);
            },
            function(error){
                log.log(gvScriptName_model + '.' + lvFunctionName + ': ' + error.message,'ERROR');

                lvArgs.responseMessage = error.message;
                pvCallback(error,lvArgs);
            }
        );
    },

    getUserLogs_Recommendations: function(pvArgs, pvCallback){

        var lvFunctionName = 'getUserLogs_Recommendations';
        log.log(gvScriptName_model + '.' + lvFunctionName + ': Start', 'PROCS');
        log.log(gvScriptName_model + '.' + lvFunctionName + ': pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

        var lvArgs = {rowCount: null, userLogRecommendations: []}; // to return the data to the callback

        userLog_recommendations_query = new Parse.Query(Parse.Object.extend('UserLog_Recommendations'));

        userLog_recommendations_query.include('user');
        userLog_recommendations_query.include('recommendation');
        userLog_recommendations_query.limit(1000);
        userLog_recommendations_query.descending('createdAt');
        userLog_recommendations_query.find({sessionToken: pvArgs.sessionToken}).then(
            function(userLogRecommendations){
                log.log(gvScriptName_model + '.' + lvFunctionName + ': retrieved ' + userLogRecommendations.length + ' userLogRecommendations from DB',' INFO');
                if(userLogRecommendations.length >= 1000) {
                    log.log(gvScriptName_model + '.' + lvFunctionName + ': find() is exceeding Parse Server row limit. Code needs upgrading otherwise data will be ignored!','ERROR');
                }
                lvArgs.rowCount = userLogRecommendations.length;
                for(var i = 0; i < userLogRecommendations.length; i++){
                    // In case we don't always have a user
                    var lvEmail = null;
                    if (typeof(userLogRecommendations[i].get('user')) !== 'undefined'){
                         lvEmail = userLogRecommendations[i].get('user').get('email');
                    }
                    lvArgs.userLogRecommendations.push({
                        createdAt: userLogRecommendations[i].createdAt.toLocaleString(),
                        email: lvEmail,
                        twitterHandles: userLogRecommendations[i].get('twitterHandles'),
                        tabURL: userLogRecommendations[i].get('tabURL')
                    });
                }
                pvCallback(null,lvArgs);
            },
            function(error){
                log.log(gvScriptName_model + '.' + lvFunctionName + ': ' + error.message,'ERROR');

                lvArgs.responseMessage = error.message;
                pvCallback(error,lvArgs);
            }
        );

    },

    getUserLogs_RecRatings: function(pvArgs, pvCallback){

        var lvFunctionName = 'getUserLogs_RecRatings';
        log.log(gvScriptName_model + '.' + lvFunctionName + ': Start', 'PROCS');
        log.log(gvScriptName_model + '.' + lvFunctionName + ': pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

        var lvArgs = {rowCount: null, userLogRecRatings: []}; // to return the data to the callback

        var userLog_RecRatingsQuery = new Parse.Query(Parse.Object.extend('UserLog_RecRatings'));
        //userLog_RecRatingsQuery.include('');
        userLog_RecRatingsQuery.limit(1000);
        //userLog_RecRatingsQuery.ascending('');

        userLog_RecRatingsQuery.find({sessionToken: pvArgs.sessionToken}).then(
            function(userLogs_RecRatings){
                log.log(gvScriptName_model + '.' + lvFunctionName + ': retrieved ' + userLogs_RecRatings.length + ' userLogs_RecRatings from DB',' INFO');
                if(userLogs_RecRatings.length >= 1000) {
                    log.log(gvScriptName_model + '.' + lvFunctionName + ': find() is exceeding Parse Server row limit. Code needs upgrading otherwise data will be ignored!','ERROR');
                }
                lvArgs.rowCount = userLogs_RecRatings.length;
                for(var i = 0; i < userLogs_RecRatings.length; i++){
                    lvArgs.userLogs_RecRatings.push({
                        createdAt: userLogs_RecRatings[i].createdAt.toLocaleString(),
                    });
                }
                pvCallback(null,lvArgs);
            },
            function (error) {
                log.log(gvScriptName_model + '.' + lvFunctionName + ': ' + error.message,'ERROR');
                lvArgs.responseMessage = error.message;
                pvCallback(error,lvArgs);
            }
        );
    },

    getUserLogs_Search: function(pvArgs, pvCallback){

        var lvFunctionName = '';
        log.log(gvScriptName_model + '.' + lvFunctionName + ': Start', 'PROCS');
        log.log(gvScriptName_model + '.' + lvFunctionName + ': pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

        var lvArgs = {rowCount: null, userLogSearches: []}; // to return the data to the callback

        var userLog_SearchQuery = new Parse.Query(Parse.Object.extend('UserLog_Search'));
        //userLog_SearchQuery.include('');
        userLog_SearchQuery.limit(1000);
        //userLog_SearchQuery.ascending('');

        userLog_SearchQuery.find({sessionToken: pvArgs.sessionToken}).then(
            function(userLogs_Search){
                log.log(gvScriptName_model + '.' + lvFunctionName + ': retrieved ' + userLogs_Search.length + ' userLogs_Search from DB',' INFO');
                if(userLogs_Search.length >= 1000) {
                    log.log(gvScriptName_model + '.' + lvFunctionName + ': find() is exceeding Parse Server row limit. Code needs upgrading otherwise data will be ignored!','ERROR');
                }
                lvArgs.rowCount = userLogs_Search.length;
                for(var i = 0; i < userLogs_Search.length; i++){
                    lvArgs.userLogs_Search.push({
                        createdAt: userLogs_Search[i].createdAt.toLocaleString(),
                    });
                }
                pvCallback(null,lvArgs);
            },
            function (error) {
                log.log(gvScriptName_model + '.' + lvFunctionName + ': ' + error.message,'ERROR');
                lvArgs.responseMessage = error.message;
                pvCallback(error,lvArgs);
            }
        );
    },

    getUserLogs_TrackedTabError: function(pvArgs, pvCallback){

        var lvFunctionName = 'getUserLogs_TrackedTabError';
        log.log(gvScriptName_model + '.' + lvFunctionName + ': Start', 'PROCS');
        log.log(gvScriptName_model + '.' + lvFunctionName + ': pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

        var lvArgs = {rowCount: null, userLogTrackedTabErrors: []}; // to return the data to the callback

        var userLog_TrackedTabError_query = new Parse.Query(Parse.Object.extend('UserLog_TrackedTabError'));
        userLog_TrackedTabError_query.include('user');
        userLog_TrackedTabError_query.include('recommendation');

        if(pvArgs.userLogTrackedTabError_processed === 'ONLY') {
            userLog_TrackedTabError_query.equalTo('processed',true);
        } else if (pvArgs.userLogTrackedTabError_processed === 'EXCLUDE') {
            userLog_TrackedTabError_query.notEqualTo('processed',true);
        } else if (pvArgs.userLogTrackedTabError_processed === 'BOTH') {
            // no filter - return everything
        }

        userLog_TrackedTabError_query.limit(1000);
        userLog_TrackedTabError_query.ascending('processed,originalURL');
        userLog_TrackedTabError_query.descending('createdAt');
        userLog_TrackedTabError_query.find({sessionToken: pvArgs.sessionToken}).then(
            function(userLogTrackedTabErrors){
                log.log(gvScriptName_model + '.' + lvFunctionName + ': retrieved ' + userLogTrackedTabErrors.length + ' userLogTrackedTabErrors from DB',' INFO');
                if(userLogTrackedTabErrors.length >= 1000) {
                    log.log(gvScriptName_model + '.' + lvFunctionName + ': find() is exceeding Parse Server row limit. Code needs upgrading otherwise data will be ignored!','ERROR');
                }
                lvArgs.rowCount = userLogTrackedTabErrors.length;
                for(var i = 0; i < userLogTrackedTabErrors.length; i++){
                    // In case we don't always have a user
                    var lvEmail = null;
                    if (typeof(userLogTrackedTabErrors[i].get('user')) !== 'undefined'){
                         lvEmail = userLogTrackedTabErrors[i].get('user').get('email');
                    }
                    lvArgs.userLogTrackedTabErrors.push({
                        createdAt: userLogTrackedTabErrors[i].createdAt.toLocaleString(),
                        email: lvEmail,
                        originalURL: userLogTrackedTabErrors[i].get('originalURL'),
                        productName: userLogTrackedTabErrors[i].get('recommendation').get('productName'),
                        pageConfirmationSearch: userLogTrackedTabErrors[i].get('pageConfirmationSearch'),
                        processed: userLogTrackedTabErrors[i].get('processed')
                    });
                }
                pvCallback(null,lvArgs);
            },
            function(error){
                log.log(gvScriptName_model + '.' + lvFunctionName + ': ' + error.message,'ERROR');

                lvArgs.responseMessage = error.message;
                pvCallback(error,lvArgs);
            });
    },

    getUserLogs_TweetWindow: function(pvArgs, pvCallback){

        var lvFunctionName = 'getUserLogs_TweetWindow';
        log.log(gvScriptName_model + '.' + lvFunctionName + ': Start', 'PROCS');
        log.log(gvScriptName_model + '.' + lvFunctionName + ': pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

        var lvArgs = {rowCount: null, userLogTweetWindows: []}; // to return the data to the callback

        var userLog_TweetWindowQuery = new Parse.Query(Parse.Object.extend('UserLog_TweetWindow'));
        //userLog_TweetWindowQuery.include('');
        userLog_TweetWindowQuery.limit(1000);
        //userLog_TweetWindowQuery.ascending('');

        userLog_TweetWindowQuery.find({sessionToken: pvArgs.sessionToken}).then(
            function(userLogs_TweetWindow){
                log.log(gvScriptName_model + '.' + lvFunctionName + ': retrieved ' + userLogs_TweetWindow.length + ' userLogs_TweetWindow from DB',' INFO');
                if(userLogs_TweetWindow.length >= 1000) {
                    log.log(gvScriptName_model + '.' + lvFunctionName + ': find() is exceeding Parse Server row limit. Code needs upgrading otherwise data will be ignored!','ERROR');
                }
                lvArgs.rowCount = userLogs_TweetWindow.length;
                for(var i = 0; i < userLogs_TweetWindow.length; i++){
                    lvArgs.userLogs_TweetWindow.push({
                        createdAt: userLogs_TweetWindow[i].createdAt.toLocaleString(),
                    });
                }
                pvCallback(null,lvArgs);
            },
            function (error) {
                log.log(gvScriptName_model + '.' + lvFunctionName + ': ' + error.message,'ERROR');
                lvArgs.responseMessage = error.message;
                pvCallback(error,lvArgs);
            }
        );
    },

    getUserLogs_WhyCare: function(pvArgs, pvCallback){

        var lvFunctionName = 'getUserLogs_WhyCare';
        log.log(gvScriptName_model + '.' + lvFunctionName + ': Start', 'PROCS');
        log.log(gvScriptName_model + '.' + lvFunctionName + ': pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

        var lvArgs = {rowCount: null, userLogWhyCares: []}; // to return the data to the callback

        var userLog_WhyCareQuery = new Parse.Query(Parse.Object.extend('UserLog_WhyCare'));
        //userLog_WhyCareQuery.include('');
        userLog_WhyCareQuery.limit(1000);
        //userLog_WhyCareQuery.ascending('');

        userLog_WhyCareQuery.find({sessionToken: pvArgs.sessionToken}).then(
            function(userLogs_WhyCare){
                log.log(gvScriptName_model + '.' + lvFunctionName + ': retrieved ' + userLogs_WhyCare.length + ' userLogs_WhyCare from DB',' INFO');
                if(userLogs_WhyCare.length >= 1000) {
                    log.log(gvScriptName_model + '.' + lvFunctionName + ': find() is exceeding Parse Server row limit. Code needs upgrading otherwise data will be ignored!','ERROR');
                }
                lvArgs.rowCount = userLogs_WhyCare.length;
                for(var i = 0; i < userLogs_WhyCare.length; i++){
                    lvArgs.userLogs_WhyCare.push({
                        createdAt: userLogs_WhyCare[i].createdAt.toLocaleString(),
                    });
                }
                pvCallback(null,lvArgs);
            },
            function (error) {
                log.log(gvScriptName_model + '.' + lvFunctionName + ': ' + error.message,'ERROR');
                lvArgs.responseMessage = error.message;
                pvCallback(error,lvArgs);
            }
        );
    },

    getUserRecommendationRatings: function(pvArgs, pvCallback){

        var lvFunctionName = 'getUserRecommendationRatings';
        log.log(gvScriptName_model + '.' + lvFunctionName + ': Start', 'PROCS');
        log.log(gvScriptName_model + '.' + lvFunctionName + ': pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

        var lvArgs = {rowCount: null, userRecommendationRatings: []}; // to return the data to the callback

        var userRecommendationRatingQuery = new Parse.Query(Parse.Object.extend('UserRecommendationRating'));
        //userRecommendationRatingQuery.include('');
        userRecommendationRatingQuery.limit(1000);
        //userRecommendationRatingQuery.ascending('');

        userRecommendationRatingQuery.find({sessionToken: pvArgs.sessionToken}).then(
            function(userRecommendationRatings){
                log.log(gvScriptName_model + '.' + lvFunctionName + ': retrieved ' + userRecommendationRatings.length + ' userRecommendationRatings from DB',' INFO');
                if(userRecommendationRatings.length >= 1000) {
                    log.log(gvScriptName_model + '.' + lvFunctionName + ': find() is exceeding Parse Server row limit. Code needs upgrading otherwise data will be ignored!','ERROR');
                }
                lvArgs.rowCount = userRecommendationRatings.length;
                for(var i = 0; i < userRecommendationRatings.length; i++){
                    lvArgs.userRecommendationRatings.push({
                        createdAt: userRecommendationRatings[i].createdAt.toLocaleString(),
                    });
                }
                pvCallback(null,lvArgs);
            },
            function (error) {
                log.log(gvScriptName_model + '.' + lvFunctionName + ': ' + error.message,'ERROR');
                lvArgs.responseMessage = error.message;
                pvCallback(error,lvArgs);
            }
        );
    },

    getUserSubmittedRecs: function(pvArgs, pvCallback){

        var lvFunctionName = 'getUserSubmittedRecs';
        log.log(gvScriptName_model + '.' + lvFunctionName + ': Start', 'PROCS');
        log.log(gvScriptName_model + '.' + lvFunctionName + ': pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

        var lvArgs = {rowCount: null, userSubmittedRecs: []}; // to return the data to the callback

        var userSubmittedRec_query = new Parse.Query(Parse.Object.extend('UserSubmittedRec'));

        userSubmittedRec_query.include('user');
        userSubmittedRec_query.limit(1000);

        if(pvArgs.userSubmittedRec_processed === 'ONLY') {
            userSubmittedRec_query.equalTo('processed',true);
        } else if (pvArgs.userSubmittedRec_processed === 'EXCLUDE') {
            userSubmittedRec_query.notEqualTo('processed',true);
        } else if (pvArgs.userSubmittedRec_processed === 'BOTH') {
            // no filter - return everything
        }

        userSubmittedRec_query.ascending('processed,user');
        userSubmittedRec_query.descending('createdAt');
        userSubmittedRec_query.find({sessionToken: pvArgs.sessionToken}).then(
            function(userSubmittedRecs){
                log.log(gvScriptName_model + '.' + lvFunctionName + ': retrieved ' + userSubmittedRecs.length + ' userSubmittedRecs from DB',' INFO');
                if(userSubmittedRecs.length >= 1000) {
                    log.log(gvScriptName_model + '.' + lvFunctionName + ': find() is exceeding Parse Server row limit. Code needs upgrading otherwise data will be ignored!','ERROR');
                }
                lvArgs.rowCount = userSubmittedRecs.length;
                for(var i = 0; i < userSubmittedRecs.length; i++){
                    // In case we don't always have a user
                    var lvEmail = null;
                    if (typeof(userSubmittedRecs[i].get('user')) !== 'undefined'){
                         lvEmail = userSubmittedRecs[i].get('user').get('email');
                    }
                    lvArgs.userSubmittedRecs.push({
                        createdAt: userSubmittedRecs[i].createdAt.toLocaleString(),
                        email: lvEmail,
                        productName: userSubmittedRecs[i].get('productName'),
                        URLOrTwitter: userSubmittedRecs[i].get('URLOrTwitter'),
                        why: userSubmittedRecs[i].get('why'),
                        processed: userSubmittedRecs[i].get('processed')
                    });
                }
                pvCallback(null,lvArgs);
            },
            function(error){
                log.log(gvScriptName_model + '.' + lvFunctionName + ': ' + error.message,'ERROR');

                lvArgs.responseMessage = error.message;
                pvCallback(error,lvArgs);
            }
        );
    },

    getUserSubmittedWebsiteRecs: function(pvArgs, pvCallback){

        var lvFunctionName = 'getUserSubmittedWebsiteRecs';
        log.log(gvScriptName_model + '.' + lvFunctionName + ': Start', 'PROCS');
        log.log(gvScriptName_model + '.' + lvFunctionName + ': pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

        var lvArgs = {rowCount: null, userSubmittedWebsiteRecs: []}; // to return the data to the callback

        var userSubmittedWebsiteRec_query = new Parse.Query(Parse.Object.extend('UserSubmittedWebsiteRec'));

        userSubmittedWebsiteRec_query.include('user');
        userSubmittedWebsiteRec_query.limit(1000);
        userSubmittedWebsiteRec_query.ascending('processed,user');
        userSubmittedWebsiteRec_query.descending('createdAt');

        if(pvArgs.userSubmittedWebsiteRec_processed === 'ONLY') {
            userSubmittedWebsiteRec_query.equalTo('processed',true);
        } else if (pvArgs.userSubmittedWebsiteRec_processed === 'EXCLUDE') {
            userSubmittedWebsiteRec_query.notEqualTo('processed',true);
        } else if (pvArgs.userSubmittedWebsiteRec_processed === 'BOTH') {
            // no filter - return everything
        }

        userSubmittedWebsiteRec_query.find({sessionToken: pvArgs.sessionToken}).then(
            function(userSubmittedWebsiteRecs){
                log.log(gvScriptName_model + '.' + lvFunctionName + ': retrieved ' + userSubmittedWebsiteRecs.length + ' userSubmittedWebsiteRecs from DB',' INFO');
                if(userSubmittedWebsiteRecs.length >= 1000) {
                    log.log(gvScriptName_model + '.' + lvFunctionName + ': find() is exceeding Parse Server row limit. Code needs upgrading otherwise data will be ignored!','ERROR');
                }
                lvArgs.rowCount = userSubmittedWebsiteRecs.length;
                for(var i = 0; i < userSubmittedWebsiteRecs.length; i++){
                    // In case we don't always have a user
                    var lvEmail = null;
                    if (typeof(userSubmittedWebsiteRecs[i].get('user')) !== 'undefined'){
                         lvEmail = userSubmittedWebsiteRecs[i].get('user').get('email');
                    }
                    lvArgs.userSubmittedWebsiteRecs.push({
                        createdAt: userSubmittedWebsiteRecs[i].createdAt.toLocaleString(),
                        email: lvEmail,
                        websiteRec: userSubmittedWebsiteRecs[i].get('websiteRec'),
                    });
                }
                pvCallback(null,lvArgs);
            },
            function(error){
                log.log(gvScriptName_model + '.' + lvFunctionName + ': ' + error.message,'ERROR');

                lvArgs.responseMessage = error.message;
                pvCallback(error,lvArgs);
            }
        );
    },

    getWebsites: function(pvArgs, pvCallback){

        var lvFunctionName = 'getWebsites';
        log.log(gvScriptName_model + '.' + lvFunctionName + ': Start', 'PROCS');
        log.log(gvScriptName_model + '.' + lvFunctionName + ': pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

        // to return the data to the callback
        var lvArgs = {rowCount: null,
                      websites: [],
                      testWebsiteURL: gvTestWebsiteURL};

        var websiteQuery = new Parse.Query(Parse.Object.extend('Website'));
        //websiteQuery.include('');
        websiteQuery.limit(1000);
        websiteQuery.notEqualTo('websiteURL',gvTestWebsiteURL);
        websiteQuery.ascending('websiteURL');

        websiteQuery.find({sessionToken: pvArgs.sessionToken}).then(
            function(websites){
                log.log(gvScriptName_model + '.' + lvFunctionName + ': retrieved ' + websites.length + ' websites from DB',' INFO');
                if(websites.length >= 1000) {
                    log.log(gvScriptName_model + '.' + lvFunctionName + ': find() is exceeding Parse Server row limit. Code needs upgrading otherwise data will be ignored!','ERROR');
                }
                lvArgs.rowCount = websites.length;
                for(var i = 0; i < websites.length; i++){
                    lvArgs.websites.push({
                        websiteId: websites[i].id,
                        createdAt: websites[i].createdAt.toLocaleString(),
                        websiteURL: websites[i].get('websiteURL'),
                        isWebsiteOnOrOff: websites[i].get('isWebsiteOnOrOff')});
                }
                pvCallback(null,lvArgs);
            },
            function (error) {
                log.log(gvScriptName_model + '.' + lvFunctionName + ': ' + error.message,'ERROR');
                lvArgs.responseMessage = error.message;
                pvCallback(error,lvArgs);
            }
        );
    },

    /********************************
     * INSERTING DATA INTO DATABASE *
     ********************************/

    addCategoryWebsiteJoin: function(pvArgs, pvCallback){

        var lvFunctionName = 'addCategoryWebsiteJoin';
        log.log(gvScriptName_model + '.' + lvFunctionName + ': Start', 'PROCS');
        log.log(gvScriptName_model + '.' + lvFunctionName + ': pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

        lfAddCategoryWebsiteJoin(pvArgs,pvCallback);
    },

    addEthicalBrand: function(pvArgs, pvCallback){

        var lvFunctionName = 'addEthicalBrand';
        log.log(gvScriptName_model + '.' + lvFunctionName + ': Start', 'PROCS');
        log.log(gvScriptName_model + '.' + lvFunctionName + ': pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

        var lvBaluFavourite = null;
        if(pvArgs.inputs.baluFavourite === 'TRUE') {
            lvBaluFavourite = true;
        } else if (pvArgs.inputs.baluFavourite === 'FALSE') {
            lvBaluFavourite = false;
        }
        var EthicalBrand = Parse.Object.extend("EthicalBrand");
        var ethicalBrand = new EthicalBrand();
        ethicalBrand.set('brandName',pvArgs.inputs.brandName);
        ethicalBrand.set('homepage',pvArgs.inputs.homepage);
        ethicalBrand.set('twitterHandle',pvArgs.inputs.twitterHandle);
        ethicalBrand.set('brandSpiel',pvArgs.inputs.brandSpiel);
        ethicalBrand.set('baluFavourite',lvBaluFavourite);
        ethicalBrand.save(null, {
            sessionToken: pvArgs.sessionToken,
            success: function(pvEthicalBrand){
                // to return the data to the callback.
                var lvArgs = pvArgs;
                var lvBaluFavourite = pvEthicalBrand.get('baluFavourite').toString();
                // The new record object must contain one property for each input value passed in, where the checkbox input value is the id
                lvArgs.newRecord = {checkbox: pvEthicalBrand.id,
                                    brandName: pvEthicalBrand.get('brandName'),
                                    homepage: pvEthicalBrand.get('homepage'),
                                    twitterHandle: pvEthicalBrand.get('twitterHandle'),
                                    brandSpiel: pvEthicalBrand.get('brandSpiel'),
                                    baluFavourite: {key: pvArgs.inputs.baluFavourite, value: pvArgs.inputs.baluFavourite}};

                pvCallback(null,lvArgs);
            },
            error: log.parseErrorSave
        });
    },

    addProductGroup: function(pvArgs, pvCallback){

        var lvFunctionName = 'addProductGroup';
        log.log(gvScriptName_model + '.' + lvFunctionName + ': Start', 'PROCS');
        log.log(gvScriptName_model + '.' + lvFunctionName + ': pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

        var ProductGroup = Parse.Object.extend("ProductGroup");
        var productGroup = new ProductGroup();

        // convert to Boolean for DB
        var lvChristmasBanner = null;
        if(pvArgs.inputs.christmasBanner === 'TRUE') {
            lvChristmasBanner = true;
        } else if (pvArgs.inputs.christmasBanner === 'FALSE') {
            lvChristmasBanner = false;
        }
        productGroup.set('productGroupName',pvArgs.inputs.productGroupName);
        productGroup.set('christmasBanner',lvChristmasBanner);

        productGroup.save(null, {
            sessionToken: pvArgs.sessionToken,
            success: function(pvProductGroup){
                // to return the data to the callback.
                var lvArgs = pvArgs;
                // The new record object must contain one property for each input value passed in, where the checkbox input value is the id
                lvChristmasBanner = '';
                if(pvProductGroup.get('christmasBanner') !== null && typeof(pvProductGroup.get('christmasBanner')) !== 'undefined'){
                    lvChristmasBanner = pvProductGroup.get('christmasBanner').toString();
                }
                lvArgs.newRecord = {checkbox: pvProductGroup.id,
                                    productGroupName: pvProductGroup.get('productGroupName'),
                                    christmasBanner: {key: pvArgs.inputs.christmasBanner, value: pvArgs.inputs.christmasBanner}};

                pvCallback(null,lvArgs);
            },
            error: log.parseErrorSave
        });
    },

    addRecommendation: function(pvArgs, pvCallback){

        var lvFunctionName = 'addRecommendation';
        log.log(gvScriptName_model + '.' + lvFunctionName + ': Start', 'PROCS');
        //log.log(gvScriptName_model + '.' + lvFunctionName + ': pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

        var Recommendation = Parse.Object.extend("Recommendation");
        var recommendation = new Recommendation();

        if(pvArgs.inputs.productGroup !== 'null') {
            recommendation.set('productGroups',{__type: "Pointer",className: "ProductGroup", objectId: pvArgs.inputs.productGroup});
        }
        recommendation.set('productName',pvArgs.inputs.productName);
        recommendation.set('pageConfirmationSearch',pvArgs.inputs.pageConfirmationSearch);
        recommendation.set('productURL',pvArgs.inputs.productURL);
        recommendation.set('ethicalBrand',{__type: "Pointer",className: "EthicalBrand", objectId: pvArgs.inputs.brand});

        if(pvArgs.inputs.searchCategory !== 'null') {
            recommendation.set('searchCategory',{__type: "Pointer",className: "SearchCategory", objectId: pvArgs.inputs.searchCategory});
        }
        if(pvArgs.savedFile !== null) {
            recommendation.set('image',pvArgs.savedFile);
        }
        recommendation.save(null,{
            sessionToken: pvArgs.sessionToken,
            success: function(pvRecommendation){
                // to return the data to the callback.
                var lvArgs = {};
                // The new record object must contain one property for each input value passed in, where the checkbox input value is the id

                var lvProductGroup = {key: null,
                                      value: null};
                var lvSearchCategory = {key: null,
                                        value: null};
                if(typeof pvRecommendation.get('productGroups') !== 'undefined') {
                    lvProductGroup = {key: pvRecommendation.get('productGroups').objectId,
                                      value: pvRecommendation.get('productGroup_sort')};
                }
                if(typeof pvRecommendation.get('searchCategory') !== 'undefined') {
                    lvSearchCategory = {key: pvRecommendation.get('searchCategory').objectId,
                                        value: pvRecommendation.get('searchCategory_sort')};
                }

                lvArgs.newRecord = {checkbox: pvRecommendation.id,
                                    productGroup: lvProductGroup,
                                    productName: pvRecommendation.get('productName'),
                                    pageConfirmationSearch: pvRecommendation.get('pageConfirmationSearch'),
                                    productURL: pvRecommendation.get('productURL'),
                                    brand: {key: pvRecommendation.get('ethicalBrand').objectId, value: pvRecommendation.get('brandName_sort')},
                                    searchCategory: lvSearchCategory,
                                    image: '' // no point in returning this
                                };

                pvCallback(null,lvArgs);
            },
            error: log.parseErrorSave
        });
    },

    addSearchCategory: function(pvArgs, pvCallback){

        var lvFunctionName = 'addSearchCategory';
        log.log(gvScriptName_model + '.' + lvFunctionName + ': Start', 'PROCS');
        log.log(gvScriptName_model + '.' + lvFunctionName + ': pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

        var SearchCategory = Parse.Object.extend("SearchCategory");
        var searchCategory = new SearchCategory();
        searchCategory.set('categoryName',pvArgs.inputs.categoryName);
        searchCategory.set('categoryShortName',pvArgs.inputs.categoryShortName);
        searchCategory.set('whyDoWeCare',pvArgs.inputs.whyDoWeCare);
        searchCategory.save(null,{
            sessionToken: pvArgs.sessionToken,
            success: function(pvSearchCategory){
                // to return the data to the callback.
                var lvArgs = pvArgs;

                // The new record object must contain one property for each input value passed in, where the checkbox input value is the id
                lvArgs.newRecord = {checkbox: pvSearchCategory.id,
                                    categoryName: pvSearchCategory.get('categoryName'),
                                    categoryShortName: pvSearchCategory.get('categoryShortName'),
                                    whyDoWeCare: pvSearchCategory.get('whyDoWeCare')};

                // By default, every new searchCategory gets automatically added to the
                // test website. This is partly for testing, and partly so the catwebjoin table always
                // displays new categories even if they haven't yet had websites assigned.
                // Note that the test website should not be displayed on the front-end
                // To add this row, we first need to retrieve the test website
                var Website = Parse.Object.extend("Website");
                var lvWebsiteQuery = new Parse.Query(Website);
                lvWebsiteQuery.equalTo('websiteURL', 'balutestwebsite.html');
                lvWebsiteQuery.first({
                    success: function(pvWebsite) {
                        var lvCatWebJoinArgs = {inputs: {searchCategory: pvSearchCategory.id,
                                                         website: pvWebsite.id,
                                                         activeDepartments: null,
                                                         isWebsiteLevelRec: false},
                                                sessionToken: pvArgs.sessionToken};

                        lfAddCategoryWebsiteJoin(lvCatWebJoinArgs,function(pvErr,pvCatWebJoinArgs){
                            pvCallback(null,lvArgs); // respond with the searchCategory lvArgs record, we don't care about the categoryWebsiteJoin row that was created "in the background"
                        });
                    },
                    error: log.parseErrorFind
                });
            },
            error: log.parseErrorSave
        });
    },

    addSearchProduct: function(pvArgs, pvCallback){

        var lvFunctionName = 'addSearchProduct';
        log.log(gvScriptName_model + '.' + lvFunctionName + ': Start', 'PROCS');
        log.log(gvScriptName_model + '.' + lvFunctionName + ': pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

        var SearchProduct = Parse.Object.extend("SearchProduct");
        var searchProduct = new SearchProduct();
        searchProduct.set('searchCategories',{__type: "Pointer",className: "SearchCategory", objectId: pvArgs.inputs.searchCategory});
        searchProduct.set('productGroups',{__type: "Pointer",className: "ProductGroup", objectId: pvArgs.inputs.productGroup});
        searchProduct.set('productName',pvArgs.inputs.productName);
        searchProduct.set('brand',pvArgs.inputs.brand);
        searchProduct.set('andOr',pvArgs.inputs.andOr);
        searchProduct.set('searchTerm1',pvArgs.inputs.searchTerm1);
        searchProduct.set('searchTerm2',pvArgs.inputs.searchTerm2);
        searchProduct.set('searchTerm3',pvArgs.inputs.searchTerm3);
        searchProduct.set('searchTerm4',pvArgs.inputs.searchTerm4);
        searchProduct.set('searchTerm5',pvArgs.inputs.searchTerm5);
        searchProduct.set('searchTerm6',pvArgs.inputs.searchTerm6);
        searchProduct.set('searchTerm7',pvArgs.inputs.searchTerm7);
        searchProduct.set('sex',pvArgs.inputs.sex);
        searchProduct.set('negativeSearchTerm1',pvArgs.inputs.negativeSearchTerm1);
        searchProduct.set('negativeSearchTerm2',pvArgs.inputs.negativeSearchTerm2);
        searchProduct.set('negativeSearchTerm3',pvArgs.inputs.negativeSearchTerm3);
        searchProduct.set('negativeSearchTerm4',pvArgs.inputs.negativeSearchTerm4);
        searchProduct.set('negativeAndOr',pvArgs.inputs.negativeAndOr);

        searchProduct.save(null,{
            sessionToken: pvArgs.sessionToken,
            success: function(pvSearchProduct){
                // to return the data to the callback.
                var lvArgs = pvArgs;

                // The new record object must contain one property for each input value passed in, where the checkbox input value is the id
                lvArgs.newRecord = {checkbox: pvSearchProduct.id,
                                    searchCategory: {key: pvSearchProduct.get('searchCategories').objectId, value: pvSearchProduct.get('searchCategory_sort')},
                                    productGroup: {key: pvSearchProduct.get('productGroups').objectId, value: pvSearchProduct.get('productGroup_sort')},
                                    productName: pvSearchProduct.get('productName'),
                                    brand: pvSearchProduct.get('brand'),
                                    andOr: pvSearchProduct.get('andOr'),
                                    searchTerm1: pvSearchProduct.get('searchTerm1'),
                                    searchTerm2: pvSearchProduct.get('searchTerm2'),
                                    searchTerm3: pvSearchProduct.get('searchTerm3'),
                                    searchTerm4: pvSearchProduct.get('searchTerm4'),
                                    searchTerm5: pvSearchProduct.get('searchTerm5'),
                                    searchTerm6: pvSearchProduct.get('searchTerm6'),
                                    searchTerm7: pvSearchProduct.get('searchTerm7'),
                                    sex: pvSearchProduct.get('sex'),
                                    negativeSearchTerm1: pvSearchProduct.get('negativeSearchTerm1'),
                                    negativeSearchTerm2: pvSearchProduct.get('negativeSearchTerm2'),
                                    negativeSearchTerm3: pvSearchProduct.get('negativeSearchTerm3'),
                                    negativeSearchTerm4: pvSearchProduct.get('negativeSearchTerm4'),
                                    negativeAndOr: pvSearchProduct.get('negativeAndOr')};

                pvCallback(null,lvArgs);
            },
            error: log.parseErrorSave
        });
    },

    addWebsite: function(pvArgs, pvCallback){

        var lvFunctionName = 'addWebsite';
        log.log(gvScriptName_model + '.' + lvFunctionName + ': Start', 'PROCS');
        log.log(gvScriptName_model + '.' + lvFunctionName + ': pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

        var Website = Parse.Object.extend("Website");
        var website = new Website();
        website.set('websiteURL',pvArgs.inputs.websiteURL);
        website.set('isWebsiteOnOrOff',pvArgs.inputs.isWebsiteOnOrOff);
        website.save(null, {
            sessionToken: pvArgs.sessionToken,
            success: function(pvWebsite){
                // to return the data to the callback.
                var lvArgs = pvArgs;
                // to do: remove key/value pairs except where needed
                // The new record object must contain one property for each input value passed in, where the checkbox input value is the id
                lvArgs.newRecord = {checkbox: pvWebsite.id,
                                    websiteURL: pvWebsite.get('websiteURL'),
                                    isWebsiteOnOrOff: {key: pvWebsite.get('isWebsiteOnOrOff'), value: pvWebsite.get('isWebsiteOnOrOff')}};

                pvCallback(null,lvArgs);
            },
            error: log.parseErrorSave
        });
    },


    /*****************************
     * UPDATING DATA IN DATABASE *
     *****************************/

    updateCategoryWebsiteJoin: function(pvArgs, pvCallback){

        var lvFunctionName = 'updateCategoryWebsiteJoin';
        log.log(gvScriptName_model + '.' + lvFunctionName + ': Start', 'PROCS');
        log.log(gvScriptName_model + '.' + lvFunctionName + ': pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

        var lvIsWebsiteLevelRec = null;
        if(pvArgs.inputs.isWebsiteLevelRec === 'TRUE') {
            lvIsWebsiteLevelRec = true;
        } else if (pvArgs.inputs.isWebsiteLevelRec === 'FALSE') {
            lvIsWebsiteLevelRec = false;
        }

        var CategoryWebsiteJoin = Parse.Object.extend("CategoryWebsiteJoin");
        var categoryWebsiteJoinQuery = new Parse.Query(CategoryWebsiteJoin);

        categoryWebsiteJoinQuery.get(pvArgs.inputs.checkbox,{
            sessionToken: pvArgs.sessionToken,
            success: function(categoryWebsiteJoin){
                categoryWebsiteJoin.set('departments',pvArgs.inputs.activeDepartments);
                categoryWebsiteJoin.set('isWebsiteLevelRec',lvIsWebsiteLevelRec);
                categoryWebsiteJoin.save(null,{
                    sessionToken: pvArgs.sessionToken,
                    success: function(pvCategoryWebsiteJoin){
                        var lvArgs = pvArgs;
                        lvArgs.updatedRecord = {checkbox: pvCategoryWebsiteJoin.id,
                                                searchCategory: {key: pvCategoryWebsiteJoin.get('searchCategory').objectId, value: pvCategoryWebsiteJoin.get('categoryName_sort')},
                                                website: {key: pvCategoryWebsiteJoin.get('website').objectId, value: pvCategoryWebsiteJoin.get('websiteURL_sort')},
                                                activeDepartments: pvCategoryWebsiteJoin.get('departments'),
                                                isWebsiteLevelRec: {key: pvArgs.inputs.isWebsiteLevelRec, value: pvArgs.inputs.isWebsiteLevelRec}};
                        pvCallback(null,lvArgs);
                    },
                    error: log.parseErrorSave
                });
            },
            error: log.parseErrorGet
        });
    },

    updateEthicalBrand: function(pvArgs, pvCallback){

        var lvFunctionName = 'updateEthicalBrand';
        log.log(gvScriptName_model + '.' + lvFunctionName + ': Start', 'PROCS');
        log.log(gvScriptName_model + '.' + lvFunctionName + ': pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

        var EthicalBrand = Parse.Object.extend("EthicalBrand");
        var ethicalBrandQuery = new Parse.Query(EthicalBrand);

        ethicalBrandQuery.get(pvArgs.inputs.checkbox,{
            sessionToken: pvArgs.sessionToken,
            success: function(ethicalBrand){
                var lvBaluFavourite = null;
                if(pvArgs.inputs.baluFavourite === 'TRUE') {
                    lvBaluFavourite = true;
                } else if (pvArgs.inputs.baluFavourite === 'FALSE') {
                    lvBaluFavourite = false;
                }
                ethicalBrand.set('brandName',pvArgs.inputs.brandName);
                ethicalBrand.set('homepage',pvArgs.inputs.homepage);
                ethicalBrand.set('twitterHandle',pvArgs.inputs.twitterHandle);
                ethicalBrand.set('brandSpiel',pvArgs.inputs.brandSpiel);
                ethicalBrand.set('baluFavourite',lvBaluFavourite);
                ethicalBrand.save(null,{
                    sessionToken: pvArgs.sessionToken,
                    success: function(pvEthicalBrand){
                        var lvArgs = pvArgs;
                        lvBaluFavourite = null;
                        if(pvEthicalBrand.get('baluFavourite') !== null && typeof(pvEthicalBrand.get('baluFavourite')) !== 'undefined'){
                            lvBaluFavourite = pvEthicalBrand.get('baluFavourite').toString();
                        }
                        lvArgs.updatedRecord = {checkbox: pvEthicalBrand.id,
                                                brandName: pvEthicalBrand.get('brandName'),
                                                homepage: pvEthicalBrand.get('homepage'),
                                                twitterHandle: pvEthicalBrand.get('twitterHandle'),
                                                brandSpiel: pvEthicalBrand.get('brandSpiel'),
                                                baluFavourite: {key: pvArgs.inputs.baluFavourite, value: pvArgs.inputs.baluFavourite}};
                        pvCallback(null,lvArgs);
                    },
                    error: log.parseErrorSave
                });
            },
            error: log.parseErrorGet
        });
    },

    updateProductGroup: function(pvArgs, pvCallback){

        var lvFunctionName = 'updateProductGroup';
        log.log(gvScriptName_model + '.' + lvFunctionName + ': Start', 'PROCS');
        log.log(gvScriptName_model + '.' + lvFunctionName + ': pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

        var ProductGroup = Parse.Object.extend("ProductGroup");
        var productGroupQuery = new Parse.Query(ProductGroup);

        productGroupQuery.get(pvArgs.inputs.checkbox,{
            sessionToken: pvArgs.sessionToken,
            success: function(productGroup){
                var lvChristmasBanner = null;
                if(pvArgs.inputs.christmasBanner === 'TRUE') {
                    lvChristmasBanner = true;
                } else if (pvArgs.inputs.christmasBanner === 'FALSE') {
                    lvChristmasBanner = false;
                }
                productGroup.set('productGroupName',pvArgs.inputs.productGroupName);
                productGroup.set('christmasBanner',lvChristmasBanner);

                productGroup.save(null,{
                    sessionToken: pvArgs.sessionToken,
                    success: function(pvProductGroup){
                        var lvArgs = pvArgs;
                        lvChristmasBanner = null;
                        if(pvProductGroup.get('christmasBanner') !== null && typeof(pvProductGroup.get('christmasBanner')) !== 'undefined'){
                            lvChristmasBanner = pvProductGroup.get('christmasBanner').toString();
                        }
                        lvArgs.updatedRecord = {checkbox: pvProductGroup.id,
                                                productGroupName: pvProductGroup.get('productGroupName'),
                                                christmasBanner: {key: pvArgs.inputs.christmasBanner, value: pvArgs.inputs.christmasBanner}};
                        pvCallback(null,lvArgs);
                    },
                    error: log.parseErrorSave
                });
            },
            error: log.parseErrorGet
        });
    },

    updateRecommendation: function(pvArgs, pvCallback){

        var lvFunctionName = 'updateRecommendation';
        log.log(gvScriptName_model + '.' + lvFunctionName + ': Start', 'PROCS');
        log.log(gvScriptName_model + '.' + lvFunctionName + ': pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

        var Recommendation = Parse.Object.extend("Recommendation");
        var recommendationQuery = new Parse.Query(Recommendation);

        recommendationQuery.get(pvArgs.inputs.checkbox,{
            sessionToken: pvArgs.sessionToken,
            success: function(recommendation){
                // productGroup and SearchCategory can (either of them) be ''
                log.log(pvArgs.inputs.productGroup,'DEBUG');
                if(pvArgs.inputs.productGroup !== '') {
                    recommendation.set('productGroups',{__type: "Pointer",className: "ProductGroup", objectId: pvArgs.inputs.productGroup});
                }
                if(pvArgs.inputs.searchCategory !== '') {
                    recommendation.set('searchCategory',{__type: "Pointer",className: "SearchCategory", objectId: pvArgs.inputs.searchCategory});
                }
                recommendation.set('productName',pvArgs.inputs.productName);
                recommendation.set('pageConfirmationSearch',pvArgs.inputs.pageConfirmationSearch);
                recommendation.set('productURL',pvArgs.inputs.productURL);
                recommendation.set('ethicalBrand',{__type: "Pointer",className: "EthicalBrand", objectId: pvArgs.inputs.brand});
                if(pvArgs.savedFile !== null) {
                    recommendation.set('image',pvArgs.savedFile);
                }
                recommendation.save(null,{
                    sessionToken: pvArgs.sessionToken,
                    success: function(pvRecommendation){
                        // to return the data to the callback.
                        var lvArgs = {};

                        // productGroup and SearchCategory can (either of them) be null
                        var lvProductGroup = {key: null,
                                              value: null};
                        var lvSearchCategory = {key: null,
                                                value: null};
                        if(typeof pvRecommendation.get('productGroups') !== 'undefined') {
                            lvProductGroup = {key: pvRecommendation.get('productGroups').objectId,
                                              value: pvRecommendation.get('productGroup_sort')};
                        }
                        if(typeof pvRecommendation.get('searchCategory') !== 'undefined') {
                            lvSearchCategory = {key: pvRecommendation.get('searchCategory').objectId,
                                                value: pvRecommendation.get('searchCategory_sort')};
                        }

                        // The new record object must contain one property for each input value passed in, where the checkbox input value is the id
                        lvArgs.updatedRecord = {checkbox: pvRecommendation.id,
                                                productGroup: lvProductGroup,
                                                productName: pvRecommendation.get('productName'),
                                                pageConfirmationSearch: pvRecommendation.get('pageConfirmationSearch'),
                                                productURL: pvRecommendation.get('productURL'),
                                                brand: {key: pvRecommendation.get('ethicalBrand').objectId, value: pvRecommendation.get('brandName_sort')},
                                                searchCategory: lvSearchCategory,
                                                image: ''}; // no point returning this

                        pvCallback(null,lvArgs);
                    },
                    error: log.parseErrorSave
                });
            },
            error: log.parseErrorGet
        });
    },

    updateSearchCategory: function(pvArgs, pvCallback){

        var lvFunctionName = 'updateSearchCategory';
        log.log(gvScriptName_model + '.' + lvFunctionName + ': Start', 'PROCS');
        log.log(gvScriptName_model + '.' + lvFunctionName + ': pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

        var SearchCategory = Parse.Object.extend("SearchCategory");
        var searchCategoryQuery = new Parse.Query(SearchCategory);

        searchCategoryQuery.get(pvArgs.inputs.checkbox,{
            sessionToken: pvArgs.sessionToken,
            success: function(searchCategory){
                searchCategory.set('categoryName',pvArgs.inputs.categoryName);
                searchCategory.set('categoryShortName',pvArgs.inputs.categoryShortName);
                searchCategory.set('whyDoWeCare',pvArgs.inputs.whyDoWeCare);
                searchCategory.save(null,{
                    sessionToken: pvArgs.sessionToken,
                    success: function(pvSearchCategory){
                        var lvArgs = pvArgs;
                        lvArgs.updatedRecord = {checkbox: pvSearchCategory.id,
                                                categoryName: pvSearchCategory.get('categoryName'),
                                                categoryShortName: pvSearchCategory.get('categoryShortName'),
                                                whyDoWeCare: pvSearchCategory.get('whyDoWeCare')};
                        pvCallback(null,lvArgs);
                    },
                    error: log.parseErrorSave
                });
            },
            error: log.parseErrorGet
        });
    },

    updateSearchProduct: function(pvArgs, pvCallback){

        var lvFunctionName = 'updateSearchProduct';
        log.log(gvScriptName_model + '.' + lvFunctionName + ': Start', 'PROCS');
        log.log(gvScriptName_model + '.' + lvFunctionName + ': pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

        var SearchProduct = Parse.Object.extend("SearchProduct");
        var searchProductQuery = new Parse.Query(SearchProduct);

        searchProductQuery.get(pvArgs.inputs.checkbox,{
            sessionToken: pvArgs.sessionToken,
            success: function(searchProduct){
                console.log('xdkfsdhfjksd');
                searchProduct.set('searchCategories',{__type: "Pointer",className: "SearchCategory", objectId: pvArgs.inputs.searchCategorysearchCategory});
                searchProduct.set('productGroup',{__type: "Pointer",className: "ProductGroup", objectId: pvArgs.inputs.productGroup});
                searchProduct.set('productName',pvArgs.inputs.productName);
                searchProduct.set('brand',pvArgs.inputs.brand);
                searchProduct.set('andOr',pvArgs.inputs.andOr);
                searchProduct.set('searchTerm1',pvArgs.inputs.searchTerm1);
                searchProduct.set('searchTerm2',pvArgs.inputs.searchTerm2);
                searchProduct.set('searchTerm3',pvArgs.inputs.searchTerm3);
                searchProduct.set('searchTerm4',pvArgs.inputs.searchTerm4);
                searchProduct.set('searchTerm5',pvArgs.inputs.searchTerm5);
                searchProduct.set('searchTerm6',pvArgs.inputs.searchTerm6);
                searchProduct.set('searchTerm7',pvArgs.inputs.searchTerm7);
                searchProduct.set('sex',pvArgs.inputs.sex);
                searchProduct.set('negativeSearchTerm1',pvArgs.inputs.negativeSearchTerm1);
                searchProduct.set('negativeSearchTerm2',pvArgs.inputs.negativeSearchTerm2);
                searchProduct.set('negativeSearchTerm3',pvArgs.inputs.negativeSearchTerm3);
                searchProduct.set('negativeSearchTerm4',pvArgs.inputs.negativeSearchTerm4);
                searchProduct.set('negativeAndOr',pvArgs.inputs.negativeAndOr);

                searchProduct.save(null,{
                    sessionToken: pvArgs.sessionToken,
                    success: function(pvSearchProduct){
                        var lvArgs = pvArgs;
                        lvArgs.updatedRecord = {checkbox: pvSearchProduct.id,
                                                searchCategory: {key: pvSearchProduct.get('searchCategories').objectId, value: pvRecommendation.get('searchCategory_sort')},
                                                productGroup: {key: pvSearchProduct.get('productGroups').objectId, value: pvRecommendation.get('productGroup_sort')},
                                                productName: pvSearchProduct.get('productName'),
                                                brand: pvSearchProduct.get('brand'),
                                                andOr: pvSearchProduct.get('andOr'),
                                                searchTerm1: pvSearchProduct.get('searchTerm1'),
                                                searchTerm2: pvSearchProduct.get('searchTerm2'),
                                                searchTerm3: pvSearchProduct.get('searchTerm3'),
                                                searchTerm4: pvSearchProduct.get('searchTerm4'),
                                                searchTerm5: pvSearchProduct.get('searchTerm5'),
                                                searchTerm6: pvSearchProduct.get('searchTerm6'),
                                                searchTerm7: pvSearchProduct.get('searchTerm7'),
                                                sex: pvSearchProduct.get('sex'),
                                                negativeSearchTerm1: pvSearchProduct.get('negativeSearchTerm1'),
                                                negativeSearchTerm2: pvSearchProduct.get('negativeSearchTerm2'),
                                                negativeSearchTerm3: pvSearchProduct.get('negativeSearchTerm3'),
                                                negativeSearchTerm4: pvSearchProduct.get('negativeSearchTerm4'),
                                                negativeAndOr: pvSearchProduct.get('negativeAndOr')};

                        pvCallback(null,lvArgs);
                    },
                    error: log.parseErrorSave
                });
            },
            error: log.parseErrorGet
        });
    },

    updateWebsite: function(pvArgs, pvCallback){

        var lvFunctionName = 'updateWebsite';
        log.log(gvScriptName_model + '.' + lvFunctionName + ': Start', 'PROCS');
        log.log(gvScriptName_model + '.' + lvFunctionName + ': pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

        var Website = Parse.Object.extend("Website");
        var websiteQuery = new Parse.Query(Website);

        websiteQuery.get(pvArgs.inputs.checkbox,{
            sessionToken: pvArgs.sessionToken,
            success: function(website){
                website.set('websiteURL',pvArgs.inputs.websiteURL);
                website.set('isWebsiteOnOrOff',pvArgs.inputs.isWebsiteOnOrOff);
                website.save(null, {
                    sessionToken: pvArgs.sessionToken,
                    success: function(pvWebsite){
                        var lvArgs = pvArgs;
                        lvArgs.updatedRecord = {checkbox: pvWebsite.id,
                                                websiteURL: pvWebsite.get('websiteURL'),
                                                isWebsiteOnOrOff: {key: pvWebsite.get('isWebsiteOnOrOff'), value: pvWebsite.get('isWebsiteOnOrOff')}};
                        pvCallback(null,lvArgs);
                    },
                    error: log.parseErrorSave
                });
            },
            error: log.parseErrorGet
        });
    },

    /*******************************
     * DELETING DATA FROM DATABASE *
     *******************************/

    deleteCategoryWebsiteJoin: function(pvArgs, pvCallback){

        var lvFunctionName = 'deleteCategoryWebsiteJoin';
        log.log(gvScriptName_model + '.' + lvFunctionName + ': Start', 'PROCS');
        log.log(gvScriptName_model + '.' + lvFunctionName + ': pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');
        log.log(gvScriptName_model + '.' + lvFunctionName + ': pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

        // We've been ajaxed a normal object but we need an array for the query filter
        var lvArrayOfIds = [];
        for(var i in pvArgs.inputs){
            lvArrayOfIds.push(pvArgs.inputs[i]);
        }

        var CategoryWebsiteJoin = Parse.Object.extend('CategoryWebsiteJoin');
        var categoryWebsiteJoinQuery = new Parse.Query(CategoryWebsiteJoin);
        categoryWebsiteJoinQuery.containedIn('objectId',lvArrayOfIds);
        categoryWebsiteJoinQuery.find({
            sessionToken: pvArgs.sessionToken,
            success: function(pvCategoryWebsiteJoins){
                Parse.Object.destroyAll(pvCategoryWebsiteJoins,{
                    sessionToken: pvArgs.sessionToken,
                    success: function(){
                        var lvArgs = pvArgs;
                        pvCallback(null,lvArgs);
                    },
                    error: log.parseErrorDestroyAll
                });
            },
            error: log.parseErrorFind
        });
    },

    deleteEthicalBrands: function(pvArgs, pvCallback){

        var lvFunctionName = 'deleteEthicalBrands';
        log.log(gvScriptName_model + '.' + lvFunctionName + ': Start', 'PROCS');
        log.log(gvScriptName_model + '.' + lvFunctionName + ': pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

        // We've been ajaxed a normal object but we need an array for the query filter
        var lvArrayOfIds = [];
        for(var i in pvArgs.inputs){
            lvArrayOfIds.push(pvArgs.inputs[i]);
        }

        var EthicalBrand = Parse.Object.extend('EthicalBrand');
        var ethicalBrandQuery = new Parse.Query(EthicalBrand);
        ethicalBrandQuery.containedIn('objectId',lvArrayOfIds);
        ethicalBrandQuery.find({
            sessionToken: pvArgs.sessionToken,
            success: function(pvEthicalBrands){
                Parse.Object.destroyAll(pvEthicalBrands,{
                    sessionToken: pvArgs.sessionToken,
                    success: function(){
                        var lvArgs = pvArgs;
                        pvCallback(null,lvArgs);
                    },
                    error: log.parseErrorDestroyAll
                });
            },
            error: log.parseErrorFind
        });
    },

    deleteProductGroups: function(pvArgs, pvCallback){

        var lvFunctionName = 'deleteProductGroups';
        log.log(gvScriptName_model + '.' + lvFunctionName + ': Start', 'PROCS');
        log.log(gvScriptName_model + '.' + lvFunctionName + ': pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

        // We've been ajaxed a normal object but we need an array for the query filter
        var lvArrayOfIds = [];
        for(var i in pvArgs.inputs){
            lvArrayOfIds.push(pvArgs.inputs[i]);
        }
        var ProductGroup = Parse.Object.extend('ProductGroup');
        var productGroupQuery = new Parse.Query(ProductGroup);
        productGroupQuery.containedIn('objectId',lvArrayOfIds);
        productGroupQuery.find({
            sessionToken: pvArgs.sessionToken,
            success: function(pvProductGroups){
                Parse.Object.destroyAll(pvProductGroups,{
                    sessionToken: pvArgs.sessionToken,
                    success: function(){
                        var lvArgs = pvArgs;
                        pvCallback(null,lvArgs);
                    },
                    error: log.parseErrorDestroyAll
                });
            },
            error: log.parseErrorFind
        });
    },

    deleteRecommendations: function(pvArgs, pvCallback){

        var lvFunctionName = 'deleteRecommendations';
        log.log(gvScriptName_model + '.' + lvFunctionName + ': Start', 'PROCS');
        log.log(gvScriptName_model + '.' + lvFunctionName + ': pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

        // We've been ajaxed a normal object but we need an array for the query filter
        var lvArrayOfIds = [];
        for(var i in pvArgs.inputs){
            lvArrayOfIds.push(pvArgs.inputs[i]);
        }

        var Recommendation = Parse.Object.extend('Recommendation');
        var recommendationQuery = new Parse.Query(Recommendation);
        recommendationQuery.containedIn('objectId',lvArrayOfIds);
        recommendationQuery.find({
            sessionToken: pvArgs.sessionToken,
            success: function(pvRecommendations){
                Parse.Object.destroyAll(pvRecommendations,{
                    sessionToken: pvArgs.sessionToken,
                    success: function(){
                        var lvArgs = pvArgs;
                        pvCallback(null,lvArgs);
                    },
                    error: log.parseErrorDestroyAll
                });
            },
            error: log.parseErrorFind
        });
    },

    deleteSearchCategories: function(pvArgs, pvCallback){

        var lvFunctionName = 'deleteSearchCategories';
        log.log(gvScriptName_model + '.' + lvFunctionName + ': Start', 'PROCS');
        log.log(gvScriptName_model + '.' + lvFunctionName + ': pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

        // We've been ajaxed a normal object but we need an array for the query filter
        var lvArrayOfIds = [];
        for(var i in pvArgs.inputs){
            lvArrayOfIds.push(pvArgs.inputs[i]);
        }

        var SearchCategory = Parse.Object.extend('SearchCategory');
        var searchCategoryQuery = new Parse.Query(SearchCategory);
        searchCategoryQuery.containedIn('objectId',lvArrayOfIds);
        searchCategoryQuery.find({
            sessionToken: pvArgs.sessionToken,
            success: function(pvSearchCategorys){
                Parse.Object.destroyAll(pvSearchCategorys,{
                    sessionToken: pvArgs.sessionToken,
                    success: function(){
                        var lvArgs = pvArgs;
                        pvCallback(null,lvArgs);
                    },
                    error: log.parseErrorDestroyAll
                });
            },
            error: log.parseErrorFind
        });
    },

    deleteSearchProducts: function(pvArgs, pvCallback){

        var lvFunctionName = 'deleteSearchProducts';
        log.log(gvScriptName_model + '.' + lvFunctionName + ': Start', 'PROCS');
        log.log(gvScriptName_model + '.' + lvFunctionName + ': pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

        // We've been ajaxed a normal object but we need an array for the query filter
        var lvArrayOfIds = [];
        for(var i in pvArgs.inputs){
            lvArrayOfIds.push(pvArgs.inputs[i]);
        }

        var SearchProduct = Parse.Object.extend('SearchProduct');
        var searchProductQuery = new Parse.Query(SearchProduct);
        searchProductQuery.containedIn('objectId',lvArrayOfIds);
        searchProductQuery.find({
            sessionToken: pvArgs.sessionToken,
            success: function(pvSearchProducts){
                Parse.Object.destroyAll(pvSearchProducts,{
                    sessionToken: pvArgs.sessionToken,
                    success: function(){
                        var lvArgs = pvArgs;
                        pvCallback(null,lvArgs);
                    },
                    error: log.parseErrorDestroyAll
                });
            },
            error: log.parseErrorFind
        });
    },

    deleteWebsites: function(pvArgs, pvCallback){

        var lvFunctionName = 'deleteWebsites';
        log.log(gvScriptName_model + '.' + lvFunctionName + ': Start', 'PROCS');
        log.log(gvScriptName_model + '.' + lvFunctionName + ': pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

        // We've been ajaxed a normal object but we need an array for the query filter
        var lvArrayOfIds = [];
        for(var i in pvArgs.inputs){
            lvArrayOfIds.push(pvArgs.inputs[i]);
        }

        var Website = Parse.Object.extend('Website');
        var websiteQuery = new Parse.Query(Website);
        websiteQuery.containedIn('objectId',lvArrayOfIds);
        websiteQuery.find({
            sessionToken: pvArgs.sessionToken,
            success: function(pvWebsites){
                Parse.Object.destroyAll(pvWebsites,{
                    sessionToken: pvArgs.sessionToken,
                    success: function(){
                        var lvArgs = pvArgs;
                        pvCallback(null,lvArgs);
                    },
                    error: log.parseErrorDestroyAll
                });
            },
            error: log.parseErrorFind
        });
    },

    /*********************
     * Utility functions *
     *********************/

    saveFile: function(pvArgs, pvCallback){

        var lvFunctionName = 'saveFile';
        log.log(gvScriptName_model + '.' + lvFunctionName + ': Start', 'PROCS');
        //log.log(gvScriptName_model + '.' + lvFunctionName + ': pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

        var lvArgs = pvArgs;

        // inputs.image has the location of the file on the balu-console server (our middleware deals with this on form upload)
        // inputs.productName will be used to construct a meaningful filename
        if(pvArgs.inputs.image){
            var lvNewFileName = pvArgs.inputs.productName.replace('\'','') + '_image.jpg';
            var lvParseFile = new Parse.File(lvNewFileName,{base64: pvArgs.inputs.image});
            lvParseFile.save({
                success: function(pvParseFile){
                    log.log(gvScriptName_model + '.' + lvFunctionName + ': pvParseFile.url() == ' + pvParseFile.url(), 'DEBUG');
                    lvArgs.savedFile = pvParseFile;
                    pvCallback(null,lvArgs);
                },
                error: log.parseErrorSave
            });
        } else {
            // We never remove a file, only overwrite, so if there's no filename passed in, do nothing
            lvArgs.savedFile = null;
            pvCallback(null,lvArgs);
        }
    }
};

function lfAddCategoryWebsiteJoin(pvArgs, pvCallback){

    var lvFunctionName = 'lfAddCategoryWebsiteJoin';
    log.log(gvScriptName_model + '.' + lvFunctionName + ': Start', 'PROCS');
        log.log(gvScriptName_model + '.' + lvFunctionName + ': pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

    var lvIsWebsiteLevelRec = null;
    if(pvArgs.inputs.isWebsiteLevelRec === 'TRUE') {
        lvIsWebsiteLevelRec = true;
    } else if (pvArgs.inputs.isWebsiteLevelRec === 'FALSE') {
        lvIsWebsiteLevelRec = false;
    }
    var CategoryWebsiteJoin = Parse.Object.extend("CategoryWebsiteJoin");
    var categoryWebsiteJoin = new CategoryWebsiteJoin();
    categoryWebsiteJoin.set('searchCategory',{__type: "Pointer",className: "SearchCategory", objectId: pvArgs.inputs.searchCategory});
    categoryWebsiteJoin.set('website',{__type: "Pointer",className: "Website", objectId: pvArgs.inputs.website});
    categoryWebsiteJoin.set('departments',pvArgs.inputs.activeDepartments);
    categoryWebsiteJoin.set('isWebsiteLevelRec',lvIsWebsiteLevelRec);
    categoryWebsiteJoin.save(null, {
        sessionToken: pvArgs.sessionToken,
        success: function(pvCategoryWebsiteJoin){

            // to return the data to the callback.
            var lvArgs = pvArgs;

            // The new record object must contain one property for each input value passed in, where the checkbox input value is the id
            lvArgs.newRecord = {checkbox: pvCategoryWebsiteJoin.id,
                                searchCategory: {key: pvCategoryWebsiteJoin.get('searchCategory').objectId, value: pvCategoryWebsiteJoin.get('categoryName_sort')},
                                website: {key: pvCategoryWebsiteJoin.get('website').objectId, value: pvCategoryWebsiteJoin.get('websiteURL_sort')},
                                activeDepartments: pvCategoryWebsiteJoin.get('departments'),
                                isWebsiteLevelRec: {key: pvArgs.inputs.isWebsiteLevelRec, value: pvArgs.inputs.isWebsiteLevelRec}};

            pvCallback(null,lvArgs);
        },
        error: log.parseErrorSave
    });
}
