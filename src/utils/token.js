import jwt from 'jsonwebtoken';
import db from './prisma';

// Environment variables
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY;
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY;

// Validate environment variables
if (!ACCESS_TOKEN_SECRET || !REFRESH_TOKEN_SECRET) {
    throw new Error('ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET must be defined in the environment variables');
}

if (!ACCESS_TOKEN_EXPIRY || !REFRESH_TOKEN_EXPIRY) {
    throw new Error('ACCESS_TOKEN_EXPIRY and REFRESH_TOKEN_EXPIRY must be defined in the environment variables');
}

// Generate access token
const generateAccessToken = (userId) => {
    return jwt.sign({ userId }, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
};

// Generate refresh token
const generateRefreshToken = (userId) => {
    return jwt.sign({ userId }, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
};

// Save tokens in the database
const saveTokens = async ({
    userId,
    accessToken,
    refreshToken,
}) => {
    try {
        const token = await db.token.create({
            data: {
                user_id: userId,
                access_token: accessToken,
                refresh_token: refreshToken,
            },
        });

        return token.access_token
    } catch (error) {
        console.error('Error saving tokens:', error.message);
        throw new Error(`Failed to save tokens for user ${userId}`);
    }
};

// Generate tokens
export const generateTokens = async ({ userId }) => {
    try {
        const accessToken = generateAccessToken(userId);
        const refreshToken = generateRefreshToken(userId);

        return await saveTokens({ userId, accessToken, refreshToken });
    } catch (error) {
        console.error('Error generating tokens:', error.message);
        throw new Error('Failed to generate tokens');
    }
};

export const updateAccessToken = async ({ userId, accessToken }) => {
    try {
        // Find user device by current access token
        const token = await db.token.findFirst({
            where: {
                user_id: userId,
                access_token: accessToken,
            },
        });
        if (!token) {
            throw new Error('Invalid access token or user');
        }
        // Generate new access token
        const newAccessToken = generateAccessToken(userId);

        const newToken = await db.user_devices.update({
            where: {
                id: token.id,
            },
            data: {
                access_token: newAccessToken,
            },
        });

        return newToken;
    } catch (error) {
        console.error('Access token update failed:', error.message);
        throw new Error('Token refresh failed: ' + error.message);
    }
};

// Cleanup database connections on app exit
process.on('SIGINT', async () => {
    console.log('Closing database connection...');
    await db.$disconnect();
    process.exit(0);
});