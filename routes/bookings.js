import express from 'express';
import Booking from '../models/Booking.js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config()
const router = express.Router();

// Transforma horário string em Date para comparação
const toDateTime = (dateStr, timeStr) => {
  const [hour, minute] = timeStr.split(':').map(Number);
  const date = new Date(dateStr);
  date.setHours(hour, minute, 0, 0);
  return date;
};

// === TRANSPORTADOR DE E-MAIL (NodeMailer)
const transporter = nodemailer.createTransport({
  service: 'gmail',  // ou host, porta se usar outro SMTP
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// === GET /api/bookings?date=YYYY-MM-DD
router.get('/', async (req, res) => {
  try {
    const { date } = req.query;
    if (date) {
      const bookings = await Booking.find({ date }).sort({ time: 1 });
      return res.json(bookings);
    }

    const all = await Booking.find().sort({ createdAt: -1 });
    res.json(all);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// === POST /api/bookings
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, service, date, time, notes } = req.body;

    // 1. Verificar se já existe agendamento nesse horário
    const conflict = await Booking.findOne({ date, time });
    if (conflict) {
      return res.status(400).json({ error: 'Horário já reservado.' });
    }

    // 2. Se for Nanoblading, verificar também o horário seguinte
    const serviceId = service.toLowerCase();
    if (serviceId.includes('nanoblading')) {
      const [h, m] = time.split(':').map(Number);
      const nextTime = `${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      const nextConflict = await Booking.findOne({ date, time: nextTime });
      if (nextConflict) {
        return res.status(400).json({ error: `Horário das ${nextTime} já ocupado, necessário 2h livres para Nanoblading.` });
      }
    }

    // 3. Salvar agendamento
    const booking = new Booking({ name, email, phone, service, date, time, notes });
    await booking.save();

    // 4. Enviar e-mail para administradora
    const emailHtml = `
      <h2>Novo Agendamento</h2>
      <p><strong>Nome:</strong> ${name}</p>
      <p><strong>Serviço:</strong> ${service}</p>
      <p><strong>Data:</strong> ${new Date(date).toLocaleDateString('pt-PT')}</p>
      <p><strong>Hora:</strong> ${time}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Telefone:</strong> ${phone}</p>
      ${notes ? `<p><strong>Observações:</strong> ${notes}</p>` : ''}
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: 'claraalcantara@icloud.com',
      subject: 'Novo agendamento recebido',
      html: emailHtml
    });

    res.status(201).json(booking);
  } catch (error) {
    console.error('[ERRO AGENDAMENTO]', error);
    res.status(400).json({ error: error.message });
  }
});

// === PUT (sem alterações)
router.put('/:id', async (req, res) => {
  try {
    const updatedBooking = await Booking.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedBooking) return res.status(404).json({ error: 'Agendamento não encontrado' });
    res.json(updatedBooking);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// === DELETE
router.delete('/:id', async (req, res) => {
  try {
    const deletedBooking = await Booking.findByIdAndDelete(req.params.id);
    if (!deletedBooking) return res.status(404).json({ error: 'Agendamento não encontrado' });
    res.json({ message: 'Agendamento excluído com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
