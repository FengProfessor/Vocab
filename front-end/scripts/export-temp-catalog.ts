import fs from 'fs';
import path from 'path';
import { getCatalogTree, MICRO_PACK_SIZE, CATALOG_VERSION } from '../src/lib/vocab-catalog';

const routes = getCatalogTree();
const payload = {
  success: true,
  routes,
  microPackSize: MICRO_PACK_SIZE,
  catalogVersion: CATALOG_VERSION,
};

fs.writeFileSync(
  path.resolve(__dirname, '../src/data/vocab/catalog-tree-exported.json'),
  JSON.stringify(payload, null, 2),
  'utf8'
);
console.log('Exported catalog tree to data/vocab/catalog-tree-exported.json');
