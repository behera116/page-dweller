# page-dweller
page-dweller tries to extracting all possible webpage information at one place by implementing diffrent npm packages.
Scraping webpage for metadata, schema information, resource links such as anchor, script src, images, plain text, topics discussed in the page and term frequencies

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

- [async fetch URL response](#async-fetch)
- [Loading HTML](#load-element)
- [Getting script,stylesheet, anchors, images details](#PageResources)
- [Getting Metadata](#metadata)
- [Getting Structured data(schema.org) from ld+json](#structured-data)
- [Getting plain text from html](#plaintext)
- [Getting Nlp data such as data and term frequencies from plaintext](#nlpdata)
- [Getting datagrams from plain text](#get-datagrams)
---
<a name="async-fetch"></a>
## async Fetch function
This is an async/await implementation of `fetch` npm package.

function: `fetchUrlAsync(url)`
implementation: 
```js
var response = await fetchUrlAsync(url);
var finalUrl = response.header.finalUrl;
var statusCode = response.status;
var html = response.body;
```
---

<a name="load-element"></a>
## Loading HTML
jQuery variable is passed as parameters to `getMetadata`, `getPageResources`,`innerText`,`getLdJson` functions

```js
var url = "https://www.example.com/";
var response = await dweller.fetchUrlAsync(url);
var html = response.body;
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

<a name="structured-data"></a>
## Getting Structured data(schema.org) from ld+json
function: `getLdJson(jQueryElement)`

```js
var $ = await dweller.loadElement(response.body)
schema = await dweller.getLdJson($);
```

Output:
```javascript
[
  {
    "@context": "http://schema.org",
    "@type": "WebSite",
    "name": "MySmartPrice",
    "alternateName": "MySmartPrice",
    "url": "http://www.mysmartprice.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "http://www.mysmartprice.com/msp/search/search.php?s={search_term_string}#s={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  },
  {
    "@context": "http://schema.org",
    "@type": "Organization",
    "url": "http://www.mysmartprice.com",
    "logo": "https://assets.mspimages.in/logos/mysmartprice/msp.png",
    "sameAs": [
      "https://www.facebook.com/mysmartprice",
      "https://www.linkedin.com/company/mysmartprice-com",
      "https://plus.google.com/+mysmartprice/"
    ]
  }
]
```

---

<a name="plaintext"></a>
## Getting plain text from html
function: `innerText(jQueryElement)` .  

`innerText` function extracts the text content from body tag after removing `<script>` and `<style>` tags from it. It appends a new line character at the end of text content of each element.
This is an similar to [innertext](https://www.npmjs.com/package/innertext) where it contains spaces rather than new lines after each html element.

```
var $ = await dweller.loadElement(html);
var plainText = await dweller.innerText($);
```

---

<a name="nlpdata"></a>
## Getting Nlp data such as data and term frequencies from plaintext
It implements [compromise](https://www.npmjs.com/package/compromise) and [compromise-ngrams](https://www.npmjs.com/package/compromise-ngrams) npm package to extract topics and term freqencies from plain text.   


function: `getNlpData(text, fieldNamesArray)`   
fieldNamesArray: ["topics", "datagrams"] 

By default only size:1 datagrams will be generated. To get all terms per your requirements use [getDataGrams](#get-datagrams) function with given parameters.

```js
pagedata.plainText = await dweller.innerText($);//string can be directly used here.
pagedata.nlpData = await dweller.getNlpData(pagedata.plainText,['topics','datagrams']);
```

Output:
```javascript
{
    "dataGrams":[
        {
            "size":1,
            "count":40,
            "normal": "vivo"
        },
        {
            "size": 1,
            "count":35,
            "normal": "mobiles"
        },
        {
            "size": 1,
            "count": 23,
            "normal": "Upcoming"
        }
    ],
    "topics": [
        "vivo",
        "vivo mobiles",
        "upcoming mobiles"
    ]
}
```

---

<a name="get-datagrams"></a>
## Getting datagrams
It extracts all the datagrams from text after removing the stopwords.

function: `getDataGrams(plaintext, options)`   
options:
    - size (size of datagram required)
    - min (min size of datagram)
    - max (max size of datagram)

implementation:
```
var dataGrams = await getDataGrams(plainText,{size:1});//for one word terms

```

