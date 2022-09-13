import fs from 'fs';
import { PDFDocument } from 'pdf-lib';

async function readDocumentMetadata() {
  const certificateFile = await fs.readFileSync(
    './pdfs/certificate-example.pdf',
  );

  const certificate = await PDFDocument.load(certificateFile, {
    updateMetadata: false,
  });

  console.log('Title:', certificate.getTitle());
  console.log('Author:', certificate.getAuthor());
  console.log('Subject:', certificate.getSubject());
  console.log('Creator:', certificate.getCreator());
  console.log('Keywords:', certificate.getKeywords());
  console.log('Producer:', certificate.getProducer());
  console.log('Creation Date:', certificate.getCreationDate());
  console.log('Modification Date:', certificate.getModificationDate());
}

readDocumentMetadata()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
