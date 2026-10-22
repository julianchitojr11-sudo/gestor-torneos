require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const conectarDB = require('./config/db');
const torneoRoutes = require('./routes/torneo.routes');

const app = express();

app.use(cors());
app.use(express.json());

// Redirigir automáticamente si entran sin la barra final (evita pantalla en blanco)
app.get('/gestor-torneos', (req, res) => {
  res.redirect('/gestor-torneos/');
});

// Servir la carpeta public en la raíz y bajo el prefijo del gestor
app.use('/gestor-torneos', express.static(path.join(__dirname, 'public')));
app.use('/', express.static(path.join(__dirname, 'public')));

// Rutas de la API REST
app.use('/api', torneoRoutes);
app.use('/gestor-torneos/api', torneoRoutes);

const PORT = process.env.PORT || 3004;

async function iniciarServidor() {
  await conectarDB();
  app.listen(PORT, () => {
    console.log(`🚀 Servidor ejecutándose en el puerto ${PORT}`);
  });
}

iniciarServidor().catch((error) => {
  console.error('❌ No se pudo iniciar el servidor:', error.message);
  process.exitCode = 1;
});