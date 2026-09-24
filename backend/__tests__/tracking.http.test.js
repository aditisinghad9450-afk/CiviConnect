const request = require("supertest");
const app = require("../app");
const Grievance = require("../models/Grievance");

jest.mock("../models/Grievance");
afterEach(() => jest.clearAllMocks());

describe("GET /api/grievances/track/:trackingId (HTTP layer)", () => {
  test("route is NOT shadowed by /:id", async () => {
    Grievance.findOne.mockResolvedValue(null);
    const res = await request(app).get("/api/grievances/track/CC-2026-ABCDEFGH");
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toMatch(/tracking ID/i);
    expect(Grievance.findOne).toHaveBeenCalledWith({ trackingId: "CC-2026-ABCDEFGH" });
    expect(Grievance.findById).not.toHaveBeenCalled();
  });

  test("normalizes lowercase input before querying", async () => {
    Grievance.findOne.mockResolvedValue(null);
    await request(app).get("/api/grievances/track/cc-2026-abcdefgh");
    expect(Grievance.findOne).toHaveBeenCalledWith({ trackingId: "CC-2026-ABCDEFGH" });
  });

  test("rejects a malformed ID without querying the database", async () => {
    const res = await request(app).get("/api/grievances/track/hello");
    expect(res.statusCode).toBe(400);
    expect(Grievance.findOne).not.toHaveBeenCalled();
  });

  test("rejects an ID containing ambiguous characters", async () => {
    const res = await request(app).get("/api/grievances/track/CC-2026-ABCDEF01");
    expect(res.statusCode).toBe(400);
    expect(Grievance.findOne).not.toHaveBeenCalled();
  });

  test("returns the public view when found", async () => {
    const publicView = {
      trackingId: "CC-2026-ABCDEFGH",
      grievanceText: "Water leak on the main road",
      status: "In Progress",
      timeline: [{ status: "Submitted" }, { status: "In Progress" }],
    };
    Grievance.findOne.mockResolvedValue({ toPublicJSON: () => publicView });
    const res = await request(app).get("/api/grievances/track/CC-2026-ABCDEFGH");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(publicView);
  });

  test("still routes /:id correctly for ordinary ObjectIds", async () => {
    Grievance.findById.mockResolvedValue(null);
    const res = await request(app).get("/api/grievances/64f0000000000000000000aa").set("x-admin-key","test-admin-key");
    expect(res.statusCode).toBe(404);
    expect(Grievance.findById).toHaveBeenCalled();
    expect(Grievance.findOne).not.toHaveBeenCalled();
  });
});