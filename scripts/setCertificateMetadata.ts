import fs from 'fs';
import { getNamedAccounts } from 'hardhat';
import { PDFDocument } from 'pdf-lib';

const beforePath = './pdfs/before-certificate.pdf';
const afterPath = './pdfs/after-certificate.pdf';

export async function setCertificateMetadata() {
  const { certifier, university } = await getNamedAccounts();

  const certificateFile = fs.readFileSync(beforePath);

  const certificate = await PDFDocument.load(certificateFile);

  certificate.setTitle('Master of Arts');
  certificate.setSubject('Master of Arts');
  certificate.setAuthor(certifier);
  certificate.setCreator(university);
  certificate.setProducer(university);
  certificate.setKeywords(['Jhon Doe', 'University of Swat']);
  certificate.setCreationDate(new Date('06/10/2013'));

  const newCertificateBytes = await certificate.save();

  fs.writeFileSync(afterPath, newCertificateBytes);
}

setCertificateMetadata()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
