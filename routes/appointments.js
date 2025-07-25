// backend/routes/appointments.js
import express from 'express';
import Appointment from '../models/Appointment.js';

const router = express.Router();

// GET all appointments
router.get('/', async (req, res) => {
  try {
    const appointments = await Appointment.find().sort({ date: 1, time: 1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar agendamentos', error });
  }
});

// POST create new appointment
router.post('/', async (req, res) => {
  try {
    const newAppointment = new Appointment(req.body);
    const saved = await newAppointment.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao criar agendamento', error });
  }
});

// PUT update appointment by ID
router.put('/:id', async (req, res) => {
  try {
    const updated = await Appointment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Agendamento não encontrado' });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao atualizar agendamento', error });
  }
});

// DELETE appointment by ID
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Appointment.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Agendamento não encontrado' });
    res.json({ message: 'Agendamento excluído com sucesso' });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao excluir agendamento', error });
  }
});

export default router;
