import express from 'express';
import Booking from '../models/Booking.js';
import dotenv from 'dotenv';
import sgMail from '@sendgrid/mail';

dotenv.config();
const router = express.Router();

// Configurar SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Transforma horário string em Date
const toDateTime = (dateStr, timeStr) => {
  const [hour, minute] = timeStr.split(':').map(Number);
  const date = new Date(dateStr);
  date.setHours(hour, minute, 0, 0);
  return date;
};

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

    // 1. Verificar conflito
    const conflict = await Booking.findOne({ date, time });
    if (conflict) return res.status(400).json({ error: 'Horário já reservado.' });

    if (service.toLowerCase().includes('nanoblading')) {
      const [h, m] = time.split(':').map(Number);
      const nextTime = `${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      const nextConflict = await Booking.findOne({ date, time: nextTime });
      if (nextConflict) {
        return res.status(400).json({ error: `Horário das ${nextTime} já ocupado, necessário 2h livres para Nanoblading.` });
      }
    }

    // 2. Salvar agendamento
    const booking = new Booking({ name, email, phone, service, date, time, notes });
    await booking.save();

    // 3. E-mail para administradora
    const emailHtmlAdmin = `
      <h2>Novo Agendamento</h2>
      <p><strong>Nome:</strong> ${name}</p>
      <p><strong>Serviço:</strong> ${service}</p>
      <p><strong>Data:</strong> ${new Date(date).toLocaleDateString('pt-PT')}</p>
      <p><strong>Hora:</strong> ${time}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Telefone:</strong> ${phone}</p>
      ${notes ? `<p><strong>Observações:</strong> ${notes}</p>` : ''}
    `;

    await sgMail.send({
      to: 'princyrpiress@gmail.com',
      from: process.env.EMAIL_FROM,
      subject: 'Novo agendamento recebido',
      html: emailHtmlAdmin
    });

    // 4. E-mail para cliente
    const emailHtmlCliente = `
      <h2>Confirmação de Agendamento</h2>
      <p>Olá <strong>${name}</strong>,</p>
      <p>Seu agendamento foi confirmado com sucesso. Aqui estão os detalhes:</p>
      <ul>
        <li><strong>Serviço:</strong> ${service}</li>
        <li><strong>Data:</strong> ${new Date(date).toLocaleDateString('pt-PT')}</li>
        <li><strong>Hora:</strong> ${time}</li>
        <li><strong>Telefone:</strong> ${phone}</li>
        ${notes ? `<li><strong>Observações:</strong> ${notes}</li>` : ''}
      </ul>
      <p>Agradecemos a preferência!</p>
      <p><strong>Clarissa Alcântara Beauty</strong></p>
    `;

    await sgMail.send({
      to: email,
      from: process.env.EMAIL_FROM,
      subject: 'Confirmação do seu agendamento',
      html: emailHtmlCliente
    });

    res.status(201).json(booking);

  } catch (error) {
    console.error('[ERRO AGENDAMENTO]', error);
    res.status(400).json({ error: error.message });
  }
});

// === PUT /api/bookings/:id
router.put('/:id', async (req, res) => {
  try {
    const updatedBooking = await Booking.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedBooking) return res.status(404).json({ error: 'Agendamento não encontrado' });
    res.json(updatedBooking);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// === DELETE /api/bookings/:id
router.delete('/:id', async (req, res) => {
  try {
    const deletedBooking = await Booking.findByIdAndDelete(req.params.id);
    if (!deletedBooking) return res.status(404).json({ error: 'Agendamento não encontrado' });
    res.json({ message: 'Agendamento excluído com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// === PUT /api/bookings/:id/status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pendente', 'confirmado', 'concluido', 'cancelado'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Agendamento não encontrado' });

    const updateData = { status };
    if (status === 'concluido') {
      const servicesPrices = {
        'design-henna-pinca': 20,
        'design-personalizado-pinca': 10,
        'design-linha': 15,
        'nanoblading': 150,
        'retoque-nanoblading': 50,
        'brow-lamination-tintura': 35,
        'brow-lamination-simples': 30,
        'buco-linha': 5,
        'design-buco': 20,
        'design-henna-linha': 20,
        'design-henna-buco': 25,
        'maquiagem-social': 40,
        'clareamento-virilha': 20,
        'clareamento-axilas': 15,
        'Remoção a Laser': 60
      };
      updateData.valor = servicesPrices[booking.service] || 0;
    }

    const updatedBooking = await Booking.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(updatedBooking);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
