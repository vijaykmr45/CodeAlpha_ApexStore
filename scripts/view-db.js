#!/usr/bin/env node

const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

const dbPath = path.join(__dirname, '../data/ecommerce.db');

let db;
try {
  db = new DatabaseSync(dbPath);
} catch (err) {
  console.error(`❌ Could not open database at ${dbPath}:`, err.message);
  process.exit(1);
}

const args = process.argv.slice(2);
const tableName = args[0];

function showAllTablesSummary() {
  console.log('\n======================================================');
  console.log('📦 ApexStore SQLite Database Explorer');
  console.log(`📁 File: ${dbPath}`);
  console.log('======================================================\n');

  const tablesStmt = db.prepare(`
    SELECT name 
    FROM sqlite_master 
    WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
    ORDER BY name ASC
  `);
  const tables = tablesStmt.all();

  if (tables.length === 0) {
    console.log('No tables found in database.');
    return;
  }

  const summary = tables.map(t => {
    const countRow = db.prepare(`SELECT COUNT(*) as count FROM "${t.name}"`).get();
    return {
      'Table Name': t.name,
      'Row Count': countRow.count
    };
  });

  console.table(summary);

  console.log('\n💡 Quick usage tips:');
  console.log('  • View specific table:  npm run db:view <table_name>');
  console.log('    Example: npm run db:view users');
  console.log('    Example: npm run db:view products');
  console.log('    Example: npm run db:view orders');
  console.log('    Example: npm run db:view order_items');
  console.log('    Example: npm run db:view cart_items');
  console.log('  • Run custom SQL query: npm run db:view -- --sql "SELECT id, name, price FROM products LIMIT 5"');
  console.log('');
}

function showTable(table) {
  // Check if table exists
  const check = db.prepare(`
    SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?
  `).get(table);

  if (!check) {
    console.error(`❌ Table "${table}" does not exist in database.`);
    console.log('Available tables: users, products, cart_items, orders, order_items');
    return;
  }

  console.log(`\n📋 Contents of table: "${table}"\n`);
  
  let rows;
  if (table === 'users') {
    // Hide or truncate password hash for readable display
    rows = db.prepare(`
      SELECT id, name, email, role, substr(password_hash, 1, 15) || '...' as password_hash, created_at
      FROM users
    `).all();
  } else if (table === 'products') {
    // Truncate description and image_url for clean tabular viewing
    rows = db.prepare(`
      SELECT 
        id, 
        name, 
        category, 
        price, 
        stock_quantity as stock, 
        rating 
      FROM products
    `).all();
  } else {
    rows = db.prepare(`SELECT * FROM "${table}" LIMIT 50`).all();
  }

  if (rows.length === 0) {
    console.log(`(Table "${table}" is currently empty)`);
  } else {
    console.table(rows);
    console.log(`Total rows displayed: ${rows.length}\n`);
  }
}

function runCustomQuery(sql) {
  console.log(`\n🔍 Executing query: ${sql}\n`);
  try {
    const stmt = db.prepare(sql);
    const rows = stmt.all();
    if (rows.length === 0) {
      console.log('Query returned 0 rows.');
    } else {
      console.table(rows);
      console.log(`Total rows returned: ${rows.length}\n`);
    }
  } catch (err) {
    console.error('❌ SQL Error:', err.message);
  }
}

if (!tableName) {
  showAllTablesSummary();
} else if (tableName === '--sql' && args[1]) {
  runCustomQuery(args.slice(1).join(' '));
} else {
  showTable(tableName);
}
