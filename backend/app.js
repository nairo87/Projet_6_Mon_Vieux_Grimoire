require('dotenv').config();
const dns = require('dns');
dns.setServers(['1.1.1.1', '8.8.8.8']);
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const helmet = require('helmet');

const booksRoutes = require('./routes/books');
const userRoutes = require('./routes/auth');

const app = express();

// Connexion à MongoDB Atlas
// Si la variable d'environnement est absente ou invalide, on logue l'erreur
// sans faire planter le lancement du serveur (voir consigne de sécurité du projet).
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch((error) => console.error('Connexion à MongoDB échouée : ' + error.message));

// Permet de lire le JSON envoyé dans le corps des requêtes
app.use(express.json());

// Un peu de sécurité sur les en-têtes HTTP
app.use(helmet({ crossOriginResourcePolicy: false }));

// Gestion du CORS (Cross Origin Resource Sharing)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization'
  );
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  next();
});

// Mise à disposition statique du dossier des images
app.use('/images', express.static(path.join(__dirname, 'images')));

// Routes de l'API
app.use('/api/books', booksRoutes);
app.use('/api/auth', userRoutes);

module.exports = app;
