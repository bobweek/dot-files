var BINPrefselector = ( function () {

	// a shadow as a "promise not to touch global data and variables". Must be included to be accepted!
	var BINData = null;
	var BINInteraction = null;
	var BINParser =  null;
	var window = null;
	var document = null;

	// this function is called by the background script in order to return a properly formatted citation download link
	function formatCitationLink(metaData, link) {
		//early out if no link or doi
		if (link == null || link == "") return "";
    let doi = metaData["citation_doi"];
    if (doi == null || doi == "") return "";

    //set link, POST method, content type and cookie policy
    link = metaData["citation_url_nopath"] + link;
    metaData["citation_download_method"] = "POST";
    metaData["citation_download_content_type"] = "application/x-www-form-urlencoded";
//     metaData["citation_download_cookie"] = "cookiePolicy=iaccept";

    //generate request
    doi = "doi=" + doi.replace(/\//g,"%2F") + "&downloadFileName=bla&include=abs&format=ris&direct=&submit=EXPORT+CITATION";
    metaData["citation_download_requestbody"] = doi;

		return link;
	}

	function getFallbackURL(url) {
    return (url.search(/.*\.pdf[\s]*$/i) != -1) ?  url.replace(/\/content\/pnas\//i,"/content/").replace(/[\s]*\.[\s]*full[\s]*\.[\s]*pdf[\s]*$/i,"") : null;
  }

	// these are the preferred selectors used, and may be modified. The format is "bibfield: [ [css-selector,attribute], ...],", where "attribute" can be any html tag attribute or "innerText" to get the text between <tag> and </tag>
	var prefselectorMsg = {
		citation_publisher: [ ['meta[name="DC.Publisher"]','content'] ],
		citation_download: [ ['form.citation-form','action'] ],
		citation_abstract: [ ['section#abstract','innerText',true,20000] ],
		citation_keywords: [ ['ul.kwd-group li.kwd','innerText'] ],
    citation_authors: [ ['span[property="author" i] a[href^="#con"]','innerText'] ],
    citation_date: [ ['span[property="datePublished" i]','innerText'] ],
    citation_doi: [ ['form.citation-form input[name="doi" i]','value'] ],
    citation_volume: [ ['div.self-citation span[property="volumeNumber" i]','innerText'] ],
    citation_issue: [ ['div.self-citation span[property="issueNumber" i]','innerText'] ],
    citation_firstpage: [ ['div.self-citation span[property="identifier" i]','innerText'] ],
    citation_issn: [ ['script#contribution-meta','textContent',true] ]
	};

	// finally expose selector message and link formatter
	return { prefselectorMsg: prefselectorMsg , formatCitationLink: formatCitationLink , getFallbackURL: getFallbackURL };

}());
