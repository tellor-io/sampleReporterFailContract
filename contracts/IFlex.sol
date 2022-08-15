// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

/**
 * @title IFlex
 */
interface IFlex {
    function balanceOf(address account) external view returns (uint256);
    function approve(address _spender, uint256 _amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function depositStake(uint256 _amount) external;
    function requestStakingWithdraw(uint256 _amount) external;
    function getCurrentTip(bytes32 _queryId) external view returns (uint256);
    function submitValue(bytes32 _queryId, bytes calldata _value, uint256 _nonce, bytes memory _queryData) external;
    function withdrawStake() external;
    
}