const express = require('express');
const mongoose = require('mongoose');
const Torneo = require('../models/torneo.model');
const Equipo = require('../models/equipo.model');
const Jugador = require('../models/jugador.model');

const router = express.Router();
const validId = id => mongoose.isValidObjectId(id);
const errorResponse = (res, error) => {
  const status = error.name === 'ValidationError' || error.name === 'CastError' ? 400 : 500;
  res.status(status).json({ message: error.message });
};

router.get(['/', '/torneos'], async (req, res) => {
  try {
    const torneos = await Torneo.find().sort({ fechaCreacion: -1 });
    res.json(torneos);
  } catch (error) {
    errorResponse(res, error);
  }
});

router.post(['/', '/torneos'], async (req, res) => {
  try {
    const torneo = await Torneo.create({
      nombre: req.body.nombre,
      categoria: req.body.categoria,
      estado: req.body.estado
    });
    res.status(201).json(torneo);
  } catch (error) {
    errorResponse(res, error);
  }
});

router.put(['/:id', '/torneos/:id'], async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: 'ID de torneo no válido.' });
    const torneo = await Torneo.findByIdAndUpdate(
      req.params.id,
      { nombre: req.body.nombre, categoria: req.body.categoria, estado: req.body.estado },
      { new: true, runValidators: true }
    );
    if (!torneo) return res.status(404).json({ message: 'Torneo no encontrado.' });
    res.json(torneo);
  } catch (error) {
    errorResponse(res, error);
  }
});

router.delete(['/:id', '/torneos/:id'], async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: 'ID de torneo no válido.' });
    const torneo = await Torneo.findById(req.params.id);
    if (!torneo) return res.status(404).json({ message: 'Torneo no encontrado.' });
    const equipos = await Equipo.find({ torneoId: torneo._id }).select('_id');
    await Jugador.deleteMany({ equipoId: { $in: equipos.map(equipo => equipo._id) } });
    await Equipo.deleteMany({ torneoId: torneo._id });
    await torneo.deleteOne();
    res.json({ message: 'Torneo y registros asociados eliminados.' });
  } catch (error) {
    errorResponse(res, error);
  }
});

router.get('/equipos', async (req, res) => {
  try {
    const equipos = await Equipo.find().populate('torneoId').sort({ nombre: 1 });
    res.json(equipos);
  } catch (error) {
    errorResponse(res, error);
  }
});

router.post('/equipos', async (req, res) => {
  try {
    if (!validId(req.body.torneoId)) return res.status(400).json({ message: 'Selecciona un torneo válido.' });
    if (!await Torneo.exists({ _id: req.body.torneoId })) return res.status(404).json({ message: 'Torneo no encontrado.' });
    const equipo = await Equipo.create({ nombre: req.body.nombre, torneoId: req.body.torneoId });
    res.status(201).json(await equipo.populate('torneoId'));
  } catch (error) {
    errorResponse(res, error);
  }
});

router.put('/equipos/:id', async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: 'ID de equipo no válido.' });
    if (!validId(req.body.torneoId)) return res.status(400).json({ message: 'Selecciona un torneo válido.' });
    if (!await Torneo.exists({ _id: req.body.torneoId })) return res.status(404).json({ message: 'Torneo no encontrado.' });
    const equipo = await Equipo.findByIdAndUpdate(
      req.params.id,
      { nombre: req.body.nombre, torneoId: req.body.torneoId },
      { new: true, runValidators: true }
    ).populate('torneoId');
    if (!equipo) return res.status(404).json({ message: 'Equipo no encontrado.' });
    res.json(equipo);
  } catch (error) {
    errorResponse(res, error);
  }
});

router.delete('/equipos/:id', async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: 'ID de equipo no válido.' });
    const equipo = await Equipo.findById(req.params.id);
    if (!equipo) return res.status(404).json({ message: 'Equipo no encontrado.' });
    await Jugador.deleteMany({ equipoId: equipo._id });
    await equipo.deleteOne();
    res.json({ message: 'Equipo y jugadores asociados eliminados.' });
  } catch (error) {
    errorResponse(res, error);
  }
});

router.get('/jugadores', async (req, res) => {
  try {
    const jugadores = await Jugador.find().populate({
      path: 'equipoId',
      populate: { path: 'torneoId' }
    }).sort({ nombre: 1 });
    res.json(jugadores);
  } catch (error) {
    errorResponse(res, error);
  }
});

router.post('/jugadores', async (req, res) => {
  try {
    if (!validId(req.body.equipoId)) return res.status(400).json({ message: 'Selecciona un equipo válido.' });
    if (!await Equipo.exists({ _id: req.body.equipoId })) return res.status(404).json({ message: 'Equipo no encontrado.' });
    const jugador = await Jugador.create({
      nombre: req.body.nombre,
      numero: req.body.numero,
      equipoId: req.body.equipoId
    });
    res.status(201).json(await jugador.populate({
      path: 'equipoId',
      populate: { path: 'torneoId' }
    }));
  } catch (error) {
    errorResponse(res, error);
  }
});

router.put('/jugadores/:id', async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: 'ID de jugador no válido.' });
    if (!validId(req.body.equipoId)) return res.status(400).json({ message: 'Selecciona un equipo válido.' });
    if (!await Equipo.exists({ _id: req.body.equipoId })) return res.status(404).json({ message: 'Equipo no encontrado.' });
    const jugador = await Jugador.findByIdAndUpdate(
      req.params.id,
      { nombre: req.body.nombre, numero: req.body.numero, equipoId: req.body.equipoId },
      { new: true, runValidators: true }
    ).populate({
      path: 'equipoId',
      populate: { path: 'torneoId' }
    });
    if (!jugador) return res.status(404).json({ message: 'Jugador no encontrado.' });
    res.json(jugador);
  } catch (error) {
    errorResponse(res, error);
  }
});

router.delete('/jugadores/:id', async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: 'ID de jugador no válido.' });
    const jugador = await Jugador.findByIdAndDelete(req.params.id);
    if (!jugador) return res.status(404).json({ message: 'Jugador no encontrado.' });
    res.json({ message: 'Jugador eliminado.' });
  } catch (error) {
    errorResponse(res, error);
  }
});

module.exports = router;
