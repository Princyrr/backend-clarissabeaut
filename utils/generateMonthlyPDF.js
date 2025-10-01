import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import Booking from '../models/Booking.js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import cron from 'node-cron';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const generateMonthlyPDF = async () => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const bookings = await Booking.find({
    status: 'concluido',
    date: {
      $gte: new Date(`${year}-${month}-01`),
      $lte: new Date(`${year}-${month}-31`)
    }
  });

  const receita = bookings.reduce((acc, b) => acc + (b.price || 0), 0);

  const doc = new PDFDocument();
  const reportsDir = path.join(process.cwd(), 'reports');
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir);

  const filePath = path.join(reportsDir, `relatorio_${year}_${month}.pdf`);
  doc.pipe(fs.createWriteStream(filePath));

  doc.fontSize(20).text(`Relatório Mensal - ${month}/${year}`, { align: 'center' });
  doc.moveDown();
  doc.fontSize(16).text(`Faturamento do mês: R$ ${receita.toFixed(2)}`);
  doc.moveDown();

  doc.text('Procedimentos realizados:');
  bookings.forEach(b => {
    doc.text(`- ${b.service} | ${b.name} | ${b.date.toLocaleDateString()} | R$ ${b.price || 0}`);
  });

  doc.end();

  // Opcional: enviar por e-mail
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: 'claraalcantara@icloud.com',
    subject: `Relatório Mensal - ${month}/${year}`,
    text: 'Segue em anexo o relatório mensal.',
    attachments: [{ path: filePath }]
  });

  console.log('PDF do mês gerado e enviado!');
};

// Cron job: todo dia 30/31 às 00:01
cron.schedule('1 0 30-31 * *', generateMonthlyPDF);

export default generateMonthlyPDF;
