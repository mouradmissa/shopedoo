import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt';

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const optionalAuthMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    try {
      req.user = verifyToken(token);
    } catch {
    }
  }
  next();
};

export const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
};

export const managerOrAdminMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!['admin', 'manager'].includes(req.user?.role ?? '')) {
    res.status(403).json({ error: 'Accès gérant ou admin requis' });
    return;
  }
  next();
};

export const cashierOrAdminMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!['admin', 'cashier', 'manager'].includes(req.user?.role ?? '')) {
    res.status(403).json({ error: 'Accès caissier, gérant ou admin requis' });
    return;
  }
  next();
};

export const onlineManagerOrAdminMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!['admin', 'online_manager'].includes(req.user?.role ?? '')) {
    res.status(403).json({ error: 'Accès responsable en ligne ou admin requis' });
    return;
  }
  next();
};

export const driverMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'driver') {
    res.status(403).json({ error: 'Accès livreur requis' });
    return;
  }
  next();
};

export const onlineManagerAdminOrDriverMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!['admin', 'online_manager', 'driver'].includes(req.user?.role ?? '')) {
    res.status(403).json({ error: 'Accès non autorisé' });
    return;
  }
  next();
};
