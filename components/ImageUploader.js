'use client';
import { useState } from 'react';
import { FiUpload, FiLink } from 'react-icons/fi';

import styles from './ImageUploader.module.css'; // Asegúrate de tener un archivo CSS con estos estilos

const ImageUploader = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
      setError('El archivo es demasiado grande (máximo 5MB)');
      return;
    }
    setFile(selectedFile);
    setError('');
  };

  const uploadToS3 = async () => {
    if (!file) {
      setError('Por favor selecciona un archivo');
      return;
    }

    setUploading(true);
    setError('');

    try {
      // Configuración de AWS (usa variables de entorno)
      const AWS_CONFIG = {
        region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
        bucketName: process.env.NEXT_PUBLIC_S3_BUCKET_NAME || 'palomasbucket',
        accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || 'ASIAU6GDX3LW2LZOKC2R',
        secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY || 'nvI08F3q5CyaewEP1oaKdAcJ/C1KhlvkXD8nEbrR'
      };

      // Generar un nombre único para el archivo
      const fileName = `recibos/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;

      // Crear URL firmada para subida directa
      const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
      const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');

      const s3Client = new S3Client({
        region: AWS_CONFIG.region,
        credentials: {
          accessKeyId: AWS_CONFIG.accessKeyId,
          secretAccessKey: AWS_CONFIG.secretAccessKey
        }
      });

      const putObjectCommand = new PutObjectCommand({
        Bucket: AWS_CONFIG.bucketName,
        Key: fileName,
        ContentType: file.type,
        ACL: 'public-read' // Para que el archivo sea accesible públicamente
      });

      // Subir el archivo directamente desde el frontend
      const signedUrl = await getSignedUrl(s3Client, putObjectCommand, { expiresIn: 3600 });

      await fetch(signedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      });

      // Generar URL pública (depende de tu configuración de bucket)
      const publicUrl = `https://${AWS_CONFIG.bucketName}.s3.${AWS_CONFIG.region}.amazonaws.com/${fileName}`;
      setImageUrl(publicUrl);

    } catch (err) {
      console.error('Error al subir el archivo:', err);
      setError('Error al subir el archivo. Por favor intenta nuevamente.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles.uploadContainer}>
      <h3>Subir Comprobante</h3>
      
      {error && <div className={styles.error}>{error}</div>}
      
      <div className={styles.uploadBox}>
        <input
          type="file"
          id="file-upload"
          accept="image/*,.pdf"
          onChange={handleFileChange}
          className={styles.fileInput}
        />
        <label htmlFor="file-upload" className={styles.uploadButton}>
          <FiUpload /> Seleccionar Archivo
        </label>
        {file && <span className={styles.fileName}>{file.name}</span>}
      </div>

      <button
        onClick={uploadToS3}
        disabled={!file || uploading}
        className={styles.uploadSubmit}
      >
        {uploading ? 'Subiendo...' : 'Subir a S3'}
      </button>

      {imageUrl && (
        <div className={styles.urlContainer}>
          <FiLink /> Enlace del comprobante:
          <a 
            href={imageUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className={styles.urlLink}
          >
            {imageUrl}
          </a>
          <button 
            onClick={() => navigator.clipboard.writeText(imageUrl)}
            className={styles.copyButton}
          >
            Copiar
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;