// import { createServer } from "node:http";
import http from "node:http";
import url from "node:url";
import util from "node:util";
import{ StringDecoder } from 'node:string_decoder'

const hostname = "127.0.0.1";
const port = 3000;

const server = http.createServer((req, res) => {
  let path = url.parse(req.url, true);
  // console.log(path);
  // console.log(url);

  // if (req.url === "/tttt") {
  let decoder = new StringDecoder('utf-8');
  let buffer = '';

  req.on('data', (chunk) => {
    buffer += decoder.write(chunk);
  });
  req.on('end', () => {
    buffer += decoder.end();

    console.log("HOHOHH");
    res.writeHead(200, "Ok", { "Context-Type": "text/plain" });
    res.write("The response\n\n");
    res.write(util.inspect(path.query) + "\n\n");
    res.write(buffer += "\n\n");
    res.end("End of message");
  });



  // }

  // res.writeHead(200, "OK", { "Content-Type": "text/plain" });
  // res.write("The response\n\n");
  // res.end("End of message to Browser");
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
