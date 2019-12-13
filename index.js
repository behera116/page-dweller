const fetchUrl = require('fetch').fetchUrl;
const cheerio = require('cheerio');
const parseUrl = require('url-parse');

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
                    header:header
                });
            }else{
                resolve({
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


const getPageDetails = async(url) => {

    try{ 
        var response = await fetchUrlAsync(url);
        var finalUrl = response.header.finalUrl;
        var statusCode = response.status;
        console.log("finale URL: "+finalUrl);
        console.log("status code: "+statusCode);

        
        var headerInfo = {
            finalUrl: finalUrl,
            statusCode: statusCode
        }

        let pagedata = {
            headerInfo: headerInfo
        };

        if(typeof response.body !== 'undefined'){
            var $ = await loadElement(response.body);
            pagedata.metadata = await getMetadata($);
            pagedata.schema = await getLdJson($);
            pagedata.resources = await getPageResources($,['anchors','scripts','links']);
            
            pagedata.plainText = await innerText($);
            pagedata.nlpData = await getNlpData(pagedata.plainText,['topics','datagrams']);        
            return pagedata;    
        }else{
            console.log(JSON.stringify(response.error));
            return;
        }

    }catch(err){
        console.log("error while processing webpage. Details: "+err);
        return;
    }
};

/*( async() => {
    var url = "https://www.mysmartprice.com/";
    var pagetdata = await getPageDetails(url);
    console.log(JSON.stringify(pagetdata.resources.anchors));

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
    'getTopics': getTopics
}


