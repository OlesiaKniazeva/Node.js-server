Node.js server task, written as part of course from yandex summer school open lectorium

We have our Film Search service.

Unfortunately, the service recently broke down, and there's no code left. All we have is you, a weak server, and a backup of the service's database in a `.txt` format.

We expect you to write a Node.js server that can distribute information about movies and static files.

Your tasks are:

- Upon starting your server, read the environment variables `PORT` and `BACKUP_FILE_PATH`
- Respond to the endpoint `/ping`
- Echo back any message sent to the endpoint  `POST /echo`
- Return a 404 response for requests to non-existent paths
- Read the backup database file. The file is located at `BACKUP_FILE_PATH` and could be quite large. Ensure the server does not crash while reading it
  
Each line of this file is a serialized JSON string containing information about a movie in the format:

    
        interface IBackupFileRow {
          id: string;
          title: string;
          description: string;
          genre: string;
          img: string; // строка с постером фильма в base64
          release_year: number;
          screenshots: string[];
          actors: string[], // id актеров
          averange_rate: string; // Средняя оценка
          total_rates_from_user: string; // Сколько всего пользователей оценили этот фильм
        }

- Provide movie cards in JSON format when requested at `/api/v1/movie/<movie_id>`.


Response format:


        interface IFilmCard {
           id: string;
           title: string;
           description: string;
           genre: string;
           release_year: number;
        }

- Return an array of movie cards for a search query at `/api/v1/search` with search parameters `title` (string to search movie titles) and `page` (pagination page number)

The search should be case insensitive and accept partial movie titles. Assume the frontend will have an input field where users enter search queries, with debouncing to send requests to the backend and show dropdown suggestions to the user.

Search results should be paginated with 10 cards per page. Pagination page is passed as an optional parameter `page`.

Response to a search query should be in the format:

    interface ISearchResponse {
        search_result: IFilmCard[]
    }

- Parse and store movie poster images into the service's file system in the `./images` folder. Each image should be named `<movie_id>.jpeg`, for example, `12345.jpeg`
- Serve images via `GET /static/images/<movie_id>.jpeg`.
