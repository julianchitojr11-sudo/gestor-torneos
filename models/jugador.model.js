const mongoose = require('mongoose');

const JugadorSchema = new mongoose.Schema({
  equipoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipo', required: true },
  nombre: { type: String, required: true, trim: true },
  numero: { type: Number, required: true, min: 1, max: 99 }
});

module.exports = mongoose.model('Jugador', JugadorSchema, 'jugadores');
