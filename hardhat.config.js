/**
 * @type import('hardhat/config').HardhatUserConfig
 */
require("@nomiclabs/hardhat-ethers");

module.exports = {
  solidity: "0.8.3",
  networks: {
    hardhat: {
      forking: {
        url: "https://eth-mainnet.alchemyapi.io/v2/Cn6yrook-nX3A6tKMXPr4b3PolqgDsYO"
        // url: "https://polygon-mumbai.infura.io/v3/<apikey>"
      }
    },
  }
};
