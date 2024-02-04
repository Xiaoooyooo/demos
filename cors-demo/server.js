import http from "http";
import fs from "fs";

const server = http.createServer((req, res) => {
  const { url, method } = req;
  console.log(method, url);
  if (method === "GET" && url === "/") {
    res.writeHead(200, {
      "content-type": "text/html",
      "cache-control": "no-store",
    });
    return fs.createReadStream("./index.html", "utf8").pipe(res);
  }

  if (method === "OPTIONS") {
    if (url === "/delete") {
      res.writeHead(200, {
        "Access-Control-Allow-Methods": "DELETE",
        "Access-Control-Allow-Origin": "http://localhost:8888",
        "Access-Control-Allow-Headers": "x-hello-world",
      });
      return res.end();
    }
    if (url === "/post") {
      res.writeHead(200, {
        // "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Origin": "http://localhost:8888",
        "Access-Control-Allow-Headers": "content-type, x-hello-world",
        "Access-Control-Allow-Credentials": "true",
      });
      return res.end();
    }
  }
  if (method === "GET" && url === "/api") {
    return res.end("OK");
  }
  if (method === "DELETE" && url === "/delete") {
    res.writeHead(200, {
      "Access-Control-Allow-Origin": "http://localhost:8888",
    });
    return res.end("OK");
  }

  if (method === "GET" && url === "/font.ttf") {
    if (!fs.existsSync("./font.ttf")) {
      res.writeHead(404);
      return res.end();
    }
    res.writeHead(200, {
      "content-type": "application/octet-stream",
      // 允许字体跨源使用
      "Access-Control-Allow-Origin": "http://localhost:8888",
    });
    return fs.createReadStream("./font.ttf").pipe(res);
  }

  if (method === "POST" && url === "/post") {
    res.writeHead(200, {
      "Access-Control-Allow-Origin": "http://localhost:8888",
      "Set-Cookie":
        "message=hello world;Path=/post;Max-Age=100;SameSite=None;Secure;",
      "Content-Type": "plain/text",
      "Access-Control-Allow-Credentials": "true",
    });
    const cookie = req.headers.cookie;
    if (cookie) {
      res.write(cookie + "\n");
    }
    return res.end("OK");
  }

  res.statusCode = 404;
  res.end("not found");
});

server.listen("8888", () => {
  console.log("http://localhost:8888");
  console.log("http://127.0.0.1:8888");
});
