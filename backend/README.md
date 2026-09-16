# CivicConnect Backend

A real Express + MongoDB API for storing and tracking citizen grievances submitted through the CivicConnect frontend.

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Copy `.env.example` to `.env` and set your MongoDB connection string:
   ```
   cp .env.example .env
   ```
   - For local MongoDB: install MongoDB Community Server, then leave the default
     `mongodb://127.0.0.1:27017/civicconnect` as is.
   - For a hosted option (no local install needed): create a free cluster at
     MongoDB Atlas and paste its connection string into `MONGO_URI`.

3. Start the server:
   ```
   npm start
   ```
   You should see `CivicConnect backend running on port 5000`.

## API Endpoints

| Method | Route                          | Description                        |
|--------|--------------------------------|-------------------------------------|
| GET    | /health                        | Health check                        |
| POST   | /api/grievances                | Submit a new grievance              |
| GET    | /api/grievances                | List grievances (filter by ?status=, ?category=) |
| GET    | /api/grievances/:id            | Get a single grievance by id        |
| PATCH  | /api/grievances/:id/status     | Update a grievance's status         |

## Running Tests

```
npm test
```

This runs two suites:
- `__tests__/grievanceController.unit.test.js` — unit tests on the controller logic with the database mocked (fast, no setup required).
- `__tests__/grievance.http.test.js` — HTTP-layer tests through the real Express app (routing, middleware, JSON handling, status codes) with the database mocked.
- `__tests__/grievance.api.test.js` — full integration tests against a real in-memory MongoDB instance via `mongodb-memory-server`. The first run downloads a MongoDB binary automatically, so it needs an internet connection and may take a minute the first time.

## Connecting the Frontend

The frontend (`frontend/script.js`) calls `http://localhost:5000/api/grievances` after
analyzing a grievance. Run the backend on port 5000 (the default) alongside the frontend
for grievances to actually persist to MongoDB. If the backend isn't running, the frontend's
analysis still works standalone — it just won't save the record.
