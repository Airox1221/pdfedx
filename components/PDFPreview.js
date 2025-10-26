'use client';

import { useState, useEffect, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function PDFPreview({ pdfBytes, selectedPages, onSelectPages, onReorder }) {
  const [numPages, setNumPages] = useState(0);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [draggedPage, setDraggedPage] = useState(null);
  const [pageOrder, setPageOrder] = useState([]);

  useEffect(() => {
    if (pdfBytes) {
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      
      return () => URL.revokeObjectURL(url);
    }
  }, [pdfBytes]);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPageOrder(Array.from({ length: numPages }, (_, i) => i));
  };

  const togglePageSelection = (pageNum) => {
    const newSelection = new Set(selectedPages);
    if (newSelection.has(pageNum)) {
      newSelection.delete(pageNum);
    } else {
      newSelection.add(pageNum);
    }
    onSelectPages(newSelection);
  };

  const selectRange = (start, end) => {
    const newSelection = new Set(selectedPages);
    const [min, max] = [Math.min(start, end), Math.max(start, end)];
    for (let i = min; i <= max; i++) {
      newSelection.add(i);
    }
    onSelectPages(newSelection);
  };

  const handleDragStart = (pageIndex) => {
    setDraggedPage(pageIndex);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (targetIndex) => {
    if (draggedPage === null) return;
    
    const newOrder = [...pageOrder];
    const draggedItem = newOrder[draggedPage];
    newOrder.splice(draggedPage, 1);
    newOrder.splice(targetIndex, 0, draggedItem);
    
    setPageOrder(newOrder);
    onReorder(newOrder);
    setDraggedPage(null);
  };

  const selectAll = () => {
    const allPages = new Set(Array.from({ length: numPages }, (_, i) => i + 1));
    onSelectPages(allPages);
  };

  const clearSelection = () => {
    onSelectPages(new Set());
  };

  if (!pdfUrl) {
    return (
      <div className="flex items-center justify-center h-96 bg-white rounded-lg shadow">
        <p className="text-gray-500">No PDF loaded</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Preview ({numPages} pages)
        </h2>
        <div className="flex gap-2">
          <button
            onClick={selectAll}
            className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded transition-colors"
          >
            Select All
          </button>
          <button
            onClick={clearSelection}
            className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded transition-colors"
          >
            Clear
          </button>
          <span className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded">
            {selectedPages.size} selected
          </span>
        </div>
      </div>

      <Document
        file={pdfUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        loading={
          <div className="flex items-center justify-center py-12">
            <div className="loading-spinner"></div>
            <span className="ml-2 text-gray-600">Loading PDF...</span>
          </div>
        }
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {pageOrder.map((pageIndex, displayIndex) => (
            <div
              key={pageIndex}
              draggable
              onDragStart={() => handleDragStart(displayIndex)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(displayIndex)}
              className={`thumbnail-page ${
                selectedPages.has(pageIndex + 1) ? 'selected' : ''
              } ${draggedPage === displayIndex ? 'dragging' : ''}`}
            >
              <div className="relative">
                <Page
                  pageNumber={pageIndex + 1}
                  width={200}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
                <div className="absolute top-2 left-2 bg-white rounded px-2 py-1 text-xs font-semibold shadow">
                  {displayIndex + 1}
                </div>
                <div className="absolute top-2 right-2">
                  <input
                    type="checkbox"
                    checked={selectedPages.has(pageIndex + 1)}
                    onChange={() => togglePageSelection(pageIndex + 1)}
                    className="w-5 h-5 cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Document>
    </div>
  );
}
