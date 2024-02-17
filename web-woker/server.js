import http from "http";
import fs from "fs";

http
  .createServer((req, res) => {
    const { method, url } = req;
    console.log(method, url);
    if (method === "GET") {
      if (url === "/") {
        res.writeHead(200, {
          "content-type": "text/html",
        });
        return fs.createReadStream("./index.html").pipe(res);
      }
      if (/\.js$/.test(url)) {
        res.setHeader("content-type", "application/javascript");
      }
      if (url === "/index.js") {
        return fs.createReadStream("./index.js").pipe(res);
      }
      if (url === "/worker.js") {
        return fs.createReadStream("./worker.js").pipe(res);
      }
      if (url === "/shared-worker.js") {
        return fs.createReadStream("./shared-worker.js").pipe(res);
      }
      if (url === "/utils.js") {
        return fs.createReadStream("./utils.js").pipe(res);
      }
    }
    res.statusCode = 404;
    res.end("not found");
  })
  .listen(8888, () => {
    console.log("http://127.0.0.1:8888");
  });
