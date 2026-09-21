const Grievance = require("../models/Grievance");
const {
  createGrievance,
  getGrievanceById,
  updateGrievanceStatus,
} = require("../controllers/grievanceController");

jest.mock("../models/Grievance");

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("createGrievance", () => {
  afterEach(() => jest.clearAllMocks());

  test("rejects a request with no grievanceText", async () => {
    const req = { body: {} };
    const res = mockRes();

    await createGrievance(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining("grievanceText") })
    );
    expect(Grievance.create).not.toHaveBeenCalled();
  });

  test("rejects grievanceText shorter than 5 characters", async () => {
    const req = { body: { grievanceText: "hi" } };
    const res = mockRes();

    await createGrievance(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(Grievance.create).not.toHaveBeenCalled();
  });

  test("creates a grievance when grievanceText is valid", async () => {
    const fakeGrievance = { _id: "abc123", grievanceText: "Water supply broken for 3 days" };
    Grievance.create.mockResolvedValue(fakeGrievance);

    const req = { body: { grievanceText: "Water supply broken for 3 days" } };
    const res = mockRes();

    await createGrievance(req, res);

    expect(Grievance.create).toHaveBeenCalledWith(req.body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(fakeGrievance);
  });

  test("returns 500 if the database throws an unexpected error", async () => {
    Grievance.create.mockRejectedValue(new Error("DB connection lost"));

    const req = { body: { grievanceText: "Streetlight not working" } };
    const res = mockRes();

    await createGrievance(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe("getGrievanceById", () => {
  afterEach(() => jest.clearAllMocks());

  test("returns 404 when grievance does not exist", async () => {
    Grievance.findById.mockResolvedValue(null);

    const req = { params: { id: "64f0000000000000000000aa" } };
    const res = mockRes();

    await getGrievanceById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("returns 400 for a malformed id (CastError)", async () => {
    const castError = new Error("Cast failed");
    castError.name = "CastError";
    Grievance.findById.mockRejectedValue(castError);

    const req = { params: { id: "not-a-valid-id" } };
    const res = mockRes();

    await getGrievanceById(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("returns the grievance when found", async () => {
    const fakeGrievance = { _id: "abc123", grievanceText: "Pension not credited" };
    Grievance.findById.mockResolvedValue(fakeGrievance);

    const req = { params: { id: "abc123" } };
    const res = mockRes();

    await getGrievanceById(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(fakeGrievance);
  });
});

describe("updateGrievanceStatus", () => {
  afterEach(() => jest.clearAllMocks());

  test("rejects an invalid status value", async () => {
    const req = { params: { id: "abc123" }, body: { status: "Closed" } };
    const res = mockRes();
    await updateGrievanceStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(Grievance.findById).not.toHaveBeenCalled();
  });

  test("returns 404 when the grievance does not exist", async () => {
    Grievance.findById.mockResolvedValue(null);
    const req = { params: { id: "abc123" }, body: { status: "Resolved" } };
    const res = mockRes();
    await updateGrievanceStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("updates status and appends a timeline entry when valid", async () => {
    const doc = {
      _id: "abc123",
      status: "Submitted",
      timeline: [{ status: "Submitted", changedAt: new Date() }],
      save: jest.fn().mockResolvedValue(true),
    };
    Grievance.findById.mockResolvedValue(doc);

    const req = { params: { id: "abc123" }, body: { status: "Resolved", note: "Fixed by the water department" } };
    const res = mockRes();
    await updateGrievanceStatus(req, res);

    expect(doc.status).toBe("Resolved");
    expect(doc.timeline).toHaveLength(2);
    expect(doc.timeline[1].status).toBe("Resolved");
    expect(doc.timeline[1].note).toBe("Fixed by the water department");
    expect(doc.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
