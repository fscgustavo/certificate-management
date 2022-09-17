import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { developmentChains, networkConfig } from '../helper-hardhat.config';
import { verify } from '../utils/verify';

async function deployCertificateManagement(hre: HardhatRuntimeEnvironment) {
  const {
    getNamedAccounts,
    deployments: { deploy, log },
    network,
  } = hre;

  const { deployer } = await getNamedAccounts();

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const chainId = network.config.chainId!;

  const args: never[] = [];

  const certificateManagement = await deploy('CertificateManagement', {
    from: deployer,
    args,
    log: true,
    waitConfirmations: networkConfig[chainId].blockConfirmations || 1,
  });

  log(`certificateManagement deployed at ${certificateManagement.address}`);
  log('----------------------------------------------------');
  // TODO: verify the contract

  if (!developmentChains.has(network.name) && process.env.ETHERSCAN_API_KEY) {
    await verify(certificateManagement.address, args);
  }
}

export default deployCertificateManagement;

deployCertificateManagement.tags = ['all'];
