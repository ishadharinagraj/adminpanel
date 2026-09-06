const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const clientRoutes = require('./routes/clientRoutes');
const dnsRoutes = require('./routes/dnsRoutes');
const dnsController = require('./controllers/dnsController');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes (Supports both / and /api/ prefixes)
app.use('/auth', authRoutes);
app.use('/api/auth', authRoutes);

app.use('/clients', clientRoutes);
app.use('/api/clients', clientRoutes);

app.use('/admin/dns-whitelist', dnsRoutes);
app.use('/api/admin/dns-whitelist', dnsRoutes);

app.post('/validate-dns', dnsController.validateDns);
app.post('/api/validate-dns', dnsController.validateDns);

app.post('/check-dns', dnsController.checkDns);
app.post('/api/check-dns', dnsController.checkDns);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Horizon Admin Backend API is running' });
});
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Horizon Admin Backend API is running' });
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`=================================`);
  console.log(`🚀 Admin Backend Server running on port ${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`=================================`);
});
