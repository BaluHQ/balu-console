/*******************************************************
 * Description:  Handling functions for the web server *
 *******************************************************/

/*
 * Load modules
 */

// Parse, only needed to handle session authentication
var Parse = require('parse/node');

// To handle file uploads
var formidable = require('formidable'); // body-parser doesn't handle multi-part bodies in HTTP transactions, so we need formidable too (instead?)
var path = require('path');
var fs = require('fs');

// Other Tools
var promise = require('bluebird');

/*
 * Load JS files
 */
var log = require('./log.js');
var model = promise.promisifyAll(require('./model.js'));
var ui = promise.promisifyAll(require('./ui.js'));

/*
 * Global variables
 */
gvDatabaseURI = '';

/* Logging control */
var gvScriptName = 'handler';

/* Parse SDK config variables */
var gvActiveParseServerURL = model.getBaluParseServerURL();// 'https://balu-parse-server.herokuapp.com/parse'; //'http://localhost:1337/parse'; // localhost
log.setLoggingMode({parseServerURL: gvActiveParseServerURL}); // e.g. on the test server all logging is turned on
var gvAppId = 'mmhyD9DKGeOanjpRLHCR3bX8snue22oOd3NGfWKu';

/*
 * Initialise the script
 */
(function initialise(){

    var lvFunctionName = 'initialise';
    log.log(gvScriptName,lvFunctionName,'Start','INITS');

    /*
     * Initialize Parse Server
     */
    Parse.initialize(gvAppId);
    Parse.serverURL = gvActiveParseServerURL;

})();


