const mongoose = require('mongoose');

const TorneoSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true },
  categoria: {
    type: String,
    enum: ['Libre', 'Sub-20', 'Femenil', 'Veteranos'],
    default: 'Libre'
  },
  estado: { type: String, enum: ['activo', 'finalizado'], default: 'activo' },
  fechaCreacion: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Torneo', TorneoSchema);