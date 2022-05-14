//did not see how to make it a const in Safari, since Safari ?needs? to access it via the window (grrrrrr!!!!11!!)
const BINInteraction = ( function () {
	
	//variable for parsedData, in order to reuse it if it has not changed
	var parsedData = { msgType: "background_bibdata_popup" , tab_id: "" , citation_download_status: 0 };

	// example bibfield array for bibkey parsing
	const exampleBibData = Object.freeze([/*0*/"article",/*1*/"Ill Be Bach",/*2*/"Ill Be Bach",/*3*/[["Dough","Jr.","John"],["Ishnet","Ken"],["Weissenrunda","Sr.","Arnold"]],"",
					     /*5*/"Dir Gazettel",/*6*/"Dir Gazettel",/*7*/"Gaz.",/*8*/"",/*9*/"20",/*10*/"11",/*11*/"",/*12*/"1234-3039",/*13*/"1960",/*14*/"Jan",/*15*/"10.1100/testDoi",/*16*/"https://testdomain.com",/*17*/"Sun Hollymetal",/*18*/"Sun Hollymetal",/*19*/"",/*20*/"",/*21*/"",/*22*/"1960/01/23",/*23*/"1",/*24*/"42",/*25*/"",/*26*/"Friedrich Fröbel Hauptschule",
					     /*27*/"", /*28*/["J.","K.","A."], /*29*/["J.","K.","A."], /*30*/"", /*31*/["Choppaaa","Mac"], /*32*/"", /*33*/"",/*34*/"",/*35*/"January",/*36*/"2018",/*37*/"Apr",/*38*/"04",/*39*/"30",/*40*/"Sun Hollymetal",/*41*/"Friedrich Fröbel Hauptschule",/*42*/"Some database",/*43*/"SDB",/*44*/"978-TestISBN",/*45*/"",/*46*/"1",/*47*/"Gaz",/*48*/"",/*49*/"Langenscheiss",/*50*/"978-012345678-6",/*51*/"1960-01-23",/*52*/"1960-01-23",/*53*/"English",/*54*/"en",/*55*/"eng",/*56*/"eng",/*57*/"eng",/*58*/["Weissenrunda","Sr.","Arnold"],/*59*/["J.","K.","A."],/*60*/"Friedrich Fröbel Hauptschule",/*61*/"",/*62*/"Ill Be Bach",/*63*/"Sun Hollymetal",/*64*/"",/*65*/"",/*66*/"Dir Gazettel",/*67*/"Gaz.",/*68*/"Gaz",/*69*/"",/*70*/"",/*71*/"",/*72*/"",/*73*/"",/*74*/"",/*75*/"",/*76*/"",/*77*/"",/*78*/""]);
	
	// number of bibfields to be parsed later
	const numBibFields = exampleBibData.length;
	
	//const bibFields = Object.freeze([/*0*/"type",/*1*/"title",/*2*/"title_latex",/*3*/"author",/*4*/"author_latex",/*5*/"journal",/*6*/"journal_latex",/*7*/"journal_abbrev",/*8*/"journal_abbrev_latex",/*9*/"volume",/*10*/"issue",/*11*/"page",/*12*/"issn",/*13*/"year",/*14*/"month",/*15*/"doi",/*16*/"url",/*17*/"publisher",/*18*/"publisher_latex",/*19*/"archivePrefix",/*20*/"eprint",/*21*/"bibkey",/*22*/"date",/*23*/"start_page",/*24*/"end_page",/*25*/"note",/*26*/"school",/*27*/"school_latex", /*28*/"auth_initials", /*29*/"auth_initials_latex", /*30*/"query_summary", /*31*/"keywords", /*32*/"keywords_latex", /*33*/"abstract",/*34*/"abstract_latex",/*35*/"month_full",/*36*/\"access_year\",/*37*/\"access_month_abbrev\",/*38*/\"access_month_number\",/*39*/\"access_day\",/*40*/\"publisher_short\",/*41*/\"school_short\",/*42*/\"database\",/*43*/\"database_short\",/*44*/\"isbn\",/*45*/\"bibkey_custom\",/*46*/\"month_number\",/*47*/\"journal_abbrev_nodot\",/*48*/\"journal_abbrev_nodot_latex\",/*49*/\"channel\",/*50*/\"isbn_nodash\",/*51*/\"iso_date\",/*52*/\"urldate\",/*53*/\"lang_full\",/*54*/\"lang_iso1\",/*55*/\"lang_iso2t\",/*56*/\"lang_iso2b\",/*57*/\"lang_iso3\",/*58*/"author_mixed",/*59*/"auth_initials_mixed",/*60*/"school_mixed",/*61*/unused,/*62*/"title_mixed",/*63*/"publisher_mixed",/*64*/"keywords_mixed",/*65*/"abstract_mixed",/*66*/"journal_mixed",/*67*/"journal_abbrev_mixed",/*68*/"journal_abbrev_nodot_mixed",/*69*/"author_relaxed",/*70*/"auth_initials_relaxed"]);
	
	//variable to store option page tab id
	var optionPageId = null;
	var lastWorkingTabId = null;
	
	//flag that allows auto copy once if true
	var allowAutoCopy = false;
	var allowAutoDownload = false;
	
	
	/*common functions for all browsers*/
	
	// empty handler, do nothing
	function doNothing(message) {
		return;//blupp
	}
	
	// function to update display options
	function updateDisplayOptions(parseMode, options) {
		
		//return if parsemode and options not valid
		if (options == null || typeof(options) != 'object' || parseMode == null || parseMode < 0) return;
		
		//now get display options
		const dispOpts = BINData.getDisplayOptions();
		
		//figure out if parse mode should also be reset
		if (options.setParseMode != null) dispOpts.parseMode = parseMode;
		
		//now update all properties specific to parseMode if available
		const dispOptsArray = dispOpts.optionArray[parseMode];
		if (dispOptsArray != null && typeof(dispOptsArray) == 'object') {
			for (let option in options) {
				let value = options[option];
				if (dispOptsArray.hasOwnProperty(option) && value != null && value != undefined) {
					dispOptsArray[option] = value;
				}
			}
		}
		
		//save options in browser storage, trust that api will only overwrite existing entries
		saveOptions({ displayOptions: dispOpts}, doNothing);
	}
	
	// function to update general options
	function updateGeneralOptions(options) {
		
		//function to set bibkey format, using either a list or a format string
		function setBibkeyFormat(format) {
			
			//early out for invalid format
			if (format == null) return;
		
			//proceed depending on whether format is an array or a string. If an array, parse together with the string, otherwise parse the string to array and string
			if (typeof(format) == 'string') {
				format = BINParser.parseFormatString(format,BINData.getBibfieldNumbers());
				//if valid (re-)parse, reassign
				if (format != null) {
					BINData.setBibkeyFormat(format.array);
					BINData.setBibkeyFormatString(format.string);
				}
			}
		}
		
		//return if parsemode and options not valid
		if (options == null || typeof(options) != 'object') return;
			
		//now get general options
		const genOpts = BINData.getGeneralOptions();
		
		//now update all properties
		for (let option in options) {
			let value = options[option];
			if (genOpts.hasOwnProperty(option) && value != null && value != undefined) {
				if (option != "bibkeyFormatString") {
					genOpts[option] = value;
				} else {
					setBibkeyFormat(value);
				}
			}
		}
		
		//save options in browser storage, trust that api will only overwrite existing entries
		saveOptions({ generalOptions: genOpts}, doNothing);
	}
	
	// function to add,edit or replace redirection schemes
	function updateRedirectionSchemes(index,scheme,removeAll = false) {
		
		//get redirection schemes and their strings
		let schemes = BINData.getRedirectionSchemes(), schemeStrings = BINData.getRedirectionFormatStrings();
		
		//early out if no valid index array
		if (index == null || typeof(index) != 'number') return { index: -1 , currentScheme: schemes.currentScheme , scheme: null , formatString: null };
		
		//now proceed depending on combination of index, scheme and removeAll flags
		let temp = schemes.schemes.length;
		if (removeAll) {
			
			//reset schemes
			BINData.setRedirectionSchemes({ schemes: [] , currentScheme: -2 });
			BINData.setRedirectionFormats([]);
			BINData.setRedirectionFormatStrings([]);
			
			//set return value
			scheme = { index: -1 , currentScheme: -2 , scheme: null , formatString: null };
			
		} else if (index > -1 && index < temp) {
			
			//if index within valid range, remove (scheme == null) or edit
			if (scheme != null) {
				if (typeof(scheme) == 'object' && scheme.name != null && typeof(scheme.name) == 'string' && scheme.name.length > 0) {
					//edit scheme and format string if valid
					temp = schemes.schemes[index];
					const props = BINData.getRedirectionSchemeTemplate();
					for (let i = 0; i<props.length; ++i) {
						let prop = props[i][0];
						let value = scheme[prop];
						if (value != null && typeof(value) == props[i][1] && value != temp[prop]) {
							//reset scheme property
							temp[prop] = value;
						}
					}
					
					//sanitize white space replacement char
					let reparse = scheme.whiteSpaceReplacement;
					if (reparse.length > 1) {
						scheme.whiteSpaceReplacement = reparse.slice(0,1);
					}
					
					//reparse format if necessary
					reparse = scheme.formatString;
					if (reparse != schemeStrings[index]) {
						reparse = BINParser.parseFormatString(reparse,BINData.getBibfieldNumbers());
						if (reparse != null) {
							schemeStrings[index] = reparse.string;
							BINData.getRedirectionFormats()[index] = reparse.array;
						} else {
							schemeStrings[index] = "";
							BINData.getRedirectionFormats()[index] = ["Not available"];
						}
					}
					scheme = temp;
					temp = schemeStrings[index];
				} else {
					scheme = null; index = -1; temp = null;//indicate invalid attempt to update
				}
			} else {
				//remove scheme, format and format string
				schemes.schemes.splice(index,1);
				BINData.getRedirectionFormats().splice(index,1);
				schemeStrings.splice(index,1);
				
				//adjust current index if necessary
				if (index <= schemes.currentScheme) schemes.currentScheme--;
				if (schemes.currentScheme == -1) schemes.currentScheme = -2;
				
				//return values
				scheme = null; temp = null;
			}
			//set return value
			scheme = { index: index , currentScheme: schemes.currentScheme , scheme: scheme , formatString: temp };
			
		} else if (scheme != null && typeof(scheme) == 'object' && scheme.name != null && typeof(scheme.name) == 'string' && scheme.name.length > 0) {
			
			//otherwise, check if scheme is valid to add
			let valid = true;
			const props = BINData.getRedirectionSchemeTemplate();
			const newScheme = {};
			for (let i = 0; i<props.length; ++i) {
				let prop = props[i][0];
				let value = scheme[prop];
				if (value == null || typeof(value) != props[i][1]) {
					valid = false;
					break;
				} else {
					newScheme[prop] = value;
				}
			}
			
			//add scheme if valid
			if (valid) {
				
				//add clean scheme without additional unrecognized properties
				newScheme.formatString = scheme.formatString;
				scheme = newScheme;
								
				//sanitize white space replacement char
				valid = scheme.whiteSpaceReplacement;
				if (valid.length > 1) {
					scheme.whiteSpaceReplacement = valid.slice(0,1);
				}
				
				//reparse format string
				valid = BINParser.parseFormatString(scheme.formatString,BINData.getBibfieldNumbers());
				
				//add
				if (valid != null) {
					temp = valid.string;
					schemeStrings.push(temp);
					BINData.getRedirectionFormats().push(valid.array);
				} else {
					//indicate that redirection scheme does not work
					temp = "";
					schemeStrings.push(temp);
					BINData.getRedirectionFormats().push(["Not available"]);
				}
				index = schemes.schemes.length;
				schemes.schemes.push(scheme);
			} else {
				scheme = null; index = -1; temp = null;
			}
			
			//set return value
			scheme = { index: index , currentScheme: schemes.currentScheme , scheme: scheme , formatString: temp };
			
		} else {
			scheme = { index: -1 , currentScheme: schemes.currentScheme , scheme: null , formatString: null };
		}
		
		//save redirection schemes and format strings in browser storage, trust that api will only overwrite existing entries
		saveOptions({ redirectionSchemes: BINData.getRedirectionSchemes()}, doNothing);
		saveOptions({ redirectionSchemeFormatStrings: BINData.getRedirectionFormatStrings()}, doNothing);
				
		//return
		return scheme;
	}
	
	// function to add,edit or replace citation formats
	function updateCitationFormats(index,format,removeAll = false) {

		//get citation formats
		let formats = BINData.getCitationFormats();

		//early out if no valid index array or
		if (index == null || typeof(index) != 'number') return { index: -1 , currentFormat: formats.currentFormat , format: null , currentFormatSource: null  };
			
		//now proceed depending on combination of index, format and removeAll flags
		let temp = formats.formats.length;
		if (removeAll) {
			
			//reset formats
			BINData.setCitationFormats({ formats: [] , currentFormat: -1 });
			
			//set return value
			format = { index: -1 , currentFormat: -1 , format: null , currentFormatSource: null  };
			
		} else if (index > -1 && index < temp) {
			
			//if index within valid range, remove (format == null) or edit
			if (format != null) {
				
				if (typeof(format) == 'object' && format.name != null && typeof(format.name) == 'string' && format.name.length > 0 && format.extension != null && typeof(format.extension) == 'string' && format.extension.length > 0 && format.encoding != null && typeof(format.encoding) == 'string' && format.encoding.length > 0 && format.formatSource != null && (typeof(format.formatSource) == 'string' || typeof(format.formatSource) == 'object')) {
					
					//edit format name, extension, encoding
					formats.formats[index].name = format.name;
					formats.formats[index].extension = format.extension;
					formats.formats[index].encoding = format.encoding;
			
					//next validate if proper format array
					format = format.formatSource;

					//stringify if object
					if (typeof(format) == 'object') {
						try {
							format = JSON.stringify(format,null,'\t');
						} catch(error) {
							format = null;
						}
					}
					temp = format;
					if (format != null) {

						if (typeof(format) == "string") {
							format = BINParser.validateFormatSource(format,BINData.getBibfieldStrings(),BINData.getBibfieldNumbers());
						} else {
							format = null;
						}
					}
			
					if (format != null && typeof(format) == 'object') {
						temp = format.formatSource;
						formats.formats[index].formatArray = format.array;
					} else {
						temp = null;
					}
					format = { name: formats.formats[index].name , extension: formats.formats[index].extension , encoding: formats.formats[index].encoding };
					
				} else {
					format = { name: formats.formats[index].name , extension: formats.formats[index].extension , encoding: formats.formats[index].encoding }; 
					temp = null;//indicate invalid attempt to update
				}
			} else {
				//remove format
				formats.formats.splice(index,1);
				
				//adjust current index if necessary
				if (index <= formats.currentFormat) formats.currentFormat--;
				if (formats.currentFormat == -1) formats.currentFormat = -1;
			
				//get format source
				let newIndex = index;
				if (newIndex > 0) newIndex--;
				if (!(newIndex < 0)) {
					try {
						temp = JSON.stringify(formats.formats[newIndex].formatArray,null,'\t');
					} catch(error) {
						temp = "[\n\n]";
					}
				}
				
				//return values
				format = null;
			}

			//set return value
			format = { index: index , currentFormat: formats.currentFormat , format: format , currentFormatSource: temp };
			
		} else if (format != null && typeof(format) == 'object' && format.name != null && typeof(format.name) == 'string' && format.name.length > 0 && format.extension != null && typeof(format.extension) == 'string' && format.extension.length > 0 && format.encoding != null && typeof(format.encoding) == 'string' && format.encoding.length > 0 && format.formatSource != null) {
			
			//otherwise, add new format
			const newFormat = { name: format.name , extension: format.extension , encoding: format.encoding , formatArray: [] };
			
			//next validate if proper format array
			format = format.formatSource;

			//stringify if object
			if (typeof(format) == 'object') {
				try {
					format = JSON.stringify(format,null,'\t');
				} catch(error) {
					format = null;
				}
			}
			if (format != null) {
				if (typeof(format) == "string") {
					format = BINParser.validateFormatSource(format,BINData.getBibfieldStrings(),BINData.getBibfieldNumbers());
				} else if (Array.isArray(format)) {
					let newForm = [];
					format = BINParser.parseFormatArray(format,newForm,BINData.getBibfieldStrings(),BINData.getBibfieldNumbers());
					if (format != null) {
						try {
							temp = JSON.stringify(newForm,null,'\t');
						} catch(error) {
							temp = null;
						}
						if (temp != null) {
							format = { array: newForm , formatSource: temp };
						}
					}
				} else {
					format = null;
				}
			}
			if (format != null && typeof(format) == 'object') {
				temp = format.formatSource;
				newFormat["formatArray"] = format.array;
			} else {
				 temp = "[\n\n]";
			}
			format = { name: newFormat.name , extension: newFormat.extension , encoding: newFormat.encoding };
			
			//add to formats 
			formats.formats.push(newFormat);
			
			//set return value
			format = { index: index , currentFormat: formats.currentFormat , format: format , currentFormatSource: temp };
			
		} else {
			format = { index: -1 , currentFormat: formats.currentFormat , format: null , currentFormatSource: null };
		}
		
		//save citation formats in browser storage, trust that api will only overwrite existing entries
		saveOptions({ citationFormats: BINData.getCitationFormats()}, doNothing);
		
		//return
		return format;
	}
	
	// function to set redirection scheme
	function setRedirectionScheme(currentScheme,parsedData) {
		
		let schemes = BINData.getRedirectionSchemes();
		if (schemes == null || typeof(schemes) != 'object') return null; 
		
		//early out if no (valid) change
		if (currentScheme == null || typeof(currentScheme) != 'number' || currentScheme < -2 || currentScheme > schemes.schemes.length - 1) return null;
		
		//reset current active scheme
		schemes.currentScheme = currentScheme;
		
		//save redirection schemes in browser storage, trust that api will only overwrite existing entries
		saveOptions({ redirectionSchemes: schemes }, doNothing);
		
		//early out if parsedData not available
		if (parsedData == null || typeof(parsedData) != 'object') return null;
		
		//parse redirection link
		if (currentScheme > -1) {
			schemes = schemes.schemes[currentScheme];
			if (schemes != null) {
				schemes = BINParser.parseRedirectionLink(parsedData.bibFields,BINData.getCurrentRedirectionFormat(),schemes.whiteSpaceReplacement);
			}
		} else {
			schemes = null;
		}
		parsedData["redirectionLink"] = schemes;
		
		// return info
		return schemes;
	}
	
	// function to set citation format
	function setCitationFormat(currentFormat,parsedData) {
		
		let formats = BINData.getCitationFormats();
		if (formats == null || typeof(formats) != 'object') return null;
		
		//early out if no (valid) change
		if (currentFormat == null || typeof(currentFormat) != 'number' || currentFormat < -1 || currentFormat > formats.formats.length - 1) return null;
		
		//reset current active format
		formats.currentFormat = currentFormat;
		
		//save citation formats in browser storage, trust that api will only overwrite existing entries
		saveOptions({ citationFormats: formats }, doNothing);
		
		//early out if parsedData not available
		if (parsedData == null || typeof(parsedData) != 'object') return null;
		
		//parse citation format
		if (currentFormat > -1) {
			formats = formats.formats[currentFormat];
			if (formats != null && (formats = formats.formatArray) != null && Array.isArray(formats)) {
				formats = BINParser.applyFormat(formats,parsedData.bibFields,BINData.getBibfieldNumbers());
			} else {
				formats = null;
			}
		} else {
			formats = null;
		}
		
		// return parsed format
		return formats;
	}
	
	// function to flush all globals for new fetch
	function flushAllGlobals() {

		//flush parsed data for next fetch
		parsedData = { msgType: "background_bibdata_popup" , tab_id: "" , citation_download_status: 0  };
		
		//reset global prefselector object
		BINPrefselector = null;
		
		//remove any preformatting and prefselector script
		let element = document.getElementById("preformatting");
		if (element != null) element.parentNode.removeChild(element);
		element = document.getElementById("prefselecting");
		if (element != null) element.parentNode.removeChild(element);
	}

	// function to load preformatting script
	function loadAdjusterScripts(sourceList) {
		
		//script element ids and preformatting flag
		const elemIds = ["prefselecting","preformatting"];
		let preformatting = false;

		//if sources available, add scripts
		for (let i = 0; i<2; ++i) {
			let source = sourceList[i];
			if (source != null && source != "") {
				
				//add script object
				let scrObj = document.createElement( 'script' );
				
				//set prefselectorSource and id
				scrObj.setAttribute( 'src', source );
				scrObj.setAttribute( 'id', elemIds[i] );
				
				//append script, later assumed that prefselectorMsg is returned by prefselector script
				document.body.appendChild(scrObj);
				if (i == 1) preformatting = true;
			}
		}
		
		return preformatting;
	}
	
	// function to handle unparsed meta data
	function handleMetaData(metaData) {
		
		//first check whether there is any data to parse
		if (metaData == undefined || metaData == null) {
			onNotExtractable(null);
			return;
		} else {
			
			//make domain and top-level-domain accessible in link-formatting and citation preformatting
			metaData["citation_domain"] = parsedData["domain"] || "";
			metaData["citation_top_level_domain"] = parsedData["top_level_domain"] || "";
			
			//If dynamic download option and preformatting activated (SECURITY, only on trusted domains!), check if citation download link is available and send data back to extractor with formatted link. Otherwise simply parse data, store into "content" of parsedData
			const options = BINData.getGeneralOptions();
			if (options != null && options["dyn_download"]) {
					
				// signal popup that dynamic citation download is in principle active, but maybe not for this site
				parsedData["citation_download_status"] = 1;
				
				//get download link. Proceed with request only if link valid, and if preformatting activated (security reasons)
				let link = metaData["citation_download"];
				if (link != null && link != "" && parsedData["preformatting"]) {
					
					//format citation download link and request method
					let formatLink = BINPrefselector; 
					if (formatLink != null && typeof formatLink != 'undefined') {
						formatLink = formatLink.formatCitationLink;
						if (formatLink != null && typeof formatLink != 'undefined') {
							metaData["citation_download_method"] = "GET";
							link = formatLink(metaData,link);
							if (metaData["citation_download_method"] != "POST") metaData["citation_download_method"] = "GET";
						}
					}
					if (link != null && link != "") {
						
						// if formatting successful, signal popup that dynamic citation download is active for the given website. Status 2 means failed, status 3 means successful
						parsedData["citation_download_status"] = 2;
						
						//prepare info sent to extractor for citation download
						let timeout = options["dyn_download_timeout"];
						let requestBody = metaData["citation_download_requestbody"];
						formatLink = { msgType: "background_request_citation_download_extractor" , citation_download: link , citation_download_method: metaData["citation_download_method"] , citation_download_timeout: timeout , citation_download_requestbody: requestBody , citation_download_content_type: metaData["citation_download_content_type"] , citation_download_cookie: metaData["citation_download_cookie"] };
						
						//signal popup if an additional web request is happening. Also send timeout value
						sendMsg({ msgType: "background_clicking_citation_button_popup", timeout: timeout },doNothing);
						
						//now request citation download
						requestCitationDownload(parsedData, formatLink, metaData);
						
						//end function here in case of asynchronous citation download request
						return;
						
					}
				}
			}
			//if download not wanted, proceed directly with parsing the obtained meta data
			parseMetaData(null, metaData);
		}
	}
	
	// function to update bibkey
	function updateBibkey(parsedData) {
		
		//early out for invalid input
		if (parsedData == null || !Array.isArray(parsedData) || parsedData.length == 0) return;
		
		//if desired, replace by custom bibkey, otherwise reset to empty string
		parsedData[45] = "";
		if (BINData.getGeneralOptions().bibkeyFormatting) {
			let bibkey = BINParser.applyFormat(BINData.getBibkeyFormat(),parsedData);
			if (bibkey == null) return;
			bibkey = BINResources.sanitizeBibkey(bibkey,BINData.getGeneralOptions().bibkeyWhiteSpace);
			if (bibkey != null && bibkey.length > 0) parsedData[45] = bibkey;
		}
		
		//exit
		return;
	}
	
	// function to signal popup that data could not be extracted or that the popup must be reopened, different logic on Safari
	function onNotExtractable(error) {

        //send message
		sendMsg({msgType: "background_notextractable_popup"},doNothing);
	}
	
	//always listen to messages
	chrome.runtime.onMessage.addListener(handleMessage);
	
	//listen to auto-copy shortcut
	chrome.commands.onCommand.addListener(function (command) {
			if (chrome.runtime.lastError) {
					doNothing();
			} else {
				if (command === "browser_action_autocopy") {
					//open extension popup with ability to perform auto copy
					allowAutoCopy = true;
					chrome.browserAction.openPopup(
						function(response) {
							if (chrome.runtime.lastError) {
								doNothing();
							} else {
								doNothing();
							}
						}
					);
				} else if (command === "browser_action_autodownload") {
					//open extension popup with ability to perform auto copy
					allowAutoDownload = true;
					chrome.browserAction.openPopup(
						function(response) {
							if (chrome.runtime.lastError) {
								doNothing();
							} else {
								doNothing();
							}
						}
					);
				}
			}
		}
	);
	
	//listen to tab updates and removals
	chrome.tabs.onUpdated.addListener(updateCache);
	chrome.tabs.onRemoved.addListener(updateTab);
	
	//omnixbox configuration
	
	//default text
	chrome.omnibox.setDefaultSuggestion({
		description: "Type in a DOI to let BibItNow! create a DOI link"
	});
	chrome.omnibox.onInputStarted.addListener(function() {
		chrome.omnibox.setDefaultSuggestion({
			description: "Type in a DOI to let BibItNow! create a DOI link"
		});
	});
	
	//suggest empty array, deal with doi instead in onInputEntered event
	chrome.omnibox.onInputChanged.addListener((input, suggest) => {
		chrome.omnibox.setDefaultSuggestion({
			description: "Type in a DOI to let BibItNow! create a DOI link"
		});
		suggest([]);
	});
	
	//update browser tab
	chrome.omnibox.onInputEntered.addListener((url, disposition) => {
		//check if description a doi
		url = BINResources.cleanDOI(url);
		
		//if doi, create DOI link and open in tab
		if (url != null && typeof(url) == 'string' && url.length > 0) {
			url = "https://doi.org/" + url;
			switch (disposition) {
				case "currentTab":
					chrome.tabs.update({url});
					break;
				case "newForegroundTab":
					chrome.tabs.create({url});
					break;
				case "newBackgroundTab":
					chrome.tabs.create({url, active: false});
					break;
			}
		}
	});
	//cache
	var parsedDataContainer = { dummy: "" };
	
    //function to execute script
    function injectScript(tabId,filename,onFulfilled,onError) {
            chrome.tabs.executeScript(tabId, { file: filename }, function(response) {
                    if (chrome.runtime.lastError) {
                        console.error(chrome.runtime.lastError);
                    } else {
                        onFulfilled(response);
                    }
                }
            );
    }
    
    // function to send messages
	function sendMsg(message, handler, tabId = null, errorHandler = null) {
        if (tabId == null || typeof(tabId) != 'number') {
            chrome.runtime.sendMessage(message, function(response) {
                    if (chrome.runtime.lastError) {
                        console.error(chrome.runtime.lastError);
                    } else {
                        handler(response);
                    }
                }
            );
        } else {
            chrome.tabs.sendMessage(tabId, message, function(response) {
                    if (chrome.runtime.lastError) {
                        console.error(chrome.runtime.lastError);
                    } else {
                        handler(response);
                    }
                }
            );
        }
	}
    
    // function to create tab
    function createTab(url,handler,active=false,errorHandler=null) {
        //open option page, assign tab id if opened, in order to close it next time
		chrome.tabs.create( { url: url , active: active }, function(tab) {
				if (chrome.runtime.lastError) {
					console.error(chrome.runtime.lastError);
				} else {
                    handler(tab);
				}
			}
		);
    }
    
	function updateCache(tabId, changeInfo, tabInfo) {
		parsedDataContainer["tab_"+tabId] = null;
	}
	
	//update all for specific tab
	function updateTab(tabId, removeInfo) {
		
		//update cache
		parsedDataContainer["tab_"+tabId] = null;
		
		//switch tab if necessary and possible
		if (optionPageId != null && tabId == optionPageId) {
			optionPageId = null;
			if (BINData.getGeneralOptions().backNavigation && lastWorkingTabId != null) {
				chrome.tabs.update( lastWorkingTabId, { active: true });
			}
		} else if (tabId == lastWorkingTabId) {
			lastWorkingTabId = null;
		}
	}
	
	//function to reset tab memory
	function resetTabMemory(activeInfo) {
		chrome.tabs.onActivated.removeListener(resetTabMemory);
		if (optionPageId == null || activeInfo.tabId != optionPageId) {
			lastWorkingTabId = null;
		}
	}
	
	//flush cache
	function flushCache() {
		parsedDataContainer = { dummy: "" };
	}
	
	// function to open option page
	function openOptionPage(anchor = "") {
		
		//get current working tab if possible
		let tabId = parsedData["tab_id"].slice(4);
		if (tabId != null && tabId != "") tabId = parseInt(tabId);
		if (tabId == null || tabId != tabId) tabId = null;
		
		//set tab memory
		lastWorkingTabId = tabId;
		
		//get option page base url
		let optionPageURL = chrome.extension.getURL(descriptionPageLocation);
		
		//close option page previously opened
		if (optionPageId != null) {
			
			//temporarily remove listening to removed tabs
			chrome.tabs.onRemoved.removeListener(updateTab);
			
			chrome.tabs.remove(optionPageId, function(response) {
					//catch error
					if (chrome.runtime.lastError) {
						//do nothing, probably just means tab has been closed before
					}
					//set optionPage id to null in any case
					optionPageId = null;
					chrome.tabs.onRemoved.addListener(updateTab);
				}
			);
		}
		
		//sanitize anchor
		if (anchor != null && typeof(anchor) == 'string' && anchor.length > 0) optionPageURL += "#" + anchor;
		  
		//open option page, assign tab id if opened, in order to close it next time
		chrome.tabs.create( { url: optionPageURL }, function(tab) {
				if (chrome.runtime.lastError) {
					console.error(chrome.runtime.lastError);
				} else {
					optionPageId = tab.id;
					chrome.tabs.onActivated.addListener(resetTabMemory);
				}
			}
		);
	}
	
	//function to save options to storage
	function saveOptions(opts, handler) {
		chrome.storage.local.set(opts, function(response) {
				if (chrome.runtime.lastError) {
					console.error(chrome.runtime.lastError);
				} else {
					handler(response);
				}
			}
		);
	}

	//function to initiate data extraction request
	function initDataExtractionRequest(clear) {
		//get currently active tab and prepare data request	
		chrome.tabs.query({currentWindow: true, active: true}, function(response) {
				if (chrome.runtime.lastError) {
					console.error(chrome.runtime.lastError);
				} else {
					prepareDataExtractionRequest(response,clear);
				}
			}
		);
		
	}

// 	// function to inject script
// 	function prepareDataExtraction(tabId,clear) {
// 		
// 		function responseFunction(response) {
// 			if (chrome.runtime.lastError) {
// 				onNotExtractable(chrome.runtime.lastError);
// 			} else {
// 				loadSiteAdjusters(response);
// 			}
// 		}
// 		
// 		if (clear) {
// 			chrome.tabs.sendMessage(tabId, { msgType: "background_request_url_extractor" }, responseFunction);
// 		} else {
// 			chrome.tabs.executeScript(tabId, { file: "/extractors/bib_meta.js" }, responseFunction);
// 		}
// 	}
// 	
// 	// function to signal citation download request to content script
// 	function requestCitationDownload(parsedData, downloadInstructions, metaData) {
// 		let tabId = parseInt(parsedData["tab_id"].slice(4));
// 		chrome.tabs.sendMessage(tabId, downloadInstructions, function(downloadData) {
// 				if (chrome.runtime.lastError) {
// 					parseMetaData(null, metaData);
// 				} else {
// 					validateCitationDownload(downloadData, metaData);
// 				}
// 			}
// 		);
// 	}
// 	
// 	// function to request data from tab. Initiates parsing and sends parsed data to popup on positive response
// 	function requestDataExtraction(tabId,prefselectorMsg) {
// 		chrome.tabs.sendMessage(tabId, prefselectorMsg, function(response) {
// 				if (chrome.runtime.lastError) {
// 					onNotExtractable(chrome.runtime.lastError);
// 				} else {
// 					handleMetaData(response);
// 				}
// 			}
// 		);
// 	}
	
	//location of description page
	const descriptionPageLocation = "/description.html"
    
    // function to inject meta extractor script
	function prepareDataExtraction(tabId, tabURL, clear) {
		// load site adjusters upon url response        
		// do not reinject if reload button used, but simply send a message and/or reload site adjuster depending on whether it is a pdf or not
        
        //error handler
        function handleError(error) {
            let url = tabURL != null ? "" + tabURL : "";
            loadSiteAdjusters([url]);
        }
        
        if (clear) {
            sendMsg({ msgType: "background_request_url_extractor" },function(arr) { loadSiteAdjusters(arr); },tabId, handleError);
        } else {
            injectScript(tabId,"/extractors/bib_meta.js",function(arr) { loadSiteAdjusters(arr); }, handleError);
        }
	}
    
    // function to signal citation download request to content script
	function requestCitationDownload(parsedData, downloadInstructions, metaData) {
        let tabId = parsedData["tab_id"];
        sendMsg(downloadInstructions,
            function (downloadData) {
				validateCitationDownload(downloadData, metaData);
            },
            parseInt(tabId.slice(4)),
            function () {
				parseMetaData(null, metaData);
			}
        );
	}
    
    // function to request data from tab. Initiates parsing and sends parsed data to popup on positive response
	function requestDataExtraction(tabId,prefselectorMsg) {
        
        //helper function to handle meta
        function handleResponse(metaData) {
            //check if automatic pdf fallback
            let pdfFallback;
            let enablePDFFallback = BINData.getGeneralOptions();
            let automaticPDFFallback = (enablePDFFallback.pdfFallbackAutomatic);
            enablePDFFallback = enablePDFFallback.pdfFallback;
            if ((enablePDFFallback && automaticPDFFallback && prefselectorMsg["automaticPDFFallback"] != null && prefselectorMsg["automaticPDFFallback"] == true) || prefselectorMsg == null || (pdfFallback = prefselectorMsg["pdfFallback"]) == null || pdfFallback.length == 0) {
                //fix for Firefox below version 50
                if (metaData != null) {
                    if (metaData[0] != null && typeof(metaData[0]) == 'object') metaData = metaData[0];
                        
                    //process metaData
                    handleMetaData(metaData);
                } else {
                    onNotExtractable(null);
                }
            } else {
                //signal that fallback or automatic fallback is turned off even though available
                sendMsg({ msgType: "background_load_abstract_page_popup" , pdfFallback: prefselectorMsg["pdfFallback"] , pdfFallbackForced: automaticPDFFallback , enablePDFFallback: enablePDFFallback },function(response) { if (!response) onNotExtractable(null) } );
            }
        }
        //send to extractor
        sendMsg(prefselectorMsg,handleResponse,tabId,
                function(error) {
                    let pdfFallback;
                    if (prefselectorMsg == null || (pdfFallback = prefselectorMsg["pdfFallback"]) == null || pdfFallback.length == 0) {
                        onNotExtractable(null);
                    } else {
                        sendMsg({ msgType: "background_load_abstract_page_popup" , pdfFallback: pdfFallback , pdfFallbackForced: true , enablePDFFallback: BINData.getGeneralOptions().pdfFallback },function(response) { if (!response) onNotExtractable(null) } );
                    }
                }
        );
	}
    
	// function to load site adjusters
	function loadSiteAdjusters(prefselector) {
        
		//get current working tab
		const tabId = parseInt(parsedData["tab_id"].slice(4));
        
		//fix for Firefox above 75
		if (prefselector == undefined) {
			onNotExtractable(null);
			return;
		}
		
		//fix for Firefox below version 50
		let curURL = prefselector[0];
		if (curURL == undefined || curURL == null) curURL = prefselector;
					
		//return immediately if no url specified
		if (curURL == undefined || curURL == null || curURL == "") {
			onNotExtractable(null);
			return;
		}
		
		
		//check if pdf viewer
//         let pdfFallback = false;
//         curURL = curURL.replace(/[\s]+;ISPDF[\s]*$/i, 
//             function(match, offset, original) {
//                 if (match != null && match.length > 0) {
//                     pdfFallback = true;
//                     return "";
//                 }
//             }
//         );
        prefselector = BINData.getGeneralOptions();
        let enablePDFFallback = prefselector.pdfFallback;
        let pdfFallback = curURL;
        
		// find adjuster scripts from url
		if (prefselector.urlCorrection == true) {
			prefselector = BINURLMatcher.getAdjusters(curURL,BINData.getUrlSpecificAdjusterList(),prefselector.urlCorrectionScheme,true,prefselector.urlCorrectionInsensitive);
		} else {
			prefselector = BINURLMatcher.getAdjusters(curURL,BINData.getUrlSpecificAdjusterList());
		}
		
		//if url registered, make another xml request to obtain prefselectors and load preformatting script, and then request data from content script in a separate step. Otherwise, simply request data from content script
		parsedData["preformatting"] = false;
		if (prefselector != null) {
			
			//save domain and top-level domain temporarily in parsedData
			parsedData["domain"] = prefselector.domain;
			parsedData["top_level_domain"] = prefselector.top;
			
			//temporarily save names for preformatting script in curURL
			curURL = prefselector.preformatter;
			prefselector = prefselector.prefselector;
			
			//preformatting script
			if (curURL != null && curURL != "") curURL = "/background/preformatters/" + curURL + ".js";
			
			//prefselector script
			if (prefselector != null && prefselector != "") prefselector = "/extractors/prefselectors/" + prefselector + ".js";
			
			//load scripts
			parsedData["preformatting"] = loadAdjusterScripts([prefselector,curURL]);
		}
		
		
		//get prefselector
		prefselector = document.getElementById("prefselecting");
                
        //send data extraction request once script is injected and prefselecting script is either loaded or determined to not be available
		if (prefselector == null) {
			// request data extraction without preferred selectors, deal with pdf case here
            requestDataExtraction(tabId, { msgType: "background_request_bibdata_extractor" , dateKeywords: BINParser.getDateKeywords() , pdfFallback: "" , enablePDFFallback: enablePDFFallback });

		} else {
            
			prefselector.onload = function () { 
				//set preferred selectors
				let prefselectorMsg;
				if (BINPrefselector == null || typeof BINPrefselector == 'undefined') {
					prefselectorMsg = { msgType: "background_request_bibdata_extractor" };
				} else {
					prefselectorMsg = BINPrefselector.prefselectorMsg;
					if (prefselectorMsg == null || typeof(prefselectorMsg) != 'object') prefselectorMsg = {};
					
					// add msgType if not already included
					prefselectorMsg["msgType"] = "background_request_bibdata_extractor";
					
					// add date keywords
					prefselectorMsg["dateKeywords"] = BINParser.getDateKeywords();
                    
                    //tell meta extractor whether pdf fallback is wanted
                    prefselectorMsg["enablePDFFallback"] = enablePDFFallback;
                    
                    //set default for page-specific automatic pdf fallback
                    prefselectorMsg["automaticPDFFallback"] = true;
                    
                    //get fallback url, make sure that untrusted fallback URL function only changes the path, not the domain (since in Firefox, the fallback url is opened via a click, same-origin policy does not apply by default in Firefox, so a manual check is needed)
                    if (pdfFallback != "") {
                        let domNoPath = pdfFallback.replace(/^[^\:\/]*[\:\/\s]*/i,"").replace(/\/.*$/gi,"");
                        pdfFallback = (BINPrefselector.getFallbackURL != null) ? BINPrefselector.getFallbackURL(pdfFallback) : "";
                        pdfFallback = pdfFallback != null && typeof(pdfFallback) == 'string' && pdfFallback.length > 0 ? pdfFallback.replace(/[\.]+pdf[\s]*$/gi,"") : "";
                        if (pdfFallback != "") {
                            if (domNoPath != pdfFallback.replace(/^[^\:\/]*[\:\/\s]*/i,"").replace(/[\s]*\/.*$/gi,"")) {
                                pdfFallback = "";
                            }
                        }
                    }
                    prefselectorMsg["pdfFallback"] = pdfFallback;
                    
                    //inform popup of pdf fallback mode
                    if (pdfFallback != "") sendMsg({ msgType: "background_load_abstract_page_popup" },doNothing);
				}
				
				// adjusted data extraction request
				requestDataExtraction(tabId, prefselectorMsg); 
			};
		}
	}
	
	// take working tab and prepare data extraction or send parsed data to popup if cached! Different logic on Safari
	function prepareDataExtractionRequest(tabObj, clear) {
		
		//return immediately if tabs object not defined
		if (tabObj == null || tabObj == undefined || !(tabObj.length > 0)) {
			onNotExtractable(null);
			return;
		}
        
		//make sure to set tab as active
		tabObj[0].active = true;
		
		//determine tab and clear cache if wanted
		let tabURL = tabObj[0];
        tabObj = tabURL.id;
        tabURL = tabURL.url;
        
		if (clear) updateCache(tabObj,null,null);
		
		//temporary string for tab
		const tabStr = "tab_" + tabObj;
		
		//check if already stored and send stored. Otherwise, retreive from injected script if valid url.
		if (parsedDataContainer[tabStr] == null) {

            //flush all globals to prepare request
			flushAllGlobals();
			
			//temporarily save current tab in parsed data
			parsedData["tab_id"] = tabStr;
			
			//prepare extraction request
			prepareDataExtraction(tabObj,tabURL,clear);

		} else {

            //update tab id and custom bibkey of cached data
			tabObj = parsedDataContainer[tabStr];
			parsedData["tab_id"] = tabObj.tab_id;
			updateBibkey(tabObj.bibFields);
			
			//update redirection link of cached data
			let scheme = BINData.getCurrentRedirectionScheme();
			if (scheme > -1) {
				scheme = BINData.getRedirectionSchemes().schemes[scheme].whiteSpaceReplacement;
			} else {
				scheme = "+";
			}
			tabObj["redirectionLink"] = BINParser.parseRedirectionLink(tabObj.bibFields,BINData.getCurrentRedirectionFormat(),scheme);
			
			//get custom format if necesssary
			let formats = BINData.getCitationFormats();
			if (formats != null && typeof(formats) == 'object' && (formats = formats.currentFormat) != null && typeof(formats) == 'number' && formats > -1) {
				formats = BINData.getCurrentCitationFormat();
				if (formats != null && typeof(formats) == 'object' && (formats = formats.formatArray) != null && Array.isArray(formats)) {
					formats = BINParser.applyFormat(formats,tabObj.bibFields,BINData.getBibfieldNumbers());
					if (formats != null && typeof(formats) == 'string') {
						tabObj["customFormat"] = formats;
					}
				}
			}
			
			//send cached data to popup
			sendMsg(parsedDataContainer[tabStr],doNothing);
		}
	}
	
	// function that checks citation download, repeats request and sanitizes if necessary
	function validateCitationDownload(downloadData, metaData) {
		//check download status. if -2, then try another request from global context. The latter, however, only works on the same context as the active tab, or on whitelisted URLs
		if (downloadData != null && downloadData["citation_download_status"] == -2) {
            //check if permission request needed
            try {
                let citation = new XMLHttpRequest();
                citation.onreadystatechange = function() {
                    
                    if (this.readyState == 4) {
                        let result = downloadData;
                        if (this.status == 200) {
                            result["citation_download"] = this.responseText.slice(0,200000); //restrict size to be dealt with later
                            result["citation_download_status"] = result["citation_download"] != null && result["citation_download"] != "" ? 3 : 2; //signal whether the request has worked
                            parseMetaData(result, metaData);
                        } else {
                            parseMetaData(null, metaData);
                        }
                        
                    }
                };
                citation.open(downloadData["citation_download_method"], downloadData["citation_download"], true);
                citation.timeout = downloadData["citation_download_timeout"];
                citation.responseType = 'text';
                citation.withCredentials = true;
                
                //get content type
                let headerContent = metaData["citation_download_content_type"];
                if (headerContent != null && typeof(headerContent) == 'string' && headerContent.length > 0) {
                    citation.setRequestHeader("Content-Type", headerContent);
                }
                
                //get cookie cookie policy
                headerContent = metaData["citation_download_cookie"];
                if (headerContent != null && typeof(headerContent) == 'string' && headerContent.length > 0) {
                    citation.setRequestHeader("Content-Type", headerContent);
                }

                //get request body from metaData again
                if (metaData["citation_download_requestbody"] != "") {
                    citation.send(metaData["citation_download_requestbody"]);
                } else {
                    citation.send();
                }
            } catch(exception) {
                parseMetaData(null, metaData);
            }
		} else {
			parseMetaData(downloadData, metaData);
		}
	}
	
	//parse meta data and send to popup, not possible to send messages to popup on Safari
	function parseMetaData(downloadData, metaData) {
        
		//proceed only if metaData available
		if (metaData == null || typeof(metaData) != 'object') {
			onNotExtractable(null);
			return;
		}
		
		//fix for Firefox below version 50
		if (downloadData != null) {
			if (downloadData[0] != null && typeof(downloadData[0]) == 'object') downloadData = downloadData[0];
		}
		
		
		//parse from request data and store into "content" of parsedData
		
		//set default values for citation download properties
		metaData["citation_download"] = "";
		metaData["citation_download_status"] = 1;
		if (downloadData != null && typeof(downloadData) == 'object') {
			
			// copy download data into meta data, so that it can be used in parser
			metaData["citation_download"] = downloadData["citation_download"];
			metaData["citation_download_timeout"] = downloadData["citation_download_timeout"];
			downloadData = downloadData["citation_download_status"];
			
			//indicate whether download has worked
			if (downloadData != null && downloadData != undefined && downloadData > 0) {
				metaData["citation_download_status"] = downloadData;
				parsedData["citation_download_status"] = downloadData;
			}
		}
		
		// fill bibFields array with empty strings, numBibField is a constant defined above
		const bibFields = [];
		for (let i = 0; i<numBibFields; ++i) {
			bibFields[i] = "";
		}
		parsedData["bibFields"] = bibFields;
		
		// save link to data in cache
		parsedDataContainer[parsedData["tab_id"]] = parsedData;
		
		// parse data and send to popup
		BINParser.parseMetaData(metaData, parsedData);
		
		// suppress citation url if suppression option checked
		if (BINData.getGeneralOptions().suppressUrl) parsedData.bibFields[16] = "";
		
		// update custom bibkey
		updateBibkey(parsedData.bibFields);
		
		// set redirection link with white space replacement
		let scheme = BINData.getCurrentRedirectionScheme();
		if (scheme > -1) {
			scheme = BINData.getRedirectionSchemes().schemes[scheme].whiteSpaceReplacement;
		} else {
			scheme = "+";
		}
		parsedData["redirectionLink"] = BINParser.parseRedirectionLink(parsedData.bibFields,BINData.getCurrentRedirectionFormat(),scheme);
		
		//get custom format if necesssary
		let formats = BINData.getCitationFormats();
		if (formats != null && typeof(formats) == 'object' && (formats = formats.currentFormat) != null && typeof(formats) == 'number' && formats > -1) {
			formats = BINData.getCurrentCitationFormat();
			if (formats != null && typeof(formats) == 'object' && (formats = formats.formatArray) != null && Array.isArray(formats)) {
				formats = BINParser.applyFormat(formats,parsedData.bibFields,BINData.getBibfieldNumbers());
				if (formats != null && typeof(formats) == 'string') {
					parsedData["customFormat"] = formats;
				}
			}
		}
		
		// send message to popup
		sendMsg(parsedData, doNothing);
	}
	
	function handleMessage(request, sender, sendResponse) {
		switch(request.msgType) {
			case "popup_retreive_bibdata_background":
				//send data to popup, only reparse if necessary or wanted
				if (BINData.isReady()) initDataExtractionRequest(request.clear);
			
				//send acknowledgement response to avoid error messages
				sendResponse( { received: true } );
				
				return true;
				
			case "update_display_options_background":
				
				//update display option data
				if (BINData.isReady()) updateDisplayOptions(request.parseMode,request.options);
			
				//send acknowledgement response to avoid error messages
				sendResponse( { received: true } );
				
				return true;
			
			case "request_options_background":
				//send current display options, general options and redirection schemes back to requesting party
				if (BINData.isReady()) {

					//prepare response
					const response = { displayOptions: BINData.getDisplayOptions() , generalOptions: BINData.getGeneralOptions() , redirectionSchemes: BINData.getRedirectionSchemes() , enableAutoCopy: allowAutoCopy, enableAutoDownload: allowAutoDownload};
					
					//add format strings for option page
					if (request.getFormatStrings != null && request.getFormatStrings) response["redirectionSchemeFormatStrings"] = BINData.getRedirectionFormatStrings();
					
					//add citation format names, current citation format and the source of the current format
					if (request.getCitationFormats != null && request.getCitationFormats) {
						response["citationFormats"] = { currentFormat: -1 , currentFormatSource: "", formats: [] };
						request = BINData.getCitationFormats();
						if (request != null && typeof(request) == 'object') {
							if (request.currentFormat != null && typeof(request.currentFormat) == 'number') {
								response.citationFormats.currentFormat = request.currentFormat;
							}
							request = request.formats;
							if (request != null && Array.isArray(request) && request.length > 0) {
								for (let i = 0; i<request.length; ++i) {
									response.citationFormats.formats.push( { name: request[i].name , extension: request[i].extension , encoding: request[i].encoding } );
								}
							}
							//parse formatSource if available. Choose current format if set
							if (response.citationFormats.formats.length > 0) {
								let formatIndex = response.citationFormats.currentFormat;
								if (formatIndex < 0) formatIndex = 0;
								request = request[formatIndex].formatArray;
								if (request != null && Array.isArray(request) && request.length > 0) {
									try {
										request = JSON.stringify(request,null, '\t');
									} catch(error) {
										request = null;
									}
									if (request != null && typeof(request) == 'string') response.citationFormats.currentFormatSource = request;
								}
							}
						}
						
					}
					
					//send response
					sendResponse( response );
				} else {
					//send in any case acknowledgement response to avoid error messages
					sendResponse( { received: true } );
				}
				
				//reset auto copy/download flag
				allowAutoCopy = false;
				allowAutoDownload = false;
				
				return true;
			
			case "set_redirection_scheme_background":
				//reset and reparse redirection link
				if (BINData.isReady()) {
					
					//set new scheme
					let scheme = request.tab;
					if (scheme != null) scheme = parsedDataContainer[scheme];
					
					//if not yet in cache
					if (scheme == null) scheme = parsedData;
			
					//set redirection scheme
					scheme = setRedirectionScheme(request.currentScheme,scheme);
					
					//send back link if reset
					if (scheme != null) {
						sendResponse( { link: scheme } );
					} else {
						sendResponse( { received: true } );
					}
				} else {
					//send in any case acknowledgement response to avoid error messages
					sendResponse( { received: true } );
				}
			
				return true;
			case "set_citation_format_background":
				//reset and reparse data according to format
				if (BINData.isReady()) {
					
					//get parsed data
					let data = request.tab;
					
					if (data != null) data = parsedDataContainer[data];
					
					//if not yet in cache
					if (data == null) data = parsedData;
					
					//set citation format and reparse
					data = setCitationFormat(request.currentFormat,data);
					
					//send back data if reset
					if (data != null) {
						sendResponse( { data: data } );
					} else {
						sendResponse( { received: true } );
					}
				} else {
					//send in any case acknowledgement response to avoid error messages
					sendResponse( { received: true } );
				}
			
				return true;
			case "request_citation_format_source_background":
				//reset and reparse data according to format
				if (BINData.isReady()) {
					
					//get formats
					let formats = BINData.getCitationFormats();
					if (formats != null && typeof(formats) == 'object') {
						let index = request.index;
						if (typeof(index) != 'number' || index >= formats.formats.length || index < -1) index = formats.currentFormat;
						formats = formats.formats;
						if (index > -1) {
							formats = formats[index];
							if (formats != null && typeof(formats) == 'object' && (formats = formats.formatArray) != null && Array.isArray(formats)) {
								try {
									formats = JSON.stringify(formats,null,'\t');
								} catch(error) {
									formats = null;
								}
							} else {
								formats = null;
							}
							
						} else {
							let formArray = [];
							let sourceString;
							for (let i = 0; i<formats.length; ++i) {
								sourceString = formats[i];
								if (sourceString != null && typeof(sourceString) == 'object' && (sourceString = sourceString.formatArray) != null && Array.isArray(sourceString)) {
									try {
										sourceString = JSON.stringify(sourceString,null,'\t');
									} catch(error) {
										continue;
									}
									if (sourceString != null && typeof(sourceString) == 'string') {
										formArray.push(sourceString);
									}
								}
							}
							formats = null;
							if (formArray.length > 0) {
								formats = formArray;
							}
						}
						
					} else {
						sendResponse( { received: true } );
					}

					if (formats != null && (typeof(formats) == 'string' || Array.isArray(formats))) {
						sendResponse( { formatSource: formats } );
					} else {
						sendResponse( { received: true } );
					}
				} else {
					//send in any case acknowledgement response to avoid error messages
					sendResponse( { received: true } );
				}
			
				return true;
			case "popup_open_optionpage_background":
				//open options page
				if (BINData.isReady()) openOptionPage(request.anchor);
				
				//send response	
				sendResponse( { received: true } );
			
				return true;
			case "update_options_background":
				
				//update general option data
				if (BINData.isReady()) updateGeneralOptions(request.options);
				
				//send acknowledgement response to avoid error messages
				sendResponse( { received: true } );
				
				return true;
                
			case "update_clipboard_access_background":
				
				//update general option data
				if (BINData.isReady()) setClipboardPermission(request.text_autocopy);
				
				//send acknowledgement response to avoid error messages
				sendResponse( { received: true } );
				
				return true;
				
			case "test_bibkeyformat_background":
				
				//update general option data, and then send bibkey format
				if (BINData.isReady()) {
						let formatString = request.options.bibkeyFormatString;
						let exampleBibkey = null;
						if (formatString != BINData.getBibkeyFormatString()) {
							exampleBibkey = BINParser.parseFormatString(formatString,BINData.getBibfieldNumbers());
							if (exampleBibkey != null) {
								exampleBibkey = exampleBibkey.array;
							}
						} else {
							exampleBibkey = BINData.getBibkeyFormat();
						}
						exampleBibkey = BINResources.sanitizeBibkey(BINParser.applyFormat(exampleBibkey,exampleBibData),BINData.getGeneralOptions().bibkeyWhiteSpace);
						sendResponse({ exampleBibkey: exampleBibkey });
				} else {
					//send in any case acknowledgement response to avoid error messages
					sendResponse( { received: true } );
				}
			
				return true;
				
			case "update_bibkeyformat_background":
				
				//update general option data, and then send bibkey format string
				if (BINData.isReady()) {
					updateGeneralOptions(request.options);
					sendResponse({ bibkeyFormatString: BINData.getBibkeyFormatString() });
				} else {
					//send in any case acknowledgement response to avoid error messages
					sendResponse( { received: true } );
				}
			
				return true;
				
			case "update_redirection_schemes_background":
				//update redirection schemes
				if (BINData.isReady()) {
					//update redirection schemes in background
					let removeAll = (request.removeAll == true);
					let success = null;
					
					//proceed depending on what to do
					if (request.scheme == null || !Array.isArray(request.scheme)) {
						//add/remove single entry or remove all
						success = updateRedirectionSchemes(request.index, request.scheme, removeAll);
					} else {
						//add all schemes in scheme array
						const schemes = request.scheme;
						const numSchemes = schemes.length;
						
						if (numSchemes > 0) {
							
							//check if schemes available
							let index = BINData.getRedirectionFormatStrings();
							
							//reset redirection schemes if none available
							if (index == null) {
								BINData.setRedirectionSchemes({ schemes: [] , currentScheme: -2 });
								BINData.setRedirectionFormats([]);
								BINData.setRedirectionFormatStrings([]);
							}
							
							//get number of format strings
							index = index.length;
							
							//now add all schemes, sanitize per scheme using the update function
							let validSchemes = [], validStrings = [];
							for (let i = 0; i<numSchemes; ++i) {
								success = updateRedirectionSchemes(index, schemes[i], false);
								if (success.index > -1) {
									index = success.index + 1;
									validSchemes.push(success.scheme);
									validStrings.push(success.formatString);
								}
							}
							//signal import by returning all valid schemes and strings
							success.scheme = validSchemes; success.formatString = validStrings;	
						}
					}
					//send back updated redirection schemes
					if (success != null) {
						sendResponse( { index: success.index , currentScheme: success.currentScheme , scheme: success.scheme , formatString: success.formatString , removeAll: removeAll } );
					} else {
						sendResponse( { received: true } );
					}
				} else {
					//send in any case acknowledgement response to avoid error messages
					sendResponse( { received: true } );
				}
				
				//send in any case acknowledgement response to avoid error messages
				sendResponse( { received: true } );
				
				return true;
			case "update_citation_formats_background":
				
				//update citation formats
				if (BINData.isReady()) {
					
					//update citation formats in background
					let removeAll = (request.removeAll == true);
                    let isCSL = (request.isCSL == true);
					let success = null;
					
					//proceed depending on what to do
					if (request.format == null || (!Array.isArray(request.format) && typeof(request.format) != 'string')) {
                        
						//add/remove single entry or remove all
						success = updateCitationFormats(request.index, request.format, removeAll);
					} else {
						//add all formats in format array
						const formats = request.format;
						let numFormats = 0;
						if (isCSL == true) {
                            
                            //convert CSL, let user choose between inline citation and bibliography via isInline term
                            let layoutArr = [{ name: "chooseStyle" , req: false, bibfields: [ [ [{ term: "isInline" , req: true}],true,[],"",[] ] , [ ["isBibliography"], true, [],"",[] ] ] }];
//                             BINCSL.importCSL(formats,[layoutArr[0].bibfields[0][2],layoutArr[0].bibfields[1][2]],layoutArr);
                            success = null;
                            
                        } else if ((numFormats = formats.length) > 0) {
							
							//check if schemes available
							let index = BINData.getCitationFormats();
							
							//reset citation formats if none available
							if (index == null) {
								BINData.setCitationFormats({ formats: [] , currentFormat: -1 });
							}
							
							//get number of formats
							index = index.length;
							
							//now add all formats, sanitize per format using the update function
							let validFormats = [];
							let formatSource = "";
							for (let i = 0; i<numFormats; ++i) {
								success = updateCitationFormats(index, formats[i], false);
								if (success.index > -1) {
									index = success.index + 1;
									validFormats.push(success.format);
									formatSource = success.formatSource;
								}
							}
							//signal import by returning all valid formats and current source
							success.format = validFormats; success.currentFormatSource = formatSource;
						}
					}
					//send back updated citation formats
					if (success != null) {
						sendResponse( { index: success.index , currentFormat: success.currentFormat , currentFormatSource: success.currentFormatSource , format: success.format , removeAll: removeAll } );
					} else {
						sendResponse( { received: true, isCSL: isCSL , convertedCSL: (isCSL ? {} : null) } );
					}
				} else {
					//send in any case acknowledgement response to avoid error messages
                    sendResponse( { received: true } );
				}
				
				//send in any case acknowledgement response to avoid error messages
				sendResponse( { received: true } );
				
				return true;
		}
	}
}());
