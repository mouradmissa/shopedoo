import jwt from 'jsonwebtoken';

interface TokenPayload {
  userId: string;
  email: string;
  role: 'admin' | 'cashier' | 'customer';
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
