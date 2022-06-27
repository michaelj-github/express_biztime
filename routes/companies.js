const express = require("express");
const slugify = require("slugify");
const ExpressError = require("../expressError")
const router = express.Router();
const db = require("../db");

/** GET / - return a list of companies */
router.get("/", async (req, res, next) => {
    try {
        const results = await db.query("SELECT code, name, description FROM companies")
        return res.json({ companies: results.rows});
    }
    catch (err) {
      return next(err);
    }
  });

/** GET /[code] - return data about one company */
router.get("/:code", async (req, res, next) => {
    try {
        const { code } = req.params;
        const results = await db.query('SELECT code, name, description FROM companies WHERE code = $1', [code])
        if (results.rows.length === 0) {
          throw new ExpressError(`Can't find a company with code of ${code}`, 404)
        }
        const invoices = await db.query("SELECT id, comp_code, amt, paid, add_date, paid_date FROM invoices where comp_code = $1", [code])
    return res.json({ company: results.rows[0], invoices: invoices.rows });
    } catch (err) {
      return next(err);
    }
  });

/** POST / - create a company in the db */
router.post("/", async (req, res, next) => {
    try {
        const { name, description } = req.body;
        let code = slugify(name, {lower: true});
        const results = await db.query('INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description', [code, name, description]);
        return res.status(201).json({ company: results.rows[0] })
    } catch (err) {
      return next(err);
    }
  });

/** PUT /[code] - update information about a company */
router.put("/:code", async (req, res, next) => {
    try {
      if ("code" in req.body) {
        throw new ExpressError("Changing the company code is not allowed.", 400)
      }

      const { code } = req.params;
      const { name, description } = req.body;
      const results = await db.query('UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING code, name, description', [name, description, code])

      if (results.rows.length === 0) {
        throw new ExpressError(`An error occurred. Unable to update the company with code of ${code}`, 404)
      }

      return res.send({ company: results.rows[0] })

    } catch (err) {
      return next(err);
    }
  });

/** DELETE /[code] - delete a company from the database */
router.delete("/:code", async (req, res, next) => {
    try {
      const results = await db.query("DELETE FROM companies WHERE code = $1 RETURNING code", [req.params.code]);
      if (results.rows.length === 0) {
        throw new ExpressError(`There is no company with that code.`, 404);
      }
      return res.json({ status: "deleted" });
    } catch (err) {
      return next(err);
    }
  });

module.exports = router;
