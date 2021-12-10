const { AbiCoder } = require("@ethersproject/abi");
const { expect } = require("chai");
const h = require("./helpers/helpers");
var assert = require('assert');
const web3 = require('web3');
const fetch = require('node-fetch')

describe("Reporter Tests", function() {

    const master = "0x88dF592F8eb5D7Bd38bFeF7dEb0fBc02cf3778a0"
    let accounts = null
    let tellor = null
    let cfac,ofac,tfac,gfac,devWallet
    let govSigner = null
    let run = 0;
    let mainnetBlock = 0;

  beforeEach("deploy and setup TellorX", async function() {
    this.timeout(20000000)
    if(run == 0){
      const directors = await fetch('https://api.blockcypher.com/v1/eth/main').then(response => response.json());
      mainnetBlock = directors.height - 20;
      console.log("     Forking from block: ",mainnetBlock)
      run = 1;
    }
    accounts = await ethers.getSigners();
    await hre.network.provider.request({
      method: "hardhat_reset",
      params: [{forking: {
            jsonRpcUrl: hre.config.networks.hardhat.forking.url,
            blockNumber: mainnetBlock
          },},],
      });
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [DEV_WALLET]}
    )
    master = await ethers.getContractAt("contracts/tellor3/ITellor.sol:ITellor", masterAddress)
    rfac = await ethers.getContractFactory("contracts/Reporter.sol:Reporter");
    reporter = await rfac.deploy(masterAddress,ethers.utils.parseEther("1.0"));
    await reporter.deployed();
    await accounts[0].sendTransaction({to:DEV_WALLET,value:ethers.utils.parseEther("1.0")});
    devWallet = await ethers.provider.getSigner(DEV_WALLET);
    master = await oldTellorInstance.connect(devWallet)
    await master.transfer(reporter.address,ethers.utils.parseEther("100.0"));
    });
    it("constructor()", async function() {
    });
    it("changeOwner()", async function() {
    });
    it("depositStake()", async function() {
    });
    it("requestStakingWithdraw()", async function() {
    });
    it("submitValue()", async function() {
    });
    it("submitValueBypass()", async function() {
    });
    it("transfer()", async function() {
    });
    it("withdrawStake()", async function() {
    });
});
