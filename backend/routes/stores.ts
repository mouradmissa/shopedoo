import express, { Router, Response } from 'express';
import Store from '../models/Store';
import User from '../models/User';
import {
  authMiddleware,
  adminMiddleware,
  managerOrAdminMiddleware,
  AuthRequest,
} from '../middleware/auth';
import { canManageStore, getManagerStoreId } from '../utils/storeAccess';
import { seedTunisiaStores, seedTunisiaCashiers } from '../services/seedTunisiaStores';

const router: Router = express.Router();

// Public: active stores in Tunisia
router.get('/public', async (_req, res: Response): Promise<void> => {
  try {
    const stores = await Store.find({ isActive: true })
      .populate('managerId', 'name email')
      .select('-__v')
      .sort({ governorate: 1, city: 1 });
    res.json(stores);
  } catch {
    res.status(500).json({ error: 'Impossible de charger les boutiques' });
  }
});

// Admin: seed all Tunisia governorates (boutique + gérant)
router.post('/seed/tunisia', authMiddleware, adminMiddleware, async (_req, res: Response): Promise<void> => {
  try {
    const result = await seedTunisiaStores();
    res.json({
      message: `${result.storesCreated} boutique(s), ${result.cashiersCreated} caissier(s), ${result.productsCreated} produit(s) créés`,
      created: result.storesCreated,
      cashiersCreated: result.cashiersCreated,
      productsCreated: result.productsCreated,
      skipped: result.skipped,
      details: result.details,
    });
  } catch (error) {
    res.status(500).json({ error: 'Échec du seed Tunisie', details: String(error) });
  }
});

// Admin: seed cashiers filler for existing Tunisia stores
router.post('/seed/cashiers', authMiddleware, adminMiddleware, async (_req, res: Response): Promise<void> => {
  try {
    const result = await seedTunisiaCashiers();
    res.json({
      message: `${result.cashiersCreated} caissier(s) créé(s)`,
      cashiersCreated: result.cashiersCreated,
      skipped: result.skipped,
      details: result.details,
    });
  } catch (error) {
    res.status(500).json({ error: 'Échec du seed caissiers', details: String(error) });
  }
});

// Admin: list all stores
router.get('/', authMiddleware, adminMiddleware, async (_req, res: Response): Promise<void> => {
  try {
    const stores = await Store.find()
      .populate('managerId', 'name email phone')
      .select('-__v')
      .sort({ createdAt: -1 });
    res.json(stores);
  } catch {
    res.status(500).json({ error: 'Impossible de charger les boutiques' });
  }
});

// Manager: own store
router.get('/my', authMiddleware, managerOrAdminMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role === 'admin') {
      res.status(400).json({ error: 'Utilisez la liste admin des boutiques' });
      return;
    }

    const store = await Store.findOne({ managerId: req.user?.userId }).populate(
      'managerId',
      'name email phone'
    );

    if (!store) {
      res.status(404).json({ error: 'Aucune boutique assignée' });
      return;
    }

    res.json(store);
  } catch {
    res.status(500).json({ error: 'Impossible de charger votre boutique' });
  }
});

// Admin: create store + manager account
router.post('/', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, city, governorate, address, manager } = req.body as {
      name?: string;
      city?: string;
      governorate?: string;
      address?: string;
      manager?: { name?: string; email?: string; password?: string; phone?: string };
    };

    if (!name || !city || !governorate || !address) {
      res.status(400).json({ error: 'Nom, ville, gouvernorat et adresse requis' });
      return;
    }

    if (!manager?.name || !manager?.email || !manager?.password) {
      res.status(400).json({ error: 'Informations du gérant requises (nom, email, mot de passe)' });
      return;
    }

    const existingUser = await User.findOne({ email: manager.email.toLowerCase() });
    if (existingUser) {
      res.status(400).json({ error: 'Cet email gérant est déjà utilisé' });
      return;
    }

    const managerUser = new User({
      name: manager.name,
      email: manager.email,
      password: manager.password,
      role: 'manager',
      phone: manager.phone,
    });
    await managerUser.save();

    const store = new Store({
      name,
      city,
      governorate,
      address,
      managerId: managerUser._id,
    });
    await store.save();

    managerUser.storeId = store._id;
    await managerUser.save();

    const populated = await Store.findById(store._id).populate('managerId', 'name email phone');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ error: 'Impossible de créer la boutique', details: String(error) });
  }
});

// Admin or manager: update store
router.put('/:id', authMiddleware, managerOrAdminMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const storeId = String(req.params.id);
    const allowed = await canManageStore(req, storeId);
    if (!allowed) {
      res.status(403).json({ error: 'Accès refusé à cette boutique' });
      return;
    }

    const { name, city, governorate, address, isActive } = req.body;
    const store = await Store.findById(storeId);
    if (!store) {
      res.status(404).json({ error: 'Boutique introuvable' });
      return;
    }

    if (name) store.name = name;
    if (city) store.city = city;
    if (governorate) store.governorate = governorate;
    if (address) store.address = address;
    if (req.user?.role === 'admin' && typeof isActive === 'boolean') {
      store.isActive = isActive;
    }

    await store.save();
    const populated = await Store.findById(store._id).populate('managerId', 'name email phone');
    res.json(populated);
  } catch {
    res.status(500).json({ error: 'Impossible de mettre à jour la boutique' });
  }
});

// List cashiers for a store
router.get('/:id/cashiers', authMiddleware, managerOrAdminMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const storeId = String(req.params.id);
    const allowed = await canManageStore(req, storeId);
    if (!allowed) {
      res.status(403).json({ error: 'Accès refusé' });
      return;
    }

    const cashiers = await User.find({ role: 'cashier', storeId }).select('-password').sort({ name: 1 });
    res.json(cashiers);
  } catch {
    res.status(500).json({ error: 'Impossible de charger les caissiers' });
  }
});

// Manager: create cashier for store
router.post('/:id/cashiers', authMiddleware, managerOrAdminMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const storeId = String(req.params.id);
    const allowed = await canManageStore(req, storeId);
    if (!allowed) {
      res.status(403).json({ error: 'Accès refusé' });
      return;
    }

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

    const cashier = new User({
      name,
      email,
      password,
      role: 'cashier',
      storeId,
      phone,
    });
    await cashier.save();

    const safe = await User.findById(cashier._id).select('-password');
    res.status(201).json(safe);
  } catch (error) {
    res.status(500).json({ error: 'Impossible de créer le caissier', details: String(error) });
  }
});

export default router;
