/***************************************
 * Description:  Client side javscript *
 ***************************************/

/*
* Global variables
*/

/* Details about the page we're on */
var gvPageName = ''; // This is the end of the URL, matches endpoints in main.js
var gvDataFunctionName = ''; // Determine which data function in the back end we want to call
var gvPageTitle = ''; // The title displayed on the front-end
var gvEndPoint = ''; // the end point for update and delete calls

/* Drop down list options */

// we store these globally so we can whack them on when fields are made editable, rather
// than doing the whole table on load
var gvSearchCategoryDropDownListOptions;
var gvProductGroupDropDownListOptions;
var gvBrandDropDownListOptions;

/* Logging control */
var gvScriptName_main = 'mainCS';

/*
 * Initialise the script
 */
(function initialise(){

    gvPageName = setGlobalVariables();

    var lvLog = '';
    var lvFunctionName = 'initialise[' + gvPageName + ']';
    lvLog += log(gvScriptName_main,lvFunctionName,'Start','INITS');

    // Do everything when the DOM is ready
    $(document).ready(function(){

        // Set the page title and delete button end point
        $('#pageTitle').html(gvPageTitle);
        $('#deleteButton').attr('data-endpoint',gvEndPoint);

        // Get the data from the back-end and call the appropriate HTML-rendering funcs
        getCoreDataSet({log: lvLog},function(pvArgs) {

            /* Render HTML */

            // Create the filter row for the table
            $('#table_filter_body').append($(renderFilterRow({data: pvArgs.data})));
            // Create the header row for the table
            $('#table_data_body').append($(renderHeaderRow({data: pvArgs.data})));
            // Create the addNew form for the table
            $('#table_data_body').append($(renderAddNewRow({data: pvArgs.data})));
            // Create the data rows for the table
            $('#table_data_body').append($(renderDataTable({data: pvArgs.data})));
            // Populate the dropdown lists
            populateDropDownLists({}); // fetches data and then appends

            /* Initialise Scripts */

            if(gvPageName === 'website-search-config') {
                $(document).foundation('accordion','reflow');
            }

            /*
             * Add listeners across the entire page
             */

            /* Form submission: button click listener and form submission */

            // This is neat: when the button is clicked, save a var of that button to pass
            // to through to the form submission listener immediately afterwards
            // (because there can be multiple sub forms, with a button each, per form)
            var lvButtonClicked = null;

            // Get all of the mainForms, which will each contain add, update and delete sub forms (each with their own submit buttons)
            var $lvForms = $('form[name="mainForm"]');

            // Extract all the submit buttons and give them all an onclick listener that
            // assigns the clicked button object to lvButtonClicked (to be used immediately
            // afterwards by the submit listener). Use .on() because we need it to delegate
            // the onclick to any new rows inserted later
            $lvForms.on('click', 'input[type="submit"]',function(event) {
                lvButtonClicked = this;
                buttonClick_listener(lvButtonClicked);
            });

            // Assign the submit listener to the forms, taking the button that was clicked as a parameter
            $(document.body).on('submit', 'form', function(pvEvent){
                pvEvent.preventDefault(); // It's all AJAXed, so prevent form submission (in case there's an error before the 'return false' statement)
                formSubmit_listener(lvButtonClicked);
                lvButtonClicked.disabled = true;
            });

            /* <td> listeners to toggl inline editing on and off */

            $(document.body).on('click','[data-inline-edit="true"]',togglRowEditable_listener);

            /* Filter field listeners */

            $('tr#row_filter > td').change(filterTable_listener);

            /*
             * Append logs to screen
             */
            $('#preLog').append(pvArgs.log);
        });

    },false); // End of document.ready listener function

})();

function setGlobalVariables(){

    var lvPageName = window.location.href.split('/').pop();

    switch (lvPageName) {
        case 'website-search-config':
            gvDataFunctionName = 'getCategoryWebsiteJoins';
            gvPageTitle = 'Website Search Config';
            gvEndPoint = '/submit-category-website-join';
            break;
        case 'websites':
            gvDataFunctionName = 'getWebsites';
            gvPageTitle = 'Websites';
            gvEndPoint = '/submit-websites';
            break;
        case 'search-categories':
            gvDataFunctionName = 'getSearchCategories';
            gvPageTitle = 'Search Categories';
            gvEndPoint = '/submit-search-categories';
            break;
        case 'search-products':
            gvDataFunctionName = 'getSearchProducts';
            gvPageTitle = 'Search Products';
            gvEndPoint = '/submit-search-products';
            break;
        case 'product-groups':
            gvDataFunctionName = 'getProductGroups';
            gvPageTitle = 'Product Groups';
            gvEndPoint = '/submit-product-groups';
            break;
        case 'brands':
            gvDataFunctionName = 'getEthicalBrands';
            gvPageTitle = 'Brands';
            gvEndPoint = '/submit-brands';
            break;
        case 'recommendations':
            gvDataFunctionName = 'getRecommendations';
            gvPageTitle = 'Recommendations';
            gvEndPoint = '/submit-recommendations';
            break;
        case 'user-report':
            gvDataFunctionName = 'getUsers';
            gvPageTitle = 'User Report';
            gvEndPoint = '';
            break;
        case 'activity-dashboard':
            gvDataFunctionName = 'getActivityDashboardData'; // to do
            gvPageTitle = 'Activity Dashboard';
            gvEndPoint = '';
            break;
        case 'data-quality':
            gvDataFunctionName = ''; // to do
            gvPageTitle = 'Data Quality';
            gvEndPoint = '';
            break;
        case 'job-log':
            gvDataFunctionName = 'getJobLogs';
            gvPageTitle = 'Job Log';
            gvEndPoint = '';
            break;
        case 'bts-dashboard':
            gvDataFunctionName = ''; // to do
            gvPageTitle = 'BTS Dashboard';
            gvEndPoint = '';
            break;
        default:
            // do nothing
    }
    return lvPageName;
}

/****************************
 * Data Retrieval Functions *
 ****************************/

function getCoreDataSet(pvArgs,pvCallback){

    var lvLog = pvArgs.log;
    var lvFunctionName = 'getCoreDataSet[' + gvPageName + ']';
    lvLog += log(gvScriptName_main,lvFunctionName,'Start','PROCS');

    var lvArgs = {log: lvLog,
                  dataFunctionName: gvDataFunctionName};

    $.post('/getData',lvArgs,function(pvResponse){
        pvResponse.log += log(gvScriptName_main,lvFunctionName,'client-side script has received core dataset back from balu-console','DEBUG');
        pvCallback(pvResponse);
    });
}

function populateDropDownLists(pvArgs){

    switch (gvPageName) {
        case 'website-search-config':
            break;
        case 'websites':
            // none
            break;
        case 'search-categories':
            // none
            break;
        case 'search-products':
            populateSearchCategoriesDropDownList(pvArgs);
            populateProductGroupsDropDownList(pvArgs);
            break;
        case 'product-groups':
            // none
            break;
        case 'brands':
            // none
            break;
        case 'recommendations':
            populateSearchCategoriesDropDownList(pvArgs);
            populateProductGroupsDropDownList(pvArgs);
            populateEthicalBrandsDropDownList(pvArgs);
            break;
        default:
            // do nothing
    }
}

function populateSearchCategoriesDropDownList(pvArgs){

    var lvLog = pvArgs.log;
    var lvFunctionName = 'populateSearchCategoriesDropDownList';

    $.post('/getData',{dataFunctionName: 'getSearchCategories'},function(pvResponse){
        pvResponse.log += log(gvScriptName_main,lvFunctionName,'client-side script has received dropdown list dataset (' + pvResponse.dataFunctionName + ') back from balu-console','DEBUG');
        var lvData = [];
        for(var i = 0; i < pvResponse.data.length; i++){
            lvData.push({key:   pvResponse.data[i].searchCategoryId,
                         value: pvResponse.data[i].categoryName});
        }
        var lvHtml = renderDropDownListOptions({data: lvData, fieldName: 'searchCategory'});
        gvSearchCategoryDropDownListOptions = lvHtml;

        $('#row_new select[name=searchCategory]').each(function(i, obj){
            $(this).append($(lvHtml));
        });
        $('#row_filter select[name=searchCategory]').each(function(i, obj){
            $(this).append($(lvHtml));
        });
    });
}

function populateProductGroupsDropDownList(pvArgs){

    var lvLog = pvArgs.log;
    var lvFunctionName = 'populateProductGroupsDropDownList';

    $.post('/getData',{dataFunctionName: 'getProductGroups'},function(pvResponse){
        pvResponse.log += log(gvScriptName_main,lvFunctionName,'client-side script has received dropdown list dataset (' + pvResponse.dataFunctionName + ') back from balu-console','DEBUG');
        var lvData = [];
        for(var i = 0; i < pvResponse.data.length; i++){
            lvData.push({key:   pvResponse.data[i].productGroupId,
                         value: pvResponse.data[i].productGroupName});
        }
        var lvHtml = renderDropDownListOptions({data: lvData, fieldName: 'productGroup'});
        gvProductGroupDropDownListOptions = lvHtml;

        $('#row_new select[name=productGroup]').each(function(i, obj){
            $(this).append($(lvHtml));
        });
        $('#row_filter select[name=productGroup]').each(function(i, obj){
            $(this).append($(lvHtml));
        });
    });
}

function populateEthicalBrandsDropDownList(pvArgs){

    var lvLog = pvArgs.log;
    var lvFunctionName = 'populateEthicalBrandsDropDownList';

    $.post('/getData',{dataFunctionName: 'getEthicalBrands',log: lvLog},function(pvResponse){
        pvResponse.log += log(gvScriptName_main,lvFunctionName,'client-side script has received dropdown list dataset (' + pvResponse.dataFunctionName + ') back from balu-console','DEBUG');
        var lvData = [];
        for(var i = 0; i < pvResponse.data.length; i++){
            lvData.push({key:   pvResponse.data[i].brandId,
                         value: pvResponse.data[i].brandName});
        }
        var lvHtml = renderDropDownListOptions({data: lvData, fieldName: 'brandName'});
        gvBrandDropDownListOptions = lvHtml;

        $('#row_new select[name=brand]').each(function(i, obj){
            $(this).append($(lvHtml));
        });
        $('#row_filter select[name=brand]').each(function(i, obj){
            $(this).append($(lvHtml));
        });
    });
}

