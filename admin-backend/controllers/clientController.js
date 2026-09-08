const { db, FieldValue, isFirebaseConfigured } = require('../config/firebase');

// Ensure sample clients exist in Firestore
const initClientsDb = async () => {
  if (!isFirebaseConfigured || !db) return;
  try {
    const snapshot = await db.collection('clients').get();
    if (snapshot.empty) {
      console.log('Seeding initial sample clients into Firestore...');
      const sampleClients = [
        {
          name: 'Alex Morgan',
          email: 'alex.m@gmail.com',
          dns_url: 'http://webtv-dns1.com:8080/c/',
          mac_address: '00:1A:79:4D:2E:8F',
          plan: '12 Months VIP WebTV',
          expiry_date: '2026-12-31',
          status: 'Active',
          createdAt: FieldValue.serverTimestamp(),
        },
        {
          name: 'David Beckham',
          email: 'david.b@yahoo.com',
          dns_url: 'http://webtv-dns2.net:8080/live/',
          mac_address: '00:1A:79:9C:11:AA',
          plan: '6 Months Premium WebTV',
          expiry_date: '2026-10-15',
          status: 'Active',
          createdAt: FieldValue.serverTimestamp(),
        },
        {
          name: 'Sophia Martinez',
          email: 'sophia.m@outlook.com',
          dns_url: 'http://portal-webtv.org:8000/',
          mac_address: '00:1A:79:33:44:55',
          plan: '1 Month Trial',
          expiry_date: '2026-09-10',
          status: 'Expiring Soon',
          createdAt: FieldValue.serverTimestamp(),
        },
      ];

      for (const client of sampleClients) {
        await db.collection('clients').add(client);
      }
      console.log('Sample clients seeded successfully into Firestore.');
    }
  } catch (error) {
    console.error('Clients database initialization error:', error.message);
  }
};

initClientsDb().catch(err => console.error('Clients DB Init Error:', err.message));

// Get all clients
exports.getClients = async (req, res) => {
  if (!isFirebaseConfigured || !db) {
    return res.status(500).json({ message: 'Firebase is not configured in .env' });
  }
  try {
    const snapshot = await db.collection('clients').get();
    const clients = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.json(clients);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching clients', error: error.message });
  }
};

// Create new client
exports.createClient = async (req, res) => {
  if (!isFirebaseConfigured || !db) {
    return res.status(500).json({ message: 'Firebase is not configured in .env' });
  }
  try {
    const { name, email, dns_url, mac_address, plan, expiry_date, status } = req.body;
    const clientData = {
      name,
      email,
      dns_url,
      mac_address: mac_address || '',
      plan: plan || '12 Months VIP WebTV',
      expiry_date: expiry_date || '2026-12-31',
      status: status || 'Active',
      createdAt: FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection('clients').add(clientData);
    res.status(201).json({ id: docRef.id, ...clientData });
  } catch (error) {
    res.status(500).json({ message: 'Error creating client', error: error.message });
  }
};

// Update client
exports.updateClient = async (req, res) => {
  if (!isFirebaseConfigured || !db) {
    return res.status(500).json({ message: 'Firebase is not configured in .env' });
  }
  try {
    const { id } = req.params;
    const { name, email, dns_url, mac_address, plan, expiry_date, status } = req.body;
    await db.collection('clients').doc(id).update({
      name,
      email,
      dns_url,
      mac_address,
      plan,
      expiry_date,
      status,
      updatedAt: FieldValue.serverTimestamp(),
    });
    res.json({ message: 'Client updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating client', error: error.message });
  }
};

// Delete client
exports.deleteClient = async (req, res) => {
  if (!isFirebaseConfigured || !db) {
    return res.status(500).json({ message: 'Firebase is not configured in .env' });
  }
  try {
    const { id } = req.params;
    await db.collection('clients').doc(id).delete();
    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting client', error: error.message });
  }
};
