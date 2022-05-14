const BINOptionPage = ( function () {
	
	//pointer to option objects
	var generalOptions = null, displayOptions = null, redirectionSchemes = null, redirectionSchemeFormatStrings = null, citationFormats = null, previousBibkeyFormatString = "", allowFileExport = true;
	
	//function to set options.
	function setOptions(options, mode = 0) {
		if (options == null || typeof(options) != 'object') return;
		let opts = options.generalOptions;
        
		if (opts != null && typeof(opts) == 'object') {
			generalOptions = opts;
			previousBibkeyFormatString = generalOptions.bibkeyFormatString;
		}
		opts = options.displayOptions;
		if (opts != null && typeof(opts) == 'object') displayOptions = opts;
		opts = options.redirectionSchemes;
		if (opts != null && typeof(opts) == 'object') {
			redirectionSchemes = opts;
			opts = options.redirectionSchemeFormatStrings;
			if (opts != null && Array.isArray(opts)) {
				redirectionSchemeFormatStrings = opts;
			} else {
				redirectionSchemes = null;
			}
		}
		opts = options.citationFormats;
		if (opts != null && typeof(opts) == 'object') {
			citationFormats = opts;
		}
		queryOptionalPermissions(0);
	}
	
	//function to set general option in background
	function setOption(option,value,rebuildMode = 1, msgType = "update_options_background", handler = doNothing) {
		if (generalOptions != null) {
			// set option
			if (option != "bibkeyFormatString") generalOptions[option] = value;
			
			// rebuild option page
			rebuildOptionPage(rebuildMode);
			
			//update options in background
			const updateMessage = { msgType: msgType , options: {} };
			updateMessage.options[option] = value;
			sendMsg(updateMessage, handler);
		}
	}
	
	//function to set display option in background
	function setDisplayOption(parseMode, option, value) {
		if (generalOptions != null) {
			// set option
			displayOptions.optionArray[parseMode][option] = value;
			
			// rebuild option page
			rebuildOptionPage(1);
			
			//update options in background
			const updateMessage = { msgType: "update_display_options_background" , parseMode: parseMode , options: {} };
			updateMessage.options[option] = value;
			sendMsg(updateMessage, doNothing);
		}
	}
	
	// function to update redirection scheme after handling in background
	function updateRedirectionScheme(response) {
		if (redirectionSchemes != null && redirectionSchemeFormatStrings != null && response != null && typeof(response) == 'object' && response.currentScheme != null) {
			
			//update local object with global properties
			redirectionSchemes.currentScheme = response.currentScheme;
			
			//replace, add or remove
			let index = response.index;
			const scheme = response.scheme, formatString = response.formatString;
			if (response.removeAll == true) {
				//reset schemes
				redirectionSchemes.schemes = [];
				redirectionSchemeFormatStrings = [];
				
				//rebuild option page
				rebuildOptionPage(4,-1);
				
			} else if ( scheme != null && Array.isArray(scheme) )  {
				
				//add all from scheme array
				const numSchemes = scheme.length, schemes = redirectionSchemes.schemes;
				index = schemes.length;
				for (let i = 0; i<numSchemes; ++i) {
					schemes[index] = scheme[i];
					redirectionSchemeFormatStrings[index] = formatString[i];
					index++;
				}
				
				//rebuild option page
				rebuildOptionPage(4,-2);
				
			} else if (index > -1) {
				if (scheme == null && index < redirectionSchemes.schemes.length) {
					//remove
					redirectionSchemes.schemes.splice(index,1);
					redirectionSchemeFormatStrings.splice(index,1);
					
					//set new scheme to select
					index--;
					
					//rebuild option page
					rebuildOptionPage(4,index,true);
				} else {
					//replace or add
					redirectionSchemes.schemes[index] = scheme;
					redirectionSchemeFormatStrings[index] = formatString;
					
					//rebuild option page
					rebuildOptionPage(4,index);
				}
			}
		}
	}
	
	//function to export redirection scheme to local json file
	function exportRedirectionScheme(scheme,name = "RedirectionSchemes.bnrs") {
		
		//early out if not allowed
		if (!allowFileExport) return;
		
		//sanitize name
		if (name == null || typeof(name) != 'string') {
			name = "RedirectionSchemes.bnrs";
		} else {
			name = name.replace(/[\s]*/g,"");
			if (name.search(/\.bnrs$/) == -1) name += ".bnrs";
		}
		
		//check if json-compatible
		try {
			scheme = JSON.stringify(scheme);
		} catch(error) {
			scheme = null;
		}
		
		//if successfully parsed, proceed
		if (scheme != null && typeof(scheme) == 'string' && scheme.length > 0) {
			
			//disable export buttons/links
			allowFileExport = false;
			
			//create an iframe for correct file name (what the hell, why do webextensions not provide a proper settings export function???)
			const frame = document.createElement("iframe");
			frame.srcdoc = '<a download="' + name + '" id="schemeDownloader" target="_blank">Option Export</a>';
			frame.style.position = "fixed";
			frame.style.top = "-999px";
			frame.style.height = "1px";
			frame.onload = function() {
				let cWin = frame.contentWindow;
				let anch = cWin.document.getElementById("schemeDownloader");
				anch.href = cWin.URL.createObjectURL(new cWin.Blob([scheme], { type: "text/bnrs"}));
				anch.click();
				setTimeout( function() {
						frame.remove();
						allowFileExport = true;
					}, 1000
				);

			};
			document.body.appendChild(frame);
		}
	}
	
	//function to export all redirection schemes
	function exportRedirectionSchemes() {
		//early out
		if (redirectionSchemes == null || typeof(redirectionSchemes) != 'object' || redirectionSchemeFormatStrings == null || !Array.isArray(redirectionSchemeFormatStrings)) return;
		
		//get scheme array
		const schemes = redirectionSchemes.schemes;
		
		//early out if no array
		let length = 0;
		if (schemes == null || !Array.isArray(schemes) || (length = schemes.length) < 1) return;
		       
		//create copy of scheme array
		schemesToExport = [];
		
		//fill with content of scheme array and formatString array
		for (let i = 0; i<length; ++i) {
			
			//get scheme and formatString
			let scheme = schemes[i], formatString = redirectionSchemeFormatStrings[i];
			
			//early continue
			if (scheme == null || typeof(scheme) != 'object') continue;
			
			//sanitize formatString
			if (formatString == null || typeof(formatString) != 'string') formatString = "";
		       
			//save in array to export
			schemesToExport[i] = { name: scheme.name , tooltip: scheme.tooltip , formatString: formatString, whiteSpaceReplacement: scheme.whiteSpaceReplacement, showAsTooltip: scheme.showAsTooltip };
		}
		
		//export schemes if necessary
		if (schemesToExport.length > 0) exportRedirectionScheme(schemesToExport);
	}
	
	//function to remove all redirection schemes
	function removeRedirectionSchemes() {
		//early out
		if (redirectionSchemes == null || typeof(redirectionSchemes) != 'object' || redirectionSchemeFormatStrings == null || !Array.isArray(redirectionSchemeFormatStrings) || redirectionSchemeFormatStrings.length < 1) return;
		
		//tell background to remove all schemes if user is sure
		if (confirm("Are you sure you want to REMOVE ALL redirection schemes?")) {
			setRedirectionScheme(0, null, true);
		}
	}
	
	//function to open redirection scheme file
	function openRedirectionSchemeFile() {
		//early out
		if (redirectionSchemes == null || typeof(redirectionSchemes) != 'object' || redirectionSchemeFormatStrings == null || !Array.isArray(redirectionSchemeFormatStrings)) return;
		
		//trigger open file dialogue
		document.getElementById('importedRedirectionSchemes').click();
	}
	
	function importRedirectionSchemes(fileContent) {
		
		//early out
		if (fileContent == null || typeof(fileContent) != 'string' || fileContent.length == 0 || redirectionSchemes == null || typeof(redirectionSchemes) != 'object' || redirectionSchemeFormatStrings == null || !Array.isArray(redirectionSchemeFormatStrings)) return;
		
		//trigger open file dialogue
		try {
			fileContent = JSON.parse(fileContent);
		} catch(exception) {
			fileContent =  null;
		}
		
		//set new redirection schemes if available
		if (fileContent != null && Array.isArray(fileContent) && fileContent.length > 0) {
			setRedirectionScheme(-1,fileContent,false);
		}
	}
	
	// function to update citation format after handling in background
	function updateCitationFormat(response) {
		if (citationFormats != null && response != null && typeof(response) == 'object') {
			
            //if csl, do nothing TODO change
            if (response.isCSL) {
                document.getElementById("citationConvertedCSL").value = (response.convertedCSL != null) ? "successfully" : "failed";
                return;
            }
            
			//set index
			let index = response.index, removeAll = (response.removeAll == true);
			
			//set current format
			citationFormats.currentFormat = index;
			if (!(response.format != null && response.currentFormatSource == null)) {
				if (index > -1 || removeAll) citationFormats.currentFormatSource = response.currentFormatSource;
			}
						
			//replace, add or remove
			const format = response.format;
			if (response.removeAll == true) {
				//reset schemes
				citationFormats.formats = [];
				
				//rebuild option page
				rebuildOptionPage(5,-1);
				
			} else if ( format != null && Array.isArray(format) )  {
				
				//add all from format array
				const numFormats = format.length, formats = citationFormats.formats;
				index = formats.length;
				for (let i = 0; i<numFormats; ++i) {
					formats[index] = format[i];
					index++;
				}
				
				//rebuild option page
				rebuildOptionPage(5,-2);
				
			} else if (index > -1) {
				if (format == null && index < citationFormats.formats.length) {
					//remove
					citationFormats.formats.splice(index,1);
					
					//shift index
					index--;
					
					//rebuild option page
					rebuildOptionPage(5,index,false,true);
				} else {
					
					//replace or add
					citationFormats.formats[index] = format;
					
					//rebuild option page
					rebuildOptionPage(5,index);
				}
			}
		}
	}
	
	//function to export citation format to local json file
	function exportCitationFormat(format,name = "CitationFormat.bnfa") {
		
		//early out if not allowed
		if (!allowFileExport) return;
		
		//sanitize name
		if (name == null || typeof(name) != 'string') {
			name = "CitationFormat.bnfa";
		} else {
			name = name.replace(/[\s]*/g,"");
			if (name.search(/\.bnfa$/) == -1) name += ".bnfa";
		}
		
		//check if json-compatible
		try {
			format = JSON.stringify(format,null, '\t');
		} catch(error) {
			format = null;
		}
		
		//if successfully parsed, proceed
		if (format != null && typeof(format) == 'string' && format.length > 0) {
			
			//disable export buttons/links
			allowFileExport = false;
			
			//create an iframe for correct file name (what the hell, why do webextensions not provide a proper settings export function???)
			const frame = document.createElement("iframe");
			frame.srcdoc = '<a download="' + name + '" id="formatDownloader" target="_blank">Option Export</a>';
			frame.style.position = "fixed";
			frame.style.top = "-999px";
			frame.style.height = "1px";
			frame.onload = function() {
				let cWin = frame.contentWindow;
				let anch = cWin.document.getElementById("formatDownloader");
				anch.href = cWin.URL.createObjectURL(new cWin.Blob([format], { type: "text/bnfa"}));
				anch.click();
				setTimeout( function() {
						frame.remove();
						allowFileExport = true;
					}, 1000
				);

			};
			document.body.appendChild(frame);
		}
	}
	
	//function to export all citation formats
	function exportCitationFormats(formatSources) {
		//early out
		if (citationFormats == null || typeof(citationFormats) != 'object') return;
		
		//early out if no valid response
		if (formatSources == null || typeof(formatSources) != 'object') return;
		       
		//get format sources from response
		formatSources = formatSources.formatSource;
		let length = 0;
		if (formatSources == null || !Array.isArray(formatSources) || (length = formatSources.length) < 1) return;
		
		//get format array
		const formats = citationFormats.formats;
		
		//early out if no array
		if (formats == null || !Array.isArray(formats) || length != formats.length) return;
		
		//create copy of format array
		formatsToExport = [];
		
		//fill with content of format array and formatString array
		for (let i = 0; i<length; ++i) {
			
			//get citation format
			let format = formats[i], formatSource = formatSources[i];
			
			//early continue
			if (format == null || typeof(format) != 'object' || formatSource == null || typeof(formatSource) != 'string' || format.name == null || typeof(format.name) != 'string' || format.extension == null || typeof(format.extension) != 'string' || format.encoding == null || typeof(format.encoding) != 'string') continue;
		       
			//save in array to export
			formatsToExport[i] = { name: format.name , extension: format.extension , encoding: format.encoding , formatSource: formatSource };
		}
		
		//export formats if necessary
		if (formatsToExport.length > 0) exportCitationFormat(formatsToExport);
	}
	
	//function to remove all custom citation formats
	function removeCitationFormats() {
		//early out
		if (citationFormats == null || typeof(citationFormats) != 'object') return;
		
		//tell background to remove all schemes if user is sure
		if (confirm("Are you sure you want to REMOVE ALL CUSTOM citation formats?")) {
			setCitationFormat(0, null, true);
		}
	}
	
	//function to open citation format file
	function openCitationFormatFile() {
		//early out
		if (citationFormats == null || typeof(citationFormats) != 'object') return;
		
		//trigger open file dialogue
		document.getElementById('importedCitationFormats').click();
	}
	
	//function to handle citation format imported from file
	function importCitationFormats(fileContent) {
		
		//early out
		if (fileContent == null || typeof(fileContent) != 'string' || fileContent.length == 0 || citationFormats == null || typeof(citationFormats) != 'object') return;
		
		//trigger open file dialogue
		try {
			fileContent = JSON.parse(fileContent);
		} catch(exception) {
			fileContent =  null;
		}

		//set new citation formats if available
		let numFormats = citationFormats.formats.length;
		let numFormatsToAdd = 0;
		if (fileContent != null && Array.isArray(fileContent) && (numFormatsToAdd = fileContent.length) > 0) {
			for (let i = 0; i<numFormatsToAdd; ++i) {
				setCitationFormat(numFormats,fileContent[i],false);
				numFormats++;
			}
		}
	}
	
	//get format source from background
	function getCitationFormat(response) {
		
		//early out
		if (response == null || typeof(response) != 'object') return;
		let formatSource = response.formatSource;
		if (formatSource == null || typeof(formatSource) != 'string') return;
		       
		//update format source
		citationFormats.currentFormatSource = formatSource;
		
		//update UI
		updateCitationFormatUI(citationFormats.formats.length,citationFormats.currentFormat);
	}
	
	//function to set bibkey format string
	function setBibkeyFormat(format) {
		
		if (format != null) {
			let formatString = format.bibkeyFormatString;
			if (formatString != null && typeof(formatString) == 'string' && formatString.length > 0) {
				if (generalOptions != null) {
					previousBibkeyFormatString = generalOptions.bibkeyFormatString;
					generalOptions.bibkeyFormatString = formatString;
				}
				document.getElementById('bibkeyFormatString').value = formatString;
				document.getElementById('bibkeyExample').innerText = "";
			} else if ((formatString = format.exampleBibkey) != null && typeof(formatString) == 'string' && formatString.length > 0) {
				document.getElementById('bibkeyExample').innerText = formatString;
			} else {
				document.getElementById('bibkeyExample').innerText = "";
			}
		}
	}
	
	//function to set dynamic citation download timeout
	function setCitationDownloadTimeout(timeoutInSeconds) {
		if (generalOptions != null) {
			//set timeout. Note that timeout is milliseconds internally while the box is in seconds
			if (timeoutInSeconds > 99) timeoutInSeconds = 99;
			const timeoutInMilliseconds = timeoutInSeconds > 0 ? timeoutInSeconds*1000 : 1000;
			generalOptions["dyn_download_timeout"] = timeoutInMilliseconds;
			
			//udpate timeout box
			document.getElementById('downloadCitationTimeout').value = timeoutInMilliseconds/1000;
			
			//update options in background
			const updateMessage = { msgType: "update_options_background" , options: {} };
			updateMessage.options["dyn_download_timeout"] = timeoutInMilliseconds;
			sendMsg(updateMessage, doNothing);
		}
	}
	
	// function to rebuild option page, mode == 0 is completely resetting it, mode == 1 only for disabling/enabling timeout box
	function rebuildOptionPage(mode,index = -1,forceRedirectionSchemeRebuild = false, forceCitationFormatRebuild = false) {
		
		//early out
		if (mode < 0) return;
		
		// determine whether citation download is activated
		let downloadCitation = generalOptions["dyn_download"];
		
		//enable/disable timeout box depending on whether citation download is activated
		let doIt = downloadCitation;
		let timeOutBox = document.getElementById('downloadCitationTimeout');
		timeOutBox.disabled = !doIt;
		
		//get state of focus color checkbox
		doIt = generalOptions["set_focus_color"];
		
		//enable/disable color picker
		let focusColor = generalOptions["focus_color"];
		if (focusColor == null || focusColor == undefined) focusColor = "#a1e9ff";
		let colorPicker = document.getElementById('focusColorPicker');
		if (colorPicker != null) {
			colorPicker.disabled = !doIt;
			colorPicker.value = doIt ? focusColor : "#F2F1F0"; 
		}
		
		//enable/disable text color picker
		document.getElementById('focusTextColorCheckboxText').style.color = doIt ? "black" : "gray";
		focusColor = generalOptions["focus_text_color"];
		if (focusColor == null || focusColor == undefined) focusColor = "#000000";
		colorPicker = document.getElementById('focusTextColorPicker');
		if (colorPicker != null) {
			colorPicker.disabled = !doIt;
			colorPicker.value = doIt ? focusColor : "#F2F1F0"; 
		}
		
		//0 = first load, update everything
		if (mode == 0) {
			
			//set citation download checkboxes
			document.getElementById('downloadCitationCheckbox').checked = downloadCitation;
            document.getElementById('downloadCitationNatureCheckbox').checked = generalOptions["allowNatureSpringer"];
            document.getElementById('downloadCitationNatureMessageCheckbox').checked = generalOptions["showNatureSpringerMessage"];
            activateDynDownloadOptions(downloadCitation);
		     
            //set pdf fallback
            downloadCitation = generalOptions["pdfFallback"];
			document.getElementById('pdfFallbackCheckbox').checked = downloadCitation;
            document.getElementById('pdfFallbackAutoCheckbox').checked = generalOptions["pdfFallbackAutomatic"];
            activatePdfFallbackOptions(downloadCitation);
            
			//set value of timeout box
			timeOutBox.value = (generalOptions["dyn_download_timeout"])/1000;
			
			//set autofocus and autocopy checkbox
			document.getElementById('autofocusCheckbox').checked = generalOptions["text_autofocus"];
			
			//set focus color checkboxes
			document.getElementById('focusColorCheckbox').checked = doIt;
			document.getElementById('focusTextColorCheckboxText').style.color = doIt ? "black" : "gray";
			
			//set autofocus checkbox
			document.getElementById('backNavigationCheckbox').checked = generalOptions["backNavigation"];
			
			//set "hide-link" checkboxes
			document.getElementById('copyHideCheckbox').checked = generalOptions["hide_copy_option_link"];
			document.getElementById('formatHideCheckbox').checked = generalOptions["hide_custom_format_link"];
			document.getElementById('editHideCheckbox').checked = generalOptions["hide_redirection_scheme_link"];
			
			//set bobbels checkbox
			document.getElementById('bobbelsCheckbox').checked = generalOptions["bobbels"];
			
			//set copy workflow checkboxes
			doIt = generalOptions["text_autocopy"];
			document.getElementById('copyEnableCheckbox').checked = doIt;
			document.getElementById('copyLinkCheckbox').checked = generalOptions["text_autocopy_link"];
			document.getElementById('copyLinkOnChangeCheckbox').checked = generalOptions["text_autocopy_link_on_change"];
			document.getElementById('copyVisualCueCheckbox').checked = generalOptions["text_autocopy_visual"];
			document.getElementById('copyButtonLinkCheckbox').checked = generalOptions["copy_button_link"];
			document.getElementById('copyAlwaysEnableCheckbox').checked = generalOptions["text_autocopy_always"];
			activateAutocopyOptions(doIt);
			
			//hide or display auto copy options depending on availability
			try {
				const copyOptionDiv = document.getElementById("autocopyCheckboxes");
				if (navigator != undefined && navigator.clipboard != null && permRef != null) {
					copyOptionDiv.style.removeProperty("display");
				} else {
					copyOptionDiv.style["display"] = "none";
				}
			} catch(error) {
				copyOptionDiv.style["display"] = "none";
			}
			
			//set url rewrite adjuster, match insensitivity and url suppression checkbox
			doIt = generalOptions["urlCorrection"];
			activateURLRewriteUI(doIt);
			document.getElementById('urlCorrectionCheckbox').checked = doIt;
			document.getElementById('delimInsensitiveCheckbox').checked = generalOptions["urlCorrectionInsensitive"];
			document.getElementById('suppressUrlCheckbox').checked = generalOptions["suppressUrl"];
			doIt = generalOptions["urlCorrectionScheme"];
			if (doIt == null || typeof(doIt) != 'string' || doIt == "") doIt = "none";
			document.getElementById('ignoredURL').innerText = doIt;
			
			//set bibkey formatter ui
			doIt = generalOptions["bibkeyFormatting"];
			activateBibkeyFormatterUI(doIt);
			document.getElementById('bibkeyCheckbox').checked = doIt;
			document.getElementById('bibkeyFormatString').value = generalOptions["bibkeyFormatString"];
			document.getElementById('whiteSpaceChar').value = generalOptions["bibkeyWhiteSpace"];
			
			//set redirection scheme and citation format ui
			updateRedirectionSchemeUI(redirectionSchemes.schemes.length,redirectionSchemes.currentScheme,true);
			updateCitationFormatUI(citationFormats.formats.length,citationFormats.currentFormat,true);
		} else if (mode == 2) {
			activateURLRewriteUI(generalOptions["urlCorrection"]);
		} else if (mode == 3) {
			activateBibkeyFormatterUI(generalOptions["bibkeyFormatting"]);
		} else if (mode == 4) {
			//just update redirection schemes
			updateRedirectionSchemeUI(redirectionSchemes.schemes.length,index,forceRedirectionSchemeRebuild);
		} else if (mode == 5) {

			//just update citation formats
			updateCitationFormatUI(citationFormats.formats.length,index,forceCitationFormatRebuild);
		} else if (mode == 6) {
			activateAutocopyOptions(generalOptions["text_autocopy"]);
		}
	}
	
	// function to reset copy option UI elements
	function activateAutocopyOptions(allowAutocopy) {
		
		//enable/disable URL rewrite adjuster
		let elems = ['copyAlwaysEnableCheckboxText','copyLinkCheckboxText','copyAlwaysIntroText','copyLinkIntroText','copyLinkOnChangeIntroText','copyLinkOnChangeCheckboxText'];
		let length = elems.length;
		for (let i = 0; i<length; ++i) {
			document.getElementById(elems[i]).style.color = allowAutocopy ? "black" : "grey";
		}
		elems = ['copyAlwaysEnableCheckbox','copyLinkCheckbox','copyLinkOnChangeCheckbox'];
		length = elems.length;
		for (let i = 0; i<length; ++i) {
			document.getElementById(elems[i]).disabled = !allowAutocopy;
		}
	}
	
	// function to reset dynamic citation request UI elements
	function activateDynDownloadOptions(enable) {
		
		//enable/disable URL rewrite adjuster
		let elems = ['checkboxNatureText','checkboxNatureMessageText'];
		let length = elems.length;
		for (let i = 0; i<length; ++i) {
			document.getElementById(elems[i]).style.color = enable ? "black" : "grey";
		}
		elems = ['downloadCitationNatureCheckbox','downloadCitationNatureMessageCheckbox'];
		length = elems.length;
		for (let i = 0; i<length; ++i) {
			document.getElementById(elems[i]).disabled = !enable;
		}
	}
	
	// function to reset dynamic citation request UI elements
	function activatePdfFallbackOptions(enable) {
		
		//enable/disable URL rewrite adjuster
		let elems = ['pdfFallbackAutoCheckboxText'];
		let length = elems.length;
		for (let i = 0; i<length; ++i) {
			document.getElementById(elems[i]).style.color = enable ? "black" : "grey";
		}
		elems = ['pdfFallbackAutoCheckbox'];
		length = elems.length;
		for (let i = 0; i<length; ++i) {
			document.getElementById(elems[i]).disabled = !enable;
		}
	}
	
	// function to reset url rewrite UI elements
	function activateURLRewriteUI(adjustURL) {
		
		//enable/disable URL rewrite adjuster
		let elems = ['ignoreURLTextfieldText','ignoredURLText','ignoredURL','delimInsensitiveCheckboxText'];
		let length = elems.length;
		for (let i = 0; i<length; ++i) {
			document.getElementById(elems[i]).style.color = adjustURL ? "black" : "grey";
		}
		elems = ['ignoreURLTextfield','ignoreURLButton','delimInsensitiveCheckbox','removeURLButton'];
		length = elems.length;
		for (let i = 0; i<length; ++i) {
			document.getElementById(elems[i]).disabled = !adjustURL;
		}
	}
	
	// function to reset bibkey formatter UI elements
	function activateBibkeyFormatterUI(doIt) {
		//enable/disable bibkey formatting elements
		let elems = ['bibkeyExampleText','bibkeyExample'];
		let length = elems.length;
		for (let i = 0; i<length; ++i) {
			document.getElementById(elems[i]).style.color = doIt ? "black" : "grey";
		}
		elems = ['bibkeyFormatString','setBibkeyString','showCurrentBibkeyString','restoreBibkeyString','restoreBibkeyDefault','testBibkeyString','whiteSpaceChar'];
		length = elems.length;
		for (let i = 0; i<length; ++i) {
			document.getElementById(elems[i]).disabled = !doIt;
		}
	}
	
	
	// function to reset citation format UI elements
	function updateCitationFormatUI(activate,index = -1,forceRebuild = false) {
		
		//format selector
		const formatSelector = document.getElementById('citationSelectorBox');
		
		function activateElements(doIt) {
			//enable/disable citation format UI elements
			let elems = ['editCitationFormatText','citationFormatNameText','citationFormatFileExtensionText','citationFormatEncodingText','citationFormatSourceText'];
			let length = elems.length;
			for (let i = 0; i<length; ++i) {
				document.getElementById(elems[i]).style.color = doIt ? "black" : "grey";
			}
			elems = ['citationSelectorBox','citationFormatName','citationFormatFileExtension','citationFormatEncoding','citationFormatSource','citationFormatSave','citationFormatRemove','citationFormatExport'];
			length = elems.length;
			for (let i = 0; i<length; ++i) {
				document.getElementById(elems[i]).disabled = !doIt;
			}
		}
		
		function showFormatOptions(format, formatSource, index) {
			
			//sanitize arguments
			if (formatSource == null || typeof(formatSource) != 'string') formatSource = "[\n\n]";
			
			//populate UI elements
			let elems = ['citationFormatName','citationFormatFileExtension','citationFormatEncoding','citationFormatSource'];
			let values = [format.name,format.extension,format.encoding,formatSource];
			for (let i = 0; i<elems.length; ++i) {
				document.getElementById(elems[i]).value = values[i]; 
			}
			
			//select value for selector box
			if (index < 0) index = 0;
			formatSelector.value = index;
		}
		
		//populate format selector and text fields
		if (activate > 0) {
			//only update indicated element if index != -1 and rebuild not forced, otherwise rebuild
			if (index > -1 && index < activate && !forceRebuild) {
				
				let format = citationFormats.formats[index];
				
				//check if element needs to be added to selector box
				if (index < formatSelector.childNodes.length) {
					//if not, update name in selector box
					let option = formatSelector.childNodes[index];
					if (format.name != option.innerText) option.innerText = format.name;
				} else {
					//if yes, add to end of selector box and select
					let option = document.createElement("option");
					option.value = index; option.innerText = format.name;
					formatSelector.appendChild(option);
				}
				
				//update ui elements
				showFormatOptions(format,citationFormats.currentFormatSource, index);
			} else {
				//completely rebuild selector box
				while (formatSelector.hasChildNodes()) {
					formatSelector.removeChild(formatSelector.childNodes[0]);
				}
				let formats = citationFormats.formats;
				for (let i = 0; i<activate; ++i) {
					let option = document.createElement("option");
					option.value = i; option.innerText = formats[i].name;
					formatSelector.appendChild(option);
				}
				
				//populate ui elements with data from current scheme or first scheme
				if (index < -1) index = citationFormats.formats.length - 1;
				if (index < 0) index = 0;
				formats = formats[index];
				showFormatOptions(formats,citationFormats.currentFormatSource,index);
			}
			
			//activate elements
			activateElements(true);
		} else {
			
			//remove all possibly remaining options and disable
			while (formatSelector.hasChildNodes()) {
				formatSelector.removeChild(formatSelector.childNodes[0]);
			}
			
			//depopulate ui elements
			showFormatOptions({ name: "", extension: "", encoding: ""},"",-1);
			
			//deactivate elements
			activateElements(false)
		}
	}
	
	// function to reset redirection link UI elements
	function updateRedirectionSchemeUI(activate,index = -1,forceRebuild = false) {
		
		//scheme selector
		const schemeSelector = document.getElementById('redirectionSelectorBox');
		
		function activateElements(doIt) {
			//enable/disable redirection scheme UI elements
			let elems = ['editRedirectionSchemeText','redirectionSchemeNameText','redirectionSchemeNameTooltipText','redirectionSchemeAppearance1Text','redirectionSchemeFormatStringText','whiteSpaceCharRedirectionText'];
			let length = elems.length;
			for (let i = 0; i<length; ++i) {
				document.getElementById(elems[i]).style.color = doIt ? "black" : "grey";
			}
			elems = ['redirectionSelectorBox','redirectionSchemeName','redirectionSchemeTooltip','redirectionSchemeAppearance1','redirectionSchemeAppearance2','redirectionSchemeFormatString','redirectionSchemeSave','redirectionSchemeRemove','whiteSpaceCharRedirection','redirectionSchemeExport'];
			length = elems.length;
			for (let i = 0; i<length; ++i) {
				document.getElementById(elems[i]).disabled = !doIt;
			}
		}
		
		function showSchemeOptions(name, tooltip, formatString, showAsTooltip, whiteSpaceChar, index) {
			
			//sanitize arguments
			if (name == null || typeof(name) != 'string') name = "";
			if (tooltip == null || typeof(tooltip) != 'string') tooltip = "";
			if (formatString == null || typeof(formatString) != 'string') formatString = "";
			if (whiteSpaceChar == null || typeof(whiteSpaceChar) != 'string') {
				whiteSpaceChar = "+";
			} else if (whiteSpaceChar.length > 1) {
				whiteSpaceChar = whiteSpaceChar.slice(0,1);
			}
			showAsTooltip = (showAsTooltip != null && typeof(showAsTooltip) == 'boolean' && showAsTooltip == true);
			
			//populate UI elements
			let elems = ['redirectionSchemeName','redirectionSchemeTooltip','redirectionSchemeFormatString','whiteSpaceCharRedirection'];
			let values = [name,tooltip,formatString,whiteSpaceChar];
			for (let i = 0; i<elems.length; ++i) {
				document.getElementById(elems[i]).value = values[i]; 
			}
			
			//set radio button
			document.getElementById("redirectionSchemeAppearance1").checked = !showAsTooltip;
			document.getElementById("redirectionSchemeAppearance2").checked = showAsTooltip;
			
			//select value for selector box
			if (index < 0) index = 0;
			schemeSelector.value = index;
		}
		
		//populate scheme selector and text fields
		if (activate > 0) {
			
			//only update indicated element if index != -1 and rebuild not forced, otherwise rebuild
			if (index > -1 && index < activate && !forceRebuild) {
				let scheme = redirectionSchemes.schemes[index];
				
				//check if element needs to be added to selector box
				if (index < schemeSelector.childNodes.length) {
					//if not, update name in selector box
					let option = schemeSelector.childNodes[index];
					if (scheme.name != option.innerText) option.innerText = scheme.name;
				} else {
					//if yes, add to end of selector box and select
					let option = document.createElement("option");
					option.value = index; option.innerText = scheme.name;
					schemeSelector.appendChild(option);
				}
				
				//update ui elements
				showSchemeOptions(scheme.name,scheme.tooltip,redirectionSchemeFormatStrings[index],scheme.showAsTooltip,scheme.whiteSpaceReplacement, index);
			} else {
				//completely rebuild selector box
				while (schemeSelector.hasChildNodes()) {
					schemeSelector.removeChild(schemeSelector.childNodes[0]);
				}
				let schemes = redirectionSchemes.schemes;
				for (let i = 0; i<activate; ++i) {
					let option = document.createElement("option");
					option.value = i; option.innerText = schemes[i].name;
					schemeSelector.appendChild(option);
				}
				
				//populate ui elements with data from current scheme or first scheme
				if (index < -1) index = redirectionSchemes.schemes.length - 1;
				if (index < 0) index = 0;
				schemes = schemes[index];
				showSchemeOptions(schemes.name,schemes.tooltip,redirectionSchemeFormatStrings[index],schemes.showAsTooltip,schemes.whiteSpaceReplacement,index);
			}
			
			//activate elements
			activateElements(true);
		} else {
			
			//remove all possibly remaining options and disable
			while (schemeSelector.hasChildNodes()) {
				schemeSelector.removeChild(schemeSelector.childNodes[0]);
			}
			
			//depopulate ui elements
			showSchemeOptions("","","","","",-1);
			
			//deactivate elements
			activateElements(false)
		}
	}
	
	// function to set ignored URL scheme
	function setURLScheme(remove = false) {
		//get old scheme
		let prevURL = document.getElementById('ignoredURL').innerText;
		if (prevURL == "none") prevURL = "";
		let newURL = "";
		
		//generate confirm dialogue
		let confirmVal = "Are you sure you want to ";
		if (remove) {
			if (prevURL != "") {
				confirmVal += "REMOVE \"" + prevURL + "\" as the";
			} else {
				//early out if nothing to do
				return;
			}
		} else {
			//set text-field text as new url scheme to be ignored
			newURL = document.getElementById('ignoreURLTextfield').value;
			newURL = (newURL == null || typeof(newURL) != 'string') ? "" : newURL.replace(/[^\x00-\x7F]+/g,"").replace(/^[\s]*no(?:|n[e]?)[\s]*$/i,"");
			
			//early out if nothing changes or invalid input
			if (prevURL == newURL || newURL == "") return;
			//change message depending on what to do
			if (prevURL == "") {
				confirmVal += "SET \"" + newURL + "\"  as the new";
			} else {
				confirmVal += "REPLACE \"" + prevURL + "\" by \"" + newURL + "\"  as the new";
			}
		}
		confirmVal += " URL scheme to be ignored by the URL matcher?";
		
		//ask to replace scheme
		if (confirm(confirmVal)) {
			setOption("urlCorrectionScheme",newURL,-1);
			document.getElementById('ignoredURL').innerText = (newURL != "") ? newURL : "none";
		}
	}
	
	// empty handler, do nothing
	function doNothing(message) {
		message = null;//blupp
	}
	
	// request options on load
	document.addEventListener("DOMContentLoaded", requestOptions );
	
	//add listener to checkboxes
	{
		let checkboxes = [["pdfFallbackAutoCheckbox","pdfFallbackAutomatic",1],["downloadCitationNatureMessageCheckbox","showNatureSpringerMessage",1],["autofocusCheckbox","text_autofocus",1],["backNavigationCheckbox","backNavigation",1],["focusColorCheckbox","set_focus_color",1],["copyAlwaysEnableCheckbox","text_autocopy_always",1],["copyButtonLinkCheckbox","copy_button_link",1],["copyLinkCheckbox","text_autocopy_link",1],["copyLinkOnChangeCheckbox","text_autocopy_link_on_change",1],["copyVisualCueCheckbox","text_autocopy_visual",1],["copyHideCheckbox","hide_copy_option_link",1],["formatHideCheckbox","hide_custom_format_link",1],["editHideCheckbox","hide_redirection_scheme_link",1],["bobbelsCheckbox","bobbels",1],["urlCorrectionCheckbox","urlCorrection",2],["delimInsensitiveCheckbox","urlCorrectionInsensitive",1],["suppressUrlCheckbox","suppressUrl",1],["bibkeyCheckbox","bibkeyFormatting",3]];
		let length = checkboxes.length;
		for (let i = 0; i < length; ++i) {
			document.getElementById(checkboxes[i][0]).addEventListener('change',function(event) {
					// set "text autofocus" option
					setOption(checkboxes[i][1],this.checked == true,checkboxes[i][2]);
				}
			);
		}
	}
	
	//add listener for pdf fallback checkbox
	document.getElementById('pdfFallbackCheckbox').addEventListener('change',function(event) {
            
            //state
			let state = (this.checked == true);
        
			// set pdf fallback
			setOption("pdfFallback",state,1);
			
			//update ui
			activatePdfFallbackOptions(state);
		}
	);
	
	//add listener for dynamic download checkbox
	document.getElementById('downloadCitationCheckbox').addEventListener('change',function(event) {
            
            //state
			let state = (this.checked == true);
        
			// set dynamic download
			setOption("dyn_download",state,1);
			
			//update ui
			activateDynDownloadOptions(state);
		}
	);
	
	//add listener Nature-Springer checkbox
	document.getElementById('downloadCitationNatureCheckbox').addEventListener('change',function(event) {
		
			//state
			let state = (this.checked == true);
            
			// set option
			setOption("allowNatureSpringer",state,1);
			
			//ask for permissions, change checkbox again depending on outcome
			setNaturePermission(state);
		}
	);
	
	//add listener to auto copy enable checkbox
	document.getElementById('copyEnableCheckbox').addEventListener('change',function(event) {
		
			//state
			let state = (this.checked == true);
		
			// tentatively set "text autofocus" option
			setOption("text_autocopy",state,1);
			
			//ask for permissions, change checkbox again depending on outcome
			setClipboardPermission(state);
		}
	);
	
	//add listener to color picker
	document.getElementById('focusColorPicker').addEventListener('change',function(event) {
			// set "set focus color" option
			setOption("focus_color",this.value);
		}
	);
	document.getElementById('focusTextColorPicker').addEventListener('change',function(event) {
			// set "set focus color" option
			setOption("focus_text_color",this.value);
		}
	);
	
	//add listener to Download-Citation time out
	document.getElementById('downloadCitationTimeout').addEventListener('change',function(event) {
			// set "download citation timeout" option
			setCitationDownloadTimeout(this.value);
		}
	);
	
	//add listener to button setting URL scheme
	document.getElementById('ignoreURLButton').addEventListener('click', function(event) {
			setURLScheme();
		}
	);
	
	//add listener to button removing URL scheme
	document.getElementById('removeURLButton').addEventListener('click', function(event) {
			setURLScheme(true);
		}
	);
	
	//add listener to white space character field
	document.getElementById('whiteSpaceChar').addEventListener('change',function(event) {
			// set "white space" char
			let char = this.value.replace(/(?:[^\x00-\x7F]*|[\s]*)/g,"");
			setOption("bibkeyWhiteSpace",char);
			this.value = char;
		}
	);
	
	//add listener to "set/test bibkey format string"-button
	{
		let buttons = ['setBibkeyString','testBibkeyString'], msgTypes = ["update_bibkeyformat_background","test_bibkeyformat_background"], confirmation = [false,true];
		let length = buttons.length;
		for (let i = 0; i<length; ++i) {
			document.getElementById(buttons[i]).addEventListener('click',function(event) {
					// get text from bibkey format string box
					const text = document.getElementById('bibkeyFormatString').value;
					if (text != null && typeof(text) == 'string' && text.length > 0) {
						if (confirmation[i] || confirm("Are you sure you want to CHANGE the custom bibkey format?")) {
							setOption("bibkeyFormatString",text,1,msgTypes[i], 
								function(format) {
									//set bibkey format
									if (format != null) setBibkeyFormat(format);
								}
							);
						}
					}
				}
			);
		}
	}
	//add listener to "restore bibkey format string"-button
	document.getElementById('restoreBibkeyString').addEventListener('click',function(event) {
			
			// set text from bibkey format string box
			if (previousBibkeyFormatString != null && previousBibkeyFormatString.length > 0) {
				document.getElementById('bibkeyFormatString').value = previousBibkeyFormatString;
			}
		}
	);
	
	//add listener to "show current bibkey format string"-button
	document.getElementById('showCurrentBibkeyString').addEventListener('click',function(event) {
			// get text from bibkey format string box
			document.getElementById('bibkeyFormatString').value = generalOptions.bibkeyFormatString;
		}
	);
	
	//add listener to "show default bibkey format string"-button
	document.getElementById('restoreBibkeyDefault').addEventListener('click',function(event) {
			// get text from bibkey format string box
			document.getElementById('bibkeyFormatString').value = "{!authors[0,0]}{year||access_year}{month_abbrev}";
		}
	);
	
	//add listener to "show format string rules"-button
	document.getElementById('showBibkeyInfo').addEventListener('click',function(event) {
			// figure out if bibkeyInfo is hidden or not
			const bibkeyInfo = document.getElementById('bibkeyInfo');
			if (bibkeyInfo.style.display == "none") {
				bibkeyInfo.style.display = "inline";
				this.value = "Hide full reference";
			} else {
				bibkeyInfo.style.display = "none";
				this.value = "Show full reference";
			}
		}
	);
	
	//add listener to "show delimiter insensitive matching info"-button
	document.getElementById('showDelimInsensitiveInfo').addEventListener('click',function(event) {
			// figure out if delimInsensitiveInfo is hidden or not
			const delimInsensitiveInfo = document.getElementById('delimInsensitiveInfo');
			if (delimInsensitiveInfo.style.display == "none") {
				delimInsensitiveInfo.style.display = "inline";
				this.value = "Hide what is this about";
			} else {
				delimInsensitiveInfo.style.display = "none";
				this.value = "Show what is this about";
			}
		}
	);
	
	//add listener to add scheme link
	document.getElementById('addRedirectionScheme').addEventListener('click',function(event) {
			setRedirectionScheme(redirectionSchemes.schemes.length, { name: "Custom" , tooltip: "Custom tooltip" , formatString: "None", whiteSpaceReplacement: "+" , showAsTooltip: false});
		}
	);
	
	//add listener to delete scheme button
	document.getElementById('redirectionSchemeRemove').addEventListener('click',function(event) {
			//get index of selected scheme
			const selector = document.getElementById('redirectionSelectorBox');
			index = parseInt(selector.options[selector.selectedIndex].value);
			
			//tell background to remove scheme if user is sure
			if (confirm("Are you sure you want to REMOVE the redirection scheme \"" + redirectionSchemes.schemes[index].name + "\"?")) {
				setRedirectionScheme(index, null);
			}
		}
	);
	
	//add listener to save scheme button
	document.getElementById('redirectionSchemeSave').addEventListener('click',function(event) {
			//get index of selected scheme
			const selector = document.getElementById('redirectionSelectorBox');
			index = parseInt(selector.options[selector.selectedIndex].value);
			
			//tell background to change scheme if user is sure
			const name = document.getElementById('redirectionSchemeName');
			if (name.value.replace(/[\s]+/g,"") == "") name.value = "Custom";
			if (confirm("Are you sure you want to CHANGE the redirection scheme \"" + redirectionSchemes.schemes[index].name + "\"?")) {
				setRedirectionScheme(index, { name: name.value , tooltip: document.getElementById('redirectionSchemeTooltip').value , formatString: document.getElementById('redirectionSchemeFormatString').value, whiteSpaceReplacement: document.getElementById('whiteSpaceCharRedirection').value, showAsTooltip: (document.getElementById('redirectionSchemeAppearance2').checked == true)});
			}
		}
	);
	
	//add listener to export scheme button
	document.getElementById('redirectionSchemeExport').addEventListener('click',function(event) {			
			//call export function
			const name = document.getElementById('redirectionSchemeName');
			if (name.value.replace(/[\s]+/g,"") == "") name.value = "Custom";
			exportRedirectionScheme([ { name: name.value , tooltip: document.getElementById('redirectionSchemeTooltip').value , formatString: document.getElementById('redirectionSchemeFormatString').value, whiteSpaceReplacement: document.getElementById('whiteSpaceCharRedirection').value, showAsTooltip: (document.getElementById('redirectionSchemeAppearance2').checked == true)} ] , name.value);
		}
	);
	
	//add listeners to example scheme downloads
	document.getElementById('exportGoogleScholarScheme').addEventListener('click',function(event) {			
			//call export function
			exportRedirectionScheme([ {name: "GScholar",tooltip: "Find article on Google Scholar", formatString: "{doi\\https://scholar.google.com/scholar_lookup?&doi=\\}{title\\&title=\\}",whiteSpaceReplacement: "+",showAsTooltip: true} ] , "GScholar");
		}
	);
	//add listeners to example scheme downloads
	document.getElementById('exportGoogleBooksScheme').addEventListener('click',function(event) {			
			//call export function
			exportRedirectionScheme([ {name: "GBooks", tooltip: "Find ISBN on Google Books",formatString: "{!isbn\\https://www.google.com/search?tbo=p&tbm=bks&q=isbn:\\&num=10\\/[\\-]//gi/}", whiteSpaceReplacement: "+", showAsTooltip: true} ] , "GBooks");
		}
	);
	
	
	//add listeners to export/import/remove-all schemes links
	{
		const functions = [exportRedirectionSchemes,removeRedirectionSchemes,openRedirectionSchemeFile];
		const buttons = ['exportRedirectionSchemes','removeRedirectionSchemes','importRedirectionSchemes'];
		const numFuncs = functions.length;
		for (let i = 0; i<numFuncs; ++i) {
			document.getElementById(buttons[i]).addEventListener('click',function(event) {
					functions[i]();
				}
			);
			
		}
	}
	
	//add listener to hidden import-file selector
	document.getElementById('importedRedirectionSchemes').addEventListener('change', function(files) {
			//get first file in file list
			files = files.target.files;
			
			//early out
			if (files == null || files.length == 0) return;
					
			//import from first file if valid
			files = files[0];
			
			if (!files.name.match('.bnrs')) return;
			
			//set file reader that passes file content to import function
			let reader = new FileReader();
			reader.onload = function() {
				importRedirectionSchemes(reader.result);
			}
			reader.readAsText(files);
			this.value = "";
		}	
	);
	
	//add listener to redirection scheme selector box
	document.getElementById('redirectionSelectorBox').addEventListener('change',function(event) {
			
			//rebuild popup with index of selected scheme
			updateRedirectionSchemeUI(redirectionSchemes.schemes.length,parseInt(this.options[this.selectedIndex].value));			
		}
	);
	
	//add listener to add citation format link
	document.getElementById('addCitationFormat').addEventListener('click',function(event) {
			setCitationFormat(citationFormats.formats.length, { name: "Custom format" , extension: "txt" , encoding: "utf8" , formatSource: "[\n\"\"\n]"});
		}
	);
	
	//add listener to delete citation format button
	document.getElementById('citationFormatRemove').addEventListener('click',function(event) {
			//get index of selected citation format
			const selector = document.getElementById('citationSelectorBox');
			index = parseInt(selector.options[selector.selectedIndex].value);
			
			//tell background to remove citation format if user is sure
			if (confirm("Are you sure you want to REMOVE the CUSTOM citation format \"" + citationFormats.formats[index].name + "\"?")) {
				setCitationFormat(index, null);
			}
		}
	);
	
	//add listener to save citation format button
	document.getElementById('citationFormatSave').addEventListener('click',function(event) {
			//get index of selected citation format
			const selector = document.getElementById('citationSelectorBox');
			index = parseInt(selector.options[selector.selectedIndex].value);
			
			//tell background to change citation format if user is sure
			const name = document.getElementById('citationFormatName');
			const extension = document.getElementById('citationFormatFileExtension');
			const encoding = document.getElementById('citationFormatEncoding');
			if (name.value == "") name.value = "Custom format";
			extension.value = extension.value.replace(/[^a-zA-Z0-9]+/g,"");
			if (extension.value == "") extension.value = "txt";
			encoding.value = encoding.value.replace(/[^a-zA-Z0-9]+/g,"");
			if (encoding.value == "") encoding.value = "txt";
			if (confirm("Are you sure you want to CHANGE the citation format \"" + citationFormats.formats[index].name + "\"?")) {
				setCitationFormat(index, { name: name.value , extension: extension.value , encoding: encoding.value , formatSource: document.getElementById('citationFormatSource').value });
			}
		}
	);
	
	//add listener to export citation format button
	document.getElementById('citationFormatExport').addEventListener('click',function(event) {			
			//call citation format export function
			const name = document.getElementById('citationFormatName');
			const extension = document.getElementById('citationFormatFileExtension');
			const encoding = document.getElementById('citationFormatEncoding');
			if (name.value == "") name.value = "Custom format";
			extension.value = extension.value.replace(/[^a-zA-Z0-9]+/g,"");
			if (extension.value == "") extension.value = "txt";
			encoding.value = encoding.value.replace(/[^a-zA-Z0-9]+/g,"");
			if (encoding.value == "") encoding.value = "txt";
			exportCitationFormat([ { name: name.value , extension: extension.value , encoding: encoding.value , formatSource: document.getElementById('citationFormatSource').value} ] , name.value);
		}
	);
	
	//add listeners to example citation format downloa
	document.getElementById('exportExampleFormat').addEventListener('click',function(event) {			
			//call export function
			exportCitationFormat([ {name: "Title", extension: "txt" , encoding: "utf8" , formatSource: "[\n\"Title:\\n\", \{ \"req\": true, \"bibfields\": [ [\"title\",false,\"\",\"\", [] ] ] }\n]"} ] , "TitleFormat");
		}
	);
	
	
	//add listeners to export/import/remove-all citation formats links
	{
		const functions = [requestCitationFormatSources,removeCitationFormats,openCitationFormatFile];
		const buttons = ['exportCitationFormats','removeCitationFormats','importCitationFormats'];
		const numFuncs = functions.length;
		for (let i = 0; i<numFuncs; ++i) {
			document.getElementById(buttons[i]).addEventListener('click',function(event) {
					functions[i]();
				}
			);
			
		}
	}
	
	//add listener to hidden import-file selector for citation formats
	document.getElementById('importedCitationFormats').addEventListener('change', function(files) {
			//get first file in file list
			files = files.target.files;
			
			//early out
			if (files == null || files.length == 0) return;
					
			//import from first file if valid
			files = files[0];
			
			if (!files.name.match('.bnfa')) return;
			
			//set file reader that passes file content to import function
			let reader = new FileReader();
			reader.onload = function() {
				importCitationFormats(reader.result);
			}
			reader.readAsText(files);
			this.value = "";
		}	
	);
	
	//add listener to citation format selector box
	document.getElementById('citationSelectorBox').addEventListener('change',function(event) {
			
			//rebuild popup with index of selected format
			if (citationFormats != null && typeof(citationFormats) == 'object') {
				let index = parseInt(this.options[this.selectedIndex].value);
				citationFormats.currentFormat = index;
				sendMsg( { msgType: "request_citation_format_source_background", index: index }, getCitationFormat );
			}
		}
	);
	
	//add listener to "show format string rules"-button
	document.getElementById('showFormatInfo').addEventListener('click',function(event) {
			// figure out if formatInfo is hidden or not
			const formatInfo = document.getElementById('formatInfo');
			if (formatInfo.style.display == "none") {
				formatInfo.style.display = "inline";
				this.value = "Hide format array reference";
			} else {
				formatInfo.style.display = "none";
				this.value = "Show format array reference";
			}
		}
	);
	
	// function to send messages
	function sendMsg(message, handler) {
		chrome.runtime.sendMessage(message, function(response) {
				if (chrome.runtime.lastError) {
					console.error(chrome.runtime.lastError);
				} else {
					handler(response);
				}
			}
		);
	}
	
	//function to set or revoke clipboard write access
	function setClipboardPermission(allowed) {
		function setClipboardOption(enable) {
			//set flag
			enable = (enable == true);
			
			//update options in background
			sendMsg({ msgType: "update_options_background" , options: { text_autocopy: enable }}, doNothing);
			
			//update options locally
			generalOptions["text_autocopy"] = enable;
			
			//reset checkbox
			document.getElementById("copyEnableCheckbox").checked = enable;
			activateAutocopyOptions(enable);
		}
		
		if (allowed) {
			chrome.permissions.request({ permissions: ["clipboardWrite"] }, setClipboardOption);
			
		} else {
			chrome.permissions.remove({ permissions: ["clipboardWrite"] }, doNothing);
			setClipboardOption(false);
			activateAutocopyOptions(false);
		}
	}
	
	//function to set or revoke Nature-Springer cross site access
	function queryOptionalPermissions(mode) {
		
        function setClipboardOption(enable) {
			
			//set flag
			enable = (enable == true);
			
			//update options in background
			sendMsg({ msgType: "update_options_background" , options: { text_autocopy: enable }}, doNothing);
			
			//update options locally
			generalOptions["text_autocopy"] = enable;
			
			//reset checkbox
			document.getElementById("copyEnableCheckbox").checked = enable;
			
            //rebuild
            rebuildOptionPage(mode);
			
		}
        
		function setPermissionOption(enable) {
			
			//set flag
			enable = (enable == true);
			
			//update options in background
			sendMsg({ msgType: "update_options_background" , options: { allowNatureSpringer: enable }}, doNothing);
			
			//update options locally
			generalOptions["allowNatureSpringer"] = enable;
			
			//reset checkbox
			document.getElementById("downloadCitationNatureCheckbox").checked = enable;
            
            //query clipboard write permission
            chrome.permissions.contains({ permissions: ["clipboardWrite"] }, setClipboardOption);
		}
		chrome.permissions.contains({ origins: ['*://citation-needed.springer.com/*'] }, setPermissionOption);
	}
	
	//function to set or revoke Nature-Springer cross site access
	function setNaturePermission(allowed) {
		
		function setPermissionOption(enable) {
			
			//set flag
			enable = (enable == true);
			
			//update options in background
			sendMsg({ msgType: "update_options_background" , options: { allowNatureSpringer: enable }}, doNothing);
			
			//update options locally
			generalOptions["allowNatureSpringer"] = enable;
			
			//reset checkbox
			document.getElementById("downloadCitationNatureCheckbox").checked = enable;
		}
		
		if (allowed) {
			chrome.permissions.request({ origins: ['*://citation-needed.springer.com/*'] }, setPermissionOption);
		} else {
			chrome.permissions.remove({ origins: ['*://citation-needed.springer.com/*'] }, doNothing);
			setPermissionOption(false);
		}
	}
	
	const permRef = chrome.permissions;
    
    //hide fallback description and automatic fetching option for Chrome
    document.getElementById("fallbackFirefox").style = "display: none";
    

	
	//function to set redirection scheme in the background
	function setRedirectionScheme(index, scheme, removeAll = false) {
		//update options in background
		sendMsg({ msgType: "update_redirection_schemes_background" , index: index , scheme: scheme , removeAll: removeAll }, updateRedirectionScheme);
	}
	
	//function to set citation format in the background
	function setCitationFormat(index, format, removeAll = false, isCSL = false) {
		//update options in background
		sendMsg({ msgType: "update_citation_formats_background" , index: index , format: format , removeAll: removeAll , isCSL: (isCSL != null && isCSL == true) }, updateCitationFormat);
	}
	
	function requestCitationFormatSources() {
		sendMsg( { msgType: "request_citation_format_source_background", index: -1 }, exportCitationFormats );
	}
	
	//function to request options from background or from storage
	function requestOptions() {
		sendMsg({ msgType: "request_options_background" , getFormatStrings: true , getCitationFormats: true },
			function (options) {
				setOptions(options);
			}
		);
	}
	
	
}());
