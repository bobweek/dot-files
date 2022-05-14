var gsMessages={INFO:"info",WARNING:"warning",ERROR:"error",sendInitTabToContentScript(e,s,t,n,o){var r={ignoreForms:s,tempWhitelist:t};n&&(r.scrollPos=n),gsMessages.sendMessageToContentScript(e,r,gsMessages.ERROR,o)},sendUpdateToContentScriptOfTab:function(e){if(gsUtils.isSpecialTab(e)||gsUtils.isSuspendedTab(e,!0)||gsUtils.isDiscardedTab(e))return;const s=gsStorage.getOption(gsStorage.IGNORE_FORMS);gsMessages.sendMessageToContentScript(e.id,{ignoreForms:s},gsMessages.WARNING)},sendTemporaryWhitelistToContentScript:function(e,s){gsMessages.sendMessageToContentScript(e,{tempWhitelist:!0},gsMessages.WARNING,s)},sendUndoTemporaryWhitelistToContentScript:function(e,s){gsMessages.sendMessageToContentScript(e,{tempWhitelist:!1},gsMessages.WARNING,s)},sendRequestInfoToContentScript(e,s){gsMessages.sendMessageToContentScript(e,{action:"requestInfo"},gsMessages.WARNING,s)},sendMessageToContentScript:function(e,s,t,n){gsMessages.sendMessageToTab(e,s,t,(function(e,s){e?n&&n(e):n&&n(null,s)}))},sendPingToTab:function(e,s){gsMessages.sendMessageToTab(e,{action:"ping"},gsMessages.INFO,s)},sendMessageToTab:function(e,s,t,n){if(e){var o=function(s){gsUtils.log(e,"response from tab",s),chrome.runtime.lastError?n&&n(chrome.runtime.lastError):n&&n(null,s)};s.tabId=e;try{gsUtils.log(e,"send message to tab",s),chrome.tabs.sendMessage(e,s,{frameId:0},o)}catch(t){chrome.tabs.sendMessage(e,s,o)}}else n&&n("tabId not specified")},executeScriptOnTab:function(e,s,t){e?chrome.tabs.executeScript(e,{file:s},(function(e){chrome.runtime.lastError?t&&t(chrome.runtime.lastError):t&&t(null,e)})):t&&t("tabId not specified")},executeCodeOnTab:function(e,s,t){e?chrome.tabs.executeScript(e,{code:s},(function(e){chrome.runtime.lastError?t&&t(chrome.runtime.lastError):t&&t(null,e)})):t&&t("tabId not specified")}};