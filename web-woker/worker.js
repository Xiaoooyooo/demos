// Global scope can only be obtained through `self`
console.log(self);

// use importScripts to import third party scripts
importScripts("/utils.js");

console.log(add(1, 2));

addEventListener("message", function (e) {
  console.log("worker receive message: ", e.data);
  setTimeout(() => {
    postMessage("world");
  }, 1000);
});
