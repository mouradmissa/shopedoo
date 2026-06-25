import express, { Router, Response } from 'express';
import CatalogProduct from '../models/CatalogProduct';
import Product from '../models/Product';
import {
  authMiddleware,
  onlineManagerOrAdminMiddleware,
  optionalAuthMiddleware,
  AuthRequest,
} from '../middleware/auth';
import { productImageUpload } from '../middleware/upload';
import {
  buildCatalogProductImageUrl,
  sanitizeCatalogProductForClient,
} from '../utils/catalogImage';
import { hasStoredImage } from '../utils/productImage';

const router: Router = express.Router();

const LIST_SELECT = '-__v -imageData';

async function attachUploadedImage(
  catalog: InstanceType<typeof CatalogProduct>,
  file?: Express.Multer.File
) {
  if (!file?.buffer?.length) return;

  catalog.imageData = file.buffer;
  catalog.imageMimeType = file.mimetype;
  catalog.imageStored = true;
  catalog.image = buildCatalogProductImageUrl(catalog._id);
  await catalog.save();
}

router.get('/', optionalAuthMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { category, search } = req.query;
    const filter: Record<string, unknown> = { isActive: true };

    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (req.user?.role !== 'admin' && req.user?.role !== 'online_manager') {
      filter.isActive = true;
    }

    const items = await CatalogProduct.find(filter).select(LIST_SELECT).sort({ name: 1 });
    res.json(items.map((item) => sanitizeCatalogProductForClient(item)));
  } catch {
    res.status(500).json({ error: 'Impossible de charger le catalogue en ligne' });
  }
});

router.get('/:id/image', async (req: express.Request, res: Response): Promise<void> => {
  try {
    const catalog = await CatalogProduct.findById(req.params.id).select(
      'imageData imageMimeType image'
    );
    if (!catalog) {
      res.status(404).json({ error: 'Produit introuvable' });
      return;
    }

    if (hasStoredImage(catalog)) {
      res.set('Content-Type', catalog.imageMimeType || 'image/jpeg');
      res.set('Cache-Control', 'public, max-age=86400, immutable');
      res.send(catalog.imageData);
      return;
    }

    if (catalog.image?.startsWith('http://') || catalog.image?.startsWith('https://')) {
      res.redirect(catalog.image);
      return;
    }

    res.status(404).json({ error: 'Image non disponible' });
  } catch {
    res.status(500).json({ error: 'Impossible de charger l\'image' });
  }
});

router.get('/:id', async (req: express.Request, res: Response): Promise<void> => {
  try {
    const catalog = await CatalogProduct.findById(req.params.id).select(LIST_SELECT);
    if (!catalog) {
      res.status(404).json({ error: 'Produit catalogue introuvable' });
      return;
    }
    res.json(sanitizeCatalogProductForClient(catalog));
  } catch {
    res.status(500).json({ error: 'Impossible de charger le produit catalogue' });
  }
});

router.post(
  '/',
  authMiddleware,
  onlineManagerOrAdminMiddleware,
  productImageUpload.single('image'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { name, description, price, category, stock } = req.body;

      if (!name || !description || price === undefined || !category) {
        res.status(400).json({ error: 'Champs obligatoires manquants' });
        return;
      }

      const catalog = new CatalogProduct({
        name,
        description,
        price: parseFloat(String(price)),
        category,
        stock: stock !== undefined ? parseInt(String(stock), 10) || 0 : 0,
        createdBy: req.user?.userId,
      });
      await catalog.save();
      await attachUploadedImage(catalog, req.file);

      res.status(201).json(sanitizeCatalogProductForClient(catalog));
    } catch (error) {
      res.status(500).json({ error: 'Impossible de créer le produit en ligne', details: String(error) });
    }
  }
);

router.put(
  '/:id',
  authMiddleware,
  onlineManagerOrAdminMiddleware,
  productImageUpload.single('image'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const catalog = await CatalogProduct.findById(req.params.id);
      if (!catalog) {
        res.status(404).json({ error: 'Produit catalogue introuvable' });
        return;
      }

      const { name, description, price, category, stock, isActive } = req.body;
      if (name) catalog.name = name;
      if (description) catalog.description = description;
      if (price !== undefined) catalog.price = parseFloat(String(price));
      if (category) catalog.category = category;
      if (stock !== undefined) catalog.stock = parseInt(String(stock), 10) || 0;
      if (isActive !== undefined) catalog.isActive = isActive === 'true' || isActive === true;

      await catalog.save();
      if (req.file) await attachUploadedImage(catalog, req.file);

      res.json(sanitizeCatalogProductForClient(catalog));
    } catch {
      res.status(500).json({ error: 'Impossible de mettre à jour le produit catalogue' });
    }
  }
);

router.delete(
  '/:id',
  authMiddleware,
  onlineManagerOrAdminMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const catalog = await CatalogProduct.findById(req.params.id);
      if (!catalog) {
        res.status(404).json({ error: 'Produit catalogue introuvable' });
        return;
      }

      const linkedCount = await Product.countDocuments({ catalogProductId: catalog._id });
      if (linkedCount > 0) {
        catalog.isActive = false;
        await catalog.save();
        res.json({ message: 'Produit désactivé (stock boutique existant)' });
        return;
      }

      await CatalogProduct.findByIdAndDelete(catalog._id);
      res.json({ message: 'Produit catalogue supprimé' });
    } catch {
      res.status(500).json({ error: 'Impossible de supprimer le produit catalogue' });
    }
  }
);

export default router;
