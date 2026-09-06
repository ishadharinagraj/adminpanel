const db = require('../config/db');

// Ensure clients table exists in MySQL
const initClientsDb = async () => {
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS clients (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        dns_url VARCHAR(255) NOT NULL,
        mac_address VARCHAR(255),
        plan VARCHAR(255) DEFAULT '12 Months VIP WebTV',
        expiry_date VARCHAR(100),
        status VARCHAR(50) DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await db.query(createTableQuery);

    // Check if initial sample data exists
    const [existing] = await db.query('SELECT COUNT(*) as count FROM clients');
    if (existing[0].count === 0) {
      await db.query(`
        INSERT INTO clients (name, email, dns_url, mac_address, plan, expiry_date, status) VALUES
        ('Alex Morgan', 'alex.m@gmail.com', 'http://webtv-dns1.com:8080/c/', '00:1A:79:4D:2E:8F', '12 Months VIP WebTV', '2026-12-31', 'Active'),
        ('David Beckham', 'david.b@yahoo.com', 'http://webtv-dns2.net:8080/live/', '00:1A:79:9C:11:AA', '6 Months Premium WebTV', '2026-10-15', 'Active'),
        ('Sophia Martinez', 'sophia.m@outlook.com', 'http://portal-webtv.org:8000/', '00:1A:79:33:44:55', '1 Month Trial', '2026-09-10', 'Expiring Soon');
      `);
    }
  } catch (error) {
    console.error('Clients database initialization error:', error.message);
  }
};

initClientsDb();

// Get all clients
exports.getClients = async (req, res) => {
  try {
    const [clients] = await db.query('SELECT * FROM clients ORDER BY id DESC');
    res.json(clients);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching clients', error: error.message });
  }
};

// Create new client
exports.createClient = async (req, res) => {
  try {
    const { name, email, dns_url, mac_address, plan, expiry_date, status } = req.body;
    const [result] = await db.query(
      'INSERT INTO clients (name, email, dns_url, mac_address, plan, expiry_date, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, email, dns_url, mac_address || '', plan || '12 Months VIP WebTV', expiry_date || '2026-12-31', status || 'Active']
    );
    res.status(201).json({ id: result.insertId, name, email, dns_url, mac_address, plan, expiry_date, status });
  } catch (error) {
    res.status(500).json({ message: 'Error creating client', error: error.message });
  }
};

// Update client
exports.updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, dns_url, mac_address, plan, expiry_date, status } = req.body;
    await db.query(
      'UPDATE clients SET name=?, email=?, dns_url=?, mac_address=?, plan=?, expiry_date=?, status=? WHERE id=?',
      [name, email, dns_url, mac_address, plan, expiry_date, status, id]
    );
    res.json({ message: 'Client updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating client', error: error.message });
  }
};

// Delete client
exports.deleteClient = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM clients WHERE id = ?', [id]);
    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting client', error: error.message });
  }
};
