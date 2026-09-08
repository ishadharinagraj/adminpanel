const { db, FieldValue, isFirebaseConfigured } = require('../config/firebase');
const CryptoJS = require('crypto-js');

const SECRET_KEY = process.env.DNS_VALIDATION_SECRET || 'thisisdnsvalidationkey';

// Helper to parse input DNS URL/string into clean host components
function parseDnsInput(inputStr) {
  if (!inputStr || typeof inputStr !== 'string') {
    return { raw: '', cleaned: '', hostWithPort: '', hostname: '', port: '' };
  }
  const raw = inputStr.trim().toLowerCase();
  let str = raw.replace(/^https?:\/\//i, '');
  str = str.split('/')[0].split('?')[0].split('#')[0];

  const parts = str.split(':');
  const hostname = parts[0];
  const port = parts.length > 1 ? parts[1] : '';
  const hostWithPort = port ? `${hostname}:${port}` : hostname;

  return { raw, cleaned: str, hostWithPort, hostname, port };
}

// Helper to check if a parsed target DNS matches a whitelist rule
function matchesDnsRule(target, ruleStr) {
  if (!ruleStr) return false;
  const rule = ruleStr.trim().toLowerCase();

  // Global wildcard
  if (rule === '*') return true;

  // Clean rule of protocol/path
  let cleanRule = rule.replace(/^https?:\/\//i, '').split('/')[0].split('?')[0].split('#')[0];

  // Exact match
  if (
    cleanRule === target.cleaned ||
    cleanRule === target.hostWithPort ||
    cleanRule === target.hostname ||
    cleanRule === target.raw
  ) {
    return true;
  }

  // Subdomain wildcard match (e.g. *.example.com or *.example.com:8080)
  if (cleanRule.startsWith('*.')) {
    const baseRule = cleanRule.substring(2);
    if (baseRule.includes(':')) {
      if (target.hostWithPort === baseRule || target.hostWithPort.endsWith('.' + baseRule)) {
        return true;
      }
    } else {
      if (target.hostname === baseRule || target.hostname.endsWith('.' + baseRule)) {
        return true;
      }
    }
  }

  return false;
}

// Ensure initial whitelist_dns rules exist in Firestore
const initDnsDb = async () => {
  if (!isFirebaseConfigured || !db) return;
  try {
    const snapshot = await db.collection('whitelist_dns').get();
    if (snapshot.empty) {
      console.log('Seeding initial DNS whitelist rules into Firestore...');
      const defaultRules = [
        { dns: '*', is_active: true, createdAt: FieldValue.serverTimestamp() },
        { dns: 'xtream.example.com', is_active: true, createdAt: FieldValue.serverTimestamp() },
        { dns: 'dns.org:8080', is_active: true, createdAt: FieldValue.serverTimestamp() },
      ];

      for (const rule of defaultRules) {
        await db.collection('whitelist_dns').add(rule);
      }
      console.log('DNS whitelist rules seeded successfully into Firestore.');
    }
  } catch (error) {
    console.error('DNS Whitelist database initialization error:', error.message);
  }
};

initDnsDb().catch(err => console.error('DNS DB Init Error:', err.message));

// GET /api/admin/dns-whitelist
exports.getDnsWhitelist = async (req, res) => {
  if (!isFirebaseConfigured || !db) {
    return res.status(500).json({ message: 'Firebase is not configured in .env' });
  }
  try {
    const snapshot = await db.collection('whitelist_dns').get();
    const records = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        dns: data.dns,
        is_active: Boolean(data.is_active),
        created_at: data.createdAt ? data.createdAt.toDate?.() || data.createdAt : new Date(),
      };
    });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching DNS whitelist', error: error.message });
  }
};

// POST /api/admin/dns-whitelist
exports.addDnsWhitelist = async (req, res) => {
  if (!isFirebaseConfigured || !db) {
    return res.status(500).json({ message: 'Firebase is not configured in .env' });
  }
  try {
    const dnsValue = req.body.dns || req.body.domain;
    const isActive = req.body.is_active !== undefined ? Boolean(req.body.is_active) : true;

    if (!dnsValue || typeof dnsValue !== 'string' || !dnsValue.trim()) {
      return res.status(400).json({ message: 'DNS string is required' });
    }

    const cleanDns = dnsValue.trim();

    // Check if record already exists
    const snapshot = await db.collection('whitelist_dns').where('dns', '==', cleanDns).get();
    if (!snapshot.empty) {
      return res.status(400).json({ message: 'DNS record already exists' });
    }

    const docRef = await db.collection('whitelist_dns').add({
      dns: cleanDns,
      is_active: isActive,
      createdAt: FieldValue.serverTimestamp(),
    });

    res.status(201).json({
      id: docRef.id,
      dns: cleanDns,
      is_active: isActive,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ message: 'Error adding DNS whitelist record', error: error.message });
  }
};

