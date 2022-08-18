const h = require("./helpers/helpers");
var assert = require("assert");
const { ethers } = require("hardhat");

describe("Reporter Tests", function () {
  const flexAddress = "0x840c23e39F9D029fFa888F47069aA6864f0401D7";
  const autopayAddress = "0x7B49420008BcA14782F2700547764AdAdD54F813";
  const tokenAddress = "0xCE4e32fE9D894f8185271Aa990D2dB425DF3E6bE";
  const DEV_WALLET = "0xd5f1cc896542c111c7aa7d7fae2c3d654f34b927";
  let accounts = null;
  let devWallet, reporter;

  beforeEach("deploy and setup TellorFlex", async function () {
    this.timeout(20000000);
    accounts = await ethers.getSigners();
    await hre.network.provider.request({
      method: "hardhat_reset",
      params: [
        {
          forking: {
            jsonRpcUrl: hre.config.networks.hardhat.forking.url,
          },
        },
      ],
    });
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [DEV_WALLET],
    });
    tellorFlex = await ethers.getContractAt(
      "contracts/ITellor.sol:ITellor",
      flexAddress
    );
    autopay = await ethers.getContractAt(
        "contracts/IFlex.sol:IFlex",
        autopayAddress
      );
    token = await ethers.getContractAt(
        "contracts/IFlex.sol:IFlex",
        tokenAddress
    );
    rfac = await ethers.getContractFactory("contracts/SampleFlexReporter.sol:FlexReporter");
    reporter = await rfac.deploy(flexAddress, autopayAddress, tokenAddress, ethers.utils.parseEther("1.0"));
    await reporter.deployed();
    await accounts[0].sendTransaction({
      to: DEV_WALLET,
      value: ethers.utils.parseEther("1.0"),
    });
    devWallet = await ethers.provider.getSigner(DEV_WALLET);
    await token.connect(devWallet).transfer(reporter.address, ethers.utils.parseEther("100.0"));
    await reporter.approve(ethers.utils.parseEther("100.0"));
  });
  it("constructor()", async function () {
    assert(
      (await reporter.oracle()) == flexAddress,
      "TellorFlex address should be properly set"
    );
    assert(
      (await reporter.autopay()) == autopayAddress,
      "Autopay Address should be correct"
    );
    assert(
        (await reporter.token()) == tokenAddress,
        "Token Address should be correct"
    );
    assert(
        (await reporter.owner()) == accounts[0].address,
        "owner should be correct"
    );
    assert(
        (await reporter.profitThreshold()) - ethers.utils.parseEther("1.0") == 0,
        "profit threshold should be correct"
    );
  });
  it("changeOwner()", async function () {
    await reporter.changeOwner(accounts[1].address);
    assert(
        (await reporter.owner()) == accounts[1].address,
        "new owner should be correct"
    );
  });
  it("changeOwner() fail if msg.sender is not owner", async function () {
    await h.expectThrow(
      reporter.connect(accounts[5]).changeOwner(accounts[1].address)
    );
    assert(
      (await reporter.owner()) == accounts[0].address,
      "new owner was not changed"
    );
  });
  it("depositStake()", async function () {
    await reporter.depositStake(ethers.utils.parseEther("10.0"));
    let vars = await tellorFlex.getStakerInfo(reporter.address);
    assert(vars[1] == 10000000000000000000, "staked balance should be correct");
  });
  it("depositStake() fail if msg.sender is not owner", async function () {
    await h.expectThrow(reporter.connect(accounts[5]).depositStake(ethers.utils.parseEther("10.0")));
    let vars = await tellorFlex.getStakerInfo(reporter.address);
    assert(vars[1] == 0, "staked balance should be zero");
  });
  it("requestStakingWithdraw()", async function () {
    await reporter.depositStake(ethers.utils.parseEther("10.0"));
    let vars = await tellorFlex.getStakerInfo(reporter.address);
    assert(vars[1] == 10000000000000000000, "staked balance should be correct");
    await reporter.requestStakingWithdraw(ethers.utils.parseEther("10.0"));
    vars = await tellorFlex.getStakerInfo(reporter.address);
    assert(vars[1] == 0, "staked balance should be zero");
  });
  it("requestStakingWithdraw() fail if msg.sender is not owner", async function () {
    await reporter.depositStake(ethers.utils.parseEther("10.0"));
    let vars = await tellorFlex.getStakerInfo(reporter.address);
    assert((await vars[1]) > 0, "reporter contract is staked");
    await h.expectThrow(reporter.connect(accounts[5]).requestStakingWithdraw(ethers.utils.parseEther("10.0")));
    let vars1 = await tellorFlex.getStakerInfo(reporter.address);
    assert((await vars1[1]) > 0, "reporter contract is staked");
  });

  it("submitValue()", async function () {
    await reporter.depositStake(ethers.utils.parseEther("100.0"));
    nonce = await tellorFlex.getNewValueCountbyQueryId(h.uintTob32(44));
    await token.connect(devWallet).approve(autopayAddress, ethers.utils.parseEther("100.0"));
    await autopay.connect(devWallet).tip(h.uintTob32(44), ethers.utils.parseEther("10.0"), "0x");
    tip = await autopay.getCurrentTip(h.uintTob32(44));
    assert(
        tip - ethers.utils.parseEther("10.0") == 0, "tip should be correct amount"
    );
    nonce = await tellorFlex.getNewValueCountbyQueryId(h.uintTob32(44));
    await reporter.submitValue(h.uintTob32(44), h.uintTob32(150), nonce, "0x");
    let lastnewValue = await tellorFlex.getTimeOfLastNewValue();
    assert(
      (await tellorFlex.getReportsSubmittedByAddress(reporter.address)) - 1 == 0,
      "reports by address should be correct"
    );
    assert(
        (await tellorFlex.getReporterLastTimestamp(reporter.address)) - lastnewValue == 0,
        "reporter last timestamp should be time of last new value"
    )
    await h.expectThrow(reporter.submitValue(h.uintTob32(44), h.uintTob32(150), nonce, "0x"));  // profitthreshold not met
    await autopay.connect(devWallet).tip(h.uintTob32(44), ethers.utils.parseEther("10.0"), "0x");
    await h.expectThrow(reporter.connect(accounts[1]).submitValue(h.uintTob32(44), h.uintTob32(150), nonce, "0x")); // msg.sender not owner
  });

