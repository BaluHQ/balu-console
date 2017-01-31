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
app.use(handler.processFormData); // custom middleware for processing form data

/* Application-spectific Middleware */

// For all screens, set up the log object, get the database URI, and, for "internal" (secure) screens, check whether
// user is logged in. Redirect to login screen if not

// To do: How do I avoid having one of these for each?! put all the routes into a router, and put router in as first param??

app.use('/login', handler.setUpLogString);
app.use('/login', handler.getDatabaseURI);

app.use('/logout', handler.setUpLogString);
app.use('/logout', handler.getDatabaseURI);

app.use('/website-search-config', handler.setUpLogString);
app.use('/website-search-config', handler.checkUserSession);
app.use('/website-search-config', handler.getDatabaseURI);

app.use('/websites', handler.setUpLogString);
app.use('/websites', handler.checkUserSession);
app.use('/websites', handler.getDatabaseURI);

app.use('/search-categories', handler.setUpLogString);
app.use('/search-categories', handler.checkUserSession);
app.use('/search-categories', handler.getDatabaseURI);

app.use('/search-products', handler.setUpLogString);
app.use('/search-products', handler.checkUserSession);
app.use('/search-products', handler.getDatabaseURI);

app.use('/product-groups', handler.setUpLogString);
app.use('/product-groups', handler.checkUserSession);
app.use('/product-groups', handler.getDatabaseURI);

app.use('/brands', handler.setUpLogString);
app.use('/brands', handler.checkUserSession);
app.use('/brands', handler.getDatabaseURI);

app.use('/recommendations', handler.setUpLogString);
app.use('/recommendations', handler.checkUserSession);
app.use('/recommendations', handler.getDatabaseURI);

app.use('/activity-dashboard', handler.setUpLogString);
app.use('/activity-dashboard', handler.checkUserSession);
app.use('/activity-dashboard', handler.getDatabaseURI);

app.use('/user-report', handler.setUpLogString);
app.use('/user-report', handler.checkUserSession);
app.use('/user-report', handler.getDatabaseURI);

app.use('/data-quality', handler.setUpLogString);
app.use('/data-quality', handler.checkUserSession);
app.use('/data-quality', handler.getDatabaseURI);

app.use('/job-log', handler.setUpLogString);
app.use('/job-log', handler.checkUserSession);
app.use('/job-log', handler.getDatabaseURI);

app.use('/bts-dashboard', handler.setUpLogString);
app.use('/bts-dashboard', handler.checkUserSession);
app.use('/bts-dashboard', handler.getDatabaseURI);

/* Serve static files */

app.use(express.static(__dirname + '/public'));
app.use("/uploads", express.static(__dirname + '/uploads'));

/*
 * Server routes
 */

/* Log in */

app.get('/login', handler.loginGET);
app.post('/login', handler.loginPOST);
app.get('/logout', handler.logOutGET);
app.post('/logout', handler.logOutPOST);

/* Switch Balu Parse Server */

app.get('/switch-server', handler.switchServerGET);

/* GET: Main Pages of Console */

app.get('/website-search-config', handler.websiteSearchConfigGET);
app.get('/websites', handler.genericPageGET);
app.get('/search-categories', handler.genericPageGET);
app.get('/search-products', handler.genericPageGET);
app.get('/product-groups', handler.genericPageGET);
app.get('/brands', handler.genericPageGET);
app.get('/recommendations', handler.genericPageGET);
app.get('/activity-dashboard', handler.genericPageGET);
app.get('/user-report', handler.genericPageGET);
app.get('/data-quality', handler.genericPageGET);
app.get('/job-log', handler.genericPageGET);
app.get('/bts-dashboard', handler.genericPageGET);

// No path specified
app.get('/', handler.rootGET);

/* POST: Data retrieval end points */
app.post('/getData', handler.getDataPOST);

/* POST: Main form submissions of Console */

// to do: make a router of these, and when done filter the processFormData middleware to it
app.post('/submit-category-website-join', handler.submitCategoryWebsiteJoinsPOST);
app.post('/submit-websites', handler.submitWebsitesPOST);
app.post('/submit-search-categories', handler.submitSearchCategoriesPOST);
app.post('/submit-search-products', handler.submitSearchProductsPOST);
app.post('/submit-product-groups', handler.submitProductGroupsPOST);
app.post('/submit-brands', handler.submitBrandsPOST);
app.post('/submit-recommendations', handler.submitRecommendationsPOST);

/*
 * Fire it up!
 */
var lvPortNumber = process.env.PORT || 8080;
app.listen(lvPortNumber, function() {
    log.log(gvScriptName,'initialise','Express web server listening on port ' + lvPortNumber,' INFO');
});
