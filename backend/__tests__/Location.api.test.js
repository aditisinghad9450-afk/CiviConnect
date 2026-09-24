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

const FULL = {
  grievanceText: "No water supply in our street for four days",
  location: {
    area: "Sholinganallur, 3rd Main Road",
    landmark: "Opposite the bus depot",
    pincode: "600119",
    lat: 12.9010,
    lng: 80.2279,
    accuracyMeters: 18,
  },
  contact: { phone: "+91 95554 27132", email: "Citizen@Example.com" },
};

describe("Location capture", () => {
  test("stores area, landmark, pincode and coordinates", async () => {
    const res = await request(app).post("/api/grievances").send(FULL);

    expect(res.statusCode).toBe(201);
    expect(res.body.location.area).toBe("Sholinganallur, 3rd Main Road");
    expect(res.body.location.pincode).toBe("600119");
    expect(res.body.location.lat).toBeCloseTo(12.9010, 3);
    expect(res.body.location.lng).toBeCloseTo(80.2279, 3);
  });

  test("a grievance with no location is still accepted", async () => {
    const res = await request(app)
      .post("/api/grievances")
      .send({ grievanceText: "Streetlight out near the school" });

    expect(res.statusCode).toBe(201);
    expect(res.body.location).toBeUndefined();
  });

  test("rejects a malformed pincode", async () => {
    const res = await request(app)
      .post("/api/grievances")
      .send({ grievanceText: "Garbage not collected here", location: { pincode: "12" } });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/pincode/i);
  });

  test("accepts a blank pincode", async () => {
    const res = await request(app)
      .post("/api/grievances")
      .send({ grievanceText: "Garbage not collected here", location: { area: "Velachery", pincode: "" } });

    expect(res.statusCode).toBe(201);
  });

  test("rejects out-of-range coordinates", async () => {
    const res = await request(app)
      .post("/api/grievances")
      .send({ grievanceText: "Broken drain cover on the road", location: { lat: 999, lng: 80 } });

    expect(res.statusCode).toBe(400);
  });
});

describe("Contact capture", () => {
  test("stores phone and normalises email to lowercase", async () => {
    const res = await request(app).post("/api/grievances").send(FULL);

    expect(res.body.contact.phone).toBe("+91 95554 27132");
    expect(res.body.contact.email).toBe("citizen@example.com");
  });

  test("rejects a malformed email", async () => {
    const res = await request(app)
      .post("/api/grievances")
      .send({ grievanceText: "Sewage overflow in the lane", contact: { email: "not-an-email" } });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/email/i);
  });

  test("a grievance with no contact is still accepted", async () => {
    const res = await request(app)
      .post("/api/grievances")
      .send({ grievanceText: "Potholes along the main road" });

    expect(res.statusCode).toBe(201);
    expect(res.body.contact).toBeUndefined();
  });
});

describe("Public tracking view protects the citizen", () => {
  test("NEVER exposes contact details", async () => {
    const created = await request(app).post("/api/grievances").send(FULL);
    const res = await request(app).get(`/api/grievances/track/${created.body.trackingId}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).not.toHaveProperty("contact");
    expect(JSON.stringify(res.body)).not.toContain("95554");
    expect(JSON.stringify(res.body)).not.toContain("citizen@example.com");
  });

  test("NEVER exposes precise coordinates or pincode", async () => {
    const created = await request(app).post("/api/grievances").send(FULL);
    const res = await request(app).get(`/api/grievances/track/${created.body.trackingId}`);

    expect(res.body.location).not.toHaveProperty("lat");
    expect(res.body.location).not.toHaveProperty("lng");
    expect(res.body.location).not.toHaveProperty("pincode");
    expect(JSON.stringify(res.body)).not.toContain("600119");
    expect(JSON.stringify(res.body)).not.toContain("12.901");
  });

  test("does show coarse area so the citizen recognises their own report", async () => {
    const created = await request(app).post("/api/grievances").send(FULL);
    const res = await request(app).get(`/api/grievances/track/${created.body.trackingId}`);

    expect(res.body.location.area).toBe("Sholinganallur, 3rd Main Road");
    expect(res.body.location.landmark).toBe("Opposite the bus depot");
  });

  test("omits location entirely when none was given", async () => {
    const created = await request(app)
      .post("/api/grievances")
      .send({ grievanceText: "Streetlight out near the school" });
    const res = await request(app).get(`/api/grievances/track/${created.body.trackingId}`);

    expect(res.body.location).toBeUndefined();
  });
});

describe("Admin view keeps full detail", () => {
  test("admins can see coordinates and contact for dispatch", async () => {
    const created = await request(app).post("/api/grievances").send(FULL);

    const res = await request(app)
      .get(`/api/grievances/${created.body._id}`)
      .set("x-admin-key", "test-admin-key");

    expect(res.statusCode).toBe(200);
    expect(res.body.location.lat).toBeCloseTo(12.9010, 3);
    expect(res.body.contact.phone).toBe("+91 95554 27132");
  });
});