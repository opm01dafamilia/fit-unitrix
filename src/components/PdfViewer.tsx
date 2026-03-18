import { useState } from "react";
import { X, Maximize2, Minimize2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PdfViewerProps {
  url: string;
  fileName: string;
  onClose: () => void;
}

const PdfViewer = ({ url, fileName, onClose }: PdfViewerProps) => {
  const [fullscreen, setFullscreen] = useState(false);

  return (
    <div className={`fixed inset-0 z-[110] flex flex-col animate-in fade-in duration-200 ${fullscreen ? "" : ""}`}>
      {/* Overlay */}
      <div className="absolute inset-0 bg-background/95 backdrop-blur-sm" onClick={onClose} />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-background/80 backdrop-blur-lg">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-display font-semibold truncate">{fileName}</h3>
            <p className="text-[10px] text-muted-foreground">Visualização de PDF</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => window.open(url, "_blank")}
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setFullscreen(!fullscreen)}
            >
              {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* PDF iframe */}
        <div className="flex-1 overflow-hidden">
          <iframe
            src={`${url}#toolbar=1&navpanes=0`}
            className="w-full h-full border-0"
            title={fileName}
          />
        </div>
      </div>
    </div>
  );
};

export default PdfViewer;
