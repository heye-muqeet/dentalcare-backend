import db from '@/lib/prisma';
import jwt from 'jsonwebtoken';

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

// Delete existing token
const deleteToken = async (userId, deviceToken) => {
    try {
        return await db.user_devices.deleteMany({
            where: {    
                user_id: userId,
                device_token: deviceToken,
            },
        });
    } catch (error) {
        console.error('Error deleting token:', error.message);
        throw new Error(`Failed to delete token for user ${userId}`);
    }
};

// Save tokens in the database
const saveTokens = async ({
    userId,
    accessToken,
    refreshToken,
    deviceToken,
    deviceId,
    deviceType,
}) => {
    try {
        // const expirySeconds = parseExpiryToSeconds(ACCESS_TOKEN_EXPIRY);

        const token = await db.user_devices.create({
            data: {
                user_id: userId,
                access_token: accessToken,
                refresh_token: refreshToken,
                device_token: deviceToken,
                device_id: deviceId,
                device_type: deviceType,
            },
        });

        return token.access_token
    } catch (error) {
        console.error('Error saving tokens:', error.message);
        throw new Error(`Failed to save tokens for user ${userId}`);
    }
};

// Generate tokens
export const generateTokens = async ({ userId, deviceToken, deviceId, deviceType }) => {
    try {
        const existingRecord = await db.user_devices.findFirst({
            where: {
                user_id: userId,
                device_token: deviceToken,
            },
        });
        if (existingRecord) await deleteToken(userId, deviceToken);

        const accessToken = generateAccessToken(userId);
        const refreshToken = generateRefreshToken(userId);

        return await saveTokens({ userId, accessToken, refreshToken, deviceToken, deviceId, deviceType });
    } catch (error) {
        console.error('Error generating tokens:', error.message);
        throw new Error('Failed to generate tokens');
    }
};

export const updateAccessToken = async ({ userId, accessToken }) => {
    try {
        // Find user device by current access token
        const userDevice = await db.user_devices.findFirst({
            where: {
                user_id: userId,
                access_token: accessToken,
            },
        });
        if (!userDevice) {
            throw new Error('Invalid access token or user');
        }
        // Generate new access token
        const newAccessToken = generateAccessToken(userId);

        const device = await db.user_devices.update({
            where: {
                id: userDevice.id,
                access_token: userDevice.access_token
            },
            data: {
                access_token: newAccessToken,
            },
        });

        return device;
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