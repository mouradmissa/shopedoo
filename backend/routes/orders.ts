import express, { Router, Response } from 'express';
import { randomUUID } from 'crypto';
import { Types } from 'mongoose';
import Order from '../models/Order';
import Cart from '../models/Cart';
import Product from '../models/Product';
import { authMiddleware, adminMiddleware, cashierOrAdminMiddleware, AuthRequest } from '../middleware/auth';
import { getManagerStoreId, resolveStoreIdFromProductIds } from '../utils/orderStore';

const router: Router = express.Router();
const STORE_PICKUP = 'Retrait en magasin - Caisse shopedoo';
const TAX_RATE = 0.1;

const orderListPopulate = [
  { path: 'userId', select: 'name email' },
  { path: 'storeId', select: 'name city governorate' },
  { path: 'confirmedByUserId', select: 'name' },
  { path: 'items.productId', select: 'name price storeId' },
];

// Caissier : confirmer paiement facture QR (avant /:id)
router.post('/cashier/invoice/confirm', authMiddleware, cashierOrAdminMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const invoiceQrCode =
      (typeof req.body?.invoiceQrCode === 'string' ? req.body.invoiceQrCode.trim() : '') ||
      (typeof req.params?.qrCode === 'string' ? req.params.qrCode : '');

    if (!invoiceQrCode) {
      res.status(400).json({ error: 'Code facture requis' });
      return;
    }

    const order = await Order.findOne({ invoiceQrCode }).populate('items.productId');
    if (!order) {
      res.status(404).json({ error: 'Facture introuvable' });
      return;
    }

    if (!['cash_register', 'cash'].includes(order.paymentMethod)) {
      res.status(400).json({ error: "Cette commande n'est pas un paiement à la caisse" });
      return;
    }

    if (order.status === 'paid') {
      res.status(400).json({ error: 'Cette facture a déjà été payée' });
      return;
    }

    if (order.status === 'cancelled') {
      res.status(400).json({ error: 'Cette commande a été annulée' });
      return;
    }

    for (const item of order.items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        res.status(400).json({ error: 'Produit introuvable' });
        return;
      }
      if (product.stock < item.quantity) {
        res.status(400).json({ error: `Stock insuffisant pour ${product.name}` });
        return;
      }
      product.stock -= item.quantity;
      await product.save();
    }

    order.status = 'paid';
    order.paidAt = new Date();

    if (req.user?.storeId) {
      order.storeId = new Types.ObjectId(req.user.storeId);
    } else if (!order.storeId) {
      const fromProducts = await resolveStoreIdFromProductIds(
        order.items.map((item) => item.productId as unknown as string)
      );
      if (fromProducts) order.storeId = fromProducts;
    }

    if (req.user?.userId) {
      order.confirmedByUserId = new Types.ObjectId(req.user.userId);
    }

    await order.save();
    await order.populate(orderListPopulate);

    res.json({
      success: true,
      message: 'Paiement en espèces confirmé',
      order,
    });
  } catch (error) {
    res.status(500).json({ error: 'Échec de la confirmation', details: String(error) });
  }
});

// Gérant : paiements et commandes de sa boutique
router.get('/manager/mine', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'manager') {
      res.status(403).json({ error: 'Accès réservé au gérant' });
      return;
    }

    const storeId = await getManagerStoreId(req.user.userId);
    if (!storeId) {
      res.status(404).json({ error: 'Aucune boutique assignée' });
      return;
    }

    const { status } = req.query;
    const filter: Record<string, unknown> = { storeId };

    if (status && typeof status === 'string') {
      filter.status = status;
    }

    const orders = await Order.find(filter)
      .populate(orderListPopulate)
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Impossible de charger les paiements boutique', details: String(error) });
  }
});

// Get user's orders
router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orders = await Order.find({ userId: req.user?.userId })
      .populate('items.productId')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get single order
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id).populate(orderListPopulate);

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    const isOwner = order.userId.toString() === req.user?.userId;
    const isStaff = ['admin', 'cashier'].includes(req.user?.role ?? '');

    if (req.user?.role === 'manager') {
      const managerStoreId = await getManagerStoreId(req.user.userId);
      const orderStoreId = order.storeId ? String(order.storeId) : null;
      if (!managerStoreId || orderStoreId !== String(managerStoreId)) {
        res.status(403).json({ error: 'Unauthorized' });
        return;
      }
    } else if (!isOwner && !isStaff) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Create order from cart
router.post('/checkout', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { shippingAddress, paymentMethod } = req.body;

    if (!paymentMethod) {
      res.status(400).json({ error: 'Missing payment method' });
      return;
    }

    const isCashRegister = paymentMethod === 'cash_register';
    const isOnline = paymentMethod === 'online';
    const needsAddress = ['online', 'cash_delivery', 'stripe', 'cash'].includes(paymentMethod);

    if (needsAddress && !shippingAddress?.trim()) {
      res.status(400).json({ error: "L'adresse de livraison est requise" });
      return;
    }

    const cart = await Cart.findOne({ userId: req.user?.userId }).populate('items.productId');

    if (!cart || cart.items.length === 0) {
      res.status(400).json({ error: 'Cart is empty' });
      return;
    }

    let subtotal = 0;
    const items = [];

    for (const cartItem of cart.items) {
      const product = cartItem.productId as any;

      if (!product) {
        res.status(400).json({ error: 'Product not found' });
        return;
      }

      if (product.stock < cartItem.quantity) {
        res.status(400).json({ error: `Insufficient stock for ${product.name}` });
        return;
      }

      subtotal += product.price * cartItem.quantity;
      items.push({
        productId: product._id,
        quantity: cartItem.quantity,
        price: product.price,
      });

      if (!isCashRegister && !isOnline) {
        product.stock -= cartItem.quantity;
        await product.save();
      }
    }

    const taxAmount = Math.round(subtotal * TAX_RATE * 100) / 100;
    const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;

    const productIds = items.map((item) => item.productId);
    const storeId = await resolveStoreIdFromProductIds(productIds);

    const order = new Order({
      userId: req.user?.userId,
      items,
      subtotal,
      taxAmount,
      totalAmount,
      status: 'pending',
      paymentMethod,
      storeId: storeId ?? undefined,
      shippingAddress: isCashRegister ? STORE_PICKUP : shippingAddress.trim(),
      ...(isCashRegister ? { invoiceQrCode: `SHOPEDOO-INV-${randomUUID()}` } : {}),
    });

    await order.save();

    // Panier conservé pour paiement en ligne jusqu'à confirmation Stripe
    if (!isOnline) {
      cart.items = [];
      await cart.save();
    }

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create order', details: String(error) });
  }
});

// Admin: Get all orders
router.get('/admin/all', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.query;

    const filter: any = {};
    if (status) filter.status = status;

    const orders = await Order.find(filter)
      .populate(orderListPopulate)
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Admin: Update order status
router.put('/:id/status', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.body;

    if (!['pending', 'paid', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('items.productId');

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order' });
  }
});

export default router;
