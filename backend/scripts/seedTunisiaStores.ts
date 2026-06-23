import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import { seedTunisiaStores } from '../services/seedTunisiaStores';
import { managerEmailForGovernorate } from '../data/tunisiaGovernorates';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
  const mongoURI = process.env.MONGODB_URI;
  if (!mongoURI) {
    console.error('MONGODB_URI manquant. Définissez-le dans backend/.env');
    process.exit(1);
  }

  await mongoose.connect(mongoURI);
  console.log('MongoDB connecté — seed boutiques Tunisie\n');

  const result = await seedTunisiaStores();
  result.details.forEach((line) => console.log(line));

  console.log(`\nTerminé : ${result.storesCreated} boutique(s), ${result.cashiersCreated} caissier(s).`);
  console.log('\nExemple connexion gérant Tataouine :');
  const example = managerEmailForGovernorate('Tataouine');
  console.log(`  Email : ${example}`);
  console.log(`  Mot de passe : ${example}`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Erreur seed:', err);
  process.exit(1);
});
