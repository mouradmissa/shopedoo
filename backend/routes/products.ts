import express, { Router, Response } from 'express';
import Product from '../models/Product';
import CatalogProduct from '../models/CatalogProduct';
import QRCode from '../models/QRCode';
import {
  authMiddleware,
  managerOrAdminMiddleware,
  optionalAuthMiddleware,
  AuthRequest,
} from '../middleware/auth';
import { productImageUpload } from '../middleware/upload';
import { ensureProductQr } from '../utils/productQr';
import { buildProductCatalog, getProductWithAvailability } from '../utils/productCatalog';
import { resolveUserStoreId } from '../utils/storeAccess';
import {
  buildProductImageUrl,
  hasStoredImage,
  sanitizeProductForClient,
} from '../utils/productImage';
import type { ICatalogProduct } from '../models/CatalogProduct';
import { buildCatalogProductImageUrl } from '../utils/catalogImage';

const router: Router = express.Router();

const PRODUCT_LIST_SELECT = '-__v -qrCodeImage -imageData';

async function attachUploadedImage(
  product: InstanceType<typeof Product>,
  file?: Express.Multer.File
) {
  if (!file?.buffer?.length) return;

  product.imageData = file.buffer;
  product.imageMimeType = file.mimetype;
  product.imageStored = true;
  product.image = buildProductImageUrl(product._id);
  await product.save();
}

async function copyCatalogImageToProduct(
  product: InstanceType<typeof Product>,
  catalog: Pick<ICatalogProduct, 'imageData' | 'imageMimeType' | 'imageStored' | 'image'>
) {
  if (hasStoredImage(catalog)) {
    product.imageData = catalog.imageData;
    product.imageMimeType = catalog.imageMimeType || 'image/jpeg';
    product.imageStored = true;
    product.image = buildProductImageUrl(product._id);
    await product.save();
    return;
  }

  if (catalog.image) {
    product.image = catalog.image;
    product.imageStored = false;
    product.imageData = undefined;
    await product.save();
  }
}

async function createProductWithQr(
  data: {
    name: string;
    description: string;
    price: number;
    category: string;
    stock: number;
    storeId?: string;
    catalogProductId?: string;
  },
  file: Express.Multer.File | undefined,
  res: Response,
  catalogForImage?: Pick<ICatalogProduct, 'imageData' | 'imageMimeType' | 'imageStored' | 'image'>
) {
  const product = new Product(data);
  await product.save();

  if (file) {
    await attachUploadedImage(product, file);
  } else if (catalogForImage) {
    await copyCatalogImageToProduct(product, catalogForImage);
  }

  await ensureProductQr(product);

  const fresh = await Product.findById(product._id);
  res.status(201).json(sanitizeProductForClient(fresh ?? product));
}

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
      .select(PRODUCT_LIST_SELECT)
      .lean();

    res.json(
      products.map((product) => sanitizeProductForClient(product as { _id: unknown }))
    );
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

    const populated = qrRecord.productId as unknown;
    if (!populated || typeof populated !== 'object' || !('toObject' in populated)) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    res.json(sanitizeProductForClient(populated as { _id: unknown; toObject?: () => Record<string, unknown> }));
  } catch {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

router.get('/:id/image', async (req: express.Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id).select('imageData imageMimeType image');
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    if (hasStoredImage(product)) {
      res.set('Content-Type', product.imageMimeType || 'image/jpeg');
      res.set('Cache-Control', 'public, max-age=86400, immutable');
      res.send(product.imageData);
      return;
    }

    if (product.image?.startsWith('http://') || product.image?.startsWith('https://')) {
      res.redirect(product.image);
      return;
    }

    res.status(404).json({ error: 'Image not available' });
  } catch {
    res.status(500).json({ error: 'Failed to fetch product image' });
  }
});

