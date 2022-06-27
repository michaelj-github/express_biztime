const express = require("express");
const ExpressError = require("../expressError")
const router = express.Router();
const db = require("../db");

/** GET / - return a list of invoices */
router.get("/", async (req, res, next) => {
    try {
        const results = await db.query("SELECT id, comp_code, amt FROM invoices")
        return res.json({ invoices: results.rows});
    }
    catch (err) {
      return next(err);
    }
  });

/** GET /[id] - return data about one invoice */
router.get("/:id", async (req, res, next) => {
    try {
        const { id } = req.params;
        const results = await db.query(`SELECT i.id,
                                        i.comp_code,
                                        i.amt,
                                        i.paid,
                                        i.add_date,
                                        i.paid_date,
                                        c.name,
                                        c.description
                                        FROM invoices i
                                        JOIN companies c
                                        ON (i.comp_code = c.code)
                                        WHERE i.id = $1`, [id])
        if (results.rows.length === 0) {
          throw new ExpressError(`Can't find an invoice with id of ${id}`, 404)
        }
        const retResults = results.rows[0];
        const retInvoice = {id: retResults.id,
                            amt: retResults.amt,
                            paid: retResults.paid,
                            add_date: retResults.add_date,
                            paid_date: retResults.paid_date,
                            company: {code: retResults.comp_code,
                                      name: retResults.name,
                                      description: retResults.description} };
    return res.json({ invoice: retInvoice });
    } catch (err) {
      return next(err);
    }
  });

/** POST / - add an invoice to the db */
router.post("/", async (req, res, next) => {
    try {
        const { comp_code, amt } = req.body;
        const results = await db.query('INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING id, comp_code, amt, paid, add_date, paid_date', [comp_code, amt]);
        return res.status(201).json({ invoice: results.rows[0] })
    } catch (err) {
      return next(err);
    }
  });

/** PUT /[id] - update an invoice */
router.put("/:id", async (req, res, next) => {
    try {
      if ("id" in req.body) {
        throw new ExpressError("Changing the invoice id is not allowed.", 400)
      }

      const { id } = req.params;
      const { amt, paid, paid_date } = req.body;

      const paidResult = await db.query(`SELECT paid, paid_date FROM invoices WHERE id = $1`, [id])

      if (paidResult.rows.length === 0) {
        throw new ExpressError(`An error occurred. Unable to update the invoice with id of ${id}`, 404)
      }

      let newPaidDate;

      if (paid && !paid_date) {
        newPaidDate = new Date();
      } else if (!paid) {
        newPaidDate = null
      }

      const results = await db.query('UPDATE invoices SET amt=$1, paid=$2, paid_date=$3 WHERE id=$4 RETURNING id, comp_code, amt, paid, add_date, paid_date', [amt, paid, newPaidDate, id])

      if (results.rows.length === 0) {
        throw new ExpressError(`An error occurred. Unable to update the invoice with id of ${id}`, 404)
      }

      return res.send({ invoice: results.rows[0] })

    } catch (err) {
      return next(err);
    }
  });

/** DELETE /[id] - delete an invoice from the database */
router.delete("/:id", async (req, res, next) => {
    try {
      const results = await db.query("DELETE FROM invoices WHERE id = $1 RETURNING id", [req.params.id]);
      if (results.rows.length === 0) {
        throw new ExpressError(`There is no invoice with that id.`, 404);
      }
      return res.json({ status: "deleted" });
    } catch (err) {
      return next(err);
    }
  });

module.exports = router;
