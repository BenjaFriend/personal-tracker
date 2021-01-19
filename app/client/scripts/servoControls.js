"use strict";

(function() 
{
  var lastRemoveButtonClicked = undefined;
  window.addEventListener("load",function()
  {
      init();
  }, 
  false);

  /** Initalize the submit buttons and get the current hsitory */
  function init()
  {
    // Add a listener for scheudling
    document.querySelector("#scheduleEvent").addEventListener("submit", scheduleEvent);

    getScheduledEvents();
  }

  /** Given the selected element, find the option that is selected */
  function getSelectedOption(sel) 
  {
    var opt;
    for ( var i = 0, len = sel.options.length; i < len; i++ ) 
    {
      opt = sel.options[i];
      if ( opt.selected === true ) 
      {
        break;
      }
    }
    return opt;
  }

  /** Schedule a time to open the feeder on the server */
  function scheduleEvent(e) 
  {
    e.preventDefault();

    var action = document.querySelector("#scheduleEvent").getAttribute("action");
    var doorNum = document.getElementById("doorNumSelect");
    var d = getSelectedOption(doorNum).value;
    action += '?door=' + d;
    
    var hours = document.querySelector("#eventHour").value;
    var date  = document.querySelector("#eventDate").value;

    var doorSetting = document.getElementById("doorSetting");
    var setting = getSelectedOption(doorSetting).value;

    // Encode the values and create the URL
    hours = encodeURIComponent(hours);
    date = encodeURIComponent(date);
    setting = encodeURIComponent(setting);

    var url = action + "&date=" + date + "&hours=" + hours + "&setting=" + setting;
    console.log(action);
    console.log(url);

    var xhr = new XMLHttpRequest();

    xhr.onload = function()
    {
      // Tell the user that their request has been recieved
      var responseJSON = JSON.parse( xhr.responseText );
      console.dir(responseJSON);
      getScheduledEvents();
    };

    // Send the request to the server
    xhr.open('GET', url);
    xhr.send();

    return false;
  }

  /** Make a request to the server to get the currently scheduled events */
  function getScheduledEvents()
  {
    // Get and reset the events div
    var eventsDiv = document.querySelector("#scheduledEvents");
    eventsDiv.innerHTML = "";

    var xhr = new XMLHttpRequest();

    var url = "/getEvents";

    xhr.onload = function()
    {
      // Tell the user that their request has been recieved
      var responseJSON = JSON.parse( xhr.responseText )
      console.dir(responseJSON);

      // If there are no scheudled events, then exit
      if(responseJSON.length == 0)
      {
        var p = document.createElement("p");
        var node = document.createTextNode("No feedings currently are scheduled.");
        p.appendChild(node);
        fadeIn(p);
        eventsDiv.appendChild(p)
        return;
      }

      // Add a P tag for each item in the history
      for(var i = responseJSON.length - 1; i >= 0; i--) 
      {
        var eventData = responseJSON[i];
        var div = document.createElement("div");
        div.id = "event";
        addParToDiv(div, "Date: " + eventData.date);
        addParToDiv(div, "Hour: " + eventData.hour);
        addParToDiv(div, "Door: " + eventData.doorNum);
        addParToDiv(div, "Setting: " + eventData.setting);
        addRemoveButton(div, eventData.UID);

        fadeIn(div);
        eventsDiv.appendChild(div);
      }
    };

    // Send the request to the server
    xhr.open('GET', url);
    xhr.send();
  }

  /** Add a par tag to a div with the given text */
  function addParToDiv(div, text)
  {
    var p = document.createElement("p");        
    var node = document.createTextNode(text);
    p.appendChild(node);
    div.appendChild(p);
  }

  /** Add a removal button to this div that will remove the given UID */
  function addRemoveButton(div, UID)
  {
    var form = document.createElement("form");
    form.id = "removeEvent";
    form.action = "/removeEvent";
    form.method = "post";
    // Stop the UID of this event so we can remove it later if needed
    form.dataset.uid = UID;
    form.addEventListener("submit", removeEvent);
    form.onclick = removeClicked;

    var button = document.createElement("input");
    button.id = "longSubmitButton"
    button.type = "submit";
    button.value = "Remove Feeding";
    button.title = "Remove a feeding with the given ID";

    form.appendChild(button);
    div.appendChild(form);
  }

  /** Keep track of which button has been clicked for the removeable options */
  function removeClicked(e)
  {
    lastRemoveButtonClicked = this;
  }

  /** Remove an item when the remove feeding button is clicked */
  function removeEvent(e)
  {
    e.preventDefault();

    if(lastRemoveButtonClicked.dataset.uid)
    {
      // send the XHR with this ID
      var xhr = new XMLHttpRequest();

      var url = "/removeEvent?removeID=" + lastRemoveButtonClicked.dataset.uid;

      xhr.onload = function()
      {
        // refresh the events that are available
        getScheduledEvents();
      };

      // Send the request to the server
      xhr.open('GET', url);
      xhr.send();
    }

    return false;
  }

  /** Fade an elemnt in slowly */
  function fadeIn(el) 
  {
    el.style.opacity = 0;

    var last = +new Date();
    var tick = function() 
    {
      el.style.opacity = +el.style.opacity + (new Date() - last) / 400;
      last = +new Date();

      if (+el.style.opacity < 1) 
      {
        (window.requestAnimationFrame && requestAnimationFrame(tick)) || setTimeout(tick, 16);
      }
    };

    tick();
  }

}()); // End IFFY