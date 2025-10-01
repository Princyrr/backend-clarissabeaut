import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Diretório onde os relatórios PDF são armazenados
const reportsDir = path.join(process.cwd(), 'reports');

// GET /api/reports/files - lista todos os PDFs disponíveis
router.get('/files', (req, res) => {
  try {
    if (!fs.existsSync(reportsDir)) {
      return res.json([]);
    }

    const files = fs.readdirSync(reportsDir)
      .filter(file => file.endsWith('.pdf'))
      .sort((a, b) => b.localeCompare(a)); // do mais recente para o mais antigo

    res.json(files);
  } catch (err) {
    console.error('[ERRO LISTAR RELATÓRIOS]', err);
    res.status(500).json({ error: 'Erro ao listar arquivos de relatório' });
  }
});

// GET /api/reports/files/:filename - envia PDF específico
router.get('/files/:filename', (req, res) => {
  try {
    const { filename } = req.params;

    // Evita path traversal
    if (filename.includes('..')) {
      return res.status(400).json({ error: 'Nome de arquivo inválido' });
    }

    const filePath = path.join(reportsDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    // Envia o arquivo como download
    res.download(filePath, filename);
  } catch (err) {
    console.error('[ERRO ENVIAR RELATÓRIO]', err);
    res.status(500).json({ error: 'Erro ao enviar arquivo' });
  }
});

export default router;
