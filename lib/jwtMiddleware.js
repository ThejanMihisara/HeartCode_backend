import jwt from "jsonwebtoken";
import "dotenv/config";



// Checks JWT from either:
// 1) Authorization: Bearer <token>
// 2) Cookie: token=<token> (httpOnly)
export default function authorizeUser(req, res, next) {
  const header = req.header("Authorization");
  const bearerToken = header?.startsWith("Bearer ") ? header.replace("Bearer ", "") : null;
  const cookieToken = req.cookies?.token ?? null;

  const token = bearerToken || cookieToken;

  if (!token) {
    // no user, still allow public routes
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err || !decoded) {
      return res.status(401).json({ message: "Invalid token. Please login again." });
    }
    req.user = decoded;
    next();
  });
}
