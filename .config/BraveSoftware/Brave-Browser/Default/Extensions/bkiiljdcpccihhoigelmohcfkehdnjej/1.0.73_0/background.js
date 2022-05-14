// Standard Google Universal Analytics code
/* "options_page": "options.html", */

(function (i, s, o, g, r, a, m) {
  i['GoogleAnalyticsObject'] = r;
  i[r] = i[r] || function () {

    (i[r].q = i[r].q || []).push(arguments)
  }, i[r].l = 1 * new Date();
  a = s.createElement(o),

    m = s.getElementsByTagName(o)[0];
  a.async = 1;
  a.src = g;
  m.parentNode.insertBefore(a, m)

})(window, document, 'script', 'https://www.google-analytics.com/analytics.js', 'ga'); // Note: https protocol here

ga('create', 'UA-125188853-1', 'auto');

ga('set', 'checkProtocolTask',
 function () {}); // Removes failing protocol check. @see: http://stackoverflow.com/a/22152353/1958200

ga('require', 'displayfeatures');

ga('send', 'pageview', 'options.html');

function modifyDOM() {
  var path = chrome.extension.getURL('nightmode.css');
  head = document.head || document.getElementsByTagName('head')[0];
  link = document.createElement('link');
  link.type = 'text/css';
  link.id = "mystyle";
  link.rel = "stylesheet";
  link.href = path;
  setTimeout(() => {
    head.appendChild(link);
  }, 150)
  return "document.body.innerHTML";

}




var mystyle = ''

function appendStyle() {
  head = document.head || document.getElementsByTagName('head')[0];
  if (mystyle != null) {
    head.appendChild(mystyle)
  }
}

function removeStyle() {

  head = document.head || document.getElementsByTagName('head')[0];
  mystyle = document.getElementById("mystyle");
  if (mystyle != null) {
    head.removeChild(mystyle)
  }
}

var excludedlinks = ["https://www.instagram.com/developer/", "https://www.instagram.com/about/jobs/", "https://www.instagram.com/about/us/"]
var updatelinks = ["https://www.instagram.com/accounts/edit/"]

// chrome.webNavigation.onHistoryStateUpdated.addListener(function(e) {
//         if (excludedlinks.includes(e.url)) {
//           chrome.tabs.executeScript({
//               code: '(' + removeStyle + ')();'
//           }, (results) => {});
//         }
//         if(updatelinks.includes(e.url)) {
//           chrome.tabs.executeScript({
//               code: '(' + removeStyle + ')(); (' + appendStyle + ')();'
//           }, (results) => {});
//         }

// });


function getStatus(){
  let isActive = false;
  return new Promise((resolve, reject)=>{
    chrome.storage.sync.get(['isActive'], function(result) {
      console.log('get isActive = ' + result.isActive);
      isActive = result.isActive ?? false;
      resolve(isActive)
    });
  });
}

function setStatus(isActive){
  return new Promise((resolve, reject)=>{
    chrome.storage.sync.set({'isActive': isActive}, function() {
      console.log('isActive set to  ' + isActive);
      resolve();
    });
  });
}
function updateIcon() {
   return new Promise((resolve,reject)=>{
    let isActive = false;
    getStatus().then(result => {
      isActive = result;
      if (isActive) {
        isActive = false;
        setStatus(isActive).then(()=>{});
        chrome.browserAction.setIcon({
          path: '/imgs/icon128.png'
        });
        chrome.browserAction.setTitle({
          title: 'NightMode is OFF'
        });
    
      } else {
        isActive = true;
        setStatus(isActive).then(()=>{});
  
        chrome.browserAction.setIcon({
          path: '/imgs/icon128-dark.png'
        });
        chrome.browserAction.setTitle({
          title: 'NightMode is ON'
        });
      }
      resolve();
    })
   })
}


function appendNightModeCss() {
  console.log("appendNightModeCss");
  if (excludedlinks.includes(document.URL)) {
    return;
  }
  var path = chrome.extension.getURL('nightmode.css');
  head = document.head || document.getElementsByTagName('head')[0];
  link= document.createElement('link');
  link.type= 'text/css';
  link.id="mystyle";
  link.rel = "stylesheet";
  link.href= path;
  setTimeout(()=>{
    head.appendChild(link);
  },300)
    return "document.body.innerHTML";
}



function init() {
  return new Promise((resolve,reject)=>{
   let isActive = false;
   getStatus().then(isActive => {
     if (!isActive) {
       chrome.browserAction.setIcon({
         path: '/imgs/icon128.png'
       });
       chrome.browserAction.setTitle({
         title: 'NightMode is OFF'
       });
   
     } else {
      // appendNightModeCss();
       chrome.browserAction.setIcon({
         path: '/imgs/icon128-dark.png'
       });
       chrome.browserAction.setTitle({
         title: 'NightMode is ON'
       });
     }
     resolve();
   })
  })
}

init().then(()=>{});

function modifyDOM() {

  var path = chrome.extension.getURL('nightmode.css');
  head = document.head || document.getElementsByTagName('head')[0];
  link = document.createElement('link');
  link.type = 'text/css';
  link.id = "mystyle";
  link.rel = "stylesheet";
  link.href = path;

  isInstagram = /^https?:\/\/([a-zA-Z\d-]+\.){0,}instagram\.com\/*/.test(document.URL)

  if (checked && isInstagram) {
    setTimeout(() => {
      head.appendChild(link);
    }, 150)

  } else {
    mystyle = document.getElementById("mystyle");
    if (mystyle != null) {
      head.removeChild(mystyle)

    }
  }
  return "document.body.innerHTML";

}
chrome.browserAction.onClicked.addListener(function (tab) {

  if (excludedlinks.includes(tab.url)) {
    return;
  }
  updateIcon().then(()=>{
     //We have permission to access the activeTab, so we can call chrome.tabs.executeScript:
  let isActive = false;

  getStatus().then(result => {
    isActive = result; 
    ch = isActive;
    chrome.tabs.executeScript(null, {
      code: "var checked =   " + ch + ";" //argument here is a string but function.toString() returns function's code
    }, () => {
      chrome.tabs.executeScript({
        code: '(' + modifyDOM + ')();' //argument here is a string but function.toString() returns function's code
      }, (results) => {});
    });
  });
  });

});




chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  let isActive = false;
  if (message.data.type == "getStatus"); {
  getStatus().then(isActive => {
      sendResponse({
        "isActive": isActive,
        "excludedlinks": excludedlinks
      });
  });
  return true;
}

  if (message.data.type == "setStatus") {
    isActive = message.data.isActive;
    setStatus(isActive).then(()=>{});
  }

});



