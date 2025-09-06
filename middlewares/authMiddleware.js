import userModel from '../models/user.model.js';
import jwt from 'jsonwebtoken'

export const auth = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
    
     // Get token from cookie or header
      const token = req.cookies.accessToken || req.headers["authorization"]?.split(" ")[1];

      if (!token) return res.status(401).json({ error: "You need to login first!" });
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user
      const user = await userModel.findOne({ email: decoded.email })
            .select("-password -refreshToken");

      if (!user) return res.status(404).json({ error: "User not found" });  

      // Check role
      if (allowedRoles.length && !allowedRoles.includes(user.role)) {
        return res.status(403).json({ error: "Access denied. Insufficient role." });
      }

      req.user = user; 
      next();
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({ error: "Access token expired" });
      } else if (error.name === "JsonWebTokenError") {
        return res.status(403).json({ error: "Invalid token" });
      }
      return res.status(500).json({ error: "Something went wrong!" });
    }
  };
};