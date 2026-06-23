import express, { Router, Response } from 'express';
import Product from '../models/Product';
import QRCode from '../models/QRCode';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middleware/auth';
import { generateProductQrImage, ensureProductQrImage, getProductPageUrl } from '../utils/productQr';
import { v4 as uuidv4 } from 'uuid';

const router: Router = express.Router();

// Get all products
router.get('/', async (req: express.Request, res: Response): Promise<void> => {
  try {
    const { category, search } = req.query;

    const filter: any = {};
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const products = await Product.find(filter).select('-__v -qrCodeImage');
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Image QR produit (PNG)
router.get('/:id/qr-image', async (req: express.Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    await ensureProductQrImage(product);
    if (!product.qrCodeImage) {
      res.status(404).json({ error: 'QR image not available' });
      return;
    }

    const base64 = product.qrCodeImage.replace(/^data:image\/png;base64,/, '');
    const buffer = Buffer.from(base64, 'base64');

    res.set('Content-Type', 'image/png');
    res.set('Content-Disposition', `inline; filename="qr-${product.qrCode}.png"`);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch QR image' });
  }
});

// Get single product
router.get('/:id', async (req: express.Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id).select('-__v');
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    await ensureProductQrImage(product);
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Search product by QR code
router.get('/qr/:qrCode', async (req: express.Request, res: Response): Promise<void> => {
  try {
    const qrRecord = await QRCode.findOne({ code: req.params.qrCode }).populate('productId');

    if (!qrRecord) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    // Increment scan count
    qrRecord.scans += 1;
    qrRecord.lastScannedAt = new Date();
    await qrRecord.save();

    res.json(qrRecord.productId);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Admin: Create product
router.post('/', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, price, category, stock, image } = req.body;

    if (!name || !description || !price || !category) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const product = new Product({
      name,
      description,
      price,
      category,
      stock: stock || 0,
      image,
    });

    await product.save();

    const code = `SHOPEDOO-${uuidv4()}`;
    const payload = getProductPageUrl(String(product._id));
    const qrCodeImage = await generateProductQrImage(payload);

    const qrCode = new QRCode({
      productId: product._id,
      code,
    });

    await qrCode.save();

    product.qrCode = code;
    product.qrCodePayload = payload;
    product.qrCodeImage = qrCodeImage;
    await product.save();

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create product', details: String(error) });
  }
});

// Admin: Update product
router.put('/:id', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, price, category, stock, image } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    if (name) product.name = name;
    if (description) product.description = description;
    if (price !== undefined) product.price = price;
    if (category) product.category = category;
    if (stock !== undefined) product.stock = stock;
    if (image) product.image = image;

    await product.save();
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Admin: Delete product
router.delete('/:id', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    // Delete associated QR code
    await QRCode.deleteOne({ productId: product._id });

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;
