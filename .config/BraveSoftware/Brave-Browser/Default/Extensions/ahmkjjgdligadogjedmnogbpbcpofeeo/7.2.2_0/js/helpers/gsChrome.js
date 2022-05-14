"use strict";var gsChrome={cookiesGetAll:function(){return new Promise((r=>{chrome.cookies.getAll({},(e=>{chrome.runtime.lastError&&(gsUtils.warning("chromeCookies",chrome.runtime.lastError),e=[]),r(e)}))}))},cookiesRemove:function(r,e){return new Promise((o=>{if(!r||!e)return gsUtils.warning("chromeCookies","url or name not specified"),void o(null);chrome.cookies.remove({url:r,name:e},(r=>{chrome.runtime.lastError&&(gsUtils.warning("chromeCookies",chrome.runtime.lastError),r=null),o(r)}))}))},tabsCreate:function(r){return new Promise((e=>{if(!r||"string"!=typeof r&&"string"!=typeof r.url)return gsUtils.warning("chromeTabs","url not specified"),void e(null);r="string"==typeof r?{url:r}:r,chrome.tabs.create(r,(r=>{chrome.runtime.lastError&&(gsUtils.warning("chromeTabs",chrome.runtime.lastError),r=null),e(r)}))}))},tabsReload:function(r){return new Promise((e=>{if(!r)return gsUtils.warning("chromeTabs","tabId not specified"),void e(!1);chrome.tabs.reload(r,(()=>{if(chrome.runtime.lastError)return gsUtils.warning("chromeTabs",chrome.runtime.lastError),void e(!1);e(!0)}))}))},tabsUpdate:function(r,e){return new Promise((o=>{if(!r||!e)return gsUtils.warning("chromeTabs","tabId or updateProperties not specified"),void o(null);chrome.tabs.update(r,e,(r=>{chrome.runtime.lastError&&(gsUtils.warning("chromeTabs",chrome.runtime.lastError),r=null),o(r)}))}))},tabsGet:function(r){return new Promise((e=>{if(!r)return gsUtils.warning("chromeTabs","tabId not specified"),void e(null);chrome.tabs.get(r,(r=>{chrome.runtime.lastError&&(gsUtils.warning("chromeTabs",chrome.runtime.lastError),r=null),e(r)}))}))},tabsQuery:function(r){return r=r||{},new Promise((e=>{chrome.tabs.query(r,(r=>{chrome.runtime.lastError&&(gsUtils.warning("chromeTabs",chrome.runtime.lastError),r=[]),e(r)}))}))},tabsRemove:function(r){return new Promise((e=>{if(!r)return gsUtils.warning("chromeTabs","tabId not specified"),void e(null);chrome.tabs.remove(r,(()=>{chrome.runtime.lastError&&gsUtils.warning("chromeTabs",chrome.runtime.lastError),e()}))}))},windowsGetLastFocused:function(){return new Promise((r=>{chrome.windows.getLastFocused({},(e=>{chrome.runtime.lastError&&(gsUtils.warning("chromeWindows",chrome.runtime.lastError),e=null),r(e)}))}))},windowsGet:function(r){return new Promise((e=>{if(!r)return gsUtils.warning("chromeWindows","windowId not specified"),void e(null);chrome.windows.get(r,{populate:!0},(r=>{chrome.runtime.lastError&&(gsUtils.warning("chromeWindows",chrome.runtime.lastError),r=null),e(r)}))}))},windowsGetAll:function(){return new Promise((r=>{chrome.windows.getAll({populate:!0},(e=>{chrome.runtime.lastError&&(gsUtils.warning("chromeWindows",chrome.runtime.lastError),e=[]),r(e)}))}))},windowsCreate:function(r){return r=r||{},new Promise((e=>{chrome.windows.create(r,(r=>{chrome.runtime.lastError&&(gsUtils.warning("chromeWindows",chrome.runtime.lastError),r=null),e(r)}))}))},windowsUpdate:function(r,e){return new Promise((o=>{if(!r||!e)return gsUtils.warning("chromeTabs","windowId or updateInfo not specified"),void o(null);chrome.windows.update(r,e,(r=>{chrome.runtime.lastError&&(gsUtils.warning("chromeWindows",chrome.runtime.lastError),r=null),o(r)}))}))}};