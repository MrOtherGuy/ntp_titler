'use strict';
(function(){
  
  // Store home and newtab urls
  // This won't be updated during runtime so if you change those you'll need to restart Firefox
  const BROWSER_URLS = new Array(4);
  browser.browserSettings.newTabPageOverride.get({}).then(result=>(BROWSER_URLS[0] = result.value));
  browser.browserSettings.homepageOverride.get({}).then(result=>(BROWSER_URLS[1] = result.value));
  BROWSER_URLS[2] = "about:privatebrowsing";
  BROWSER_URLS[3] = "about:blank";
  
  function NewTab(tab){
    this.id = tab.id;
    this.window = tab.windowId;
    return this
  }
  
  let activeNewtabs = new Map();
  
  browser.tabs.onCreated.addListener(a=>{
    activeNewtabs.set(a.id,new NewTab(a))
  });
  
  browser.tabs.onRemoved.addListener(a=>{
    setTimeout(()=>(activeNewtabs.delete(a)),500)
  });
  
  browser.tabs.onUpdated.addListener((tabId,info,tab)=>{
    if(activeNewtabs.has(tabId)){
      if(!BROWSER_URLS.includes(tab.url)){
        activeNewtabs.delete(tabId);
        browser.windows.update(tab.windowId,{titlePreface:""});
      }
    }
  },{properties:["title"]});
  
  function setProperties(tab,tabId){
    let match = tab === null ? tabId : tab.id;
    let ntp = activeNewtabs.get(match);
    let win = ntp ? ntp.window : tab.windowId;
    if(win === undefined || win === null){
      return
    }

    const str = (!tab || BROWSER_URLS.includes(tab.url)) ? "NewTab" : "";

    browser.windows.update(win,{titlePreface:str});
  }
  
  function onActivated(tabInfo){
    let getting = browser.tabs.get(tabInfo.tabId);
    getting.then(setProperties,(err)=>(setProperties(null,tabInfo.tabId)));
  }
  // Timeout to make sure this happens after onCreated
  browser.tabs.onActivated.addListener( (a)=>setTimeout(onActivated(a),100));
  
})()

