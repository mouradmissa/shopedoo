import express, { Router, Response } from 'express';
import User, { IUser } from '../models/User';
import Store from '../models/Store';
import { generateToken } from '../utils/jwt';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router: Router = express.Router();

interface SignUpBody {
  email: string;
  password: string;
  name: string;
}

interface SignInBody {
  email: string;
  password: string;
}

router.post('/signup', async (req: express.Request, res: Response): Promise<void> => {
  try {
    const { email, password, name } = req.body as SignUpBody;

    if (!email || !password || !name) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ error: 'Email already registered' });
      return;
    }

    const user = new User({ email, password, name, role: 'customer' });
    await user.save();

    const token = generateToken({
      userId: String(user._id),
      email: user.email,
      role: user.role,
      storeId: user.storeId ? String(user.storeId) : undefined,
    });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        storeId: user.storeId,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Signup failed', details: String(error) });
  }
});

router.post('/signin', async (req: express.Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as SignInBody;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = generateToken({
      userId: String(user._id),
      email: user.email,
      role: user.role,
      storeId: user.storeId ? String(user.storeId) : undefined,
    });

    let store = null;
    if (user.role === 'manager') {
      store = await Store.findOne({ managerId: user._id }).select('name city governorate address');
    } else if (user.storeId) {
      store = await Store.findById(user.storeId).select('name city governorate address');
    }

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        storeId: user.storeId,
        store,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Signin failed', details: String(error) });
  }
});

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?.userId).select('-password');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    let store = null;
    if (user.role === 'manager') {
      store = await Store.findOne({ managerId: user._id }).select('name city governorate address _id');
    } else if (user.storeId) {
      store = await Store.findById(user.storeId).select('name city governorate address _id');
    }

    res.json({
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      storeId: user.storeId,
      phone: user.phone,
      address: user.address,
      store,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router;