// DELETE /api/admin/dns-whitelist/:id
exports.deleteDnsWhitelist = async (req, res) => {
  if (!isFirebaseConfigured || !db) {
    return res.status(500).json({ message: 'Firebase is not configured in .env' });
  }
  try {
    const { id } = req.params;
    await db.collection('whitelist_dns').doc(id).delete();
    res.json({ message: 'DNS whitelist record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting DNS whitelist record', error: error.message });
  }
};

// Validation Helper: Query DB and check match
async function isDnsWhitelistedInDb(dnsInput) {
  if (!isFirebaseConfigured || !db) return false;
  const snapshot = await db.collection('whitelist_dns').where('is_active', '==', true).get();
  const parsedTarget = parseDnsInput(dnsInput);
  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (matchesDnsRule(parsedTarget, data.dns)) {
      return true;
    }
  }
  return false;
}

// 1. Simple Key-Secured Public API: POST /api/check-dns
exports.checkDns = async (req, res) => {
  try {
    const { dns, key, apiKey, secretKey } = req.body || {};
    const providedKey = key || apiKey || secretKey || req.headers['x-api-key'] || req.headers['x-secret-key'];

    // Verify security key
    if (!providedKey || providedKey !== SECRET_KEY) {
      return res.status(401).json({
        isWhitelisted: false,
        message: 'Unauthorized: Invalid or missing security key'
      });
    }

    if (!dns || typeof dns !== 'string') {
      return res.status(400).json({
        isWhitelisted: false,
        message: 'Bad Request: Missing or invalid "dns" field'
      });
    }

    const isWhitelisted = await isDnsWhitelistedInDb(dns);

    return res.json({
      isWhitelisted,
      dns,
      message: isWhitelisted ? 'DNS is whitelisted and authorized' : 'DNS is not whitelisted'
    });
  } catch (error) {
    return res.status(500).json({
      isWhitelisted: false,
      message: 'Server error validating DNS',
      error: error.message
    });
  }
};

// 2. Encrypted Public Validation API: POST /api/validate-dns
exports.validateDns = async (req, res) => {
  try {
    const { payload, dns, key, apiKey, secretKey } = req.body || {};

    const providedKey = key || apiKey || secretKey || req.headers['x-api-key'] || req.headers['x-secret-key'];
    if (dns && providedKey) {
      if (providedKey !== SECRET_KEY) {
        return res.status(401).json({ isWhitelisted: false, message: 'Unauthorized: Invalid security key' });
      }
      const isWhitelisted = await isDnsWhitelistedInDb(dns);
      return res.json({
        isWhitelisted,
        dns,
        message: isWhitelisted ? 'DNS is whitelisted and authorized' : 'DNS is not whitelisted'
      });
    }

    // Handle AES Encrypted payload
    if (!payload) {
      const encryptedError = CryptoJS.AES.encrypt(
        JSON.stringify({ isWhitelisted: false, message: 'Missing payload or security key' }),
        SECRET_KEY
      ).toString();
      return res.status(400).json({ payload: encryptedError });
    }

    // Decrypt AES payload
    let decryptedText = '';
    try {
      const bytes = CryptoJS.AES.decrypt(payload, SECRET_KEY);
      decryptedText = bytes.toString(CryptoJS.enc.Utf8);
    } catch (err) {
      const encryptedError = CryptoJS.AES.encrypt(
        JSON.stringify({ isWhitelisted: false, message: 'Decryption failed' }),
        SECRET_KEY
      ).toString();
      return res.status(400).json({ payload: encryptedError });
    }

    if (!decryptedText) {
      const encryptedError = CryptoJS.AES.encrypt(
        JSON.stringify({ isWhitelisted: false, message: 'Invalid payload ciphertext or key' }),
        SECRET_KEY
      ).toString();
      return res.status(400).json({ payload: encryptedError });
    }

    let parsedData = {};
    try {
      parsedData = JSON.parse(decryptedText);
    } catch (err) {
      const encryptedError = CryptoJS.AES.encrypt(
        JSON.stringify({ isWhitelisted: false, message: 'Payload is not valid JSON' }),
        SECRET_KEY
      ).toString();
      return res.status(400).json({ payload: encryptedError });
    }

    const targetDns = parsedData.dns;
    if (!targetDns) {
      const encryptedError = CryptoJS.AES.encrypt(
        JSON.stringify({ isWhitelisted: false, message: 'DNS domain/URL missing in decrypted payload' }),
        SECRET_KEY
      ).toString();
      return res.status(400).json({ payload: encryptedError });
    }

    const isWhitelisted = await isDnsWhitelistedInDb(targetDns);

    const responseObj = {
      isWhitelisted,
      message: isWhitelisted ? 'DNS is whitelisted and authorized' : 'DNS is not whitelisted'
    };

    const encryptedResponsePayload = CryptoJS.AES.encrypt(
      JSON.stringify(responseObj),
      SECRET_KEY
    ).toString();

    return res.json({ payload: encryptedResponsePayload });
  } catch (error) {
    const encryptedError = CryptoJS.AES.encrypt(
      JSON.stringify({ isWhitelisted: false, message: 'Server error validating DNS', error: error.message }),
      SECRET_KEY
    ).toString();
    return res.status(500).json({ payload: encryptedError });
  }
};
