import React, { useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./dialog";
import { Button } from "./button";
import { Viewer, Worker } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import * as docx from "docx-preview";

export interface DocumentPreview {
  url: string;
  name: string;
  type?: string;
}

interface DocumentPreviewModalProps {
  open: boolean;
  onClose: () => void;
  document: DocumentPreview | null;
}

const getFileExtension = (filename: string) => filename.split('.').pop()?.toLowerCase();

const getFileTypeIcon = (ext: string) => {
  switch (ext) {
    case 'pdf':
      return (
        <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
        </svg>
      );
    case 'docx':
    case 'doc':
      return (
        <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
        </svg>
      );
    case 'txt':
      return (
        <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
        </svg>
      );
    case 'csv':
      return (
        <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
        </svg>
      );
    default:
      return (
        <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
        </svg>
      );
  }
};



const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({ open, onClose, document }) => {
  const docxContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // DOCX Preview logic
    if (document && getFileExtension(document.name) === "docx" && docxContainerRef.current) {
      fetch(document.url)
        .then((res) => res.arrayBuffer())
        .then((ab) => {
          docx.renderAsync(ab, docxContainerRef.current!);
        });
    }
  }, [document]);

  if (!document) return null;
  
  const ext = getFileExtension(document.name || "");
  const isImage = ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg", "tif", "tiff"].includes(ext || "");
  const isPdf = ext === "pdf";
  const isDocx = ext === "docx";
  const isTxt = ext === "txt";
  const isCsv = ext === "csv";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-full h-[90vh] bg-white shadow-2xl border-0">
        <DialogHeader className="border-b border-gray-100 pb-4">
          <DialogTitle asChild>
            <div className="flex items-center gap-3 w-full">
              {getFileTypeIcon(ext || "")}
              <div className=" min-w-0">
                <div className="truncate text-lg font-semibold text-gray-900" title={document.name}>
                  {document.name}
                </div>

              </div>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col min-h-0 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
          {isPdf && (
            <div className="w-full h-full overflow-hidden">
              <Worker workerUrl={`https://unpkg.com/pdfjs-dist@2.16.105/build/pdf.worker.min.js`}>
                <div className="h-full bg-white">
                  <Viewer fileUrl={document.url} />
                </div>
              </Worker>
            </div>
          )}
          
          {isImage && (
            <div className="flex items-center justify-center h-full p-6 bg-gradient-to-br from-gray-50 to-gray-100">
              <img
                src={document.url}
                alt={document.name}
                className="max-h-full max-w-full object-contain rounded-lg shadow-lg border border-white"
                style={{ objectFit: "contain" }}
              />
            </div>
          )}
          
          {isDocx && (
            <div className="w-full h-full overflow-auto bg-white">
              <div ref={docxContainerRef} className="min-h-full p-6" />
            </div>
          )}
          
          {isTxt && (
            <div className="w-full h-full">
              <TextFilePreview url={document.url} />
            </div>
          )}
          
          {isCsv && (
            <div className="w-full h-full">
              <TextFilePreview url={document.url} />
            </div>
          )}
          
          {!isPdf && !isImage && !isDocx && !isTxt && !isCsv && (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Preview not available</h3>
              <p className="text-gray-600 mb-4 max-w-sm">
                This file type cannot be previewed in the browser. Download the file to view it locally.
              </p>
              <a
                href={document.url}
                download={document.name}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Download File
              </a>
            </div>
          )}
        </div>
        
        <DialogFooter className="border-t border-gray-100 pt-4">
          <div className="flex items-center gap-3">
            <a
              href={document.url}
              download={document.name}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button 
                variant="outline" 
                className="inline-flex items-center gap-2 hover:bg-gray-50 border-gray-300"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Download
              </Button>
            </a>
            <Button 
              variant="secondary" 
              onClick={onClose} 
              type="button"
              className="bg-gray-100 hover:bg-gray-200 text-gray-900 border-0"
            >
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const TextFilePreview: React.FC<{ url: string }> = ({ url }) => {
  const [content, setContent] = React.useState<string>("Loading...");
  const [isLoading, setIsLoading] = React.useState(true);
  
  useEffect(() => {
    setIsLoading(true);
    fetch(url)
      .then((res) => res.text())
      .then((text) => {
        setContent(text);
        setIsLoading(false);
      })
      .catch(() => {
        setContent("Failed to load content.");
        setIsLoading(false);
      });
  }, [url]);
  
  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white">
        <div className="flex items-center gap-3 text-gray-600">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading content...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full h-full bg-white overflow-hidden">
      <pre className="w-full h-full overflow-auto p-6 text-sm font-mono leading-relaxed text-gray-800 whitespace-pre-wrap">
        {content}
      </pre>
    </div>
  );
};

export default DocumentPreviewModal;