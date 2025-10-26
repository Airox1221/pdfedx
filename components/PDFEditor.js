'use client';

import { useState, useRef, useCallback } from 'react';
import { PDFDocument } from 'pdf-lib';
import FileUpload from './FileUpload';
import PDFPreview from './PDFPreview';
import Toolbar from './Toolbar';
import ProgressBar from './ProgressBar';
import ErrorMessage from './ErrorMessage';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function PDFEditor() {
  const [pdfFiles, setPdfFiles] = useState([]);
  const [originalFiles, setOriginalFiles] = useState([]);
  const [currentPdf, setCurrentPdf] = useState(null);
  const [pdfBytes, setPdfBytes] = useState(null);
  const [selectedPages, setSelectedPages] = useState(new Set());
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [operation, setOperation] = useState('');

  const handleFilesUpload = async (files) => {
    try {
      setError(null);
      setLoading(true);
      setOperation('Loading files...');
      
      const uploadedFiles = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProgress(((i + 1) / files.length) * 100);
        
        if (file.type === 'application/pdf') {
          const arrayBuffer = await file.arrayBuffer();
          uploadedFiles.push({
            name: file.name,
            data: arrayBuffer,
            type: 'pdf'
          });
        } else if (file.type.startsWith('image/')) {
          const arrayBuffer = await file.arrayBuffer();
          uploadedFiles.push({
            name: file.name,
            data: arrayBuffer,
            type: 'image',
            mimeType: file.type
          });
        }
      }
      
      setPdfFiles(uploadedFiles);
      setOriginalFiles(JSON.parse(JSON.stringify(uploadedFiles)));
      
      if (uploadedFiles.length > 0 && uploadedFiles[0].type === 'pdf') {
        const pdfDoc = await PDFDocument.load(uploadedFiles[0].data);
        setCurrentPdf(pdfDoc);
        const bytes = await pdfDoc.save();
        setPdfBytes(bytes);
      }
      
      setProgress(0);
      setLoading(false);
      setOperation('');
    } catch (err) {
      setError(`Failed to load files: ${err.message}`);
      setLoading(false);
      setProgress(0);
    }
  };

  const mergePDFs = async (useBackend = false) => {
    try {
      setError(null);
      setLoading(true);
      setOperation('Merging PDFs...');
      setProgress(0);

      const pdfDocs = pdfFiles.filter(f => f.type === 'pdf');
      
      if (pdfDocs.length < 2) {
        throw new Error('Need at least 2 PDFs to merge');
      }

      if (useBackend) {
        // Backend merge for large files
        const formData = new FormData();
        pdfDocs.forEach((doc, index) => {
          const blob = new Blob([doc.data], { type: 'application/pdf' });
          formData.append('pdfs', blob, doc.name);
        });

        const response = await fetch(`${API_URL}/api/merge`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) throw new Error('Backend merge failed');

        const mergedBytes = await response.arrayBuffer();
        setPdfBytes(new Uint8Array(mergedBytes));
        const mergedDoc = await PDFDocument.load(mergedBytes);
        setCurrentPdf(mergedDoc);
      } else {
        // Client-side merge
        const mergedPdf = await PDFDocument.create();
        
        for (let i = 0; i < pdfDocs.length; i++) {
          const doc = pdfDocs[i];
          setProgress(((i + 1) / pdfDocs.length) * 100);
          
          const pdfDoc = await PDFDocument.load(doc.data);
          const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
          pages.forEach(page => mergedPdf.addPage(page));
        }
        
        const mergedBytes = await mergedPdf.save();
        setPdfBytes(mergedBytes);
        setCurrentPdf(mergedPdf);
      }
      
      setProgress(0);
      setLoading(false);
      setOperation('');
    } catch (err) {
      setError(`Merge failed: ${err.message}`);
      setLoading(false);
      setProgress(0);
    }
  };

  const splitPDF = async (ranges) => {
    try {
      setError(null);
      setLoading(true);
      setOperation('Splitting PDF...');
      
      if (!currentPdf) throw new Error('No PDF loaded');
      
      const results = [];
      
      for (let i = 0; i < ranges.length; i++) {
        setProgress(((i + 1) / ranges.length) * 100);
        
        const range = ranges[i];
        const newPdf = await PDFDocument.create();
        const pages = await newPdf.copyPages(currentPdf, range.pages);
        pages.forEach(page => newPdf.addPage(page));
        
        const bytes = await newPdf.save();
        results.push({
          name: `split_${range.name}.pdf`,
          bytes: bytes
        });
      }
      
      // Download all splits
      results.forEach(result => {
        const blob = new Blob([result.bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.name;
        a.click();
        URL.revokeObjectURL(url);
      });
      
      setProgress(0);
      setLoading(false);
      setOperation('');
    } catch (err) {
      setError(`Split failed: ${err.message}`);
      setLoading(false);
      setProgress(0);
    }
  };

  const addImage = async (imagePlacement) => {
    try {
      setError(null);
      setLoading(true);
      setOperation('Adding image...');
      
      if (!currentPdf) throw new Error('No PDF loaded');
      
      const { imageData, pageIndex, x, y, width, height, mimeType } = imagePlacement;
      
      const pdfDoc = await PDFDocument.load(await currentPdf.save());
      const pages = pdfDoc.getPages();
      const page = pages[pageIndex];
      
      let image;
      if (mimeType === 'image/png') {
        image = await pdfDoc.embedPng(imageData);
      } else {
        image = await pdfDoc.embedJpg(imageData);
      }
      
      page.drawImage(image, {
        x: x,
        y: page.getHeight() - y - height,
        width: width,
        height: height,
      });
      
      const bytes = await pdfDoc.save();
      setPdfBytes(bytes);
      setCurrentPdf(pdfDoc);
      
      setLoading(false);
      setOperation('');
    } catch (err) {
      setError(`Add image failed: ${err.message}`);
      setLoading(false);
    }
  };

  const createNUp = async (config, useBackend = false) => {
    try {
      setError(null);
      setLoading(true);
      setOperation('Creating N-up layout...');
      
      if (!currentPdf) throw new Error('No PDF loaded');

      if (useBackend) {
        // Backend N-up for large files
        const formData = new FormData();
        const blob = new Blob([await currentPdf.save()], { type: 'application/pdf' });
        formData.append('pdf', blob, 'document.pdf');
        formData.append('config', JSON.stringify(config));

        const response = await fetch(`${API_URL}/api/nup`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) throw new Error('Backend N-up failed');

        const nupBytes = await response.arrayBuffer();
        setPdfBytes(new Uint8Array(nupBytes));
        const nupDoc = await PDFDocument.load(nupBytes);
        setCurrentPdf(nupDoc);
      } else {
        // Client-side N-up
        const { pagesPerSheet, spacing, margin, orientation } = config;
        const sourcePdf = await PDFDocument.load(await currentPdf.save());
        const newPdf = await PDFDocument.create();
        
        const sourcePages = sourcePdf.getPages();
        const gridConfig = getGridConfig(pagesPerSheet);
        
        const pageWidth = orientation === 'landscape' ? 842 : 595; // A4 size in points
        const pageHeight = orientation === 'landscape' ? 595 : 842;
        
        const totalPages = sourcePages.length;
        const sheetsNeeded = Math.ceil(totalPages / pagesPerSheet);
        
        for (let sheet = 0; sheet < sheetsNeeded; sheet++) {
          setProgress((sheet / sheetsNeeded) * 100);
          
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
        
        const bytes = await newPdf.save();
        setPdfBytes(bytes);
        setCurrentPdf(newPdf);
      }
      
      setProgress(0);
      setLoading(false);
      setOperation('');
    } catch (err) {
      setError(`N-up failed: ${err.message}`);
      setLoading(false);
      setProgress(0);
    }
  };

  const getGridConfig = (pagesPerSheet) => {
    const configs = {
      2: { rows: 2, cols: 1 },
      4: { rows: 2, cols: 2 },
      6: { rows: 3, cols: 2 },
    };
    return configs[pagesPerSheet] || configs[2];
  };

  const getGridPosition = (index, config) => {
    const row = Math.floor(index / config.cols);
    const col = index % config.cols;
    return { row, col };
  };

  const rotatePage = async (pageIndex, degrees) => {
    try {
      setError(null);
      const pdfDoc = await PDFDocument.load(await currentPdf.save());
      const page = pdfDoc.getPages()[pageIndex];
      page.setRotation({ angle: page.getRotation().angle + degrees });
      
      const bytes = await pdfDoc.save();
      setPdfBytes(bytes);
      setCurrentPdf(pdfDoc);
    } catch (err) {
      setError(`Rotate failed: ${err.message}`);
    }
  };

  const deletePage = async (pageIndex) => {
    try {
      setError(null);
      const pdfDoc = await PDFDocument.load(await currentPdf.save());
      pdfDoc.removePage(pageIndex);
      
      const bytes = await pdfDoc.save();
      setPdfBytes(bytes);
      setCurrentPdf(pdfDoc);
    } catch (err) {
      setError(`Delete failed: ${err.message}`);
    }
  };

  const reorderPages = async (newOrder) => {
    try {
      setError(null);
      const sourcePdf = await PDFDocument.load(await currentPdf.save());
      const newPdf = await PDFDocument.create();
      
      const pages = await newPdf.copyPages(sourcePdf, newOrder);
      pages.forEach(page => newPdf.addPage(page));
      
      const bytes = await newPdf.save();
      setPdfBytes(bytes);
      setCurrentPdf(newPdf);
    } catch (err) {
      setError(`Reorder failed: ${err.message}`);
    }
  };

  const reset = () => {
    setPdfFiles(JSON.parse(JSON.stringify(originalFiles)));
    if (originalFiles.length > 0 && originalFiles[0].type === 'pdf') {
      PDFDocument.load(originalFiles[0].data).then(pdfDoc => {
        setCurrentPdf(pdfDoc);
        return pdfDoc.save();
      }).then(bytes => {
        setPdfBytes(bytes);
      });
    }
    setSelectedPages(new Set());
    setError(null);
  };

  const downloadPDF = () => {
    if (!pdfBytes) return;
    
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'edited-document.pdf';
    a.click();
    URL.revokeObjectURL(url);
  };

  const previewServerSide = async () => {
    try {
      setError(null);
      setLoading(true);
      setOperation('Generating server preview...');
      
      if (!currentPdf) throw new Error('No PDF loaded');
      
      const formData = new FormData();
      const blob = new Blob([await currentPdf.save()], { type: 'application/pdf' });
      formData.append('pdf', blob, 'document.pdf');

      const response = await fetch(`${API_URL}/api/preview`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Preview generation failed');

      const previewBytes = await response.arrayBuffer();
      setPdfBytes(new Uint8Array(previewBytes));
      const previewDoc = await PDFDocument.load(previewBytes);
      setCurrentPdf(previewDoc);
      
      setLoading(false);
      setOperation('');
    } catch (err) {
      setError(`Preview failed: ${err.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">PDF Editor</h1>
        <p className="text-gray-600">Upload, merge, split, and edit your PDFs with ease</p>
      </header>

      {error && <ErrorMessage message={error} onClose={() => setError(null)} />}
      
      {loading && <ProgressBar progress={progress} operation={operation} />}

      {!currentPdf ? (
        <FileUpload onFilesUpload={handleFilesUpload} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <Toolbar
              onMerge={mergePDFs}
              onSplit={splitPDF}
              onAddImage={addImage}
              onNUp={createNUp}
              onRotate={rotatePage}
              onDelete={deletePage}
              onReorder={reorderPages}
              onReset={reset}
              onDownload={downloadPDF}
              onPreviewServerSide={previewServerSide}
              selectedPages={selectedPages}
              totalPages={currentPdf?.getPageCount() || 0}
              hasMultiplePdfs={pdfFiles.filter(f => f.type === 'pdf').length > 1}
              imageFiles={pdfFiles.filter(f => f.type === 'image')}
            />
          </div>
          
          <div className="lg:col-span-3">
            <PDFPreview
              pdfBytes={pdfBytes}
              selectedPages={selectedPages}
              onSelectPages={setSelectedPages}
              onReorder={reorderPages}
            />
          </div>
        </div>
      )}
    </div>
  );
}
