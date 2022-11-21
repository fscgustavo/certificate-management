import { ethers, getNamedAccounts } from 'hardhat';
import { CertificateManagement } from '../typechain-types';
import { getCertificateMetadata } from './getCertificateMetadata';

export async function getCertificate() {
  const { certifier } = await getNamedAccounts();

  const certifierConnection: CertificateManagement = await ethers.getContract(
    'CertificateManagement',
    certifier,
  );

  const certificateMetadata = await getCertificateMetadata();

  const stringMetadata = JSON.stringify(certificateMetadata);

  const hashMetadata = ethers.utils.id(stringMetadata);

  console.log({ certificateMetadata });

  console.log({ hashMetadata });

  const result = await certifierConnection.getCertificate(hashMetadata);

  console.log({ result });
}

getCertificate()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
