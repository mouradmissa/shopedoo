import jwt from 'jsonwebtoken';

export type AppRole = 'admin' | 'manager' | 'cashier' | 'customer' | 'online_manager' | 'driver';

export interface TokenPayload {
  userId: string;
  email: string;
  role: AppRole;
  storeId?: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key';
const TOKEN_EXPIRY = '7d';

export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
};

export const verifyToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

export const decodeToken = (token: string): TokenPayload | null => {
  try {
    return jwt.decode(token) as TokenPayload;
  } catch {
    return null;
  }
};
