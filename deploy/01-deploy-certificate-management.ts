import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { networkConfig } from '../helper-hardhat.config';

async function deployCertificateManagement(hre: HardhatRuntimeEnvironment) {
  const {
    getNamedAccounts,
    deployments: { deploy, log },
    network,
  } = hre;

  const { deployer } = await getNamedAccounts();

  const chainId = network.config.chainId!;

  const certificateManagement = await deploy('CertificateManagement', {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: networkConfig[chainId].blockConfirmations || 1,
  });

  log(`certificateManagement deploy at ${certificateManagement.address}`);

  // TODO: verify the contract
}

export default deployCertificateManagement;

deployCertificateManagement.tags = ['all'];
