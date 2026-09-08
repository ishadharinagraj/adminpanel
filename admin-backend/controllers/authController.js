const { db, FieldValue, isFirebaseConfigured } = require('../config/firebase');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Helper error response when Firebase credentials are missing
const sendUnconfiguredError = (res) => {
  return res.status(500).json({
    message: 'Firebase database is not configured.',
    error: 'Please set FIREBASE_SERVICE_ACCOUNT in your .env file or Render Dashboard.'
  });
};

// Register new user
exports.register = async (req, res) => {
  if (!isFirebaseConfigured || !db) {
    return sendUnconfiguredError(res);
  }

  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user with this email already exists in Firestore
    const snapshot = await db.collection('users').where('email', '==', cleanEmail).get();
    if (!snapshot.empty) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user doc into Firestore
    const docRef = await db.collection('users').add({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      createdAt: FieldValue.serverTimestamp(),
    });

    return res.status(201).json({
      message: 'User registered successfully!',
      userId: docRef.id,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Server error during registration.', error: error.message });
  }
};

// Login user
exports.login = async (req, res) => {
  if (!isFirebaseConfigured || !db) {
    return sendUnconfiguredError(res);
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Query Firestore for user with email
    const snapshot = await db.collection('users').where('email', '==', cleanEmail).get();
    if (snapshot.empty) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const userDoc = snapshot.docs[0];
    const user = userDoc.data();

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Generate JWT token
    const secret = process.env.JWT_SECRET || 'horizon_secret';
    const token = jwt.sign({ id: userDoc.id, email: user.email }, secret, {
      expiresIn: '24h',
    });

    return res.status(200).json({
      message: 'Login successful!',
      token,
      user: {
        id: userDoc.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error during login.', error: error.message });
  }
};
