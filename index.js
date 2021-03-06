const fetchUrl = require('fetch').fetchUrl;
const cheerio = require('cheerio');
const parseUrl = require('url-parse');
const Apify = require('apify');

const Entities = require('html-entities').AllHtmlEntities;

const stopword = require('stopword');
const nlp = require('compromise');
nlp.extend(require('compromise-ngrams'));

const loadElement = async(html) => {
    var $ = cheerio.load(html);
    return $;
}

const fetchUrlAsync = async(url) => {
    
    return new Promise( (resolve,reject) => {
        fetchUrl(url, (err,meta,body) => {
            if(err){
                reject({
                    error: err, 
                    header:meta,
                    body:""
                });
            }else{
                resolve({
                    error: "",
                    header: meta, 
                    body: body.toString() 
                });
            }
        });
    });

}

const getPageResources = async($,fieldNames) => {
    let resources = {};
    
    if(!Array.isArray(fieldNames))
        return;

    try{

        if(fieldNames.indexOf('links') !== -1){ 
            resources['links'] = {};
            $('link').map( (index, item) => {
                var rel = item.attribs.rel;
                var href = item.attribs.href;
                if(!resources.hasOwnProperty(rel)){
                    resources['links'][rel] = [];
                } 
                resources['links'][rel].push(href);
            });
        }

        if(fieldNames.indexOf('scripts') !== -1){
            resources['scripts'] = [];
            $('script').map( (index,item) => {
                if( typeof item.attribs.src !== 'undefined'){
                    resources['scripts'].push(item.attribs.src);    
                } 
            });
        }
        
        if(fieldNames.indexOf('anchors') !== -1){
            resources['anchors'] = [];
            $('a').map( (index,item) => {
                if(typeof item.attribs.href !== 'undefined'){ 
                    var row = {};
                    row.href = item.attribs.href;
                    var atext = $(item).text();
                    row.text = typeof atext !== 'undefined'? atext.trim():'';
                    resources['anchors'].push(row);
                }
            });
        }

        if(fieldNames.indexOf('images') !== -1){
            resources['images'] = [];
            $('img').map( (index,item) => {
                if(typeof item.attribs.src !== 'undefined'){
                    var row = {};
                    row.src = item.attribs.src;
                    row.alt = typeof item.attribs.alt !== 'undefined'?item.attribs.alt.trim():'';
                    resources['images'].push(row);
                }
            });
        }

    }catch(err){
        console.log('Error while fetching page resource. Details - '+err);
    }

    return resources;
}

const getPageTitle = async($) => {
    var title = "";
    try{
        $('title').map( (index,item) => {
            title = $(item).text().trim();
        });
    }catch(error){
        console.log("unable to extract title. Details - ",title);
    }
    return title;
}

const getMetadata = async($) => {
    try{
        
        let tags = [];
        $('meta').map( (index,item) => {
            tags.push(item.attribs);
        });
   
        let metadata = {};
        tags.forEach( (tag) => {
            var name = tag.name; 
            var property = tag.property;
            
            if( typeof name!== 'undefined'){
                var content = tag.content;
                metadata[name] = content;     
            }

            if(typeof property !== 'undefined' && property!==''){
                if(property.trim().indexOf('og:') === 0){
                    var ogname= property.split('og:')[1];
                    if( !metadata.hasOwnProperty('opengraph')){
                        metadata['opengraph'] = {};
                    }
                    metadata['opengraph'][ogname] = tag.content;
                }
            }
   
            if(typeof tag['http-equiv'] !== 'undefined'){
                var key = tag['http-equiv'];
                if( !metadata.hasOwnProperty('http-equiv')){
                    metadata['http-equiv'] = {};
                }
                metadata['http-equiv'][key] = tag.content;
            }else if(typeof tag.scheme !== 'undefined'){
                console.log(tag);
                var key = tag.scheme;
                metadata['scheme'] = tag.content;
            }else if(typeof tag.charset !== 'undefined'){
                metadata['charset'] = tag.charset;
            }
    
        });
   
        return metadata;

    }catch(err){
        console.log(err);
    }

}

const getMetadataFromHtml = async(html) => {
    try{
        let $ = await loadElement(html);
        let metadata = await getMetadata($);
        console.log(metadata);
        return metadata;
    }catch(err){
        console.log(err);
        return;
    }
}

const getLdJson = async($) => {
    var schema = [];
    
    try{
        $('script[type="application/ld+json"]').map( (index,item) => {
            schema.push(JSON.parse(item.children[0].data.trim()));
        });

        return schema;
    }catch(err){
        console.log(err);
        return;
    } 
}

const innerText = async($) => {
  
    try{
        $('script').remove();
        $('style').remove();
    }catch(err){
    
    }

    try{
        var entities = new Entities();
        var html = $('body').html();
        return entities.decode(html.split(/<[^>]+>/)
            .map(function (chunk) { return chunk.trim() })
            .filter(function (trimmedChunk) { return trimmedChunk.length > 0 })
            .join('\n')
        );
    }catch(err){
        return;    
    }
}

const getDataGrams = async(plainText,options) => {
    
    try{
        var lineData = plainText.split('\n');
        allWords = [];
        lineData.forEach( (line) => {
            words = line.split(' ');
            allWords.push(...words); 
        });
        plainText = stopword.removeStopwords(allWords).join(' ');
        var doc = nlp(plainText);
        doc.normalize({plurals:true, parentheses:true, possessives:true, honorifics:true});
        datagrams = doc.ngrams(options);
        return datagrams;
    }catch(err){

        return;
    }

}