it("submitValueBypass(), no profitThreshold requirement", async function () {
    await reporter.depositStake(ethers.utils.parseEther("100.0"));
    nonce = await tellorFlex.getNewValueCountbyQueryId(h.uintTob32(44));
    await reporter.submitValueBypass(h.uintTob32(44), h.uintTob32(150), nonce, "0x");
    let lastnewValue = await tellorFlex.getTimeOfLastNewValue();
    assert(
      (await tellorFlex.getReportsSubmittedByAddress(reporter.address)) - 1 == 0,
      "reports by address should be correct"
    );
    assert(
        (await tellorFlex.getReporterLastTimestamp(reporter.address)) - lastnewValue == 0,
        "reporter last timestamp should be time of last new value"
    )
    await h.expectThrow(reporter.connect(accounts[1]).submitValueBypass(h.uintTob32(44), h.uintTob32(150), nonce, "0x")); // msg.sender not owner
  });
  it("transfer()", async function () {
    assert(
        (await token.balanceOf(reporter.address)) == 100000000000000000000,
        "contract balance should be 100"
    );
    await reporter.transfer(accounts[0].address, ethers.utils.parseEther("10.0"));
    assert(
      (await token.balanceOf(accounts[0].address)) - ethers.utils.parseEther("10.0") == 0,
      "transfer should be successful"
    );
    await h.expectThrow(reporter.connect(accounts[1]).transfer(accounts[0].address, ethers.utils.parseEther("10.0"))); // msg.sender not owner
  });
  it("withdrawStake()", async function () {
    await reporter.depositStake(ethers.utils.parseEther("100.0"));
    await reporter.requestStakingWithdraw(ethers.utils.parseEther("100.0"));
    await h.advanceTime(86400 * 7);
    await h.expectThrow(reporter.connect(accounts[1]).withdrawStake()); //msg.sender not owner
    await reporter.connect(accounts[0]).withdrawStake();
    let vars = await tellorFlex.getStakerInfo(reporter.address);
    assert(vars[1] == 0, "full amount withdrawn, staked amount should be zero");
  });
});
