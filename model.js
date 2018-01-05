/*****************************************************
 * Description: Interface with the balu-parse-server *
 *****************************************************/

/*
 * Load modules
 */
var Promise = require('bluebird');
var Parse = require('parse/node');

/*
 * Load JS files
 */
var log = require('./log.js');

/*
 * Global variables
 */

/* Logging control */
var gvScriptName = 'model';

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
    log.log(gvScriptName,lvFunctionName,'Start','INITS');

    /*
     * Initialize Parse Server
     */
    Parse.initialize(gvAppId);
    Parse.serverURL = gvActiveParseServerURL;

    log.log(gvScriptName,lvFunctionName,'Initialised Balu Parse Server to ' + gvActiveParseServerURL,' INFO');

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
            log.log(gvScriptName,lvFunctionName,'Tried to set to an unknown server. pvSetTo == ' + pvSetTo,'ERROR');
        }
        return gvActiveParseServerURL;
    },

    /*********************************
     * RETRIEVING DATA FROM DATABASE *
     *********************************/

     getDataFromCloud: function(pvArgs,pvCallback){

         var lvLog = pvArgs.log || '';
         var lvFunctionName = 'getDataFromCloud[' + pvArgs.dataFunctionName + ']';
         lvLog += log.log(gvScriptName,lvFunctionName,'Start','PROCS');

         Parse.Cloud.run(pvArgs.dataFunctionName,pvArgs,{
             sessionToken: pvArgs.sessionToken,
             success: function(pvResponse){
                 pvResponse.log += log.log(gvScriptName,lvFunctionName,'balu-console has received data back from balu-parse-server','DEBUG');
                 var lvData = {
                    log: pvResponse.log,
                    data: pvResponse.data,
                    dataFunctionName: pvArgs.dataFunctionName
                 };
                 pvCallback(null,lvData);
             },
             error: function(pvError){
                 var lvError = JSON.parse(pvError.message);
                 log.log(lvError.log); // print the error from the balu-parse-server to the console
                 pvCallback(lvError.message,pvArgs); // send the user-friendly message back to the front end
             }
         });
     },

    /********************************
     * INSERTING DATA INTO DATABASE *
     ********************************/

    addCategoryWebsiteJoin: function(pvArgs, pvCallback){

        var lvFunctionName = 'addCategoryWebsiteJoin';
        log.log(gvScriptName,lvFunctionName,'Start', 'PROCS');
        log.log(gvScriptName,lvFunctionName,'pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

        lfAddCategoryWebsiteJoin(pvArgs,pvCallback);
    },

    addEthicalBrand: function(pvArgs, pvCallback){

        var lvFunctionName = 'addEthicalBrand';
        log.log(gvScriptName,lvFunctionName,'Start', 'PROCS');
        log.log(gvScriptName,lvFunctionName,'pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

        var lvBaluFavourite = null;
        if(pvArgs.inputs.baluFavourite === 'TRUE') {
            lvBaluFavourite = true;
        } else if (pvArgs.inputs.baluFavourite === 'FALSE') {
            lvBaluFavourite = false;
        }
        var lvIsArchived = null;
        if(pvArgs.inputs.isArchived === 'TRUE') {
            lvIsArchived = true;
        } else if (pvArgs.inputs.isArchived === 'FALSE') {
            lvIsArchived = false;
        }
        var EthicalBrand = Parse.Object.extend("EthicalBrand");
        var ethicalBrand = new EthicalBrand();
        ethicalBrand.set('brandName',pvArgs.inputs.brandName);
        ethicalBrand.set('homepage',pvArgs.inputs.homepage);
        ethicalBrand.set('twitterHandle',pvArgs.inputs.twitterHandle);
        ethicalBrand.set('brandSpiel',pvArgs.inputs.brandSpiel);
        ethicalBrand.set('baluFavourite',lvBaluFavourite);
        ethicalBrand.set('isArchived',lvIsArchived);
        ethicalBrand.save(null, {
            sessionToken: pvArgs.sessionToken,
            success: function(pvEthicalBrand){

                var lvArgs = pvArgs;
                var lvBaluFavourite = pvEthicalBrand.get('baluFavourite').toString();
                // The new record object must contain one property for each input value passed in, where the checkbox input value is the id
                lvArgs.newRecord = {checkbox: pvEthicalBrand.id,
                                    brandName: pvEthicalBrand.get('brandName'),
                                    homepage: pvEthicalBrand.get('homepage'),
                                    twitterHandle: pvEthicalBrand.get('twitterHandle'),
                                    brandSpiel: pvEthicalBrand.get('brandSpiel'),
                                    baluFavourite: pvArgs.inputs.baluFavourite,
                                    isArchived: pvArgs.inputs.isArchived};

                pvCallback(null,lvArgs);
            },
            error: log.parseErrorSave
        });
    },

    addProductGroup: function(pvArgs, pvCallback){

        var lvFunctionName = 'addProductGroup';
        log.log(gvScriptName,lvFunctionName,'Start', 'PROCS');
        log.log(gvScriptName,lvFunctionName,'pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

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

                var lvArgs = pvArgs;
                // The new record object must contain one property for each input value passed in, where the checkbox input value is the id
                lvChristmasBanner = '';
                if(pvProductGroup.get('christmasBanner') !== null && typeof(pvProductGroup.get('christmasBanner')) !== 'undefined'){
                    lvChristmasBanner = pvProductGroup.get('christmasBanner').toString();
                }
                lvArgs.newRecord = {checkbox: pvProductGroup.id,
                                    productGroupName: pvProductGroup.get('productGroupName'),
                                    christmasBanner: pvArgs.inputs.christmasBanner};

                pvCallback(null,lvArgs);

            },
            error: log.parseErrorSave
        });
    },

    addRecommendation: function(pvArgs, pvCallback){

        var lvFunctionName = 'addRecommendation';
        log.log(gvScriptName,lvFunctionName,'Start', 'PROCS');

        var Recommendation = Parse.Object.extend("Recommendation");
        var recommendation = new Recommendation();

        if(pvArgs.inputs.productGroup !== 'null' && pvArgs.inputs.productGroup !== '') {
            recommendation.set('productGroups',{__type: "Pointer",className: "ProductGroup", objectId: pvArgs.inputs.productGroup});
        }
        recommendation.set('productName',pvArgs.inputs.productName);
        recommendation.set('pageConfirmationSearch',pvArgs.inputs.pageConfirmationSearch);
        recommendation.set('productURL',pvArgs.inputs.productURL);
        recommendation.set('ethicalBrand',{__type: "Pointer",className: "EthicalBrand", objectId: pvArgs.inputs.brand});

        if(pvArgs.inputs.searchCategory !== 'null' && pvArgs.inputs.searchCategory !== '') {
            recommendation.set('searchCategory',{__type: "Pointer",className: "SearchCategory", objectId: pvArgs.inputs.searchCategory});
        }
        if(pvArgs.savedFile !== null) {
            recommendation.set('image',pvArgs.savedFile);
        }
        var lvIsArchived = null;
        if(pvArgs.inputs.isArchived === 'TRUE') {
            lvIsArchived = true;
        } else if (pvArgs.inputs.isArchived === 'FALSE') {
            lvIsArchived = false;
        }
        recommendation.set('isArchived',lvIsArchived);
        recommendation.save(null,{
            sessionToken: pvArgs.sessionToken,
            success: function(pvRecommendation){

                var lvArgs = {};
                var lvProductGroupId = null;
                var lvSearchCategoryId = null;
                if(pvRecommendation.get('productGroups')){
                    lvProductGroupId = pvRecommendation.get('productGroups').objectId;
                }
                if(pvRecommendation.get('searchCategory')){
                    lvSearchCategoryId = pvRecommendation.get('searchCategory').objectId;
                }
                lvArgs.newRecord = {checkbox: pvRecommendation.id,
                                    productGroup: lvProductGroupId,
                                    productName: pvRecommendation.get('productName'),
                                    pageConfirmationSearch: pvRecommendation.get('pageConfirmationSearch'),
                                    productURL: pvRecommendation.get('productURL'),
                                    brand: pvRecommendation.get('ethicalBrand').objectId,
                                    searchCategory: lvSearchCategoryId,
                                    image: '',  // no point in returning this
                                    isArchived: pvArgs.inputs.isArchived
                                };

                pvCallback(null,lvArgs);
            },
            error: log.parseErrorSave
        });
    },

    addSearchCategory: function(pvArgs, pvCallback){

        var lvFunctionName = 'addSearchCategory';
        log.log(gvScriptName,lvFunctionName,'Start', 'PROCS');
        log.log(gvScriptName,lvFunctionName,'pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

        var SearchCategory = Parse.Object.extend("SearchCategory");
        var searchCategory = new SearchCategory();
        searchCategory.set('categoryName',pvArgs.inputs.categoryName);
        searchCategory.set('categoryShortName',pvArgs.inputs.categoryShortName);
        searchCategory.set('whyDoWeCare',pvArgs.inputs.whyDoWeCare);
        searchCategory.save(null,{
            sessionToken: pvArgs.sessionToken,
            success: function(pvSearchCategory){

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
        log.log(gvScriptName,lvFunctionName,'Start', 'PROCS');
        log.log(gvScriptName,lvFunctionName,'pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

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

                var lvArgs = pvArgs;

                // The new record object must contain one property for each input value passed in, where the checkbox input value is the id
                lvArgs.newRecord = {checkbox: pvSearchProduct.id,
                                    searchCategory: pvSearchProduct.get('searchCategories').objectId,
                                    productGroup: pvSearchProduct.get('productGroups').objectId,
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
        log.log(gvScriptName,lvFunctionName,'Start', 'PROCS');
        log.log(gvScriptName,lvFunctionName,'pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

        var Website = Parse.Object.extend("Website");
        var website = new Website();
        website.set('websiteURL',pvArgs.inputs.websiteURL);
        website.set('isWebsiteOnOrOff',pvArgs.inputs.isWebsiteOnOrOff);
        website.save(null, {
            sessionToken: pvArgs.sessionToken,
            success: function(pvWebsite){

                var lvArgs = pvArgs;
                // to do: remove key/value pairs except where needed
                // The new record object must contain one property for each input value passed in, where the checkbox input value is the id
                lvArgs.newRecord = {checkbox: pvWebsite.id,
                                    websiteURL: pvWebsite.get('websiteURL'),
                                    isWebsiteOnOrOff: pvWebsite.get('isWebsiteOnOrOff')};

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
        log.log(gvScriptName,lvFunctionName,'Start', 'PROCS');
        log.log(gvScriptName,lvFunctionName,'pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

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
                                                searchCategory: pvCategoryWebsiteJoin.get('searchCategory').objectId,
                                                website: pvCategoryWebsiteJoin.get('website').objectId,
                                                activeDepartments: pvCategoryWebsiteJoin.get('departments'),
                                                isWebsiteLevelRec: pvArgs.inputs.isWebsiteLevelRec};
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
        log.log(gvScriptName,lvFunctionName,'Start', 'PROCS');
        log.log(gvScriptName,lvFunctionName,'pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

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
                var lvIsArchived = null;
                if(pvArgs.inputs.isArchived === 'TRUE') {
                    lvIsArchived = true;
                } else if (pvArgs.inputs.isArchived === 'FALSE') {
                    lvIsArchived = false;
                }
                ethicalBrand.set('brandName',pvArgs.inputs.brandName);
                ethicalBrand.set('homepage',pvArgs.inputs.homepage);
                ethicalBrand.set('twitterHandle',pvArgs.inputs.twitterHandle);
                ethicalBrand.set('brandSpiel',pvArgs.inputs.brandSpiel);
                ethicalBrand.set('baluFavourite',lvBaluFavourite);
                ethicalBrand.set('isArchived',lvIsArchived);
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
                                                baluFavourite: pvArgs.inputs.baluFavourite,
                                                isArchived: pvArgs.inputs.isArchived};
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
        log.log(gvScriptName,lvFunctionName,'Start', 'PROCS');
        log.log(gvScriptName,lvFunctionName,'pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

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
                                                christmasBanner: pvArgs.inputs.christmasBanner};
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
        log.log(gvScriptName,lvFunctionName,'Start', 'PROCS');

        var Recommendation = Parse.Object.extend("Recommendation");
        var recommendationQuery = new Parse.Query(Recommendation);

        recommendationQuery.get(pvArgs.inputs.checkbox,{
            sessionToken: pvArgs.sessionToken,
            success: function(recommendation){
                // productGroup and SearchCategory can (either of them) be ''
                if(pvArgs.inputs.productGroup !== '') {
                    recommendation.set('productGroups',{__type: "Pointer",className: "ProductGroup", objectId: pvArgs.inputs.productGroup});
                }
                if(pvArgs.inputs.searchCategory !== '') {
                    recommendation.set('searchCategory',{__type: "Pointer",className: "SearchCategory", objectId: pvArgs.inputs.searchCategory});
                }
                var lvIsArchived = null;
                if(pvArgs.inputs.isArchived === 'TRUE') {
                    lvIsArchived = true;
                } else if (pvArgs.inputs.isArchived === 'FALSE') {
                    lvIsArchived = false;
                }
                recommendation.set('productName',pvArgs.inputs.productName);
                recommendation.set('pageConfirmationSearch',pvArgs.inputs.pageConfirmationSearch);
                recommendation.set('productURL',pvArgs.inputs.productURL);
                recommendation.set('ethicalBrand',{__type: "Pointer",className: "EthicalBrand", objectId: pvArgs.inputs.brand});
                recommendation.set('isArchived',lvIsArchived);
                if(pvArgs.savedFile !== null) {
                    recommendation.set('image',pvArgs.savedFile);
                }
                recommendation.save(null,{
                    sessionToken: pvArgs.sessionToken,
                    success: function(pvRecommendation){

                        var lvArgs = {};

                        // The new record object must contain one property for each input value passed in, where the checkbox input value is the id

                        var lvProductGroupId = null;
                        var lvSearchCategoryId = null;
                        if(pvRecommendation.get('productGroups')){
                            lvProductGroupId = pvRecommendation.get('productGroups').objectId;
                        }
                        if(pvRecommendation.get('searchCategory')){
                            lvSearchCategoryId = pvRecommendation.get('searchCategory').objectId;
                        }

                        lvArgs.updatedRecord = {checkbox: pvRecommendation.id,
                                                productGroup: lvProductGroupId,
                                                productName: pvRecommendation.get('productName'),
                                                pageConfirmationSearch: pvRecommendation.get('pageConfirmationSearch'),
                                                productURL: pvRecommendation.get('productURL'),
                                                brand: pvRecommendation.get('ethicalBrand').objectId,
                                                searchCategory: lvSearchCategoryId,
                                                image: '',  // no point returning this
                                                isArchived: pvArgs.inputs.isArchived};
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
        log.log(gvScriptName,lvFunctionName,'Start', 'PROCS');
        log.log(gvScriptName,lvFunctionName,'pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

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
        log.log(gvScriptName,lvFunctionName,'Start', 'PROCS');
        log.log(gvScriptName,lvFunctionName,'pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

        var SearchProduct = Parse.Object.extend("SearchProduct");
        var searchProductQuery = new Parse.Query(SearchProduct);

        searchProductQuery.get(pvArgs.inputs.checkbox,{
            sessionToken: pvArgs.sessionToken,
            success: function(searchProduct){
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
                                                searchCategory: pvSearchProduct.get('searchCategories').objectId,
                                                productGroup: pvSearchProduct.get('productGroups').objectId,
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
        log.log(gvScriptName,lvFunctionName,'Start', 'PROCS');
        log.log(gvScriptName,lvFunctionName,'pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

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
                                                isWebsiteOnOrOff: pvWebsite.get('isWebsiteOnOrOff')};
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
        log.log(gvScriptName,lvFunctionName,'Start', 'PROCS');
        log.log(gvScriptName,lvFunctionName,'pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

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
        log.log(gvScriptName,lvFunctionName,'Start', 'PROCS');
        log.log(gvScriptName,lvFunctionName,'pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

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
        log.log(gvScriptName,lvFunctionName,'Start', 'PROCS');
        log.log(gvScriptName,lvFunctionName,'pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

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
        log.log(gvScriptName,lvFunctionName,'Start', 'PROCS');
        log.log(gvScriptName,lvFunctionName,'pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

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
        log.log(gvScriptName,lvFunctionName,'Start', 'PROCS');
        log.log(gvScriptName,lvFunctionName,'pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

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
        log.log(gvScriptName,lvFunctionName,'Start', 'PROCS');
        log.log(gvScriptName,lvFunctionName,'pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

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
        log.log(gvScriptName,lvFunctionName,'Start', 'PROCS');
        log.log(gvScriptName,lvFunctionName,'pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

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
        log.log(gvScriptName,lvFunctionName,'Start', 'PROCS');

        var lvArgs = pvArgs;

        // inputs.image has the location of the file on the balu-console server (our middleware deals with this on form upload)
        // inputs.productName will be used to construct a meaningful filename
        if(pvArgs.inputs.image){
            var lvNewFileName = pvArgs.inputs.productName.replace('\'','') + '_image.jpg';
            var lvParseFile = new Parse.File(lvNewFileName,{base64: pvArgs.inputs.image});
            lvParseFile.save({
                success: function(pvParseFile){
                    log.log(gvScriptName,lvFunctionName,'pvParseFile.url() == ' + pvParseFile.url(), 'DEBUG');
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

/*
 * split out into a local function so it can be referenced from two locations
 */
function lfAddCategoryWebsiteJoin(pvArgs, pvCallback){

    var lvFunctionName = 'lfAddCategoryWebsiteJoin';
    log.log(gvScriptName,lvFunctionName,'Start', 'PROCS');
        log.log(gvScriptName,lvFunctionName,'pvArgs => ' + JSON.stringify(pvArgs),'DEBUG');

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


            var lvArgs = pvArgs;

            // The new record object must contain one property for each input value passed in, where the checkbox input value is the id
            lvArgs.newRecord = {checkbox: pvCategoryWebsiteJoin.id,
                                searchCategory: pvCategoryWebsiteJoin.get('searchCategory').objectId,
                                website: pvCategoryWebsiteJoin.get('website').objectId,
                                activeDepartments: pvCategoryWebsiteJoin.get('departments'),
                                isWebsiteLevelRec: pvArgs.inputs.isWebsiteLevelRec};

            pvCallback(null,lvArgs);
        },
        error: log.parseErrorSave
    });
}
