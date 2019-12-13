# page-dweller
Scraping webpage for metadata, schema information, resource links such as anchor, script src, images, topics discussed in the page and term frequencies

## Install

    npm install page-dweller


## Basic implementation

Example 

```js
const dweller = require('page-dweller');
( async() => {
    var url = "https://www.thehindu.com/news/national/opposition-protest-against-ib-ministry-advisory-in-the-backdrop-of-assam-violence/article30283682.ece?homepage=true";
    var pagetdata = await dweller.getPageDetails(url);

    console.log(JSON.stringify(pagetdata));

})();
```


---

## Table of Contents  

- [Loading HTML](#load-element)
- [Getting script,stylesheet, anchors, images details](#PageResources)
- [Getting Metadata](#metadata)

---

<a name="load-element"></a>
## Loading HTML
jQuery variable is passed as parameters to `getMetadata`, `getPageResources`,`innerText`,`getLdJson` functions

```js
var $ = await dweller.loadElement(html);
```

---

<a name="PageResources"></a>
## Getting script,stylesheet, anchors, images links

`dweller.getPageResources(jQuery,fieldNameArray)`


```js
var $ = await dweller.loadElement(html);
var resources = await dweller.getPageResources($,['scripts','links','images','anchros']);
```

Output:
```
{
    scripts:["link1.js","link2.js",...],
    links:{ . 
        canonical:["c-link1", "c-link2"...], 
        stylesheet: ["ss-link1.css","ss-link2.css"...]
        ...
    },  
    anchors:[
     {
        href: "a-link1",
        text: "link1"
     }
     ...
    ],
    images: [
        {
            src: "img-link",
            alt: "image-alt-text"
        },
        ...
    ]
}
```

---

<a name="metadata"></a>

## Getting Metadata
Getting opengraph data, meta description of the webpage

```js
var metadata = await dweller.getMetadata($);
```

Expected Output:
```
{
    http-equiv: {
        Content-type: "text/html; charset=utf-8",
        X-UA-Compatible: "IE=Edge"
    },
    robots: noodp,
    opengraph: {
        site_name: "xyz",
        title: "webpage title",
        description: "...",
        url: "url.com",
        ...
    }
}

```

