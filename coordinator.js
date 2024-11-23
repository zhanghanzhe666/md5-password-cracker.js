var numWorkers = 8; // NOTE: can't set this to be more than 8 without fixing the way numbers are carried
var workers = [];
var startTime = +new Date;

// 获取用户输入的哈希值
var userInputHash = prompt("Please enter the hash to crack:");

// 如果用户输入了哈希值，则进行密码破解
if (userInputHash) {
  var hashToCrack = userInputHash;

  for (var i = 0; i < numWorkers; i++) {

    // Create worker
    var worker = new Worker('worker.js');
    workers.push(worker);

    // Message handler
    worker.addEventListener('message', function (e) {
      switch (e.data.cmd) {
        case "status":
          status(e.data.data, e.data.id);
          break;

        case "log":
          log(e.data.data, e.data.id);
          break;

        case "setRate":
          status(addCommasToInteger(e.data.data) + " passwords/second", e.data.id);
          break;

        case "foundPassword":
          log("FOUND PASSWORD: " + e.data.data);

          var totalTime = (+new Date - startTime) / 1000;
          log("TOTAL TIME: " + totalTime + " seconds");

          workers.forEach(function(worker) {
            worker.terminate();
          });
          log("Terminated all workers.");
          break;

        default:
          log("Main page doesn't understand command " + e.data.cmd);
          break;
      }
    });

    // Error handler
    worker.addEventListener('error', function(e) {
      log(['ERROR: Line ', e.lineno, ' in ', e.filename, ': ', e.message].join(''));
    });

    // Set worker settings
    worker.postMessage({ cmd: "setWorkerId", data: i });
    worker.postMessage({ cmd: "setMaxPassLength", data: 5 });
    worker.postMessage({ cmd: "setPassToCrack", data: hashToCrack });

    // Start worker
    worker.postMessage({ cmd: "performCrack", data: {start: i, hop: numWorkers} });
  }

  status("Searching for password match for hash '" + hashToCrack + "'.");
  log("Testing uppercase, lowercase, and numbers.");

  // Helper functions
  function addCommasToInteger(x) {
    x = parseInt(x) + '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x)) {
      x = x.replace(rgx, '$1' + ',' + '$2');
    }
    return x;
  }

  function status(msg, workerId) {
    var prefix = workerId != null ? "Worker " + workerId + " status: " : "Main page status: ";
    document.querySelector("#mainstatus").textContent = prefix + msg;
  }

  function log(msg, workerId) {
    var prefix = workerId != null ? "Worker " + workerId + " says: " : "Main page says: ";
    var fragment = document.createDocumentFragment();
    fragment.appendChild(document.createTextNode(prefix + msg));
    fragment.appendChild(document.createElement('br'));
    document.querySelector("#mainlog").appendChild(fragment);
  }
}
