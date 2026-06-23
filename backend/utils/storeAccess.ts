import Store from '../models/Store';
import { AuthRequest } from '../middleware/auth';

export async function getManagerStoreId(userId: string): Promise<string | null> {
  const store = await Store.findOne({ managerId: userId }).select('_id');
  return store ? String(store._id) : null;
}

export async function resolveUserStoreId(req: AuthRequest): Promise<string | null> {
  if (!req.user) return null;

  if (req.user.storeId) return req.user.storeId;

  if (req.user.role === 'manager') {
    return getManagerStoreId(req.user.userId);
  }

  return null;
}

export async function canManageStore(
  req: AuthRequest,
  storeId: string
): Promise<boolean> {
  if (req.user?.role === 'admin') return true;
  if (req.user?.role !== 'manager') return false;

  const managerStoreId = await getManagerStoreId(req.user.userId);
  return managerStoreId === storeId;
}
