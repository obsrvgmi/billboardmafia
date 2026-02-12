// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Billboard
 * @notice Decentralized billboard advertising with 2 slots
 * @dev Agent-operated billboards with x402 USDC payments
 *
 * Slots:
 * - Slot 0: MAIN (premium, higher minimum bid)
 * - Slot 1: SECONDARY (smaller, lower minimum bid)
 *
 * Rules:
 * - New bid must be 10%+ higher than current
 * - Billboard expires after 30 days
 * - No refunds when outbid (you got exposure)
 * - Revenue used for $MAFIA buyback & burn
 */
contract Billboard is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Ad {
        address advertiser;      // Who placed the ad
        string imageUrl;         // Billboard image URL
        string linkUrl;          // Click-through URL
        string title;            // Ad title/company name
        uint256 bidAmount;       // Amount paid in USDC (6 decimals)
        uint256 startTime;       // When ad started
        uint256 expiryTime;      // When ad expires
    }

    IERC20 public immutable usdc;

    // Two billboard slots
    uint256 public constant SLOT_MAIN = 0;
    uint256 public constant SLOT_SECONDARY = 1;
    uint256 public constant NUM_SLOTS = 2;

    // Slot configurations
    uint256 public constant MIN_BID_MAIN = 10 * 10**6;      // $10 USDC for main
    uint256 public constant MIN_BID_SECONDARY = 1 * 10**6;  // $1 USDC for secondary

    uint256 public constant MIN_BID_INCREMENT = 10; // 10% minimum increment
    uint256 public constant AD_DURATION = 30 days;

    // Current ads per slot
    mapping(uint256 => Ad) public slots;

    uint256 public totalRevenue;
    uint256 public totalBurned;
    uint256 public totalAds;

    // Historical ads per slot
    mapping(uint256 => Ad[]) public slotHistory;

    event NewAd(
        uint256 indexed slot,
        address indexed advertiser,
        string title,
        uint256 bidAmount,
        uint256 expiryTime
    );
    event AdOutbid(
        uint256 indexed slot,
        address indexed oldAdvertiser,
        address indexed newAdvertiser,
        uint256 oldBid,
        uint256 newBid
    );
    event RevenueWithdrawn(address indexed to, uint256 amount);
    event BurnRecorded(uint256 amount, uint256 totalBurned);

    constructor(address _usdc) Ownable(msg.sender) {
        usdc = IERC20(_usdc);
    }

    /**
     * @notice Get minimum bid for a slot
     */
    function getMinBidForSlot(uint256 slot) public pure returns (uint256) {
        if (slot == SLOT_MAIN) return MIN_BID_MAIN;
        if (slot == SLOT_SECONDARY) return MIN_BID_SECONDARY;
        revert("Invalid slot");
    }

    /**
     * @notice Place a bid for a specific slot
     */
    function placeBid(
        uint256 slot,
        string calldata imageUrl,
        string calldata linkUrl,
        string calldata title,
        uint256 bidAmount
    ) external nonReentrant {
        require(slot < NUM_SLOTS, "Invalid slot");
        require(bytes(imageUrl).length > 0, "Image URL required");
        require(bytes(title).length > 0, "Title required");
        require(bytes(title).length <= 100, "Title too long");

        uint256 minBid = getMinBidForSlot(slot);
        require(bidAmount >= minBid, "Bid below minimum for slot");

        Ad storage currentAd = slots[slot];
        bool isActive = currentAd.expiryTime > block.timestamp && currentAd.advertiser != address(0);

        if (isActive) {
            uint256 requiredBid = currentAd.bidAmount + (currentAd.bidAmount * MIN_BID_INCREMENT / 100);
            require(bidAmount >= requiredBid, "Bid must be 10% higher than current");

            slotHistory[slot].push(currentAd);
            emit AdOutbid(slot, currentAd.advertiser, msg.sender, currentAd.bidAmount, bidAmount);
        }

        // Transfer USDC from bidder
        usdc.safeTransferFrom(msg.sender, address(this), bidAmount);

        // Set new ad
        slots[slot] = Ad({
            advertiser: msg.sender,
            imageUrl: imageUrl,
            linkUrl: linkUrl,
            title: title,
            bidAmount: bidAmount,
            startTime: block.timestamp,
            expiryTime: block.timestamp + AD_DURATION
        });

        totalRevenue += bidAmount;
        totalAds++;

        emit NewAd(slot, msg.sender, title, bidAmount, block.timestamp + AD_DURATION);
    }

    /**
     * @notice Place bid on behalf of advertiser (for x402 flow)
     * @dev Only owner can call - used when payment received via x402
     */
    function placeBidFor(
        uint256 slot,
        address advertiser,
        string calldata imageUrl,
        string calldata linkUrl,
        string calldata title,
        uint256 bidAmount
    ) external onlyOwner nonReentrant {
        require(slot < NUM_SLOTS, "Invalid slot");
        require(bytes(imageUrl).length > 0, "Image URL required");
        require(bytes(title).length > 0, "Title required");
        require(bytes(title).length <= 100, "Title too long");

        uint256 minBid = getMinBidForSlot(slot);
        require(bidAmount >= minBid, "Bid below minimum for slot");

        Ad storage currentAd = slots[slot];
        bool isActive = currentAd.expiryTime > block.timestamp && currentAd.advertiser != address(0);

        if (isActive) {
            uint256 requiredBid = currentAd.bidAmount + (currentAd.bidAmount * MIN_BID_INCREMENT / 100);
            require(bidAmount >= requiredBid, "Bid must be 10% higher than current");

            slotHistory[slot].push(currentAd);
            emit AdOutbid(slot, currentAd.advertiser, advertiser, currentAd.bidAmount, bidAmount);
        }

        slots[slot] = Ad({
            advertiser: advertiser,
            imageUrl: imageUrl,
            linkUrl: linkUrl,
            title: title,
            bidAmount: bidAmount,
            startTime: block.timestamp,
            expiryTime: block.timestamp + AD_DURATION
        });

        totalRevenue += bidAmount;
        totalAds++;

        emit NewAd(slot, advertiser, title, bidAmount, block.timestamp + AD_DURATION);
    }

    /**
     * @notice Get ad for a specific slot
     */
    function getSlotAd(uint256 slot) external view returns (
        address advertiser,
        string memory imageUrl,
        string memory linkUrl,
        string memory title,
        uint256 bidAmount,
        uint256 timeRemaining,
        bool isActive
    ) {
        require(slot < NUM_SLOTS, "Invalid slot");
        Ad storage ad = slots[slot];
        bool active = ad.expiryTime > block.timestamp && ad.advertiser != address(0);
        uint256 remaining = active ? ad.expiryTime - block.timestamp : 0;

        return (ad.advertiser, ad.imageUrl, ad.linkUrl, ad.title, ad.bidAmount, remaining, active);
    }

    /**
     * @notice Get both slots at once
     */
    function getAllSlots() external view returns (
        Ad memory mainAd,
        bool mainActive,
        uint256 mainTimeRemaining,
        Ad memory secondaryAd,
        bool secondaryActive,
        uint256 secondaryTimeRemaining
    ) {
        Ad storage main = slots[SLOT_MAIN];
        Ad storage secondary = slots[SLOT_SECONDARY];

        bool mActive = main.expiryTime > block.timestamp && main.advertiser != address(0);
        bool sActive = secondary.expiryTime > block.timestamp && secondary.advertiser != address(0);

        return (
            main,
            mActive,
            mActive ? main.expiryTime - block.timestamp : 0,
            secondary,
            sActive,
            sActive ? secondary.expiryTime - block.timestamp : 0
        );
    }

    /**
     * @notice Get minimum bid to take over a slot
     */
    function getMinimumBid(uint256 slot) external view returns (uint256) {
        require(slot < NUM_SLOTS, "Invalid slot");

        Ad storage ad = slots[slot];
        bool isActive = ad.expiryTime > block.timestamp && ad.advertiser != address(0);

        if (!isActive) {
            return getMinBidForSlot(slot);
        }

        return ad.bidAmount + (ad.bidAmount * MIN_BID_INCREMENT / 100);
    }

    /**
     * @notice Get slot history count
     */
    function getSlotHistoryCount(uint256 slot) external view returns (uint256) {
        return slotHistory[slot].length;
    }

    /**
     * @notice Withdraw USDC revenue (for buyback & burn)
     */
    function withdrawRevenue(address to) external onlyOwner {
        uint256 balance = usdc.balanceOf(address(this));
        require(balance > 0, "No revenue to withdraw");

        usdc.safeTransfer(to, balance);
        emit RevenueWithdrawn(to, balance);
    }

    /**
     * @notice Record MAFIA tokens burned (called after buyback)
     */
    function recordBurn(uint256 amount) external onlyOwner {
        totalBurned += amount;
        emit BurnRecorded(amount, totalBurned);
    }

    /**
     * @notice Get billboard stats
     */
    function getStats() external view returns (
        uint256 _totalRevenue,
        uint256 _totalBurned,
        uint256 _totalAds
    ) {
        return (totalRevenue, totalBurned, totalAds);
    }
}
