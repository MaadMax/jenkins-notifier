(function () {

  var jenkinsTab = null;
  var interval = null;
  var started = false;

  function findJenkins (callback) {
    chrome.tabs.query({active: false, currentWindow: true}, function(tabs){
      for (var i = 0; i < tabs.length; i++) {
        if (tabs[i].url.indexOf('forge.raccourci.dev') > -1) {
          var jenkins = tabs[i];
        }
      }
      callback(jenkins);
    });
  }

  function notifyMe () {
    if (!Notification) {
      alert('Desktop notifications not available in your browser. Try Chromium.');
      return;
    }

    if (Notification.permission !== "granted")
      Notification.requestPermission();
    else {
      var notification = new Notification('Job Ended !', {
        icon: 'icon.png',
        body: "Jenkins " + jenkinsTab.url.split('/')[4].replace(/%20/g, " ") + " finished successfuly!",
      });

      notification.onclick = function () {
        window.open(jenkinsTab.url);
      };
    }
  }

  chrome.runtime.onMessage.addListener(function(request, sender) {
    if (request.action == "getSource") {
      message.innerText = request.source;
      var foundin = $('*:contains("Finished: SUCCESS")');
      if (foundin.length > 0) {
        stopProcessing();
        $('.loader').hide();
        $('.tick').show();
        $('.statusmessage').innerText = jenkinsTab.url.split('/')[4].replace(/%20/g, " ") + " finished successfuly!";
        disableBrowserAction();
        notifyMe();
      }
      else {
        console.log('Job not finished yet.');
      }
    }
  });

  function onWindowLoad (tabId) {
    var message = document.querySelector('#message');
    chrome.tabs.executeScript(tabId, {
      file: "getPagesSource.js"
    }, function() {
      if (chrome.runtime.lastError) {
        message.innerText = 'There was an error injecting script : \n' + chrome.runtime.lastError.message;
      }
    });
  }

  function processing () {
    interval = setInterval(function () {
      $('.tick').hide();

      if (Notification.permission !== "granted") {
        Notification.requestPermission();
      }

      findJenkins(function(jenkins) {
        jenkinsTab = jenkins;
        onWindowLoad(jenkins.id);
      });
    }, 5000);
  }

  function stopProcessing () {
    clearInterval(interval);
  }

  function disableBrowserAction(){
    chrome.browserAction.setBadgeBackgroundColor({color:[204, 0, 0, 230]});
    chrome.browserAction.setBadgeText({text:"OFF"});
    stopProcessing();
  }

  function enableBrowserAction(){
    chrome.browserAction.setBadgeBackgroundColor({color:[102, 204, 0, 230]});
    chrome.browserAction.setBadgeText({text:"ON"});
    processing();
  }

  function updateState(){
    if(started === false){
      started = true;
      enableBrowserAction();
    }
    else{
      started = false;
      disableBrowserAction();
    }
  }
  chrome.browserAction.onClicked.addListener(updateState);

  document.addEventListener('DOMContentLoaded', function() {
    if (started === true) {
      processing();
    }
  });
})();