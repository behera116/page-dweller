# page-dweller
page-dweller tries to extract all possible data points available in a webpage by implementing diffrent npm packages.
Scraping webpage for metadata, schema information, resource links such as anchor, script src, images,social profile links,emails, phone number, plain text, topics discussed in the page and term frequencies.

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

Output format:

```javascript
{
    header:{
        status:200,
        finalUrl:"https://example.com/",
        responseHeaders:{}
    },
    socialData:{
        twitters:String[],
        facebooks:String[],
        youtubes:String[],
        emails:String[],
        phones:String[],
        phonesUncertain:String[],
        linkedIns:String[],
        instagrams:String[]
    },
    schema: Object[],//all the ld json objects
    resources:{
        links:{
            canonical: String[],
            stylesheet: String[]
        }
        scripts:String[],//src attribute of all script element
        anchors: Object[],//{href:"a URL", text: "text content of <a> tag "}
        images: Object[]//{src:"image URL","alt":"alt text of the image"}
    },
    plainText: String,// text present inside body tag excluding script and stylesheet text
    nlpData:{
        dataGrams: Object[],//{size:1,count:43,normal:"hello"}
        topics: String[]
    }
}

```

For specific data point extraction from a webpage use [getSpecificPageData method](#getSpecificPageData).

---

## Table of Contents  

- [Getting specific data points from a webpage](#getSpecificPageData)
- [async fetch URL response](#async-fetch)
- [Loading HTML](#load-element)
- [Getting script,stylesheet, anchors, images details](#PageResources)
- [Getting Metadata](#metadata)
- [Getting Social data](#social-data)
- [Getting Structured data(schema.org) from ld+json](#structured-data)
- [Getting plain text from html](#plaintext)
- [Getting Nlp data such as data and term frequencies from plaintext](#nlpdata)
- [Getting datagrams from plain text](#get-datagrams)

---
<a name="getSpecificPageData"></a>
## Getting specific data points from a webpage

To extract any specific data points from a given webpage the properties must be present in `fields` varaible which is passed as argument to `getSpecificPageData` function. An empty array value against a key will return full data for that property.
i.e: `nlpData:[]` will return both datagrams,topics in nlpData result.

```js
var fields = {
    header:true, 
    metdata: true,
    schema: true,
    plainText:true,
    social:[],//possible array values for social['twitters','facebooks','youtubes','instagrams','emails','phones','phonesUncertain','linkedIns']
    nlpData:[],//possible array values['datagrams','topics']
    resources:[]//possible array values['links','anchors','scripts','images']
};
var pagedata = await getSpecificPageData(url,fields);
```
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
---
<a name="social-data"></a>

## Getting Social data(email,phones, twitter,facebook, instagram URLs)
[Apify social Utils's](https://sdk.apify.com/docs/api/social) `parseHandlesFromHtml` is used for the extraction of various social information. `phonesUncertain`(low chances of being a phone number) is limited to max 5 to avoid large size of data.

Function: `getSocialData(html,fields)`

```js
var fields = {
    social:['twitters','facebooks',emails,'phones']
}
var socialData = await getSocialData(html,fields);
```
Output format:
```javascript
{
    socialData:{
        twitters:String[],
        facebooks:String[],
        youtubes:String[],
        emails:String[],
        phones:String[],
        phonesUncertain:String[],
        linkedIns:String[],
        instagrams:String[]
    }
}
```


---
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

```js
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
```js
var dataGrams = await getDataGrams(plainText,{size:1});//for one word terms

```