/****************************
 * HTML Rendering Functions *
 ****************************/

function renderFilterRow(pvArgs){

    var lvHtml = '';
    var lvActionType = 'filter';

    // Start with an empty column for the checkbox column
    lvHtml += '<tr id="row_filter"><td></td>';

    switch (gvPageName) {
        case 'website-search-config':
            // This is never called, the website-search-config page uses the old (ejs-based) rendering
            // because it doesn't follow the basic structure of the generic page
            break;
        case 'websites':
            lvHtml += renderTextField({addOrUpdate: lvActionType, fieldName: 'websiteURL', title: 'Website URL', placeholder: 'Website URL', dataRequired_str: 'true', width: '200px'});
            lvHtml += renderOnOff({addOrUpdate: lvActionType, fieldName: 'isWebsiteOnOrOff', defaultValue: null, title: 'Is website on or off', dataRequired_str: 'true', width: '150px'});
            break;
        case 'search-categories':
            lvHtml += renderTextField({addOrUpdate: lvActionType, fieldName: 'categoryName', title: 'New category', dataRequired_str: 'true', placeholder: 'Category name', dataRequired_str: 'true',width: '200px'});
            lvHtml += renderTextField({addOrUpdate: lvActionType, fieldName: 'categoryShortName', title: 'Category short name', placeholder: 'Category short name', dataRequired_str: 'true',width: '200px'});
            lvHtml += renderTextField({addOrUpdate: lvActionType, fieldName: 'whyDoWeCare', title: 'Why do we care slug', placeholder: 'Why do we care slug', dataRequired_str: 'true',width: '200px'});
            break;
        case 'search-products':
            lvHtml += renderDropDownList({addOrUpdate: lvActionType, fieldName: 'searchCategory', title: 'Search category', placeholder: 'search category', dataRequired_str: 'true', width: '200px'});
            lvHtml += renderDropDownList({addOrUpdate: lvActionType, fieldName: 'productGroup', title: 'Product group', placeholder: 'product group', dataRequired_str: 'true', width: '200px'});
            lvHtml += renderTextField({addOrUpdate: lvActionType, fieldName: 'productName', title: 'Product name', placeholder: 'Product name', dataRequired_str: 'true', width: '200px'});
            lvHtml += renderTextField({addOrUpdate: lvActionType, fieldName: 'brand', title: 'Brand', placeholder: 'Brand', dataRequired_str: 'true', width: '100px'});
            lvHtml += renderAndOr({addOrUpdate: lvActionType, fieldName: 'andOr', defaultValue: null, title: 'And / Or', dataRequired_str: 'true', width: '150px'});
            lvHtml += renderTextField({addOrUpdate: lvActionType, fieldName: 'searchTerm1', title: 'Search term 1', placeholder: 'Search term 1', dataRequired_str: 'false', width: '200px'});
            lvHtml += renderTextField({addOrUpdate: lvActionType, fieldName: 'searchTerm2', title: 'Search term 2', placeholder: 'Search term 2', dataRequired_str: 'false', width: '200px'});
            lvHtml += renderTextField({addOrUpdate: lvActionType, fieldName: 'searchTerm3', title: 'Search term 3', placeholder: 'Search term 3', dataRequired_str: 'false', width: '200px'});
            lvHtml += renderTextField({addOrUpdate: lvActionType, fieldName: 'searchTerm4', title: 'Search term 4', placeholder: 'Search term 4', dataRequired_str: 'false', width: '200px'});
            lvHtml += renderTextField({addOrUpdate: lvActionType, fieldName: 'searchTerm5', title: 'Search term 5', placeholder: 'Search term 5', dataRequired_str: 'false', width: '200px'});
            lvHtml += renderTextField({addOrUpdate: lvActionType, fieldName: 'searchTerm6', title: 'Search term 6', placeholder: 'Search term 6', dataRequired_str: 'false', width: '200px'});
            lvHtml += renderTextField({addOrUpdate: lvActionType, fieldName: 'searchTerm7', title: 'Search term 7', placeholder: 'Search term 7', dataRequired_str: 'false', width: '200px'});
            lvHtml += renderTextField({addOrUpdate: lvActionType, fieldName: 'sex', title: 'Product name', placeholder: 'Product name', dataRequired_str: 'false', width: '200px'});
            lvHtml += renderTextField({addOrUpdate: lvActionType, fieldName: 'negativeSearchTerm1', title: 'Negative search term 1', placeholder: 'Negative search term 1', dataRequired_str: 'false', width: '200px'});
            lvHtml += renderTextField({addOrUpdate: lvActionType, fieldName: 'negativeSearchTerm2', title: 'Negative search term 2', placeholder: 'Negative search term 2', dataRequired_str: 'false', width: '200px'});
            lvHtml += renderTextField({addOrUpdate: lvActionType, fieldName: 'negativeSearchTerm3', title: 'Negative search term 3', placeholder: 'Negative search term 3', dataRequired_str: 'false', width: '200px'});
            lvHtml += renderTextField({addOrUpdate: lvActionType, fieldName: 'negativeSearchTerm4', title: 'Negative search term 4', placeholder: 'Negative search term 4', dataRequired_str: 'false', width: '200px'});
            lvHtml += renderAndOr({addOrUpdate: lvActionType, fieldName: 'negativeAndOr', defaultValue: null, title: 'Negative and / or', dataRequired_str: 'true', width: '150px'});
            break;
        case 'product-groups':
            lvHtml += renderTextField({addOrUpdate: lvActionType, fieldName: 'productGroupName', title: 'Product group name', placeholder: 'Product group name', dataRequired_str: 'true', width: '200px'});
            lvHtml += renderTrueFalse({addOrUpdate: lvActionType, fieldName: 'christmasBanner', defaultValue: null, title: 'Christmas banner', dataRequired_str: 'true', width: '150px'});
            break;
        case 'brands':
            lvHtml += renderTextField({addOrUpdate: lvActionType, fieldName: 'brandName', title: 'Brand name', placeholder: 'Brand name', dataRequired_str: 'true', width: '200px'});
            lvHtml += renderTextField({addOrUpdate: lvActionType, fieldName: 'homepage', title: 'Homepage (with http)', placeholder: 'Homepage', dataRequired_str: 'true', width: '200px'});
            lvHtml += renderTextField({addOrUpdate: lvActionType, fieldName: 'twitterHandle', title: 'Twitter handle (with @)', placeholder: 'Twitter handle', dataRequired_str: 'true', width: '200px'});
            lvHtml += renderTextArea({addOrUpdate: lvActionType, fieldName: 'brandSpiel', title: 'Brand spiel', placeholder: 'Brand spiel', dataRequired_str: 'true', width: '200px'});
            lvHtml += renderTrueFalse({addOrUpdate: lvActionType, fieldName: 'baluFavourite', defaultValue: null, title: 'Balu favourite', dataRequired_str: 'true', width: '150px'});
            lvHtml += renderTrueFalse({addOrUpdate: lvActionType, fieldName: 'isArchived', defaultValue: null, title: 'Is archived', dataRequired_str: 'true', width: '150px'});
            break;
        case 'recommendations':
            lvHtml += renderDropDownList({addOrUpdate: lvActionType, fieldName: 'productGroup', title: 'Product group', placeholder: 'product group', dataRequired_str: 'false', width: '200px'});
            lvHtml += renderDropDownList({addOrUpdate: lvActionType, fieldName: 'searchCategory', title: 'Search category', placeholder: 'search category', dataRequired_str: 'false', width: '200px'});
            lvHtml += renderTextField({addOrUpdate: lvActionType, fieldName: 'productName', title: 'Product name', placeholder: 'Product name', dataRequired_str: 'true', width: '200px'});
            lvHtml += renderTextField({addOrUpdate: lvActionType, fieldName: 'pageConfirmationSearch', title: 'Page load confirmation search', placeholder: 'Page load confirmation search', dataRequired_str: 'true', width: '200px'});
            lvHtml += renderTextField({addOrUpdate: lvActionType, fieldName: 'productURL', title: 'Product URL', placeholder: 'Product URL', dataRequired_str: 'true', width: '300px'});
            lvHtml += renderDropDownList({addOrUpdate: lvActionType, fieldName: 'brand', title: 'Brand', placeholder: 'brand', dataRequired_str: 'true', width: '200px'});
            lvHtml += renderFileUpload({addOrUpdate: lvActionType, fieldName: 'image', title: 'Thumbnail', dataRequired_str: 'true', width: '200px'});
            lvHtml += renderTrueFalse({addOrUpdate: lvActionType, fieldName: 'isArchived', defaultValue: null, title: 'Is archived', dataRequired_str: 'true', width: '150px'});
            break;
        case 'activity-dashboard':
            break;
        case 'user-report':
            break;
        case 'data-quality':
            break;
        case 'job-log':
            break;
        case 'bts-dashboard':
            break;
        default:
            // Nothing
    }

    // Finish with an empty column, for the update button column
    lvHtml += '<td></td></tr>';
    return lvHtml;
}

