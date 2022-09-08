import { ethers, getNamedAccounts } from 'hardhat';
import { CertificateManagement } from '../typechain-types';

export async function addUniversity() {
  const certificateManagement: CertificateManagement = await ethers.getContract(
    'CertificateManagement',
  );

  const { university } = await getNamedAccounts();

  await certificateManagement.addUniversity(university, 'random');
}

addUniversity()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
