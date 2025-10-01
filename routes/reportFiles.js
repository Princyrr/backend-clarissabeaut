import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// GET /api/reports/files
router.get('/files', (req, res) => {
  try {
    const reportsDir = path.join(process.cwd(), 'reports');

    if (!fs.existsSync(reportsDir)) {
      return res.json([]);
    }

    const files = fs.readdirSync(reportsDir)
      .filter(file => file.endsWith('.pdf'))
      .sort((a, b) => b.localeCompare(a)); // do mais recente para o mais antigo

    res.json(files);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar arquivos de relatório' });
  }
});

// GET /api/reports/files/:filename
router.get('/files/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(process.cwd(), 'reports', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    res.sendFile(filePath);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao enviar arquivo' });
  }
});

export default router;