function renderHeaderRow(pvArgs){

    var lvHtml = '';
    lvHtml += '<tr><th width="50">#</th>';

    switch (gvPageName) {
        case 'website-search-config':
            // This is never called, the website-search-config page uses the old (ejs-based) rendering
            // because it doesn't follow the basic structure of the generic page
            break;
        case 'websites':
            lvHtml += '  <th width="200">Website URL</th>';
            lvHtml += '  <th width="200">On/Off</th>';
            break;
        case 'search-categories':
            lvHtml += '  <th width="200">Category Name</th>';
            lvHtml += '  <th width="200">Category Short Name</th>';
            lvHtml += '  <th width="200">Why Do We Care Slug</th>';
            break;
        case 'search-products':
            lvHtml += '  <th width="200">Search Category</th>';
            lvHtml += '  <th width="200">Product Group</th>';
            lvHtml += '  <th width="200">Product Name</th>';
            lvHtml += '  <th width="200">Brand</th>';
            lvHtml += '  <th width="200">And/Or</th>';
            lvHtml += '  <th width="200">Search Term 1</th>';
            lvHtml += '  <th width="200">Search Term 2</th>';
            lvHtml += '  <th width="200">Search Term 3</th>';
            lvHtml += '  <th width="200">Search Term 4</th>';
            lvHtml += '  <th width="200">Search Term 5</th>';
            lvHtml += '  <th width="200">Search Term 6</th>';
            lvHtml += '  <th width="200">Search Term 7</th>';
            lvHtml += '  <th width="200">Sex</th>';
            lvHtml += '  <th width="200">-ve Search Term 1</th>';
            lvHtml += '  <th width="200">-ve Search Term 2</th>';
            lvHtml += '  <th width="200">-ve Search Term 3</th>';
            lvHtml += '  <th width="200">-ve Search Term 4</th>';
            lvHtml += '  <th width="200">-ve And/Or</th>';
            break;
        case 'product-groups':
            lvHtml += '  <th width="200">Product Group</th>';
            lvHtml += '  <th width="200">Christmas Banner</th>';
            break;
        case 'brands':
            lvHtml += '  <th width="200">Brand Name</th>';
            lvHtml += '  <th width="200">Homepage</th>';
            lvHtml += '  <th width="200">Twitter</th>';
            lvHtml += '  <th width="200">Brand Spiel</th>';
            lvHtml += '  <th width="200">Balu Favourite</th>';
            lvHtml += '  <th width="200">Archived</th>';
            break;
        case 'recommendations':
            lvHtml += '  <th width="200">Product Group</th>';
            lvHtml += '  <th width="200">Search Category</th>';
            lvHtml += '  <th width="200">Product Name</th>';
            lvHtml += '  <th width="200">Page Load Conf. Search</th>';
            lvHtml += '  <th width="300">Product URL</th>';
            lvHtml += '  <th width="200">Brand</th>';
            lvHtml += '  <th width="200">Thumbnail</th>';
            lvHtml += '  <th width="50">Archived</th>';
            break;
        case 'activity-dashboard':
            break;
        case 'user-report':
            lvHtml += '  <th width="200">Created At</th>';
            lvHtml += '  <th width="200">Email</th>';
            lvHtml += '  <th width="200">Email verified</th>';
            lvHtml += '  <th width="200">Joyride Status</th>';
            lvHtml += '  <th width="200">Who Is</th>';
            break;
        case 'data-quality':
            // to do
            break;
        case 'job-log':
            // to do
            break;
        case 'bts-dashboard':
            // to do
            break;
        default:
            // Nothing
    }

    lvHtml += '<th width="100">-</th></tr>';

    return lvHtml;
}

function renderAddNewRow(pvArgs){

    var lvHtml = '';
    var lvActionType = 'add';

    // Start with an empty column for the checkbox column
    lvHtml += '<tr id="row_new"><td></td>';

    switch (gvPageName) {
        case 'website-search-config':
            // This is never called, the website-search-config page uses the old (ejs-based) rendering
            // because it doesn't follow the basic structure of the generic page
            break;
        case 'websites':
            lvHtml += renderTextField({addOrUpdate: lvActionType, fieldName: 'websiteURL', title: 'Website URL (no http)', dataRequired_str: 'true', placeholder: 'Website URL'});
            lvHtml += renderOnOff({addOrUpdate: lvActionType, fieldName: 'isWebsiteOnOrOff', defaultValue: 'ON', title: 'Is website on or off', dataRequired_str: 'true'});
            break;
        case 'search-categories':
            lvHtml += renderTextField({addOrUpdate: lvActionType, fieldName: 'categoryName', title: 'New category', dataRequired_str: 'true', placeholder: 'Product name'});
            lvHtml += renderTextField({addOrUpdate: lvActionType, fieldName: 'categoryShortName', title: 'Category short name', dataRequired_str: 'true', placeholder: 'Product name',});
            lvHtml += renderTextField({addOrUpdate: lvActionType, fieldName: 'whyDoWeCare', title: 'Why do we care slug', dataRequired_str: 'true', placeholder: 'Product name',});
            break;
        case 'search-products':
            lvHtml += renderDropDownList({addOrUpdate: lvActionType, fieldName: 'searchCategory', title: 'Search category', dataRequired_str: 'true', placeholder: 'search category'});
            lvHtml += renderDropDownList({addOrUpdate: lvActionType, fieldName: 'productGroup', title: 'Product group', dataRequired_str: 'true', placeholder: 'product group'});
            lvHtml += renderTextField({addOrUpdate: lvActionType, fieldName: 'productName', title: 'Product name', dataRequired_str: 'true', placeholder: 'Product name'});
            lvHtml += renderTextField({addOrUpdate: lvActionType, fieldName: 'brand', title: 'Brand', dataRequired_str: 'true', placeholder: 'Brand'});
            lvHtml += renderAndOr({addOrUpdate: lvActionType, fieldName: 'andOr', defaultValue: 'AND', dataRequired_str: 'true', title: 'And / Or'});
            lvHtml += renderTextField({addOrUpdate: lvActionType, fieldName: 'searchTerm1', title: 'Search term 1', dataRequired_str: 'false', placeholder: 'Search term 1'});
            lvHtml += renderTextField({addOrUpdate: lvActionType, fieldName: 'searchTerm2', title: 'Search term 2', dataRequired_str: 'false', placeholder: 'Search term 2'});
            lvHtml += renderTextField({addOrUpdate: lvActionType, fieldName: 'searchTerm3', title: 'Search term 3', dataRequired_str: 'false', placeholder: 'Search term 3'});
            lvHtml += renderTextField({addOrUpdate: lvActionType, fieldName: 'searchTerm4', title: 'Search term 4', dataRequired_str: 'false', placeholder: 'Search term 4'});
            lvHtml += renderTextField({addOrUpdate: lvActionType, fieldName: 'searchTerm5', title: 'Search term 5', dataRequired_str: 'false', placeholder: 'Search term 5'});
            lvHtml += renderTextField({addOrUpdate: lvActionType, fieldName: 'searchTerm6', title: 'Search term 6', dataRequired_str: 'false', placeholder: 'Search term 6'});
            lvHtml += renderTextField({addOrUpdate: lvActionType, fieldName: 'searchTerm7', title: 'Search term 7', dataRequired_str: 'false', placeholder: 'Search term 7'});
            lvHtml += renderTextField({addOrUpdate: lvActionType, fieldName: 'sex', title: 'Product name', dataRequired_str: 'false', placeholder: 'Product name'});
            lvHtml += renderTextField({addOrUpdate: lvActionType, fieldName: 'negativeSearchTerm1', title: 'Negative search term 1', dataRequired_str: 'false', placeholder: 'Negative search term 1'});
            lvHtml += renderTextField({addOrUpdate: lvActionType, fieldName: 'negativeSearchTerm2', title: 'Negative search term 2', dataRequired_str: 'false', placeholder: 'Negative search term 2'});
            lvHtml += renderTextField({addOrUpdate: lvActionType, fieldName: 'negativeSearchTerm3', title: 'Negative search term 3', dataRequired_str: 'false', placeholder: 'Negative search term 3'});
            lvHtml += renderTextField({addOrUpdate: lvActionType, fieldName: 'negativeSearchTerm4', title: 'Negative search term 4', dataRequired_str: 'false', placeholder: 'Negative search term 4'});
            lvHtml += renderAndOr({addOrUpdate: lvActionType, fieldName: 'negativeAndOr', defaultValue: 'AND', title: 'Negative and / or', dataRequired_str: 'true'});
            break;
        case 'product-groups':
            lvHtml += renderTextField({addOrUpdate: lvActionType, fieldName: 'productGroupName', title: 'Product group name', dataRequired_str: 'true', placeholder: 'Product group name'});
            lvHtml += renderTrueFalse({addOrUpdate: lvActionType, fieldName: 'christmasBanner', defaultValue: 'FALSE', title: 'Christmas banner', dataRequired_str: 'true'});
            break;
        case 'brands':
            lvHtml += renderTextField({addOrUpdate: lvActionType, fieldName: 'brandName', title: 'Brand name', dataRequired_str: 'true', placeholder: 'Brand name'});
            lvHtml += renderTextField({addOrUpdate: lvActionType, fieldName: 'homepage', title: 'Homepage (with http)', dataRequired_str: 'true', placeholder: 'Homepage'});
            lvHtml += renderTextField({addOrUpdate: lvActionType, fieldName: 'twitterHandle', title: 'Twitter handle (with @)', dataRequired_str: 'true', placeholder: 'Twitter handle'});
            lvHtml += renderTextArea({addOrUpdate: lvActionType, fieldName: 'brandSpiel', title: 'Brand spiel', dataRequired_str: 'true', placeholder: 'Brand spiel'});
            lvHtml += renderTrueFalse({addOrUpdate: lvActionType, fieldName: 'baluFavourite', defaultValue: 'FALSE', title: 'Balu favourite', dataRequired_str: 'true'});
            lvHtml += renderTrueFalse({addOrUpdate: lvActionType, fieldName: 'isArchived', defaultValue: 'FALSE', title: 'Is archived', dataRequired_str: 'true'});
            break;
        case 'recommendations':
            lvHtml += renderDropDownList({addOrUpdate: lvActionType, fieldName: 'productGroup', title: 'Product group', dataRequired_str: 'false', placeholder: 'product group'});
            lvHtml += renderDropDownList({addOrUpdate: lvActionType, fieldName: 'searchCategory', title: 'Search category', dataRequired_str: 'false', placeholder: 'search category'});
            lvHtml += renderTextField({addOrUpdate: lvActionType, fieldName: 'productName', title: 'Product name', dataRequired_str: 'true', placeholder: 'Product name'});
            lvHtml += renderTextField({addOrUpdate: lvActionType, fieldName: 'pageConfirmationSearch', title: 'Page load confirmation search', dataRequired_str: 'true', placeholder: 'Page load confirmation search'});
            lvHtml += renderTextField({addOrUpdate: lvActionType, fieldName: 'productURL', title: 'Product URL', dataRequired_str: 'true', placeholder: 'Product URL'});
            lvHtml += renderDropDownList({addOrUpdate: lvActionType, fieldName: 'brand', title: 'Brand', dataRequired_str: 'true', placeholder: 'brand'});
            lvHtml += renderFileUpload({addOrUpdate: lvActionType, fieldName: 'image', title: 'Thumbnail', dataRequired_str: 'true'});
            lvHtml += renderTrueFalse({addOrUpdate: lvActionType, fieldName: 'isArchived', defaultValue: 'FALSE', title: 'Is archived', dataRequired_str: 'true'});
            break;
        case 'user-report':
            lvActionType = 'NON-EDITABLE-FORM-add';
            lvHtml += renderTextField({addOrUpdate: lvActionType});
            lvHtml += renderTextField({addOrUpdate: lvActionType});
            lvHtml += renderTextField({addOrUpdate: lvActionType});
            lvHtml += renderTextField({addOrUpdate: lvActionType});
            lvHtml += renderTextField({addOrUpdate: lvActionType});
            break;
        default:
            // Nothing
    }
    lvHtml += renderAddButton({addOrUpdate: lvActionType, endPoint: gvEndPoint});
    lvHtml += '</tr>';

    return lvHtml;
}

