/*********************************************************
 * Description:   *
 *********************************************************/

/*
 * Load modules
 */
//var CacheManager = require('cache-manager')
//var Parse = require('parse/node');
var Promise = require('bluebird');

/*
 * Load JS files
 */
var log = require('./log.js');

/*
 * Global variables
 */

/* Logging control */
var gvScriptName = 'controller';

/*
 * Initialise the script
 */
(function initialise(){

    var lvFunctionName = 'initialise';
    log.log(gvScriptName_model + '.' + lvFunctionName + ': Start','INITS');

})();


module.exports = {

    buildActivityDashboard: function(pvArgs){

        var lvPageElements = {summaryData: {}};

        
    }
};
