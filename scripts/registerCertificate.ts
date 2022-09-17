import { ethers, getNamedAccounts } from 'hardhat';
import { CertificateManagement } from '../typechain-types';
import { getCertificateMetadata } from './getCertificateMetadata';

export async function registerCertificate() {
  const { certifier } = await getNamedAccounts();

  const certifierConnection: CertificateManagement = await ethers.getContract(
    'CertificateManagement',
    certifier,
  );

  const certificateMetadata = await getCertificateMetadata();

  const stringMetadata = JSON.stringify(certificateMetadata);

  const hashMetadata = ethers.utils.id(stringMetadata);

  const issueDateInMilisseconds = certificateMetadata.creationDate?.getTime();

  console.log({ certificateMetadata });
  console.log({ hashMetadata });

  if (!issueDateInMilisseconds) {
    console.log('The issue date is undefined');
    return;
  }

  await certifierConnection.registerCertificate(
    hashMetadata,
    issueDateInMilisseconds,
    0,
  );
}

registerCertificate()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
