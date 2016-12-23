/**************************************************
 * Description:  Main script for node application *
 **************************************************/

/*
 * Load modules
 */

// Express Web Server
var express = require('express');
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var url = require('url');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
/*
 * Create Server
 */
var app = express();

/*
 * Load JS files
 */
var log = require('./log.js');
var handler = require('./handler.js');

/*
 * Global variables
 */

// Logging control
var gvScriptName = 'main';

/*
 * Initialise this script
 */
log.log(gvScriptName + '.' + 'initialise' + ': Start','INITS');

/*
 * Configure server middleware
 */

/* Session Handling */

if(typeof(process.env.REDISCLOUD_URL) !== 'undefined') {

    var redisUrl  = url.parse(process.env.REDISCLOUD_URL);
    var redisAuth = null;

    redisAuth = redisUrl.auth.split(':');
    app.use(cookieParser());
    app.use(session({
        store: new RedisStore({
            host: redisUrl.hostname,
            port: redisUrl.port,
            db: 2,
            pass: redisAuth[1]
        }),
        secret: process.env.SESSION_SECRET,
        resave: true,
        saveUninitialized:true,
        cookie: {secure: false}
    }));
} else {
    app.use(cookieParser());
    app.use(session({
        store: new RedisStore({
            host: 'localhost',
            port: 6379,
            db:   2
        }),
        secret: process.env.SESSION_SECRET || 'runninglocally',
        resave: true,
        saveUninitialized:true,
        cookie: {secure: false}
    }));
}

/* Body Parsing */

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(handler.processFormData); // custom middleware for processing AJAX form data
/* Logging */

app.use(function(req,res,next){
    // Don't execute for the js/css, otherwise it floods the log with gumph
    if(!req.path.includes('/js/') && !req.path.includes('/css/')){
        log.log('[' + req.method + '] ' + req.url,'ROUTE');
    }
    next();
});

/* Session Handling */

// For all screens, get the database URI
// For "internal" screens, check whether user is logged in and redirect to login screen if not
// To do: How do I avoid having one of these for each?! put all the routes into a router, and put router in as first param??

app.use('/login', handler.getDatabaseURI);
app.use('/logout', handler.getDatabaseURI);

app.use('/website-search-config', handler.checkUserSession);
app.use('/website-search-config', handler.getDatabaseURI);

app.use('/websites', handler.checkUserSession);
app.use('/websites', handler.getDatabaseURI);

app.use('/search-categories', handler.checkUserSession);
app.use('/search-categories', handler.getDatabaseURI);

app.use('/search-products', handler.checkUserSession);
app.use('/search-products', handler.getDatabaseURI);

app.use('/product-groups', handler.checkUserSession);
app.use('/product-groups', handler.getDatabaseURI);

app.use('/brands', handler.checkUserSession);
app.use('/brands', handler.getDatabaseURI);

app.use('/recommendations', handler.checkUserSession);
app.use('/recommendations', handler.getDatabaseURI);

app.use('/activity-dashboard', handler.checkUserSession);
app.use('/activity-dashboard', handler.getDatabaseURI);

app.use('/user-report', handler.checkUserSession);
app.use('/user-report', handler.getDatabaseURI);

app.use('/data-quality', handler.checkUserSession);
app.use('/data-quality', handler.getDatabaseURI);

app.use('/job-log', handler.checkUserSession);
app.use('/job-log', handler.getDatabaseURI);

app.use('/bts-dashboard', handler.checkUserSession);
app.use('/bts-dashboard', handler.getDatabaseURI);

/* Serve static files */

app.use(express.static(__dirname + '/public'));
app.use("/uploads", express.static(__dirname + '/uploads'));

/*
 * Server routes
 */

/* Log in */

// Login GET
app.get('/login', handler.loginGET);

// Login POST
app.post('/login', handler.loginPOST);

// LogOut GET
app.get('/logout', handler.logOutGET);

// LogOut POST
app.post('/logout', handler.logOutPOST);

/* Switch Balu Parse Server */
app.get('/switch-server', handler.switchServerGET);

/* Main Pages of Console */

app.get('/website-search-config', handler.websiteSearchConfigGET);
app.get('/websites', handler.websitesGET);
app.get('/search-categories', handler.searchCategoriesGET);
app.get('/search-products', handler.searchProductsGET);
app.get('/product-groups', handler.productGroupsGET);
app.get('/brands', handler.brandsGET);
app.get('/recommendations', handler.recommendationsGET);
app.get('/activity-dashboard', handler.activityDashboardGET);
app.get('/user-report', handler.userReportGET);
app.get('/data-quality', handler.dataQualityGET);
app.get('/job-log', handler.jobLogGET);
app.get('/bts-dashboard', handler.btsDashboardGET);

/* AJAX Requests */
// to do: make a router of these, and when done filter the processFormData middleware to it
app.post('/submit-category-website-join', handler.submitCategoryWebsiteJoinsPOST);
app.post('/submit-websites', handler.submitWebsitesPOST);
app.post('/submit-search-categories', handler.submitSearchCategoriesPOST);
app.post('/submit-search-products', handler.submitSearchProductsPOST);
app.post('/submit-product-groups', handler.submitProductGroupsPOST);
app.post('/submit-brands', handler.submitBrandsPOST);
app.post('/submit-recommendations', handler.submitRecommendationsPOST);

// No path specified
app.get('/', handler.rootGET);

/*
 * Fire it up!
 */
var lvPortNumber = process.env.PORT || 8080;
app.listen(lvPortNumber, function() {
    log.log(gvScriptName + '.' + 'initialise' + ': Express web server listening on port ' + lvPortNumber,' INFO');
});
