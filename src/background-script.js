'use strict';
(function(){
  
  const BROWSER_URLS = new(function(){
    
    const urls = new Array(4);
    urls[0] = null,
    urls[1] = null,
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
    this.setInitials = (pages) => { urls[0] = pages[0].value, urls[1] = pages[1].value };
    
    return this
  })()
  
  function getPages(){
    return new Promise((resolve, reject) => {
      Promise.all([
        browser.browserSettings.newTabPageOverride.get({}),
        browser.browserSettings.homepageOverride.get({})
      ])
      .then(resolve)
      .catch(reject)
    })      
  }
  
  getPages()
  .then(BROWSER_URLS.setInitials)
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
    
    this.setPrefix = async tab => {
      
      
      if(current === "chromeUI"){
        let pages = await getPages();
        BROWSER_URLS.setInitials(pages)
      }
      
      const prefix = BROWSER_URLS.match(tab);
      
      if (current === prefix){
        return
      }
      
      await browser.windows.update(tab.windowId,{titlePreface: prefix.length > 0 ? `${prefix} - ` : ""});
      current = prefix
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

