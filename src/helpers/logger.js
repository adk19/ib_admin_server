// ./src/helpers/logger.js

const log4js = require("log4js");
const path = require("path");
const fs = require("fs");

/* -------------------------------------------------------------------------- */
/*                       Generate Date & Hour-Based Path                      */
/* -------------------------------------------------------------------------- */
/**
 * @type {Function}
 * @description Generate Date & Hour-Based Path
 * @param {string} folderName - The name of the folder
 * @returns {string}
 */
const generateFilePath = (folderName) => {
    const now = new Date();
    const date = now.toISOString().split("T")[0];
    const hour = now.getHours();
    const logDirectory = path.join(__dirname, `../../logs/${folderName}`, date);

    if (!fs.existsSync(logDirectory)) {
        fs.mkdirSync(logDirectory, { recursive: true });
    };

    return path.join(logDirectory, `${hour}.log`);
}


/* -------------------------------------------------------------------------- */
/*                       Initializes log4js Folder wise                       */
/* -------------------------------------------------------------------------- */
/**
 * @type {Function}
 * @description Initializes log4js Folder wise
 * @param {string} folderName - The name of the folder
 */
const setupLogger = (folderName) => {
    log4js.configure({
        appenders: {
            file: {
                type: "file",
                filename: generateFilePath(folderName),
                maxLogSize: 5 * 1024 * 1024, // 5 MB rotation
                backups: 5,
                compress: true,
                layout: {
                    type: "pattern",
                    pattern: "[%d{yyyy-MM-dd hh:mm:ss}] [%p] %m"
                }
            }
        },
        categories: {
            default: {
                appenders: ["file"],
                level: "debug"
            }
        }
    });
};


/* -------------------------------------------------------------------------- */
/*                           Request Logging Helper                           */
/* -------------------------------------------------------------------------- */
/**
 * @type {Function}
 * @description Request Logging Helper
 * @param {Object} req - The request object
 */
const logRequestDetails = (req) => {
    logger.info(`URL: ${req.method} ${req.originalUrl}`);
    logger.info(`Headers: ${JSON.stringify(req.headers)}`);
    logger.info(`Body: ${JSON.stringify(req.body)}`);
    logger.info("=====================================\n");
};


/* -------------------------------------------------------------------------- */
/*                          Export Configured Logger                          */
/* -------------------------------------------------------------------------- */
/**
 * @type {Object}
 * @description Export Configured Logger
 */
const logger = log4js.getLogger();
module.exports = { logger, setupLogger, logRequestDetails };
