var BINPreformatter = ( function () {

	// a shadow as a "promise not to touch global data and variables". Must be included to be accepted!
	var BINData = null;
	var BINInteraction = null;
	var BINParser =  null;
	var window = null;
	var document = null;

	//preformat raw data including raw RIS
	function preformatRawData(metaData, parser) {
		//fix author and journal
		metaData["citation_download"] = metaData["citation_download"].replace(/A1[\t\ ]+[\-]+[\t\ ]+/,"AU - ").replace(/JO[\t\ ]+[\-]+[\t\ ]+/,"JF - ").trim();
	}


	//preformatting function
	function preformatData(metaData, parser) {

		//fix journal and abbreviation
    metaData["citation_journal_title"] = "Proceedings of the National Academy of Sciences of the United States of America";
		metaData["citation_journal_abbrev"] = "Proc. Natl. Acad. Sci. U.S.A.";

    //fix publisher
    metaData["citation_publisher"] = "Proceedings of the National Academy of Sciences";

    //fix issn
		metaData["citation_issn"] = metaData["citation_issn"].replace(/^.*\"issn\"/gi,"").replace(/[^0-9\-X]*/gi,"");

		//fix abstract, prefer static
		temp = metaData["citation_abstract"].replace(/^[\s]*abstract[\:\s]*/i,"");
		metaData["citation_abstract"] = temp;
		if (temp != "" && (metaData = metaData["citation_download"]) != null && typeof(metaData) == 'object') {
			metaData["citation_abstract"] = "";
		}

	}

	// expose preformatting function and raw preformatting function
	return { preformatData : preformatData , preformatRawData: preformatRawData };

}());
