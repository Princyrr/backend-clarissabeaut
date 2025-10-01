import express from "express";
import Booking from "../models/Booking.js";

const router = express.Router();

// GET /api/reports
router.get("/", async (req, res) => {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // janeiro = 0
    const currentYear = now.getFullYear();

    // Calcula último dia do mês atual
    const lastDay = new Date(currentYear, currentMonth, 0).getDate();

    // Agendamentos concluídos no mês atual
    const bookings = await Booking.find({
      status: "concluido",
      date: {
        $gte: new Date(`${currentYear}-${String(currentMonth).padStart(2, "0")}-01`),
        $lte: new Date(`${currentYear}-${String(currentMonth).padStart(2, "0")}-${lastDay}`)
      }
    });

    // Receita total do mês
    const receita = bookings.reduce((acc, b) => acc + (b.valor || 0), 0);

    // Contagem de serviços para gráfico de pizza
    const servicos = {};
    bookings.forEach(b => {
      servicos[b.service] = (servicos[b.service] || 0) + 1;
    });

    // Quantidade de atendimentos e receita por mês (para gráfico de barras)
    const monthlyCounts = await Booking.aggregate([
      {
        $match: { status: "concluido" }
      },
      {
        $group: {
          _id: { month: { $month: "$date" }, year: { $year: "$date" } },
          count: { $sum: 1 },
          revenue: { $sum: "$valor" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    res.json({ receita, servicos, monthlyCounts });
  } catch (err) {
    console.error("[ERRO RELATÓRIO]", err);
    res.status(500).json({ error: "Erro ao gerar relatório" });
  }
});

export default router;
