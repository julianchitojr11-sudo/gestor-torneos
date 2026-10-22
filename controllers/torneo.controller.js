const Torneo = require('../models/torneo.model');
const Equipo = require('../models/equipo.model');
const Jugador = require('../models/jugador.model');
const mongoose = require('mongoose');

const esIdValido = (id) => mongoose.isValidObjectId(id);
const nombreValido = (nombre) => typeof nombre === 'string' && nombre.trim().length > 0;
const responderError = (res, error) => {
  const status = ['ValidationError', 'CastError'].includes(error.name) ? 400 : 500;
  return res.status(status).json({ success: false, message: error.message });
};

// --- CONTROLADORES DE TORNEOS ---
exports.obtenerTorneos = async (req, res) => {
  try {
    const torneos = await Torneo.find().sort({ fechaCreacion: -1 });
    res.json({ success: true, data: torneos });
  } catch (error) {
    responderError(res, error);
  }
};

exports.crearTorneo = async (req, res) => {
  try {
    const { nombre, categoria } = req.body;
    if (!nombreValido(nombre)) {
      return res.status(400).json({ success: false, message: 'El nombre del torneo es obligatorio' });
    }
    const nuevoTorneo = new Torneo({ nombre: nombre.trim(), categoria });
    await nuevoTorneo.save();
    res.status(201).json({ success: true, message: 'Torneo creado', data: nuevoTorneo });
  } catch (error) {
    responderError(res, error);
  }
};

exports.actualizarTorneo = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, categoria } = req.body;
    if (!esIdValido(id)) return res.status(400).json({ success: false, message: 'ID de torneo no válido' });
    if (!nombreValido(nombre)) {
      return res.status(400).json({ success: false, message: 'El nombre del torneo es obligatorio' });
    }
    const torneoActualizado = await Torneo.findByIdAndUpdate(
      id,
      { nombre: nombre.trim(), categoria },
      { new: true, runValidators: true }
    );
    if (!torneoActualizado) return res.status(404).json({ success: false, message: 'Torneo no encontrado' });
    res.json({ success: true, message: 'Torneo actualizado', data: torneoActualizado });
  } catch (error) {
    responderError(res, error);
  }
};

exports.eliminarTorneo = async (req, res) => {
  try {
    const { id } = req.params;
    if (!esIdValido(id)) return res.status(400).json({ success: false, message: 'ID de torneo no válido' });
    const torneo = await Torneo.findById(id);
    if (!torneo) return res.status(404).json({ success: false, message: 'Torneo no encontrado' });
    const equipos = await Equipo.find({ torneoId: id }).select('_id');
    await Jugador.deleteMany({ equipoId: { $in: equipos.map(equipo => equipo._id) } });
    await Equipo.deleteMany({ torneoId: id });
    await Torneo.findByIdAndDelete(id);
    res.json({ success: true, message: 'Torneo y equipos asociados eliminados' });
  } catch (error) {
    responderError(res, error);
  }
};

// --- CONTROLADORES DE EQUIPOS (CRUD) ---
exports.obtenerEquiposPorTorneo = async (req, res) => {
  try {
    const { torneoId } = req.params;
    if (!esIdValido(torneoId)) return res.status(400).json({ success: false, message: 'ID de torneo no válido' });
    const equipos = await Equipo.find({ torneoId }).sort({ pts: -1, gf: -1 });
    res.json({ success: true, data: equipos });
  } catch (error) {
    responderError(res, error);
  }
};

exports.crearEquipo = async (req, res) => {
  try {
    const { torneoId, nombre } = req.body;
    if (!esIdValido(torneoId)) return res.status(400).json({ success: false, message: 'ID de torneo no válido' });
    if (!nombreValido(nombre)) {
      return res.status(400).json({ success: false, message: 'El nombre del equipo es obligatorio' });
    }
    if (!await Torneo.exists({ _id: torneoId })) {
      return res.status(404).json({ success: false, message: 'Torneo no encontrado' });
    }
    const nuevoEquipo = new Equipo({ torneoId, nombre: nombre.trim() });
    await nuevoEquipo.save();
    res.status(201).json({ success: true, message: 'Equipo registrado', data: nuevoEquipo });
  } catch (error) {
    responderError(res, error);
  }
};

exports.actualizarEquipo = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre } = req.body;
    if (!esIdValido(id)) return res.status(400).json({ success: false, message: 'ID de equipo no válido' });
    if (!nombreValido(nombre)) {
      return res.status(400).json({ success: false, message: 'El nombre del equipo es obligatorio' });
    }
    const equipoActualizado = await Equipo.findByIdAndUpdate(
      id,
      { nombre: nombre.trim() },
      { new: true, runValidators: true }
    );
    if (!equipoActualizado) return res.status(404).json({ success: false, message: 'Equipo no encontrado' });
    res.json({ success: true, message: 'Equipo actualizado', data: equipoActualizado });
  } catch (error) {
    responderError(res, error);
  }
};

exports.eliminarEquipo = async (req, res) => {
  try {
    const { id } = req.params;
    if (!esIdValido(id)) return res.status(400).json({ success: false, message: 'ID de equipo no válido' });
    const equipo = await Equipo.findById(id);
    if (!equipo) return res.status(404).json({ success: false, message: 'Equipo no encontrado' });
    await Jugador.deleteMany({ equipoId: equipo._id });
    await equipo.deleteOne();
    res.json({ success: true, message: 'Equipo eliminado' });
  } catch (error) {
    responderError(res, error);
  }
};