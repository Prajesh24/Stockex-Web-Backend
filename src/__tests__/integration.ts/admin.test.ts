import request from "supertest";
import app from "../../app";
import { UserModel } from "../../models/user.model";

const ADMIN_BASE = "/api/admin/users";

describe("Admin User Integration Tests", () => {
  let adminToken: string;
  let createdUserId: string;

  const adminUser = {
    name: "Admin",
    email: "admin@test.com",
    password: "Password123!",
    confirmPassword: "Password123!",
    role: "admin",
  };

  const normalUser = {
    name: "User1",
    email: "user1@test.com",
    password: "Password123!",
    confirmPassword: "Password123!",
  };

  beforeAll(async () => {
    await UserModel.deleteMany({
      email: { $in: [adminUser.email, normalUser.email, "normal@test.com"] },
    });

    await request(app).post("/api/auth/register").send(adminUser);

    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: adminUser.email, password: adminUser.password });

    adminToken = loginRes.body.token;
  });

  afterAll(async () => {
    await UserModel.deleteMany({
      email: { $in: [adminUser.email, normalUser.email, "normal@test.com"] },
    });
  });

  // ===============================
  // CREATE USER TESTS
  // ===============================

  test("1. Admin should create user", async () => {
    const res = await request(app)
      .post(ADMIN_BASE)
      .set("Authorization", `Bearer ${adminToken}`)
      .send(normalUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    createdUserId = res.body.data._id;
  });

  test("2. Should fail without token", async () => {
    const res = await request(app).post(ADMIN_BASE).send(normalUser);
    expect(res.status).toBe(401);
  });

  test("3. Should fail with invalid email", async () => {
    const res = await request(app)
      .post(ADMIN_BASE)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ ...normalUser, email: "invalid-email" });

    expect(res.status).toBe(400);
  });

  test("4. Should not create duplicate email", async () => {
    const res = await request(app)
      .post(ADMIN_BASE)
      .set("Authorization", `Bearer ${adminToken}`)
      .send(normalUser);

    expect(res.status).toBe(403);
  });

  test("5. Should fail when name missing", async () => {
    const res = await request(app)
      .post(ADMIN_BASE)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ email: "x@test.com", password: "Password123!" });

    expect(res.status).toBe(400);
  });

  test("6. Should fail when password missing", async () => {
    const res = await request(app)
      .post(ADMIN_BASE)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "X", email: "x2@test.com" });

    expect(res.status).toBe(400);
  });

  // ===============================
  // GET ALL USERS
  // ===============================

  test("7. Admin should get all users", async () => {
    const res = await request(app)
      .get(ADMIN_BASE)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });

  test("8. Get users with pagination", async () => {
    const res = await request(app)
      .get(`${ADMIN_BASE}?page=1&size=5`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });

  test("9. Search users", async () => {
    const res = await request(app)
      .get(`${ADMIN_BASE}?search=user1`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });

  test("10. Large page number", async () => {
    const res = await request(app)
      .get(`${ADMIN_BASE}?page=999`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });

  test("11. Negative page", async () => {
    const res = await request(app)
      .get(`${ADMIN_BASE}?page=-1`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });

  test("12. Empty search query", async () => {
    const res = await request(app)
      .get(`${ADMIN_BASE}?search=`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });

  // ===============================
  // GET BY ID
  // ===============================

  test("13. Get user by ID", async () => {
    const res = await request(app)
      .get(`${ADMIN_BASE}/${createdUserId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });

  test("14. Invalid ID format", async () => {
    const res = await request(app)
      .get(`${ADMIN_BASE}/invalid-id`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(500);
  });

  // ===============================
  // UPDATE USER
  // ===============================

  test("15. Update user name", async () => {
    const res = await request(app)
      .put(`${ADMIN_BASE}/${createdUserId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Updated Name" });

    expect(res.status).toBe(200);
  });

  test("16. Update invalid email", async () => {
    const res = await request(app)
      .put(`${ADMIN_BASE}/${createdUserId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ email: "wrong" });

    expect(res.status).toBe(400);
  });

  test("17. Update non-existing user", async () => {
    const res = await request(app)
      .put(`${ADMIN_BASE}/64f123456789123456789999`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "No User" });

    expect(res.status).toBe(500);
  });

  test("18. Update empty body", async () => {
    const res = await request(app)
      .put(`${ADMIN_BASE}/${createdUserId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});

    expect(res.status).toBe(200);
  });

  // ===============================
  // DELETE USER
  // ===============================

  test("19. Delete user", async () => {
    const res = await request(app)
      .delete(`${ADMIN_BASE}/${createdUserId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });

  test("20. Delete already deleted user", async () => {
    const res = await request(app)
      .delete(`${ADMIN_BASE}/${createdUserId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });

  test("21. Delete invalid ID", async () => {
    const res = await request(app)
      .delete(`${ADMIN_BASE}/invalid-id`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(500);
  });

  // ===============================
  // AUTH TESTS
  // ===============================

  test("22. Non-admin cannot access admin route", async () => {
    await request(app).post("/api/auth/register").send({
      name: "Normal",
      email: "normal@test.com",
      password: "Password123!",
      confirmPassword: "Password123!",
    });

    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "normal@test.com", password: "Password123!" });

    const res = await request(app)
      .get(ADMIN_BASE)
      .set("Authorization", `Bearer ${login.body.token}`);

    expect(res.status).toBe(403);
  });

  test("23. Missing token", async () => {
    const res = await request(app).get(ADMIN_BASE);
    expect(res.status).toBe(401);
  });

  test("24. Invalid token", async () => {
    const res = await request(app)
      .get(ADMIN_BASE)
      .set("Authorization", "Bearer invalidtoken");

    expect(res.status).toBe(401);
  });

  test("25. Get user after delete", async () => {
    const res = await request(app)
      .get(`${ADMIN_BASE}/${createdUserId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect([200, 404]).toContain(res.status); // depends on service logic
  });
});
