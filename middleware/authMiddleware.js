const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
    // Get token from the authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Access denied. No token provided." });
    }

    const token = authHeader.split(" ")[1];

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Add user info to the request object
        next();
    } catch (error) {
        res.status(401).json({ message: "Invalid or expired token." });
    }
};
