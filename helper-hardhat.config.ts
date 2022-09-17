export interface networkConfigItem {
  name?: string;
  subscriptionId?: string;
  keepersUpdateInterval?: string;
  raffleEntranceFee?: string;
  callbackGasLimit?: string;
  vrfCoordinatorV2?: string;
  gasLane?: string;
  ethUsdPriceFeed?: string;
  mintFee?: string;
  blockConfirmations?: number;
}

export const networkConfig: Record<number, networkConfigItem> = {
  31337: {
    name: 'localhost',
  },
  1: {
    name: 'mainnet',
  },
  5: {
    name: 'goerli',
    blockConfirmations: 4,
  },
};

export const developmentChains = new Set(['hardhat', 'localhost']);
