import {
  frontEndContractsFile,
  frontEndAbiLocation,
} from '../helper-hardhat.config';
import 'dotenv/config';
import fs from 'fs';
import { ethers, network } from 'hardhat';
import { DeployFunction } from 'hardhat-deploy/dist/types';

const updateFrontend: DeployFunction = async () => {
  console.log('Writing to front end...');
  await updateContractAddresses();
  await updateAbi();
  console.log('Front end written!');
};

async function updateAbi() {
  const certificateManagement = await ethers.getContract(
    'CertificateManagement',
  );

  const formattedInterface = certificateManagement.interface
    .format(ethers.utils.FormatTypes.json)
    .toString();

  fs.writeFileSync(frontEndAbiLocation, formattedInterface);
}

async function updateContractAddresses() {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const chainId = network.config.chainId!.toString();

  const certificateManagement = await ethers.getContract(
    'CertificateManagement',
  );

  const contractAddresses = JSON.parse(
    fs.readFileSync(frontEndContractsFile, 'utf8'),
  );

  if (chainId in contractAddresses) {
    if (
      !contractAddresses[chainId]['CertificateManagement'].includes(
        certificateManagement.address,
      )
    ) {
      contractAddresses[chainId]['CertificateManagement'].push(
        certificateManagement.address,
      );
    }
  } else {
    contractAddresses[chainId] = {
      CertificateManagement: [certificateManagement.address],
    };
  }

  fs.writeFileSync(frontEndContractsFile, JSON.stringify(contractAddresses));
}

updateFrontend.tags = ['all', 'frontend'];

export default updateFrontend;
