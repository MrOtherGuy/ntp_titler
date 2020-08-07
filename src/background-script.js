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
  
  const titleManager = new(function(){
    let current = null;
    
    this.setPrefix = tab=>{
      
      const prefix = BROWSER_URLS.match(tab);
      
      if (current === prefix){
        return
      }
      
      browser.windows.update(tab.windowId,{titlePreface: prefix.length > 0 ? `${prefix} - ` : ""})
      .then(()=>{current = prefix})
    };
    
    return this
  })();
  
  function onTabUpdated(tabId,info,tab){
    
    if(!tab.active || (tab.status === "loading" && !info.title) ){
      return
    }
    titleManager.setPrefix(tab);
  }
  
  browser.tabs.onUpdated.addListener(onTabUpdated,{properties:["status","title"]});
  
  function setProperties(tab){
    if(tab.windowId === undefined || tab.windowId === null){
      return
    }
    titleManager.setPrefix(tab);
  }
  
  function onActivated(tabInfo){
    browser.tabs.get(tabInfo.tabId).then(setProperties);
  }

  browser.tabs.onActivated.addListener(onActivated);
  
})()

