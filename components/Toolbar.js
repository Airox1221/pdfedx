'use client';

import { useState } from 'react';

export default function Toolbar({
  onMerge,
  onSplit,
  onAddImage,
  onNUp,
  onRotate,
  onDelete,
  onReorder,
  onReset,
  onDownload,
  onPreviewServerSide,
  selectedPages,
  totalPages,
  hasMultiplePdfs,
  imageFiles,
}) {
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showNUpModal, setShowNUpModal] = useState(false);
  const [splitRanges, setSplitRanges] = useState('1-3, 4-6');
  const [useBackend, setUseBackend] = useState(false);

  const handleSplit = () => {
    const ranges = parseSplitRanges(splitRanges);
    if (ranges.length > 0) {
      onSplit(ranges);
      setShowSplitModal(false);
    }
  };

  const parseSplitRanges = (input) => {
    const ranges = [];
    const parts = input.split(',').map(s => s.trim());
    
    parts.forEach((part, index) => {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(n => parseInt(n.trim()));
        if (start && end && start <= end && start >= 1 && end <= totalPages) {
          ranges.push({
            name: `pages_${start}-${end}`,
            pages: Array.from({ length: end - start + 1 }, (_, i) => start - 1 + i)
          });
        }
      } else {
        const pageNum = parseInt(part);
        if (pageNum >= 1 && pageNum <= totalPages) {
          ranges.push({
            name: `page_${pageNum}`,
            pages: [pageNum - 1]
          });
        }
      }
    });
    
    return ranges;
  };

  const handleSplitSelected = () => {
    if (selectedPages.size === 0) return;
    
    const pages = Array.from(selectedPages).sort((a, b) => a - b).map(p => p - 1);
    onSplit([{ name: 'selected', pages }]);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 sticky top-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Tools</h3>
      
      <div className="space-y-2">
        {/* Merge */}
        {hasMultiplePdfs && (
          <div className="border-b pb-3 mb-3">
            <button
              onClick={() => onMerge(false)}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors mb-2"
            >
              Merge PDFs (Client)
            </button>
            <button
              onClick={() => onMerge(true)}
              className="w-full px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors"
            >
              Merge PDFs (Server)
            </button>
          </div>
        )}

        {/* Split */}
        <button
          onClick={() => setShowSplitModal(true)}
          className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          Split PDF
        </button>

        {selectedPages.size > 0 && (
          <button
            onClick={handleSplitSelected}
            className="w-full px-4 py-2 bg-green-400 text-white rounded hover:bg-green-500 transition-colors text-sm"
          >
            Extract Selected ({selectedPages.size})
          </button>
        )}

        {/* Add Image */}
        {imageFiles.length > 0 && (
          <button
            onClick={() => setShowImageModal(true)}
            className="w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
          >
            Add Image
          </button>
        )}

        {/* N-up */}
        <button
          onClick={() => setShowNUpModal(true)}
          className="w-full px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
        >
          N-up Layout
        </button>

        {/* Page Actions */}
        {selectedPages.size === 1 && (
          <div className="border-t pt-3 mt-3">
            <p className="text-sm text-gray-600 mb-2">Page Actions:</p>
            <button
              onClick={() => onRotate(Array.from(selectedPages)[0] - 1, 90)}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors mb-2"
            >
              Rotate 90°
            </button>
            <button
              onClick={() => onDelete(Array.from(selectedPages)[0] - 1)}
              className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              Delete Page
            </button>
          </div>
        )}

        {/* Preview & Download */}
        <div className="border-t pt-3 mt-3">
          <button
            onClick={onPreviewServerSide}
            className="w-full px-4 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600 transition-colors mb-2"
          >
            Preview (Server)
          </button>
          <button
            onClick={onDownload}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors mb-2"
          >
            Download PDF
          </button>
          <button
            onClick={onReset}
            className="w-full px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Split Modal */}
      {showSplitModal && (
        <Modal onClose={() => setShowSplitModal(false)} title="Split PDF">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Page Ranges (e.g., 1-3, 5, 7-10)
              </label>
              <input
                type="text"
                value={splitRanges}
                onChange={(e) => setSplitRanges(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="1-3, 4-6"
              />
            </div>
            <button
              onClick={handleSplit}
              className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            >
              Split & Download
            </button>
          </div>
        </Modal>
      )}

      {/* Image Modal */}
      {showImageModal && (
        <ImagePlacementModal
          imageFiles={imageFiles}
          totalPages={totalPages}
          onPlace={(placement) => {
            onAddImage(placement);
            setShowImageModal(false);
          }}
          onClose={() => setShowImageModal(false)}
        />
      )}

      {/* N-up Modal */}
      {showNUpModal && (
        <NUpModal
          onApply={(config, backend) => {
            onNUp(config, backend);
            setShowNUpModal(false);
          }}
          onClose={() => setShowNUpModal(false)}
        />
      )}
    </div>
  );
}

function Modal({ children, onClose, title }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-start z-[9999] p-4 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl mt-20 ml-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ImagePlacementModal({ imageFiles, totalPages, onPlace, onClose }) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedPage, setSelectedPage] = useState(1);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [size, setSize] = useState({ width: 200, height: 200 });

  const handlePlace = async () => {
    const imageFile = imageFiles[selectedImage];
    onPlace({
      imageData: imageFile.data,
      mimeType: imageFile.mimeType,
      pageIndex: selectedPage - 1,
      x: position.x,
      y: position.y,
      width: size.width,
      height: size.height,
    });
  };

  return (
    <Modal onClose={onClose} title="Add Image to Page">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Image
          </label>
          <select
            value={selectedImage}
            onChange={(e) => setSelectedImage(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {imageFiles.map((file, idx) => (
              <option key={idx} value={idx}>{file.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Page Number
          </label>
          <input
            type="number"
            min="1"
            max={totalPages}
            value={selectedPage}
            onChange={(e) => setSelectedPage(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              X Position
            </label>
            <input
              type="number"
              value={position.x}
              onChange={(e) => setPosition({ ...position, x: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Y Position
            </label>
            <input
              type="number"
              value={position.y}
              onChange={(e) => setPosition({ ...position, y: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Width
            </label>
            <input
              type="number"
              value={size.width}
              onChange={(e) => setSize({ ...size, width: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Height
            </label>
            <input
              type="number"
              value={size.height}
              onChange={(e) => setSize({ ...size, height: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <button
          onClick={handlePlace}
          className="w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
        >
          Place Image
        </button>
      </div>
    </Modal>
  );
}

function NUpModal({ onApply, onClose }) {
  const [pagesPerSheet, setPagesPerSheet] = useState(2);
  const [spacing, setSpacing] = useState(10);
  const [margin, setMargin] = useState(20);
  const [orientation, setOrientation] = useState('portrait');
  const [useBackend, setUseBackend] = useState(false);

  const handleApply = () => {
    onApply(
      {
        pagesPerSheet,
        spacing,
        margin,
        orientation,
      },
      useBackend
    );
  };

  return (
    <Modal onClose={onClose} title="N-up Layout">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pages per Sheet
          </label>
          <select
            value={pagesPerSheet}
            onChange={(e) => setPagesPerSheet(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={2}>2 pages</option>
            <option value={4}>4 pages</option>
            <option value={6}>6 pages</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Spacing: {spacing}px
          </label>
          <input
            type="range"
            min="0"
            max="50"
            value={spacing}
            onChange={(e) => setSpacing(parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Margin: {margin}px
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={margin}
            onChange={(e) => setMargin(parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Orientation
          </label>
          <select
            value={orientation}
            onChange={(e) => setOrientation(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
          </select>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            checked={useBackend}
            onChange={(e) => setUseBackend(e.target.checked)}
            className="w-4 h-4 mr-2"
          />
          <label className="text-sm text-gray-700">
            Use server-side processing (for large files)
          </label>
        </div>

        <button
          onClick={handleApply}
          className="w-full px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
        >
          Apply N-up Layout
        </button>
      </div>
    </Modal>
  );
}
