// const worker = new Worker("/worker.js");

// worker.postMessage("hello");

// worker.addEventListener("message", function (e) {
//   console.log("window receive message: ", e.data);
// });

const sharedWorker = new SharedWorker("/shared-worker.js");

sharedWorker.port.postMessage("hello");

// sharedWorker.port.addEventListener("message", function (e) {
//   console.log(e.data);
// });
// sharedWorker.port.start();

sharedWorker.port.onmessage = (e) => {
  console.log(e.data);
};
