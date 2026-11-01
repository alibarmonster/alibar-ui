import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { FileDropzone } from "@/components/ui/file-dropzone/file-dropzone";

export function Attachments() {
  return (
    <FileDropzone
      accept="image/*,.pdf"
      maxSize={5 * 1024 * 1024}
      onUpload={(file, report) => uploadWithProgress(file, report)}
      onFilesChange={(files) => setAttachments(files)}
    />
  );
}`,
  a11y: [
    "The drop area is a real button: Enter or Space opens the file picker, so dragging is never required.",
    "Allowed types and sizes are in a hint linked with aria-describedby.",
    "While uploading, each file has a progressbar with its percentage; Retry and Remove buttons are labelled with the file name.",
    "A status region announces added, rejected, uploaded, failed and removed files.",
    "Status text accompanies every ring color, so success and failure are never conveyed by color alone.",
    "With reduced motion enabled, rows fade instead of sliding, and the drag-over lift and ring sweep are instant.",
  ],
  notes: [
    "onUpload receives the file and a report(0–100) callback. Resolve on success; throw to show a failure with Retry.",
    "Files that break accept, maxSize or maxFiles are listed with the reason instead of being dropped silently.",
    "Image previews use object URLs, which are revoked on removal and unmount.",
  ],
};
