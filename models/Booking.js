import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  service: String,
  date: Date,
  time: String,
  notes: String,
  status: {
    type: String,
    enum: ['pendente', 'concluido', 'cancelado'],
    default: 'pendente'
  },
  valor: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
