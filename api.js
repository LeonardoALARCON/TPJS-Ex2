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
var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'webspider',
  password : '123',
  database : 'webspider'
});

connection.connect();

connection.query('CREATE TABLE IF NOT EXISTS urls(' +
          'ID INT NOT NULL AUTO_INCREMENT,' +
          'Url VARCHAR(300) NOT NULL,' +
          'From_page VARCHAR(300),' +
          'Encoding VARCHAR(100),' +
          'Server VARCHAR(100),' +
          'Content_type VARCHAR(100),' +
          'Content_length VARCHAR(100),' +
          'PRIMARY KEY (ID)' +
          ');',
          function (err, rows, fields) {
            if (err) {
                console.log("Error: " + err.message);
                throw err;
            }
       });

connection.query('SELECT Url from urls;',
	function(err, rows, fields){
		if(err){
			console.log(err);
			throw err;
		}
		else{
			rows.forEach(function(value){
				queue.push(value.Url);
			});
		}
	});
		
 
app.get('/', function(req, res){
  res.sendfile(__dirname + "/views/index.html");
});
 
app.get('/queue/size', function(req, res){
  res.setHeader('Content-Type', 'text/plain');
  res.json(200, {queue:{length:queue.length}});
});
 
app.get('/queue/add', function(req, res){
  var url = req.param('url');
  if(queue.indexOf(url) == -1){
  	connection.query('INSERT INTO urls (Url) VALUES (\'' + url + '\');',
          function (err, rows, fields) {
            if (err) {
                console.log("Error MySQL: " + err.message);
                throw err;
            }
       });
  	queue.push(url);
  }

  scraper(queue, app, url, queue.length);

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

app.get('/queue/start', function(req, res){
   res.sendfile(__dirname + "/views/start.html");
});


app.enable('trust proxy');
app.listen(PORT);
console.log('Web UI Listening on port '+PORT);


