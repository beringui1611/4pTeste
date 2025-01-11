import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import dotenv from 'dotenv';
dotenv.config();
const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    mainnet: {
       url: `${process.env.URL}`,
       chainId: parseInt(`${process.env.CHAIN_ID}`),
       accounts : {
        mnemonic: `${process.env.SECRET}`,

       }
    },
  }
}

export default config;
