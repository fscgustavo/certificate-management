import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-etherscan';
import '@nomiclabs/hardhat-waffle';
import '@typechain/hardhat';
import 'dotenv/config';
import 'hardhat-deploy';
import 'hardhat-gas-reporter';
import { HardhatUserConfig } from 'hardhat/config';
import 'solidity-coverage';

const {
  COINMARKETCAP_API_KEY,
  GOERLI_RPC_URL,
  PRIVATE_KEY = '',
  ETHERSCAN_API_KEY,
} = process.env;

const config: HardhatUserConfig = {
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      chainId: 31337,
    },
    goerli: {
      url: GOERLI_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 5,
    },
  },
  solidity: {
    compilers: [
      {
        version: '0.8.7',
      },
    ],
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  gasReporter: {
    enabled: true,
    currency: 'USD',
    outputFile: 'gas-report.txt',
    noColors: true,
    coinmarketcap: COINMARKETCAP_API_KEY,
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    organization: {
      default: 1,
    },
    university: {
      default: 2,
    },
    otherUniversity: {
      default: 3,
    },
    certifier: {
      default: 4,
    },
    otherCertifier: {
      default: 5,
    },
  },
  mocha: {
    timeout: 200_000,
  },
};

export default config;
