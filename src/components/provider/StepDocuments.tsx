import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileText, AlertCircle, X } from "lucide-react";

interface Props { onNext: () => void; }

interface DocFile {
  name: string;
  preview?: string;
}

const REQUIRED_DOCS = [
  { key: "dlFront", label: "Driver's License (Front)", accept: ".jpg,.jpeg,.png,.pdf" },
  { key: "dlBack", label: "Driver's License (Back)", accept: ".jpg,.jpeg,.png,.pdf" },
  { key: "liability", label: "General Liability Insurance", accept: ".jpg,.jpeg,.png,.pdf" },
  { key: "workers", label: "Workers' Compensation Insurance", accept: ".jpg,.jpeg,.png,.pdf" },
  { key: "exemption", label: "Exemption Certificate (if applicable)", accept: ".jpg,.jpeg,.png,.pdf", optional: true },
];

const StepDocuments = ({ onNext }: Props) => {
  const [docs, setDocs] = useState<Record<string, DocFile | null>>({});

  const handleFile = (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocs((d) => ({
        ...d,
        [key]: { name: file.name, preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined },
      }));
    }
  };

  const removeFile = (key: string) => {
    setDocs((d) => ({ ...d, [key]: null }));
  };

  const requiredUploaded = REQUIRED_DOCS.filter((d) => !d.optional).every((d) => docs[d.key]);

  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h3 className="font-display text-xl font-bold text-foreground">Document Uploads</h3>
        <p className="text-sm text-muted-foreground">Upload required documents (JPG or PDF)</p>
      </div>

      <div className="rounded-xl border border-accent/30 bg-accent/5 p-3 flex items-start gap-2">
        <AlertCircle className="h-4 w-4 text-accent mt-0.5 shrink-0" />
        <p className="text-xs text-accent">
          General Liability Insurance must have a minimum coverage of <strong>$1,000,000</strong>.
        </p>
      </div>

      {REQUIRED_DOCS.map(({ key, label, accept, optional }) => (
        <div key={key} className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">{label}</span>
            </div>
            {optional && <span className="text-[10px] text-muted-foreground">Optional</span>}
          </div>

          {docs[key] ? (
            <div className="flex items-center gap-3 rounded-xl bg-secondary p-3">
              {docs[key]!.preview ? (
                <img src={docs[key]!.preview} alt="" className="h-12 w-12 rounded-lg object-cover" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-card">
                  <FileText className="h-5 w-5 text-accent" />
                </div>
              )}
              <span className="flex-1 truncate text-sm text-foreground">{docs[key]!.name}</span>
              <button onClick={() => removeFile(key)} className="rounded-lg p-1 hover:bg-card">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-border p-4 transition-colors hover:border-accent hover:bg-accent/5">
              <Upload className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Tap to upload</span>
              <input type="file" accept={accept} onChange={(e) => handleFile(key, e)} className="hidden" />
            </label>
          )}
        </div>
      ))}

      <Button
        onClick={onNext}
        disabled={!requiredUploaded}
        className="mt-6 h-14 w-full rounded-xl bg-gradient-orange font-display text-lg font-semibold text-accent-foreground shadow-orange disabled:opacity-50"
      >
        Continue
      </Button>
    </div>
  );
};

export default StepDocuments;
