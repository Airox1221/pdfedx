const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { PDFDocument, rgb } = require('pdf-lib');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3001;

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Merge PDFs endpoint
app.post('/api/merge', upload.array('pdfs'), async (req, res) => {
  try {
    if (!req.files || req.files.length < 2) {
      return res.status(400).json({ error: 'At least 2 PDFs required' });
    }

    console.log(`Merging ${req.files.length} PDFs...`);

    const mergedPdf = await PDFDocument.create();

    for (const file of req.files) {
      const pdfDoc = await PDFDocument.load(file.buffer);
      const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
      pages.forEach(page => mergedPdf.addPage(page));
    }

    const mergedBytes = await mergedPdf.save();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="merged.pdf"');
    res.send(Buffer.from(mergedBytes));

    console.log('Merge completed successfully');
  } catch (error) {
    console.error('Merge error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Split PDF endpoint
app.post('/api/split', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'PDF file required' });
    }

    const { ranges } = req.body;
    if (!ranges) {
      return res.status(400).json({ error: 'Split ranges required' });
    }

    console.log('Splitting PDF...');

    const sourcePdf = await PDFDocument.load(req.file.buffer);
    const splitRanges = JSON.parse(ranges);

    const results = [];

    for (const range of splitRanges) {
      const newPdf = await PDFDocument.create();
      const pages = await newPdf.copyPages(sourcePdf, range.pages);
      pages.forEach(page => newPdf.addPage(page));

      const bytes = await newPdf.save();
      results.push({
        name: range.name,
        data: Buffer.from(bytes).toString('base64'),
      });
    }

    res.json({ splits: results });

    console.log(`Split into ${results.length} documents`);
  } catch (error) {
    console.error('Split error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add image to PDF endpoint
app.post('/api/add-image', upload.fields([
  { name: 'pdf', maxCount: 1 },
  { name: 'image', maxCount: 1 }
]), async (req, res) => {
  try {
    if (!req.files.pdf || !req.files.image) {
      return res.status(400).json({ error: 'PDF and image files required' });
    }

    const { pageIndex, x, y, width, height } = req.body;

    console.log('Adding image to PDF...');

    const pdfDoc = await PDFDocument.load(req.files.pdf[0].buffer);
    const pages = pdfDoc.getPages();
    const page = pages[parseInt(pageIndex)];

    const imageFile = req.files.image[0];
    let image;

    if (imageFile.mimetype === 'image/png') {
      image = await pdfDoc.embedPng(imageFile.buffer);
    } else {
      image = await pdfDoc.embedJpg(imageFile.buffer);
    }

    page.drawImage(image, {
      x: parseFloat(x),
      y: page.getHeight() - parseFloat(y) - parseFloat(height),
      width: parseFloat(width),
      height: parseFloat(height),
    });

    const pdfBytes = await pdfDoc.save();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="with-image.pdf"');
    res.send(Buffer.from(pdfBytes));

    console.log('Image added successfully');
  } catch (error) {
    console.error('Add image error:', error);
    res.status(500).json({ error: error.message });
  }
});

// N-up layout endpoint
app.post('/api/nup', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'PDF file required' });
    }

    const config = JSON.parse(req.body.config);
    const { pagesPerSheet, spacing, margin, orientation } = config;

    console.log(`Creating ${pagesPerSheet}-up layout...`);

    const sourcePdf = await PDFDocument.load(req.file.buffer);
    const newPdf = await PDFDocument.create();

    const sourcePages = sourcePdf.getPages();
    const gridConfig = getGridConfig(pagesPerSheet);

    const pageWidth = orientation === 'landscape' ? 842 : 595; // A4 in points
    const pageHeight = orientation === 'landscape' ? 595 : 842;

    const totalPages = sourcePages.length;
    const sheetsNeeded = Math.ceil(totalPages / pagesPerSheet);

    for (let sheet = 0; sheet < sheetsNeeded; sheet++) {
      const newPage = newPdf.addPage([pageWidth, pageHeight]);
      const startIdx = sheet * pagesPerSheet;

      for (let i = 0; i < pagesPerSheet && startIdx + i < totalPages; i++) {
        const sourcePageIndex = startIdx + i;
        const [embeddedPage] = await newPdf.embedPdf(sourcePdf, [sourcePageIndex]);

        const { row, col } = getGridPosition(i, gridConfig);
        const cellWidth = (pageWidth - 2 * margin - (gridConfig.cols - 1) * spacing) / gridConfig.cols;
        const cellHeight = (pageHeight - 2 * margin - (gridConfig.rows - 1) * spacing) / gridConfig.rows;

        const x = margin + col * (cellWidth + spacing);
        const y = pageHeight - margin - (row + 1) * cellHeight - row * spacing;

        const scale = Math.min(cellWidth / embeddedPage.width, cellHeight / embeddedPage.height);

        newPage.drawPage(embeddedPage, {
          x: x,
          y: y,
          width: embeddedPage.width * scale,
          height: embeddedPage.height * scale,
        });
      }
    }

    const nupBytes = await newPdf.save();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="nup-layout.pdf"');
    res.send(Buffer.from(nupBytes));

    console.log('N-up layout created successfully');
  } catch (error) {
    console.error('N-up error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Preview generation endpoint (optimized for large files)
app.post('/api/preview', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'PDF file required' });
    }

    console.log('Generating optimized preview...');

    const pdfDoc = await PDFDocument.load(req.file.buffer);
    const pageCount = pdfDoc.getPageCount();

    // For large PDFs, create a preview with reduced quality
    if (pageCount > 50) {
      // Limit to first 50 pages for preview
      const previewPdf = await PDFDocument.create();
      const maxPages = Math.min(50, pageCount);

      for (let i = 0; i < maxPages; i++) {
        const [page] = await previewPdf.copyPages(pdfDoc, [i]);
        previewPdf.addPage(page);
      }

      const previewBytes = await previewPdf.save({
        useObjectStreams: false,
        addDefaultPage: false,
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="preview.pdf"');
      res.send(Buffer.from(previewBytes));

      console.log(`Preview generated (${maxPages} pages)`);
    } else {
      // For smaller PDFs, return optimized version
      const optimizedBytes = await pdfDoc.save({
        useObjectStreams: false,
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="preview.pdf"');
      res.send(Buffer.from(optimizedBytes));

      console.log('Preview generated (all pages)');
    }
  } catch (error) {
    console.error('Preview error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper functions
function getGridConfig(pagesPerSheet) {
  const configs = {
    2: { rows: 2, cols: 1 },
    4: { rows: 2, cols: 2 },
    6: { rows: 3, cols: 2 },
  };
  return configs[pagesPerSheet] || configs[2];
}

function getGridPosition(index, config) {
  const row = Math.floor(index / config.cols);
  const col = index % config.cols;
  return { row, col };
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'PDF Editor API is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 PDF Editor API server running on http://localhost:${PORT}`);
  console.log(`📝 Available endpoints:`);
  console.log(`   POST /api/merge - Merge multiple PDFs`);
  console.log(`   POST /api/split - Split PDF into ranges`);
  console.log(`   POST /api/add-image - Add image to PDF`);
  console.log(`   POST /api/nup - Create N-up layout`);
  console.log(`   POST /api/preview - Generate optimized preview`);
  console.log(`   GET  /health - Health check`);
});

module.exports = app;
