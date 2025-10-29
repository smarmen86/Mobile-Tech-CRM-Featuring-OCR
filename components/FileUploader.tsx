import React, { useCallback } from 'react';
import { DocumentTextIcon } from './icons/DocumentTextIcon';

interface FileUploaderProps {
  onFileSelect: (files: File[]) => void;
  disabled: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelect, disabled }) => {

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      onFileSelect(Array.from(files));
    }
  };
  
  const handleDragOver = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    if (disabled) return;
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
        onFileSelect(Array.from(event.dataTransfer.files));
    }
  }, [onFileSelect, disabled]);

  const baseClasses = "flex flex-col items-center justify-center w-full h-64 border-2 border-slate-600 border-dashed rounded-lg";
  const enabledClasses = "cursor-pointer bg-slate-800 hover:bg-slate-700/50 transition-colors duration-300";
  const disabledClasses = "cursor-not-allowed bg-slate-800/50 opacity-60";

  return (
    <div className="flex items-center justify-center w-full">
      <label
        htmlFor="dropzone-file"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`${baseClasses} ${disabled ? disabledClasses : enabledClasses}`}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <DocumentTextIcon className="w-10 h-10 mb-4 text-slate-400" />
          <p className="mb-2 text-sm text-slate-400">
            <span className="font-semibold text-cyan-400">Click to upload</span> or drag and drop files
          </p>
          <p className="text-xs text-slate-500">Upload one or more: PDF, PNG, JPG, or WEBP</p>
        </div>
        <input
          id="dropzone-file"
          type="file"
          className="hidden"
          accept="application/pdf, image/png, image/jpeg, image/webp"
          onChange={handleFileChange}
          disabled={disabled}
          multiple
        />
      </label>
    </div>
  );
};