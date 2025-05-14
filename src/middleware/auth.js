import db from "@/lib/prisma";
import jwt from "jsonwebtoken";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;

if (!ACCESS_TOKEN_SECRET) {
  throw new Error("ACCESS_TOKEN_SECRET must be defined in the environment variables");
}

const authMiddleware = async (req) => {
  try {
    const authorizationHeader = req.headers.get("authorization");

    if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
      return { authenticated: false, message: "Unauthorized: No token provided" };
    }

    const token = authorizationHeader.split(" ")[1];
    // console.log({ token })

    // Verify the token
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
    // console.log({ decoded })

    if (!decoded || !decoded.userId) {
      return { authenticated: false, message: "Unauthorized: Invalid token" };
    }

    // Check if token exists in the database
    const device = await db.user_devices.findFirst({
      where: { user_id: decoded.userId, access_token: token },
    });

    if (!device) {
      return { authenticated: false, message: "Unauthorized: Token not found in DB" };
    }

    const user = await db.users.findFirst({
      where: { id: decoded.userId },
    });
    // console.log({ user, device })

    return { authenticated: true, message: "Authorized", user, device };
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return { authenticated: false, message: "Unauthorized: Token expired" };
    }
    return { authenticated: false, message: "Unauthorized: Invalid token" };
  }
};

export default authMiddleware;