function renderDataTable(pvArgs){
    var lvHtml = '';
    // Loop through the data and create a data row for each record
    for(var i = 0; i < pvArgs.data.length; i++) {
        lvHtml += renderDataRow({dataRow: pvArgs.data[i]});
    }
    return lvHtml;
}

function renderDataRow(pvArgs){

    var lvHtml = '';
    var lvRowId = '';
    var lvActionType = 'update';

    switch (gvPageName) {
        case 'website-search-config':
            // This is never called, the website-search-config page uses the old (ejs-based) rendering
            // because it doesn't follow the basic structure of the generic page
            break;
        case 'websites':
            lvRowId = pvArgs.dataRow.websiteId;
            lvHtml += renderTextField({addOrUpdate: lvActionType, rowId: lvRowId, fieldName: 'websiteURL', currentValue: pvArgs.dataRow.websiteURL, displayValue: pvArgs.dataRow.websiteURL, title: 'Website URL', dataRequired_str: 'true', placeholder: 'Website URL'});
            lvHtml += renderOnOff({addOrUpdate: lvActionType, rowId: lvRowId, fieldName: 'isWebsiteOnOrOff', dataRequired_str: 'true', defaultValue: 'ON', currentValue: pvArgs.dataRow.isWebsiteOnOrOff, title: 'Is website on or off'});
            break;
        case 'search-categories':
            lvRowId = pvArgs.dataRow.searchCategoryId;
            lvHtml += renderTextField({addOrUpdate: lvActionType, rowId: lvRowId, fieldName: 'categoryName', currentValue: pvArgs.dataRow.categoryName, displayValue: pvArgs.dataRow.categoryName, title: 'New category', dataRequired_str: 'true', placeholder: 'Category name'});
            lvHtml += renderTextField({addOrUpdate: lvActionType, rowId: lvRowId, fieldName: 'categoryShortName', currentValue: pvArgs.dataRow.categoryShortName, displayValue: pvArgs.dataRow.categoryShortName, title: 'Category short name', dataRequired_str: 'true', placeholder: 'Category short name',});
            lvHtml += renderTextField({addOrUpdate: lvActionType, rowId: lvRowId, fieldName: 'whyDoWeCare', currentValue: pvArgs.dataRow.whyDoWeCare, displayValue: pvArgs.dataRow.whyDoWeCare, title: 'Why do we care slug', dataRequired_str: 'true', placeholder: 'Why do we care slug',});
            break;
        case 'search-products':
            lvRowId = pvArgs.dataRow.searchProductId;
            lvHtml += renderDropDownList({addOrUpdate: lvActionType, rowId: lvRowId, fieldName: 'searchCategory', currentValue: pvArgs.dataRow.searchCategoryName, currentId: pvArgs.dataRow.searchCategoryId, title: 'Search category', dataRequired_str: 'true', placeholder: 'search category'});
            lvHtml += renderDropDownList({addOrUpdate: lvActionType, rowId: lvRowId, fieldName: 'productGroup', currentValue: pvArgs.dataRow.productGroupName, currentId: pvArgs.dataRow.productGroupId, title: 'Product group', dataRequired_str: 'true', placeholder: 'product group'});
            lvHtml += renderTextField({addOrUpdate: lvActionType, rowId: lvRowId, fieldName: 'productName', currentValue: pvArgs.dataRow.productName, displayValue: pvArgs.dataRow.productName, title: 'Product name', dataRequired_str: 'true', placeholder: 'Product name'});
            lvHtml += renderTextField({addOrUpdate: lvActionType, rowId: lvRowId, fieldName: 'brand', currentValue: pvArgs.dataRow.brand, displayValue: pvArgs.dataRow.brand, title: 'Brand', dataRequired_str: 'true', placeholder: 'Brand'});
            lvHtml += renderAndOr({addOrUpdate: lvActionType, rowId: lvRowId, fieldName: 'andOr', defaultValue: null, currentValue: pvArgs.dataRow.andOr, title: 'And / Or', dataRequired_str: 'true'});
            lvHtml += renderTextField({addOrUpdate: lvActionType, rowId: lvRowId, fieldName: 'searchTerm1', currentValue: pvArgs.dataRow.searchTerm1, displayValue: pvArgs.dataRow.searchTerm1, title: 'Search term 1', dataRequired_str: 'false', placeholder: 'Search term 1'});
            lvHtml += renderTextField({addOrUpdate: lvActionType, rowId: lvRowId, fieldName: 'searchTerm2', currentValue: pvArgs.dataRow.searchTerm2, displayValue: pvArgs.dataRow.searchTerm2, title: 'Search term 2', dataRequired_str: 'false', dataRequired_str: 'true', placeholder: 'Search term 2'});
            lvHtml += renderTextField({addOrUpdate: lvActionType, rowId: lvRowId, fieldName: 'searchTerm3', currentValue: pvArgs.dataRow.searchTerm3, displayValue: pvArgs.dataRow.searchTerm3, title: 'Search term 3', dataRequired_str: 'false', placeholder: 'Search term 3'});
            lvHtml += renderTextField({addOrUpdate: lvActionType, rowId: lvRowId, fieldName: 'searchTerm4', currentValue: pvArgs.dataRow.searchTerm4, displayValue: pvArgs.dataRow.searchTerm4, title: 'Search term 4', dataRequired_str: 'false', placeholder: 'Search term 4'});
            lvHtml += renderTextField({addOrUpdate: lvActionType, rowId: lvRowId, fieldName: 'searchTerm5', currentValue: pvArgs.dataRow.searchTerm5, displayValue: pvArgs.dataRow.searchTerm5, title: 'Search term 5', dataRequired_str: 'false', placeholder: 'Search term 5'});
            lvHtml += renderTextField({addOrUpdate: lvActionType, rowId: lvRowId, fieldName: 'searchTerm6', currentValue: pvArgs.dataRow.searchTerm6, displayValue: pvArgs.dataRow.searchTerm6, title: 'Search term 6', dataRequired_str: 'false', placeholder: 'Search term 6'});
            lvHtml += renderTextField({addOrUpdate: lvActionType, rowId: lvRowId, fieldName: 'searchTerm7', currentValue: pvArgs.dataRow.searchTerm7, displayValue: pvArgs.dataRow.searchTerm7, title: 'Search term 7', dataRequired_str: 'false', placeholder: 'Search term 7'});
            lvHtml += renderTextField({addOrUpdate: lvActionType, rowId: lvRowId, fieldName: 'sex', currentValue: pvArgs.dataRow.sex, displayValue: pvArgs.dataRow.sex, title: 'Sex', dataRequired_str: 'false', placeholder: 'Sex'});
            lvHtml += renderTextField({addOrUpdate: lvActionType, rowId: lvRowId, fieldName: 'negativeSearchTerm1', currentValue: pvArgs.dataRow.negativeSearchTerm1, displayValue: pvArgs.dataRow.negativeSearchTerm1, title: 'Negative search term 1', dataRequired_str: 'false', placeholder: 'Negative search term 1'});
            lvHtml += renderTextField({addOrUpdate: lvActionType, rowId: lvRowId, fieldName: 'negativeSearchTerm2', currentValue: pvArgs.dataRow.negativeSearchTerm2, displayValue: pvArgs.dataRow.negativeSearchTerm2, title: 'Negative search term 2', dataRequired_str: 'false', placeholder: 'Negative search term 2'});
            lvHtml += renderTextField({addOrUpdate: lvActionType, rowId: lvRowId, fieldName: 'negativeSearchTerm3', currentValue: pvArgs.dataRow.negativeSearchTerm3, displayValue: pvArgs.dataRow.negativeSearchTerm3, title: 'Negative search term 3', dataRequired_str: 'false', placeholder: 'Negative search term 3'});
            lvHtml += renderTextField({addOrUpdate: lvActionType, rowId: lvRowId, fieldName: 'negativeSearchTerm4', currentValue: pvArgs.dataRow.negativeSearchTerm4, displayValue: pvArgs.dataRow.negativeSearchTerm4, title: 'Negative search term 4', dataRequired_str: 'false', placeholder: 'Negative search term 4'});
            lvHtml += renderAndOr({addOrUpdate: lvActionType, rowId: lvRowId, fieldName: 'negativeAndOr', defaultValue: null, currentValue: pvArgs.dataRow.negativeAndOr, title: 'Negative and / or', dataRequired_str: 'true'});
            break;
        case 'product-groups':
            lvRowId = pvArgs.dataRow.productGroupId;
            lvHtml += renderTextField({addOrUpdate: lvActionType, rowId: lvRowId, fieldName: 'productGroupName', currentValue: pvArgs.dataRow.productGroupName, displayValue: pvArgs.dataRow.productGroupName, title: 'Product group name', dataRequired_str: 'true', placeholder: 'Product group name'});
            lvHtml += renderTrueFalse({addOrUpdate: lvActionType, rowId: lvRowId, fieldName: 'christmasBanner', defaultValue: 'FALSE', currentValue: pvArgs.dataRow.andOr, title: 'Christmas banner', dataRequired_str: 'true'});
            break;
        case 'brands':
            lvRowId = pvArgs.dataRow.brandId;
            lvHtml += renderTextField({addOrUpdate: lvActionType, rowId: lvRowId, fieldName: 'brandName',  currentValue: pvArgs.dataRow.brandName, displayValue: pvArgs.dataRow.brandName, title: 'Brand name', dataRequired_str: 'true', placeholder: 'Brand name'});
            lvHtml += renderTextField({addOrUpdate: lvActionType, rowId: lvRowId, fieldName: 'homepage', currentValue: pvArgs.dataRow.homepage, displayValue: '<a href="' + pvArgs.dataRow.homepage + '" target="_blank">' + pvArgs.dataRow.homepage + '</a>', title: 'Homepage (with http)', dataRequired_str: 'true', placeholder: 'Homepage'});
            lvHtml += renderTextField({addOrUpdate: lvActionType, rowId: lvRowId, fieldName: 'twitterHandle',  currentValue: pvArgs.dataRow.twitterHandle, displayValue: pvArgs.dataRow.twitterHandle, title: 'Twitter handle (with @)', dataRequired_str: 'true', placeholder: 'Twitter handle'});
            lvHtml += renderTextArea({addOrUpdate: lvActionType, rowId: lvRowId, fieldName: 'brandSpiel',  currentValue: pvArgs.dataRow.brandSpiel, displayValue: pvArgs.dataRow.brandSpiel.substring(0,100) + ' ...', title: 'Brand spiel', dataRequired_str: 'true', placeholder: 'Brand spiel'});
            lvHtml += renderTrueFalse({addOrUpdate: lvActionType, rowId: lvRowId, fieldName: 'baluFavourite', defaultValue: 'FALSE',  currentValue: pvArgs.dataRow.baluFavourite, title: 'Balu favourite', dataRequired_str: 'true'});
            lvHtml += renderTrueFalse({addOrUpdate: lvActionType, rowId: lvRowId, fieldName: 'isArchived', defaultValue: 'FALSE',  currentValue: pvArgs.dataRow.isArchived, title: 'Is archived', dataRequired_str: 'true'});
            break;
        case 'recommendations':
            lvRowId = pvArgs.dataRow.recommendationId;
            lvHtml += renderDropDownList({addOrUpdate: lvActionType, rowId: lvRowId, fieldName: 'productGroup', currentValue: pvArgs.dataRow.productGroupName, currentId: pvArgs.dataRow.productGroupId, title: 'Product group', dataRequired_str: 'true', placeholder: 'product group'});
            lvHtml += renderDropDownList({addOrUpdate: lvActionType, rowId: lvRowId, fieldName: 'searchCategory', currentValue: pvArgs.dataRow.searchCategoryName, currentId: pvArgs.dataRow.searchCategoryId, title: 'Search category', dataRequired_str: 'false', placeholder: 'search category'});
            lvHtml += renderTextField({addOrUpdate: lvActionType, rowId: lvRowId, fieldName: 'productName', currentValue: pvArgs.dataRow.productName, displayValue: pvArgs.dataRow.productName, title: 'Product name', dataRequired_str: 'true', placeholder: 'product name'});
            lvHtml += renderTextField({addOrUpdate: lvActionType, rowId: lvRowId, fieldName: 'pageConfirmationSearch', currentValue: pvArgs.dataRow.pageConfirmationSearch, displayValue: pvArgs.dataRow.pageConfirmationSearch, title: 'Page load confirmation search', dataRequired_str: 'true', placeholder: 'Page load confirmation search'});
            lvHtml += renderTextField({addOrUpdate: lvActionType, rowId: lvRowId, fieldName: 'productURL', currentValue: pvArgs.dataRow.productURL, displayValue: '<a href="' + pvArgs.dataRow.productURL + '" target="_blank">' + pvArgs.dataRow.productURL.substring(pvArgs.dataRow.productURL.indexOf('/')+2,pvArgs.dataRow.productURL.indexOf('/',8)+1) + ' ... ' + pvArgs.dataRow.productURL.substring(pvArgs.dataRow.productURL.length-20) + '</a>', title: 'Product URL', dataRequired_str: 'true', placeholder: 'Product URL'});
            lvHtml += renderDropDownList({addOrUpdate: lvActionType, rowId: lvRowId, fieldName: 'brand', currentValue: pvArgs.dataRow.brandName, currentId: pvArgs.dataRow.brandId, title: 'Brand', dataRequired_str: 'true', placeholder: 'brand'});
            lvHtml += renderFileUpload({addOrUpdate: lvActionType, rowId: lvRowId, fieldName: 'image', currentValue: pvArgs.dataRow.imageURL, title: 'Thumbnail', dataRequired_str: 'true'});
            lvHtml += renderTrueFalse({addOrUpdate: lvActionType, rowId: lvRowId, fieldName: 'isArchived', defaultValue: 'FALSE', currentValue: pvArgs.dataRow.isArchived, title: 'Is archived', dataRequired_str: 'true'});
            break;
        case 'activity-dashboard':
            break;
        case 'user-report':
            lvActionType = 'NON-EDITABLE-FORM-update';
            lvHtml += renderTextField({addOrUpdate: lvActionType, fieldName: 'createdAt', displayValue: pvArgs.dataRow.createdAt, dataRequired_str: 'true'});
            lvHtml += renderTextField({addOrUpdate: lvActionType, fieldName: 'email', displayValue: pvArgs.dataRow.email, dataRequired_str: 'true'});
            lvHtml += renderTextField({addOrUpdate: lvActionType, fieldName: 'emailVerified', displayValue: pvArgs.dataRow.emailVerified, dataRequired_str: 'true'});
            lvHtml += renderTextField({addOrUpdate: lvActionType, fieldName: 'joyrideStatus', displayValue: pvArgs.dataRow.joyrideStatus, dataRequired_str: 'true'});
            lvHtml += renderTextField({addOrUpdate: lvActionType, fieldName: 'whoIs', displayValue: pvArgs.dataRow.whoIs, dataRequired_str: 'true'});
            break;
        case 'data-quality':
            break;
        case 'job-log':
            break;
        case 'bts-dashboard':
            break;
        default:
            // nothing
    }

    lvHtml = '<tr id="row_' + lvRowId + '">' + renderCheckbox({addOrUpdate: lvActionType, rowId: lvRowId}) + lvHtml;
    lvHtml += renderUpdateButton({addOrUpdate: lvActionType, rowId: lvRowId, endPoint: gvEndPoint});
    lvHtml += '</tr>';

    return lvHtml;
}

