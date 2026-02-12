// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title BillboardTest
 * @notice TEST VERSION with 5-minute rounds for quick testing
 */
contract BillboardTest is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Ad {
        address advertiser;
        string imageUrl;
        string linkUrl;
        string title;
        uint256 bidAmount;
        uint256 roundId;
    }

    struct Bid {
        address bidder;
        string imageUrl;
        string linkUrl;
        string title;
        uint256 amount;
        bool refunded;
        bool isWinner;
    }

    IERC20 public immutable usdc;

    uint256 public constant SLOT_MAIN = 0;
    uint256 public constant SLOT_SECONDARY = 1;
    uint256 public constant NUM_SLOTS = 2;

    uint256 public constant MIN_BID_MAIN = 10 * 10**6;      // $10 USDC
    uint256 public constant MIN_BID_SECONDARY = 1 * 10**6;  // $1 USDC

    // TEST: 5-minute rounds, 2-minute bidding window
    uint256 public constant ROUND_DURATION = 5 minutes;
    uint256 public constant BIDDING_WINDOW = 2 minutes;

    mapping(uint256 => Ad) public currentAds;
    mapping(uint256 => mapping(uint256 => Bid[])) public roundBids;
    mapping(uint256 => uint256) public highestBid;
    mapping(uint256 => address) public highestBidder;
    mapping(uint256 => uint256) public highestBidRound;
    mapping(uint256 => uint256) public lastFinalizedRound;
    mapping(address => uint256) public pendingRefunds;

    uint256 public availableRevenue;
    uint256 public totalRevenue;
    uint256 public totalBurned;
    uint256 public totalRounds;

    Ad[] public adHistory;

    event BidPlaced(uint256 indexed slot, uint256 indexed roundId, address indexed bidder, uint256 amount);
    event RoundFinalized(uint256 indexed slot, uint256 indexed roundId, address indexed winner, uint256 winningBid);
    event RefundAvailable(address indexed bidder, uint256 amount);
    event RefundClaimed(address indexed bidder, uint256 amount);
    event RevenueWithdrawn(address indexed to, uint256 amount);

    constructor(address _usdc) Ownable(msg.sender) {
        usdc = IERC20(_usdc);
    }

    function getCurrentRoundId() public view returns (uint256) {
        return block.timestamp / ROUND_DURATION;
    }

    function getNextRoundId() public view returns (uint256) {
        return getCurrentRoundId() + 1;
    }

    function isBiddingOpen() public view returns (bool) {
        uint256 timeInRound = block.timestamp % ROUND_DURATION;
        return timeInRound >= (ROUND_DURATION - BIDDING_WINDOW);
    }

    function timeUntilBiddingOpens() public view returns (uint256) {
        if (isBiddingOpen()) return 0;
        uint256 timeInRound = block.timestamp % ROUND_DURATION;
        return (ROUND_DURATION - BIDDING_WINDOW) - timeInRound;
    }

    function timeUntilRoundEnds() public view returns (uint256) {
        uint256 timeInRound = block.timestamp % ROUND_DURATION;
        return ROUND_DURATION - timeInRound;
    }

    function getMinBidForSlot(uint256 slot) public pure returns (uint256) {
        if (slot == SLOT_MAIN) return MIN_BID_MAIN;
        if (slot == SLOT_SECONDARY) return MIN_BID_SECONDARY;
        revert("Invalid slot");
    }

    function getEffectiveHighestBid(uint256 slot) public view returns (uint256) {
        uint256 nextRound = getNextRoundId();
        if (highestBidRound[slot] == nextRound) {
            return highestBid[slot];
        }
        return 0;
    }

    function placeBidFor(
        uint256 slot,
        address advertiser,
        string calldata imageUrl,
        string calldata linkUrl,
        string calldata title,
        uint256 bidAmount
    ) external onlyOwner nonReentrant {
        require(slot < NUM_SLOTS, "Invalid slot");
        require(isBiddingOpen(), "Bidding is closed");
        require(bytes(imageUrl).length > 0, "Image URL required");
        require(bytes(title).length > 0, "Title required");
        require(bytes(title).length <= 100, "Title too long");

        uint256 minBid = getMinBidForSlot(slot);
        require(bidAmount >= minBid, "Bid below minimum");

        uint256 effectiveHighest = getEffectiveHighestBid(slot);
        require(bidAmount > effectiveHighest, "Bid must be higher than current highest");

        uint256 nextRound = getNextRoundId();

        usdc.safeTransferFrom(msg.sender, address(this), bidAmount);

        roundBids[slot][nextRound].push(Bid({
            bidder: advertiser,
            imageUrl: imageUrl,
            linkUrl: linkUrl,
            title: title,
            amount: bidAmount,
            refunded: false,
            isWinner: false
        }));

        highestBid[slot] = bidAmount;
        highestBidder[slot] = advertiser;
        highestBidRound[slot] = nextRound;

        emit BidPlaced(slot, nextRound, advertiser, bidAmount);
    }

    function finalizeRound(uint256 slot) external nonReentrant {
        require(slot < NUM_SLOTS, "Invalid slot");

        uint256 currentRound = getCurrentRoundId();
        require(currentRound > lastFinalizedRound[slot], "Round already finalized");

        uint256 roundToFinalize = currentRound;
        Bid[] storage bids = roundBids[slot][roundToFinalize];

        if (bids.length == 0) {
            delete currentAds[slot];
            lastFinalizedRound[slot] = roundToFinalize;
            emit RoundFinalized(slot, roundToFinalize, address(0), 0);
            return;
        }

        uint256 winningIndex = 0;
        uint256 winningAmount = 0;

        for (uint256 i = 0; i < bids.length; i++) {
            if (bids[i].amount > winningAmount) {
                winningAmount = bids[i].amount;
                winningIndex = i;
            }
        }

        bids[winningIndex].isWinner = true;

        currentAds[slot] = Ad({
            advertiser: bids[winningIndex].bidder,
            imageUrl: bids[winningIndex].imageUrl,
            linkUrl: bids[winningIndex].linkUrl,
            title: bids[winningIndex].title,
            bidAmount: bids[winningIndex].amount,
            roundId: roundToFinalize
        });

        adHistory.push(currentAds[slot]);

        for (uint256 i = 0; i < bids.length; i++) {
            if (i != winningIndex && !bids[i].refunded) {
                bids[i].refunded = true;
                pendingRefunds[bids[i].bidder] += bids[i].amount;
                emit RefundAvailable(bids[i].bidder, bids[i].amount);
            }
        }

        availableRevenue += winningAmount;
        totalRevenue += winningAmount;
        totalRounds++;
        lastFinalizedRound[slot] = roundToFinalize;

        emit RoundFinalized(slot, roundToFinalize, bids[winningIndex].bidder, winningAmount);
    }

    function claimRefund() external nonReentrant {
        uint256 amount = pendingRefunds[msg.sender];
        require(amount > 0, "No refund available");
        pendingRefunds[msg.sender] = 0;
        usdc.safeTransfer(msg.sender, amount);
        emit RefundClaimed(msg.sender, amount);
    }

    function getPendingRefund(address user) external view returns (uint256) {
        return pendingRefunds[user];
    }

    function getSlotAd(uint256 slot) external view returns (
        address advertiser, string memory imageUrl, string memory linkUrl,
        string memory title, uint256 bidAmount, uint256 timeRemaining, bool isActive
    ) {
        require(slot < NUM_SLOTS, "Invalid slot");
        Ad storage ad = currentAds[slot];
        uint256 currentRound = getCurrentRoundId();
        bool active = ad.advertiser != address(0) && ad.roundId == currentRound;
        uint256 remaining = active ? timeUntilRoundEnds() : 0;
        return (ad.advertiser, ad.imageUrl, ad.linkUrl, ad.title, ad.bidAmount, remaining, active);
    }

    function getAllSlots() external view returns (
        Ad memory mainAd, bool mainActive, uint256 mainTimeRemaining,
        Ad memory secondaryAd, bool secondaryActive, uint256 secondaryTimeRemaining
    ) {
        uint256 currentRound = getCurrentRoundId();
        uint256 remaining = timeUntilRoundEnds();
        Ad storage main = currentAds[SLOT_MAIN];
        Ad storage secondary = currentAds[SLOT_SECONDARY];
        bool mActive = main.advertiser != address(0) && main.roundId == currentRound;
        bool sActive = secondary.advertiser != address(0) && secondary.roundId == currentRound;
        return (main, mActive, mActive ? remaining : 0, secondary, sActive, sActive ? remaining : 0);
    }

    function getBiddingStatus() external view returns (
        bool biddingOpen, uint256 currentRoundId, uint256 nextRoundId,
        uint256 timeUntilBidding, uint256 timeUntilNextRound,
        uint256 mainHighestBid, address mainHighestBidder,
        uint256 secondaryHighestBid, address secondaryHighestBidder
    ) {
        return (
            isBiddingOpen(), getCurrentRoundId(), getNextRoundId(),
            timeUntilBiddingOpens(), timeUntilRoundEnds(),
            getEffectiveHighestBid(SLOT_MAIN),
            highestBidRound[SLOT_MAIN] == getNextRoundId() ? highestBidder[SLOT_MAIN] : address(0),
            getEffectiveHighestBid(SLOT_SECONDARY),
            highestBidRound[SLOT_SECONDARY] == getNextRoundId() ? highestBidder[SLOT_SECONDARY] : address(0)
        );
    }

    function getMinimumBid(uint256 slot) external view returns (uint256) {
        require(slot < NUM_SLOTS, "Invalid slot");
        uint256 current = getEffectiveHighestBid(slot);
        uint256 minForSlot = getMinBidForSlot(slot);
        if (current == 0) return minForSlot;
        return current + 1;
    }

    function withdrawRevenue(address to) external onlyOwner {
        require(availableRevenue > 0, "No revenue to withdraw");
        uint256 amount = availableRevenue;
        availableRevenue = 0;
        usdc.safeTransfer(to, amount);
        emit RevenueWithdrawn(to, amount);
    }

    function getStats() external view returns (uint256 _totalRevenue, uint256 _totalBurned, uint256 _totalRounds) {
        return (totalRevenue, totalBurned, totalRounds);
    }
}
