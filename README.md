# page-dweller
Scraping webpage for metadata, schema information, resource links such as anchor, script src, images, topics discussed in the page and term frequencies

## Install

    npm install page-dweller


## Basic implementation

Example 

```
const dweller = require('page-dweller');
( async() => {
    var url = "https://www.thehindu.com/news/national/opposition-protest-against-ib-ministry-advisory-in-the-backdrop-of-assam-violence/article30283682.ece?homepage=true";
    var pagetdata = await dweller.getPageDetails(url);

    console.log(JSON.stringify(pagetdata));

})();
```
