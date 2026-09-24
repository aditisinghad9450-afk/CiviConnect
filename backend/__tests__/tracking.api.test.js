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
afterEach(async () => { await Grievance.deleteMany({}); });
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("Tracking ID assignment", () => {
  test("a new grievance gets a tracking ID automatically", async () => {
    const res = await request(app).post("/api/grievances").send({ grievanceText: "Streetlight has been out for a week" });
    expect(res.statusCode).toBe(201);
    expect(res.body.trackingId).toMatch(/^CC-\d{4}-[A-Z2-9]{8}$/);
  });

  test("two grievances get different tracking IDs", async () => {
    const a = await request(app).post("/api/grievances").send({ grievanceText: "Pothole on main road" });
    const b = await request(app).post("/api/grievances").send({ grievanceText: "Garbage not collected" });
    expect(a.body.trackingId).not.toBe(b.body.trackingId);
  });

  test("a client cannot set its own tracking ID", async () => {
    const res = await request(app).post("/api/grievances")
      .send({ grievanceText: "Water supply disrupted", trackingId: "CC-2026-HACKHACK" });
    expect(res.statusCode).toBe(201);
    expect(res.body.trackingId).not.toBe("CC-2026-HACKHACK");
  });

  test("a new grievance starts with a one-entry timeline", async () => {
    const res = await request(app).post("/api/grievances").send({ grievanceText: "Broken drainage cover near school" });
    expect(res.body.timeline).toHaveLength(1);
    expect(res.body.timeline[0].status).toBe("Submitted");
  });
});

describe("GET /api/grievances/track/:trackingId", () => {
  test("returns the grievance for a valid tracking ID", async () => {
    const created = await request(app).post("/api/grievances")
      .send({ grievanceText: "No water supply for three days", category: "WATER", urgency: "High" });
    const res = await request(app).get(`/api/grievances/track/${created.body.trackingId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.trackingId).toBe(created.body.trackingId);
    expect(res.body.status).toBe("Submitted");
  });

  test("lookup is case-insensitive and tolerates whitespace", async () => {
    const created = await request(app).post("/api/grievances").send({ grievanceText: "Sewage overflow in the lane" });
    const lower = created.body.trackingId.toLowerCase();
    const res = await request(app).get(`/api/grievances/track/${encodeURIComponent("  " + lower + "  ")}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.trackingId).toBe(created.body.trackingId);
  });

  test("does NOT expose demographics or internal id", async () => {
    const created = await request(app).post("/api/grievances")
      .send({ grievanceText: "Street dogs menace near park", gender: "female", age: 34 });
    const res = await request(app).get(`/api/grievances/track/${created.body.trackingId}`);
    expect(res.body).not.toHaveProperty("gender");
    expect(res.body).not.toHaveProperty("age");
    expect(res.body).not.toHaveProperty("_id");
  });

  test("returns 400 for a malformed tracking ID", async () => {
    const res = await request(app).get("/api/grievances/track/not-a-tracking-id");
    expect(res.statusCode).toBe(400);
  });

  test("returns 404 for a well-formed but unknown tracking ID", async () => {
    const res = await request(app).get("/api/grievances/track/CC-2026-ZZZZZZZZ");
    expect(res.statusCode).toBe(404);
  });
});

describe("Status timeline", () => {
  test("updating status appends a timeline entry", async () => {
    const created = await request(app).post("/api/grievances").send({ grievanceText: "Park lights not working at night" });
    const updated = await request(app).patch(`/api/grievances/${created.body._id}/status`).set("x-admin-key","test-admin-key")
      .send({ status: "In Progress", note: "Assigned to electrical department" });
    expect(updated.statusCode).toBe(200);
    expect(updated.body.timeline).toHaveLength(2);
    expect(updated.body.timeline[1].note).toBe("Assigned to electrical department");
  });

  test("full history is visible through the tracking endpoint", async () => {
    const created = await request(app).post("/api/grievances").send({ grievanceText: "Overflowing bin outside market" });
    await request(app).patch(`/api/grievances/${created.body._id}/status`).set("x-admin-key","test-admin-key").send({ status: "In Progress" });
    await request(app).patch(`/api/grievances/${created.body._id}/status`).set("x-admin-key","test-admin-key").send({ status: "Resolved", note: "Bin cleared" });

    const res = await request(app).get(`/api/grievances/track/${created.body.trackingId}`);
    expect(res.body.status).toBe("Resolved");
    expect(res.body.timeline.map((e) => e.status)).toEqual(["Submitted", "In Progress", "Resolved"]);
  });

  test("an invalid status leaves the timeline untouched", async () => {
    const created = await request(app).post("/api/grievances").send({ grievanceText: "Illegal parking blocking the lane" });
    const bad = await request(app).patch(`/api/grievances/${created.body._id}/status`).set("x-admin-key","test-admin-key").send({ status: "Closed" });
    expect(bad.statusCode).toBe(400);
    const after = await request(app).get(`/api/grievances/track/${created.body.trackingId}`);
    expect(after.body.timeline).toHaveLength(1);
  });
});