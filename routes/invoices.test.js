process.env.NODE_ENV = 'test';
const request = require('supertest');
const app = require('../app');
const db = require('../db');

beforeAll(async () => {            
        await db.query("DELETE FROM companies");
        await db.query(`INSERT INTO companies (code, name, description) VALUES ('mjm', 'MJMCO', 'Michael J Murphy Consulting') RETURNING  code, name, description`);
})

let testInvoice;
beforeEach(async () => {    
    await db.query(`DELETE FROM invoices`)
    await db.query("SELECT setval('invoices_id_seq', 1, false)");
    const result = await db.query(`INSERT INTO invoices (comp_code, amt) VALUES ('mjm', 999) RETURNING  id, comp_code, amt`);
    testInvoice = result.rows[0]
})

afterEach(async () => {
  await db.query(`DELETE FROM invoices`)
})

afterAll(async () => {
    await db.end()
})

test("Get a list with one invoice", async () => {
    const res = await request(app).get('/invoices')
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ "invoices": [{id: 1, comp_code: "mjm", amt: 999}] })
})

test("Get one invoice info", async function () {
    const response = await request(app).get("/invoices/1");
    expect(response.body).toEqual(
        {
          "invoice": {
            id: 1,
            amt: 999,
            add_date: expect.any(String),
            paid: false,
            paid_date: null,
            company: {
              code: 'mjm',
              name: 'MJMCO',
              description: 'Michael J Murphy Consulting',
            }
          }
        }
    );
});

test("Add an invoice", async function () {
    const response = await request(app).post("/invoices").send({amt: 999, comp_code: 'mjm'});
    expect(response.body).toEqual(
        {
          "invoice": {
            id: expect.any(Number),
            comp_code: "mjm",
            amt: 999,
            add_date: expect.any(String),
            paid: false,
            paid_date: null,
          }
        }
    );
});

test("Update an invoice", async function () {
const response = await request(app).put("/invoices/1").send({amt: 899, paid: false});
expect(response.body).toEqual(
    {
        "invoice": {
        id: expect.any(Number),
        comp_code: 'mjm',
        paid: false,
        amt: 899,
        add_date: expect.any(String),
        paid_date: null,
        }
    }
);
});  

test("Delete an invoice", async function () {
    const response = await request(app).delete("/invoices/1");
    expect(response.body).toEqual({"status": "deleted"});
});

test("Invalid invoice id", async function () {
  const response = await request(app).get("/invoices/0");
  expect(response.status).toEqual(404);
});