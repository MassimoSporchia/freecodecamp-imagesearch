var express = require('express');
var GoogleSearch = require('google-search');
var url = require('url');

var mongodb = require('mongodb');
var mongoclient = mongodb.MongoClient;

var app = express();

var my_api_key = process.env.API_KEY || 'API_KEY';
var my_cx = process.env.CX || 'CX';

var googleSearch = new GoogleSearch({
  key: my_api_key,
  cx: my_cx
});
var username = process.env.username || 'USERNAME';
var password = process.env.password || 'PASSWORD';

var MONGOLAB_URI = 'mongodb://' + username + ':' + password + '@ds149481.mlab.com:49481/freenodecampimagesearch';


app.get('/api/imagesearch/:query',function(req,res){
    var parsed = url.parse(req.url,true);
    
    var offset = parsed.query.offset || 10; 
    var query = req.params.query;

    googleSearch.build({
        q: query,
        start: 5,
        fileType: "jpg,png",
        num: offset, // Number of search results to return between 1 and 10, inclusive
        siteSearch: 'http://imgur.com/',
        searchType: 'image'
        }, function(error, response) {
            
            if ( error ) throw error;
            
            var result = [];
            //res.send(response.items);
            for(var index in response.items){
                result.push({url: response.items[index].link, snippet: response.items[index].htmlTitle, thumbnail: response.items[index].image.thumbnailLink, context: response.items[index].image.contextLink});
            }
            
            mongoclient.connect(MONGOLAB_URI, function(err, db){
                if ( err ){
                    res.send('error while connecting to DB' + err);
                    return err;
                }
                var urlsCollection = db.collection('latestsearches');
                
                urlsCollection.insert(
                    { 
                        ts: new Date(),
                        searchTerm: query
                    });
            });
          res.json(result);
         
        });
});

app.get('/api/latest/imagesearch/',function(req,res){
    mongoclient.connect(MONGOLAB_URI, function(err, db){
                if ( err ){
                    res.send('error while connecting to DB' + err);
                    return err;
                }
                var urlsCollection = db.collection('latestsearches');
                
                urlsCollection.find({}, {"sort" : ['ts.$date', 'asc']} ).toArray(function(err, array){
                   if ( err)
                   throw err;
                   res.send(array.slice(0,5));
                });
           
                    
            });
});

var port = process.env.PORT || 80;
app.listen(port);