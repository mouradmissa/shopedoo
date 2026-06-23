import User from '../models/User';
import Store from '../models/Store';
import {
  TUNISIA_GOVERNORATES,
  managerEmailForGovernorate,
  storeNameForGovernorate,
  storeAddressForGovernorate,
} from '../data/tunisiaGovernorates';

export interface SeedTunisiaResult {
  created: number;
  skipped: number;
  details: string[];
}

export async function seedTunisiaStores(): Promise<SeedTunisiaResult> {
  let created = 0;
  let skipped = 0;
  const details: string[] = [];

  for (const governorate of TUNISIA_GOVERNORATES) {
    const email = managerEmailForGovernorate(governorate);
    const password = email;
    const storeName = storeNameForGovernorate(governorate);
    const address = storeAddressForGovernorate(governorate);

    const existingStore = await Store.findOne({ governorate, name: storeName });
    if (existingStore) {
      details.push(`${governorate}: boutique déjà présente`);
      skipped++;
      continue;
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
      details.push(`${governorate}: email ${email} déjà utilisé (rôle ${manager.role})`);
      skipped++;
      continue;
    }

    const existingManagerStore = await Store.findOne({ managerId: manager._id });
    if (existingManagerStore) {
      details.push(`${governorate}: gérant a déjà une boutique`);
      skipped++;
      continue;
    }

    const store = new Store({
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
    created++;
  }

  return { created, skipped, details };
}
