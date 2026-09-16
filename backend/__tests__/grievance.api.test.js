const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../app");
const Grievance = require("../models/Grievance");

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterEach(async () => {
  await Grievance.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("GET /health", () => {
  test("returns ok", async () => {
    const res = await request(app).get("/health");
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});

describe("POST /api/grievances", () => {
  test("creates a grievance with valid data", async () => {
    const payload = {
      language: "en",
      gender: "female",
      age: 34,
      state: "Tamil Nadu",
      grievanceText: "No water supply in our street for the last 4 days",
      category: "WATER",
      urgency: "High",
      populationAffected: "Local Area",
    };

    const res = await request(app).post("/api/grievances").send(payload);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("_id");
    expect(res.body.grievanceText).toBe(payload.grievanceText);
    expect(res.body.status).toBe("Submitted");
  });

  test("rejects a grievance with missing grievanceText", async () => {
    const res = await request(app).post("/api/grievances").send({ state: "Kerala" });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  test("rejects a grievance with text shorter than 5 characters", async () => {
    const res = await request(app).post("/api/grievances").send({ grievanceText: "hi" });
    expect(res.statusCode).toBe(400);
  });
});

describe("GET /api/grievances", () => {
  test("returns an empty array when none exist", async () => {
    const res = await request(app).get("/api/grievances");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);
  });

  test("returns created grievances, most recent first", async () => {
    await Grievance.create({ grievanceText: "First complaint about roads" });
    await Grievance.create({ grievanceText: "Second complaint about electricity" });

    const res = await request(app).get("/api/grievances");

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].grievanceText).toBe("Second complaint about electricity");
  });

  test("filters by status", async () => {
    await Grievance.create({ grievanceText: "Complaint one", status: "Submitted" });
    await Grievance.create({ grievanceText: "Complaint two", status: "Resolved" });

    const res = await request(app).get("/api/grievances?status=Resolved");

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].grievanceText).toBe("Complaint two");
  });
});

describe("GET /api/grievances/:id", () => {
  test("returns 404 for a well-formed but non-existent id", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/api/grievances/${fakeId}`);
    expect(res.statusCode).toBe(404);
  });

  test("returns 400 for a malformed id", async () => {
    const res = await request(app).get("/api/grievances/not-a-valid-id");
    expect(res.statusCode).toBe(400);
  });

  test("returns the grievance when it exists", async () => {
    const created = await Grievance.create({ grievanceText: "Pension delayed by 2 months" });
    const res = await request(app).get(`/api/grievances/${created._id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.grievanceText).toBe("Pension delayed by 2 months");
  });
});

describe("PATCH /api/grievances/:id/status", () => {
  test("updates status to a valid value", async () => {
    const created = await Grievance.create({ grievanceText: "Streetlight broken near school" });

    const res = await request(app)
      .patch(`/api/grievances/${created._id}/status`)
      .send({ status: "In Progress" });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("In Progress");
  });

  test("rejects an invalid status value", async () => {
    const created = await Grievance.create({ grievanceText: "Garbage not collected" });

    const res = await request(app)
      .patch(`/api/grievances/${created._id}/status`)
      .send({ status: "Closed" });

    expect(res.statusCode).toBe(400);
  });

  test("returns 404 when updating a non-existent grievance", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .patch(`/api/grievances/${fakeId}/status`)
      .send({ status: "Resolved" });

    expect(res.statusCode).toBe(404);
  });
});
