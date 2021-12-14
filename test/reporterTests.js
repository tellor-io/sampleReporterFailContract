const { AbiCoder } = require("@ethersproject/abi");
const { expect } = require("chai");
const h = require("./helpers/helpers");
var assert = require('assert');
const web3 = require('web3');
const fetch = require('node-fetch');
const { report } = require("process");

describe("Reporter Tests", function() {

    const masterAddress = "0x88dF592F8eb5D7Bd38bFeF7dEb0fBc02cf3778a0"
    const DEV_WALLET = "0x39E419bA25196794B595B2a595Ea8E527ddC9856"
    let accounts = null
    let tellor = null
    let oracle,devWallet
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
    master = await ethers.getContractAt("contracts/ITellor.sol:ITellor", masterAddress)
    rfac = await ethers.getContractFactory("contracts/Reporter.sol:Reporter");
    reporter = await rfac.deploy(masterAddress,ethers.utils.parseEther("1.0"));
    await reporter.deployed();
    await accounts[0].sendTransaction({to:DEV_WALLET,value:ethers.utils.parseEther("1.0")});
    devWallet = await ethers.provider.getSigner(DEV_WALLET);
    master = await master.connect(devWallet)
    await master.transfer(reporter.address,ethers.utils.parseEther("100.0"));
    oracleAddy = await master.getAddressVars("0xfa522e460446113e8fd353d7fa015625a68bc0369712213a42e006346440891e")
    oracle = await ethers.getContractAt("contracts/ITellor.sol:ITellor", oracleAddy)
  });
    it("constructor()", async function() {
      assert(await reporter.tellor() == masterAddress, "Tellor address should be properly set")
      let oracleAddy = await master.getAddressVars("0xfa522e460446113e8fd353d7fa015625a68bc0369712213a42e006346440891e")
      assert(await reporter.oracle() == oracleAddy, "Oracle Address should be correct")
      assert(await reporter.owner() == accounts[0].address, "owner should be correct")
      assert(await reporter.profitThreshold() - ethers.utils.parseEther("1.0") == 0, "profit threshold should be correct")
    });
    it("changeOwner()", async function() {
      await reporter.changeOwner(accounts[1].address);
      assert(await reporter.owner() == accounts[1].address, "new owner should be correct")
    });
    it("depositStake()", async function() {
      await reporter.depositStake();
      let vars = await master.getStakerInfo(reporter.address);
      assert(vars[0] == 1, "staking status should be correct")
      assert(vars[1] > 0 , "staking timestamp should be correct")
    });
    it("requestStakingWithdraw()", async function() {
      await reporter.depositStake();
      await reporter.requestStakingWithdraw();
      let vars = await master.getStakerInfo(reporter.address);
      assert(vars[0] == 2, "staking status should be correct")
      assert(vars[1] > 0 , "staking timestamp should be correct")
    });
    it("submitValue()", async function() {
      await reporter.depositStake();
      //stake second reporter
      let reporter2 = await rfac.deploy(masterAddress,ethers.utils.parseEther("1.0"));
      await reporter2.deployed();
      await master.transfer(reporter2.address,ethers.utils.parseEther("100.0"));
      await h.advanceTime(86400*7)
      let nonce = await oracle.getTimestampCountById(h.uintTob32(44));
      await reporter.submitValue(h.uintTob32(44),150,nonce,'0x');//clear inflationary rewards
      await reporter2.depositStake()
      //second reporter fails on submit
      nonce = await oracle.getTimestampCountById(h.uintTob32(44));
      await h.expectThrow(reporter2.submitValue(h.uintTob32(44),150,nonce,'0x'))
      let lastnewValue = await oracle.getTimeOfLastNewValue()
      assert(await oracle.getValueByTimestamp(h.uintTob32(44),lastnewValue) - 150 == 0, "value should be correct")
      assert(await oracle.getTimestampCountById(h.uintTob32(44)) - nonce == 0, "timestamp count should be correct")
      assert(await oracle.getReportsSubmittedByAddress(reporter.address) - 1 == 0, "reports by address should be correct")
    });
    it("submitValueBypass()", async function() {
      await reporter.depositStake();
        //stake second reporter
        let reporter2 = await rfac.deploy(masterAddress,ethers.utils.parseEther("1.0"));
        await reporter2.deployed();
        await master.transfer(reporter2.address,ethers.utils.parseEther("100.0"));

        await h.advanceTime(86400*7)
        let nonce = await oracle.getTimestampCountById(h.uintTob32(44));
        await reporter.submitValue(h.uintTob32(44),150,nonce,'0x');//clear inflationary rewards
        await reporter2.depositStake()
        //second reporter fails on submit
        nonce = await oracle.getTimestampCountById(h.uintTob32(44));
        await reporter2.submitValueBypass(h.uintTob32(44),150,nonce,'0x');
        let blocky = await ethers.provider.getBlock();
        assert(await oracle.getValueByTimestamp(h.uintTob32(44),blocky.timestamp) - 150 == 0, "value should be correct")
        assert(await oracle.getTimestampCountById(h.uintTob32(44)) - nonce == 1, "timestamp count should be correct")
        assert(await oracle.getReportsSubmittedByAddress(reporter2.address) - 1 == 0, "reports by address should be correct")
    });
    it("transfer()", async function() {
      await reporter.transfer(accounts[0].address, 200);
      assert(await master.balanceOf(accounts[0].address) == 200, "transfer should be successful")
    });
    it("withdrawStake()", async function() {
        await reporter.depositStake();
        await reporter.requestStakingWithdraw();
        await h.advanceTime(86400*7)
        await reporter.withdrawStake();
        let vars = await master.getStakerInfo(reporter.address);
        assert(vars[0] == 0, "staking status should be correct")
        assert(vars[1] > 0 , "staking timestamp should be correct")
    });
});
