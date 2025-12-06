const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '../db/invoice.db');
const dbDir = path.join(__dirname, '../db');

// Ensure db directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('📦 Connected to SQLite database');
  }
});

// Initialize database with schema and seed data
const initializeDatabase = () => {
  db.serialize(() => {
    // Create Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Customers table
    db.run(`
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_name TEXT NOT NULL,
        address TEXT,
        attention TEXT,
        telephone TEXT,
        user_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Create Items table
    db.run(`
      CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        description TEXT NOT NULL,
        unit_price REAL NOT NULL,
        user_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Create Templates table
    db.run(`
      CREATE TABLE IF NOT EXISTS templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        template_data TEXT NOT NULL,
        user_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Create Invoices table
    db.run(`
      CREATE TABLE IF NOT EXISTS invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_number TEXT UNIQUE NOT NULL,
        customer_id INTEGER,
        template_id INTEGER,
        items TEXT NOT NULL,
        subtotal REAL NOT NULL,
        tax REAL DEFAULT 0,
        total REAL NOT NULL,
        status TEXT DEFAULT 'unpaid',
        invoice_date DATE NOT NULL,
        user_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (template_id) REFERENCES templates(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Create Quotations table
    db.run(`
      CREATE TABLE IF NOT EXISTS quotations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quotation_number TEXT UNIQUE NOT NULL,
        customer_id INTEGER,
        template_id INTEGER,
        items TEXT NOT NULL,
        subtotal REAL NOT NULL,
        tax REAL DEFAULT 0,
        total REAL NOT NULL,
        quotation_date DATE NOT NULL,
        user_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (template_id) REFERENCES templates(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `, seedDatabase);
  });
};

// Seed database with example data
const seedDatabase = () => {
  db.get("SELECT COUNT(*) as count FROM users", [], (err, row) => {
    if (err) {
      console.error(err);
      return;
    }

    // Only seed if database is empty
    if (row.count === 0) {
      console.log('🌱 Seeding database with example data...');

      const adminPassword = bcrypt.hashSync('admin123', 10);
      const userPassword = bcrypt.hashSync('user123', 10);

      // Insert users
      db.run(
        `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`,
        ['Admin User', 'admin@invoice.com', adminPassword, 'admin']
      );

      db.run(
        `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`,
        ['Regular User', 'user@invoice.com', userPassword, 'user'],
        function(err) {
          if (err) {
            console.error(err);
            return;
          }

          const userId = this.lastID;

          // Insert sample customers (MALAYSIAN FORMAT)
          db.run(
            `INSERT INTO customers (company_name, address, attention, telephone, user_id) 
            VALUES (?, ?, ?, ?, ?)`,
            ['Tech Solutions Sdn Bhd', 'No. 123, Jalan Ampang, 50450 Kuala Lumpur, Malaysia', 'Ahmad bin Abdullah', '+6012-345 6789', userId]
          );

          db.run(
            `INSERT INTO customers (company_name, address, attention, telephone, user_id) 
            VALUES (?, ?, ?, ?, ?)`,
            ['Digital Services Malaysia', 'Level 5, Menara KLCC, 50088 Kuala Lumpur, Malaysia', 'Siti Nurhaliza', '+6013-456 7890', userId]
          );

          db.run(
            `INSERT INTO customers (company_name, address, attention, telephone, user_id) 
            VALUES (?, ?, ?, ?, ?)`,
            ['Innovate Sdn Bhd', 'Plot 88, Cyberjaya, 63000 Selangor, Malaysia', 'Lee Chong Wei', '+6019-123 4567', userId]
          );

          // Insert sample items (MALAYSIAN PRICING)
          db.run(
            `INSERT INTO items (description, unit_price, user_id) VALUES (?, ?, ?)`,
            ['Web Development Service', 500.00, userId]
          );

          db.run(
            `INSERT INTO items (description, unit_price, user_id) VALUES (?, ?, ?)`,
            ['UI/UX Design', 350.00, userId]
          );

          db.run(
            `INSERT INTO items (description, unit_price, user_id) VALUES (?, ?, ?)`,
            ['Database Setup', 800.00, userId]
          );

          db.run(
            `INSERT INTO items (description, unit_price, user_id) VALUES (?, ?, ?)`,
            ['API Development', 650.00, userId]
          );

          db.run(
            `INSERT INTO items (description, unit_price, user_id) VALUES (?, ?, ?)`,
            ['Quality Assurance Testing', 450.00, userId]
          );

          // Insert sample template
          const sampleTemplate = {
            elements: [
              {
                id: 'text-1',
                type: 'text',
                content: 'INVOICE',
                x: 50,
                y: 50,
                width: 200,
                height: 40,
                fontSize: 32,
                fontWeight: 'bold',
                color: '#333333'
              },
              {
                id: 'text-2',
                type: 'text',
                content: 'Your Company Name',
                x: 50,
                y: 100,
                width: 300,
                height: 30,
                fontSize: 18,
                fontWeight: 'normal',
                color: '#666666'
              },
              {
                id: 'customer-block',
                type: 'customerBlock',
                x: 50,
                y: 200,
                width: 300,
                height: 120,
                fontSize: 12,
                color: '#333333'
              },
              {
                id: 'invoice-info',
                type: 'invoiceInfo',
                x: 450,
                y: 200,
                width: 250,
                height: 80,
                fontSize: 12,
                color: '#333333'
              },
              {
                id: 'items-table',
                type: 'itemsTable',
                x: 50,
                y: 350,
                width: 700,
                height: 300,
                fontSize: 11,
                color: '#333333'
              },
              {
                id: 'totals-block',
                type: 'totalsBlock',
                x: 550,
                y: 680,
                width: 200,
                height: 100,
                fontSize: 12,
                color: '#333333'
              }
            ]
          };

          db.run(
            `INSERT INTO templates (name, template_data, user_id) VALUES (?, ?, ?)`,
            ['Default Template', JSON.stringify(sampleTemplate), userId]
          );

          console.log('✅ Database seeded successfully!');
        }
      );
    }
  });
};

module.exports = { db, initializeDatabase };