const getTopics = async(plainText) => {
    
    try{
        var doc = nlp(plainText);
        doc.normalize({plurals:true, parentheses:true, possessives:true, honorifics:true});
        var dataJson = doc.topics().json();
        sents = [];
        dataJson.forEach( (item) => {
            sents.push(item.text);
        });
        var uniqueTopics = new Set(sents);
        sents = [...uniqueTopics];
        return sents;
    }catch(err){
        console.log('Error while parsing topic. Details - '+err);
        return;
    }

}


const getNlpData = async(plainText,fieldnames) => { 
    try{
        if(!Array.isArray(fieldnames))
            return;

        var nlpData = {};
        if(fieldnames.indexOf('datagrams') !== -1){
            nlpData.dataGrams = await getDataGrams(plainText,{size:1}); 
        }

        if(fieldnames.indexOf('topics') !== -1){
            nlpData.topics = await getTopics(plainText);
        }

        return nlpData;
    }catch(err){
        console.log('Error while nlpdata processing. Details - '+err);
        return;
    }
}

module.exports = {
    
}


const getSocialData = async(html,fields) => {
    try{
        var media = Apify.utils.social.parseHandlesFromHtml(html);
        media.phonesUncertain = (typeof media.phonesUncertain !== 'undefined' && media.phonesUncertain.length>0)? (media.phonesUncertain.filter( (row,idx) => idx<5)): [];
        if(Array.isArray(fields) && fields.length>0){
            for(var skey in media){
                if(!fields.includes(skey)){
                    delete media[skey];//remove all data points not required for social profile
                }
            }
        } 
        return media;
    }catch(err){
        console.log('Unable to extract social data. Details - '+err);
        return;
    }

}


const getSpecificPageData = async(url,requiredFields) => {
    
    try{
        var response = await fetchUrlAsync(url);
        var finalUrl = response.header.finalUrl;
        var statusCode = response.header.status;
        console.log("finale URL: "+finalUrl);
        console.log("status code: "+statusCode);


        let pagedata = {};

        if(requiredFields.hasOwnProperty('header')){
            pagedata.header = response.header; 
        }
       
        if(typeof response.body !== 'undefined'){
            
            var $ = await loadElement(response.body);
            
            if(requiredFields.hasOwnProperty('pageTitle')){
                pagedata.pageTitle = await getPageTitle($);
            }

            if(requiredFields.hasOwnProperty('metadata')){
                pagedata.metadata = await getMetadata($);
            }
            
            if(requiredFields.hasOwnProperty('schema'))
                pagedata.schema = await getLdJson($);
            
            if(requiredFields.hasOwnProperty('resources')){
                var rFields = requiredFields.resources;
                if(!Array.isArray(rFields) || rFields.length === 0){
                    rFields = ['scripts','links','anchors','images'];
                }
                pagedata.resources = await getPageResources($,rFields);
            }

            if(requiredFields.hasOwnProperty('social')){
                pagedata.socialData = await getSocialData(response.body,requiredFields.social);
            }

            var plainText = await innerText($);
            if(requiredFields.hasOwnProperty('plainText'))
                pagedata.plainText = plainText;
            
            if(requiredFields.hasOwnProperty('nlpData')){
                var nfields = requiredFields.nlpData;
                if(!Array.isArray(nfields) || nfields.length === 0){
                    nfields = ['topics','datagrams'];
                }
                pagedata.nlpData = await getNlpData(plainText,nfields);
            }
 
            return pagedata;

        }else{
            console.log(JSON.stringify(response.error));
            return;
        }

    }catch(err){
        console.log("error while processing webpage. Details: "+err);
        return;
    }

}

const getPageDetails = async(url) => {

    try{
        var fields = {
            header:true,
            pageTitle: true,
            metadata: true,
            schema: true,
            plainText:true,
            social:[],
            nlpData:[],
            resources:[]
        };
        var pagedata = await getSpecificPageData(url,fields);
        return pagedata;
    }catch(err){
        console.log("error while processing webpage. Details: "+err);
        return;
    }
};



/*( async() => {
    var url = "https://www.mysmartprice.com/";
    
    var requiredFields = { 
        metadata:true,
        social: ['twitters','facebooks','youtubes'],
        pageTitle: true,
        //schema:true,
        //resources:['scripts','images']
        //nlpData:["topics"],
        //plainText:true,
        //header:true 
    }

    var pagetdata = await getSpecificPageData(url,requiredFields);
    console.log(JSON.stringify(pagetdata));

})();*/


module.exports = {
    'getPageDetails': getPageDetails,
    'fetchUrlAsync': fetchUrlAsync,
    'loadElement': loadElement,
    'getMetadataFromHtml': getMetadataFromHtml,
    'getMetadata': getMetadata,
    'getLdJson': getLdJson,
    'getPageResources': getPageResources,
    'innerText': innerText,
    'getNlpData': getNlpData,
    'getDataGrams': getDataGrams,
    'getTopics': getTopics,
    'getSocialData': getSocialData,
    'getSpecificPageData':getSpecificPageData,
    'getPageTitle': getPageTitle
}


