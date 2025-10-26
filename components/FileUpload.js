'use client';

import { useCallback } from 'react';

export default function FileUpload({ onFilesUpload }) {
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    onFilesUpload(files);
  }, [onFilesUpload]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  const handleFileInput = useCallback((e) => {
    const files = Array.from(e.target.files);
    onFilesUpload(files);
  }, [onFilesUpload]);

  return (
    <div className="max-w-2xl mx-auto">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border-4 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 transition-colors cursor-pointer bg-white"
      >
        <svg
          className="mx-auto h-16 w-16 text-gray-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          Drop PDF or image files here
        </h3>
        <p className="text-gray-500 mb-4">or click to browse</p>
        <input
          type="file"
          multiple
          accept=".pdf,image/*"
          onChange={handleFileInput}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer"
        >
          Select Files
        </label>
        <p className="text-sm text-gray-400 mt-4">
          Supports PDF and image files (PNG, JPG)
        </p>
      </div>
    </div>
  );
}