function renderCheckbox(pvArgs){
    if(pvArgs.addOrUpdate === 'add'){
        return '  <td></td>';
    } else if (pvArgs.addOrUpdate === 'update') {
        return '  <td><input data-required="' + pvArgs.dataRequired_str + '" data-action="delete" id="' + pvArgs.rowId + '" type="checkbox" data-group="' + pvArgs.rowId + '" name="checkbox" value="' + pvArgs.rowId + '" class="insideTable"></td>';
    } else if(pvArgs.addOrUpdate === 'filter') {
        return '<td style="width: ' + pvArgs.width + '"></td>';
    } else if(pvArgs.addOrUpdate === 'NON-EDITABLE-FORM-update') {
        return '<td style="width: ' + pvArgs.width + '"></td>';
    }
}

function renderTextField(pvArgs){

    var lvHtml = '';

    if(pvArgs.addOrUpdate === 'add'){
        lvHtml += '  <td title="' + pvArgs.title + '">';
        lvHtml += '    <input data-required="' + pvArgs.dataRequired_str + '" data-action="add" type="text" data-group="new" name="' + pvArgs.fieldName + '" value="" placeholder="' + pvArgs.placeholder + '" class="insideTable">';
        lvHtml += '  </td>';
    } else if (pvArgs.addOrUpdate === 'update') {
        lvHtml += '  <td data-inline-edit="true" data-editable="false" title="' + pvArgs.title + '">';
        lvHtml += '    <span name="' + pvArgs.fieldName + '">' + pvArgs.displayValue + '</span>';
        lvHtml += '    <input data-required="' + pvArgs.dataRequired_str + '" data-action="update" type="text" data-group="' + pvArgs.rowId + '" name="' + pvArgs.fieldName + '" style="display: none" value="' + pvArgs.currentValue + '" class="insideTable">';
        lvHtml += '  </td>';
    } else if(pvArgs.addOrUpdate === 'filter') {
        lvHtml += '<td style="width: ' + pvArgs.width + '"></td>';
    } else if(pvArgs.addOrUpdate === 'NON-EDITABLE-FORM-add') {
        lvHtml += '<td style="width: ' + pvArgs.width + '">';
        lvHtml += '</td>';
    } else if(pvArgs.addOrUpdate === 'NON-EDITABLE-FORM-update') {
        lvHtml += '<td style="width: ' + pvArgs.width + '">';
        lvHtml += '  <span name="' + pvArgs.fieldName + '">' + pvArgs.displayValue + '</span>';
        lvHtml += '</td>';
    }

    return lvHtml;
}

function renderTextArea(pvArgs){

    var lvHtml = '';

    if(pvArgs.addOrUpdate === 'add'){
        lvHtml += '  <td title="' + pvArgs.title + '">';
        lvHtml += '    <textarea data-required="' + pvArgs.dataRequired_str + '" data-action="add" type="text" data-group="new" name="' + pvArgs.fieldName + '" value="" placeholder="' + pvArgs.placeholder + '" class="insideTable" style="width: 200px" rows="5"></textarea>';
        lvHtml += '  </td>';
    } else if (pvArgs.addOrUpdate === 'update') {
        // to do: put a tooltip over this for full spiel text
        lvHtml += '  <td data-inline-edit="true" data-editable="false" title="' + pvArgs.title + '">';
        lvHtml += '    <span name="' + pvArgs.fieldName + '">' + pvArgs.displayValue + '</span>';
        lvHtml += '    <textarea data-required="' + pvArgs.dataRequired_str + '" data-action="update" type="text" data-group="' + pvArgs.rowId + '" name="' + pvArgs.fieldName + '" style="display: none" class="insideTable" rows="5">' + pvArgs.currentValue + '</textarea>';
        lvHtml += '  </td>';
    } else if(pvArgs.addOrUpdate === 'filter') {
        lvHtml += '<td style="width: ' + pvArgs.width + '"></td>';
    }

    return lvHtml;
}

