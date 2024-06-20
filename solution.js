import fs from "node:fs";
import { createServer } from "node:http";
import { StringDecoder } from "node:string_decoder";

const port = process.env.PORT || 3000;
const hostname =
  process.env.BACKUP_FILE_PATH || "localhost" || "./db_backup.txt";

function pingResponse(res) {
  res.writeHead(200, {
    "Content-Type": "text/plain",
  });
  res.end("Pong!");
}

function sendEcho(req, res) {
  let decoder = new StringDecoder("utf-8");
  let buffer = "";

  req.on("data", (chunk) => {
    buffer += decoder.write(chunk);
  });

  req.on("end", () => {
    buffer += decoder.end();

    const contentType = req.headers["content-type"];
    res.writeHead(200, { "Context-Type": contentType });
    res.end(buffer);
  });
}

const server = createServer(async (req, res) => {
  const method = req.method.toLowerCase();
  const url = req.url.toLowerCase();
  console.log("method: ", method);
  console.log("url: ", url);
  
  

  if (method === "get" && url === "/ping") {
    pingResponse(res);
  } else if (method === "post" && url === "/echo") {
    sendEcho(req, res);
  } else {
    // Respond with 404 Not Found for other endpoints
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  }

  // res.statusCode = 200;
  // res.setHeader("Content-Type", "text/plain");
  // res.end("Hello World");
});

server.listen(port, hostname, () => {
  // console.log(`Server running at http://${hostname}:${port}/`);
  console.log(`Listening on port: ${port}/`);
});
