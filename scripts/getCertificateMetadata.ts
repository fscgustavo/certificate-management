import fs from 'fs';
import { PDFDocument } from 'pdf-lib';

export async function getCertificateMetadata() {
  const certificateFile = await fs.readFileSync('./pdfs/after-certificate.pdf');

  const certificate = await PDFDocument.load(certificateFile, {
    updateMetadata: false,
  });

  return {
    title: certificate.getTitle(),
    author: certificate.getAuthor(),
    subject: certificate.getSubject(),
    creator: certificate.getCreator(),
    keywords: certificate.getKeywords(),
    producer: certificate.getProducer(),
    creationDate: certificate.getCreationDate(),
  };
}
