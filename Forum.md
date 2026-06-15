# Forum — Windows XP Edition
A web forum themed as a Windows XP desktop, built with Express, EJS, SQLite, and TypeScript.

## Run with Docker
docker-compose up --build (it takes a bit for better-sql to build so don't worry if no error messages appear)
Then visit [http://localhost:25034]

## Run without Docker
npm install
npx tsc
node dist/server.js

Then visit [http://localhost:25034]

## Categories
Four default categories: General, Campus Life, News, Competitive.
Needs to be updated to your liking or create a new way to deploy categories

## Remarks
You'll need to change the database typescript file to be persistent throughout dockerization since right now any db gets wiped during the process.