function renderTrueFalse(pvArgs){

    var lvHtml = '';

    if(pvArgs.addOrUpdate === 'add'){
        lvHtml += '  <td title="' + pvArgs.title + '" style="width: ' + pvArgs.width + '">';
        lvHtml += '    <select data-required="' + pvArgs.dataRequired_str + '" data-action="add" data-group="new" data-default-value="' + pvArgs.defaultValue + '" name="' + pvArgs.fieldName + '" class="insideTable">';
        if(pvArgs.defaultValue === 'TRUE') {
            lvHtml += '      <option selected value="TRUE">True</option>';
            lvHtml += '      <option value="FALSE">False</option>';
        }
        if(pvArgs.defaultValue === 'FALSE') {
            lvHtml += '      <option value="TRUE">True</option>';
            lvHtml += '      <option selected value="FALSE">False</option>';
        }
        if(pvArgs.defaultValue === null) {
            lvHtml += '      <option value="TRUE">True</option>';
            lvHtml += '      <option value="FALSE">False</option>';
        }
        lvHtml += '    </select>';
        lvHtml += '  </td>';
    } else if (pvArgs.addOrUpdate === 'update') {
        lvHtml += '  <td data-inline-edit="true" data-editable="false" title="' + pvArgs.title + '">';
        var lvCurrentValue = pvArgs.currentValue;
        var lvSetDefault = lvCurrentValue;
        var lvCurrentValue_text = '';
        if(lvCurrentValue === true){
            lvCurrentValue_text = 'TRUE';
        } else if(lvCurrentValue === null){
            lvCurrentValue_text = '';
        } else if (lvCurrentValue === false) {
            lvCurrentValue_text = 'FALSE';
        }
        if(typeof(lvCurrentValue) === 'undefined' || lvCurrentValue === null) {
            lvCurrentValue = '';
            lvSetDefault = pvArgs.defaultValue;
        }
        lvHtml += '    <span name="' + pvArgs.fieldName + '">' + lvCurrentValue + '</span>';
        lvHtml += '    <select data-required="' + pvArgs.dataRequired_str + '" data-value="' + lvCurrentValue_text + '" data-action="update" data-group="' + pvArgs.rowId + '" data-default-value="FALSE" name="' + pvArgs.fieldName + '" style="display: none" class="insideTable">';
        if(lvSetDefault === true) {
            lvHtml += '      <option selected value="TRUE">True</option>';
            lvHtml += '      <option value="FALSE">False</option>';
        } else if(lvSetDefault === false) {
            lvHtml += '      <option value="TRUE">True</option>';
            lvHtml += '      <option selected value="FALSE">False</option>';
        } else {
            lvHtml += '      <option value="" selected disabled>Select</option>';
            lvHtml += '      <option value="TRUE">True</option>';
            lvHtml += '      <option value="FALSE">False</option>';
        }
        lvHtml += '    </select>';
        lvHtml += '  </td>';
    } else if (pvArgs.addOrUpdate === 'filter') {
        lvHtml += '  <td title="' + pvArgs.title + '" style="width: ' + pvArgs.width + '">';
        lvHtml += '    <select data-required="' + pvArgs.dataRequired_str + '" data-action="filter" data-group="filter" data-default-value="' + pvArgs.defaultValue + '" name="' + pvArgs.fieldName + '" class="insideTable">';
        if(pvArgs.defaultValue === 'TRUE') {
            lvHtml += '      <option selected value="TRUE">True</option>';
            lvHtml += '      <option value="FALSE">False</option>';
        }
        if(pvArgs.defaultValue === 'FALSE') {
            lvHtml += '      <option value="TRUE">True</option>';
            lvHtml += '      <option selected value="FALSE">False</option>';
        }
        if(pvArgs.defaultValue === null) {
            lvHtml += '      <option value="" selected disabled>Select</option>';
            lvHtml += '      <option value="TRUE">True</option>';
            lvHtml += '      <option value="FALSE">False</option>';
        }

        lvHtml += '    </select>';
        lvHtml += '  </td>';
    }

    return lvHtml;
}


function renderOnOff(pvArgs){

    var lvHtml = '';

    if(pvArgs.addOrUpdate === 'add'){
        lvHtml += '  <td title="' + pvArgs.title + '" style="width: ' + pvArgs.width + '">';
        lvHtml += '    <select data-required="' + pvArgs.dataRequired_str + '" data-action="add" data-group="new" data-default-value="' + pvArgs.defaultValue + '" name="' + pvArgs.fieldName + '" class="insideTable">';
        if(pvArgs.defaultValue === 'ON') {
            lvHtml += '      <option selected value="ON">On</option>';
            lvHtml += '      <option value="OFF">Off</option>';
        }
        if(pvArgs.defaultValue === 'OFF') {
            lvHtml += '      <option value="ON">On</option>';
            lvHtml += '      <option selected value="OFF">Off</option>';
        }
        if(pvArgs.defaultValue === null) {
            lvHtml += '      <option value="ON">On</option>';
            lvHtml += '      <option value="OFF">Off</option>';
        }

        lvHtml += '    </select>';
        lvHtml += '  </td>';
    } else if (pvArgs.addOrUpdate === 'update') {
        lvHtml += '  <td data-inline-edit="true" data-editable="false" title="' + pvArgs.title + '">';
        var lvCurrentValue = pvArgs.currentValue;
        var lvSetDefault = lvCurrentValue;
        if(typeof(lvCurrentValue) === 'undefined' || lvCurrentValue === null) {
            lvCurrentValue = '';
            lvSetDefault = pvArgs.defaultValue;
        }
        lvHtml += '    <span name="' + pvArgs.fieldName + '">' + lvCurrentValue + '</span>';
        lvHtml += '    <select data-required="' + pvArgs.dataRequired_str + '" data-action="update"  data-value="' + lvCurrentValue + '" data-group="' + pvArgs.rowId + '" data-default-value="FALSE" name="' + pvArgs.fieldName + '" style="display: none" class="insideTable">';
        if(lvSetDefault === 'ON') {
            lvHtml += '      <option selected value="ON">On</option>';
            lvHtml += '      <option value="OFF">Off</option>';
        } else if(lvSetDefault === 'OFF') {
            lvHtml += '      <option value="ON">On</option>';
            lvHtml += '      <option selected value="OFF">Off</option>';
        } else {
            lvHtml += '      <option value="" selected disabled>Select</option>';
            lvHtml += '      <option value="ON">On</option>';
            lvHtml += '      <option value="OFF">Off</option>';
        }
        lvHtml += '    </select>';
        lvHtml += '  </td>';
    } else if (pvArgs.addOrUpdate === 'filter') {
        lvHtml += '  <td title="' + pvArgs.title + '" style="width: ' + pvArgs.width + '">';
        lvHtml += '    <select data-required="' + pvArgs.dataRequired_str + '" data-action="filter" data-group="filter" data-default-value="' + pvArgs.defaultValue + '" name="' + pvArgs.fieldName + '" class="insideTable">';
        if(pvArgs.defaultValue === 'ON') {
            lvHtml += '      <option selected value="ON">On</option>';
            lvHtml += '      <option value="OFF">Off</option>';
        }
        if(pvArgs.defaultValue === 'OFF') {
            lvHtml += '      <option value="ON">On</option>';
            lvHtml += '      <option selected value="OFF">Off</option>';
        }
        if(pvArgs.defaultValue === null) {
            lvHtml += '      <option value="" selected disabled>Select</option>';
            lvHtml += '      <option value="ON">On</option>';
            lvHtml += '      <option value="OFF">Off</option>';
        }

        lvHtml += '    </select>';
        lvHtml += '  </td>';
    }

    return lvHtml;
}

function renderAndOr(pvArgs){

    var lvHtml = '';

    if(pvArgs.addOrUpdate === 'add'){
        lvHtml += '  <td title="' + pvArgs.title + '" style="width: ' + pvArgs.width + '">';
        lvHtml += '    <select data-required="' + pvArgs.dataRequired_str + '" data-action="add" data-group="new" data-default-value="' + pvArgs.defaultValue + '" name="' + pvArgs.fieldName + '" class="insideTable">';
        if(pvArgs.defaultValue === 'AND') {
            lvHtml += '      <option selected value="AND">And</option>';
            lvHtml += '      <option value="OR">Or</option>';
        }
        if(pvArgs.defaultValue === 'OR') {
            lvHtml += '      <option value="AND">And</option>';
            lvHtml += '      <option selected value="OR">Or</option>';
        }
        if(pvArgs.defaultValue === null) {
            lvHtml += '      <option value="AND">And</option>';
            lvHtml += '      <option value="OR">Or</option>';
        }

        lvHtml += '    </select>';
        lvHtml += '  </td>';
    } else if (pvArgs.addOrUpdate === 'update') {
        lvHtml += '  <td data-inline-edit="true" data-editable="false" title="' + pvArgs.title + '">';
        var lvCurrentValue = pvArgs.currentValue;
        var lvSetDefault = lvCurrentValue;
        if(typeof(lvCurrentValue) === 'undefined' || lvCurrentValue === null) {
            lvCurrentValue = '';
            lvSetDefault = pvArgs.defaultValue;
        }
        lvHtml += '    <span name="' + pvArgs.fieldName + '">' + lvCurrentValue + '</span>';
        lvHtml += '    <select data-required="' + pvArgs.dataRequired_str + '" data-action="update"  data-value="' + lvCurrentValue + '" data-group="' + pvArgs.rowId + '" data-default-value="FALSE" name="' + pvArgs.fieldName + '" style="display: none" class="insideTable">';
        if(lvSetDefault === 'AND') {
            lvHtml += '      <option selected value="AND">And</option>';
            lvHtml += '      <option value="OR">Or</option>';
        } else if(lvSetDefault === 'OR') {
            lvHtml += '      <option value="AND">And</option>';
            lvHtml += '      <option selected value="OR">Or</option>';
        } else {
            lvHtml += '      <option value="" selected disabled>Select</option>';
            lvHtml += '      <option value="AND">And</option>';
            lvHtml += '      <option value="OR">Or</option>';
        }
        lvHtml += '    </select>';
        lvHtml += '  </td>';
    } else if (pvArgs.addOrUpdate === 'filter') {
        lvHtml += '  <td title="' + pvArgs.title + '" style="width: ' + pvArgs.width + '">';
        lvHtml += '    <select data-required="' + pvArgs.dataRequired_str + '" data-action="filter" data-group="filter" data-default-value="' + pvArgs.defaultValue + '" name="' + pvArgs.fieldName + '" class="insideTable">';
        if(pvArgs.defaultValue === 'AND') {
            lvHtml += '      <option selected value="AND">And</option>';
            lvHtml += '      <option value="OR">Or</option>';
        }
        if(pvArgs.defaultValue === 'OR') {
            lvHtml += '      <option value="AND">And</option>';
            lvHtml += '      <option selected value="OR">Or</option>';
        }
        if(pvArgs.defaultValue === null) {
            lvHtml += '      <option value="" selected disabled>Select</option>';
            lvHtml += '      <option value="AND">And</option>';
            lvHtml += '      <option value="OR">Or</option>';
        }

        lvHtml += '    </select>';
        lvHtml += '  </td>';
    }

    return lvHtml;
}

