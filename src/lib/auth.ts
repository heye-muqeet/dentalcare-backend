import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "your-secret-key";
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || "your-refresh-secret-key";

// Generate Access Token
export const generateAccessToken = (user: { id: string; email: string }) => {
  return jwt.sign({ userId: user.id, email: user.email }, ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
};

// Generate Refresh Token
export const generateRefreshToken = (user: { id: string }) => {
  return jwt.sign({ userId: user.id }, REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
};

// Hash Password
export const hashPassword = async (password: string) => {
  return await bcrypt.hash(password, 10);
};

// Compare Password
export const comparePassword = async (plainPassword: string, hashedPassword: string) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};
