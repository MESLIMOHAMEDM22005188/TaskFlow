const jwt = require("jsonwebtoken")

/**
 * Authentication middleware.
 *
 * Verifies the JWT token provided in the Authorization header.
 * If the token is valid, the authenticated user's ID is attached
 * to the request object before continuing.
 *
 * Exepted header format:
 * Authorization: Bearer <token>
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware.
 */
function authenticateToken(req, res, next) {

    // Retrieve the Authorization header
    const authorizationHeader = req.headers.authorization;

    // Ensure the Authorization header exists
    if (!authorizationHeader) {
        return res.status(401).json({
            message: "Authentication required."
        });
    }

    // Validate the Bearer format
    if (!authorizationHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Invalid authorization header."
        });
    }

    // Extract the JWT token
    const token = authorizationHeader.split(" ")[1];

    try {

        // Verify and decode the token
        const decodedToken = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Attach the authenticated user's ID to the request
        req.userId = decodedToken.userId;

        // Continue to the next middleware
        next();

    } catch (error) {

        return res.status(401).json({
            message: "Invalid or expired token."
        });

    }

}

module.exports = authenticateToken;