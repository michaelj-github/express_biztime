process.env.NODE_ENV = 'test';
const request = require('supertest');
const app = require('../app');
const db = require('../db');

let testCompany;
beforeEach(async () => {
    await db.query(`DELETE FROM companies`)
    const result = await db.query(`INSERT INTO companies (code, name, description) VALUES ('mjm', 'MJMCO', 'Michael J Murphy Consulting') RETURNING  code, name, description`);
    testCompany = result.rows[0]
})

afterEach(async () => {
  await db.query(`DELETE FROM companies`)
})

afterAll(async () => {
  await db.end()
})

test("Get a list with one company", async () => {
    const res = await request(app).get('/companies')
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ companies: [testCompany] })
})

test("Get information for one company", async function () {
    const response = await request(app).get("/companies/mjm");
    expect(response.body).toEqual(
        {
          "company": {
            code: "mjm",
            name: "MJMCO",
            description: "Michael J Murphy Consulting",            
          }, "invoices": [],
        }
    );
});

test("Add a company", async function () {
    const response = await request(app).post("/companies").send({name: "SDMCO", description: "Sherry D Murphy Therapy"});
    expect(response.body).toEqual(
        {
          "company": {
            code: "sdmco",
            name: "SDMCO",
            description: "Sherry D Murphy Therapy",
          }
        }
    );
});

test("Update a company", async function () {
    const response = await request(app).put("/companies/mjm").send({name: "Vacation", description: "Mike on his bike"});
    expect(response.body).toEqual(
        {
          "company": {
            code: "mjm",
            name: "Vacation",
            description: "Mike on his bike",
          }
        }
    );
});

test("Delete a company", async function () {
    const response = await request(app).delete("/companies/mjm");
    expect(response.body).toEqual({"status": "deleted"});
});

test("Invalid company code", async function () {
  const response = await request(app).get("/companies/foo");
  expect(response.status).toEqual(404);
});