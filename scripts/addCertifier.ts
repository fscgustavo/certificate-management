import { ethers, getNamedAccounts } from 'hardhat';
import { CertificateManagement } from '../typechain-types';

export async function addCertifier() {
  const { university, certifier } = await getNamedAccounts();

  const certificateManagement: CertificateManagement = await ethers.getContract(
    'CertificateManagement',
    university,
  );

  await certificateManagement.addCertifier(certifier);
}

addCertifier()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
