// ./src/routes/index.js

const router = require("express").Router();
const authRoutes = require("./auth.routes.js");
const userRoutes = require("./user.routes.js");
const categoryRoutes = require("./category.routes.js");
const subcategoryRoutes = require("./subcategory.routes.js");

const docsRoutes = require("./docs.routes.js");

/* ------------------------------- All routes ------------------------------- */
router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/category", categoryRoutes);
router.use("/sub-category", subcategoryRoutes);

router.use("/docs", docsRoutes);

module.exports = router;