router.get('/:id/qr-image', async (req: express.Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    await ensureProductQr(product);
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

    if (!result.isCatalogEntry) {
      await ensureProductQr(result.product as InstanceType<typeof Product>);
    }

    const productJson = sanitizeProductForClient(
      result.product as { _id: unknown; toObject?: () => Record<string, unknown> }
    );
    res.json({
      ...productJson,
      catalogProductId: result.isCatalogEntry
        ? String(result.product._id)
        : (productJson.catalogProductId as string | undefined),
      storeAvailability: result.storeAvailability,
      totalStock: result.storeAvailability.reduce((sum, row) => sum + row.stock, 0),
    });
  } catch {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

router.post(
  '/',
  authMiddleware,
  managerOrAdminMiddleware,
  productImageUpload.single('image'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { name, description, price, category, stock, storeId, catalogProductId } = req.body;

      let targetStoreId = storeId as string | undefined;

      if (req.user?.role === 'manager') {
        targetStoreId = (await resolveUserStoreId(req)) ?? undefined;
        if (!targetStoreId) {
          res.status(400).json({ error: 'Aucune boutique assignée au gérant' });
          return;
        }
      } else if (req.user?.role === 'admin' && !targetStoreId) {
        res.status(400).json({ error: 'storeId requis pour créer un produit' });
        return;
      }

      if (catalogProductId) {
        const catalog = await CatalogProduct.findById(catalogProductId);
        if (!catalog) {
          res.status(404).json({ error: 'Produit en ligne introuvable' });
          return;
        }

        if (!targetStoreId) {
          res.status(400).json({ error: 'storeId requis' });
          return;
        }

        const existing = await Product.findOne({ catalogProductId, storeId: targetStoreId });
        if (existing) {
          existing.stock += parseInt(String(stock), 10) || 0;
          if (price !== undefined) existing.price = parseFloat(String(price));
          if (name) existing.name = String(name);
          if (description) existing.description = String(description);
          if (category) existing.category = String(category);
          await existing.save();
          if (req.file) {
            await attachUploadedImage(existing, req.file);
          } else if (!hasStoredImage(existing) && !existing.image) {
            await copyCatalogImageToProduct(existing, catalog);
          }
          await ensureProductQr(existing);
          res.status(200).json(sanitizeProductForClient(existing));
          return;
        }

        await createProductWithQr(
          {
            name: name ? String(name) : catalog.name,
            description: description ? String(description) : catalog.description,
            price: price !== undefined ? parseFloat(String(price)) : catalog.price,
            category: category ? String(category) : catalog.category,
            stock: parseInt(String(stock), 10) || 0,
            storeId: targetStoreId,
            catalogProductId: String(catalogProductId),
          },
          req.file,
          res,
          catalog
        );
        return;
      }

      if (!name || !description || price === undefined || !category) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      if (!targetStoreId) {
        res.status(400).json({ error: 'storeId requis pour créer un produit' });
        return;
      }

      const catalog = new CatalogProduct({
        name,
        description,
        price: parseFloat(String(price)),
        category,
        createdBy: req.user?.userId,
      });
      await catalog.save();

      if (req.file?.buffer?.length) {
        catalog.imageData = req.file.buffer;
        catalog.imageMimeType = req.file.mimetype;
        catalog.imageStored = true;
        catalog.image = buildCatalogProductImageUrl(catalog._id);
        await catalog.save();
      }

      await createProductWithQr(
        {
          name,
          description,
          price: parseFloat(String(price)),
          category,
          stock: parseInt(String(stock), 10) || 0,
          storeId: targetStoreId,
          catalogProductId: String(catalog._id),
        },
        req.file,
        res,
        req.file ? undefined : catalog
      );
    } catch (error) {
      res.status(500).json({ error: 'Failed to create product', details: String(error) });
    }
  }
);

router.put(
  '/:id',
  authMiddleware,
  managerOrAdminMiddleware,
  productImageUpload.single('image'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { name, description, price, category, stock } = req.body;

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
      if (price !== undefined) product.price = parseFloat(String(price));
      if (category) product.category = category;
      if (stock !== undefined) product.stock = parseInt(String(stock), 10);

      await product.save();

      if (req.file) {
        await attachUploadedImage(product, req.file);
      }

      await ensureProductQr(product);

      res.json(sanitizeProductForClient(product));
    } catch {
      res.status(500).json({ error: 'Failed to update product' });
    }
  }
);

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
