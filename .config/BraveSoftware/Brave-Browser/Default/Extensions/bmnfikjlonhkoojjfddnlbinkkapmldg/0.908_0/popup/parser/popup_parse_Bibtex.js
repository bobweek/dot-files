const BINBibtex = ( function () {
	
	//function to build advanced option page
	function buildAdvancedOptionPage(parseMode, advancedOptionPage, setDisplayOption) {
		
		//get display options
		const dispOpts = displayOptions.optionArray[parseMode];
		
		//set height and alignment
		advancedOptionPage.style.height = "8.2cm";
		
		//center element
		const centerElem = document.createElement("center");
		centerElem.style.margin = "0 auto"; centerElem.style.width = "100%"; centerElem.style.padding = "0cm";
		advancedOptionPage.appendChild(centerElem);
		
		/*FIELD SELECTION*/
		
		//add info text for field selection
		{
			const infoText = document.createElement("p");
			infoText.innerText = "Those preferring clean .bib files may here switch on/off individual fields.";
			centerElem.appendChild(infoText); centerElem.appendChild(document.createElement("br"));
		}
		
		//add table in center element
		let table = document.createElement("table");
 		centerElem.appendChild(table);
		let tableCell, tableRow, elem;
		
		//create elements, add event listener and add to advanced option page
		const options = ["keywords","abstract","issn","isbn","publisher","eprint","note","school","volume","number","pages","doi","month","year","journal","title","booktitle","chapter","date","urldate","language","hyphenation","address"];
		const titles = ["Keywords","Abstract","ISSN","ISBN","Publisher","EPrint","Additional notes","School","Volume","Number/Issue","Pages","DOI","Month","Year","Journal","Title","Booktitle","Chapter","ISO date","URL date","Language","Hyphenation","Address"];
		for (let i = 0; i<titles.length; ++i) {
			if (i%2 == 0) {
				tableRow = document.createElement("tr");
				table.appendChild(tableRow);
			}
			
			//create and append new cell
			tableCell = document.createElement("td");
			tableCell.style = "padding-right: 0.2cm; padding-left: 0.2cm";
			tableRow.appendChild(tableCell);
			
			//create and append checkbox to table cell
			elem = document.createElement("input");
			elem.type = "checkbox"; elem.title = titles[i]; elem.id = options[i] + "Checkbox"; elem.checked = dispOpts[options[i]];
			tableCell.appendChild(elem);
			
			//make it functional
			elem.addEventListener('change', function(event) {
					setDisplayOption(parseMode, options[i],this.checked == true);
				}
			);
			
			//add checkbox text
			elem = document.createElement("span");
			elem.title = titles[i]; elem.id = options[i] + "Text"; elem.innerText = titles[i];
			tableCell.appendChild(elem);
		}
		//line separator
		centerElem.appendChild(document.createElement("br"));
		
    /*MONTH OPTIONS*/
		
		//add info text 
		{
			const infoText = document.createElement("p");
			infoText.innerText = "Adjust the month format to the demands of your latex system:";
			centerElem.appendChild(document.createElement("br"));
			centerElem.appendChild(infoText);
			centerElem.appendChild(document.createElement("br"));
		}
    
    //add table in center element
		table = document.createElement("table");
		table.style.style = "margin: 0 auto";
 		centerElem.appendChild(table);
		tableRow = document.createElement("tr");
		table.appendChild(tableRow);
		
		//add text
		elem = document.createElement("span");
		elem.title = "Month format"; elem.id = "monthText"; elem.innerText = "Month format: ";
		tableRow.appendChild(elem);
		
		//add month format selector box
		elem = document.createElement("select");
		elem.title = "Month Format"; elem.id = "monthSelector";
		tableRow.appendChild(elem);
		
		//add options to url mode selector box
		{
			const options = ["0","1","2","3"], titles = ["Bibtex abbreviation","Integer","Abbreviated string","Full string"];
			for (let i = 0; i<4; ++i) {
				let option = document.createElement("option");
				option.value = options[i]; option.innerText = titles[i];
				elem.appendChild(option);
			}
		}
    
    //select current option
    elem.value = "" + (dispOpts.monthNumber == true ? 1 : dispOpts.monthMode);
    
    //add event listener to selector box
		elem.addEventListener('change',function(event) {
				//get new mode
				const mode = parseInt(this.options[this.selectedIndex].value);
				//update option in background
				setDisplayOption(parseMode, "monthMode",mode);
        setDisplayOption(parseMode, "monthNumber", (mode == 1));
			}
		);
        
    //line separator
		centerElem.appendChild(document.createElement("br"));
    
		/*MISC OPTIONS*/
		
		//add info text 
		{
			const infoText = document.createElement("p");
			infoText.innerText = "Various options for compatibility and convenience";
			centerElem.appendChild(document.createElement("br"));
			centerElem.appendChild(infoText);
			centerElem.appendChild(document.createElement("br"));
		}
		
		//add table in center element
		table = document.createElement("table");
		table.style.style = "margin: 0 auto";
 		centerElem.appendChild(table);
		
		//add misc options
		{
			const titles = ["Journal in Biblatex style","Set \"@online\" as default source type","Initials for first/middle author names","Protect multi-letter author initials","Use double curly brackets for title","Use double curly brackets for abstract","Set organization if default source type"];
			const ids = ["biblatexStyleCheckbox","onlineCheckbox","initialsCheckbox","relaxInitialsCheckbox","escapeTitleCheckbox","setOrgCheckbox"];
			const textIds = ["biblatexStyleCheckboxText","onlineCheckboxText","initialsCheckboxText","relaxInitialsCheckboxText","escapeTitleCheckboxText","escapeAbstractCheckboxText","setOrgCheckboxText"];
			const optionNames = ["biblatexStyle","onlineDefaultType","forceInitials","relaxInitials","escapeTitle","escapeAbstract","journalAsOrg"];
			
			const numOpts = titles.length;
			
			for (let i = 0; i<numOpts; ++i) {
				//create checkbox for options
				tableRow = document.createElement("tr");
				table.appendChild(tableRow);
				elem = document.createElement("input");
				elem.type = "checkbox"; elem.title = titles[i]; elem.id = ids[i]; elem.checked = dispOpts[optionNames[i]];
				tableRow.appendChild(elem);
				//make checkbox functional
				elem.addEventListener('change', function(event) {
						setDisplayOption(parseMode, optionNames[i],this.checked == true);
					}
				);
				
				//add checkbox text
				elem = document.createElement("span");
				elem.title = titles[i]; elem.id = textIds[i]; elem.innerText = titles[i];
				tableRow.appendChild(elem);
			}
		}
		
		//line separator
		centerElem.appendChild(document.createElement("br"));
		
		/*URL MODE*/
		
		//add info text for url mode
		{
			const infoText = document.createElement("p");
			infoText.innerText = "It is often useful to specify whether and how to include the url and doi field.";
			centerElem.appendChild(infoText); centerElem.appendChild(document.createElement("br"));
		}
		
		//add table in center element
		table = document.createElement("table");
		table.style.style = "margin: 0 auto";
 		centerElem.appendChild(table);
		tableRow = document.createElement("tr");
		table.appendChild(tableRow);
		
		//create checkbox to include url and append to first row
		elem = document.createElement("input");
		elem.type = "checkbox"; elem.title = "Show URL"; elem.id = "urlCheckbox"; elem.checked = dispOpts.url;
		tableRow.appendChild(elem);
		
		//activate checkbox
		elem.addEventListener('change', function(event) {
				const checked = (this.checked == true);
				setDisplayOption(parseMode, "url",checked);
				
				//gray out other elements if not selected
				if(checked) {
					document.getElementById('urlSelector').disabled = false;
					document.getElementById('urlText').style.color = "black";
					document.getElementById('noUrlForBooksCheckbox').disabled = false;
					document.getElementById('noUrlForBooksText').style.color = "black";
					document.getElementById('doiLinkAsUrlCheckbox').disabled = false;
					document.getElementById('doiLinkAsUrlText').style.color = "black";
				} else {
					document.getElementById('urlSelector').disabled = true;
					document.getElementById('urlText').style.color = "gray";
					document.getElementById('noUrlForBooksCheckbox').disabled = true;
					document.getElementById('noUrlForBooksText').style.color = "gray";
					document.getElementById('doiLinkAsUrlCheckbox').disabled = true;
					document.getElementById('doiLinkAsUrlText').style.color = "gray";
				}
			}
		);
		
		//add checkbox text
		elem = document.createElement("span");
		elem.title = "Show URL"; elem.id = "urlText"; elem.innerText = "Show URL "; elem.style.color = dispOpts.url ? "black" : "gray";
		tableRow.appendChild(elem);
		
		//add url mode selector box
		elem = document.createElement("select");
		elem.title = "URL mode"; elem.id = "urlSelector"; elem.disabled = !dispOpts.url;
		tableRow.appendChild(elem);
		
		//add options to url mode selector box
		{
			const options = ["0","1"], titles = ["if DOI not shown","always"];
			for (let i = 0; i<2; ++i) {
				let option = document.createElement("option");
				option.value = options[i]; option.innerText = titles[i];
				elem.appendChild(option);
			}
		}
		
		//select current option
		elem.value = "" + dispOpts.urlMode;
		
		//add event listener to selector box
		elem.addEventListener('change',function(event) {
				//get new mode
				setDisplayOption(parseMode, "urlMode",parseInt(this.options[this.selectedIndex].value));
			}
		);
		
		//add checkboxes for never including for books, for DOI link as url, and for hiding DOI if preprint
		{
			const options = ["noUrlForBooks","doiLinkAsUrl","hideDoiForPreprint"], titles = ["No URL for books","If available, set DOI link as URL","Hide DOI if eprint number available"];
			for (let i = 0; i<options.length; ++i) {
				
				//create new table row
				tableRow = document.createElement("tr");
				table.appendChild(tableRow);
				
				//create and append checkbox
				let elem = document.createElement("input");
				elem.type = "checkbox"; elem.title = titles[i]; elem.id = options[i] + "Checkbox"; elem.disabled = !dispOpts.url;
				elem.checked = dispOpts[options[i]];
				tableRow.appendChild(elem);
				
				//make it functional
				elem.addEventListener('change', function(event) {
						setDisplayOption(parseMode, options[i],this.checked == true);
					}
				);
				
				//add checkbox text
				elem = document.createElement("span"); elem.title = titles[i]; elem.id = options[i] + "Text"; elem.innerText = titles[i]; elem.style.color = dispOpts.url ? "black" : "gray";
				tableRow.appendChild(elem);
			}
		}
		//line separator
		centerElem.appendChild(document.createElement("br"));
		
		/*UTF-8 MODE*/
		
		//add info text for utf8 mode
		{
			const infoText = document.createElement("p");
			infoText.innerText = "Depending on how you set up bibtex, special characters need to be replaced by a latex command. Here you can configure this replacement.";
			centerElem.appendChild(infoText); centerElem.appendChild(document.createElement("br"));
		}
		
		//add table in center element
		table = document.createElement("table");
		table.style.style = "margin: 0 auto";
 		centerElem.appendChild(table);
		tableRow = document.createElement("tr");
		table.appendChild(tableRow);
		
		//add text
		elem = document.createElement("span");
		elem.title = "Replace "; elem.id = "utfText"; elem.innerText = "Replace ";
		tableRow.appendChild(elem);
		
		//add url mode selector box
		elem = document.createElement("select");
		elem.title = "UTF8 Mode"; elem.id = "utfSelector";
		tableRow.appendChild(elem);
		
		//add options to url mode selector box
		{
			const options = ["0","1","2"], titles = ["all special characters","special non-letter characters","no characters"];
			for (let i = 0; i<3; ++i) {
				let option = document.createElement("option");
				option.value = options[i]; option.innerText = titles[i];
				elem.appendChild(option);
			}
		}
		
		//select current option
		elem.value = "" + dispOpts.utfMode;
		
		//add event listener to selector box
		elem.addEventListener('change',function(event) {
				
				//get new mode
				const mode = parseInt(this.options[this.selectedIndex].value);
				
				setDisplayOption(parseMode, "utfMode",mode);
				if (mode != 0) {
					document.getElementById('dotlessModeCheckbox').disabled = true;
					document.getElementById('dotlessModeCheckboxText').style.color = "grey";
					if (mode == 2) {
						document.getElementById('preferLatexModeCheckbox').disabled = true;
						document.getElementById('preferLatexModeCheckboxText').style.color = "grey";
						document.getElementById('latexModeSelector').disabled = true;
					} else {
						document.getElementById('preferLatexModeCheckbox').disabled = false;
						document.getElementById('preferLatexModeCheckboxText').style.color = "black";
						document.getElementById('latexModeSelector').disabled = !dispOpts.preferLatexMode;
					}
				} else {
					document.getElementById('dotlessModeCheckbox').disabled = false;
					document.getElementById('dotlessModeCheckboxText').style.color = "black";
					document.getElementById('preferLatexModeCheckbox').disabled = false;
					document.getElementById('preferLatexModeCheckboxText').style.color = "black";
					document.getElementById('latexModeSelector').disabled = !dispOpts.preferLatexMode;
				}
			}
		);
		
		//create checkbox for dotless i,j mode
		tableRow = document.createElement("tr");
		table.appendChild(tableRow);
		
		elem = document.createElement("input");
		elem.type = "checkbox"; elem.title = "Replace by"; elem.id = "dotlessModeCheckbox"; elem.checked = dispOpts["dotlessMode"]; elem.disabled = dispOpts.utfMode != 0;
		tableRow.appendChild(elem);
		//make checkbox functional
		elem.addEventListener('change', function(event) {
				setDisplayOption(parseMode, "dotlessMode",this.checked == true);
			}
		);
		
		//add checkbox text
		elem = document.createElement("span");
		elem.title = "Use {i},{j} for dotless i and j"; elem.id = "dotlessModeCheckboxText"; elem.innerText = "Use {i},{j} for dotless i and j"; elem.style.color = dispOpts.utfMode != 0 ? "grey" : "black";
		tableRow.appendChild(elem);
		
		//create checkbox for latex
		tableRow = document.createElement("tr");
		table.appendChild(tableRow);
		
		elem = document.createElement("input");
		elem.type = "checkbox"; elem.title = "Prefer command in specific mode"; elem.id = "preferLatexModeCheckbox"; elem.checked = dispOpts["preferLatexMode"]; elem.disabled = dispOpts.utfMode == 2;
		tableRow.appendChild(elem);
		
		//make checkbox functional
		elem.addEventListener('change', function(event) {
				let doIt = (this.checked == true);
				setDisplayOption(parseMode, "preferLatexMode",doIt);
				document.getElementById("latexModeSelector").disabled = !doIt;
			}
		);
		
		//add checkbox text
		elem = document.createElement("span");
		elem.title = "Prefer latex command in "; elem.id = "preferLatexModeCheckboxText"; elem.innerText = "Prefer latex command in "; elem.style.color = dispOpts.utfMode == 2 ? "grey" : "black";
		tableRow.appendChild(elem);
		
		//add selector box
		elem = document.createElement("select");
		elem.title = "Latex Mode"; elem.id = "latexModeSelector"; elem.disabled = dispOpts.utfMode == 2 || !dispOpts.preferLatexMode;
		tableRow.appendChild(elem);
		
		//add options to url mode selector box
		{
			const options = ["0","1"], titles = ["text mode","math mode"];
			for (let i = 0; i<2; ++i) {
				let option = document.createElement("option");
				option.value = options[i]; option.innerText = titles[i];
				elem.appendChild(option);
			}
		}
		
		//select current option
		elem.value = "" + dispOpts.latexMode;
		
		//add event listener to selector box
		elem.addEventListener('change',function(event) {
				
				//get new mode
				const mode = parseInt(this.options[this.selectedIndex].value);
				setDisplayOption(parseMode, "latexMode",mode);
			}
		);
		
		//line separator
		centerElem.appendChild(document.createElement("br"));
		
		/*INDENTATION*/
		
		//add info text for line breaks
		{
			const infoText = document.createElement("p");
			infoText.innerText = "Here you can set by how many tab and space characters every bibfield shoud be indented.";
			centerElem.appendChild(infoText); centerElem.appendChild(document.createElement("br"));
		}
		
		//add table in center element
		table = document.createElement("table");
 		centerElem.appendChild(table);
		
		//row for number of tabs and spaces
		tableRow = document.createElement("tr");
		table.appendChild(tableRow);
		
		//cell for number of tabs
		tableCell = document.createElement("td");
		tableCell.style = "padding-right: 0.5cm; padding-left: 0.5cm";
		tableRow.appendChild(tableCell);
		
		//text for number of tabs
		elem = document.createElement("span");
		elem.title = ""; elem.id = "numTabText"; elem.innerText = "Tabs: ";
		tableCell.appendChild(elem);
		
		//add space num field
		elem = document.createElement("input");
		elem.type = "number"; elem.min = "0"; elem.title = "Number of tab characters by which bibfields are indented"; elem.id = "numTabsField"; elem.value = dispOpts.numTabs; elem.disabled = false;
		tableCell.appendChild(elem);
		
		//activate number field
		elem.addEventListener('change',function(event) {
				if (this.value < this.min) this.value = this.min;
				setDisplayOption(parseMode, "numTabs", this.value);
			}
		);
		
		//cell for number of spaces
		tableCell = document.createElement("td");
		tableCell.style = "padding-right: 0.5cm; padding-left: 0.5cm";
		tableRow.appendChild(tableCell);
		
		//text for number of spaces
		elem = document.createElement("span");
		elem.title = ""; elem.id = "numSpaceText"; elem.innerText = "Spaces: ";
		tableCell.appendChild(elem);
		
		//add space num field
		elem = document.createElement("input");
		elem.type = "number"; elem.min = "0"; elem.title = "Number of space characters by which bibfields are indented"; elem.id = "numSpacesField"; elem.value = dispOpts.numSpaces; elem.disabled = false;
		tableCell.appendChild(elem);
		
		//activate number field
		elem.addEventListener('change',function(event) {
				if (this.value < this.min) this.value = this.min;
				setDisplayOption(parseMode, "numSpaces", this.value);
			}
		);
		
	
		//line separator
		centerElem.appendChild(document.createElement("br"));
		
		/*LINE BREAKS*/
		
		//add info text for line breaks
		{
			const infoText = document.createElement("p");
			infoText.innerText = "Those working in raw .bib files may want additional line breaks in long strings within the title, author, keywords and abstract field.";
			centerElem.appendChild(infoText); centerElem.appendChild(document.createElement("br"));
		}
		
		//add table in center element
		table = document.createElement("table");
		table.style.style = "margin: 0 auto";
 		centerElem.appendChild(table);
		tableRow = document.createElement("tr");
		table.appendChild(tableRow);
		
		//create checkbox to include url and append to first row
		elem = document.createElement("input");
		elem.type = "checkbox"; elem.title = "Add line breaks"; elem.id = "lineBreakCheckbox"; elem.checked = dispOpts.lineBreaks;
		tableRow.appendChild(elem);
		
		//activate checkbox
		elem.addEventListener('change', function(event) {
				const checked = (this.checked == true);
				setDisplayOption(parseMode, "lineBreaks",checked);
				
				//gray out other elements if not selected
				if(checked) {
					document.getElementById('lineLengthField').disabled = false;
				} else {
					document.getElementById('lineLengthField').disabled = true;
				}
			}
		);
		
		//add checkbox text
		elem = document.createElement("span");
		elem.title = ""; elem.id = "lineBreakText"; elem.innerText = "Line break after ";
		tableRow.appendChild(elem);
		
		//add line break numfield
		elem = document.createElement("input");
		elem.type = "number"; elem.min = "1"; elem.title = "Minimum number of characters after which a line break should be inserted"; elem.id = "lineLengthField"; elem.value = dispOpts.lineLength; elem.disabled = !dispOpts.lineBreaks;
		tableRow.appendChild(elem);
		
		//activate number field
		elem.addEventListener('change',function(event) {
				if (this.value < this.min) this.value = this.min;
				setDisplayOption(parseMode, "lineLength", this.value);
			}
		);
		
		//add numfield text
		elem = document.createElement("span");
		elem.title = ""; elem.id = "lineBreakTextAfter"; elem.innerText = " characters";
		tableRow.appendChild(elem);
		
		return true;
	}

	//parse bibdata to bibtex format
	function parseToBibtex(mode,abbrevs) {
		
		//set fieldNumbers and fieldNames depending on abbreviation mode
		const fieldNumbers = [/*0title*/2,/*1journal*/6,/*2volume*/9,/*3number*/10,/*4pages*/11,/*5year*/13,/*6month*/14,/*7date*/51,/*8urldate*/52,/*9issn*/12,/*10isbn*/44,/*11publisher*/18,/*12address*/75,/*13language*/53,/*14hyphenation (same as language)*/53,/*15eprint*/20,/*16note*/25,/*17school*/27,/*18booktitle*/72];
		const fieldNames = ["title","journal","volume","number","pages","year","month","date","urldate","issn","isbn","publisher","address","language","hyphenation","eprint","note","school","booktitle"];
		
		// get display options
		const options = displayOptions.optionArray[0];
		
		// change fieldNumbers depending on utf8 mode
		if (options.utfMode == 1) {
			fieldNumbers[0] = 62; fieldNumbers[1] = 66; fieldNumbers[11] = 63; fieldNumbers[12] = 76; fieldNumbers[17] = 60; fieldNumbers[18] = 73;
		} else if (options.utfMode == 2) {
			fieldNumbers[0] = 1; fieldNumbers[1] = 5; fieldNumbers[11] = 17; fieldNumbers[12] = 74; fieldNumbers[17] = 26; fieldNumbers[18] = 71;
		}
		
		// get indentation string
		let indentBy = "\n";
		indentBy += "\t".repeat(options.numTabs);
		indentBy += " ".repeat(options.numSpaces);
		   
		//create return string
		let returnString = "";
		
		//disable abbreviations in any case if no abbreviations available
		if (bibFieldData[8] == "") abbrevs = false;
		//change field number if abbrevs available and wanted
		if (abbrevs && !options.biblatexStyle) {
			let numberOne = 8, numberTwo = 48;
			if (options.utfMode == 1) {
				numberOne = 67; numberTwo = 68;
			} else if (options.utfMode == 2) {
				numberOne = 7; numberTwo = 47;
			}
			if (options.abbrevDots) {
				fieldNumbers[1] = numberOne;
			} else {
				fieldNumbers[1] = numberTwo;
			}
		}
		// change month source depending on whether numbered mode
// 		if (options.monthNumber) fieldNumbers[6] = 46;
		//temporary variable
		let fieldValue = "";
		
		//citation type
		returnString += "@" + (bibFieldData[0] == "misc" && options.onlineDefaultType ? "online" : bibFieldData[0]);
		
		//bibkey, prefer custom if available
		fieldValue = bibFieldData[45];
		if (fieldValue.length == 0) fieldValue = bibFieldData[21];
		returnString += "{" + fieldValue;
		
		//check if archive, change title field number depending on that
		fieldNumbers[0] = bibFieldData[19] != "" ? 1 : fieldNumbers[0];
		
		//insert possibly truncated author list with initials if wanted
		let initNumOne = 4, initNumTwo = 58, initNumThree = 69;
		fieldValue = bibFieldData[initNumOne];
		if (options.utfMode == 1) {
			fieldValue = bibFieldData[initNumTwo];
		} else if (options.utfMode == 2) {
			fieldValue = bibFieldData[initNumThree];
		}
		
		let numLines = 0, length = fieldValue.length;
		initNumOne = 29; initNumTwo = 59; initNumThree = 70;
		let initials = bibFieldData[initNumOne];
		const forceInitials = options.forceInitials;
		if (options.utfMode == 1) {
			initials = bibFieldData[initNumTwo];
		} else if (options.utfMode == 2) {
			initials = bibFieldData[initNumThree];
		}
		
		if (length > 0) {
			numLines = length;
			if (options["forceMaxNumAuthors"]) {
				numLines = options["maxNumAuthors"];
				numLines = (length <= numLines) ? length : numLines;
			}
			if (numLines > 0) {
				returnString += "," + indentBy + "author = {";
				let lineBreaks = 1, lineLength = options.lineLength;
				for (let i = 0; i<numLines; ++i) {
					if (options.lineBreaks && returnString.length > lineLength*lineBreaks) {
						returnString += indentBy;
						lineBreaks++;
					}
					let author = fieldValue[i];
					returnString += author[0];
					if (author[1].length > 0) returnString += ", " + author[1];
					if (forceInitials && initials[i].length > 0) {
						let toAdd = initials[i];
						if (!options.relaxInitials) {
							toAdd = toAdd.replace(/\{\\relax\ ([^\s]+)\}\./g,"$1\.");
						}
						returnString += ", " + toAdd;
					} else if (author[2].length > 0) {
						let toAdd = author[2];
						if (!options.relaxInitials) {
							toAdd = toAdd.replace(/\{\\relax\ ([^\s]+)\}\./g,"$1\.");
						}
						returnString += ", " + toAdd;
					}
					returnString += " and ";
				}
				if (numLines < length) {
					returnString += "others}";
				} else {
					returnString = returnString.replace(/[\n]*[\t\x0a]*\ and\ $/,"}");
				}
				numLines = 1;
			}
		}
		
		//from here on, numLines keeps track of total lines of bibtex entry, takes into account special behavior if nothing was added
		
		//insert title and book/collection title
		{
			//check if to be shown
            let titles = [[options.title,0],[options.booktitle,18]];
            
            //decide whether to escape with two brackets
            let openBracket = "{", closeBracket = "}";
            if (options.escapeTitle) {
                openBracket += "{"; closeBracket += "}";
            }
            
            //set field
			for (let i = 0; i<titles.length; ++i) {
				if (titles[i][0] == true) {
					let idx = titles[i][1];
					fieldValue = bibFieldData[fieldNumbers[idx]];
					if (fieldValue != null && fieldValue != "") {
						//add line breaks
						if (options.lineBreaks) {
							fieldValue = fieldValue.replace(new RegExp("(.{" + options.lineLength + ",}?)[\ ]","gi"), function(match, $1, offset, original) {
									return ""+$1+indentBy;
								}
							);
						}
						numLines++;
						returnString += "," + indentBy + fieldNames[idx] + " = " + openBracket + fieldValue + closeBracket;
					}
				}
			}
		}
		
		//insert journal separately if biblatex style, or replace by organization if wanted
		let startingField = 1;
		let setOrg = (options.journalAsOrg && bibFieldData[0] == "misc");
		if (options.biblatexStyle) {
			startingField++;
			if (options[fieldNames[1]]) {
				let fieldNumbersJournal = [fieldNumbers[1]];
				let fieldNamesJournal = [!setOrg ? "journaltitle" : "organization"];
				if (abbrevs) {
					let numberOne = 8, numberTwo = 48;
					if (options.utfMode == 1) {
						numberOne = 67; numberTwo = 68;
					} else if (options.utfMode == 2) {
						numberOne = 7; numberTwo = 47;
					}
					if (!setOrg) {
						fieldNumbersJournal[1] = options.abbrevDots ? numberOne : numberTwo;
						fieldNamesJournal[1] = "shortjournal";
					}
				}
				for (let i = 0; i<fieldNumbersJournal.length; ++i) {
					fieldValue = bibFieldData[fieldNumbersJournal[i]];
					if (fieldValue != null && fieldValue != "") {
						numLines++;
						returnString += "," + indentBy + fieldNamesJournal[i] + " = {" + fieldValue + "}";
					}
				}
			}
		} else if (setOrg) {
			fieldValue = bibFieldData[fieldNumbers[1]];
			if (fieldValue != null && fieldValue != "") {
				numLines++;
				returnString += "," + indentBy + "organization" + " = {" + fieldValue + "}";
			}
			startingField++;
		}

		//now fill in until month
		length = 6;//fieldNames.length-1;
		for (let i = startingField; i<length; ++i) {
			if (options[fieldNames[i]]) {
				fieldValue = bibFieldData[fieldNumbers[i]];
				if (fieldValue != null && fieldValue != "") {
					numLines++;
					returnString += "," + indentBy + fieldNames[i] + " = {" + fieldValue + "}";
				}
			}
		}
		
		//insert month depending on month mode
		if (options[fieldNames[6]]) {
        let mode = options.monthMode;
        if (mode == null || typeof(mode) != 'number') mode = 0;
        const monthFieldNumbers = [14,46,14,35];
        fieldValue = bibFieldData[monthFieldNumbers[mode]];
        if (fieldValue != null && fieldValue != "") {            
            //set brackets and case depending on mode
            let openBrack = "{", closeBrack = "}";
            if (mode == 0) {
                openBrack = ""; closeBrack = "";
                fieldValue = fieldValue.toLowerCase();
            }

            //add month string
            numLines++;
            returnString += "," + indentBy + fieldNames[6] + " = " + openBrack + fieldValue + closeBrack + "";
        }
    }
		
		//now fill in until doi
		length = fieldNames.length-1;
		for (let i = 7; i<length; ++i) {
			if (options[fieldNames[i]]) {
				fieldValue = bibFieldData[fieldNumbers[i]];
				if (fieldValue != null && fieldValue != "") {
					numLines++;
					returnString += "," + indentBy + fieldNames[i] + " = {" + fieldValue + "}";
				}
			}
		}
		
		//doi and/or url.
		fieldValue = bibFieldData[15];
		length = (options.doi && (!options.hideDoiForPreprint || (options.hideDoiForPreprint && bibFieldData[20] == ""))) ? fieldValue : ""; //save doi in length if eprint not available
		if (options.url) {
			fieldValue = (fieldValue == "" || !options.doiLinkAsUrl) ? bibFieldData[16] : "https://doi.org/" + fieldValue;
			if (fieldValue != "" && (options.urlMode == 1 || length == "")) {
				if (bibFieldData[0] != "book" || !options.noUrlForBooks) {
					numLines++;
					returnString += "," + indentBy + "url" + " = {" + fieldValue + "}";
				}
			}
		}
		
		//avoid doi for open access archive/eprint if wanted
		if (length != "") {
			numLines++;
			returnString += "," + indentBy + "doi" + " = {" + length + "}";
		}
		
		//insert keywords if wanted
		let numberOne = 32;
		if (options.utfMode == 1) {
			numberOne = 64;
		} else if (options.utfMode == 2) {
			numberOne = 31;
		}
		if (options.keywords && (fieldValue = bibFieldData[numberOne]) != "") {
			
			//add line breaks
			if (options.lineBreaks) {
				fieldValue = fieldValue.replace(new RegExp("(.{" + options.lineLength + ",}?),[\ ]","gi"), function(match, $1, offset, original) {
						return ""+$1+"," + indentBy;
					}
				);
			}
			numLines++;
			returnString += "," + indentBy + "keywords" + " = {" + fieldValue + "}";
		}
		
		//insert abstract if wanted
		numberOne = 34;
		if (options.utfMode == 1) {
			numberOne = 65;
		} else if (options.utfMode == 2) {
			numberOne = 33;
		}
		if (options.abstract && (fieldValue = bibFieldData[numberOne]) != "") {
			
            //decide whether to escape with two brackets
            let openBracket = "{", closeBracket = "}";
            if (options.escapeAbstract) {
                openBracket += "{"; closeBracket += "}";
            }
            
			//add line breaks
			if (options.lineBreaks) {
				fieldValue = fieldValue.replace(new RegExp("(.{" + options.lineLength + ",}?)[\ ]","gi"), function(match, $1, offset, original) {
						return ""+$1 + indentBy;
					}
				);
			}
			numLines++;
			returnString += "," + indentBy + "abstract" + " = " + openBracket + fieldValue + closeBracket;
		}
		
		//special behavior if nothing was added
		if (numLines == 0) {
			returnString += ",";
		}
		
		//closing bracket
		returnString += "\n}";
		
		//dotless compatibility
		if (options.dotlessMode && options.utfMode == 0) returnString = returnString.replace(/\\([`'^"~=u])\{\\([ij])\}/g,
			function(match, $1, $2, offset, original) {
				return "\\"+$1+"{"+$2+"}";
			}
		);
		
		//remove math-text mode if statements depending on setting
		if (options.utfMode != 2 && options.preferLatexMode) {
			returnString = returnString.replace(/\\ifmmode(.+?)\\else(.+?)\\fi/gi,(options.latexMode == 0 ? "$2" : "$1"));
		}
		
		//return
		return returnString;
	}
	
	// function that returns parse mode info
	function getParserInfo(parseMode) {
		return { name: "Bibtex" , fileExtension: "bib" , encoding: "us-ascii" };
	}
	
	// return
	return {
		parse : parseToBibtex,
		buildAdvancedOptionPage : buildAdvancedOptionPage,
		getParserInfo: getParserInfo
	}; //end return
}());
