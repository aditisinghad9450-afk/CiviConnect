const request = require("supertest");
const app = require("../app");
const Grievance = require("../models/Grievance");

jest.mock("../models/Grievance");

afterEach(() => jest.clearAllMocks());

describe("GET /health", () => {
  test("returns ok through the real Express app", async () => {
    const res = await request(app).get("/health");
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});

describe("POST /api/grievances (HTTP layer)", () => {
  test("full request/response cycle for a valid grievance", async () => {
    const fakeSaved = {
      _id: "64f0000000000000000000aa",
      grievanceText: "No water supply for 4 days",
      status: "Submitted",
    };
    Grievance.create.mockResolvedValue(fakeSaved);

    const res = await request(app)
      .post("/api/grievances")
      .send({ grievanceText: "No water supply for 4 days" })
      .set("Content-Type", "application/json");

    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual(fakeSaved);
    expect(Grievance.create).toHaveBeenCalledTimes(1);
  });

  test("returns JSON 400 error for missing grievanceText, without touching the model", async () => {
    const res = await request(app).post("/api/grievances").send({});

    expect(res.statusCode).toBe(400);
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(Grievance.create).not.toHaveBeenCalled();
  });
});

describe("GET /api/grievances/:id (HTTP layer)", () => {
  test("returns 404 with JSON error body when not found", async () => {
    Grievance.findById.mockResolvedValue(null);

    const res = await request(app).get("/api/grievances/64f0000000000000000000aa");

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("error");
  });
});

describe("Unknown routes", () => {
  test("returns 404 for a route that doesn't exist", async () => {
    const res = await request(app).get("/api/not-a-real-route");
    expect(res.statusCode).toBe(404);
  });
});

describe("CORS", () => {
  test("sets Access-Control-Allow-Origin header", async () => {
    const res = await request(app).get("/health");
    expect(res.headers["access-control-allow-origin"]).toBe("*");
  });
});
