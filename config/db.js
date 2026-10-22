const mongoose = require('mongoose');
require('dotenv').config();

const conectarDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Falta definir MONGODB_URI en el archivo .env.');
  }

  try {
    await mongoose.connect(uri);
    console.log('✅ Conectado exitosamente a MongoDB');
  } catch (error) {
    throw new Error(`No se pudo conectar a MongoDB: ${error.message}`, { cause: error });
  }
};

module.exports = conectarDB;