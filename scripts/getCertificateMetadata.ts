import fs from 'fs';
import { PDFDocument } from 'pdf-lib';

export async function getCertificateMetadata() {
  const certificateFile = await fs.readFileSync(
    './documents/after-certificate.pdf',
  );

  const certificate = await PDFDocument.load(certificateFile, {
    updateMetadata: false,
  });

  const certificateMetadata = {
    title: certificate.getTitle(),
    author: certificate.getAuthor(),
    subject: certificate.getSubject(),
    creator: certificate.getCreator(),
    producer: certificate.getProducer(),
    creationDate: certificate.getCreationDate(),
  };

  return certificateMetadata;
}
