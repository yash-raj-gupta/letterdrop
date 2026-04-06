"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle, X } from "lucide-react";
import { toast } from "sonner";

interface ImportResult {
  imported: number;
  duplicates: number;
  errors: number;
  total: number;
  message: string;
}

interface CsvImportDialogProps {
  onSuccess: () => void;
}

export function CsvImportDialog({ onSuccess }: CsvImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv") && !selectedFile.name.endsWith(".txt")) {
      toast.error("Please select a .csv or .txt file");
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error("File must be under 5MB");
      return;
    }

    setFile(selectedFile);
    setResult(null);
  }

  async function handleImport() {
    if (!file) return;

    setIsUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/subscribers/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Import failed");
        return;
      }

      setResult(data.data);

      if (data.data.imported > 0) {
        toast.success(data.data.message);
        onSuccess();
      }
    } catch {
      toast.error("Failed to import subscribers");
    } finally {
      setIsUploading(false);
    }
  }

  function handleClose() {
    setOpen(false);
    setFile(null);
    setResult(null);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true); }}>
      <DialogTrigger render={<Button variant="outline" size="sm" className="gap-2" />}>
        <Upload className="h-4 w-4" />
        Import CSV
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Subscribers</DialogTitle>
          <DialogDescription>
            Upload a CSV file with subscriber emails. Supported formats:
            email,name or just email per line.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File Drop Zone */}
          {!file ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
            >
              <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                CSV or TXT file, max 5MB, up to 10,000 subscribers
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
              <FileText className="h-8 w-8 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => { setFile(null); setResult(null); }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* CSV Format Help */}
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-xs font-medium mb-2">Expected CSV format:</p>
            <pre className="text-xs text-muted-foreground font-mono">
{`email,name
john@example.com,John Doe
jane@example.com,Jane Smith
bob@example.com`}
            </pre>
          </div>

          {/* Import Result */}
          {result && (
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center gap-2">
                {result.imported > 0 ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                )}
                <p className="text-sm font-medium">{result.message}</p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center pt-2">
                <div className="rounded-lg bg-green-50 p-2">
                  <p className="text-lg font-bold text-green-700">{result.imported}</p>
                  <p className="text-xs text-green-600">Imported</p>
                </div>
                <div className="rounded-lg bg-yellow-50 p-2">
                  <p className="text-lg font-bold text-yellow-700">{result.duplicates}</p>
                  <p className="text-xs text-yellow-600">Duplicates</p>
                </div>
                <div className="rounded-lg bg-red-50 p-2">
                  <p className="text-lg font-bold text-red-700">{result.errors}</p>
                  <p className="text-xs text-red-600">Errors</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {result ? "Close" : "Cancel"}
          </Button>
          {!result && (
            <Button onClick={handleImport} disabled={!file || isUploading}>
              {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Import
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
