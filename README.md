# ntp_titler
Simple browser extension adding a window prefix to "special" tabs

# Function

The prefix is determined by the type of the page. The prefix is determined matching the page url against the following in top-to-bottom order (first match applies)


* `NewTab - `          : The page the user has selected as their newtab page
* `Home - `            : The page the user has selected as their home page
* `PrivateBrowsing - ` : about:privatebrowsing (default newtab page for private windows)
* `Blank - `           : about:blank
* `<no-prefix>`        : https pages
* `chromeUI - `        : any other about: or chrome:// url
* If the page doesn't fit into any of the above categories then it will be prefix by `<url-scheme> - `

## Examples:

* If the user has selected "blank page" as their homepage then loading about:blank will receive "Home - " prefix
* If the user loads any http: url then it will receive `http - ` prefix
* If the user has set some extension page as their newtab, and they navigate to `about:newtab` then it will receive `chromeUI - ` prefix

# Known problems

* Firefox needs to be restarted after newtab or homepage have been modified for lableing to work properly.

* about:blank causes an issue where either `Blank`, `NewTab` or `Home` will be shown as a prefix until switching tabs or loading a new page in the current tab. This happens because `about:blank` can be briefly loaded before the actual page content.