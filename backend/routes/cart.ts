import express, { Router, Response } from 'express';
import { Types } from 'mongoose';
import Cart from '../models/Cart';
import Product from '../models/Product';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router: Router = express.Router();

// Get user's cart
router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let cart = await Cart.findOne({ userId: req.user?.userId }).populate('items.productId');

    if (!cart) {
      cart = new Cart({ userId: req.user?.userId, items: [] });
      await cart.save();
    }

    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

// Add item to cart
router.post('/add', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || !quantity || quantity < 1) {
      res.status(400).json({ error: 'Invalid product or quantity' });
      return;
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    let cart = await Cart.findOne({ userId: req.user?.userId });

    if (!cart) {
      cart = new Cart({ userId: req.user?.userId, items: [] });
    }

    // Check if product already in cart
    const existingItem = cart.items.find((item) => item.productId.toString() === productId);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ productId, quantity });
    }

    await cart.save();
    await cart.populate('items.productId');

    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add item to cart' });
  }
});

// Remove item from cart
router.post('/remove/:productId', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;

    const cart = await Cart.findOne({ userId: req.user?.userId });

    if (!cart) {
      res.status(404).json({ error: 'Cart not found' });
      return;
    }

    cart.items = cart.items.filter((item) => item.productId.toString() !== productId);
    await cart.save();
    await cart.populate('items.productId');

    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove item from cart' });
  }
});

// Update item quantity
router.put('/update/:productId', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      res.status(400).json({ error: 'Invalid quantity' });
      return;
    }

    const cart = await Cart.findOne({ userId: req.user?.userId });

    if (!cart) {
      res.status(404).json({ error: 'Cart not found' });
      return;
    }

    const item = cart.items.find((item) => item.productId.toString() === productId);

    if (!item) {
      res.status(404).json({ error: 'Item not found in cart' });
      return;
    }

    item.quantity = quantity;
    await cart.save();
    await cart.populate('items.productId');

    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update cart' });
  }
});

// Fusionner un panier local (après reconnexion)
router.post('/sync', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { items } = req.body as { items?: Array<{ productId: string; quantity: number }> };

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Aucun article à synchroniser' });
      return;
    }

    let cart = await Cart.findOne({ userId: req.user?.userId });
    if (!cart) {
      cart = new Cart({ userId: req.user?.userId, items: [] });
    }

    for (const row of items) {
      if (!row.productId || !row.quantity || row.quantity < 1) continue;

      const product = await Product.findById(row.productId);
      if (!product) continue;

      const existing = cart.items.find((item) => item.productId.toString() === row.productId);
      if (existing) {
        existing.quantity = Math.max(existing.quantity, row.quantity);
      } else {
        cart.items.push({ productId: new Types.ObjectId(row.productId), quantity: row.quantity });
      }
    }

    await cart.save();
    await cart.populate('items.productId');

    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: 'Failed to sync cart' });
  }
});

// Clear cart
router.delete('/clear', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const cart = await Cart.findOne({ userId: req.user?.userId });

    if (!cart) {
      res.status(404).json({ error: 'Cart not found' });
      return;
    }

    cart.items = [];
    await cart.save();

    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

export default router;
