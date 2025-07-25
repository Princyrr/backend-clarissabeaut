import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  service: String,
  date: Date,
  time: String,
  notes: String
}, { timestamps: true });

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
