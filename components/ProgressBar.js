'use client';

export default function ProgressBar({ progress, operation }) {
  if (!operation) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-lg p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center mb-2">
          <div className="loading-spinner mr-3"></div>
          <span className="text-gray-700 font-medium">{operation}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="progress-bar"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="text-right text-sm text-gray-600 mt-1">
          {Math.round(progress)}%
        </div>
      </div>
    </div>
  );
}