function renderDropDownList(pvArgs){

    var lvHtml = '';

    if(pvArgs.currentValue === null){
        pvArgs.currentValue = '';
    }
    if(pvArgs.addOrUpdate === 'add'){
        lvHtml += '  <td title="' + pvArgs.title + '" style="width: ' + pvArgs.width + '">';
        lvHtml += '    <select data-required="' + pvArgs.dataRequired_str + '" data-action="add" data-group="new" name="' + pvArgs.fieldName + '" class="insideTable">';
        lvHtml += '      <option value="" selected disabled>Select ' + pvArgs.placeholder + '</option>';
        lvHtml += '    </select>';
        lvHtml += '  </td>';
    } else if (pvArgs.addOrUpdate === 'update') {
        lvHtml += '  <td data-inline-edit="true" data-editable="false" title="' + pvArgs.title + '">';
        lvHtml += '    <span name="' + pvArgs.fieldName + '">' + pvArgs.currentValue + '</span>';
        lvHtml += '    <select data-required="' + pvArgs.dataRequired_str + '" data-action="update" data-group="' + pvArgs.rowId + '" data-value="' + pvArgs.currentId + '" name="' + pvArgs.fieldName + '" class="insideTable" style="display: none">';
        lvHtml += '      <option value="" selected disabled>Select ' + pvArgs.placeholder + '</option>';
        lvHtml += '    </select>';
        lvHtml += '  </td>';
    } else if (pvArgs.addOrUpdate === 'filter') {
        lvHtml += '  <td title="' + pvArgs.title + '" style="width: ' + pvArgs.width + '">';
        lvHtml += '    <select data-required="' + pvArgs.dataRequired_str + '" data-action="filter" data-group="filter" name="' + pvArgs.fieldName + '" class="insideTable">';
        lvHtml += '      <option value="" selected disabled>Select ' + pvArgs.placeholder + '</option>';
        lvHtml += '    </select>';
        lvHtml += '  </td>';
    }

    return lvHtml;
}

function renderDropDownListOptions(pvArgs){

    var lvHtml = '';

    for(var i = 0; i < pvArgs.data.length; i++){
        lvHtml += '      <option value="' + pvArgs.data[i].key + '">' + pvArgs.data[i].value + '</option>';
    }

    return lvHtml;
}

function renderFileUpload(pvArgs){

    var lvHtml = '';

    if(pvArgs.addOrUpdate === 'add'){
        lvHtml += '  <td title="' + pvArgs.title + '">';
        lvHtml += '    <input data-required="' + pvArgs.dataRequired_str + '" data-action="add" type="file" data-group="new" name="' + pvArgs.fieldName + '" class="insideTable" >';
        lvHtml += '  </td>';

    } else if (pvArgs.addOrUpdate === 'update') {
        lvHtml += '  <td data-inline-edit="true" data-editable="false" title="' + pvArgs.title + '">';
        lvHtml += '    <span name="' + pvArgs.fieldName + '">***</span>';
        lvHtml += '    <input data-action="update" type="file" data-group="' + pvArgs.rowId + '" name="' + pvArgs.fieldName + '" class="insideTable" style="display: none">';
        lvHtml += '  </td>';
    } else if(pvArgs.addOrUpdate === 'filter') {
        lvHtml += '<td style="width: ' + pvArgs.width + '"></td>';
    }

    return lvHtml;
}

function renderAddButton(pvArgs){
    var lvHtml = '';
    if(pvArgs.addOrUpdate === 'NON-EDITABLE-FORM-add'){
        lvHtml += '<td></td>';
    } else {
        lvHtml += '  <td><input type="submit" value="Add" data-endpoint="' + pvArgs.endPoint + '" data-table-id="table_data" data-group="new" data-action="add" class="button tiny insideTable"></td>';
    }
    return lvHtml;
}

function renderUpdateButton(pvArgs){
    return '  <td><input type="submit" style="display: none" value="Update" data-endpoint="' + pvArgs.endPoint + '" data-table-id="table_data" data-group="' + pvArgs.rowId + '"  data-action="update" class="button tiny insideTable"></td>';
}

/*************
 * Listeners *
 *************/

/*
 * Form submission listener - generic for all screens based on a standard table (or multiple tables) of data
 */
function buttonClick_listener(pvButtonClicked){

    var lvLog = '';
    var lvFunctionName = 'buttonClick_listener';
    lvLog += log(gvScriptName_main,lvFunctionName,'Sending','LSTNR');

    /* Deactivate the appropriate elements' required property so the form can submit */

    // Because it's all one form, and there are multiple submit buttons submitting subsets of
    // inputs from the form, whenever a button is clicked we need to turn off the "required" property
    // on all other sub-forms' fields. We change these back in the submit listner immediatley afterwards
    // It's possible, though, for somebody to submit an update form, which turns the add form validation off,
    // then get a validation warning (so no form submission to turn the add form validation back on), and
    // then they could go back to the add form and submit it entirely empty! So we will turn on validation
    // for our current form each time, to be safe
    switch($(pvButtonClicked).attr('data-action')) {
        case 'add':
            // Get all elements in the update action subform that are required, and change them all to not required
            $(pvButtonClicked).closest('form').find('[data-action="update"][data-required="true"]').prop('required',false);
            $(pvButtonClicked).closest('form').find('[data-action="add"][data-required="true"]').prop('required',true);
            break;
        case 'update':
            // Get ALL elements (update and add action subforms), except those from this particular update group (i.e. this row on the table)
            $(pvButtonClicked).closest('form').find('[data-action="add"][data-required="true"],[data-action="update"][data-required="true"]:not([data-group="'+pvButtonClicked.getAttribute('data-group')+'"])').prop('required',false);
            $(pvButtonClicked).closest('form').find('[data-action="update"][data-required="true"][data-group="'+pvButtonClicked.getAttribute('data-group')+ '"]').prop('required',true);
            break;
        case 'delete':
            // Get all elements in the update and add action subforms, except the submit buttons
            $(pvButtonClicked).closest('form').find('[data-action="update"][data-required="true"],[data-action="add"][data-required="true"]').prop('required',false);
            break;
        default:
            lvLog += log(gvScriptName_main,lvFunctionName,'ERROR, button onclick listener received an action that wasn\'t recognised (Expected add, update or delete; got ' + $(pvButtonClicked).attr('data-action') + ')','ERROR');
    }
}


/*
 * Form submission listener - generic for all screens based on a standard table (or multiple tables) of data
 */
function formSubmit_listener(pvButtonClicked) {

    var lvLog = '';
    var lvFunctionName = 'formSubmit_listener';
    lvLog += log(gvScriptName_main,lvFunctionName,'Sending','LSTNR');


    var lvFormData = new FormData(); // The object we build up and pass through to the AJAX call at the end
    var lvDataForAfter = {action: null,
                          tableCells: {}, // The object we will use in the AJAX response
                          tableId: null,
                          rowId: null,
                          formData: {}};

    /* Read key details from the page */

    lvDataForAfter.action = pvButtonClicked.getAttribute('data-action');
    lvDataForAfter.tableId = pvButtonClicked.getAttribute('data-table-id'); // The ID of the table we're working with (can be multiple per screen)
    if(lvDataForAfter.action === 'update') {
        lvDataForAfter.rowId = $(pvButtonClicked.closest('tr')).prop('id'); // The id of the row that's been clicked (updates only)
    }

    var lvForm = pvButtonClicked.closest('form'); // The form inside of which the clicked button sits
    var lvEndPoint = pvButtonClicked.getAttribute('data-endpoint'); // The AJAX end point we need to post to
    var lvFormGroup = pvButtonClicked.getAttribute('data-group'); // The id that links together the subset of the form's input elements that comprise the "sub form" that has actually been submitted (add and update only)

    /* Reactivate the appropriate elements' required property now that the form has submitted */

    // Blunt instrument: just set everything, since if there are ever loads to set most of them will need setting (other update rows)
    $(pvButtonClicked).closest('form').find('[data-required="true"]').prop('required',true);

    /* Append form inputs to the FormData object (and to lvDataForAfter) */

    if(lvDataForAfter.action === 'add' || lvDataForAfter.action === 'update'){
        // Get all input fields
        $(lvForm).find('[data-group="' + lvFormGroup + '"]:not([type="submit"])').each(function(pvIndex){
            if($(this).attr('type') === 'file') {
                var lvFile = $(this).get(0).files;
                if(typeof(lvFile[0]) !== 'undefined') { // we don't have to have a file for updates
                    lvFormData.append($(this).attr('name'),lvFile[0],lvFile[0].name);
                    lvDataForAfter.formData[$(this).attr('name')] = lvFile[0].name;
                }
            } else {
                lvFormData.append($(this).attr('name'),$(this).val());
                lvDataForAfter.formData[$(this).attr('name')] = $(this).val();
            }
        });
    } else if (lvDataForAfter.action === 'delete') {
        // Construct list of IDs to delete
        $(lvForm).find('input[type="checkbox"]:checked').each(function(pvIndex){
            lvFormData.append($(this).val(),$(this).val()); // suppose this should probably be an array!
            lvDataForAfter.formData[$(this).val()] = $(this).attr('name');
        });
    }
    // Extra vars we'll need on the other end of the AJAX
    lvFormData.append('action',pvButtonClicked.getAttribute('data-action')); // the button that's been clicked (add, update, delete)

    /* Get a template table row for inserting later */

    // Capture the <td> html for each column of the table we're working with, to allow us to write
    // it back to the screen later - without knowing what it is we're writing back (add only)
    if(lvDataForAfter.action === 'add') {
        $('table#' + lvDataForAfter.tableId + ' tr:eq(2) td').each(function(pvIndex){
            lvDataForAfter.tableCells[pvIndex] = $(this).wrap('<div/>').parent().html();
            $(this).unwrap();
        });
    }

    /* AJAX away! */
    $.ajax({
        type: 'post',
        url: lvEndPoint,
        data: lvFormData,
        success: function(pvArgs){form_ajxCallback(pvArgs,lvDataForAfter);},
        processData: false,
        contentType: false
    });
    return false; // prevents the form from submitting
}

/*
 * This is what's received back by the client after the AJAX call returns
 * We cater for add, update and delete commands differently
 */
