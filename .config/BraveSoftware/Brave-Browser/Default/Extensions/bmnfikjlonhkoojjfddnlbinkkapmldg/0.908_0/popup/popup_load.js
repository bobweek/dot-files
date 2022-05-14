/*<BRW> START: part to be replaced depending on Browser*/
//always listen to messages
chrome.runtime.onMessage.addListener(BINPopup.handleMessage);

/*-----------*/
/*Global data*/
/*-----------*/
/* Global variables are used here, because they only exist in the popup context, and since the Safari way of changing the popup is to directly access these variables */

//variable to indicate whether the popup is ready to take more data
var isReady = true;

//stores data obtained from background script
var bibData = null;

//link to array containing all the bibField data
var bibFieldData = null;

//link to json object storing display options, parseMode means 0 = Bibtex, 1 = RIS, 2 = Endnote, 3 = Arnold S., 4 = Barnold S.
var displayOptions = null;
var generalOptions = null;
var redirectionSchemes = null;
var currentFormat = -1;

/*----------------*/
/*Initialize popup*/
/*----------------*/

//initialize and get data, message only relevant for Safari
BINPopup.retreiveContent({name: "first" , message: ""});