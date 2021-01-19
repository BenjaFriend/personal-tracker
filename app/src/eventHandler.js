/** This is where we can handle any database things for the feeder */

"use strict";

// The postgres pool
const { Pool } = require('pg');
const pool = new Pool(
{
  connectionString: process.env.DATABASE_URL, // maybe have to append '?ssl=true' to this
  ssl: true,
});

/** Temp array of all the current feeding events */
var allEvents = [];

/** The unique ID for the next event that is created */
var EventID = 0;
const OpenSetting   = "Open";
const CloseSetting  = "Close";


/** A feed event represents a scheduled event for feeding the tiger */
class FeedEvent
{
  /**
   * @param date      The date that this should happen (YYYY-mm-dd)
   * @param hour      What hour this event should happen (0-24)
   * @param doorNum   Which door to open (1 or 2)
   * @param setting   Whether this should open or close a door
   * @param UID       a Unique ID of this event (use EventID)
   */
  constructor(date, hour, doorNum, setting, UID)
  {
    this.date = date;
    this.hour = hour;
    this.doorNum = doorNum;
    this.setting = setting;
    this.UID = UID; 
  }
}

/** Remove a feeding given it's UID */
exports.removeFeeding = function(res, params) 
{
    // TODO: Use posgress for all this data :S
    /*var sql = 'DELETE FROM GameSubtable WHERE game_name = \''
            + UID + '\'';

    pool.query(sql)
    .then(response => {
        var theJson = JSON.stringify(response.rows);
        console.dir('SUCCESS DELETE ' + game_name);
        console.dir(theJson);
    })
    .catch(e => {
        return console.error(e.message);
    });*/

    if(params.removeID)
    {
      removeFeedingByID(params.removeID);
    }

    res.writeHead(200, { "Content-Type" : "text/text	"} );
    res.end();
  };

/** Remove a feeding event based on it's ID */
function removeFeedingByID (idToRemove) 
{
  for( var i = 0; i < allEvents.length; i++ )
  { 
    // If this ID matches, then remove it
    if ( allEvents[i].UID == idToRemove ) 
    {
      allEvents.splice(i, 1); 
      console.log("REMOVE ID: " + idToRemove);
      return;
    }
  }
}

/** Determine if the feeder should open during this time interval */
exports.shouldOpenFeederThisInterval = function() 
{
  // If there is a valid event right now, then yes we should
  if(findValidEvent() == undefined)
  {
    return false;
  }
  else
  {
    return true;
  }
}

/**
 * Looks for an event within the hour on this day. Returns that if found,
 * otherwise returns undefined
 */
function findValidEvent()
{
  var today = new Date();
  var curHours = today.getHours();

  for( var i = 0; i < allEvents.length; i++ )
  {
    if ( allEvents[i].hour == curHours ) 
    {
      return allEvents[i];
    }
  }
  
  return undefined;
}

/** 
 * Remove the next valid feeding from the database, and respond with the correct
 * door number with the given infomation. Should be called from the ESP32 board
 */
exports.popNextValidFeeding = function(res)
{
  // Find the valid event
  var event = findValidEvent();
  if(event == undefined)
  {
    res.writeHead(400, { "Content-Type" : "text/text"} );
    res.write(JSON.stringify("Error getting event!"));
    res.end();
  }

  // remove it fromt the list
  removeFeedingByID(event.UID);

  // Make a quick representation of the data we need, could certainly be better
  var data = "";
  data += event.doorNum;
  data += event.setting == OpenSetting ? 'O' : 'C'; 
  data += '\0';

  console.log(event);
  console.log(data);

  res.writeHead(200, { "Content-Type" : "text/text"} );
  res.write(data);
  res.end();
  return false;
}

/** Schedule an event by putting it in the database for later */
exports.scheduleEvent = function(res, params)
{
  console.log(params);

  // If we have all the proper data...
  if(params.date && params.hours && params.door && params.setting)
  {
    var Feeding = new FeedEvent(params.date, params.hours, params.door, params.setting, EventID++);
    allEvents.push(Feeding);
  
    // TODO: Add this data to a database instead of an array
    res.writeHead(200, { "Content-Type" : "text/html"} );
    res.write(JSON.stringify("Successfully scheduled event!"));
  }
  // Otherwise the data is invalid
  else
  {
    res.writeHead(400, { "Content-Type" : "text/html"} );
    res.write(JSON.stringify("Failed to schedule event! Invalid creation data!"));
  }

  res.end();
}

/** Get the current events listing and add close the response */
exports.getCurrentEvents = function(res)
{
  res.writeHead(200, { "Content-Type" : "text/html"} );
  res.write(JSON.stringify(allEvents));
  res.end();
}
