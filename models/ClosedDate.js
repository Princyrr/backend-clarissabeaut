// models/ClosedDate.js
import mongoose from 'mongoose';

const ClosedDateSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true }
});

export default mongoose.model('ClosedDate', ClosedDateSchema);
