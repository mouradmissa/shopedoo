import express, { Router, Response } from 'express';
import { randomUUID } from 'crypto';
import { Types } from 'mongoose';
import Order from '../models/Order';
import Cart from '../models/Cart';
import Product from '../models/Product';
import User from '../models/User';
import { authMiddleware, adminMiddleware, cashierOrAdminMiddleware, onlineManagerOrAdminMiddleware, driverMiddleware, AuthRequest } from '../middleware/auth';
import { getManagerStoreId, resolveStoreIdFromProductIds } from '../utils/orderStore';

const router: Router = express.Router();
const STORE_PICKUP = 'Retrait en magasin - Caisse shopedoo';
const TAX_RATE = 0.1;

const orderListPopulate = [
  { path: 'userId', select: 'name email phone' },
  { path: 'storeId', select: 'name city governorate' },
  { path: 'confirmedByUserId', select: 'name' },
  { path: 'assignedDriverId', select: 'name email phone' },
  { path: 'items.productId', select: 'name price storeId' },
];

const ONLINE_PAYMENT_METHODS = ['cash_delivery', 'online'];

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

router.get('/admin/all', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.query;

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;

    const orders = await Order.find(filter)
      .populate(orderListPopulate)
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

router.delete('/admin/purge', authMiddleware, adminMiddleware, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await Order.deleteMany({});
    res.json({ message: 'Toutes les commandes ont été supprimées', deletedCount: result.deletedCount });
  } catch {
    res.status(500).json({ error: 'Impossible de supprimer les commandes' });
  }
});

router.get('/online/list', authMiddleware, onlineManagerOrAdminMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    const filter: Record<string, unknown> = {
      paymentMethod: { $in: ONLINE_PAYMENT_METHODS },
      shippingAddress: { $ne: STORE_PICKUP },
    };
    if (status) filter.status = status;

    const orders = await Order.find(filter)
      .populate(orderListPopulate)
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch {
    res.status(500).json({ error: 'Impossible de charger les commandes en ligne' });
  }
});

router.get('/driver/mine', authMiddleware, driverMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orders = await Order.find({
      assignedDriverId: req.user?.userId,
      status: 'shipped',
    })
      .populate(orderListPopulate)
      .sort({ assignedAt: -1, createdAt: -1 });

    res.json(orders);
  } catch {
    res.status(500).json({ error: 'Impossible de charger vos livraisons' });
  }
});

router.get('/driver/archive', authMiddleware, driverMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orders = await Order.find({
      assignedDriverId: req.user?.userId,
      status: 'delivered',
    })
      .populate(orderListPopulate)
      .sort({ deliveredAt: -1, updatedAt: -1 });

    res.json(orders);
  } catch {
    res.status(500).json({ error: 'Impossible de charger l\'archive des livraisons' });
  }
});

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

    if (!isOnline) {
      cart.items = [];
      await cart.save();
    }

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create order', details: String(error) });
  }
});

router.put('/:id/assign', authMiddleware, onlineManagerOrAdminMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { driverId } = req.body as { driverId?: string };
    if (!driverId) {
      res.status(400).json({ error: 'Livreur requis' });
      return;
    }

    const driver = await User.findOne({ _id: driverId, role: 'driver' });
    if (!driver) {
      res.status(404).json({ error: 'Livreur introuvable' });
      return;
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404).json({ error: 'Commande introuvable' });
      return;
    }

    if (!ONLINE_PAYMENT_METHODS.includes(order.paymentMethod)) {
      res.status(400).json({ error: 'Cette commande n\'est pas une commande en ligne' });
      return;
    }

    if (!['paid', 'shipped'].includes(order.status)) {
      res.status(400).json({ error: 'Commande non assignable dans cet état' });
      return;
    }

    order.assignedDriverId = driver._id;
    order.assignedAt = new Date();
    if (order.status === 'paid') {
      order.status = 'shipped';
    }
    await order.save();
    await order.populate(orderListPopulate);

    res.json(order);
  } catch {
    res.status(500).json({ error: 'Impossible d\'assigner la commande' });
  }
});

router.put('/:id/driver/delivered', authMiddleware, driverMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404).json({ error: 'Commande introuvable' });
      return;
    }

    if (String(order.assignedDriverId) !== req.user?.userId) {
      res.status(403).json({ error: 'Cette livraison ne vous est pas assignée' });
      return;
    }

    if (!['shipped'].includes(order.status)) {
      res.status(400).json({ error: 'Seules les livraisons en cours peuvent être confirmées' });
      return;
    }

    order.status = 'delivered';
    order.deliveredAt = new Date();
    await order.save();
    await order.populate(orderListPopulate);

    res.json(order);
  } catch {
    res.status(500).json({ error: 'Impossible de confirmer la livraison' });
  }
});

router.put('/:id/status', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const role = req.user?.role;
    if (role !== 'admin' && role !== 'online_manager') {
      res.status(403).json({ error: 'Accès refusé' });
      return;
    }

    const { status } = req.body;

    if (!['pending', 'paid', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    if (role === 'online_manager') {
      if (!ONLINE_PAYMENT_METHODS.includes(order.paymentMethod)) {
        res.status(403).json({ error: 'Commande hors périmètre en ligne' });
        return;
      }
      if (status === 'delivered') {
        res.status(403).json({ error: 'Seul le livreur peut confirmer la livraison' });
        return;
      }
    }

    order.status = status;
    await order.save();
    await order.populate('items.productId');

    res.json(order);
  } catch {
    res.status(500).json({ error: 'Failed to update order' });
  }
});

export default router;
