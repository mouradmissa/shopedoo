import User from '../models/User';
import Store from '../models/Store';
import {
  TUNISIA_GOVERNORATES,
  CASHIER_FILLER_NAMES,
  managerEmailForGovernorate,
  storeNameForGovernorate,
  storeAddressForGovernorate,
  cashierEmailForGovernorate,
  cashierDisplayName,
} from '../data/tunisiaGovernorates';

export interface SeedTunisiaResult {
  storesCreated: number;
  cashiersCreated: number;
  skipped: number;
  details: string[];
}

async function ensureCashiersForStore(
  storeId: string,
  governorate: string
): Promise<{ created: number; details: string[] }> {
  let created = 0;
  const details: string[] = [];

  for (const firstName of CASHIER_FILLER_NAMES) {
    const email = cashierEmailForGovernorate(firstName, governorate);
    const existing = await User.findOne({ email });

    if (existing) {
      if (existing.role === 'cashier' && String(existing.storeId) === String(storeId)) {
        details.push(`${governorate}: caissier ${email} déjà lié à la boutique`);
      } else {
        details.push(`${governorate}: email ${email} déjà utilisé`);
      }
      continue;
    }

    const cashier = new User({
      name: cashierDisplayName(firstName, governorate),
      email,
      password: email,
      role: 'cashier',
      storeId,
      phone: '+216 00 000 000',
    });
    await cashier.save();
    details.push(`${governorate}: caissier créé ${email}`);
    created++;
  }

  return { created, details };
}

async function ensureStoreForGovernorate(governorate: string): Promise<{
  store: InstanceType<typeof Store> | null;
  storeCreated: boolean;
  details: string[];
}> {
  const details: string[] = [];
  const email = managerEmailForGovernorate(governorate);
  const password = email;
  const storeName = storeNameForGovernorate(governorate);
  const address = storeAddressForGovernorate(governorate);

  let store = await Store.findOne({ governorate, name: storeName });
  if (store) {
    return { store, storeCreated: false, details };
  }

  let manager = await User.findOne({ email });
  if (!manager) {
    manager = new User({
      name: `Ahmed Gérant ${governorate}`,
      email,
      password,
      role: 'manager',
      phone: '+216 00 000 000',
    });
    await manager.save();
    details.push(`${governorate}: gérant créé ${email}`);
  } else if (manager.role !== 'manager') {
    details.push(`${governorate}: email gérant ${email} déjà utilisé (rôle ${manager.role})`);
    return { store: null, storeCreated: false, details };
  }

  const existingManagerStore = await Store.findOne({ managerId: manager._id });
  if (existingManagerStore) {
    details.push(`${governorate}: gérant a déjà une autre boutique`);
    return { store: existingManagerStore, storeCreated: false, details };
  }

  store = new Store({
    name: storeName,
    city: governorate,
    governorate,
    address,
    managerId: manager._id,
    isActive: true,
  });
  await store.save();

  manager.storeId = store._id;
  await manager.save();

  details.push(`${governorate}: boutique créée — ${storeName}`);
  return { store, storeCreated: true, details };
}

export async function seedTunisiaStores(): Promise<SeedTunisiaResult> {
  let storesCreated = 0;
  let cashiersCreated = 0;
  let skipped = 0;
  const details: string[] = [];

  for (const governorate of TUNISIA_GOVERNORATES) {
    const storeResult = await ensureStoreForGovernorate(governorate);
    details.push(...storeResult.details);

    if (!storeResult.store) {
      skipped++;
      continue;
    }

    if (storeResult.storeCreated) {
      storesCreated++;
    }

    const cashierResult = await ensureCashiersForStore(String(storeResult.store._id), governorate);
    details.push(...cashierResult.details);
    cashiersCreated += cashierResult.created;
  }

  return { storesCreated, cashiersCreated, skipped, details };
}

/** Ajoute les caissiers filler aux boutiques existantes uniquement */
export async function seedTunisiaCashiers(): Promise<SeedTunisiaResult> {
  let cashiersCreated = 0;
  const details: string[] = [];
  let skipped = 0;

  for (const governorate of TUNISIA_GOVERNORATES) {
    const storeName = storeNameForGovernorate(governorate);
    const store = await Store.findOne({ governorate, name: storeName });

    if (!store) {
      details.push(`${governorate}: aucune boutique — lancez d'abord le seed boutiques`);
      skipped++;
      continue;
    }

    const cashierResult = await ensureCashiersForStore(String(store._id), governorate);
    details.push(...cashierResult.details);
    cashiersCreated += cashierResult.created;
  }

  return { storesCreated: 0, cashiersCreated, skipped, details };
}
