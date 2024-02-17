addEventListener("connect", function (event) {
  const port = event.ports[0];
  // port.start();

  // port.addEventListener("message", function (event) {
  //   console.log(event);
  //   port.postMessage("message from shared worker");
  // });

  port.onmessage = function (event) {
    console.log(event);
    port.postMessage("message from shared worker");
  };
});
