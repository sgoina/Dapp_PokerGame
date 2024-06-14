// 這裡的名稱要對應到智能合約
var PokerGame = artifacts.require("PokerGame");

module.exports = function (deployer) {
    deployer.deploy(PokerGame);
}