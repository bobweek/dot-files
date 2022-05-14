var gsSuspendedTab=function(){"use strict";function e(e,t,n){const s=t&&parseInt(t)||0;if("2"===n&&s>15){const t=s+151;e.body.scrollTop=t,e.documentElement.scrollTop=t}else e.body.scrollTop=0,e.documentElement.scrollTop=0}function t(e,t,n){"dark"===t?e.querySelector("body").classList.add("dark"):e.querySelector("body").classList.remove("dark"),"dark"===t&&n?e.getElementById("faviconWrap").classList.add("faviconWrapLowContrast"):e.getElementById("faviconWrap").classList.remove("faviconWrapLowContrast")}async function n(e){const t=gsUtils.getOriginalUrl(e),n=await gsIndexedDb.fetchPreviewImage(t);let s=null;return n&&n.img&&null!==n.img&&"data:,"!==n.img&&n.img.length>1e4&&(s=n.img),s}async function s(e,t,n){if(!(null!==e.getElementById("gsPreviewContainer"))&&n&&t&&"0"!==t?await function(e,t){return new Promise((n=>{const s=e.createElement("div"),o=e.getElementsByTagName("body")[0];s.setAttribute("id","gsPreviewContainer"),s.classList.add("gsPreviewContainer"),s.innerHTML=e.getElementById("previewTemplate").innerHTML;const r=i(e);s.onclick=r,gsUtils.localiseHtml(s),o.appendChild(s);const a=e.getElementById("gsPreviewImg"),d=function(){a.removeEventListener("load",d),a.removeEventListener("error",d),n()};a.setAttribute("src",t),a.addEventListener("load",d),a.addEventListener("error",d)}))}(e,n):function(e){e.querySelector(".watermark").onclick=()=>{chrome.tabs.create({url:chrome.extension.getURL("html/about.html")})}}(e),!e.getElementById("gsPreviewContainer"))return;const s="2"===t?"auto":"hidden";e.body.style.overflow=s,"0"!==t&&n?(e.getElementById("gsPreviewContainer").style.display="block",e.getElementById("suspendedMsg").style.display="none",e.body.classList.add("img-preview-mode")):(e.getElementById("gsPreviewContainer").style.display="none",e.getElementById("suspendedMsg").style.display="flex",e.body.classList.remove("img-preview-mode"))}function o(e,t){const n=e.getElementById("hotkeyWrapper");if(t)n.innerHTML='<span class="hotkeyCommand">('+t+")</span>";else{const e=chrome.i18n.getMessage("js_suspended_hotkey_to_reload");n.innerHTML=`<a id="setKeyboardShortcut" href="#">${e}</a>`}}function i(e){const t=gsUtils.getOriginalUrl(e.location.href);return function(n){n.preventDefault(),n.stopPropagation(),"setKeyboardShortcut"===n.target.id?chrome.tabs.create({url:"chrome://extensions/shortcuts"}):1===n.which&&r(e,t)}}function r(e,t){e.body.classList.contains("img-preview-mode")?e.getElementById("refreshSpinner").classList.add("spinner"):(e.body.classList.add("waking"),e.getElementById("snoozyImg").src=chrome.extension.getURL("images/snz_tab_awake.svg"),e.getElementById("snoozySpinner").classList.add("spinner")),e.location.replace(t)}return{initTab:async function(r,a,{showNag:d,quickInit:l}){a||gsUtils.warning(r.id,"Could not get internalTabView for suspended tab");const c=r.url;a.document.sessionId=gsSession.getSessionId();let g=gsUtils.getSuspendedTitle(c);g.indexOf("<")>=0&&(g=gsUtils.htmlEncode(g)),function(e,t){e.title=t,e.getElementById("gsTitle").innerHTML=t,e.getElementById("gsTopBarTitle").innerHTML=t,e.getElementById("gsTopBarTitle").onmousedown=function(e){e.stopPropagation()}}(a.document,g);const u=await gsFavicon.getFaviconMetaData(r);if(function(e,t){e.getElementById("gsTopBarImg").setAttribute("src",t.normalisedDataUrl),e.getElementById("gsFavicon").setAttribute("href",t.transparentDataUrl)}(a.document,u),l)return;gsUtils.localiseHtml(a.document);const m=gsStorage.getSettings(),p=gsUtils.getOriginalUrl(c);!function(e,t){e.addEventListener("beforeunload",(function(e){gsUtils.log(t.id,"BeforeUnload triggered: "+t.url),tgs.setTabStatePropForTabId(t.id,tgs.STATE_UNLOADED_URL,t.url);const n=gsUtils.getSuspendedScrollPosition(t.url);tgs.setTabStatePropForTabId(t.id,tgs.STATE_SCROLL_POS,n)}))}(a.window,r);const y=m[gsStorage.SCREEN_CAPTURE],E=await n(c);await s(a.document,y,E);const f=m[gsStorage.THEME],T=u.isDark;t(a.document,f,T),m[gsStorage.NO_NAG]||null!=d||(d=Math.random()>.95),tgs.setTabStatePropForTabId(r.id,tgs.STATE_SHOW_NAG,d),d&&function(e,t,n,s){const o=function(e){if(e&&e.target&&"hidden"===e.target.visibilityState)return;const n=gsStorage.getSettings(),o=tgs.getTabStatePropForTabId(s,tgs.STATE_SHOW_NAG)&&!n[gsStorage.NO_NAG],i=t.getElementById("dudePopup"),r=null!==i&&i.classList.contains("poppedup");o&&!r||!o&&r&&function(e){e.getElementById("dudePopup").classList.remove("poppedup"),e.getElementById("donateBubble").classList.remove("fadeIn")}(t)};e.addEventListener("visibilitychange",o),n&&o()}(a.window,a.document,r.active,r.id);const b=await tgs.getSuspensionToggleHotkey();o(a.document,b),function(e,t){e.getElementById("gsTopBarUrl").innerHTML=function(e){e.indexOf("//")>0&&(e=e.substring(e.indexOf("//")+2));let t=e.match(/\/?[?#]+/);t&&(e=e.substring(0,t.index));t=e.match(/\/$/),t&&(e=e.substring(0,t.index));return e}(t),e.getElementById("gsTopBarUrl").setAttribute("href",t),e.getElementById("gsTopBarUrl").onmousedown=function(e){e.stopPropagation()};const n=i(e);e.getElementById("gsTopBarUrl").onclick=n,e.getElementById("gsTopBar").onmousedown=n,e.getElementById("suspendedMsg").onclick=n}(a.document,p);let I=null;3===tgs.getTabStatePropForTabId(r.id,tgs.STATE_SUSPEND_REASON)&&(I=chrome.i18n.getMessage("js_suspended_low_memory")),function(e,t){let n=e.getElementById("reasonMsg");if(!n){n=e.createElement("div"),n.setAttribute("id","reasonMsg"),n.classList.add("reasonMsg");const t=e.getElementById("suspendedMsg-instr");t.insertBefore(n,t.firstChild)}n.innerHTML=t}(a.document,I),a.document.querySelector("body").classList.remove("hide-initially");const B=gsUtils.getSuspendedScrollPosition(c);e(a.document,B,y)},requestUnsuspendTab:function(e,t){const n=gsUtils.getOriginalUrl(t.url);r(e.document,n)},showNoConnectivityMessage:function(e){e.document.getElementById("disconnectedNotice")||function(e){const t=e.createElement("div");t.setAttribute("id","disconnectedNotice"),t.classList.add("toast-wrapper"),t.innerHTML=e.getElementById("toastTemplate").innerHTML,gsUtils.localiseHtml(t),e.getElementsByTagName("body")[0].appendChild(t)}(e.document),e.document.getElementById("disconnectedNotice").style.display="none",setTimeout((function(){e.document.getElementById("disconnectedNotice").style.display="block"}),50)},updateCommand:function(e,t){o(e.document,t)},updateTheme:function(e,n,s,o){t(e.document,s,o)},updatePreviewMode:async function(t,o,i){const r=await n(o.url);await s(t.document,i,r);const a=gsUtils.getSuspendedScrollPosition(o.url);e(t.document,a,i)}}}();