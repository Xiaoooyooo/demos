import http from "http";
import fs from "fs";
import path from "path";
import url from "url";
import { Socket } from "net";
import crypto from "crypto";

const PORT = 8080;
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

/** @type {Map<string, Socket>} */
const sseClients = new Map();
/** get number by clientId */
const clientPhoneMap = new Map();
/** get clientId by number */
const phoneClientMap = new Map();
/** @type {Map<string, { from: number, to: number }>} */
const sessions = new Map();

const server = http.createServer(async (req, res) => {
  const { method, url } = req;
  if (method === "GET") {
    const file = await tryGetFileStream(url);
    if (file) {
      res.writeHead(200, {
        "content-type": file.mimeType,
      });
      return file.stream.pipe(res);
    }

    if (url === "/sse") {
      res.writeHead(200, {
        "content-type": "text/event-stream",
      });
      const id = crypto.randomUUID();
      const socket = res;
      sseClients.set(id, socket);
      res.on("close", () => {
        console.log("client disconnect");
        sseClients.delete(id);
      });
      res.write(
        JSON.stringify({
          type: "connect",
          data: { id },
        }) + "\n"
      );
      return;
    }
  }

  if (method === "POST" && /^\/message/.test(url)) {
    const clientId = new URLSearchParams(url.replace(/^\/[^?]+/, "")).get(
      "clientId"
    );
    const body = await getBody(req);
    const client = sseClients.get(clientId);
    if (!client) {
      res.writeHead(422);
      return res.end(`client "${clientId}" is not exist.`);
    }
    const { type, data } = body;
    let response;
    switch (type) {
      case "signin":
        if (phoneClientMap.has(data.number)) {
          response = {
            type: "signinResult",
            data: { success: false, message: "the number has been used." },
          };
        } else {
          // we can get number by clientId
          clientPhoneMap.set(clientId, data.number);
          // or get clientId by number
          phoneClientMap.set(data.number, clientId);
          response = {
            type: "signinResult",
            data: { success: true, number: data.number },
          };
        }
        break;
      case "call":
        if (!phoneClientMap.has(data.number)) {
          response = {
            type: "callResult",
            data: { success: false, message: "invalid phone number." },
          };
        } else {
          const sessionId = crypto.randomUUID();
          const from = clientPhoneMap.get(clientId);
          const to = data.number;
          sessions.set(sessionId, { from, to });
          writeClientMessage(phoneClientMap.get(to), {
            type: "onCall",
            data: { sessionId, from },
          });
          response = { type: "session", data: { sessionId } };
        }
        break;
      case "onCallAction": {
        const session = getNumbersFromSession(req);
        if (data.accept) {
          writeClientMessage(phoneClientMap.get(session.from), {
            type: "callResult",
            data: { success: true },
          });
        } else {
          writeClientMessage(phoneClientMap.get(session.from), {
            type: "callResult",
            data: { success: false },
          });
        }
        break;
      }
      case "offer": {
        const session = getNumbersFromSession(req);
        writeClientMessage(phoneClientMap.get(session.to), {
          type: "remoteOffer",
          data: { offer: data.offer },
        });
        break;
      }
      case "answer": {
        const session = getNumbersFromSession(req);
        writeClientMessage(phoneClientMap.get(session.from), {
          type: "remoteAnswer",
          data: { answer: data.answer },
        });
        break;
      }
      case "candidate": {
        const session = getNumbersFromSession(req);
        writeClientMessage(phoneClientMap.get(session.to), {
          type: "remoteCandidate",
          data: { candidate: data.candidate },
        });
        break;
      }
      default:
        response = {
          type: "error",
          data: `unknown event type: ${type}`,
        };
    }
    response && writeClientMessage(clientId, response);
    res.writeHead(204);
    return res.end();
  }

  res.statusCode = 404;
  res.end("not found");
});

server.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});

/**
 * @param {string} clientId
 * @param {any} response
 * @returns
 */
function writeClientMessage(clientId, response) {
  const client = sseClients.get(clientId);
  if (!client) {
    console.error(`client "${clientId}" not exists.`);
    return;
  }
  client.write(JSON.stringify(response) + "\n");
}

/**
 * @param {string} url
 * @returns {Promise<{mimeType: string; stream: fs.ReadStream} | null>}
 */
function tryGetFileStream(url) {
  return new Promise(async (resolve) => {
    const maybeFilePath = url.replace(/^\//, "").replace(/\?.+$/, "");
    let fullPath = path.resolve(__dirname, maybeFilePath);
    try {
      let stats = await getFileStats(fullPath);
      if (stats && stats.isDirectory()) {
        fullPath = path.resolve(fullPath, "index.html");
        stats = await getFileStats(fullPath);
      }
      if (stats && stats.isFile()) {
        return resolve({
          mimeType: getMimeType(fullPath),
          stream: fs.createReadStream(fullPath),
        });
      }
      resolve(null);
    } catch (error) {
      console.log(error);
      resolve(null);
    }
  });
}

/**
 * @param {string} path
 * @returns {Promise<fs.Stats | null>}
 */
function getFileStats(path) {
  // console.log("[try file]:", path);
  return new Promise((resolve) => {
    fs.stat(path, (error, stats) => {
      if (error) {
        console.log(error);
        return resolve(null);
      }
      resolve(stats);
    });
  });
}

/**
 * @param {string} filename
 */
function getMimeType(filename) {
  const extMatch = filename.match(/\.\w+$/);
  if (!extMatch) {
    return "";
  }
  switch (extMatch[0]) {
    case ".js":
      return "aplication/javascript";
    case ".css":
      return "text/css";
    case ".htm":
    case ".html":
      return "text/html";
    default:
      return "";
  }
}

/** @param {http.IncomingMessage} req  */
async function getBody(req) {
  return new Promise((resolve, reject) => {
    const data = [];
    req.on("data", (chunk) => {
      data.push(...chunk);
    });
    req.on("end", () => {
      resolve(JSON.parse(Buffer.from(data).toString("utf8")));
    });
    req.on("error", reject);
  });
}

/**
 * @param {http.IncomingMessage} req
 * @returns {ReturnType<typeof sessions.get> & {}}
 */
function getNumbersFromSession(req) {
  const sessionId = new URLSearchParams(req.url.replace(/^\/[^?]+/, "")).get(
    "sessionId"
  );
  if (!sessionId) {
    throw "no sessionId provided.";
  }
  return sessions.get(sessionId);
}
