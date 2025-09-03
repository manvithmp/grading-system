import { useDropzone } from 'react-dropzone';
import { useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../../services/api.js';

export default function UploadPage() {
  const [uploading, setUploading] = useState(false);

  // ---------- handle the file ----------
  const onDrop = async (acceptedFiles) => {
  const file = acceptedFiles?.[0]; // correct optional-chaining for arrays
  if (!file) {
    toast.error('Please select a file');
    return;
  }

    const form = new FormData();
    form.append('file', file);               // MUST be "file" for upload.single('file')

    try {
      setUploading(true);
      const { data } = await api.post('/upload', form); // baseURL already "/api"
      toast.success(`Inserted ${data.inserted}/${data.total}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // ---------- drop-zone ----------
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: false,
    maxFiles: 1,
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    }
  });

  return (
    <section className="card">
      <div {...getRootProps({ className: 'dropzone' })}>
        <input {...getInputProps()} />
        <div className="dz-title">
          {isDragActive ? 'Drop to upload' : 'Upload Excel/CSV'}
        </div>
        <div className="dz-sub">
          Drag & drop your file here, or click to select
        </div>
      </div>

      {uploading && (
        <p style={{ marginTop: '1rem', color: 'var(--muted)' }}>Uploading…</p>
      )}
    </section>
  );
}
