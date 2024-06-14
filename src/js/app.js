var acc_id;
var betAmount;
var big_or_small = true;

App = {
  web3Provider: null,
  contracts: {},

  init: async function () {
    // 初始化 web3
    await this.initWeb3();
    // 初始化智能合约
    await this.initContract();
    // 设置定时器，每隔一段时间检查账户是否发生变化
    setInterval(function () {
      App.checkAccountChange();
    }, 3000);
  },

  initWeb3: async function () {
    if (window.ethereum) {
      this.web3Provider = window.ethereum;
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        acc_id = accounts[0];
        console.log("Current account: " + acc_id);
      } catch (error) {
        console.error("User denied account access");
      }
    } else {
      this.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }
    web3 = new Web3(this.web3Provider);
  },

  initContract: function () {
    $.getJSON('PokerGame.json', function (data) {
      var PokerGameArtifact = data;
      App.contracts.PokerGame = TruffleContract(PokerGameArtifact);
      App.contracts.PokerGame.setProvider(App.web3Provider);
    });
    return this.bindEvents();
  },

  bindEvents: function () {
    $(document).on('click', '.btn-start', this.startgame);
    $(document).on('click', '.btn-draw', this.handlePlay);
    $(document).on('click', '.btn-higher', this.btn_higher_F);
    $(document).on('click', '.btn-lower', this.btn_lower_F);
    $(document).on('click', '.btn-sg', this.handleCreateTheGame);
    $(document).on('click', '.btn-end', this.handleEndTheGame);
    $(document).on('click', '.btn-back', this.backPage);
  },

  startgame: async function (event) {
    // Get the value from the input field
    //acc_id = document.getElementById('userInput').value;

    var pokerGameInstance

    web3.eth.getAccounts(function (error) {
      if (error) {
        console.error(error);
      }
      App.contracts.PokerGame.deployed().then(async function (instance) {
        pokerGameInstance = instance;
        //檢查遊戲是否存在
        const gameStatus = await pokerGameInstance.getGameStatus();
        if (gameStatus == false) {
          App.navigateTo('owner_first');
          try {
            App.handleCheckProfit();
          } catch (err) {
            console.error(err);
          }
        }
        else {
          const beOwner = await pokerGameInstance.getOwner();
          if (beOwner == acc_id) {
            App.navigateTo("owner_again");
            try {
              App.handleCheckProfit();
            } catch (err) {
              console.error(err);
            }
          }
          else {
            App.navigateTo('player');
            // Call a function with the input value
            //handleUserInput(userInput);

            //show Player Card
            var PlayerCardcol = $('#PlayerCardcol');
            var PlayerCardTemplate = $('#PlayerCardTemplate');

            PlayerCardTemplate.find('img').attr('src', 'PNG-cards-1.3/0.jpg');
            PlayerCardcol.append(PlayerCardTemplate.html());

            //show Dealer Card
            var DealerCardcol = $('#DealerCardcol');
            var DealerCardTemplate = $('#DealerCardTemplate');

            DealerCardTemplate.find('img').attr('src', 'PNG-cards-1.3/0.jpg');
            DealerCardcol.append(DealerCardTemplate.html());
          }
        }
        //查帳
        try {
          App.handleCheckOwnerBalance();
        } catch (err) {
          console.error(err);
        }
      }).catch(function (err) {
        console.error("Error playing game: " + err.message);
      });


    });

  },

  navigateTo: function (page) {
    this.change_mode(page);
    const url = `/${page}`;
    const state = { page: page, data: this.getData() }; // 保存當前的資料
    history.pushState(state, '', url);
  },


  checkAccountChange: async function () {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        const currentAccount = accounts[0];
        if (currentAccount !== acc_id) {
          acc_id = currentAccount;
          console.log("Account changed to: " + acc_id);
          location.reload();
        }
      } catch (error) {
        console.error("Error checking account change: " + error.message);
      }
    }
  },

  getData: function () {
    return 0;
  },
  countProfit: function (difference) {
    const curProf = document.getElementById("prof");
    if (difference < 0) {
      curProf.style.color = "red";
      curProf.textContent = difference;
    }
    else if (difference > 0) {
      curProf.style.color = 'green';
      curProf.textContent = difference;
    }
    else {
      curProf.style.color = 'white';
      curProf.textContent = difference;
    }
  },
  backPage: function () {
    $('.btn-start').show();
    $('.btn-sg').hide();
    $('.btn-end').hide();
    $('#Enter_text').hide();
    $('#userInput').hide();
    $('#account_Balance').hide();
    $('#prof-text').hide();
    $('#prof').hide();
    $('.btn-higher').hide();
    $('.btn-draw').hide();
    $('#high_or_low_text').hide();
    $('#PlayerCardcol').empty();
    $('#DealerCardcol').empty();
    $('#Result').empty();
  },

  change_mode: function (mode) {
    if (mode == 'owner_first') {
      $('.btn-sg').show();
      $('#Enter_text').show();
      $('#userInput').show();
      $('#account_Balance').show();
      $('#prof-text').show();
      $('#prof').show();
      $('.btn-start').hide();
    }
    else if (mode == 'owner_again') {
      $('.btn-end').show();
      $('#account_Balance').show();
      $('#prof-text').show();
      $('#prof').show();
      $('.btn-start').hide();
    }
    else {
      $('.btn-higher').show();
      $('.btn-draw').show();
      $('#high_or_low_text').show();
      $('#account_Balance').show();
      $('#Enter_text').show();
      $('#userInput').show();
      $('.btn-start').hide();
    }
  },

  //莊家創建遊戲
  handleCreateTheGame: function (event) {
    event.preventDefault();
    var pokerGameInstance;

    supplyAmount = document.getElementById('userInput').value;
    if (supplyAmount == '') {
      return;
    }

    web3.eth.getAccounts(function (error) {
      if (error) {
        console.error(error);
      }
      App.contracts.PokerGame.deployed().then(async function (instance) {
        pokerGameInstance = instance;
        console.log("supplyAmount: " + supplyAmount);
        await pokerGameInstance.newOwner(supplyAmount, {
          from: acc_id,
          gas: 5000000,
          value: web3.toWei(supplyAmount, "ether")
        });
        $('.btn-sg').hide();
        $('#Enter_text').hide();
        $('#userInput').hide();
        $('.btn-end').show();
      }).catch(function (err) {
        console.error("Error playing game: " + err.message);
      });
    });
  },

  //莊家結束遊戲
  handleEndTheGame: function (event) {
    event.preventDefault();
    var pokerGameInstance;

    web3.eth.getAccounts(function (error) {
      if (error) {
        console.error(error);
      }
      App.contracts.PokerGame.deployed().then(async function (instance) {
        pokerGameInstance = instance;
        await pokerGameInstance.retireOwner(acc_id, {
          from: acc_id,
          gas: 5000000,
        });
        $('.btn-end').hide();
        $('.btn-sg').show();
        $('#Enter_text').show();
        $('#userInput').show();
      }).catch(function (err) {
        console.error("Error playing game: " + err.message);
      });
    });
  },

  handlePlay: async function (event) {
    event.preventDefault();
    var pokerGameInstance;

    // 调用合约的 play 函数
    betAmount = document.getElementById('userInput').value;
    if (betAmount == '') {
      return;
    }

    web3.eth.getAccounts(function (error) {
      if (error) {
        console.error(error);
      }
      App.contracts.PokerGame.deployed().then(async function (instance) {
        pokerGameInstance = instance;
        // 调用合约的 play 函数
        return pokerGameInstance.play(betAmount, big_or_small, acc_id, {
          from: acc_id,
          gas: 5000000,
          value: web3.toWei(betAmount, "ether")
        });
      }).then(function (result) {
        // 解构返回的结果
        var playerCard = result.logs[0].args.playerCard.toNumber();
        var dealerCard = result.logs[0].args.dealerCard.toNumber();
        var gameResult = result.logs[0].args.result;

        // 处理返回的结果
        console.log("Player Card: " + playerCard);
        console.log("Dealer Card: " + dealerCard);
        console.log("Game Result: " + gameResult);

        $('#PlayerCardcol').find('img').attr('src', 'PNG-cards-1.3/' + playerCard + '.png');
        $('#DealerCardcol').find('img').attr('src', 'PNG-cards-1.3/' + dealerCard + '.png');
        $('#Result').text(gameResult);

        //$('PlayerCardTemplate').eq(index).find('button').text('Success').attr('disabled', true);
      }).catch(function (err) {
        console.error("Error playing game: " + err.message);
      });
    });
  },


  handleCheckOwnerBalance: async function () {

    var pokerGameInstance
    var ownerBalance = 1;

    web3.eth.getAccounts(function (error) {
      if (error) {
        console.error(error);
      }
      App.contracts.PokerGame.deployed().then(async function (instance) {
        pokerGameInstance = instance;
        //檢查遊戲是否存在
        const gameStatus = await pokerGameInstance.getGameStatus();
        if (gameStatus == false) {
          // console.log("Game is not exist!");
          $('#account_Balance').text("Balance : " + 0);
        }
        else {
          //取得莊家餘額
          ownerBalance = await pokerGameInstance.getOwnerBalance();
          // console.log("Balance" + " is: " + ownerBalance + " ETH");
          $('#account_Balance').text("Balance : " + ownerBalance);
        }
      }).catch(function (err) {
        console.error("Error playing game: " + err.message);
      });
    });
    setTimeout(App.handleCheckOwnerBalance, 1000);
  },

  handleCheckProfit: async function () {

    var pokerGameInstance;

    web3.eth.getAccounts(function (error) {
      if (error) {
        console.error(error);
      }
      App.contracts.PokerGame.deployed().then(async function (instance) {
        pokerGameInstance = instance;
        //檢查遊戲是否存在
        const gameStatus = await pokerGameInstance.getGameStatus();
        if (gameStatus == false) {
          // console.log("YOu ar owner. Game is not exist!");
          // $('#Enter_text').show();
          // $('#userInput').show();
          // $('.btn-sg').show();
          // $('.btn-end').hide();
          try {
            App.countProfit(0);
          } catch (err) {
            console.error(err);
          }
        }
        else {
          //取得莊家虧盈
          const profit = await pokerGameInstance.getEarning({
            from: acc_id
          });
          // console.log("Profit" + " is: " + profit + " ETH");
          // $('#Enter_text').hide();
          // $('#userInput').hide();
          // $('.btn-sg').hide();
          // $('.btn-end').show();
          try {
            App.countProfit(profit);
          } catch (err) {
            console.error(err);
          }
        }
      }).catch(function (err) {
        console.error("Error playing game: " + err.message);
      });
    });
    setTimeout(App.handleCheckProfit, 3000);
  },


  btn_higher_F: function () {
    $('.btn-lower').show();
    $('.btn-higher').hide();
    $('#high_or_low_text').text('Now is player with lower card win!');
    big_or_small = false;
  },

  btn_lower_F: function () {
    $('.btn-higher').show();
    $('.btn-lower').hide();
    $('#high_or_low_text').text('Now is player with higher card win!');
    big_or_small = true;
  },


};


$(function () {
  $(window).load(function () {
    App.init();
  });
});
