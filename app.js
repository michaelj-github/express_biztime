const express = require("express");
const app = express();
const ExpressError = require("./expressError");
app.use(express.json());
const companiesRoutes = require("./routes/companies");
app.use("/companies", companiesRoutes);
const invoicesRoutes = require("./routes/invoices");
app.use("/invoices", invoicesRoutes);

// From Colt's video lectures
// If no other route matches, respond with a 404
app.use((req, res, next) => {
    return new ExpressError("Page Not Found", 404);    
  });
  
  // Error handler
  app.use((err, req, res, next) => {
  res.status(err.status || 500);
  return res.json({    
    error: err,
    message: err.message
  });
  });
  
module.exports = app;