module.exports = {

    /**************
     * Middleware *
     **************/

    /*
     * Set up our log string in req, so all other middleware can do a += on it.
     */
    setUpLogString: function(req,res,next){
        req.log = '';
        req.log += log.log(gvScriptName,'expressMiddleware','[' + req.method + '] ' + req.originalUrl,'ROUTE');
        next();
    },

    /*
     * Check whether the user is logged in and, if they're not, redirect them to the login screen
     */
    checkUserSession: function(req,res,next){
        // To do: I don't think this is checking for the PARSE user (which logs out every time you restart the app (because, I presume, you restart parse-server))
        var lvFunctionName = 'checkUserSession';
        req.log += log.log(gvScriptName,lvFunctionName,'Start','PROCS');
        // To do: how do I actually validate the session? Or is that done under the bonnet?
        if(req.session.loggedIn) {
            next();
        } else {
            log.log(gvScriptName,lvFunctionName,'[' + req.method + '] ' + req.url + ': user is not logged in, redirecting',' INFO');
            res.redirect('/login');
        }
    },

    /*
     * Get the URI of the database we're currently accessing (the balu-parse-server knows what this is)
     */
    getDatabaseURI: function(req,res,next){

        var lvFunctionName = 'getDatabaseURI';
        req.log += log.log(gvScriptName,lvFunctionName,'Start','PROCS');

        Parse.Cloud.run('getDatabaseURI',{},{
            sessionToken: req.session,
            success: function(pvResponse){
                gvDatabaseURI = pvResponse.databaseURI;
                next();
            }
        });
    },

    /*
     * Process the form data for AJAX requests
     */
    processFormData: function(req,res,next){

        var lvFunctionName = 'processFormData';
        //lvLog += log.log(gvScriptName,lvFunctionName,'Start','PROCS'); // this produces too many calls to leave in

        // The data comes through in a format I don't fully understand. But formidable.IncomingForm.on('field' / 'file',...) events
        // DO understand it. So we will use formidable to build up some normal JS objects, importantly lvArgs.inputs, which itself contains an
        // object for every input passed through in req
        var lvArgs = {inputs: {}};
        lvArgs.sessionToken = req.session.sessionToken;

        // create the incoming form object and set up the file reception config
        var lvForm = new formidable.IncomingForm();
        lvForm.mutiples = true;
        lvForm.uploadDir = path.join(__dirname,'/uploads');

        // And now the event handlers: one for fields, one for files
        lvForm.on('field', function(pvName,pvValue){
            // One input will always be the action (add,update,delete).
            // This isn't actually an input field, so we will siphon this
            // off at this point
            if(pvName === 'action'){
                lvArgs.action = pvValue;
            } else {
                lvArgs.inputs[pvName] = pvValue;
            }
        });
        lvForm.on('file', function(pvName,pvFile){

            // pvFile.path is the path and name of the file that's just been created on the balu-console server
            // pvFile.name is the original filename (which isn't automatically used when the file is saved to the server)
            req.log += log.log(gvScriptName,lvFunctionName,'pvFile.path | pvFile.name == ' + pvFile.path + ' | ' + pvFile.name,'DEBUG');

            var lvBitmap = fs.readFileSync(pvFile.path);

            // First attempt: move the file into our upload directory and pick it up again (to save to mLab) later
            //fs.rename(pvFile.path, path.join(lvForm.uploadDir, pvFile.name)); // move the file to our uploads folder
            //lvArgs.inputs[pvName] = path.join(lvForm.uploadDir, pvFile.name); // And save the path into our inputs, to be processed by our app backend later

            // Second attempt: get the base64 rep of the file and pass it straight through the JS to be saved to mLab in model.js
            var lvBase64 = new Buffer(lvBitmap).toString('base64');
            lvArgs.inputs[pvName] = lvBase64;
        });

        // And one for errors
        lvForm.on('error',function(err){
            req.log += log.log(gvScriptName,lvFunctionName,'' + err,'ERROR');
        });

        req.myForm = lvForm;
        req.args = lvArgs;

        next();

    },

    /************************************************************
     * HTTP Route Handlers: login / logout / no route specified *
     ************************************************************/

    loginGET: function(req,res,next){

        var lvLog = req.log;
        var lvFunctionName = 'loginGET';
        lvLog += log.log(gvScriptName,lvFunctionName,'Start','PROCS');

        if(req.session.loggedIn) {
            log.log(gvScriptName,lvFunctionName,'user already logged in, redirecting',' INFO');
            res.redirect('/logout');
        } else {
            res.render('login.ejs',{parseServerURL: gvActiveParseServerURL,
                                    databaseURI: gvDatabaseURI,
                                    log: lvLog,
                                    errorMessage: null});
        }
    },

    loginPOST: function(req,res,next){

        var lvLog = req.log;
        var lvFunctionName = 'loginPOST';
        lvLog += log.log(gvScriptName,lvFunctionName,'Start','PROCS');

        // Pass is require-d() in model.js, where we try to contain it for modularity.
        // But we need it needed briefly here too to log the user in
        Parse.User.logIn(req.body.email, req.body.password,{
            success: function(pvUser) {
                log.log(gvScriptName,lvFunctionName,'log in successful',' INFO');
                req.session.loggedIn = true;
                req.session.user = pvUser;
                req.session.username = pvUser.get('email');
                req.session.sessionToken = pvUser.getSessionToken();
                log.log(gvScriptName,lvFunctionName,'pvUser.getSessionToken() == ' + pvUser.getSessionToken(),' INFO');
                res.redirect('/website-search-config');
            },
            error: function(user,error) {
                log.log(gvScriptName,lvFunctionName,'login failed with error: ' + error.message,'ERROR');
                req.session.destroy();
                req.session.loggedIn = false;
                res.render('login.ejs',{parseServerURL: gvActiveParseServerURL,
                                        errorMessage: error.message});
            }
        });
    },

    logOutGET: function(req,res,next){

        var lvLog = req.log;
        var lvFunctionName = 'logOutGET';
        lvLog += log.log(gvScriptName,lvFunctionName,'Start','PROCS');

        if(req.session.loggedIn) {
            res.render('logout.ejs', {parseServerURL: gvActiveParseServerURL,
                                      databaseURI: gvDatabaseURI,
                                      log: lvLog,
                                      errorMessage: null});
        } else {
            log.log(gvScriptName,lvFunctionName,'user not logged in, redirecting',' INFO');
            res.redirect('/login');
        }
    },

    logOutPOST: function(req,res,next){

        var lvFunctionName = 'logOutPOST';
        log.log(gvScriptName,lvFunctionName,'Start','PROCS');

        // To do: don't I need to log out of Parse here (Parse.User.logOut() wasn't working - just hanging)
        req.session.destroy();
        res.redirect('/login');
    },

    rootGET: function(req,res,next){
        var lvFunctionName = 'rootGET';
        log.log(gvScriptName,lvFunctionName,'Start','PROCS');
        res.redirect('/login');
    },

    /**************************************
     * HTTP Route Handlers: switch server *
     **************************************/

    switchServerGET: function(req,res,next){
        var lvFunctionName = 'switchServerGET';
        log.log(gvScriptName,lvFunctionName,'Start','PROCS');

        // To do: these redirects are meant to hit the logout post method (so user is actually logged out, and redirected to login page)
        if(gvActiveParseServerURL.includes('balu-parse-server-test')){
            gvActiveParseServerURL = model.setBaluParseServerURL('PRD');
            res.redirect(307, '/logout');
        } else if (gvActiveParseServerURL.includes('balu-parse-server')){
            gvActiveParseServerURL = model.setBaluParseServerURL('TST');
            res.redirect(307, '/logout');
        }
    },
    /**********************************************
     * HTTP Route Handlers: main pages of console *
     **********************************************/

    websiteSearchConfigGET: function(req,res,next){

        var lvLog = req.log;
        var lvFunctionName = 'websiteSearchConfigGET';
        lvLog += log.log(gvScriptName,lvFunctionName,'Start','PROCS');
        // To be passed to each model function
        var lvSessionToken = req.session.sessionToken;

        var lvData = {parseServerURL: gvActiveParseServerURL, databaseURI: gvDatabaseURI, log: lvLog};
        // To do, ideally we'd load the website data separatley and ajax it in
        model.getCategoryWebsiteJoinsAsync({sessionToken: lvSessionToken})
        .then(function(pvArgs){
            lvData.categoryWebsiteJoins = pvArgs.data;
            lvData.log += pvArgs.log;
            return model.getWebsitesAsync({sessionToken: lvSessionToken});
        })
        .then(function(pvArgs){
            lvData.websites = pvArgs.data;
            lvData.testWebsiteURL = pvArgs.testWebsiteURL;
            lvData.log += pvArgs.log;
            return ui.constructWebsiteSearchConfigAsync(lvData);
        })
        .then(function(pvArgs){
            res.render('website-search-config.ejs',pvArgs.pageElements);
        });
    },

    websitesGET: function(req,res,next){

        var lvLog = req.log;
        var lvFunctionName = 'websitesGET';
        lvLog += log.log(gvScriptName,lvFunctionName,'Start','PROCS');

        // To be passed to each model function
        var lvSessionToken = req.session.sessionToken;

        var lvData = {parseServerURL: gvActiveParseServerURL, databaseURI: gvDatabaseURI, log: lvLog};

        model.getWebsitesAsync({sessionToken: lvSessionToken})
        .then(function(pvArgs){
            lvData.websites = pvArgs.data;
            lvData.log += pvArgs.log;
            return ui.constructWebsitesAsync(lvData);
        })
        .then(function(pvArgs){
            res.render('websites.ejs',pvArgs.pageElements);
        });
    },

    searchCategoriesGET: function(req,res,next){

        var lvLog = req.log;
        var lvFunctionName = 'searchCategoriesGET';
        lvLog += log.log(gvScriptName,lvFunctionName,'Start','PROCS');

        // To be passed to each model function
        var lvSessionToken = req.session.sessionToken;

        var lvData = {parseServerURL: gvActiveParseServerURL, databaseURI: gvDatabaseURI, log: lvLog};

        model.getSearchCategoriesAsync({sessionToken: lvSessionToken})
        .then(function(pvArgs){
            lvData.searchCategories = pvArgs.data;
            lvData.log += pvArgs.log;
            return ui.constructSearchCategoriesAsync(lvData);
        })
        .then(function(pvArgs){
            res.render('search-categories.ejs',pvArgs.pageElements);
        });
    },

    searchProductsGET: function(req,res,next){

        var lvLog = req.log;
        var lvFunctionName = 'searchProductsGET';
        lvLog += log.log(gvScriptName,lvFunctionName,'Start','PROCS');

        // To be passed to each model function
        var lvSessionToken = req.session.sessionToken;

        var lvData = {parseServerURL: gvActiveParseServerURL, databaseURI: gvDatabaseURI, log: lvLog};

        // To do, ideally we'd load the dropdown data separatley and ajax it in
        model.getSearchProductsAsync({sessionToken: lvSessionToken})
        .then(function(pvArgs){
            lvData.searchProducts = pvArgs.data;
            lvData.log += pvArgs.log;
            return model.getSearchCategoriesAsync(lvData);
        })
        .then(function(pvArgs){
            lvData.searchCategories = pvArgs.data;
            lvData.log += pvArgs.log;
            return model.getProductGroupsAsync(lvData);
        })
        .then(function(pvArgs){
            lvData.productGroups = pvArgs.data;
            lvData.log += pvArgs.log;
            return ui.constructSearchProductsAsync(lvData);
        })
        .then(function(pvArgs){
            res.render('search-products.ejs',pvArgs.pageElements);
        });
    },

    productGroupsGET: function(req,res,next){

        var lvLog = req.log;
        var lvFunctionName = 'productGroupsGET';
        lvLog += log.log(gvScriptName,lvFunctionName,'Start','PROCS');

        // To be passed to each model function
        var lvSessionToken = req.session.sessionToken;

        var lvData = {parseServerURL: gvActiveParseServerURL, databaseURI: gvDatabaseURI, log: lvLog};

        model.getProductGroupsAsync({sessionToken: lvSessionToken})
        .then(function(pvArgs){
            lvData.productGroups = pvArgs.data;
            lvData.log += pvArgs.log;
            return ui.constructProductGroupsAsync(lvData);
        })
        .then(function(pvArgs){
            res.render('product-groups.ejs',pvArgs.pageElements);
        });
    },

    brandsGET: function(req,res,next){

        var lvLog = req.log;
        var lvFunctionName = 'brandsGET';
        lvLog += log.log(gvScriptName,lvFunctionName,'Start','PROCS');

        // To be passed to each model function
        var lvSessionToken = req.session.sessionToken;

        var lvData = {parseServerURL: gvActiveParseServerURL, databaseURI: gvDatabaseURI, log: lvLog};

        model.getEthicalBrandsAsync({sessionToken: lvSessionToken})
        .then(function(pvArgs){
            lvData.brands = pvArgs.data;
            lvData.log += pvArgs.log;
            return ui.constructBrandsAsync(lvData);
        })
        .then(function(pvArgs){
            res.render('brands.ejs',pvArgs.pageElements);
        });
    },

    recommendationsGET: function(req,res,next){

        var lvLog = req.log;
        var lvFunctionName = 'recommendationsGET';
        lvLog += log.log(gvScriptName,lvFunctionName,'Start','PROCS');

        // To be passed to each model function
        var lvSessionToken = req.session.sessionToken;

        var lvData = {parseServerURL: gvActiveParseServerURL, databaseURI: gvDatabaseURI, log: lvLog};

        // To do, ideally we'd load the dropdown data separatley and ajax it in
        model.getRecommendationsAsync({sessionToken: lvSessionToken})
        .then(function(pvArgs){
            lvData.recommendations = pvArgs.data;
            lvData.log += pvArgs.log;
            return model.getProductGroupsAsync(lvData);
        })
        .then(function(pvArgs){
            lvData.productGroups = pvArgs.data;
            lvData.log += pvArgs.log;
            return model.getEthicalBrandsAsync(lvData);
        })
        .then(function(pvArgs){
            lvData.brands = pvArgs.data;
            lvData.log += pvArgs.log;
            return model.getSearchCategoriesAsync(lvData);
        })
        .then(function(pvArgs){
            lvData.searchCategories = pvArgs.data;
            lvData.log += pvArgs.log;
            return ui.constructRecommendationsAsync(lvData);
        })
        .then(function(pvArgs){
            res.render('recommendations.ejs',pvArgs.pageElements);
        });
    },

    activityDashboardGET: function(req,res,next){

        var lvLog = req.log;
        var lvFunctionName = 'activityDashboardGET';
        lvLog += log.log(gvScriptName,lvFunctionName,'Start','PROCS');

        // To be passed to each model function
        var lvSessionToken = req.session.sessionToken;

        // Set up an object to store all the data elements in, as we work our way through the numers DB queries
        var lvData = {parseServerURL: gvActiveParseServerURL,
                      databaseURI: gvDatabaseURI,
                      summaryData: {},
                      log: lvLog}; // To do: ideally each query will push to the page as soon as it's finished, using AJAX, but I don't know how to do this yet!

        model.getUsersAsync({sessionToken: lvSessionToken,
                             user_systemUsers: 'EXCLUDE'})
        .then(function(pvArgs){
            lvData.summaryData.numberOfUsers = pvArgs.rowCount;
            lvData.users = pvArgs.data;
            lvData.log += pvArgs.log;
            return model.getUserLogs_RecClickThroughAsync({sessionToken: lvSessionToken});
        })
        .then(function(pvArgs){
            lvData.summaryData.numberOfuserLogRecClickThroughs = pvArgs.rowCount;
            lvData.userLogRecClickThroughs = pvArgs.data;
            lvData.log += pvArgs.log;
            return model.getUserLogs_RecommendationsAsync({sessionToken: lvSessionToken});
        })
        .then(function(pvArgs){
            lvData.summaryData.numberOfUserLogRecommendations = pvArgs.rowCount;
            lvData.userLogRecommendations = pvArgs.data;
            lvData.log += pvArgs.log;
            return model.getUserLogs_ManualSearchAsync({sessionToken: lvSessionToken, userLogManualSearch_noResults: 'BOTH'});
        })
        .then(function(pvArgs){
            lvData.summaryData.numberOfUserLogManualSearches = pvArgs.rowCount;
            lvData.userLogManualSearches = pvArgs.data;
            lvData.log += pvArgs.log;
            return model.getUserSubmittedRecsAsync({sessionToken: lvSessionToken, userSubmittedRec_processed: 'EXCLUDE'});
        })
        .then(function(pvArgs){
            lvData.summaryData.numberOfUserSubmittedRecs_notProcessed = pvArgs.rowCount;
            lvData.userSubmittedRecs_notProcessed = pvArgs.data;
            lvData.log += pvArgs.log;
            return model.getUserSubmittedWebsiteRecsAsync({sessionToken: lvSessionToken, userSubmittedWebsiteRec_processed: 'EXCLUDE'});
        })
        .then(function(pvArgs){
            lvData.summaryData.numberofUserSubmittedWebsites_notProcessed = pvArgs.rowCount;
            lvData.userSubmittedWebsiteRecs_notProcessed = pvArgs.data;
            lvData.log += pvArgs.log;
            return model.getUserLogs_TrackedTabErrorAsync({sessionToken: lvSessionToken, userLogTrackedTabError_processed: 'EXCLUDE'});
        })
        .then(function(pvArgs){
            lvData.summaryData.numberOfuserLogTrackedTabErrors_notProcessed = pvArgs.rowCount;
            lvData.userLogTrackedTabErrors_notProcessed = pvArgs.data;
            lvData.log += pvArgs.log;
            return model.getUserLogs_ManualSearchAsync({sessionToken: lvSessionToken, userLogManualSearch_noResults: 'ONLY'});
        })
        .then(function(pvArgs){
            lvData.summaryData.numberOfUserLogManualSearches_noResult = pvArgs.rowCount;
            lvData.userLogManualSearches_noResult = pvArgs.data;
            lvData.log += pvArgs.log;
            return model.getUserLogsAsync({sessionToken: lvSessionToken, userLog_eventNames: ['OPTIONS: BALU_TURNED_ON','OPTIONS: BALU_TURNED_OFF']});
        })
        .then(function(pvArgs){
            lvData.summaryData.numberOfUserLogs_onOff = pvArgs.rowCount;
            lvData.userLogs_onOff = pvArgs.data;
            lvData.log += pvArgs.log;
            return model.getUserLogsAsync({sessionToken: lvSessionToken, userLog_eventNames: ['OPTIONS: BALU_SET_TO_SHOW','OPTIONS: BALU_SET_TO_HIDE']});
        })
        .then(function(pvArgs){
            lvData.summaryData.numberOfUserLogs_showHide = pvArgs.rowCount;
            lvData.userLogs_showHide = pvArgs.data;
            lvData.log += pvArgs.log;
            return model.getUserLogsAsync({sessionToken: lvSessionToken, userLog_eventNames: ['HIDE_SIDEBAR_REFRESH','HIDE_SIDEBAR_RESTART']});
        })
        .then(function(pvArgs){
            lvData.summaryData.numberOfUserLogs_hideUntilRefreshRestart = pvArgs.rowCount;
            lvData.userLogs_hideUntilRefreshRestart = pvArgs.data;
            lvData.log += pvArgs.log;
            return model.getUserLogs_blockBrandAsync({sessionToken: lvSessionToken});
        })
        .then(function(pvArgs){
            lvData.summaryData.numberOfUserLogBlockedBrands = pvArgs.rowCount;
            lvData.userLogBlockedBrands = pvArgs.data;
            lvData.log += pvArgs.log;
            return ui.constructActivityDashboardAsync(lvData);
        })
        .then(function(pvArgs){
            res.render('activity-dashboard.ejs',pvArgs.pageElements);
        });
    },

    userReportGET: function(req,res,next){

        var lvLog = req.log;
        var lvFunctionName = 'userReportGET';
        lvLog += log.log(gvScriptName,lvFunctionName,'Start','PROCS');

        // To be passed to each model function
        var lvSessionToken = req.session.sessionToken;

        var lvData = {parseServerURL: gvActiveParseServerURL, databaseURI: gvDatabaseURI, log: lvLog};

        model.getUsersAsync({sessionToken: lvSessionToken,
                             user_systemUsers: 'EXCLUDE'})
        .then(function(pvArgs){
            lvData.users = pvArgs.data;
            lvData.log += pvArgs.log;
            return ui.constructUserReportAsync(lvData);
        })
        .then(function(pvArgs){
            res.render('user-report.ejs',pvArgs.pageElements);
        }).catch(function(pvError){
            // to do: need to handle errors on the front-end
        });
    },

    dataQualityGET: function(req,res,next){

        var lvLog = req.log;
        var lvFunctionName = 'dataQualityGET';
        lvLog += log.log(gvScriptName,lvFunctionName,'Start','PROCS');

        // To be passed to each model function
        var lvSessionToken = req.session.sessionToken;

        var lvData = {parseServerURL: gvActiveParseServerURL, databaseURI: gvDatabaseURI, log: lvLog};

        res.render('data-quality.ejs',lvData);
    },

    jobLogGET: function(req,res,next){

        var lvLog = req.log;
        var lvFunctionName = 'jobLogGET';
        lvLog += log.log(gvScriptName,lvFunctionName,'Start','PROCS');

        // To be passed to each model function
        var lvSessionToken = req.session.sessionToken;

        var lvData = {parseServerURL: gvActiveParseServerURL, databaseURI: gvDatabaseURI, log: lvLog};

        res.render('job-log.ejs',lvData);
    },

    btsDashboardGET: function(req,res,next){

        var lvLog = req.log;
        var lvFunctionName = 'btsDashboardGET';
        lvLog += log.log(gvScriptName,lvFunctionName,'Start','PROCS');

        // To be passed to each model function
        var lvSessionToken = req.session.sessionToken;

        var lvData = {parseServerURL: gvActiveParseServerURL, databaseURI: gvDatabaseURI, log: lvLog};

        res.render('bts-dashboard.ejs',lvData);
    },

    /***********************
     * POST Route Handlers *
     ***********************/

    submitCategoryWebsiteJoinsPOST: function(req,res,next){

        var lvLog = req.log;
        var lvFunctionName = 'submitCategoryWebsiteJoinsPOST';
        lvLog += log.log(gvScriptName,lvFunctionName,'Start','PROCS');

         req.myForm.on('end', function(){
             var lvArgs = req.args;

             switch(lvArgs.action) {
                 case 'add':
                     model.addCategoryWebsiteJoinAsync(lvArgs)
                     .then(function(pvArgs){
                         res.send(pvArgs);
                     });
                    break;
                case 'update':
                    model.updateCategoryWebsiteJoinAsync(lvArgs)
                    .then(function(pvArgs){
                        res.send(pvArgs);
                    });
                    break;
                case 'delete':
                    model.deleteCategoryWebsiteJoinAsync(lvArgs)
                    .then(function(pvArgs){
                        res.send(pvArgs);
                    });
                    break;
                default:
                    log.log(gvScriptName,lvFunctionName,'ERROR, handler received an action that wasn\'t recognised (Expected add, update or delete; got ' + lvArgs.action + ')','ERROR');
            }
        });
        req.myForm.parse(req);
    },

    submitWebsitesPOST: function(req,res,next){

        var lvLog = req.log;
        var lvFunctionName = 'submitWebsitesPOST';
        lvLog += log.log(gvScriptName,lvFunctionName,'Start','PROCS');

        req.myForm.on('end', function(){
            var lvArgs = req.args;

            switch(lvArgs.action) {
                case 'add':
                    model.addWebsiteAsync(lvArgs)
                    .then(function(pvArgs){
                        res.send(pvArgs);
                    });
                    break;
                 case 'update':
                    model.updateWebsiteAsync(lvArgs)
                    .then(function(pvArgs){
                        res.send(pvArgs);
                    });
                    break;
                case 'delete':
                    model.deleteWebsitesAsync(lvArgs)
                    .then(function(pvArgs){
                        res.send(pvArgs);
                    });
                    break;
                default:
                    log.log(gvScriptName,lvFunctionName,'ERROR, handler received an action that wasn\'t recognised (Expected add, update or delete; got ' + lvArgs.action + ')','ERROR');
             }
         });
         req.myForm.parse(req);
    },

    submitSearchCategoriesPOST: function(req,res,next){

        var lvLog = req.log;
        var lvFunctionName = 'submitSearchCategoryPOST';
        lvLog += log.log(gvScriptName,lvFunctionName,'Start','PROCS');

        req.myForm.on('end', function(){
            var lvArgs = req.args;

            switch(lvArgs.action) {
                case 'add':
                    model.addSearchCategoryAsync(lvArgs)
                    .then(function(pvArgs){
                        res.send(pvArgs);
                    });
                    break;
                case 'update':
                    model.updateSearchCategoryAsync(lvArgs)
                    .then(function(pvArgs){
                        res.send(pvArgs);
                    });
                    break;
                case 'delete':
                    model.deleteSearchCategoriesAsync(lvArgs)
                    .then(function(pvArgs){
                        res.send(pvArgs);
                    });
                    break;
                default:
                    log.log(gvScriptName,lvFunctionName,'ERROR, handler received an action that wasn\'t recognised (Expected add, update or delete; got ' + lvArgs.action + ')','ERROR');
            }
        });
        req.myForm.parse(req);
    },

    submitSearchProductsPOST: function(req,res,next){

        var lvLog = req.log;
        var lvFunctionName = 'submitSearchProductsPOST';
        lvLog += log.log(gvScriptName,lvFunctionName,'Start','PROCS');

        req.myForm.on('end', function(){
            var lvArgs = req.args;

            switch(lvArgs.action) {
                case 'add':
                    model.addSearchProductAsync(lvArgs)
                    .then(function(pvArgs){
                        res.send(pvArgs);
                    });
                    break;
                case 'update':
                    model.updateSearchProductAsync(lvArgs)
                    .then(function(pvArgs){
                        res.send(pvArgs);
                    });
                    break;
                case 'delete':
                    model.deleteSearchProductsAsync(lvArgs)
                    .then(function(pvArgs){
                        res.send(pvArgs);
                    });
                    break;
                default:
                    log.log(gvScriptName,lvFunctionName,'ERROR, handler received an action that wasn\'t recognised (Expected add, update or delete; got ' + lvArgs.action + ')','ERROR');
            }
        });
        req.myForm.parse(req);
    },

    submitProductGroupsPOST: function(req,res,next){

        var lvLog = req.log;
        var lvFunctionName = 'submitProductGroupsPOST';
        lvLog += log.log(gvScriptName,lvFunctionName,'Start','PROCS');

        req.myForm.on('end', function(){
            var lvArgs = req.args;

            switch(lvArgs.action) {
                case 'add':
                    model.addProductGroupAsync(lvArgs)
                    .then(function(pvArgs){
                        res.send(pvArgs);
                    });
                    break;
                case 'update':
                    model.updateProductGroupAsync(lvArgs)
                    .then(function(pvArgs){
                        res.send(pvArgs);
                    });
                    break;
                    case 'delete':
                        model.deleteProductGroupsAsync(lvArgs)
                        .then(function(pvArgs){
                            res.send(pvArgs);
                        });
                    break;
                default:
                    log.log(gvScriptName,lvFunctionName,'ERROR, handler received an action that wasn\'t recognised (Expected add, update or delete; got ' + lvArgs.action + ')','ERROR');
            }
        });
        req.myForm.parse(req);
    },

    submitBrandsPOST: function(req,res,next){

        var lvLog = req.log;
        var lvFunctionName = 'submitBrandsPOST';
        lvLog += log.log(gvScriptName,lvFunctionName,'Start','PROCS');

        req.myForm.on('end', function(){
            var lvArgs = req.args;

            switch(lvArgs.action) {
                case 'add':
                    model.addEthicalBrandAsync(lvArgs)
                    .then(function(pvArgs){
                        res.send(pvArgs);
                    });
                    break;
                case 'update':
                    model.updateEthicalBrandAsync(lvArgs)
                    .then(function(pvArgs){
                        res.send(pvArgs);
                    });
                    break;
                case 'delete':
                    model.deleteEthicalBrandsAsync(lvArgs)
                    .then(function(pvArgs){
                        res.send(pvArgs);
                    });
                    break;
                default:
                    log.log(gvScriptName,lvFunctionName,'ERROR, handler received an action that wasn\'t recognised (Expected add, update or delete; got ' + lvArgs.action + ')','ERROR');
            }
        });
        req.myForm.parse(req);
    },

    submitRecommendationsPOST: function(req,res,next){

        var lvLog = req.log;
        var lvFunctionName = 'submitRecommendationsPOST';
        lvLog += log.log(gvScriptName,lvFunctionName,'Start','PROCS');

        req.myForm.on('end', function(){
            var lvArgs = req.args;

            if(lvArgs.action === 'add') {
                model.saveFileAsync(lvArgs)
                .then(function(pvArgs){
                    lvArgs.imageObjectId = pvArgs.fileObjectId;
                    return model.addRecommendationAsync(lvArgs);
                })
                .then(function(pvArgs){
                    lvArgs.newRecord = pvArgs.newRecord;
                    res.send(lvArgs);
                });
            } else if(lvArgs.action === 'update') {
                model.saveFileAsync(lvArgs)
                .then(function(pvArgs){
                    lvArgs.imageObjectId = pvArgs.fileObjectId;
                    return model.updateRecommendationAsync(lvArgs);
                })
                .then(function(pvArgs){
                    lvArgs.updatedRecord = pvArgs.updatedRecord;
                    res.send(lvArgs);
                });
            } else if (lvArgs.action === 'delete') {
                model.deleteRecommendationsAsync(lvArgs)
                .then(function(pvArgs){
                    res.send(pvArgs);
                });
            } else {
                log.log(gvScriptName,lvFunctionName,'ERROR, handler received an action that wasn\'t recognised (Expected add, update or delete; got ' + lvArgs.action + ')','ERROR');
            }
        });
        req.myForm.parse(req);
    }
};
