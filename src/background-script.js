'use strict';
(function(){
  
  // Store home and newtab urls
  // This won't be updated during runtime so if you change those you'll need to restart Firefox
  const BROWSER_URLS = new(function(){
    
    const urls = new Array(4);
    urls[2] = "about:privatebrowsing";
    urls[3] = "about:blank";

    this.match = function(tab){
      let idx = urls.indexOf(tab.url);
      if(idx >= 0){
        switch (idx){
          case 0:
            return "NewTab"
          case 1:
            return "Home"
          case 2:
            return "PrivateBrowsing"
          case 3:
            return "Blank"
          default:
            return ""
        }
      }
      if(tab.url.startsWith("about:") || tab.url.startsWith("chrome://")){
        return "chromeUI"
      }
      if(tab.url.startsWith("https:")){ return "" }
      
      return (tab.url.slice(0,tab.url.indexOf(":")))
      
    }      
    this.setInitials = (ntp,home) => { urls[0] = ntp.value, urls[1] = home.value };
    
    return this
  })()
  
  const activeNewtabs = new Map();
  
  Promise.all([
    browser.browserSettings.newTabPageOverride.get({}),
    browser.browserSettings.homepageOverride.get({})
  ])
  .then(results=>{
    BROWSER_URLS.setInitials(results[0],results[1])
  })
  .then(()=>(new Promise(r=>{setTimeout(r,500)})))
  .then(()=>browser.tabs.query({active:true}))
  .then(tabs=>{
    if(!tabs){ return }
    for(let tab of tabs){
      onTabUpdated(tab.id,{},tab);
    }
  });
  
  function NewTab(tab){
    this.id = tab.id;
    this.window = tab.windowId;
    return this
  }
  
  
  browser.tabs.onCreated.addListener(a=>{
    activeNewtabs.set(a.id,new NewTab(a))
  });
  
  browser.tabs.onRemoved.addListener(a=>{
    setTimeout(()=>(activeNewtabs.delete(a)),500)
  });
  
  function onTabUpdated(tabId,info,tab){
    
    if(!tab.active){ return }
    
    const tabType = BROWSER_URLS.match(tab);
    const isKnown = activeNewtabs.has(tabId);
    if(tabType && !isKnown){
      // This happens when navigation occurs to ntp tab without creating a tab
      activeNewtabs.set(tabId,new NewTab(tab));
    }else if(isKnown && tabType != "Blank"){
      activeNewtabs.delete(tabId);
    }
    
    browser.windows.update(tab.windowId,{titlePreface:tabType.length>3?`${tabType} - `:""})
  }
  
  browser.tabs.onUpdated.addListener(onTabUpdated,{properties:["title"]});
  
  function setProperties(tab,tabId){
    let match = tab === null ? tabId : tab.id;
    let ntp = activeNewtabs.get(match);
    let win = ntp ? ntp.window : tab.windowId;
    if(win === undefined || win === null){
      return
    }
    
    let prefix = !tab?"NewTab":`${BROWSER_URLS.match(tab)} - `;

    browser.windows.update(win,{titlePreface:prefix.length > 3?prefix:""});
  }
  
  function onActivated(tabInfo){
    let getting = browser.tabs.get(tabInfo.tabId);
    getting.then(setProperties,(err)=>(setProperties(null,tabInfo.tabId)));
  }
  // Timeout to make sure this happens after onCreated
  // and also to make sure this runs after a tab is loaded in new window since it will initially likely load about:blank and we can't reliably detect when about:blank will be replaced with the eventual content
  browser.tabs.onActivated.addListener((t)=>{
    if(activeNewtabs.has(t.tabId)){
      setTimeout(()=>onActivated(t),50)
    }else{
      onActivated(t)
    }
  });
 
  
})()

