// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Billboard
 * @notice Decentralized billboard advertising - highest bidder gets the spot
 * @dev Agent-operated billboard with x402 USDC payments
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

    Ad public currentAd;

    uint256 public constant MIN_BID_INCREMENT = 10; // 10% minimum increment
    uint256 public constant AD_DURATION = 30 days;
    uint256 public constant MIN_BID = 1 * 10**6; // $1 USDC minimum

    uint256 public totalRevenue;
    uint256 public totalBurned; // Track MAFIA burned (updated by owner)
    uint256 public totalAds;

    // Historical ads
    Ad[] public adHistory;

    event NewAd(
        address indexed advertiser,
        string title,
        uint256 bidAmount,
        uint256 expiryTime
    );
    event AdOutbid(
        address indexed oldAdvertiser,
        address indexed newAdvertiser,
        uint256 oldBid,
        uint256 newBid
    );
    event AdExpired(address indexed advertiser, string title);
    event RevenueWithdrawn(address indexed to, uint256 amount);
    event BurnRecorded(uint256 amount, uint256 totalBurned);

    constructor(address _usdc) Ownable(msg.sender) {
        usdc = IERC20(_usdc);
    }

    /**
     * @notice Place a bid for the billboard
     * @param imageUrl URL of the billboard image
     * @param linkUrl Click-through URL
     * @param title Company/ad title
     * @param bidAmount Amount in USDC (6 decimals)
     */
    function placeBid(
        string calldata imageUrl,
        string calldata linkUrl,
        string calldata title,
        uint256 bidAmount
    ) external nonReentrant {
        require(bytes(imageUrl).length > 0, "Image URL required");
        require(bytes(title).length > 0, "Title required");
        require(bytes(title).length <= 100, "Title too long");
        require(bidAmount >= MIN_BID, "Bid below minimum");

        // Check if current ad is still active
        bool isActive = currentAd.expiryTime > block.timestamp && currentAd.advertiser != address(0);

        if (isActive) {
            // Must outbid by 10%+
            uint256 minBid = currentAd.bidAmount + (currentAd.bidAmount * MIN_BID_INCREMENT / 100);
            require(bidAmount >= minBid, "Bid must be 10% higher than current");

            // Archive the outbid ad
            adHistory.push(currentAd);

            emit AdOutbid(currentAd.advertiser, msg.sender, currentAd.bidAmount, bidAmount);
        }

        // Transfer USDC from bidder
        usdc.safeTransferFrom(msg.sender, address(this), bidAmount);

        // Set new ad
        currentAd = Ad({
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

        emit NewAd(msg.sender, title, bidAmount, currentAd.expiryTime);
    }

    /**
     * @notice Place bid on behalf of advertiser (for x402 flow)
     * @dev Only owner can call - used when payment received via x402
     */
    function placeBidFor(
        address advertiser,
        string calldata imageUrl,
        string calldata linkUrl,
        string calldata title,
        uint256 bidAmount
    ) external onlyOwner nonReentrant {
        require(bytes(imageUrl).length > 0, "Image URL required");
        require(bytes(title).length > 0, "Title required");
        require(bytes(title).length <= 100, "Title too long");
        require(bidAmount >= MIN_BID, "Bid below minimum");

        bool isActive = currentAd.expiryTime > block.timestamp && currentAd.advertiser != address(0);

        if (isActive) {
            uint256 minBid = currentAd.bidAmount + (currentAd.bidAmount * MIN_BID_INCREMENT / 100);
            require(bidAmount >= minBid, "Bid must be 10% higher than current");

            adHistory.push(currentAd);
            emit AdOutbid(currentAd.advertiser, advertiser, currentAd.bidAmount, bidAmount);
        }

        currentAd = Ad({
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

        emit NewAd(advertiser, title, bidAmount, currentAd.expiryTime);
    }

    /**
     * @notice Get current billboard status
     */
    function getCurrentAd() external view returns (
        address advertiser,
        string memory imageUrl,
        string memory linkUrl,
        string memory title,
        uint256 bidAmount,
        uint256 timeRemaining,
        bool isActive
    ) {
        bool active = currentAd.expiryTime > block.timestamp && currentAd.advertiser != address(0);
        uint256 remaining = active ? currentAd.expiryTime - block.timestamp : 0;

        return (
            currentAd.advertiser,
            currentAd.imageUrl,
            currentAd.linkUrl,
            currentAd.title,
            currentAd.bidAmount,
            remaining,
            active
        );
    }

    /**
     * @notice Get minimum bid to take over billboard
     */
    function getMinimumBid() external view returns (uint256) {
        bool isActive = currentAd.expiryTime > block.timestamp && currentAd.advertiser != address(0);

        if (!isActive) {
            return MIN_BID;
        }

        return currentAd.bidAmount + (currentAd.bidAmount * MIN_BID_INCREMENT / 100);
    }

    /**
     * @notice Get ad history count
     */
    function getAdHistoryCount() external view returns (uint256) {
        return adHistory.length;
    }

    /**
     * @notice Get historical ad by index
     */
    function getAdHistory(uint256 index) external view returns (Ad memory) {
        require(index < adHistory.length, "Index out of bounds");
        return adHistory[index];
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
        uint256 _totalAds,
        uint256 _currentBid,
        bool _isActive
    ) {
        bool active = currentAd.expiryTime > block.timestamp && currentAd.advertiser != address(0);
        return (totalRevenue, totalBurned, totalAds, currentAd.bidAmount, active);
    }
}
