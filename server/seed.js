const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin');

/**
 * Seeds the admin account "arsprit" with password "paji"
 * if it doesn't already exist.
 */
async function seedAdmin() {
  const existing = await Admin.findOne({ username: 'arsprit' });
  if (existing) {
    console.log('ℹ️   Admin account already exists (arsprit)');
    return;
  }
  const passwordHash = await bcrypt.hash('paji', 10);
  await Admin.create({ username: 'arsprit', passwordHash });
  console.log('✅  Admin account created → username: arsprit | password: paji');
}

module.exports = seedAdmin;
