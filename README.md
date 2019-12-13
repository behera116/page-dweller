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

Expected Output format:

```javascript

{
  "links": {
    "canonical": [
      "http://www.rannutsav.com"
    ],
    "stylesheet": [
      "https://www.rannutsav.com/assets/front/css/creative.min.css"
    ]
  },
  "scripts": [
    "https://www.rannutsav.com/assets/front/vendor/jquery/jquery.min.js",
    "https://www.google.com/recaptcha/api.js"
  ],
  "anchors": [
    {
      "href": "http://www.akshartours.com/akshar-tour-categories/international-tours/1",
      "text": "International Tour Package"
    },
    {
      "href": "tel:18002339008",
      "text": ""
    }
  ],
  "images": [
    {
      "src": "https://www.rannutsav.com/assets/front/images/WILDLIFE.jpg",
      "alt": "special offer"
    },
    {
      "src": "https://www.rannutsav.com/assets/front/images/DESERT AND BEACH .jpg",
      "alt": "special offer"
    }
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
```javascript

{
  "charset": "utf-8",
  "viewport": "width=device-width, initial-scale=1, shrink-to-fit=no",
  "description": "Its time to celebrate most awaiting colourful event of Kutch Rann Utsav at 2019, 2020. Specially designed honeymoon tent for Couple at Rann utsav, Kutch, Gujart, India. Call at +91 - 79 2644 0626, + 91 - 79 - 2646 2166 or email us at akshartours@ymail.com",
  "keywords": "Rann Utsav Tour, Package, Tent Booking 2019-20",
  "revisit-after": "1 days",
  "author": "Rann Utsav",
  "Robots": "all",
  "googlebot": "index, follow",
  "MSNbot": "index, follow",
  "rating": "General",
  "distribution": "global",
  "opengraph": {
    "site_name": "Rann Utsav",
    "url": "https://www.rannutsav.com/"
  }
}

```

