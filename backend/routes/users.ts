import express, { Router, Response } from 'express';
import User from '../models/User';
import {
  authMiddleware,
  adminMiddleware,
  onlineManagerOrAdminMiddleware,
  AuthRequest,
} from '../middleware/auth';

const router: Router = express.Router();

router.get(
  '/drivers',
  authMiddleware,
  onlineManagerOrAdminMiddleware,
  async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
      const drivers = await User.find({ role: 'driver' }).select('-password').sort({ name: 1 });
      res.json(drivers);
    } catch {
      res.status(500).json({ error: 'Impossible de charger les livreurs' });
    }
  }
);

router.get('/', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const filter: Record<string, unknown> = { role: 'online_manager' };
    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch {
    res.status(500).json({ error: 'Impossible de charger les utilisateurs' });
  }
});

router.post('/', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone } = req.body as {
      name?: string;
      email?: string;
      password?: string;
      phone?: string;
      role?: string;
    };

    if (!name || !email || !password) {
      res.status(400).json({ error: 'Nom, email et mot de passe requis' });
      return;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(400).json({ error: 'Cet email est déjà utilisé' });
      return;
    }

    const user = new User({
      name,
      email,
      password,
      role: 'online_manager',
      phone,
    });
    await user.save();

    const safe = await User.findById(user._id).select('-password');
    res.status(201).json(safe);
  } catch (error) {
    res.status(500).json({ error: 'Impossible de créer l\'utilisateur', details: String(error) });
  }
});

router.post(
  '/drivers',
  authMiddleware,
  onlineManagerOrAdminMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { name, email, password, phone } = req.body as {
        name?: string;
        email?: string;
        password?: string;
        phone?: string;
      };

      if (!name || !email || !password) {
        res.status(400).json({ error: 'Nom, email et mot de passe requis' });
        return;
      }

      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        res.status(400).json({ error: 'Cet email est déjà utilisé' });
        return;
      }

      const driver = new User({
        name,
        email,
        password,
        role: 'driver',
        phone,
      });
      await driver.save();

      const safe = await User.findById(driver._id).select('-password');
      res.status(201).json(safe);
    } catch (error) {
      res.status(500).json({ error: 'Impossible de créer le livreur', details: String(error) });
    }
  }
);

export default router;
