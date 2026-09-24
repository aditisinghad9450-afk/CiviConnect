process.env.ADMIN_KEY = "test-admin-key";

const request = require("supertest");
const app = require("../app");
const Grievance = require("../models/Grievance");

jest.mock("../models/Grievance");
afterEach(() => jest.clearAllMocks());

describe("Admin routes reject requests without the key", () => {
  test("GET /api/grievances returns 401 with no key", async () => {
    const res = await request(app).get("/api/grievances");
    expect(res.statusCode).toBe(401);
    expect(Grievance.find).not.toHaveBeenCalled();
  });

  test("GET /api/grievances returns 401 with a wrong key", async () => {
    const res = await request(app).get("/api/grievances").set("x-admin-key", "guessing");
    expect(res.statusCode).toBe(401);
    expect(Grievance.find).not.toHaveBeenCalled();
  });

  test("GET /api/grievances/:id returns 401 with no key", async () => {
    const res = await request(app).get("/api/grievances/64f0000000000000000000aa");
    expect(res.statusCode).toBe(401);
    expect(Grievance.findById).not.toHaveBeenCalled();
  });

  test("PATCH status returns 401 with no key", async () => {
    const res = await request(app)
      .patch("/api/grievances/64f0000000000000000000aa/status")
      .send({ status: "Resolved" });
    expect(res.statusCode).toBe(401);
    expect(Grievance.findById).not.toHaveBeenCalled();
  });
});

describe("Public routes stay open", () => {
  test("POST /api/grievances needs no key", async () => {
    Grievance.create.mockResolvedValue({ _id: "x", trackingId: "CC-2026-ABCDEFGH" });
    const res = await request(app)
      .post("/api/grievances")
      .send({ grievanceText: "Broken streetlight on the corner" });
    expect(res.statusCode).toBe(201);
  });

  test("GET /track/:trackingId needs no key", async () => {
    Grievance.findOne.mockResolvedValue(null);
    const res = await request(app).get("/api/grievances/track/CC-2026-ABCDEFGH");
    expect(res.statusCode).toBe(404);
  });

  test("GET /health needs no key", async () => {
    const res = await request(app).get("/health");
    expect(res.statusCode).toBe(200);
  });
});

describe("Admin routes accept the correct key", () => {
  test("GET /api/grievances succeeds with the key", async () => {
    Grievance.find.mockReturnValue({ sort: jest.fn().mockResolvedValue([]) });
    const res = await request(app).get("/api/grievances").set("x-admin-key", "test-admin-key");
    expect(res.statusCode).toBe(200);
  });
});

describe("Fails closed when no key is configured", () => {
  test("returns 503 rather than allowing everyone through", async () => {
    const saved = process.env.ADMIN_KEY;
    delete process.env.ADMIN_KEY;
    const res = await request(app).get("/api/grievances");
    expect(res.statusCode).toBe(503);
    expect(Grievance.find).not.toHaveBeenCalled();
    process.env.ADMIN_KEY = saved;
  });
});