// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MafiaToken
 * @notice The $MAFIA token - used for buyback & burn from billboard revenue
 */
contract MafiaToken is ERC20, ERC20Burnable, Ownable {
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18; // 1 billion tokens
    uint256 public totalBurned;

    event TokensBurned(address indexed burner, uint256 amount, uint256 totalBurned);

    constructor() ERC20("Mafia Token", "MAFIA") Ownable(msg.sender) {
        // Mint initial supply to deployer
        _mint(msg.sender, MAX_SUPPLY);
    }

    /**
     * @notice Override burn to track total burned
     */
    function burn(uint256 amount) public override {
        super.burn(amount);
        totalBurned += amount;
        emit TokensBurned(msg.sender, amount, totalBurned);
    }

    /**
     * @notice Override burnFrom to track total burned
     */
    function burnFrom(address account, uint256 amount) public override {
        super.burnFrom(account, amount);
        totalBurned += amount;
        emit TokensBurned(account, amount, totalBurned);
    }

    /**
     * @notice Get circulating supply (total - burned)
     */
    function circulatingSupply() external view returns (uint256) {
        return MAX_SUPPLY - totalBurned;
    }
}
