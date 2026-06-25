import CatalogProduct from '../models/CatalogProduct';
import Product from '../models/Product';
import { buildCatalogProductImageUrl } from './catalogImage';
import { buildProductImageUrl } from './productImage';

export interface StoreAvailability {
  storeId: string;
  storeName: string;
  city: string;
  governorate: string;
  stock: number;
  productId: string;
  price: number;
}

export interface CatalogProductView {
  _id: string;
  catalogProductId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  onlineStock: number;
  storeStock: number;
  totalStock: number;
  storeAvailability: StoreAvailability[];
}

type StoreRef = {
  _id: unknown;
  name: string;
  city: string;
  governorate: string;
  isActive?: boolean;
};

function resolveImage(catalog: {
  _id: unknown;
  imageStored?: boolean;
  image?: string;
}): string | undefined {
  if (catalog.imageStored) {
    return buildCatalogProductImageUrl(String(catalog._id));
  }
  return catalog.image;
}

function appendStoreAvailability(
  entry: CatalogProductView,
  product: { _id: unknown; stock?: number; price: number; storeId?: StoreRef | null }
) {
  const store = product.storeId;
  if (!store || store.isActive === false) return;

  const rowStock = product.stock ?? 0;
  entry.storeStock += rowStock;
  entry.totalStock = entry.onlineStock + entry.storeStock;
  if (product.price < entry.price) {
    entry.price = product.price;
  }

  entry.storeAvailability.push({
    storeId: String(store._id),
    storeName: store.name,
    city: store.city,
    governorate: store.governorate,
    stock: rowStock,
    productId: String(product._id),
    price: product.price,
  });
}

function buildCatalogFilter(search?: string, category?: string) {
  const filter: Record<string, unknown> = { isActive: true };
  if (category) filter.category = category;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }
  return filter;
}

export async function buildProductCatalog(query: { category?: string; search?: string } = {}) {
  const catalogFilter = buildCatalogFilter(query.search, query.category);
  const catalogProducts = await CatalogProduct.find(catalogFilter).sort({ name: 1 }).lean();

  const catalogIds = catalogProducts.map((c) => c._id);
  const storeProducts = await Product.find({
    catalogProductId: { $in: catalogIds },
  })
    .populate('storeId', 'name city governorate isActive')
    .select('stock price storeId catalogProductId name category')
    .lean();

  const productsByCatalog = new Map<string, typeof storeProducts>();
  for (const product of storeProducts) {
    const key = String(product.catalogProductId);
    if (!productsByCatalog.has(key)) productsByCatalog.set(key, []);
    productsByCatalog.get(key)!.push(product);
  }

  const catalogViews: CatalogProductView[] = catalogProducts.map((catalog) => {
    const entry: CatalogProductView = {
      _id: String(catalog._id),
      catalogProductId: String(catalog._id),
      name: catalog.name,
      description: catalog.description,
      price: catalog.price,
      category: catalog.category,
      image: resolveImage(catalog),
      onlineStock: catalog.stock ?? 0,
      storeStock: 0,
      totalStock: catalog.stock ?? 0,
      storeAvailability: [],
    };

    for (const product of productsByCatalog.get(String(catalog._id)) ?? []) {
      appendStoreAvailability(entry, product as { _id: unknown; stock?: number; price: number; storeId?: StoreRef | null });
    }

    return entry;
  });

  const legacyFilter: Record<string, unknown> = {
    $or: [{ catalogProductId: { $exists: false } }, { catalogProductId: null }],
  };
  if (query.category) legacyFilter.category = query.category;
  if (query.search) {
    legacyFilter.$and = [
      {
        $or: [
          { name: { $regex: query.search, $options: 'i' } },
          { description: { $regex: query.search, $options: 'i' } },
        ],
      },
    ];
  }

  const legacyProducts = await Product.find(legacyFilter)
    .populate('storeId', 'name city governorate isActive')
    .select('-__v -qrCodeImage -imageData')
    .lean();

  const legacyMap = new Map<string, CatalogProductView>();

  for (const product of legacyProducts) {
    const key = `${String(product.name).trim().toLowerCase()}::${product.category}`;

    if (!legacyMap.has(key)) {
      const imageUrl = product.imageStored
        ? buildProductImageUrl(String(product._id))
        : product.image;

      legacyMap.set(key, {
        _id: String(product._id),
        catalogProductId: '',
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        image: imageUrl,
        onlineStock: 0,
        storeStock: 0,
        totalStock: 0,
        storeAvailability: [],
      });
    }

    appendStoreAvailability(
      legacyMap.get(key)!,
      product as { _id: unknown; stock?: number; price: number; storeId?: StoreRef | null }
    );
  }

  return [...catalogViews, ...Array.from(legacyMap.values())].sort((a, b) =>
    a.name.localeCompare(b.name, 'fr')
  );
}

