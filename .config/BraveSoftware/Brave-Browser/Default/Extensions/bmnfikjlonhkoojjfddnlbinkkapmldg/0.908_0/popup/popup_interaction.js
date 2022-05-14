const BINPopup = ( function () {
	
	//references to parser objects
	const parserList = [BINBibtex,BINRisEnd,BINRisEnd,BINBarnoldS,BINBarnoldS,BINApa,BINMla];
	const customFormats = [];
	
	//reference to advanced option page, set to null to indicate that it needs to be rebuilt
	var advancedOptionPage = null;
	
	//global variable for copy message timeout
	var copyTimeOut = null;
	
	//global variable for focus interval 
	var focusInterval = null;
	
	//global variable signaling auto-download
	var autoDownload = false;
	
	// function to send messages
	function sendMsg(message, handler) {
		chrome.runtime.sendMessage(message, function(response) {
				
				if (chrome.runtime.lastError) {
					console.error(chrome.runtime.lastError);
				} else {
					setReadyState(true);
					handler(response);
				}
			}
		);
	}
	
	// function to set download link. Needs to be browser dependent because of lack of proper download property support in Safari
	function setDownloadLink(downloadLink, content, charset, ext) {
		
		//file name
		let filename = bibFieldData[45];
		if (filename.length == 0) filename = bibFieldData[21];
		filename = filename + "." + ext;
		
		let objURL = URL.createObjectURL(new File([new Blob([content])], filename, {type: 'application/'+ext}));
		downloadLink.href = objURL;
		downloadLink.download = filename;
		if (autoDownload == true) {
			autoDownload = false;
			downloadLink.click();
			
			//display visual cue for download
			showCopyMessage(2);
		}
	}
	
	function requestNaturePermission() {
        chrome.permissions.request({ origins: ['*://citation-needed.springer.com/*'] },  
            function(allow) {
                allow = (allow == true);
                generalOptions.allowNatureSpringer = allow;
                sendMsg({ msgType: "update_options_background", options: { allowNatureSpringer: allow }}, doNothing);
            }
        );
    }
	
	function queryOptionalPermissions(message) {
        chrome.permissions.contains({ origins: ['*://citation-needed.springer.com/*'] },  
            function(allow) {
                allow = (allow == true);
                generalOptions.allowNatureSpringer = allow;
                sendMsg({ msgType: "update_options_background", options: { allowNatureSpringer: allow }}, doNothing);
            }
        );
        chrome.permissions.contains({ permissions: ["clipboardWrite"] },  
            function(allow) {
                allow = (allow == true);
                generalOptions["text_autocopy"] = (allow && (message.enableAutoCopy == true || generalOptions["text_autocopy_always"]));
                sendMsg({ msgType: "update_options_background", options: { text_autocopy: allow }}, doNothing);
            }
        );
    }
	
	//css selector that changes text area highlight color, depends on browser
	const cssHighlightColorSelector = "selection";
	const permRef = chrome.permissions;


	
    //function to handle pdf fall back mode
	function processPDFFallback(pdfFallback,pdfFallbackForced,enablePDFFallback) {
        //if no fall back, cancel
        if (pdfFallback == null || pdfFallback == "") return false;
        pdfFallbackForced = pdfFallbackForced == null ? false : (pdfFallbackForced == true);
        enablePDFFallback = enablePDFFallback == null ? false : (enablePDFFallback == true);
        
        //otherwise warn user
        let message = "";
        if (!enablePDFFallback) {
            message += "Cannot read reliable citation data from pdf document. To instead obtain citation data from the abstract page,\n\n" + pdfFallback + "\n\nturn on the \"PDF fallback mode\" on the \"Global Options\" page.";
        } else if (pdfFallbackForced) {
            message += "Cannot read reliable citation data from pdf document. Click \"LOAD\" to manually load the abstract page,\n\n" + pdfFallback + "\n\ncontaining the associated citation data, into a new tab.";
        } else {
            message += "Automatic preload of abstract page associated with pdf document is deactivated. Click \"LOAD\" to manually load the abstract page\n\n" + pdfFallback + "\n\ncontaining the associated citation data into a new tab.\nYou can enable automatic preloading under \"PDF fallback mode\" on the \"Global Options\" page.";
        }
        document.getElementById("textToCopy").value = message;
        
        //activate button
        if (enablePDFFallback) {
            const reloadButton = document.querySelector(".reloadCitation");
            reloadButton.innerText = "LOAD";
            reloadButton.style["font-weight"] = "bold";
            reloadButton.title = "Open new tab with site " + pdfFallback;
        }
        setReadyState(true);
        
        return true;
    }

	// function to open options page
	function openOptionPage(anchor = "") {
		
		//send message to background telling it to open option page, close popup when finished
		sendMsg({ msgType: "popup_open_optionpage_background" , anchor: anchor }, function() { window.close() });
	}

	// handle only parsed bib or error
	function handleMessage(request, sender, sendResponse) {
		
		switch(request.msgType) {
			case "background_bibdata_popup":
				
				//save data
				bibData = request;
				
				//link to data of individual bibfields
				bibFieldData = bibData.bibFields;
				if (bibFieldData == null || !(Array.isArray(bibFieldData)) || bibFieldData.length < 1) bibFieldData = null;
				
				//set redirection link
				setRedirectionLink({ link: bibData.redirectionLink });
				
				//rebuild popup depending on which format
				rebuildPopup(1);
				
				//send acknowledgement response to avoid error messages
				sendResponse( { received: true } );
				break;
			case "background_notextractable_popup":
				//signal in text area that data extraction was not possible
				document.getElementById("textToCopy").value = 'Error: Could not extract source data from page in active tab.';
				
				//set download status to "Site disabled"
				setCitationDownloadIndicator(1);
				
				//enable popup for more data extraction
				setReadyState(true);
				
				//send acknowledgement response to avoid error messages
				sendResponse( { received: true } );
				break;
			case "background_clicking_citation_button_popup":
				//set download status to "In progress..."
				setCitationDownloadIndicator(-1);
				
				//signal in text area that data plugin now attempts to "click citation button for you". State timeout in seconds
				setDownloadTimeoutIndicator(request.timeout);
				
				//send acknowledgement response to avoid error messages
				sendResponse( { received: true } );
				break;
            case "background_load_abstract_page_popup":
                //set download status to "Load abstract page..."
                let indicator = request.enablePDFFallback;
                let pdfFallback = request.pdfFallback;
                indicator = (indicator != null && indicator == true);
                if (pdfFallback != null) {
                    setCitationDownloadIndicator(indicator ? -3 : -4);
                }
                
                //process pdfFallback
				let cont = processPDFFallback(pdfFallback,request.pdfFallbackForced,indicator);
				
				//send acknowledgement response to avoid error messages
				sendResponse( { continue: cont } );
				break;
		}
	}
	
	// function to close popup programmatically. href argument kept, since important on Safari
	function closePopup(href) {
		//needs to be asynchronous, since doi link otherwise not functional on some operating systems
		window.setTimeout( function() {
			window.close();
			}, 200
		);
	}
	
	//ask for bibliography data
	function prepareParser(message) {
		
		//copy display options
		displayOptions = message.displayOptions;
		generalOptions = message.generalOptions;
		redirectionSchemes = message.redirectionSchemes;
		currentFormat = message.citationFormats.currentFormat;
		
        //query permission for springer
        queryOptionalPermissions(message);
        
		//adjust autocopy behavior depending on how popup is opened
		generalOptions["text_autocopy"] = (generalOptions["text_autocopy"] && (message.enableAutoCopy == true || generalOptions["text_autocopy_always"]));
		
		//hide bobbels in background
		if (!generalOptions["bobbels"]) document.getElementById("background-container").style.display = "none";
		
		//get autodownload behavior
		autoDownload = (message.enableAutoDownload == true);
		
		//adjust inner text of copy button depending on how it is configured
		const copyButton = document.getElementById("copyToClipboard");
		if (generalOptions["copy_button_link"] == true) {
			copyButton.innerText = "Copy redirection link";
			copyButton.style["font-size"] = "0.35cm";
		} else {
			copyButton.innerText = "Copy citation text";
			copyButton.style["font-size"] = "0.4cm";
		}
		
		//fill custom format array
		if ((message = message.citationFormats) != null && (message = message.formats) != null && Array.isArray(message)) {
			let length = message.length;
			customFormats.splice(0,customFormats.length);
			for (let i = 0; i<length; i++) {
				let format = message[i];
				if (format != null && typeof(format) == 'object') customFormats.push(format);
			}
		}
		
		//adjust currentFormat if necessary
		if (currentFormat == null || typeof(currentFormat) != 'number' || currentFormat < -1 || currentFormat >= customFormats.length) currentFormat = -1;
		  
		//adjust selected parser depending on current format and number of custom formats
		let parseMode = displayOptions.parseMode - parserList.length;
		if (parseMode != currentFormat) {
			if (currentFormat > -1) {
				parseMode = parserList.length + currentFormat;
			} else if (parseMode > -1) {
				parseMode = parserList.length - 1;
			} else if (parseMode <= -parserList.length){
				parseMode = 0;
			} else {
				parseMode = displayOptions.parseMode;
			}
			displayOptions.parseMode = parseMode;
		
			//update parseMode in background
			setDisplayOption(parseMode,null,null);
		}
		
		
		//instruct background system to load bibdata from currently active tab
		sendMsg({ msgType: "popup_retreive_bibdata_background" , clear: false }, doNothing);
		
		//set custom style for text area
		setTextAreaStyle();
		
		//rebuild popup
		rebuildPopup(0,true);
		
		//populate redirection scheme selector
		buildRedirectionSchemeSelector();
	}

	// function to set DOI link target, not working on Safari, and hence not included
	function setDOILinkTarget() {
		document.getElementById("doiLink").setAttribute('target','_blank');
	}
	
	// function to retreive options
	function retreiveContent(mess) {
		
		//reset bibData
		bibData = null; bibFieldData = null;
		
		//signal that the popup is currently in the process of retreiving data, disables reload button
		setReadyState(false);
		
		//add event listeners once
		addEventListeners();
		
		//get options and bibfields from background, and then ask for bib data
		sendMsg({ msgType: "request_options_background" , getCitationFormats: true }, prepareParser);
		
		//set DOILinkTarget
		setDOILinkTarget();
	}
	

	// function to set ready state
	function setReadyState(ready) {
		// set global ready state
		isReady = ready;
		
		// enable/disable reload button and scheme selector
		document.querySelector('.reloadCitation').disabled = !ready;

	}
	
	// function to reload citation
	function reloadCitation(reloadButton) {
		
		//do nothing if popup not ready
		if (!isReady) return;
        
        //if nature and status is failed
        if (generalOptions != null && !generalOptions.allowNatureSpringer && generalOptions.showNatureSpringerMessage && bibData != null && (bibData.domain == "nature" || bibData.domain.search(/springer$/) != -1) && bibData["citation_download_status"] == 2) {
            if (reloadButton.innerText != "ALLOW") {
                const textArea = document.getElementById("textToCopy");
                textArea.value = "CAREFUL: Nature.com or Springer.com often obtain dynamic citation data from the host\n\nhttps://citation-needed.springer.com\n\nPreviously, BibItNow! asked for permission to perform cross-origin requests to this specific host already at installation. However, following the latest security guidelines for web extensions, the user now needs to explicitly allow this once the cross-origin request is actually performed. Click on \"ALLOW\" to grant this permission. You can also turn off this message or grant permission under \"Dynamic citation export request\" on the \"Global options\" page.";
                textArea.blur();
                setCitationDownloadIndicator(-2);
            } else {
                setCitationDownloadIndicator(0);
                requestNaturePermission();
            }
            
        } else {
        
            //if popup ready, instruct background system to reload bibdata from currently active tab, meaning that the tab will be removed from the cache before retreival!
            bibData = null; bibFieldData = null;
            
            //signal in text area that the data is reloading
            document.getElementById("textToCopy").value = "Loading...";
            
            // prepare for new data retreival
            setReadyState(false);
            setRedirectionLink("");
            setTypeIndicator();
            
            //determine if abstract page should be loaded
            let load = false;
            let url = reloadButton.title;
            if(reloadButton.innerText == "LOAD") {
                //get url
                if (url != null && url.length > 0 && url.search(/^Open\ new\ tab\ with\ site\ http/) != -1) {
                    url = url.replace(/^.*?http/,"http");
                    if (url != null && url.length > 0) load = true;
                }
            }
            
            //reset indicator
            setCitationDownloadIndicator(-1);
            
            //reload or load new tab
            if (!load) {
                //instruct background system to resend data
                sendMsg({ msgType: "popup_retreive_bibdata_background" , clear: true }, doNothing);
            } else {
                window.open(url, '_blank');
                window.close();
            }
        }
	}
	
	// empty handler, do nothing
	function doNothing(message) {
		message = null;//blupp
	}
	
	//function to set text area style
	function setTextAreaStyle() {

		// remove any old style code
		let css = document.getElementById("textareaStyle");
		if (css != null) css.parentNode.removeChild(css);
		
		// if wanted, set new style
		if (generalOptions != null && typeof(generalOptions) == 'object') {
			let backgroundColor = generalOptions["set_focus_color"] ? generalOptions["focus_color"] : "";
			backgroundColor = backgroundColor == null ? "" : backgroundColor;
			if (backgroundColor != "") {
				
				//set text color
				let textColor = generalOptions["focus_text_color"];
				if (textColor == null || textColor == "") textColor = "black";
				
				//add style
				css = document.createElement("style");
				css.type = "text/css";
				css.id = "textareaStyle";
				css.innerText = "#textToCopy::" + cssHighlightColorSelector + " {" + " color: " + textColor + "; background-color: " + backgroundColor + ";}\n";
				document.body.appendChild(css);
			}
		}
	}
	
	// function to mark text area
	function markTextArea(textArea = null, isLink = false, unlockAutoCopy = true) {
		if (textArea == null) textArea = document.getElementById("textToCopy");
		  
		//mark text area. Force browser to set focus until focus is actually set!
		if (generalOptions["text_autofocus"] && bibFieldData != null) {
			window.blur(); window.focus();
            textArea.select();
			textArea.setSelectionRange(0,textArea.textLength,"backward"); 
            textArea.scrollTop = 0; 
			if (focusInterval != null) {
				clearInterval(focusInterval);
				focusInterval = null;
			}
			
			//this code is an attempt to alleviate a bug in Firefox causing the popup to lose focus. The popup regains focus once the user clicks on it and in that case, the extension should reselect the citation text since the click itself deselects it
			focusInterval = window.setInterval( 
				function(){
					if (!document.hasFocus()) {
						//do nothing
					} else {
						if (focusInterval != null) {
							clearInterval(focusInterval);
							focusInterval = null;
						}
						setTimeout( 
							function() {
								window.blur(); window.focus();
                                textArea.select();
								textArea.setSelectionRange(0,textArea.textLength,"backward"); 
                                textArea.scrollTop = 0;
							}
							,
							100
						);
					}
				}, 
				100
			 );
		}
		
		//auto copy or auto download
		try {
			
			if (unlockAutoCopy && navigator != null && navigator.clipboard != null && permRef != null && generalOptions["text_autocopy"]) {
				let toCopy = textArea.value; 
				isLink = (isLink || generalOptions["text_autocopy_link"] == true);
				if (isLink) {
					toCopy = document.getElementById('doiLink');
					if (toCopy == null || (toCopy = toCopy.href) == null || toCopy == "") {
						toCopy = textArea.value;
						isLink = false;
					}
				}
				navigator.clipboard.writeText(toCopy);
				showCopyMessage(isLink ? 1 : 0);
			}
			
			
		} catch(error) {
			console.log(error);
		}
	}

	//function to set redirection link to doi link
	function setDOILink(googleScholar,markText = false) {
		
		//get reference to link object
		const doiLink = document.getElementById("doiLink");
		
		//disable by default, but enable if doi or url available
		doiLink.removeAttribute('href');
		doiLink.innerText = "Not available.";
		doiLink.title = "Redirection link not available";
		
		if (bibFieldData != null) {
			let href = bibFieldData[15], isbn = bibFieldData[50], eprint = bibFieldData[20], title = bibFieldData[1];
			if (href != "") {
				if (googleScholar == -2) {
					if (href != "") {
						href = "https://scholar.google.com/scholar_lookup?&doi=" + href;
					}
					if (title != null && typeof(title) == 'string' && title.length > 0) href += "&title=" + title.replace(/[\s]+/gi,"+");
					doiLink.innerText = "Find citation on Google Scholar";
				} else {
					href = "https://doi.org/" + href;
					doiLink.innerText = href;
				}
				doiLink.href = href;
				doiLink.title = href;
			} else if (googleScholar == -2 && isbn != "") {
				href = "https://www.google.com/search?tbo=p&tbm=bks&q=isbn:" + isbn + "&num=10";
				doiLink.innerText = "Find book on Google Books";
				doiLink.href = href;
				doiLink.title = href;
			} else if (googleScholar == -2 && eprint != "") {
				if (title != null && typeof(title) == 'string' && title.length > 0) {
					href = "https://scholar.google.com/scholar_lookup?&title=" + title.replace(/[\s]+/gi,"+");
					doiLink.innerText = "Find citation on Google Scholar";
					doiLink.href = href;
					doiLink.title = href;
				}
			} else if (googleScholar != -2 && bibFieldData[30]["citation_url"] != 0) {
				href = bibFieldData[16];
				if (href != "") {
					doiLink.href = href;
					doiLink.innerText = href;
					doiLink.title = href;
				}
			}
		}
		
		//mark text or link
		markTextArea(null,markText && (generalOptions["text_autocopy_link_on_change"] == true));
	}
	
	//function to set redirection link
	function setRedirectionLink(link) {
		
		//get reference to link object
		const redirectionLink = document.getElementById("doiLink");
		const isLink = (link != null && typeof(link) == 'object');
		
		//disable by default, but enable if info available
		redirectionLink.removeAttribute('href');
		redirectionLink.innerText = "Not available.";
		redirectionLink.title = "Redirection link not available";
		
		//early out if no redirection schemes available
		if (redirectionSchemes == null || typeof(redirectionSchemes) != 'object') return;
		
		//get current scheme
		let currentScheme = redirectionSchemes.currentScheme;
		
		//fall back to default if wanted
		if (currentScheme < 0) {
			setDOILink(currentScheme,isLink);
			return;
		}

		//return if invalid link
		if (!isLink || (link = link.link) == null || typeof(link) != 'string' || link.search(/^http[s]?:\/\//) == -1) return;
		
		//set redirection link with info from current scheme
		currentScheme = redirectionSchemes.schemes[currentScheme];
		redirectionLink.href = link;
		redirectionLink.innerText = currentScheme.showAsTooltip ? currentScheme.tooltip : link;
		redirectionLink.title = link;
		
		//mark text or link
		markTextArea(null,isLink && (generalOptions["text_autocopy_link_on_change"] == true));
	}
	
	//function to set type indicator
	function setTypeIndicator() {
		
		//set default to None/Generic
		const typeIndicator = document.getElementById("contentType");
		typeIndicator.style.color = "black"; typeIndicator.innerText = "Not available";
		
		//reset if type available
		if (bibFieldData != null) {
			switch(bibFieldData[0]) {
				case "article":
					typeIndicator.style.color = "#32A4FF";
					typeIndicator.innerText = "Article";
					return;
				case "phdthesis":
					typeIndicator.style.color = "#32A4FF";
					typeIndicator.innerText = "Thesis";
					return;
				case "book":
					typeIndicator.style.color = "#32A4FF";
					typeIndicator.innerText = "Book";
					return;
				case "incollection":
					typeIndicator.style.color = "#32A4FF";
					typeIndicator.innerText = "Book Chapter";
					return;
				default:
					typeIndicator.style.color = "red";
					typeIndicator.innerText = "None/Generic!";
					return;
				
			}
		}
	}
	
	//function to set dynamic download status
	function setCitationDownloadIndicator(status) {
		const statusIndicator = document.getElementById("dynamicDownloadStatus");
		const reloadButton = document.querySelector('.reloadCitation');
		reloadButton.innerText = "Reload"; //by default, set text to "Reload";
        reloadButton.title = "Reload citation data";
		reloadButton.style["font-weight"] = "normal";
        
		switch (status) {
            case -4:
                statusIndicator.innerText = "PDF fallback disabled!";
				statusIndicator.style.color = "red";
                break;
            case -3:
                statusIndicator.innerText = "Load abstract page...";
				statusIndicator.style.color = "violet";
				break;
            case -2:
                statusIndicator.innerText = "Cross-origin request";
				statusIndicator.style.color = "violet";
                reloadButton.innerText = "ALLOW";
                reloadButton.title = "Allow cross-origin request";
                reloadButton.style["font-weight"] = "bold";
                break;
			case -1:
				statusIndicator.innerText = "In progress...";
				statusIndicator.style.color = "black";
				break;
			case 0:
				let isEnabled = generalOptions["dyn_download"];
				if (isEnabled == null) isEnabled = true;
				if (!isEnabled) {
					statusIndicator.innerText = "Globally disabled!";
					statusIndicator.style.color = "black";
				} else {
					statusIndicator.innerText = "Please reload!";
					statusIndicator.style.color = "red";
					
					//set reload button text to "RELOAD", to signal the user that he/she should ACTUALLY use it!
					reloadButton.innerText = "RELOAD";
					reloadButton.style["font-weight"] = "bold";
				}
				break;
			case 1:
				statusIndicator.innerText = "Not available.";
				statusIndicator.style.color = "black";
				break;
			case 2:
				statusIndicator.innerText = "Failed!";
				statusIndicator.style.color = "red";
				//set reload button text to "RETRY", to signal the user that he/she should ACTUALLY use it!
				reloadButton.innerText = "RETRY";
				reloadButton.style["font-weight"] = "bold";
				break;
			case 3:
				statusIndicator.innerText = "Successful!";
				statusIndicator.style.color = "#32A4FF";
				break;
			case 4:
				statusIndicator.innerText = "Incompatible format!";
				statusIndicator.style.color = "red";
				
				//set reload button text to "RETRY", to signal the user that he/she should ACTUALLY use it!
				reloadButton.innerText = "RETRY";
				reloadButton.style["font-weight"] = "bold";
				break;
			default:
				statusIndicator.innerText = "Awating status...";
				statusIndicator.style.color = "black";
		}
	}
	
	//function that indicates citation download and timeout in text area
	function setDownloadTimeoutIndicator(timeout) {
		
		//format timeout to seconds
		if (timeout != null && timeout === parseInt(timeout, 10)) {
			timeout /= 1000;
			if (timeout == 0) timeout = "1";
		} else {
			//default
			timeout = "a few";
		}
		
		//update text area
		document.getElementById("textToCopy").value = "Trying to download better citation data. This may take up to " + timeout + " seconds...";
	}
	
	//function to set display options in background
	function setDisplayOption(parseMode, option, value) {
		
		//locally reset display option
		if (option != null) displayOptions.optionArray[parseMode][option] = value;
		
		//update in background
		const options = {};
		if (option != null) options[option] = value;
		sendMsg({ msgType: "update_display_options_background" , parseMode: parseMode , options: options }, doNothing);
		
		//rebuild popup
		rebuildPopup(1);
	}
	
	//function to populate redirection scheme selector
	function buildRedirectionSchemeSelector() {
		//early out
		if (redirectionSchemes == null || typeof(redirectionSchemes) != 'object') return;
		
		//schemes
		const schemes = redirectionSchemes.schemes, currentScheme = redirectionSchemes.currentScheme;
		const length = schemes.length;
		
		//repopulate selector
		const schemeSelector = document.getElementById('redirectionSelectorBox');
		
		//remove all elements
		while (schemeSelector.hasChildNodes()) {
			schemeSelector.removeChild(schemeSelector.childNodes[0]);
		}
		
		//add default invisible element
		let option = document.createElement("option");
		option.value = -3; option.innerText = "Label";
		option.disabled = true; option.selected = true; option.style.display = "none";
		schemeSelector.appendChild(option);
		
		//add default element with value -2
		option = document.createElement("option");
		option.value = -2; option.innerText = "Google";
		schemeSelector.appendChild(option);
		
		//add default element with value -1
		option = document.createElement("option");
		option.value = -1; option.innerText = "DOI/URL";
		schemeSelector.appendChild(option);
		
		//add all custom elements
		for (let i = 0; i<length; ++i) {
			option = document.createElement("option");
			option.value = i; option.innerText = schemes[i].name;
			schemeSelector.appendChild(option);
		}
		
		//select current scheme
		schemeSelector.value = currentScheme;
		schemeSelector.options[0].innerText = schemeSelector.options[schemeSelector.selectedIndex].innerText;;
		schemeSelector.selectedIndex = 0;
	}
	
	//function to populate parse mode selector
	function buildCitationFormatSelector(parseMode,build = false) {
		
		//get citation format selector
		const formatSelector = document.getElementById('filterSelectorBox');
		
		//early out for custom formats
		const numFixedParsers = parserList.length;
		if (customFormats == null || !Array.isArray(customFormats)) {
			if (parseMode >= numFixedParsers) parseMode = numFixedParsers - 1;
			formatSelector.value = "" + parseMode;
			return;
		}
		
		//add custom formats the first time popup is opened
		if (build == true) {
			//get number of custom formats
			const length = customFormats.length;
			
			//add all custom formats
			for (let i = 0; i<length; ++i) {
				let option = document.createElement("option");
				option.value = numFixedParsers + i; option.innerText = customFormats[i].name;
				formatSelector.appendChild(option);
			}
		}
		
		//set to parse mode and then to invisible dummy mode to allow automarking even if same option is selected
		formatSelector.value = "" + parseMode;
		formatSelector.options[0].innerText = formatSelector.options[formatSelector.selectedIndex].innerText;;
		formatSelector.selectedIndex = 0;
		
	}
	
	//function to receive custom citation output from background
	function updateCustomCitationOutput(data) {
		if (data != null && (data = data.data) != null && typeof(data) == 'string') bibData["customFormat"] = data;
		rebuildPopup(2);
	}
	
	// function that shows visual cue for copying to clipboard
	function showCopyMessage(mode = 0) {
		if (!generalOptions["text_autocopy_visual"]) return;
		if (copyTimeOut != null) {
			window.clearTimeout(copyTimeOut);
			copyTimeOut = null;
		}
		const copyMsg = document.getElementById('copyMsg');
		copyMsg.style.display = "none";
		if (mode == 2) {
			copyMsg.innerText = "Text downloaded!";
			copyMsg.style.color = "#32A4FF";
			copyMsg.style.border = "0.05cm solid #32A4FF";
			copyMsg.style["box-shadow"] = "0.02cm 0.02cm 0.12cm #32A4FF";
		} else if (mode == 1) {
			copyMsg.innerText = "Link copied!";
			copyMsg.style.color = "green";
			copyMsg.style.border = "0.05cm solid green";
			copyMsg.style["box-shadow"] = "0.02cm 0.02cm 0.12cm green";
		} else {
			copyMsg.innerText = "Text copied!";
			copyMsg.style.color = "blue";
			copyMsg.style.border = "0.05cm solid blue";
			copyMsg.style["box-shadow"] = "0.02cm 0.02cm 0.12cm blue";
		}
		copyMsg.style.display = "inline";
		copyTimeOut = window.setTimeout( function(){ copyMsg.style.display = "none"; }, 2000);
	}
	
	//renew popup content
	function rebuildPopup(mode,buildFormatSelector = false) {
		
		//get display options and parse mode, do not rebuild if options are not available
		if (displayOptions == null || typeof(displayOptions) != 'object') return;
		const parseMode = displayOptions.parseMode;
		if (!(parseMode >= 0)) return;
		let parser = null, parserInfo = null;
		let options;
		
		if (parseMode < parserList.length) {
			
			options = displayOptions.optionArray;
			if (options == null) return;
			options = options[parseMode];
			if (options == null || typeof(options) != 'object') return;
			
			//get parser and parse info, containing name, file extension, encoding etc.
			parser = parserList[parseMode];
			parserInfo = parser.getParserInfo(parseMode);
		} else {
			
			//set dummy options
			options = { abbrevs: null, abbrevDots: null, forceMaxNumAuthors: null , maxNumAuthors: null };
			
			//get info of current citation format
			parserInfo = { encoding: "utf8" , fileExtension: "txt" , name: "custom" };
			let index = parseMode - parserList.length;
			if (customFormats != null && Array.isArray(customFormats) && (index = customFormats[index]) != null && typeof(index) == 'object') {
				if (index.extension != null && typeof(index.extension) == 'string' && index.extension.length > 0) parserInfo.fileExtension = index.extension;
				if (index.encoding != null && typeof(index.encoding) == 'string' && index.encoding.length > 0) parserInfo.encoding = index.encoding;
				if (index.name != null && typeof(index.name) == 'string' && index.name.length > 0) parserInfo.name = index.name;
			}
		}
				
		//parse mode specific abbreviation setting, needed later
		let abbrevs = options["abbrevs"]; 
		  
		//mode = 0 is for resetting control panel, 1 for text field and download button, 2 or higher for both
		if (mode == 0 || mode > 1) {
			
			//if necessary, asynchronously remove all elements from advanced option page and rebuild
			if (advancedOptionPage == null) {
				
				//get advanced option page
				const advOptPage = document.getElementById('advancedOptions');
				
				//hide advanced option page by default and set default height
				advOptPage.style.display = "none";
				
				//remove previous elements
				while (advOptPage.hasChildNodes()) {
					advOptPage.removeChild(advOptPage.lastChild);
				}
				
				//and add new elements specific to citation format
				
				//add title
				let elem = document.createElement("h1");
				elem.innerText = "Advanced settings for " + parserInfo.name;
				if (parserInfo.name.search(/format[\s]*$/gi) == -1) elem.innerText += " format";
				advOptPage.appendChild(elem); 
				advOptPage.appendChild(document.createElement("br"));
				
				//add options, parser specific
				if(parser == null || !parser.buildAdvancedOptionPage(parseMode,advOptPage,setDisplayOption)) {
					//if parser does not add option, set height to default and excuse :)
					elem = document.createElement("center");
					advOptPage.style.height = "1.7cm";
					elem.innerText = "Sorry, no advanced settings available for this format."
					advOptPage.appendChild(elem);
				}

				//indicate that rebuilding advanced option page is not necessary
				advancedOptionPage = advOptPage;
			}
			
			//abbreviation box
			const abbrevBox = document.getElementById('journalAbbrevBox');
			const abbrevBoxText = document.getElementById('checkBoxText');
			const abbrevDotSelector = document.getElementById('dotSelectorBox');
			abbrevBox.checked = abbrevs;
			abbrevBox.disabled = false;
			abbrevBoxText.style.color = "black";
			abbrevDotSelector.value = options["abbrevDots"] ? "1" : "0";
			abbrevDotSelector.disabled = abbrevs ? false : true;

			//copy option link
			const copyOptionDiv = document.getElementById('copyOptionDiv');
			if (!generalOptions["hide_copy_option_link"]) {
				copyOptionDiv.style.display = "inline";
				document.getElementById("downloadLink").style.top = "0.7cm";
			} else {
				copyOptionDiv.style.display = "none";
				document.getElementById("downloadLink").style.top = "0.6cm";
			}
			
			//custom format link, redirection scheme edit link
			{
				let links = ['customizeLinkDiv','editSchemeLink'];
				let hideOptions = ['hide_custom_format_link','hide_redirection_scheme_link'];
				for (let i = 0; i<hideOptions.length; ++i) document.getElementById(links[i]).style.display = (generalOptions[hideOptions[i]] ? "none" : "inline" );
			}
			
			//author box
			const authorBox = document.getElementById('maxNumAuthorsBox');
			const authorBoxText = document.getElementById('maxNumAuthorsText');
			authorBox.checked = options["forceMaxNumAuthors"];
			authorBox.disabled = true;
			authorBoxText.style.color = "grey";
			
			//author field
			const authorField = document.getElementById('maxNumAuthorsField');
			authorField.disabled = true;
			authorField.value = options["maxNumAuthors"];
			
			//build citation format selector
			buildCitationFormatSelector(parseMode,buildFormatSelector);
			
			//parse mode dependent adjustments
			if (parseMode == 0 || (parseMode > 2 && parseMode < 5) ){
				authorBox.disabled = false;
				authorBoxText.style.color = "black";
				authorField.disabled = !authorBox.checked;
			} else if (parseMode == 1) {
				abbrevBox.disabled = true;
				abbrevBoxText.style.color = "grey";
				abbrevDotSelector.disabled = false;
			} else if (parseMode >= parserList.length) {
				abbrevBox.disabled = true;
				abbrevBoxText.style.color = "grey";
				abbrevDotSelector.disabled = true;
			}
		}
		
		if (mode > 0 && bibData != null && typeof(bibData) == 'object' && bibFieldData != null) {
						
			//set citation download indicator
			setCitationDownloadIndicator(bibData["citation_download_status"]);
			
			//parse bib data
			let contentString = "";
			if (parser != null) {
				contentString = parser.parse(parseMode,abbrevs);
			} else if (currentFormat > -1 && bibData.customFormat != null && typeof(bibData.customFormat) == 'string') {
				contentString = bibData.customFormat;
			}
			
			//create download link, make this browser dependent for stupid support of download property in Safari, grrrrrrr Apple!!!
			setDownloadLink(document.getElementById("downloadLink"), contentString, parserInfo.encoding, parserInfo.fileExtension);
			
			//set type indicator
			setTypeIndicator();
			
			//fill textArea depending on mode, and scroll to top
			const textArea = document.getElementById("textToCopy");
			textArea.value = contentString;
			textArea.scrollTop = 0;
			
			//select text area if option enabled
			markTextArea(textArea);
			
			//signal that the popup is ready to take new data
			setReadyState(true);			
		}
		
	}
	
	// function to add event listeners to UI elements
	function addEventListeners() {
		
		//add additional notification to download link
		document.getElementById('downloadLink').addEventListener('click', function(event) { 
				showCopyMessage(2);
				//remark text area but without allow autocopy
				markTextArea(null,false,false);
			}
		);
		
		//reload button functionality
		document.getElementById('reloadCitation').addEventListener('click', function(event) {
				reloadCitation(this);
			}
		);
		
		//copy to clipboard button functionality
		document.getElementById('copyToClipboard').addEventListener('click', function(event) {
				let textArea;
				let isLink = (generalOptions["copy_button_link"] == true);
				if (!isLink) {
					textArea = document.getElementById("textToCopy");
					textArea.setSelectionRange(0,textArea.textLength,"backward");
				} else {
					textArea = document.createElement("textarea");
					textArea.value = document.getElementById('doiLink').href;
					document.getElementById("doiLinkBox").appendChild(textArea);
				}
				textArea.select();
				try {
					document.execCommand('copy');
					if (isLink) document.getElementById("textToCopy").select();
					if (textArea.value != "") showCopyMessage(isLink ? 1 : 0);
				} catch (err) {
					console.log('Unable to copy');
				}
				if (generalOptions["copy_button_link"]) {
					document.getElementById("doiLinkBox").removeChild(textArea);
				}
			}
		);

		//enable/disable auto copy
		document.getElementById('copyOptionLink').addEventListener('click',function(event) {
				openOptionPage("copyOptions");
			}
		);
		
		//reparse content if abbreviation available!
		document.getElementById('journalAbbrevBox').addEventListener('change',function(event) {
				
				//disable reload
				setReadyState(false);
			
				//get parse mode and value
				const parseMode = displayOptions["parseMode"];
				const value = this.checked;
				
				//update display options in background
				sendMsg({ msgType: "update_display_options_background" , parseMode: parseMode , options: { abbrevs: value } }, doNothing);
				
				//set abbreviation option and rebuild popup if necessary
				displayOptions["optionArray"][parseMode]["abbrevs"] = value;
				if (bibFieldData != null && bibFieldData[7] != "" && bibFieldData[8] != "") {
					rebuildPopup(2);
				} else {
					rebuildPopup(0);
					if (bibFieldData != null) markTextArea();
				}
				
				//mark as ready
				setReadyState(true);
			}
		);
		
		//reparse content if abbreviation available and dots enabled/disabled!
		document.getElementById('dotSelectorBox').addEventListener('change',function(event) {
				
				//disable reload
				setReadyState(false);
			
				//get parse mode and value
				const parseMode = displayOptions["parseMode"];
				const value = (this.value == "1");
				
				//update display options in background
				sendMsg({ msgType: "update_display_options_background" , parseMode: parseMode , options: { abbrevDots: value } }, doNothing);
				
				//set abbreviation option and rebuild popup if necessary
				displayOptions["optionArray"][parseMode]["abbrevDots"] = value;
				if (bibFieldData != null && bibFieldData[7] != "" && bibFieldData[8] != "") {
					rebuildPopup(1);
				} else if (bibFieldData != null) {
					markTextArea();
				}
									   
				//enable reload
				setReadyState(true);
				
			}
		);
		
		//reparse content if forceMaxNumAuthors checkBox changed
		document.getElementById('maxNumAuthorsBox').addEventListener('change',function(event) {
				
				//disable reload
				setReadyState(false);
			
				//get parse mode and value
				const parseMode = displayOptions["parseMode"];
				const value = this.checked;
				
				//update display options in background
				sendMsg({ msgType: "update_display_options_background" , parseMode: parseMode , options: { forceMaxNumAuthors: value } }, doNothing);
				
				//set abbreviation option and rebuild popup if necessary
				displayOptions["optionArray"][parseMode]["forceMaxNumAuthors"] = value;
				
				//rebuild popup with a mode that depends on whether author information is available or not
				if (bibFieldData != null && (parseMode == 0 || parseMode > 2) && bibFieldData[3] != "" && bibFieldData[4] != "") {
					rebuildPopup(2);
				} else {
					rebuildPopup(0);
					if (bibFieldData != null) markTextArea();
				}
				
				//mark as ready
				setReadyState(true);
			}
		);
		
		//reparse if maxNumAuthorsField changed
		document.getElementById('maxNumAuthorsField').addEventListener('change',function(event) {
				
				//disable reload
				setReadyState(false);
			
				//get parse mode and value
				const parseMode = displayOptions["parseMode"];
				const value = this.value;
				
				//update display options in background
				sendMsg({ msgType: "update_display_options_background" , parseMode: parseMode , options: { maxNumAuthors: value } }, doNothing);
				
				//set abbreviation option and rebuild popup if necessary
				displayOptions["optionArray"][parseMode]["maxNumAuthors"] = value;
				
				//rebuild popup with a mode that depends on whether author information is available or not
				if (bibFieldData != null && (parseMode == 0 || parseMode > 2) && bibFieldData[3] != "" && bibFieldData[4] != "") {
					rebuildPopup(2);
				} else {
					rebuildPopup(0);
					if (bibFieldData != null) markTextArea();
					
				}
				
				//mark as ready
				setReadyState(true);
			}
		);
		
		
		//reparse content if parser changed
		document.getElementById('filterSelectorBox').addEventListener('change',function(event) {
				
				//disable reload
				setReadyState(false);
			
				//get new parse mode. if dummy mode, return
				let parseMode = parseInt(this.options[this.selectedIndex].value);
				if (parseMode == -1) return;
									      
				//update parse options in background
				sendMsg({ msgType: "update_display_options_background" , parseMode: parseMode , options: { setParseMode: true } }, doNothing);
				
				//set parseMode option depending on selected item in drop down menu
				if (displayOptions["parseMode"] != parseMode) {
					displayOptions["parseMode"] = parseMode;
				
					//reset advanced option page
					advancedOptionPage = null;
				
					//if new custom format, request parsed output from background 
					if (parseMode < parserList.length) {
						
						//set back current format to -1
						currentFormat = -1;
						sendMsg({ msgType: "set_citation_format_background" , currentFormat: -1 , tab: bibData != null ? bibData["tab_id"] : null }, doNothing);
						
						//rebuild popup
						rebuildPopup(2);
						
						//mark as ready
						setReadyState(true);
						
					} else {
						currentFormat = parseMode - parserList.length;
						sendMsg({ msgType: "set_citation_format_background" , currentFormat: currentFormat , tab: bibData != null ? bibData["tab_id"] : null }, updateCustomCitationOutput);
					}
				} else {
                    //if no filter switch, remark text area and free access
					if (bibFieldData != null) {
                        markTextArea();
                        setReadyState(true);
                    }
				}
				
			}
		);
		
		//this is done to remark text area even if same option is chosen. The trick is to add an invisible option in the beginning that is always selected at start up
		document.getElementById('filterSelectorBox').addEventListener('click',function(event) {
				this.options[0].innerText = this.options[this.selectedIndex].innerText;
				this.selectedIndex = 0;
			}
		);
		
		//open global option page
		document.getElementById('optionLink').addEventListener('click',function(event) {
				openOptionPage();
			}
		);
		
		//open advanced options page
		document.getElementById('advancedOptionsLink').addEventListener('click',function(event) {
				const advOptPage = document.getElementById('advancedOptions');
				advOptPage.style.display = "inline";
				advOptPage.focus();
			}
		);
		
		//open redirection scheme page
		document.getElementById('editSchemeLink').addEventListener('click',function(event) {
				openOptionPage("redirectionSchemeUI");
			}
		);
		
		//open citation customizer page
		document.getElementById('customizeLink').addEventListener('click',function(event) {
				openOptionPage("citationFormatUI");
			}
		);
		
		//select redirection scheme
		document.getElementById('redirectionSelectorBox').addEventListener('change',function(event) {
				
				//disable reload
				setReadyState(false);
			
				//get selected scheme and set it locally
				const scheme = parseInt(this.options[this.selectedIndex].value);
				redirectionSchemes.currentScheme = scheme;
				
				//update scheme in background, send tab id if data available to update link
				sendMsg({ msgType: "set_redirection_scheme_background" , currentScheme: scheme , tab: bibData != null ? bibData["tab_id"] : null }, setRedirectionLink );
				
				//mark as ready
				setReadyState(true);
				
			}
		);
		
		document.getElementById('redirectionSelectorBox').addEventListener('click',function(event) {
				this.options[0].innerText = this.options[this.selectedIndex].innerText;
				this.selectedIndex = 0;
				
			}
		);
		
		//close advanced options page if focus is lost or if clicked somewhere else. Remark text area if wanted		
		document.body.addEventListener('focusin',function(event) {
				const advOptPage = document.getElementById('advancedOptions');
				let activeElem;
				if (advOptPage.style.display != "none" && !advOptPage.contains((activeElem = document.activeElement)) && (activeElem = activeElem.id) != "advancedOptions" && activeElem != "textToCopy" && activeElem != "filterSelectorBox" && activeElem != "maxNumAuthorsField" && activeElem != "dotSelectorBox" ) {
					advOptPage.style.display = "none";
					if(bibFieldData != null) markTextArea();
				}
			}
		);
		{
			const elems = ['filterSelector','exportButtons','dynamicDownloadIndicator','options','optionLinkDiv','doi','textToCopy','textAreaDiv'];
			for (let i = 0; i<8; ++i) {
				document.getElementById(elems[i]).addEventListener('click', function(event) { 
						const advOptPage = document.getElementById('advancedOptions');
						if (advOptPage.style.display != "none") {
							advOptPage.style.display = "none";
							let activeId = document.activeElement.id;
							if(activeId != "filterSelectorBox" && activeId != "maxNumAuthorsField" && activeId != "dotSelectorBox" && bibFieldData != null) {
								markTextArea();
							}
						}
					}
						
				);
			}
		}
		
		//close popup when pressing doi link
		document.getElementById('doiLink').addEventListener('click',function(event) {
				closePopup(this.href);
			}
		);
				
	}
	// return retreiveContent, handleMessage
	return {
		retreiveContent : retreiveContent,
		handleMessage : handleMessage
	}; //end return
}());
