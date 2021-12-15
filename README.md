# sampleReporterFailContract

## Overview <a name="overview"> </a>  

A sample contract to add features to your reporter, namely the ability to fail if the time based reward is not enough.  

## Directions for actual usage

#### Deploy Contract to Desired Network (e.g. Mainnet)

#### Send stake amount to contract (e.g. 100 TRB)

#### run depositStake()

#### Instead of submitValue() to the oracle address, call this reporter contract and it will check the desired require statment before submitting.

## Setting up and testing

Install Dependencies
```
npm i
```
Compile Smart Contracts
```
npx hardhat compile
```

Test Locally
```
npx hardhat test
```

## Maintainers <a name="maintainers"> </a>
This repository is maintained by the [Tellor team](https://github.com/orgs/tellor-io/people)


Check out our issues log here on Github or feel free to reach out anytime [info@tellor.io](mailto:info@tellor.io)

## Copyright

Tellor Inc. 2021

