// ./src/utils/responses.js

/* -------------------------------------------------------------------------- */
/*                                 2xx Success                                */
/* -------------------------------------------------------------------------- */
/**
 * 200 OK Response
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {String} message - Success message
 * @returns {Object} JSON response
 */
exports.success = (res, data = null, message = "Success") => {
    return res.status(200).json({
        success: true,
        status: 200,
        message,
        data
    });
};


/**
 * 201 Created Response
 * @param {Object} res - Express response object
 * @param {*} data - Created resource data
 * @param {String} message - Success message
 * @returns {Object} JSON response
 */
exports.created = (res, data = null, message = "Resource created successfully") => {
    return res.status(201).json({
        success: true,
        status: 201,
        message,
        data
    });
};


/**
 * 202 Accepted Response
 * @param {Object} res - Express response object
 * @param {String} message - Success message
 * @returns {Object} JSON response
 */
exports.accepted = (res, message = "Request accepted for processing") => {
    return res.status(202).json({
        success: true,
        status: 202,
        message
    });
};


/**
 * 204 No Content Response
 * @param {Object} res - Express response object
 * @returns {Object} Empty response
 */
exports.noContent = (res) => {
    return res.status(204).end();
};


/* -------------------------------------------------------------------------- */
/*                              4xx Client Errors                             */
/* -------------------------------------------------------------------------- */
/**
 * 400 Bad Request Response
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 * @param {Object} errors - Additional error details
 * @returns {Object} JSON response
 */
exports.badRequest = (res, message = "Bad Request", errors = null) => {
    return res.status(400).json({
        success: false,
        status: 400,
        message,
        errors: errors || undefined
    });
};


/**
 * 401 Unauthorized Response
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 * @returns {Object} JSON response
 */
exports.unauthorized = (res, message = "Unauthorized") => {
    return res.status(401).json({
        success: false,
        status: 401,
        message
    });
};


/**
 * 402 Payment Required Response
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 * @returns {Object} JSON response
 */
exports.paymentRequired = (res, message = "Payment Required") => {
    return res.status(402).json({
        success: false,
        status: 402,
        message
    });
};


/**
 * 403 Forbidden Response
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 * @returns {Object} JSON response
 */
exports.forbidden = (res, message = "Forbidden") => {
    return res.status(403).json({
        success: false,
        status: 403,
        message
    });
};


/**
 * 404 Not Found Response
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 * @returns {Object} JSON response
 */
exports.notFound = (res, message = "Resource not found") => {
    return res.status(404).json({
        success: false,
        status: 404,
        message
    });
};


/**
 * 405 Method Not Allowed Response
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 * @returns {Object} JSON response
 */
exports.methodNotAllowed = (res, message = "Method Not Allowed") => {
    return res.status(405).json({
        success: false,
        status: 405,
        message
    });
};


/**
 * 406 Not Acceptable Response
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 * @returns {Object} JSON response
 */
exports.notAcceptable = (res, message = "Not Acceptable") => {
    return res.status(406).json({
        success: false,
        status: 406,
        message
    });
};


/**
 * 408 Request Timeout Response
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 * @returns {Object} JSON response
 */
exports.requestTimeout = (res, message = "Request Timeout") => {
    return res.status(408).json({
        success: false,
        status: 408,
        message
    });
};


/**
 * 409 Conflict Response
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 * @param {Object} data - Additional conflict data
 * @returns {Object} JSON response
 */
exports.conflict = (res, message = "Conflict", data = null) => {
    return res.status(409).json({
        success: false,
        status: 409,
        message,
        data: data ?? undefined
    });
};


/**
 * 410 Gone Response
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 * @returns {Object} JSON response
 */
exports.gone = (res, message = "Resource is no longer available") => {
    return res.status(410).json({
        success: false,
        status: 410,
        message
    });
};


/**
 * 422 Unprocessable Entity Response
 * @param {Object} res - Express response object
 * @param {Object} errors - Validation errors
 * @param {String} message - Error message
 * @returns {Object} JSON response
 */
exports.validationError = (res, errors, message = "Validation Error") => {
    return res.status(422).json({
        success: false,
        status: 422,
        message,
        errors
    });
};


/**
 * 429 Too Many Requests Response
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 * @param {Number} retryAfter - Seconds to wait before next request
 * @returns {Object} JSON response
 */
exports.tooManyRequests = (res, message = "Too Many Requests", retryAfter = 60) => {
    res.set('Retry-After', String(retryAfter));
    return res.status(429).json({
        success: false,
        status: 429,
        message,
        retryAfter
    });
};


/* -------------------------------------------------------------------------- */
/*                              5xx Server Errors                             */
/* -------------------------------------------------------------------------- */
/**
 * 500 Internal Server Error Response
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 * @param {Error} error - Error object for logging
 * @returns {Object} JSON response
 */
exports.serverError = (res, message = "Internal Server Error", error = null) => {
    if (error) {
        console.error("Server Error:", error);
    }
    return res.status(500).json({
        success: false,
        status: 500,
        message,
        error: error?.message ?? undefined
    });
};


/**
 * 501 Not Implemented Response
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 * @returns {Object} JSON response
 */
exports.notImplemented = (res, message = "Not Implemented") => {
    return res.status(501).json({
        success: false,
        status: 501,
        message
    });
};


/**
 * 502 Bad Gateway Response
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 * @returns {Object} JSON response
 */
exports.badGateway = (res, message = "Bad Gateway") => {
    return res.status(502).json({
        success: false,
        status: 502,
        message
    });
};


/**
 * 503 Service Unavailable Response
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 * @returns {Object} JSON response
 */
exports.serviceUnavailable = (res, message = "Service Unavailable") => {
    return res.status(503).json({
        success: false,
        status: 503,
        message
    });
};


/**
 * 504 Gateway Timeout Response
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 * @returns {Object} JSON response
 */
exports.gatewayTimeout = (res, message = "Gateway Timeout") => {
    return res.status(504).json({
        success: false,
        status: 504,
        message
    });
};


/* -------------------------------------------------------------------------- */
/*                              Utility Responses                             */
/* -------------------------------------------------------------------------- */
/**
 * Pagination Response
 * @param {Object} res - Express response object
 * @param {Array} data - Array of items
 * @param {Number} total - Total number of items
 * @param {Number} page - Current page number
 * @param {Number} limit - Items per page
 * @param {String} message - Success message
 * @returns {Object} JSON response
 */
exports.paginated = (res, data, total, page, limit, message = "Success") => {
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrevious = page > 1;

    return res.status(200).json({
        success: true,
        status: 200,
        message,
        total,
        data,
        pagination: {
            limit,
            hasPrevious,
            page,
            hasNext
        }
    });
};


/**
 * Generic Error Response
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 * @param {Number} status - HTTP status code (default: 400)
 * @param {Object} errors - Additional error details
 * @returns {Object} JSON response
 */
exports.error = (res, message = "An error occurred", status = 400, errors = null) => {
    return res.status(status).json({
        success: false,
        status,
        message,
        errors: errors || undefined
    });
};
