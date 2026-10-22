const mongoose = require('mongoose');

const EquipoSchema = new mongoose.Schema({
  torneoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Torneo', required: true },
  nombre: { type: String, required: true, trim: true },
  pj: { type: Number, default: 0 },
  pg: { type: Number, default: 0 },
  pe: { type: Number, default: 0 },
  pp: { type: Number, default: 0 },
  gf: { type: Number, default: 0 },
  gc: { type: Number, default: 0 },
  pts: { type: Number, default: 0 }
});

module.exports = mongoose.model('Equipo', EquipoSchema);