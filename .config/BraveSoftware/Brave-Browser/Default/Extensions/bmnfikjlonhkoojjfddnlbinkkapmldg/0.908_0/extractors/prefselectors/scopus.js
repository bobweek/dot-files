var BINPrefselector = ( function () {

	// a shadow as a "promise not to touch global data and variables". Must be included to be accepted!
	var BINData = null;
	var BINInteraction = null;
	var BINParser =  null;
	var window = null;
	var document = null;

	function formatCitationLink(metaData, link) {
		if (link == null || link == "") return "";
		return (metaData["citation_url_nopath"] + '/onclick/export.uri?oneClickExport=%7b%22Format%22%3a%22RIS%22%2c%22SelectedFields%22%3a%22+Authors++Title++Year++EID++SourceTitle++Volume+Issue+ArtNo+PageStart+PageEnd+PageCount++DocumentType+Source++DOI++ISSN++ISBN++Publisher++Abstract++AuthorKeywords++IndexKeywords++LanguageOfOriginalDocument++AbbreviatedSourceTitle+%22%2c%22View%22%3a%22SpecifyFields%22%7d&origin=recordpage&eid=' + link);
	}

	// these are the preferred selectors used, and may be modified. The format is "bibfield: [ [css-selector,attribute], ...],", where "attribute" can be any html tag attribute or "innerText" to get the text between <tag> and </tag>
	var prefselectorMsg = {
		citation_misc: [ ['div[data-testid="publication-information-bar"] els-typography','innerText'] , ['span#journalInfo','innerText'] ],
		citation_doi: [ ['span[id="recordDOI"]','innerText'] ],
		citation_author: [ ['div[data-testid="author-list"] ul li els-button','innerText'] ],
		citation_journal_title: [ ['div#publicationTitle','innerText'] , ['span#publicationTitle a','innerText'] , ['span#noSourceTitleLink','innerText'] ],
		citation_collection_title: [ ['span#publicationTitle a','innerText'] ],
		citation_type: [ ['els-stack[data-testid="source-info-entry-document-type"] dd', 'innerText', true] ],
		citation_title: [ ['h1.svTitle','innerText'] , ['h2.h3','innerText'] ],
    citation_issn: [ ['els-stack[data-testid="source-info-entry-issn"]', 'innerText', true] ],
    citation_isbn: [ ['els-stack[data-testid="source-info-entry-isbn"] dd', 'innerText', true] ],
    citation_publisher: [ ['els-stack[data-testid="source-info-entry-publisher"]', 'innerText', true] ],
		citation_abstract: [ ['els-typography#abstract + div','innerText',true,20000] ],
		citation_keywords: [ ['els-typography#author-keywords + div, section#authorKeywords li, section#indexedKeywords span.badges','innerText',true] ],
		citation_download: [ ['input#currentRecordPageEID','value'] ],
    citation_language: [ ['els-stack[data-testid="source-info-entry-original-language"]', 'innerText', true] ]
	};

	// finally expose selector message and link formatter
	return { prefselectorMsg: prefselectorMsg , formatCitationLink: formatCitationLink };

}());
