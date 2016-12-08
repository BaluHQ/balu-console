/***************************************
 * Description:  Client side javscript *
 ***************************************/

/*
* Global variables
*/

/* Logging control */
var gvScriptName = 'mainCS';

/*
 * Initialise the script
 */
(function initialise(){

    var lvFunctionName = 'initialise';
    log(gvScriptName + '.' + lvFunctionName + ': Start','INITS');

    // Do everything when the DOM is ready
    $(document).ready(function(){

        /*
         * Initialise Foundation Scripts
         */
        $(document).foundation('accordion','reflow');

        /*
         * Listeners
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
        });

        /* <td> listeners to toggl inline editing on and off */

        $(document.body).on('click','[data-inline-edit="true"]',togglRowEditable_listener);

    },false);

})();

/*************
 * Listeners *
 *************/

/*
 * Form submission listener - generic for all screens based on a standard table (or multiple tables) of data
 */
function buttonClick_listener(pvButtonClicked){

    var lvFunctionName = 'formSubmit_listener';
    log(gvScriptName + '.' + lvFunctionName + ': Sending','LSTNR');

    // to to: stop double click

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
            log(gvScriptName + '.' + lvFunctionName + ': ERROR, button onclick listener received an action that wasn\'t recognised (Expected add, update or delete; got ' + $(pvButtonClicked).attr('data-action') + ')','ERROR');
    }
}


/*
 * Form submission listener - generic for all screens based on a standard table (or multiple tables) of data
 */
function formSubmit_listener(pvButtonClicked) {

    var lvFunctionName = 'formSubmit_listener';
    log(gvScriptName + '.' + lvFunctionName + ': Start','LSTNR');


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
            lvFormData.append($(this).attr('name'),$(this).val());
            lvDataForAfter.formData[$(this).val()] = $(this).attr('name');
        });
    }
    // Extra vars we'll need on the other end of the AJAX
    lvFormData.append('action',pvButtonClicked.getAttribute('data-action')); // the button that's been clicked (add, update, delete)

    /* Get a template table row for inserting later */

    // Capture the <td> html for each column of the table we're working with, to allow us to write
    // it back to the screen later - without knowing what it is we're writing back (add only)
    if(lvDataForAfter.action === 'add') {
        $('table#' + lvDataForAfter.tableId + ' tr:eq(1) td').each(function(pvIndex){
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

    var lvFunctionName = 'form_ajxCallback';
    log(gvScriptName + '.' + lvFunctionName + ': Receiving',' AJAX');
    switch(pvPageData.action) {

        /* For add commands, create a new row and append to table */
        case 'add':

            /* Create a new row element and append each of the table cells we snitched from the first row of the table to it */
            var lvNewRow = $('<tr id="row_categoryWebsiteJoins_' + pvPageData.rowId + '"></tr>');
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
                var lvNewKey = pvArgs.newRecord[j].key;
                var lvNewValue = pvArgs.newRecord[j].value || pvArgs.newRecord[j]; // If it's a select, we'll have key/value pair sent back from model
                $(lvNewRow).find('input[name="' + j + '"]').val(lvNewValue);
                $(lvNewRow).find('textarea[name="' + j + '"],span[name="' + j + '"]').html(lvNewValue);
                $(lvNewRow).find('select[name="' + j + '"]').val(lvNewKey);
            }

            // Similarly, set all the data-group attributes. This covers the button as well
            $(lvNewRow).find('input').attr('data-group',pvArgs.newRecord.checkbox);
            $(lvNewRow).find('select').attr('data-group',pvArgs.newRecord.checkbox);

            // And finally set the checkbox ID
            $(lvNewRow).find('input[type="checkbox"]').prop('id',pvArgs.newRecord.checkbox); // select elements need the key setting, not the value

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

            /* Finally, append the new row to the table */
            $('table#' + pvPageData.tableId + '> tbody > tr').eq(0).after($(lvNewRow));

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
                var lvUpdatedKey = pvArgs.updatedRecord[k].key;
                var lvUpdatedValue = pvArgs.updatedRecord[k].value || pvArgs.updatedRecord[k]; // If it's a select, we'll have key/value pair sent back from model
                $(lvUpdatedRow).find('input[name="' + k + '"]').val(lvUpdatedValue);
                $(lvUpdatedRow).find('textarea[name="' + j + '"],span[name="' + k + '"]').html(lvUpdatedValue);
                $(lvUpdatedRow).find('select[name="' + k + '"]').val(lvUpdatedKey);
            }
            $(lvUpdatedRow).children('td').each(function(){
                togglRowEditable(this,'READONLY');
            });
            break;

        // For delete commands, we just need to remove each of the deleted rows
        case 'delete':
            for(var l in pvPageData.formData){
                $('input#' + l).closest('tr').remove();
            }
            break;

        // No other cases should occur
        default:
            log(gvScriptName + '.' + lvFunctionName + ': ERROR, AJAX callback received an action that wasn\'t recognised (Expected add, update or delete; got ' + pvArgs.action + ')','ERROR');
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

        var lvFunctionName = 'togglRowEditable';
        log(gvScriptName + '.' + lvFunctionName + ': Start','PROCS');

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

    var lvFunctionName = 'togglRowEditable (pvForceDirection == ' + pvForceDirection + ')';
    log(gvScriptName + '.' + lvFunctionName + ': Start','PROCS');

    // We need to establish whether we're going editable or non-editable
    var lvDirection = 'EDITABLE';
    if ((pvForceDirection === 'READONLY' || $(pvClickedTableCell).attr('data-editable') === 'true') && pvForceDirection !== 'EDITABLE'){
        lvDirection = 'READONLY';
    }

    // And now switch over the visibility of the input fields and the spans
    var lvRow = $(pvClickedTableCell).closest('tr');
    var lvUpdateButton = $(lvRow).find('[data-action="update"][type="submit"]');
    switch(lvDirection){
        case 'EDITABLE':
            // Toggle the cell we've clicked on
            $(pvClickedTableCell).attr('data-editable','true');
            $(pvClickedTableCell).find('span').hide();
            $(pvClickedTableCell).find('[data-action="update"]').show();
            // And toggle any other required fields in the row
            // Ideally this would be only unpopulated (so we can make new columns required and force the user on edit to update them). (using this command: .filter(function(){return $(this).val() === "";}))
            // but
            // I can't think of a better way that showing all of them to avoid form submission validation errors
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
