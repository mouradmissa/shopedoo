import express, { Router, Response } from 'express';
import Product from '../models/Product';
import QRCode from '../models/QRCode';
import {
  authMiddleware,
  adminMiddleware,
  managerOrAdminMiddleware,
  optionalAuthMiddleware,
  AuthRequest,
} from '../middleware/auth';
import { generateProductQrImage, ensureProductQrImage, getProductPageUrl } from '../utils/productQr';
import { buildProductCatalog, getProductWithAvailability } from '../utils/productCatalog';
import { resolveUserStoreId } from '../utils/storeAccess';
import { v4 as uuidv4 } from 'uuid';

const router: Router = express.Router();

async function createProductWithQr(
  data: {
    name: string;
    description: string;
    price: number;
    category: string;
    stock: number;
    image?: string;
    storeId?: string;
  },
  res: Response
) {
  const product = new Product(data);
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
}

// Catalog for shop: grouped availability per Tunisia store
router.get('/catalog/list', async (req: express.Request, res: Response): Promise<void> => {
  try {
    const { category, search } = req.query;
    const filter: Record<string, unknown> = {};

    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const catalog = await buildProductCatalog(filter);
    res.json(catalog);
  } catch {
    res.status(500).json({ error: 'Failed to fetch product catalog' });
  }
});

// Get all products (scoped for staff)
router.get('/', optionalAuthMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { category, search, storeId } = req.query;

    const filter: Record<string, unknown> = {};
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (storeId) {
      filter.storeId = storeId;
    } else if (req.user?.role === 'cashier' && req.user.storeId) {
      filter.storeId = req.user.storeId;
    } else if (req.user?.role === 'manager') {
      const managerStoreId = await resolveUserStoreId(req);
      if (managerStoreId) filter.storeId = managerStoreId;
    }

    const products = await Product.find(filter)
      .populate('storeId', 'name city governorate')
      .select('-__v -qrCodeImage');
    res.json(products);
  } catch {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.get('/qr/:qrCode', async (req: express.Request, res: Response): Promise<void> => {
  try {
    const qrRecord = await QRCode.findOne({ code: req.params.qrCode }).populate('productId');

    if (!qrRecord) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    qrRecord.scans += 1;
    qrRecord.lastScannedAt = new Date();
    await qrRecord.save();

    res.json(qrRecord.productId);
  } catch {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

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
  } catch {
    res.status(500).json({ error: 'Failed to fetch QR image' });
  }
});

router.get('/:id', async (req: express.Request, res: Response): Promise<void> => {
  try {
    const result = await getProductWithAvailability(String(req.params.id));
    if (!result) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    await ensureProductQrImage(result.product);

    const productJson = result.product.toObject();
    res.json({
      ...productJson,
      storeAvailability: result.storeAvailability,
      totalStock: result.storeAvailability.reduce((sum, row) => sum + row.stock, 0),
    });
  } catch {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

router.post('/', authMiddleware, managerOrAdminMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, price, category, stock, image, storeId } = req.body;

    if (!name || !description || price === undefined || !category) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    let targetStoreId = storeId as string | undefined;

    if (req.user?.role === 'manager') {
      targetStoreId = (await resolveUserStoreId(req)) ?? undefined;
      if (!targetStoreId) {
        res.status(400).json({ error: 'Aucune boutique assignée au gérant' });
        return;
      }
    } else if (!targetStoreId) {
      res.status(400).json({ error: 'storeId requis pour créer un produit' });
      return;
    }

    await createProductWithQr(
      {
        name,
        description,
        price,
        category,
        stock: stock || 0,
        image,
        storeId: targetStoreId,
      },
      res
    );
  } catch (error) {
    res.status(500).json({ error: 'Failed to create product', details: String(error) });
  }
});

router.put('/:id', authMiddleware, managerOrAdminMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, price, category, stock, image } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    if (req.user?.role === 'manager') {
      const managerStoreId = await resolveUserStoreId(req);
      if (!managerStoreId || String(product.storeId) !== managerStoreId) {
        res.status(403).json({ error: 'Produit hors de votre boutique' });
        return;
      }
    }

    if (name) product.name = name;
    if (description) product.description = description;
    if (price !== undefined) product.price = price;
    if (category) product.category = category;
    if (stock !== undefined) product.stock = stock;
    if (image) product.image = image;

    await product.save();
    res.json(product);
  } catch {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

router.delete('/:id', authMiddleware, managerOrAdminMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    if (req.user?.role === 'manager') {
      const managerStoreId = await resolveUserStoreId(req);
      if (!managerStoreId || String(product.storeId) !== managerStoreId) {
        res.status(403).json({ error: 'Produit hors de votre boutique' });
        return;
      }
    }

    await Product.findByIdAndDelete(req.params.id);
    await QRCode.deleteOne({ productId: product._id });

    res.json({ message: 'Product deleted successfully' });
  } catch {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;
