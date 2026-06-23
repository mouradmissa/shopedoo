import Product from '../models/Product';

export interface StoreAvailability {
  storeId: string;
  storeName: string;
  city: string;
  governorate: string;
  stock: number;
  productId: string;
  price: number;
}

export interface CatalogProduct {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  totalStock: number;
  storeAvailability: StoreAvailability[];
}

export async function buildProductCatalog(filter: Record<string, unknown> = {}) {
  const products = await Product.find(filter)
    .populate('storeId', 'name city governorate isActive')
    .select('-__v -qrCodeImage')
    .lean();

  const catalogMap = new Map<string, CatalogProduct>();

  for (const product of products) {
    const key = `${String(product.name).trim().toLowerCase()}::${product.category}`;
    const store = product.storeId as
      | { _id: unknown; name: string; city: string; governorate: string; isActive?: boolean }
      | null
      | undefined;

    if (!catalogMap.has(key)) {
      catalogMap.set(key, {
        _id: String(product._id),
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        image: product.image,
        totalStock: 0,
        storeAvailability: [],
      });
    }

    const entry = catalogMap.get(key)!;
    entry.totalStock += product.stock ?? 0;

    if (product.price < entry.price) {
      entry.price = product.price;
    }

    if (store && store.isActive !== false) {
      entry.storeAvailability.push({
        storeId: String(store._id),
        storeName: store.name,
        city: store.city,
        governorate: store.governorate,
        stock: product.stock ?? 0,
        productId: String(product._id),
        price: product.price,
      });
    }
  }

  return Array.from(catalogMap.values());
}

export async function getProductWithAvailability(productId: string) {
  const product = await Product.findById(productId).populate(
    'storeId',
    'name city governorate address isActive'
  );

  if (!product) return null;

  const siblings = await Product.find({
    name: product.name,
    category: product.category,
  })
    .populate('storeId', 'name city governorate address isActive')
    .select('stock price storeId')
    .lean();

  const storeAvailability: StoreAvailability[] = [];

  for (const sibling of siblings) {
    const store = sibling.storeId as
      | { _id: unknown; name: string; city: string; governorate: string; isActive?: boolean }
      | null
      | undefined;

    if (store && store.isActive !== false) {
      storeAvailability.push({
        storeId: String(store._id),
        storeName: store.name,
        city: store.city,
        governorate: store.governorate,
        stock: sibling.stock ?? 0,
        productId: String(sibling._id),
        price: sibling.price,
      });
    }
  }

  return { product, storeAvailability };
}
