import { createServer } from "node:http";
import {
  createWriteStream,
  createReadStream,
  existsSync,
  mkdirSync,
} from "node:fs";
import fs from "node:fs/promises";
import { StringDecoder } from "node:string_decoder";
import url from "node:url";
import path from "node:path";
import readline from "node:readline";
import { gzip, gunzip } from "node:zlib";
import { promisify } from "node:util";
import { pipeline } from "node:stream";

const pipe = promisify(pipeline);

const port = process.env.PORT || 3000;
const backupFilePath = process.env.BACKUP_FILE_PATH || "./db_backup.txt";
const IMAGE_FOLDER = "./images/";
const BATCH_SIZE = 1000;

const movies = new Map();

try {
  if (!existsSync(IMAGE_FOLDER)) {
    mkdirSync(IMAGE_FOLDER);
  }
} catch (err) {
  console.error(err);
}

loadBackupFile(backupFilePath)
  .then(() => {
    const server = createServer(requestHandler);
    server.listen(port, (err) => {
      if (err) {
        return console.log("Error with server!");
      }
      console.log(`Server is listening on port: ${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to load backup file:", err);
  });

function requestHandler(req, res) {
  const method = req.method.toLowerCase();
  const parsedURL = url.parse(req.url, true);
  const pathname = parsedURL.pathname;

  if (method === "get" && pathname === "/ping") {
    processPingResponse(res);
  } else if (method === "post" && pathname === "/echo") {
    processEchoResponse(req, res);
  } else if (method === "get" && pathname.startsWith("/api/v1/movie/")) {
    const movieId = pathname.split("/").pop();

    if (!isNumber(movieId) || pathname !== "/api/v1/movie/" + movieId) {
      respondNotFound(res);
    } else {
      processMovieQuery(res, movieId);
    }
  } else if (method === "get" && pathname === "/api/v1/search") {
    const title = (parsedURL.query.title || "").toLowerCase();
    const page = parsedURL.query.page || 1;
    processSearchQuery(res, title, page);
  } else if (method === "get" && pathname.startsWith("/static/images/")) {
    const imageName = pathname.split("/").pop();
    const [id, format] = imageName.split(".");

    if (!isNumber(id) || !(format === "jpeg")) {
      respondNotFound(res);
    } else {
      processImageRequest(res, imageName);
    }
  } else {
    respondNotFound(res);
  }
}

async function processImageRequest(res, imageName) {
  const imagePath = path.join(IMAGE_FOLDER, imageName);
  try {
    const stats = await fs.stat(imagePath);
    if (stats.isFile()) {
      const readStream = createReadStream(imagePath);
      const unzipStream = gunzip();
      res.writeHead(200, { "Content-Type": "image/jpeg" });
      readStream.pipe(unzipStream).pipe(res);
    } else {
      respondNotFound(res);
    }
  } catch (err) {
    console.error("Error reading image:", err);
    respondNotFound(res);
  }
}

function processSearchQuery(res, title, page) {
  const resultsPerPage = 10;
  const startIndex = (page - 1) * resultsPerPage;
  const endIndex = startIndex + resultsPerPage;
  const searchResults = [];

  for (let [id, movie] of movies) {
    if (movie.title.toLowerCase().includes(title)) {
      searchResults.push({
        id: movie.id,
        title: movie.title,
        description: movie.description,
        genre: movie.genre,
        release_year: movie.release_year,
      });
    }
  }

  const paginatedResults = searchResults.slice(startIndex, endIndex);

  const response = { search_result: paginatedResults };

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(response));
}

function processMovieQuery(res, movieId) {
  const movie = movies.get(movieId);

  if (!movie) {
    respondNotFound(res);
    return;
  }

  const filmCard = {
    id: movie.id,
    title: movie.title,
    description: movie.description,
    genre: movie.genre,
    release_year: movie.release_year,
  };

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(filmCard));
}

function isNumber(data) {
  return !isNaN(Number(data));
}

function respondNotFound(res) {
  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not Found");
}

function processPingResponse(res) {
  res.writeHead(200, {
    "Content-Type": "text/plain",
  });
  res.end("Pong!");
}

function processEchoResponse(req, res) {
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

async function saveImage(movieId, imageString) {
  const imagePath = path.join(IMAGE_FOLDER, `${movieId}.jpeg`);
  const buffer = Buffer.from(imageString, "base64");
  try {
    const writeStream = createWriteStream(imagePath);
    const zipStream = gzip();
    zipStream.pipe(writeStream);
    zipStream.end(buffer);
    await new Promise((resolve, reject) => {
      writeStream.on("finish", resolve);
      writeStream.on("error", reject);
    });
  } catch (err) {
    console.error("Error saving image:", err);
  }
}

async function loadBackupFile(backupFilePath) {
  const readStream = createReadStream(backupFilePath, {
    encoding: "utf8",
  });
  const rl = readline.createInterface({ input: readStream });
  let batch = [];

  for await (const line of rl) {
    batch.push(line);

    if (batch.length >= BATCH_SIZE) {
      await processBatch(batch);
      batch = [];
    }
  }

  if (batch.length > 0) {
    await processBatch(batch);
  }
}

async function processBatch(batch) {
  for (const line of batch) {
    try {
      const movie = JSON.parse(line);
      const filmCard = {
        id: movie.id,
        title: movie.title,
        description: movie.description,
        genre: movie.genre,
        release_year: movie.release_year,
        img: movie.img,
      };

      movies.set(movie.id, filmCard);
      await saveImage(movie.id, movie.img);
    } catch (err) {
      console.error("Error parsing movie:", err);
    }
  }
}
