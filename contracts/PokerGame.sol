pragma solidity >=0.4.17;

contract PokerGame {
    address public owner;
    uint256 private originalBalance;
    bool private exists;
    uint256[] private cards;
    uint256 private randomNumber = 0;

    event NewGame(
        address player,
        address dealer,
        uint256 playerCard,
        uint256 dealerCard,
        uint256[] cards,
        string big_or_small,
        string result
    );

    constructor() public {
        owner = address(0);
        exists = false;
        originalBalance = 0;
        randomNumber = _setRandomNumber();
    }

    function newOwner(uint256 money) external payable {
        require(!exists, "Game already exists");
        require(money > 0, "Money must be greater than 0");
        owner = msg.sender;
        originalBalance = money;
        exists = true;
    }

    function retireOwner(address payable ownerAccount) external payable {
        require(exists, "Game doesn't exist");
        require(msg.sender == owner, "Only owner can retire");
        ownerAccount.transfer(address(this).balance);
        owner = address(0);
        originalBalance = 0;
        exists = false;
    }

    function getGameStatus() external view returns (bool) {
        return exists;
    }

    function getOwner() external view returns (address) {
        require(exists, "Game doesn't exist");
        return owner;
    }

    function getEarning() external view returns (int256) {
        require(exists, "Game doesn't exist");
        require(msg.sender == owner, "Only owner can get earning");
        int256 currentBalance = int256(address(this).balance / 1 ether);
        int256 initialBalance = int256(originalBalance);
        return currentBalance - initialBalance;
    }

    function getOwnerBalance() external view returns (uint256) {
        require(exists, "Game doesn't exist");
        return address(this).balance / 1 ether;
    }

    function checkBroken() internal {
        if (address(this).balance == 0) {
            owner = address(0);
            originalBalance = 0;
            exists = false;
        }
    }

    function play(
        uint256 betAmount,
        bool big_or_small,
        address payable playerAccount
    )
        external
        payable
        returns (uint256 playerCard, uint256 dealerCard, string memory result)
    {
        require(exists, "Game doesn't exist");
        require(msg.sender != owner, "Owner cannot play the game");
        require(betAmount > 0, "Bet amount must be greater than 0");
        require(
            address(this).balance >= betAmount * 2 ether,
            "Owner doesn't have enough balance to play the game"
        );

        _shuffle();

        playerCard = cards[0];
        dealerCard = cards[1];
        if (big_or_small) {
            if (playerCard > dealerCard) {
                result = "Player wins!";
                playerAccount.transfer(betAmount * 2 ether);
            } else {
                result = "Dealer wins!";
            }
        } else {
            if (playerCard < dealerCard) {
                result = "Player wins!";
                playerAccount.transfer(betAmount * 2 ether);
            } else {
                result = "Dealer wins!";
            }
        }

        checkBroken();

        emit NewGame(
            msg.sender,
            owner,
            playerCard,
            dealerCard,
            cards,
            big_or_small ? "big" : "small",
            result
        );
    }

    function _setRandomNumber() internal view returns (uint256) {
        return
            uint256(
                keccak256(
                    abi.encodePacked(
                        blockhash(block.number - 1),
                        block.timestamp,
                        randomNumber
                    )
                )
            );
    }

    function _shuffle() internal {
        cards = new uint256[](52);
        for (uint256 i = 1; i <= 52; i++) {
            cards[i - 1] = i;
        }
        for (uint256 i = 0; i < 52; i++) {
            randomNumber = _setRandomNumber();
            uint256 j = i + (randomNumber % (52 - i));
            (cards[i], cards[j]) = (cards[j], cards[i]);
        }
    }
}