function form_ajxCallback(pvArgs, pvPageData) {

    var lvLog = '';
    var lvFunctionName = 'form_ajxCallback';
    lvLog += log(gvScriptName_main,lvFunctionName,'Sending',' AJAX');

    switch(pvPageData.action) {

        /* For add commands, create a new row and append to table */
        case 'add':

            /* Create a new row element and append each of the table cells we snitched from the first row of the table to it */
            var lvNewRow = $('<tr id="row_' + pvArgs.newRecord.checkbox + '"></tr>');
            for(var i in pvPageData.tableCells) {
                $(lvNewRow).append(pvPageData.tableCells[i]);
            }

            /* Make sure the new row is set non-editable (it may have been editable when we snitched it) */
            $(lvNewRow).find('[data-action="update"]').hide();
            $(lvNewRow).find('span').show();
            $(lvNewRow).find('td').attr('data-editable','false');

            /* Update the various attributes and properties of this new row - We need it to match the row we've just inserted into the DB */
            for(var j in pvPageData.formData){
                // For each input we picked up from the form (before the AJAX was sent), find
                // the corresponding inputs in this new row and set their value / contents
                // We just call them all each time. If, say, we have j == productName, and productName is an input,
                // only the input statement will do anything.
                var lvNewValue = pvArgs.newRecord[j];
                $(lvNewRow).find('input[name="' + j + '"]').val(lvNewValue);
                $(lvNewRow).find('textarea[name="' + j + '"]').html(lvNewValue);
                $(lvNewRow).find('select[name="' + j + '"]').val(lvNewValue);
                $(lvNewRow).find('select[name="' + j + '"]').attr('data-value',lvNewValue);
                // And the spans for non-selects (although we actually update everything, and then re-update the select spans below)
                $(lvNewRow).find('span[name="' + j + '"]').html(lvNewValue);
            }
            // The spans for selects needs to get the actual value (lvNewValue is actually the ID, for dropdowns)
            $('table#' + pvPageData.tableId + ' tr:eq(1) select').each(function(){
                $(lvNewRow).find('span[name="' + $(this).attr('name') + '"]').html($(this).children('option').filter(':selected').text());
            });

            // Similarly, set all the data-group attributes. This covers the button as well
            $(lvNewRow).find('input').attr('data-group',pvArgs.newRecord.checkbox);
            $(lvNewRow).find('select').attr('data-group',pvArgs.newRecord.checkbox);

            // And finally set the checkbox ID and value
            $(lvNewRow).find('input[type="checkbox"]').prop('id',pvArgs.newRecord.checkbox);
            $(lvNewRow).find('input[type="checkbox"]').prop('value',pvArgs.newRecord.checkbox);

            /* Return the 'add new' fields to null (or a default text, if specified) */
            $('table#' + pvPageData.tableId).find('[data-action="add"]:not([type="submit"])').each(function(pvIndex){
                var lvDefaultText = $(this).attr('data-default-text');
                var lvDefaultValue = $(this).attr('data-default-value');
                if(lvDefaultText !== null && typeof (lvDefaultText) !== 'undefined'){
                    $(this).val($(this).attr('data-default-text'));
                } else if(lvDefaultValue !== null && typeof(lvDefaultValue) !== 'undefined'){
                    $(this).val($(this).attr('data-default-value'));
                } else {
                    $(this).val("");
                }
            });

            /* Make sure the (hidden) checkbox is checked otherwise form won't submit */
            // (checkbox needs to be there so automated code processes checkbox when inserting new row)
            $('table#' + pvPageData.tableId + ' tr:eq(0) td input[type="checkbox"]').prop('checked',true);

            /* Finally, append the new row to the table and make the button active again */
            $('table#' + pvPageData.tableId + '> tbody > tr').eq(1).after($(lvNewRow));
            $('input[type="submit"][data-action="add"]').prop('disabled',false);
            break;

        // For update commands, set the span and input values to match the returned row from the DB (in case the cloud code changed our input)
        // and then toggl the row to non-editable
        case 'update':
            var lvUpdatedRow = $('tr#' + pvPageData.rowId);

            /* Update the various attributes and properties of this new row - We need it to match the row we've just inserted into the DB */

            for(var k in pvPageData.formData){
                // For each input we picked up from the form (before the AJAX was sent), find
                // the corresponding inputs in this new row and set their value / contents
                // We just call them all each time. If, say, we have k == productName, and productName is an input,
                // only the input statement will do anything.

                var lvUpdatedValue = pvArgs.updatedRecord[k];

                $(lvUpdatedRow).find('input[name="' + k + '"]').val(lvUpdatedValue);
                $(lvUpdatedRow).find('textarea[name="' + k + '"],span[name="' + k + '"]').html(lvUpdatedValue);
                $(lvUpdatedRow).find('select[name="' + k + '"]').val(lvUpdatedValue);
            }
            // The spans for selects needs to get the actual value (lvUpdatedValue is actually the ID, for dropdowns)
            $(lvUpdatedRow).find('select').each(function(){
                $(lvUpdatedRow).find('span[name="' + $(this).attr('name') + '"]').html($(this).children('option').filter(':selected').text());
            });
            $(lvUpdatedRow).children('td').each(function(){
                togglRowEditable(this,'READONLY');
            });
            break;

        // For delete commands, we just need to remove each of the deleted rows
        case 'delete':
            for(var l in pvPageData.formData){
                $('input#' + l).closest('tr').remove();
            }
            $('input[type="submit"][data-action="delete"]').prop('disabled',false);
            break;

        // No other cases should occur
        default:
            lvLog += log(gvScriptName_main,lvFunctionName,'ERROR, AJAX callback received an action that wasn\'t recognised (Expected add, update or delete; got ' + pvArgs.action + ')','ERROR');
    }
}

/*
 * To edit in line, we put this function onclick on every appropraite <td>
 * Regardless of the type of input element in the cell, it swaps over the
 * readonly span with the editable input object, or vv. The actual logic
 * is split out so it can be called manually as well.
 */
function togglRowEditable_listener(){

    // if you click inside an input field (inside the cell) it triggers this event, but passes the field to event.target, not the td.
    // In these cases, do nothing
    if($(event.target).prop('tagName') === 'TD') {
        var lvClickedTableCell = $(event.target);
        togglRowEditable(lvClickedTableCell,null);
    }
}

/*
 * Toggl fields editable / non editable, based on a submit button element
 * The param gives the option of overriding and forcing it to go editable/non-editable Regardless
 * of current status. Options: EDITABLE or READONLY
 */
function togglRowEditable(pvClickedTableCell,pvForceDirection){

    var lvLog = '';
    var lvFunctionName = 'togglRowEditable (pvForceDirection == ' + pvForceDirection + ')';
    lvLog += log(gvScriptName_main,lvFunctionName,'Start','PROCS');

    // We need to establish whether we're going editable or non-editable
    var lvDirection = 'EDITABLE';
    if ((pvForceDirection === 'READONLY' || $(pvClickedTableCell).attr('data-editable') === 'true') && pvForceDirection !== 'EDITABLE'){
        lvDirection = 'READONLY';
    }

    // If we're going editable, make sure the dropdowns are populated (we don't do this on page load because it's sloooow for big tabes).
    // Go up to the nearest TR, then find all selects with a title that matches one of our dropdowns
    if(lvDirection === 'EDITABLE'){
        $(pvClickedTableCell).closest('tr').find('td[title="Product group"] > select').each(function(pvIndex){
            $(this).append($(gvProductGroupDropDownListOptions));
            $(this).val($(this).attr('data-value'));
        });
        $(pvClickedTableCell).closest('tr').find('td[title="Search category"] > select').each(function(pvIndex){
            $(this).append($(gvSearchCategoryDropDownListOptions));
            $(this).val($(this).attr('data-value'));
        });
        $(pvClickedTableCell).closest('tr').find('td[title="Brand"] > select').each(function(pvIndex){
            $(this).append($(gvBrandDropDownListOptions));
            $(this).val($(this).attr('data-value'));
        });
    }

    // If we're going editable, make sure the edit button is not disabled (if we edited already, it will be)


    // And now switch over the visibility of the input fields and the spans
    var lvRow = $(pvClickedTableCell).closest('tr');
    var lvUpdateButton = $(lvRow).find('[data-action="update"][type="submit"]');
    $(lvUpdateButton).prop('disabled',false);
    switch(lvDirection){
        case 'EDITABLE':
            // Toggle the cell we've clicked on
            $(pvClickedTableCell).attr('data-editable','true');
            $(pvClickedTableCell).find('span').hide();
            $(pvClickedTableCell).find('[data-action="update"]').show();
            // And toggle any other required fields in the row
            // Ideally this would be only unpopulated (so we can make new columns required and force the user on edit to update them). (using this command: .filter(function(){return $(this).val() === "";}))
            // but
            // I can't think of a better way than showing all of them to avoid form submission validation errors
            // To do: I'm not hiding the spans in this command :(
            $(lvRow).find('[data-required="true"]').show(); // these are all the input/selects/textareas which are required fields
            $(lvRow).find('[data-required="true"]').closest('td').attr('data-editable',"true");
            $(lvRow).find('[data-required="true"]').parent().children('span').hide(); // these are the spans sitting side by side with each of the input elements

            // Finally, show the button
            $(lvUpdateButton).show();
            break;
        case 'READONLY':
            // Toggle the cell we've clicked on.
            $(pvClickedTableCell).attr('data-editable','false');
            $(pvClickedTableCell).find('span').show();
            $(pvClickedTableCell).find('[data-action="update"]').hide();
            // Blunt instrument: just set all cells in the row to non-editable and hide all input fields.
            // To do: The spans won't need hiding (see to do above)
    //        $(lvRow).find('td[data-editable="true"]').attr('data-editable','false');
    //        $(lvRow).find('[data-action="update"]').hide();
            // If this is the last cell to be returned to non-editable, hide the button
            if(!$(lvRow).find('td[data-editable="true"]').length){
                $(lvUpdateButton).hide();
            }
            break;
    }
}

function filterTable_listener(){

    // Start by showing everything
    $('#table_data tr').each(function(){
        $(this).show();
    });

    // Then go through each filter field, and if it's set, hide the non-matching rows
    $('[data-action="filter"]').each(function(){
        var lvFilterField = $(this);
        $('select[name="' + $(lvFilterField).attr('name') + '"][data-action="update"]').each(function(){
            if($(lvFilterField).val() !== null) {
                if($(this).attr('data-value') !== $(lvFilterField).val()) {
                    $(this).closest('tr').hide();
                }
            }
        });
    });
}
