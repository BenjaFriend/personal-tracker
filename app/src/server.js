"use strict";

var http = require('http');
var url = require('url');
var query = require('querystring');
var fs = require('fs');
var eventHandlerModule = require('./eventHandler');


var port = process.env.PORT || 3000;

// read in our html file to serve back
var index = fs.readFileSync(__dirname + "/../client/index.html");
var style = fs.readFileSync(__dirname + "/../client/styles.css");
var servoControlScript = fs.readFileSync(__dirname + "/../client/scripts/servoControls.js");
var favicon = fs.readFileSync(__dirname + "/../client/favicon.png");

/** Function to handle our HTTP web requests */
function onRequest(req, res) 
{
  var parsedUrl = url.parse(req.url);
  var params = query.parse(parsedUrl.query);
  console.dir("the query is: " + req.url);

  // If the web page asked for styles.css
  if(parsedUrl.pathname === "/styles.css")
  {
    res.writeHead(200, { "Content-Type" : "text/css" } );
    res.write(style);
    res.end();
  }
  else if(parsedUrl.pathname === "/favicon.png" || parsedUrl.pathname === "/favicon.ico")
  {
    res.writeHead(200, {'Content-Type': 'image/x-icon'} );
    res.write(favicon);
    res.end();
  }
  else if(parsedUrl.pathname === "/scripts/servoControls.js")
  {
    res.writeHead(200, { "Content-Type" : "text/javascript	"} );
    res.write(servoControlScript);
    res.end();
  }
  else if(parsedUrl.pathname === '/feederReq') 
  {
    // If we should open the feeder, response accordingly
    if(eventHandlerModule.shouldOpenFeederThisInterval())
    {
      eventHandlerModule.popNextValidFeeding(res);
      return;
    }

    // Otherwise, don't bother opening it
    res.writeHead(200, { "Content-Type" : "text/html"} );
    res.write(JSON.stringify("DONT_OPEN\0"));
    res.end();
  }
  else if(parsedUrl.pathname === '/scheduleEvent') 
  {    
    // Schedule the event with the given paramaters
    eventHandlerModule.scheduleEvent(res, params);
  }
  else if(parsedUrl.pathname === '/removeEvent') 
  {
    // Remove the given event from the database
    eventHandlerModule.removeFeeding(res, params);
  }
  else if(parsedUrl.pathname === '/getEvents')
  {
    // Respond back to the client that we have completed our mission in Pi land
    eventHandlerModule.getCurrentEvents(res);
  }
  // Send the index page if something else happens
  else 
  {
    res.writeHead(200, { "Content-Type" : "text/html"} );
    res.write(index);
    res.end(); 
  }
}

http.createServer(onRequest).listen(port);
console.log("listening on port " + port);