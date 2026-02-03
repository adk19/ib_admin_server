// ./src/db/mongooseDB.js

const Mongoose = require("mongoose");
const { config } = require("../configs/envConfig.js");
const { setupLogger, logger } = require("../helpers/logger.js");

const logfile_folder = "database";

/* -------------------------------------------------------------------------- */
/*                        DATABASE CONNECTION FUNCTION                        */
/* -------------------------------------------------------------------------- */
/**
 * @type {Function}
 * @description Database connection function
 * @returns {Promise}
 * @throws {Error}
 */
const connectDB = async () => {
    setupLogger(logfile_folder);
    try {
        await Mongoose.connect(`${config.mongo.url}/${config.mongo.db}`);
        console.log("✅ Database connected successfully");

        /** == Database Connection Event == */
        Mongoose.connection.on("connected", () => {
            logger.info("Database connected successfully");
        });

        Mongoose.connection.on("error", (error) => {
            console.log("Database connection Error:", error?.message || "something went wrong..!");
            logger.error(`Database connection Error: ${error?.message || "something went wrong..!"}`);
        });
    } catch (error) {
        console.error("❌ Database connection failed:", error?.message);
        logger.error(`❌ Database connection failed: ${error?.message || "something went wrong..!"}\n\n`)
        throw new Error("Database connection failed");
    }
};


/* ------------------------------ EXPORT MODEL ------------------------------ */
module.exports = { connectDB };
