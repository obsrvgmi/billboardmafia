// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Billboard
 * @notice Timed auction billboard with 12-hour rounds
 * @dev Agent-operated billboards with x402 USDC payments
 *
 * Schedule (UTC):
 * - Round 1: 00:00 - 12:00 (bidding 23:30 - 00:00)
 * - Round 2: 12:00 - 00:00 (bidding 11:30 - 12:00)
 *
 * Rules:
 * - Bidding opens 30 minutes before each round
 * - Highest bid when round starts wins
 * - Losing bids are refunded
 * - Winner's ad displays for 12 hours
 * - Revenue used for $BB buyback & burn
 */
contract Billboard is Ownable, ReentrancyGuard {
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
    }

    IERC20 public immutable usdc;

    // Two billboard slots
    uint256 public constant SLOT_MAIN = 0;
    uint256 public constant SLOT_SECONDARY = 1;
    uint256 public constant NUM_SLOTS = 2;

    // Minimum bids per slot
    uint256 public constant MIN_BID_MAIN = 10 * 10**6;      // $10 USDC
    uint256 public constant MIN_BID_SECONDARY = 1 * 10**6;  // $1 USDC

    // Timing constants
    uint256 public constant ROUND_DURATION = 12 hours;
    uint256 public constant BIDDING_WINDOW = 30 minutes;

    // Current winning ads per slot
    mapping(uint256 => Ad) public currentAds;

    // Bids for upcoming round: slot => roundId => bids[]
    mapping(uint256 => mapping(uint256 => Bid[])) public roundBids;

    // Highest bid per slot for upcoming round
    mapping(uint256 => uint256) public highestBid;
    mapping(uint256 => address) public highestBidder;

    // Track last finalized round per slot
    mapping(uint256 => uint256) public lastFinalizedRound;

    uint256 public totalRevenue;
    uint256 public totalBurned;
    uint256 public totalRounds;

    // Historical ads
    Ad[] public adHistory;

    event BidPlaced(
        uint256 indexed slot,
        uint256 indexed roundId,
        address indexed bidder,
        uint256 amount
    );
    event RoundFinalized(
        uint256 indexed slot,
        uint256 indexed roundId,
        address indexed winner,
        uint256 winningBid
    );
    event BidRefunded(
        uint256 indexed slot,
        uint256 indexed roundId,
        address indexed bidder,
        uint256 amount
    );
    event RevenueWithdrawn(address indexed to, uint256 amount);
    event BurnRecorded(uint256 amount, uint256 totalBurned);

    constructor(address _usdc) Ownable(msg.sender) {
        usdc = IERC20(_usdc);
    }

    /**
     * @notice Get current round ID based on timestamp
     * @dev Round 0 starts at Unix epoch, increments every 12 hours
     */
    function getCurrentRoundId() public view returns (uint256) {
        return block.timestamp / ROUND_DURATION;
    }

    /**
     * @notice Get the next round ID (the one being bid on)
     */
    function getNextRoundId() public view returns (uint256) {
        return getCurrentRoundId() + 1;
    }

    /**
     * @notice Check if bidding is currently open
     * @dev Bidding opens 30 minutes before each round
     */
    function isBiddingOpen() public view returns (bool) {
        uint256 timeInRound = block.timestamp % ROUND_DURATION;
        // Bidding is open in last 30 minutes of current round
        return timeInRound >= (ROUND_DURATION - BIDDING_WINDOW);
    }

    /**
     * @notice Get time until bidding opens
     */
    function timeUntilBiddingOpens() public view returns (uint256) {
        if (isBiddingOpen()) return 0;
        uint256 timeInRound = block.timestamp % ROUND_DURATION;
        return (ROUND_DURATION - BIDDING_WINDOW) - timeInRound;
    }

    /**
     * @notice Get time until current round ends
     */
    function timeUntilRoundEnds() public view returns (uint256) {
        uint256 timeInRound = block.timestamp % ROUND_DURATION;
        return ROUND_DURATION - timeInRound;
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
     * @notice Place a bid for the next round
     */
    function placeBid(
        uint256 slot,
        string calldata imageUrl,
        string calldata linkUrl,
        string calldata title,
        uint256 bidAmount
    ) external nonReentrant {
        require(slot < NUM_SLOTS, "Invalid slot");
        require(isBiddingOpen(), "Bidding is closed");
        require(bytes(imageUrl).length > 0, "Image URL required");
        require(bytes(title).length > 0, "Title required");
        require(bytes(title).length <= 100, "Title too long");

        uint256 minBid = getMinBidForSlot(slot);
        require(bidAmount >= minBid, "Bid below minimum");
        require(bidAmount > highestBid[slot], "Bid must be higher than current highest");

        uint256 nextRound = getNextRoundId();

        // Transfer USDC from bidder
        usdc.safeTransferFrom(msg.sender, address(this), bidAmount);

        // Record bid
        roundBids[slot][nextRound].push(Bid({
            bidder: msg.sender,
            imageUrl: imageUrl,
            linkUrl: linkUrl,
            title: title,
            amount: bidAmount,
            refunded: false
        }));

        // Update highest bid
        highestBid[slot] = bidAmount;
        highestBidder[slot] = msg.sender;

        emit BidPlaced(slot, nextRound, msg.sender, bidAmount);
    }

    /**
     * @notice Place bid on behalf of advertiser (for x402 flow)
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
        require(isBiddingOpen(), "Bidding is closed");
        require(bytes(imageUrl).length > 0, "Image URL required");
        require(bytes(title).length > 0, "Title required");
        require(bytes(title).length <= 100, "Title too long");

        uint256 minBid = getMinBidForSlot(slot);
        require(bidAmount >= minBid, "Bid below minimum");
        require(bidAmount > highestBid[slot], "Bid must be higher than current highest");

        uint256 nextRound = getNextRoundId();

        // Record bid (payment already received via x402)
        roundBids[slot][nextRound].push(Bid({
            bidder: advertiser,
            imageUrl: imageUrl,
            linkUrl: linkUrl,
            title: title,
            amount: bidAmount,
            refunded: false
        }));

        // Update highest bid
        highestBid[slot] = bidAmount;
        highestBidder[slot] = advertiser;

        emit BidPlaced(slot, nextRound, advertiser, bidAmount);
    }

    /**
     * @notice Finalize a round - set winner and refund losers
     * @dev Can be called by anyone after round starts
     */
    function finalizeRound(uint256 slot) external nonReentrant {
        require(slot < NUM_SLOTS, "Invalid slot");

        uint256 currentRound = getCurrentRoundId();
        require(currentRound > lastFinalizedRound[slot], "Round already finalized");

        uint256 roundToFinalize = currentRound;
        Bid[] storage bids = roundBids[slot][roundToFinalize];

        if (bids.length == 0) {
            // No bids - clear current ad
            delete currentAds[slot];
            lastFinalizedRound[slot] = roundToFinalize;

            // Reset highest bid for next round
            highestBid[slot] = 0;
            highestBidder[slot] = address(0);
            return;
        }

        // Find winning bid (highest amount)
        uint256 winningIndex = 0;
        uint256 winningAmount = 0;

        for (uint256 i = 0; i < bids.length; i++) {
            if (bids[i].amount > winningAmount) {
                winningAmount = bids[i].amount;
                winningIndex = i;
            }
        }

        Bid storage winningBid = bids[winningIndex];

        // Set current ad
        currentAds[slot] = Ad({
            advertiser: winningBid.bidder,
            imageUrl: winningBid.imageUrl,
            linkUrl: winningBid.linkUrl,
            title: winningBid.title,
            bidAmount: winningBid.amount,
            roundId: roundToFinalize
        });

        // Add to history
        adHistory.push(currentAds[slot]);

        // Refund losing bids
        for (uint256 i = 0; i < bids.length; i++) {
            if (i != winningIndex && !bids[i].refunded) {
                bids[i].refunded = true;
                usdc.safeTransfer(bids[i].bidder, bids[i].amount);
                emit BidRefunded(slot, roundToFinalize, bids[i].bidder, bids[i].amount);
            }
        }

        totalRevenue += winningAmount;
        totalRounds++;
        lastFinalizedRound[slot] = roundToFinalize;

        // Reset highest bid for next round
        highestBid[slot] = 0;
        highestBidder[slot] = address(0);

        emit RoundFinalized(slot, roundToFinalize, winningBid.bidder, winningAmount);
    }

    /**
     * @notice Get current ad for a slot
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
        Ad storage ad = currentAds[slot];

        uint256 currentRound = getCurrentRoundId();
        bool active = ad.advertiser != address(0) && ad.roundId == currentRound;
        uint256 remaining = active ? timeUntilRoundEnds() : 0;

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
        uint256 currentRound = getCurrentRoundId();
        uint256 remaining = timeUntilRoundEnds();

        Ad storage main = currentAds[SLOT_MAIN];
        Ad storage secondary = currentAds[SLOT_SECONDARY];

        bool mActive = main.advertiser != address(0) && main.roundId == currentRound;
        bool sActive = secondary.advertiser != address(0) && secondary.roundId == currentRound;

        return (
            main,
            mActive,
            mActive ? remaining : 0,
            secondary,
            sActive,
            sActive ? remaining : 0
        );
    }

    /**
     * @notice Get bidding status and upcoming round info
     */
    function getBiddingStatus() external view returns (
        bool biddingOpen,
        uint256 currentRoundId,
        uint256 nextRoundId,
        uint256 timeUntilBidding,
        uint256 timeUntilNextRound,
        uint256 mainHighestBid,
        address mainHighestBidder,
        uint256 secondaryHighestBid,
        address secondaryHighestBidder
    ) {
        return (
            isBiddingOpen(),
            getCurrentRoundId(),
            getNextRoundId(),
            timeUntilBiddingOpens(),
            timeUntilRoundEnds(),
            highestBid[SLOT_MAIN],
            highestBidder[SLOT_MAIN],
            highestBid[SLOT_SECONDARY],
            highestBidder[SLOT_SECONDARY]
        );
    }

    /**
     * @notice Get minimum bid to win a slot (must beat current highest)
     */
    function getMinimumBid(uint256 slot) external view returns (uint256) {
        require(slot < NUM_SLOTS, "Invalid slot");

        uint256 current = highestBid[slot];
        uint256 minForSlot = getMinBidForSlot(slot);

        if (current == 0) {
            return minForSlot;
        }
        // Must bid at least 1 unit more than current highest
        return current + 1;
    }

    /**
     * @notice Get number of bids for a round
     */
    function getRoundBidCount(uint256 slot, uint256 roundId) external view returns (uint256) {
        return roundBids[slot][roundId].length;
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
     * @notice Record BB tokens burned (called after buyback)
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
        uint256 _totalRounds
    ) {
        return (totalRevenue, totalBurned, totalRounds);
    }

    /**
     * @notice Get ad history count
     */
    function getAdHistoryCount() external view returns (uint256) {
        return adHistory.length;
    }
}
