# sampleReporterFailContract

## Overview <a name="overview"> </a>  

A sample contract to add features to your reporter, namely the ability to fail if the time based reward is not enough.  

## Directions for actual usage

* Deploy Contract to Desired Network (e.g. Mainnet)

* Send stake amount to contract (e.g. 100 TRB)

* run depositStake()

* Instead of submitValue() to the oracle address, call this reporter contract and it will check the desired require statment before submitting.

## Directions for SampleFlexReporterContract usage to interact with TellorFlex oracle

* Deploy Contract to Desired Network (e.g. Polygon)

* Send stake amount to contract (e.g. 10 TRB). (In TellorFlex you can stake as much as you like, 10 is minimum)

* run approve(_amount) to allow TellorFlex to recieve the TRB

* run depositStake(_amount). 

* Instead of submitValue() to the oracle address, call this reporter contract and it will check the desired require statment before submitting.

(example contract deployed on polygon-mumbai: 0x1abe7948047155088514F6989D1F18BC882D6909(verified), 0x79Fcc57D99faC03dcAbd735DBC606Fe1c7fA3DE5(not verified))

## Directions for usage with Telliot
After Downloading telliot, you can run the following command to report through your custom contract instead of directly to the oracle:

* telliot-feeds -a my-account report --custom-contract <contractAddress> -p YOLO (if contract isn't verified, use the optional -abi flag and paste abi directly to the cli -abi <'[{abi}]'>)


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

