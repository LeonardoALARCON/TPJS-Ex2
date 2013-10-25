// A simple (non-REST) API
// You may (should) want to improve it in order to provide a real-GUI for:
// - adding/removing urls to scrape
// - monitoring the crawler state
// - providing statistics like
//    - a word-cloud of the 100 most used word on the web
//    - the top 100 domain name your crawler has see
//    - the average number of link by page on the web
//    - the most used top-level-domain (TLD: http://en.wikipedia.org/wiki/Top-level_domain )
//    - ...
 
// You should extract all the following "api" related code into its own NodeJS module and require it with
// var api = require('./api');
// api.listen(PORT);

// See: http://expressjs.com/guide.html
var PORT            = 3000;
var express         = require('express');
var app             = express();
var queue           = [];
var scraper 		= require('./scraper').scraper;
 
app.get('/', function(req, res){
  // See: http://expressjs.com/api.html#res.json
  res.json(200, {
    title:'YOHMC - Your Own Home Made Crawler',
    endpoints:[{
      url:'http://127.0.0.1:'+PORT+'/queue/size',
      details:'the current crawler queue size'
    }, {
      url:'http://127.0.0.1:'+PORT+'/queue/add?url=http%3A//twitter.com/FGRibreau',
      details:'immediately start a `get_page` on twitter.com/FGRibreau.'
    }, {
      url:'http://127.0.0.1:'+PORT+'/queue/list',
      details:'the current crawler queue list.'
    }, {
      url:'http://127.0.0.1:'+PORT+'/statistics',
      details:'the statistics of the crawler.'
    },
    ]
  });
});
 
app.get('/queue/size', function(req, res){
  res.setHeader('Content-Type', 'text/plain');
  res.json(200, {queue:{length:queue.length}});
});
 
app.get('/queue/add', function(req, res){
  var url = req.param('url');
  
  scraper(queue, app, url, 0);

  res.json(200, {
    queue:{
      added:url,
      length:queue.length,
    }
  });
});
 
app.get('/queue/list', function(req, res){
  res.json(200, {
    queue:{
      length:queue.length,
      urls:queue
    }
  });
});

app.get('/statistics', function(req, res){
  res.json(200, {
    queue:{
      length:queue.length,
      urls:queue
    }
  });
});
app.enable('trust proxy');
app.listen(PORT);
console.log('Web UI Listening on port '+PORT);


