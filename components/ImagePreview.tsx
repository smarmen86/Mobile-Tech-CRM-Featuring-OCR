import React from 'react';

interface ImagePreviewProps {
  imageUrl: string;
  fileType: string;
  onClear: () => void;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({ imageUrl, fileType, onClear }) => {
  return (
    <div className="relative group w-full max-w-lg mx-auto">
      {fileType.startsWith('image/') ? (
        <img
          src={imageUrl}
          alt="Document Preview"
          className="rounded-lg shadow-lg w-full h-auto object-contain max-h-[60vh]"
        />
      ) : fileType === 'application/pdf' ? (
        <object
          data={imageUrl}
          type="application/pdf"
          width="100%"
          className="rounded-lg shadow-lg h-auto object-contain max-h-[60vh] min-h-[60vh]"
        >
          <div className="flex flex-col items-center justify-center h-full p-4 bg-slate-800 rounded-lg">
            <p className="text-center text-slate-400">
              Your browser does not support PDF previews.
            </p>
            <a
              href={imageUrl}
              download
              className="mt-2 text-cyan-400 hover:underline font-semibold"
            >
              Download PDF to view
            </a>
          </div>
        </object>
      ) : (
         <div className="rounded-lg shadow-lg w-full min-h-[60vh] bg-slate-800 flex items-center justify-center p-4">
            <p className="text-slate-400">Unsupported file type for preview.</p>
         </div>
      )}
      <button
        onClick={onClear}
        className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-2 hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-white/50 transition-opacity opacity-0 group-hover:opacity-100 z-10"
        aria-label="Remove image"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};