export async function getProductWithAvailability(productId: string) {
  const catalog = await CatalogProduct.findById(productId);
  if (catalog) {
    const storeProducts = await Product.find({ catalogProductId: catalog._id })
      .populate('storeId', 'name city governorate address isActive')
      .lean();

    const storeAvailability: StoreAvailability[] = [];
    let representative = storeProducts[0] ?? null;

    for (const sibling of storeProducts) {
      const store = sibling.storeId as StoreRef | null | undefined;
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

    const storeStock = storeAvailability.reduce((sum, row) => sum + row.stock, 0);
    const onlineStock = catalog.stock ?? 0;

    const virtualProduct = {
      _id: catalog._id,
      name: catalog.name,
      description: catalog.description,
      price: catalog.price,
      category: catalog.category,
      image: resolveImage(catalog),
      catalogProductId: catalog._id,
      onlineStock,
      storeStock,
      stock: onlineStock + storeStock,
      storeId: representative?.storeId,
      toObject: () => ({
        _id: catalog._id,
        name: catalog.name,
        description: catalog.description,
        price: catalog.price,
        category: catalog.category,
        image: resolveImage(catalog),
        catalogProductId: catalog._id,
        onlineStock,
        storeStock,
      }),
    };

    return {
      product: virtualProduct,
      storeAvailability,
      isCatalogEntry: true,
      onlineStock,
      storeStock,
      totalStock: onlineStock + storeStock,
    };
  }

  const product = await Product.findById(productId).populate(
    'storeId',
    'name city governorate address isActive'
  );

  if (!product) return null;

  if (product.catalogProductId) {
    const catalogDoc = await CatalogProduct.findById(product.catalogProductId).select('stock').lean();
    const siblings = await Product.find({ catalogProductId: product.catalogProductId })
      .populate('storeId', 'name city governorate address isActive')
      .select('stock price storeId')
      .lean();

    const storeAvailability: StoreAvailability[] = [];
    for (const sibling of siblings) {
      const store = sibling.storeId as StoreRef | null | undefined;
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

    const storeStock = storeAvailability.reduce((sum, row) => sum + row.stock, 0);
    const onlineStock = catalogDoc?.stock ?? 0;

    return {
      product,
      storeAvailability,
      isCatalogEntry: false,
      onlineStock,
      storeStock,
      totalStock: onlineStock + storeStock,
    };
  }

  const siblings = await Product.find({
    name: product.name,
    category: product.category,
  })
    .populate('storeId', 'name city governorate address isActive')
    .select('stock price storeId')
    .lean();

  const storeAvailability: StoreAvailability[] = [];
  for (const sibling of siblings) {
    const store = sibling.storeId as StoreRef | null | undefined;
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

  const storeStock = storeAvailability.reduce((sum, row) => sum + row.stock, 0);

  return {
    product,
    storeAvailability,
    isCatalogEntry: false,
    onlineStock: 0,
    storeStock,
    totalStock: storeStock,
  };
}
