(function () {

  var jenkinsTab = null;
  var interval = null;

  function findJenkins (callback) {
    chrome.tabs.query({active: false, currentWindow: true}, function(tabs){
      for (var i = 0; i < tabs.length; i++) {
        console.log(tabs[i]);
        if (tabs[i].url.indexOf('forge.raccourci.dev') > -1) {
          var jenkins = tabs[i];
        }
      }
      callback(jenkins);
    });
  }

  function notifyMe() {
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
      var foundin = $('*:contains("Finished: ssssSUCCESS")');
      console.log('FOUND', foundin);
      if (foundin.length > 0) {
        clearInterval(interval);
        notifyMe();
      }
      else {
        console.log('Job not finished yet.');
      }
    }
  });

  function onWindowLoad(tabId) {
    var message = document.querySelector('#message');
    chrome.tabs.executeScript(tabId, {
      file: "getPagesSource.js"
    }, function() {
      if (chrome.runtime.lastError) {
        message.innerText = 'There was an error injecting script : \n' + chrome.runtime.lastError.message;
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function() {

    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    findJenkins(function(jenkins) {
      jenkinsTab = jenkins;
      interval = setInterval(onWindowLoad(jenkins.id), 10000);
    });

  });
})();