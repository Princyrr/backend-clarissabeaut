// routes/closed-dates.js
import express from 'express';
import ClosedDate from '../models/ClosedDate.js'; // caminho correto para o model

const router = express.Router();

// Listar datas fechadas
router.get('/', async (req, res) => {
  try {
    const dates = await ClosedDate.find();
    res.json(dates);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar datas fechadas' });
  }
});

// Adicionar data fechada
router.post('/', async (req, res) => {
  const { date } = req.body;
  if (!date) return res.status(400).json({ error: 'Data obrigatória' });

  try {
    const existing = await ClosedDate.findOne({ date });
    if (existing) return res.status(400).json({ error: 'Data já marcada como fechada' });

    const newDate = new ClosedDate({ date });
    await newDate.save();
    res.status(201).json(newDate);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao adicionar data fechada' });
  }
});

// Remover data fechada
router.delete('/:date', async (req, res) => {
  try {
    const { date } = req.params;
    await ClosedDate.deleteOne({ date });
    res.json({ message: 'Data removida com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover data fechada' });
  }
});

export default router;
