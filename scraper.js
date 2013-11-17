'use strict';
 
/**
 * Web Scraper
 */
// Instead of the default console.log, you could use your own augmented console.log !
// var console = require('./console');
 
// Url regexp from http://daringfireball.net/2010/07/improved_regex_for_matching_urls

var scraper = function (queue, api, page, i){

      console.log = require('./console').log;
      var EXTRACT_URL_REG = /\b((?:https?:\/\/|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s!()\[\]{};:.,<>?«»]))/gi;
      var PORT            = 3000;
       
      var request         = require('request');
      request.defaults({'proxy':'http://cache.cites-u.univ-nantes.fr:3128'});
      
      var mysql      = require('mysql');
      var connection = mysql.createConnection({
        host     : 'localhost',
        user     : 'webspider',
        password : '123',
        database : 'webspider'
      });

      connection.connect();
      // You should (okay: could) use your OWN implementation here!
      var EventEmitter    = require('events').EventEmitter;

      // We create a global EventEmitter (Mediator pattern: http://en.wikipedia.org/wiki/Mediator_pattern )
      var em              = new EventEmitter();
       
      /**
       * Remainder:
       * queue.push("http://..."); // add an element at the end of the queue
       * queue.shift(); // remove and get the first element of the queue (return `undefined` if the queue is empty)
       *
       * // It may be a good idea to encapsulate queue inside its own class/module and require it with:
       * var queue = require('./queue');
       */
      //var queue        =   require('./api').queue;

       
      /**
       * Get the page from `page_url`
       * @param  {String} page_url String page url to get
       *
       * `get_page` will emit
       */
      function get_page(page_url){
        em.emit('page:scraping', page_url);
       
        // See: https://github.com/mikeal/request
        request({
          url:page_url,
        }, function(error, http_client_response, html_str){
          /**
           * The callback argument gets 3 arguments.
           * The first is an error when applicable (usually from the http.Client option not the http.ClientRequest object).
           * The second is an http.ClientResponse object.
           * The third is the response body String or Buffer.
           */
       
          /**
           * You may improve what get_page is returning by:
           * - emitting HTTP headers information like:
           *  -> page size
           *  -> language/server behind the web page (php ? apache ? nginx ? using X-Powered-By)
           *  -> was compression active ? (Content-Encoding: gzip ?)
           *  -> the Content-Type
           */
          if(error){
            em.emit('page:error', page_url, error);
            return;
          }
       	  var page = {
       	  	url : page_url,
       	  	encoding : http_client_response._readableState.defaultEncoding,
            server : http_client_response.headers.server,
            content_type : http_client_response.headers['content-type'],
            content_length : http_client_response.headers['content-length']
       	  }
          connection.query("UPDATE urls SET Encoding = '" + page.encoding + "'," +
            "Server = '" + page.server + "'," +
            "Content_type = '" + page.content_type + "'," +
            "Content_length = '" + page.content_length + "'" +
            "WHERE url = '" + page.url + "';"
          );
          em.emit('page', page, html_str);
        });
      }
       
      /**
       * Extract links from the web pagr
       * @param  {String} html_str String that represents the HTML page
       *
       * `extract_links` should emit an `link(` event each
       */
      function extract_links(page, html_str, i){
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/match
        // "match" can return "null" instead of an array of url
        // So here I do "(match() || []) in order to always work on an array (and yes, that's another pattern).
        (html_str.match(EXTRACT_URL_REG) || []).forEach(function(url){
          // see: http://nodejs.org/api/all.html#all_emitter_emit_event_arg1_arg2
          // Here you could improve the code in order to:
          // - check if we already crawled this url
          // - ...
            if(queue.indexOf(url) == -1)
             em.emit('url', page, html_str, url);
        });
        em.emit('exit');
      }
       
      function handle_new_url(from_page, from_page_str, url){
        // Add the url to the queue
        console.log("Error-->(\'"+ url+ '\');');
        queue.push(url);
        connection.query('INSERT INTO urls (Url, From_page) VALUES (\'' + url + '\',\''+ from_page.url+'\');',
          function (err, rows, fields) {
            if (err) {
                console.log("Error MySQL: " + err.message);
                throw err;
            }
       });
       
        
      }

      
      
      
      em.on('page:scraping', function(page_url){
        console.log('Loading... ', page_url);
      });
       
      // Listen to events, see: http://nodejs.org/api/all.html#all_emitter_on_event_listener
      em.on('page', function(page_url, html_str){
        console.log('We got a new page!', page_url);
      });
       
      em.on('page:error', function(page_url, error){
        console.error('Oops an error occured on', page_url, ' : ', error);
        em.emit('exit');
      });
       
      em.on('page', extract_links);

     

      em.on('url', function(page_url, html_str, url){
        console.log('We got a link! ', url);
      });
       
      em.on('url', handle_new_url);

      


      em.on('exit', function(){
          if(i<queue.length)
            scraper(queue, api, queue[i], ++i);
          else{
            console.log("Le scraper n'a plus pages.")
            connection.end();
          }
      });

      // #debug Start the crawler with a link
      
      get_page(page);

}

exports.scraper = scraper;

