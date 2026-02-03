// ./src/routes/docs.routes.js

const router = require("express").Router();
const swaggerUi = require("swagger-ui-express");
const path = require("path");
const fs = require("fs");

/* -------------------------------------------------------------------------- */
/*                     Always read the latest swagger.json                    */
/* -------------------------------------------------------------------------- */
const swaggerPath = path.join(__dirname, "../../docs/swagger.json");

router.use("/", swaggerUi.serve);
router.get("/", (req, res, next) => {
  try {
    const raw = fs.readFileSync(swaggerPath, "utf-8");
    const swaggerDoc = JSON.parse(raw);
    return swaggerUi.setup(swaggerDoc)(req, res, next);
  } catch (err) {
    console.warn("Swagger doc load failed:", err?.message);
    return res.status(500).json({ success: false, message: "Failed to load API docs" });
  }
});

module.exports = router;