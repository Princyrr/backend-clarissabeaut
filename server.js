import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import closedDatesRoutes from './routes/closed-dates.js';
import bookingRoutes from './routes/bookings.js';

dotenv.config();
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'carregado' : 'não carregado');


const app = express();

app.use(cors());
app.use(express.json());

// Rotas
app.use('/api/closed-dates', closedDatesRoutes);
app.use('/api/bookings', bookingRoutes);

// Conexão com MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB conectado com sucesso');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
  })
  .catch((err) => {
    console.error('Erro ao conectar com MongoDB:', err);
  });
