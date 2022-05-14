const BINBarnoldS = ( function () {
	
	//function to build advanced option page
	function buildAdvancedOptionPage(parseMode, advancedOptionPage, setDisplayOption) {
		
		// function to refresh advanced option page
		function refreshAdvancedOptionPage(index, parseMode) {
			if (index == 4) {
				let doIt = displayOptions.optionArray[parseMode]["showYear"];
				document.getElementById('showYearInCenturyText').style.color = doIt ? "black" : "grey";
				document.getElementById('showYearInCentury').disabled = !doIt;
			} else if (index == 6) {
				let doIt = displayOptions.optionArray[parseMode]["showFirstNames"];
				document.getElementById('forceInitialsText').style.color = doIt ? "black" : "grey";
				document.getElementById('forceInitials').disabled = !doIt;
				document.getElementById('invertNameOrderText').style.color = doIt ? "black" : "grey";
				document.getElementById('invertNameOrder').disabled = !doIt;
			} else if (index == 10) {
				let doIt = displayOptions.optionArray[parseMode]["etAlMode"];
				document.getElementById('etAlNumAuthors').disabled = !doIt;
				document.getElementById('etAlAuthor').disabled = !doIt;
			} 
			if (parseMode != 3 && index > 10) {
				let dotlessDisabled = (index != 13);
				let dotlessTextColor = dotlessDisabled ? "grey" : "black";
				let latexCheckDisabled = (index == 11);
				let latexCheckTextColor = latexCheckDisabled ? "grey" : "black";
				let latexModeChecked =  displayOptions.optionArray[parseMode]["preferLatexMode"];
				let latexModeSelectorDisabled = latexCheckDisabled ? true : !latexModeChecked;
				document.getElementById('dotlessMode').disabled = dotlessDisabled;
				document.getElementById('dotlessModeText').style.color = dotlessTextColor;
				document.getElementById('preferLatexModeCheckbox').disabled = latexCheckDisabled;
				document.getElementById('preferLatexModeCheckboxText').style.color = latexCheckTextColor;
				document.getElementById('latexModeSelector').disabled = latexModeSelectorDisabled;
				
			}
		}
		
		//set height
		advancedOptionPage.style["height"] = "9.2cm";
		
		//center element
		const centerElem = document.createElement("center");
		centerElem.style.margin = "0 auto"; centerElem.style.width = "100%"; centerElem.style.padding = "0cm";
		advancedOptionPage.appendChild(centerElem);
		
		//add info text
		{
			const infoText = document.createElement("p");
			infoText.style["text-align"] = "center";
			infoText.innerText = (parseMode == 3 ? "Arnold S." : "Barnold S.") + " offers \"sloppy\" citations and allows YOU to set rules.";
			centerElem.appendChild(infoText); centerElem.appendChild(document.createElement("br"));
		}
		
		//add table in center element
		let table = document.createElement("table");
		table.style = "margin: 0 auto;";
 		centerElem.appendChild(table);
		
		//create elements, add event listener and add to advanced option page
		const options = ["showJournalTitle","showTitle","showVolume","showIssue","showYear","showYearInCentury","showFirstNames","invertNameOrder","relaxInitials","forceInitials","etAlMode"];
		const titles = ["Show journal/book/thesis/website title","Show article/chapter Title","Show journal volume","Show journal issue or pages","Show year/date","Force year within century","Show first/middle names","Show first/middle names after surnames","Relax multi-letter author initials","Force initials for first/middle names","Force \"et al.\" after author "];
		
		const length = options.length;
		let tableRow, tableCell;
		for (let i = 0; i<length; ++i) {
			
			tableRow = document.createElement("tr");
			table.appendChild(tableRow);
			
			//create and append checkbox
			tableCell = document.createElement("td");
			tableRow.appendChild(tableCell);
			let elem = document.createElement("input");
			elem.type = "checkbox"; elem.title = titles[i]; elem.id = options[i];
			elem.checked = displayOptions.optionArray[parseMode][options[i]];
			tableCell.appendChild(elem);
			
			//make it functional
			elem.addEventListener('change', function(event) {
					setDisplayOption(parseMode, options[i],this.checked == true);
					refreshAdvancedOptionPage(i, parseMode);
				}
			);
			
			//add checkbox text
			tableCell = document.createElement("td");
			tableRow.appendChild(tableCell);
			elem = document.createElement("span"); elem.title = titles[i]; elem.id = options[i] + "Text"; elem.innerText = titles[i];
			tableCell.appendChild(elem);
		}
		
		//add number box for etAlMode last author to show
		let elem = document.createElement("input");
		elem.type = "number"; elem.min = "1"; elem.title = "Author (in sequence) after which \"et al.\" is forced"; elem.id = "etAlAuthor"; elem.value = displayOptions.optionArray[parseMode].etAlAuthor; elem.disabled = !(displayOptions.optionArray[parseMode].etAlMode);
		tableCell.appendChild(elem);
		
		//activate number field
		elem.addEventListener('change',function(event) {
				if (this.value < this.min || this.value != this.value) this.value = this.min;
				setDisplayOption(parseMode, "etAlAuthor", this.value);
			}
		);
		
		//add text after number field
		elem = document.createElement("span"); elem.title = "etAlAuthorText"; elem.id = "etAlAuthorText"; elem.innerText = " if more than ";
		tableCell.appendChild(elem);
		
		//add number box for etAlMode authors
		elem = document.createElement("input");
		elem.type = "number"; elem.min = "1"; elem.title = "Highest number of authors for which \"et al.\" is not forced"; elem.id = "etAlNumAuthors"; elem.value = displayOptions.optionArray[parseMode].etAlNumAuthors; elem.disabled = !(displayOptions.optionArray[parseMode].etAlMode);
		tableCell.appendChild(elem);
		
		//activate number field
		elem.addEventListener('change',function(event) {
				if (this.value < this.min || this.value != this.value) this.value = this.min;
				document.getElementById("etAlNumAuthorsText").innerText = this.value > 1 ? " authors" : " author";
				setDisplayOption(parseMode, "etAlNumAuthors", this.value);
			}
		);
		
		//add text after number field
		elem = document.createElement("span"); elem.title = "etAlNumAuthorsText"; elem.id = "etAlNumAuthorsText"; elem.innerText = displayOptions.optionArray[parseMode].etAlNumAuthors > 1 ? " authors" : " author";
		tableCell.appendChild(elem);
		
		//add selector for replacement mode
		if (parseMode != 3) {
			tableRow = document.createElement("tr");
			table.appendChild(tableRow);
			tableCell = document.createElement("td");
			tableRow.appendChild(tableCell);
			tableCell.colSpan="2";
			tableCell.style["text-align"] = "center";
			
			//add text
			tableCell.appendChild(document.createElement("br"));
			elem = document.createElement("p");
			elem.innerText = "Depending on how you set up latex, special characters need to be replaced by a latex command. Here you can configure this replacement.";
			tableCell.appendChild(elem);
			tableCell.appendChild(document.createElement("br"));
			elem = document.createElement("span");
			elem.title = "Replace "; elem.id = "utfText"; elem.innerText = "Replace ";
			tableCell.appendChild(elem);
			
			//add url mode selector box
			elem = document.createElement("select");
			elem.title = "UTF8 Mode"; elem.id = "utfSelector";
			tableCell.appendChild(elem);
			
			//add options to mode selector box
			{
				const options = ["0","1","2"], titles = ["all special characters","special non-letter characters","no characters"];
				for (let i = 0; i<3; ++i) {
					let option = document.createElement("option");
					option.value = options[i]; option.innerText = titles[i];
					elem.appendChild(option);
				}
			}
			
			//select current option
			elem.value = "" + displayOptions.optionArray[parseMode].utfMode;
			
			//add event listener to selector box
			elem.addEventListener('change',function(event) {
					
					//get new mode 
					const mode = parseInt(this.options[this.selectedIndex].value);
					setDisplayOption(parseMode, "utfMode",mode);
					refreshAdvancedOptionPage(13  - modes, parseMode);
				}
			);
			
			tableRow = document.createElement("tr");
			table.appendChild(tableRow);
			
			//create and append checkbox
			tableCell = document.createElement("td");
			tableRow.appendChild(tableCell);
			
			elem = document.createElement("input");
			elem.type = "checkbox"; elem.title = "Replace \"{\\i}\",\"{\\j}\" by \"{i}\",\"{j}\""; elem.id = "dotlessMode";
			elem.checked = displayOptions.optionArray[parseMode]["dotlessMode"];
			tableCell.appendChild(elem);
			
			//make it functional
			elem.addEventListener('change', function(event) {
					setDisplayOption(parseMode, "dotlessMode",this.checked == true);
					refreshAdvancedOptionPage(i, parseMode);
				}
			);
			
			//add checkbox text
			tableCell = document.createElement("td");
			tableRow.appendChild(tableCell);
			elem = document.createElement("span"); elem.title = "Replace \"{\\i}\",\"{\\j}\" by \"{i}\",\"{j}\""; elem.id = "dotlessModeText"; elem.innerText = "Replace \"{\\i}\",\"{\\j}\" by \"{i}\",\"{j}\"";
			tableCell.appendChild(elem);
			
			//latex mode
			tableRow = document.createElement("tr");
			table.appendChild(tableRow);
			
			//create and append checkbox
			tableCell = document.createElement("td");
			tableRow.appendChild(tableCell);
			
			elem = document.createElement("input");
			elem.type = "checkbox"; elem.title = "Prefer command in specific mode"; elem.id = "preferLatexModeCheckbox";
			elem.checked = displayOptions.optionArray[parseMode]["preferLatexMode"];
			tableCell.appendChild(elem);
			
			//make checkbox functional
			elem.addEventListener('change', function(event) {
					setDisplayOption(parseMode, "preferLatexMode",(this.checked == true));
					refreshAdvancedOptionPage(13 - displayOptions.optionArray[parseMode]["utfMode"], parseMode);
				}
			);
			
			//create and append checkbox text
			tableCell = document.createElement("td");
			tableRow.appendChild(tableCell);
			
			//add checkbox text
			elem = document.createElement("span");
			elem.title = "Prefer latex command in "; elem.id = "preferLatexModeCheckboxText"; elem.innerText = "Prefer latex command in ";
			tableCell.appendChild(elem);
			
			//add selector box
			elem = document.createElement("select");
			elem.title = "Latex Mode"; elem.id = "latexModeSelector";
			tableCell.appendChild(elem);
			
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
			elem.value = "" + displayOptions.optionArray[parseMode]["latexMode"];
			
			//add event listener to selector box
			elem.addEventListener('change',function(event) {
					
					//get new mode
					const mode = parseInt(this.options[this.selectedIndex].value);
					setDisplayOption(parseMode, "latexMode",mode);
				}
			);
			
		}
		
		//refresh page
		refreshAdvancedOptionPage(4, parseMode); refreshAdvancedOptionPage(6, parseMode); refreshAdvancedOptionPage(9, parseMode);
		if (parseMode != 3) refreshAdvancedOptionPage(13 - displayOptions.optionArray[parseMode]["utfMode"], parseMode);
		
		return true;
	}
	
	//parse to Arnold-S format
	function parseToArnoldS(mode,abbrevs) {
		
		// empty return string
		let returnString = "";
		
		// book keeping (haha)
		let isBook = false;
		
		// get display options and citation type
		const options = displayOptions.optionArray[mode];
		const arnoldShould = displayOptions.optionArray[mode];
		const citType = bibFieldData[0];
		
		// mode and abbreviation dependent field values
		const fieldNumbers = [/*journal title_abbrev*/7,/*journal title*/5,/*title_book*/1,/*author_list*/3,/*initials*/28,/*article title*/1,/*journal title_abbrev_nodot*/47];
		if (mode == 4) {
			fieldNumbers[0] = 8; fieldNumbers[1] = 6; fieldNumbers[2] = 2; fieldNumbers[3] = 4;  fieldNumbers[4] = 29; fieldNumbers[5] = 2; fieldNumbers[6] = 48;
			if (arnoldShould.utfMode == 1) {
				fieldNumbers[0] = 67; fieldNumbers[1] = 66; fieldNumbers[2] = 62; fieldNumbers[3] = 58;  fieldNumbers[4] = 59; fieldNumbers[5] = 62; fieldNumbers[6] = 68;
			} else if (arnoldShould.utfMode == 2) {
				fieldNumbers[0] = 7; fieldNumbers[1] = 5; fieldNumbers[2] = 1; fieldNumbers[3] = 69;  fieldNumbers[4] = 70; fieldNumbers[5] = 1; fieldNumbers[6] = 47;
			}
		}
		
		// check if (abbreviated) journal name or book title available
		let mainTitle;
		if (citType == "book") {
			mainTitle = bibFieldData[fieldNumbers[2]];
			isBook = true;
		} else if(citType == "phdthesis") {
			mainTitle = bibFieldData[fieldNumbers[2]];
		} else {
			if (abbrevs) {
				//take care of dots in abbreviations
				mainTitle = options.abbrevDots ? bibFieldData[fieldNumbers[0]] : bibFieldData[fieldNumbers[6]];
				if (mainTitle == "") mainTitle = bibFieldData[fieldNumbers[1]];			
			} else {
				mainTitle = bibFieldData[fieldNumbers[1]];
			}		
		}
		
		//if journal or book title not available, only spit out webpage title and date
		if (mainTitle != "") {
			
			//insert possibly truncated author list
			let separator = " ";
			let fieldValue = bibFieldData[fieldNumbers[3]];
			let length = fieldValue.length;
			if (length > 0) {
				let numLines = length;
				if (options["forceMaxNumAuthors"]) {
					numLines = options["maxNumAuthors"];
					numLines = (length <= numLines) ? length : numLines;
				}
				
				//implement et al mode here
				if (options["etAlMode"]) {
					let etAlAuthor = options["etAlAuthor"];
					if (etAlAuthor > numLines) etAlAuthor = numLines;
					numLines = (length > options["etAlNumAuthors"]) ? etAlAuthor : numLines;
				}
				
				if (numLines > 0) {
					//temporarily save initials
					const initials = bibFieldData[fieldNumbers[4]];
					
					//get options for showing author names
					const firstNames = arnoldShould.showFirstNames, forceInitials = arnoldShould.forceInitials, invertNameOrder = arnoldShould.invertNameOrder;
					
					//take into account whether or not order first/surname should be reversed
					const nameComponents = ["",""], nameIdx = [0,1];
					let authorSep = ", ";
					if (invertNameOrder) {
						nameIdx[0] = 1; nameIdx[1] = 0;
						if (firstNames) authorSep = " and ";
					}
					
					//loop over authors
					for (let i = 0; i<numLines; ++i) {
						
						//get name components
						let name = fieldValue[i];
						
						//set first name
						let partSep = invertNameOrder ? ", " : " ";
						if (firstNames && name[2].length > 0) {
							nameComponents[nameIdx[0]] = (forceInitials && initials[i].length > 0) ? initials[i] : name[2];
						} else {
							nameComponents[nameIdx[0]] = "";
							partSep = "";
						}
						
						//set surname + jr,sr if available
						nameComponents[nameIdx[1]] = name[0]
						if (name[1].length > 0) nameComponents[nameIdx[1]] += " " + name[1];
						
						//add author to return string, remove relax command if necessary
						name = nameComponents[0] + partSep + nameComponents[1];
						if (mode == 4) {
							name = name.replace(/(^[\s]*\{[\s]*|[\s]*\}[\s]*$)/g,"");
							if (!arnoldShould.relaxInitials) name = name.replace(/\{\\relax\ ([^\s]+)\}\./g,"$1\.");
						}
						returnString += name + authorSep;

					}
					
					//add "et al." to end if necessary, and finish with colon
					returnString = returnString.replace(/[\ ]*(?:,|and)\ $/,(numLines < length ? " et al." : ""));
					separator = ": ";
				}
			}
			
			//add article/chapter title
			if (arnoldShould.showTitle && citType != "phdthesis") {
				let title = bibFieldData[fieldNumbers[5]];
				if (title != "") {
					returnString += separator + title;
					if (title.search(/[\.!\?]$/) == -1) returnString += ".";
					separator = " ";
				}
			}
			
			//now add journal title or book title
			if (arnoldShould.showJournalTitle) {
				returnString += separator + mainTitle;
				separator = " ";
			}
			
			// for journal add volume and firstpage/issue if available
			if (!isBook) {
				if ((fieldValue = bibFieldData[9]) != "" && arnoldShould.showVolume) {
					
					//mode dependent emphasis of volume
					mainTitle = length = "";
					if (mode == 4) {
						mainTitle = '\\textbf{'; length = '}';
					}
					returnString += separator + mainTitle + fieldValue + length;
					if (arnoldShould.showIssue) {
						if ((fieldValue = bibFieldData[11]) != "" && (fieldValue.search(/[a-z]/i) == -1 || bibFieldData[10] == "")) {
							returnString += ", " + fieldValue.replace(/--.*$/,"");
						} else if ((fieldValue = bibFieldData[10]) != "") {
							returnString += ", " + fieldValue;
						}
					}
				} else if ((fieldValue = bibFieldData[20]) != "" && arnoldShould.showVolume) {
					returnString += separator + fieldValue;
				} else if (arnoldShould.showIssue) {
					if ((fieldValue = bibFieldData[11]) != "" && (fieldValue.search(/[a-z]/i) == -1 || bibFieldData[10] == "")) {
						returnString += separator + fieldValue.replace(/--.*$/,"");
					} else if ((fieldValue = bibFieldData[10]) != "") {
						returnString += separator + fieldValue;
					}
				}
			}
			
			//if arxiv in short form, adjust
			returnString = returnString.replace(/arXiv\ /,"arXiv:").trim();
			
			//add year
			if ((fieldValue = bibFieldData[13]) != "" && arnoldShould.showYear) {
				if (arnoldShould.showYearInCentury) fieldValue = fieldValue.slice(-2);
				returnString += (returnString != "") ? " (" + fieldValue + ")" : fieldValue;
			}
			
		} else {
			if (arnoldShould.showJournalTitle) returnString += bibFieldData[fieldNumbers[2]];
			if (arnoldShould.showYear) {
				let date = bibFieldData[22].replace(/\//g,"-").replace(/[\-]*$/,"");
				if (arnoldShould.showYearInCentury) date = date.slice(2);
				returnString += (returnString != "") ? " (" + date + ")" : date;
			}
		}
		
		//dotless mode
		if (mode != 3 && arnoldShould.dotlessMode && arnoldShould.utfMode == 0) returnString = returnString.replace(/\\([`'^"~=u])\{\\([ij])\}/g,
			function(match, $1, $2, offset, original) {
				return "\\"+$1+"{"+$2+"}";
			}
		);
		
		//remove math-text mode if statements depending on setting
		if (arnoldShould.utfMode != 2 && arnoldShould.preferLatexMode) {
			returnString = returnString.replace(/\\ifmmode(.+?)\\else(.+?)\\fi/gi,(arnoldShould.latexMode == 0 ? "$2" : "$1"));
		}
		
		if (returnString == "") returnString = "Come on, Cohagen! You got what you want! Give seeze people aiaa!"
		
		//return
		return returnString.trim();
	}
	
	// function that returns parse mode info
	function getParserInfo(parseMode) {
		const retObj = { fileExtension: "txt" };
		if (parseMode == 3) {
			retObj.name = "Arnold S.";
			retObj.encoding = "utf-8";
		} else {
			retObj.name = "Barnold S.";
			retObj.encoding = "us-ascii";
		}
		return retObj;
	}
	
	// return
	return {
		parse : parseToArnoldS,
		buildAdvancedOptionPage : buildAdvancedOptionPage,
		getParserInfo: getParserInfo
	}; //end return
}());