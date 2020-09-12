import config from "../config";
import async from "async";
import * as moment from "moment";
import {
  ERROR,
  CONFIGURE,
  CONFIGURE_RETURNED,
  GET_BALANCES,
  GET_BALANCES_RETURNED,
  GET_BALANCES_PERPETUAL,
  GET_BALANCES_PERPETUAL_RETURNED,
  STAKE,
  STAKE_RETURNED,
  WITHDRAW,
  WITHDRAW_RETURNED,
  GET_REWARDS,
  GET_REWARDS_RETURNED,
  EXIT,
  EXIT_RETURNED,
  PROPOSE,
  PROPOSE_RETURNED,
  GET_PROPOSALS,
  GET_PROPOSALS_RETURNED,
  VOTE_FOR,
  VOTE_FOR_RETURNED,
  VOTE_AGAINST,
  VOTE_AGAINST_RETURNED,
  GET_CLAIMABLE_ASSET,
  GET_CLAIMABLE_ASSET_RETURNED,
  CLAIM,
  CLAIM_RETURNED,
  GET_CLAIMABLE,
  GET_CLAIMABLE_RETURNED,
  GET_YCRV_REQUIREMENTS,
  GET_YCRV_REQUIREMENTS_RETURNED,
  REGISTER_VOTE,
  REGISTER_VOTE_RETURNED,
  GET_VOTE_STATUS,
  GET_VOTE_STATUS_RETURNED,
} from "../constants";
import Web3 from "web3";

import {
  injected,
  walletconnect,
  walletlink,
  ledger,
  trezor,
  frame,
  fortmatic,
  portis,
  squarelink,
  torus,
  authereum,
} from "./connectors";

const rp = require("request-promise");
const ethers = require("ethers");

const Dispatcher = require("flux").Dispatcher;
const Emitter = require("events").EventEmitter;

const dispatcher = new Dispatcher();
const emitter = new Emitter();

class Store {
  constructor() {
    this.store = {
      votingStatus: false,
      governanceContractVersion: 1,
      currentBlock: 0,
      universalGasPrice: "70",
      account: {},
      web3: null,
      connectorsByName: {
        MetaMask: injected,
        TrustWallet: injected,
        WalletConnect: walletconnect,
        WalletLink: walletlink,
        Ledger: ledger,
        Trezor: trezor,
        Frame: frame,
        Fortmatic: fortmatic,
        Portis: portis,
        Squarelink: squarelink,
        Torus: torus,
        Authereum: authereum,
      },
      web3context: null,
      languages: [
        {
          language: "English",
          code: "en",
        },
        {
          language: "Japanese",
          code: "ja",
        },
        {
          language: "Chinese",
          code: "zh",
        },
      ],
      proposals: [],
      claimableAsset: {
        id: "safe",
        name: "SAFE",
        address: config.safeAddress,
        abi: config.safeABI,
        symbol: "SAFE",
        balance: 0,
        decimals: 18,
        rewardAddress: "0x64F5A74a3a905c2fC40Fb2fcAc6CBeE9F3D99a32",
        rewardSymbol: "aDAI",
        rewardDecimals: 18,
        claimableBalance: 0,
      },
      rewardPools: [
        {
          id: "ynft-eth",
          name: "yNFT(ETH)",
          website: "yinsure.finance",
          link: "https://etherscan.io/token/0x181aea6936b407514ebfc0754a37704eb8d98f91",
          depositsEnabled: true,
          tokens: [
            {
              id: "yNFT(ETH)",
              address: "0x181Aea6936B407514ebFC0754A37704eB8d98F91",
              symbol: "yNFT(ETH) ID #s",
              isERC721: true,
              abi: config.yNFTABI,
              rewardsAddress: config.yNFTETHRewardsAddress,
              rewardsABI: config.yNFTRewardsABI,
              rewardsSymbol: "SAFE",
              decimals: 0,
              balance: 0,
              stakedTokens: [],
              stakedCover: 0,
              rewardsAvailable: 0,
              stats: []
            },
          ],
        },
        {
          id: "ynft-dai",
          name: "yNFT(DAI)",
          website: "yinsure.finance",
          link: "https://etherscan.io/token/0x181aea6936b407514ebfc0754a37704eb8d98f91",
          depositsEnabled: true,
          tokens: [
            {
              id: "yNFT(DAI)",
              address: "0x181Aea6936B407514ebFC0754A37704eB8d98F91",
              symbol: "yNFT(DAI) ID #s",
              isERC721: true,
              abi: config.yNFTABI,
              rewardsAddress: config.yNFTDAIRewardsAddress,
              rewardsABI: config.yNFTRewardsABI,
              rewardsSymbol: "SAFE",
              decimals: 0,
              balance: 0,
              stakedTokens: [],
              stakedCover: 0,
              rewardsAvailable: 0,
              stats: []
            },
          ],
        },
        {
          id: "wnxm",
          name: "Nexus Mutants (WNXM)",
          website: "Wrapped NXM",
          link: "https://etherscan.io/token/0x0d438f3b5175bebc262bf23753c1e53d03432bde",
          depositsEnabled: true,
          tokens: [
            {
              id: "WNXM",
              address: "0x0d438F3b5175Bebc262bF23753C1E53d03432bDE",
              symbol: "WNXM",
              abi: config.wnxmABI,
              isERC721: false,
              rewardsAddress: config.wnxmRewardsAddress,
              rewardsABI: config.wnxmRewardsABI,
              rewardsSymbol: "SAFE",
              decimals: 18,
              balance: 0,
              stakedTokens: [],
              stakedBalance: 0,
              rewardsAvailable: 0,
              stats: []
            },
          ],
        },
        {
          id: "safe-dai",
          name: "SAFE-DAI Bal LP",
          website: "Balancer 98/2 DAI-SAFE",
          link: "",
          depositsEnabled: false,
          tokens: [
            {
              id: "SAFE_DAI_LP",
              address: "0x0d438F3b5175Bebc262bF23753C1E53d03432bDE",
              symbol: "SAFE_DAI_LP",
              abi: config.erc20ABI,
              isERC721: false,
              rewardsAddress: config.wnxmRewardsAddress,
              rewardsABI: config.wnxmRewardsABI,
              rewardsSymbol: "SAFE",
              decimals: 18,
              balance: 0,
              stakedTokens: [],
              stakedBalance: 0,
              rewardsAvailable: 0,
              stats: []
            },
          ],
        },
      ],
    };

    dispatcher.register(
      function (payload) {
        switch (payload.type) {
          case CONFIGURE:
            this.configure(payload);
            break;
          case GET_BALANCES:
            this.getBalances(payload);
            break;
          case GET_BALANCES_PERPETUAL:
            this.getBalancesPerpetual(payload);
            break;
          case STAKE:
            this.stake(payload);
            break;
          case WITHDRAW:
            this.withdraw(payload);
            break;
          case GET_REWARDS:
            this.getReward(payload);
            break;
          case EXIT:
            this.exit(payload);
            break;
          case PROPOSE:
            this.propose(payload);
            break;
          case GET_PROPOSALS:
            this.getProposals(payload);
            break;
          case REGISTER_VOTE:
            this.registerVote(payload);
            break;
          case GET_VOTE_STATUS:
            this.getVoteStatus(payload);
            break;
          case VOTE_FOR:
            this.voteFor(payload);
            break;
          case VOTE_AGAINST:
            this.voteAgainst(payload);
            break;
          case GET_CLAIMABLE_ASSET:
            this.getClaimableAsset(payload);
            break;
          case CLAIM:
            this.claim(payload);
            break;
          case GET_CLAIMABLE:
            this.getClaimable(payload);
            break;
          case GET_YCRV_REQUIREMENTS:
            this.getYCRVRequirements(payload);
            break;
          default: {
          }
        }
      }.bind(this)
    );
  }

  getStore(index) {
    return this.store[index];
  }

  setStore(obj) {
    this.store = { ...this.store, ...obj };
    return emitter.emit("StoreUpdated");
  }

  configure = async () => {
    const web3 = new Web3(store.getStore("web3context").library.provider);
    const currentBlock = await web3.eth.getBlockNumber();

    store.setStore({ currentBlock: currentBlock });

    window.setTimeout(() => {
      emitter.emit(CONFIGURE_RETURNED);
    }, 100);
  };

  getBalancesPerpetual = async () => {
    const pools = store.getStore("rewardPools");
    const account = store.getStore("account");

    const web3 = new Web3(store.getStore("web3context").library.provider);

    const currentBlock = await web3.eth.getBlockNumber();
    store.setStore({ currentBlock: currentBlock });

    async.map(
      pools,
      (pool, callback) => {
        async.map(
          pool.tokens,
          (token, callbackInner) => {
            async.parallel(
              [
                (callbackInnerInner) => {
                  this._getERCBalance(web3, token, account, callbackInnerInner);
                },
                (callbackInnerInner) => {
                  this._getStakedTokens(
                    web3,
                    token,
                    account,
                    callbackInnerInner
                  );
                },
                (callbackInnerInner) => {
                  this._getStakedCover(
                    web3,
                    token,
                    account,
                    callbackInnerInner
                  );
                },
                (callbackInnerInner) => {
                  this._getRewardsAvailable(
                    web3,
                    token,
                    account,
                    callbackInnerInner
                  );
                },
              ],
              (err, data) => {
                if (err) {
                  console.log(err);
                  return callbackInner(err);
                }
                console.log(data)
                token.balance = data[0];
                token.stakedTokens = data[1];
                token.stakedCover = data[2];
                token.rewardsAvailable = data[3];
                callbackInner(null, token);
              }
            );
          },
          (err, tokensData) => {
            if (err) {
              console.log("err " + err);
              return callback(err);
            }
            pool.tokens = tokensData;
            callback(null, pool);
          }
        );
      },
      (err, poolData) => {
        if (err) {
          console.log(err);
          return emitter.emit(ERROR, err);
        }
        console.log(poolData)
        store.setStore({ rewardPools: poolData });
        emitter.emit(GET_BALANCES_PERPETUAL_RETURNED);
        emitter.emit(GET_BALANCES_RETURNED);
      }
    );
  };

  getBalances = () => {
    const pools = store.getStore("rewardPools");
    const account = store.getStore("account");

    const web3 = new Web3(store.getStore("web3context").library.provider);

    async.map(
      pools,
      (pool, callback) => {
        async.map(
          pool.tokens,
          (token, callbackInner) => {
            async.parallel(
              [
                (callbackInnerInner) => {
                  this._getERCBalance(web3, token, account, callbackInnerInner);
                },
                (callbackInnerInner) => {
                  this._getStakedTokens(
                    web3,
                    token,
                    account,
                    callbackInnerInner
                  );
                },
                (callbackInnerInner) => {
                  this._getStakedCover(
                    web3,
                    token,
                    account,
                    callbackInnerInner
                  );
                },
                (callbackInnerInner) => {
                  this._getRewardsAvailable(
                    web3,
                    token,
                    account,
                    callbackInnerInner
                  );
                },
              ],
              (err, data) => {
                if (err) {
                  console.log(err);
                  return callbackInner(err);
                }
                token.balance = data[0];
                token.stakedTokens = data[1];
                token.stakedCover = data[2];
                token.rewardsAvailable = data[3]; 
                callbackInner(null, token);
              }
            );
          },
          (err, tokensData) => {
            if (err) {
              console.log(err);
              return callback(err);
            }

            pool.tokens = tokensData;
            callback(null, pool);
          }
        );
      },
      (err, poolData) => {
        if (err) {
          console.log(err);
          return emitter.emit(ERROR, err);
        }
        store.setStore({ rewardPools: poolData });
        emitter.emit(GET_BALANCES_RETURNED);
      }
    );
  };

  _checkApproval = async (asset, account, tokenIds, contract, callback) => {
    if (asset.isERC721) {
      try {
        const web3 = new Web3(store.getStore("web3context").library.provider);
  
        const erc721Contract = new web3.eth.Contract(asset.abi, asset.address);
        const approved = await erc721Contract.methods
          .isApprovedForAll(account.address, contract)
          .call({ from: account.address });
        if (!approved) {
          await erc721Contract.methods.setApprovalForAll(contract, true).send({
            from: account.address,
            gasPrice: web3.utils.toWei(await this._getGasPrice(), "gwei"),
          });
          callback();
        } else {
          callback();
        }
      } catch (error) {
        console.log(error);
        if (error.message) {
          return callback(error.message);
        }
        callback(error);
      }
    } else {
      try {
        const web3 = new Web3(store.getStore('web3context').library.provider);
        const erc20Contract = new web3.eth.Contract(asset.abi, asset.address)
        const allowance = await erc20Contract.methods.allowance(account.address, contract).call({ from: account.address })
        const ethAllowance = web3.utils.fromWei(allowance, "ether")
        if(parseFloat(ethAllowance) < parseFloat(tokenIds)) {
          await erc20Contract.methods.approve(contract, web3.utils.toWei("999999999999999", "ether")).send({ from: account.address, gasPrice: web3.utils.toWei(await this._getGasPrice(), 'gwei') })
          callback()
        } else {
          callback()
        }
      } catch(error) {
        console.log(error)
        if(error.message) {
          return callback(error.message)
        }
        callback(error)
      }
    }

  };

  _getERCBalance = async (web3, asset, account, callback) => {
    if (asset.isERC721) {
      let erc721Contract = new web3.eth.Contract(
        config.yNFTABI,
        asset.address
      );
      try {
        var balance = await erc721Contract.methods
          .balanceOf(account.address)
          .call({ from: account.address });
        var ownedIds = [];
        var idx = Array.from({ length: balance }, (item, index) => index);
        var getOwned = new Promise((resolve, reject) => {
          idx.forEach(async (index) => {
            var tokenIdx = await erc721Contract.methods
              .tokenOfOwnerByIndex(account.address, index)
              .call({ from: account.address });
              var token = await erc721Contract.methods.tokens(tokenIdx).call({from: account.address});
              if (token.coverCurrency == "0x45544800" && asset.id == "yNFT(ETH)") {
                ownedIds.push(tokenIdx);
              } else if (token.coverCurrency == "0x44414900" && asset.id == "yNFT(DAI)") {
                ownedIds.push(tokenIdx);
              }
            if (index === idx.length - 1) {
              resolve();
            }
          });
        });
        getOwned.then(() => {
          callback(null, ownedIds.sort(function(a, b) {return a - b;}));
        });
      } catch (ex) {
        return callback(ex);
      }
    } else {
      let erc20Contract = new web3.eth.Contract(config.erc20ABI, asset.address);
      try {
        var balance = await erc20Contract.methods
          .balanceOf(account.address)
          .call({ from: account.address });
        balance = parseFloat(balance) / 10 ** asset.decimals;
        callback(null, parseFloat(balance));
      } catch (ex) {
        console.log(ex);
        return callback(ex);
      }
    }
  };

  _getStakedCover = async (web3, asset, account, callback) => {
    if (asset.isERC721) {
      let erc721Contract = new web3.eth.Contract(
        asset.rewardsABI,
        asset.rewardsAddress
      );
      try {
        var coverAmt = await erc721Contract.methods
          .balanceOf(account.address)
          .call({ from: account.address });
        callback(null, parseFloat(coverAmt));
      } catch (ex) {
        return callback(ex);
      }
    } else {
      callback(null, 0);
    }
  };

  //  _getStakedStats = async (web3, asset, account, callback) => {
  //   if (asset.isERC721) {
  //     let erc721Contract = new web3.eth.Contract(
  //       asset.rewardsABI,
  //       asset.rewardsAddress
  //     );
  //     try {
  //       var totalCover = await erc721Contract.methods.totalCover().call();
  //       var adjCover = await erc721Contract.methods.totalSupply().call();
  //       var nftsStaked = await erc721Contract.methods.totalStaked().call();
  //       callback(null, {asset: asset.id, nftsStaked: parseFloat(nftsStaked), totalCover: parseFloat(totalCover), adjCover: parseFloat(adjCover)})
  //     } catch (ex) {
  //       return callback(ex);
  //     }
  //   } else {
  //     let erc20Contract = new web3.eth.Contract(asset.rewardsABI, asset.rewardsAddress)
  //     try {
  //       var totalStaked = await erc20Contract.methods.totalSupply().call();
  //       totalStaked = parseFloat(totalStaked)/10**asset.decimals;
  //       callback(null, {asset: asset.id, totalStaked: parseFloat(totalStaked)});
  //     } catch(ex) {
  //       return callback(ex)
  //     }
  //   }
  // }
  
  _getStakedTokens = async (web3, asset, account, callback) => {
    if (asset.isERC721) {
      let erc721Contract = new web3.eth.Contract(
        asset.rewardsABI,
        asset.rewardsAddress
      );
      try {
        var tokenIds = await erc721Contract.methods
          .idsStaked(account.address)
          .call({ from: account.address });
          tokenIds = tokenIds.map(Number);
          console.log(tokenIds)
          callback(null, tokenIds.sort(function(a, b) {return a - b;}));
      } catch (ex) {
        console.log("err")
        return callback(ex);
      }
    } else {
      let erc20Contract = new web3.eth.Contract(asset.rewardsABI, asset.rewardsAddress)
      try {
        var balance = await erc20Contract.methods.balanceOf(account.address).call({ from: account.address });
        balance = parseFloat(balance)/10**asset.decimals
        callback(null, parseFloat(balance))
      } catch(ex) {
        return callback(ex)
      }
    }
  };

  _getRewardsAvailable = async (web3, asset, account, callback) => {
    let erc20Contract = new web3.eth.Contract(
      asset.rewardsABI,
      asset.rewardsAddress
    );
    try {
      var earned = await erc20Contract.methods
        .earned(account.address)
        .call({ from: account.address });
      earned = parseFloat(earned) / 10 ** 18;
      callback(null, parseFloat(earned));
    } catch (ex) {
      return callback(ex);
    }
  };

  _checkIfApprovalIsNeeded = async (
    asset,
    account,
    amount,
    contract,
    callback,
    overwriteAddress
  ) => {
    const web3 = new Web3(store.getStore("web3context").library.provider);
    let erc20Contract = new web3.eth.Contract(
      config.erc20ABI,
      overwriteAddress ? overwriteAddress : asset.address
    );
    const allowance = await erc20Contract.methods
      .allowance(account.address, contract)
      .call({ from: account.address });

    const ethAllowance = web3.utils.fromWei(allowance, "ether");
    if (parseFloat(ethAllowance) < parseFloat(amount)) {
      asset.amount = amount;
      callback(null, asset);
    } else {
      callback(null, false);
    }
  };

  _callApproval = async (
    asset,
    account,
    amount,
    contract,
    last,
    callback,
    overwriteAddress
  ) => {
    const web3 = new Web3(store.getStore("web3context").library.provider);
    let erc721Contract = new web3.eth.Contract(
      config.yNFTABI,
      overwriteAddress ? overwriteAddress : asset.address
    );
    try {
      if (last) {
        await erc721Contract.methods
          .approve(contract, web3.utils.toWei("999999999999999", "ether"))
          .send({
            from: account.address,
            gasPrice: web3.utils.toWei(await this._getGasPrice(), "gwei"),
          });
        callback();
      } else {
        erc721Contract.methods
          .approve(contract, web3.utils.toWei("999999999999999", "ether"))
          .send({
            from: account.address,
            gasPrice: web3.utils.toWei(await this._getGasPrice(), "gwei"),
          })
          .on("transactionHash", function (hash) {
            callback();
          })
          .on("error", function (error) {
            if (!error.toString().includes("-32601")) {
              if (error.message) {
                return callback(error.message);
              }
              callback(error);
            }
          });
      }
    } catch (error) {
      if (error.message) {
        return callback(error.message);
      }
      callback(error);
    }
  };

  stake = (payload) => {
    const account = store.getStore("account");
    const { asset, tokenIds } = payload.content;

    this._checkApproval(
      asset,
      account,
      tokenIds,
      asset.rewardsAddress,
      (err) => {
        if (err) {
          return emitter.emit(ERROR, err);
        }

        this._callStake(asset, account, tokenIds, (err, res) => {
          if (err) {
            return emitter.emit(ERROR, err);
          }

          return emitter.emit(STAKE_RETURNED, res);
        });
      }
    );
  };

  _callStake = async (asset, account, tokenIds, callback) => {
    const web3 = new Web3(store.getStore("web3context").library.provider);
    if (asset.isERC721) {
      const yNFTContract = new web3.eth.Contract(
        asset.rewardsABI,
        asset.rewardsAddress
      );
      yNFTContract.methods
        .stakeMultiple(tokenIds)
        .send({
          from: account.address,
          gasPrice: web3.utils.toWei(await this._getGasPrice(), "gwei"),
        })
        .on("transactionHash", function (hash) {
          console.log(hash);
          callback(null, hash);
        })
        .on("confirmation", function (confirmationNumber, receipt) {
          console.log(confirmationNumber, receipt);
          if (confirmationNumber == 2) {
            dispatcher.dispatch({ type: GET_BALANCES, content: {} });
          }
        })
        .on("receipt", function (receipt) {
          console.log(receipt);
        })
        .on("error", function (error) {
          if (!error.toString().includes("-32601")) {
            if (error.message) {
              return callback(error.message);
            }
            callback(error);
          }
        })
        .catch((error) => {
          if (!error.toString().includes("-32601")) {
            if (error.message) {
              return callback(error.message);
            }
            callback(error);
          }
        });
    } else {
      const SAFEDAIPoolContract = new web3.eth.Contract(asset.rewardsABI, asset.rewardsAddress)
  
      var amountToSend = web3.utils.toWei(tokenIds, "ether")
      if (asset.decimals != 18) {
        amountToSend = (tokenIds*10**asset.decimals).toFixed(0);
      }
  
      SAFEDAIPoolContract.methods.stake(amountToSend).send({ from: account.address, gasPrice: web3.utils.toWei(await this._getGasPrice(), 'gwei') })
        .on('transactionHash', function(hash){
          console.log(hash)
          callback(null, hash)
        })
        .on('confirmation', function(confirmationNumber, receipt){
          console.log(confirmationNumber, receipt);
          if(confirmationNumber == 2) {
            dispatcher.dispatch({ type: GET_BALANCES, content: {} })
          }
        })
        .on('receipt', function(receipt){
          console.log(receipt);
        })
        .on('error', function(error) {
          if (!error.toString().includes("-32601")) {
            if(error.message) {
              return callback(error.message)
            }
            callback(error)
          }
        })
        .catch((error) => {
          if (!error.toString().includes("-32601")) {
            if(error.message) {
              return callback(error.message)
            }
            callback(error)
          }
        })
    }

  };

  withdraw = (payload) => {
    const account = store.getStore("account");
    const { asset, tokenIds } = payload.content;
    this._callWithdraw(asset, account, tokenIds, (err, res) => {
      if (err) {
        return emitter.emit(ERROR, err);
      }

      return emitter.emit(WITHDRAW_RETURNED, res);
    });
  };

  _callWithdraw = async (asset, account, tokenIds, callback) => {
    const web3 = new Web3(store.getStore("web3context").library.provider);
    if (asset.isERC721) {
      const yNFTContract = new web3.eth.Contract(
        asset.rewardsABI,
        asset.rewardsAddress
      );
  
      yNFTContract.methods
        .withdrawMultiple(tokenIds)
        .send({
          from: account.address,
          gasPrice: web3.utils.toWei(await this._getGasPrice(), "gwei"),
        })
        .on("transactionHash", function (hash) {
          console.log(hash);
          callback(null, hash);
        })
        .on("confirmation", function (confirmationNumber, receipt) {
          console.log(confirmationNumber, receipt);
          if (confirmationNumber == 2) {
            dispatcher.dispatch({ type: GET_BALANCES, content: {} });
          }
        })
        .on("receipt", function (receipt) {
          console.log(receipt);
        })
        .on("error", function (error) {
          if (!error.toString().includes("-32601")) {
            if (error.message) {
              return callback(error.message);
            }
            callback(error);
          }
        })
        .catch((error) => {
          if (!error.toString().includes("-32601")) {
            if (error.message) {
              return callback(error.message);
            }
            callback(error);
          }
        });
    } else {
      const SAFEDAIPoolContract = new web3.eth.Contract(asset.rewardsABI, asset.rewardsAddress)

      var amountToSend = web3.utils.toWei(tokenIds, "ether")
      if (asset.decimals != 18) {
        amountToSend = (tokenIds*10**asset.decimals).toFixed(0);
      }

      SAFEDAIPoolContract.methods.withdraw(amountToSend).send({ from: account.address, gasPrice: web3.utils.toWei(await this._getGasPrice(), 'gwei') })
        .on('transactionHash', function(hash){
          console.log(hash)
          callback(null, hash)
        })
        .on('confirmation', function(confirmationNumber, receipt){
          console.log(confirmationNumber, receipt);
          if(confirmationNumber == 2) {
            dispatcher.dispatch({ type: GET_BALANCES, content: {} })
          }
        })
        .on('receipt', function(receipt){
          console.log(receipt);
        })
        .on('error', function(error) {
          if (!error.toString().includes("-32601")) {
            if(error.message) {
              return callback(error.message)
            }
            callback(error)
          }
        })
        .catch((error) => {
          if (!error.toString().includes("-32601")) {
            if(error.message) {
              return callback(error.message)
            }
            callback(error)
          }
        })
      }
  };

  getReward = (payload) => {
    const account = store.getStore("account");
    const { asset } = payload.content;

    this._callGetReward(asset, account, (err, res) => {
      if (err) {
        return emitter.emit(ERROR, err);
      }

      return emitter.emit(GET_REWARDS_RETURNED, res);
    });
  };

  _callGetReward = async (asset, account, callback) => {
    const web3 = new Web3(store.getStore("web3context").library.provider);

    const yCurveFiContract = new web3.eth.Contract(
      asset.rewardsABI,
      asset.rewardsAddress
    );

    yCurveFiContract.methods
      .getReward()
      .send({
        from: account.address,
        gasPrice: web3.utils.toWei(await this._getGasPrice(), "gwei"),
      })
      .on("transactionHash", function (hash) {
        console.log(hash);
        callback(null, hash);
      })
      .on("confirmation", function (confirmationNumber, receipt) {
        console.log(confirmationNumber, receipt);
        if (confirmationNumber == 2) {
          dispatcher.dispatch({ type: GET_BALANCES, content: {} });
        }
      })
      .on("receipt", function (receipt) {
        console.log(receipt);
      })
      .on("error", function (error) {
        if (!error.toString().includes("-32601")) {
          if (error.message) {
            return callback(error.message);
          }
          callback(error);
        }
      })
      .catch((error) => {
        if (!error.toString().includes("-32601")) {
          if (error.message) {
            return callback(error.message);
          }
          callback(error);
        }
      });
  };

  exit = (payload) => {
    const account = store.getStore("account");
    const { asset } = payload.content;

    this._callExit(asset, account, (err, res) => {
      if (err) {
        return emitter.emit(ERROR, err);
      }

      return emitter.emit(EXIT_RETURNED, res);
    });
  };

  _callExit = async (asset, account, callback) => {
    const web3 = new Web3(store.getStore("web3context").library.provider);

    const PoolContract = new web3.eth.Contract(
      asset.rewardsABI,
      asset.rewardsAddress
    );

    PoolContract.methods
      .exit()
      .send({
        from: account.address,
        gasPrice: web3.utils.toWei(await this._getGasPrice(), "gwei"),
      })
      .on("transactionHash", function (hash) {
        console.log(hash);
        callback(null, hash);
      })
      .on("confirmation", function (confirmationNumber, receipt) {
        console.log(confirmationNumber, receipt);
        if (confirmationNumber == 2) {
          dispatcher.dispatch({ type: GET_BALANCES, content: {} });
        }
      })
      .on("receipt", function (receipt) {
        console.log(receipt);
      })
      .on("error", function (error) {
        if (!error.toString().includes("-32601")) {
          if (error.message) {
            return callback(error.message);
          }
          callback(error);
        }
      })
      .catch((error) => {
        if (!error.toString().includes("-32601")) {
          if (error.message) {
            return callback(error.message);
          }
          callback(error);
        }
      });
  };

  propose = (payload) => {
    const account = store.getStore("account");
    const { executor, hash } = payload.content;

    this._callPropose(account, executor, hash, (err, res) => {
      if (err) {
        return emitter.emit(ERROR, err);
      }

      return emitter.emit(PROPOSE_RETURNED, res);
    });
  };

  _callPropose = async (account, executor, hash, callback) => {
    const web3 = new Web3(store.getStore("web3context").library.provider);

    const governanceContractVersion = store.getStore(
      "governanceContractVersion"
    );
    const abi =
      governanceContractVersion === 1
        ? config.governanceABI
        : config.governanceV2ABI;
    const address =
      governanceContractVersion === 1
        ? config.governanceAddress
        : config.governanceV2Address;

    const governanceContract = new web3.eth.Contract(abi, address);

    let call = null;
    if (governanceContractVersion === 1) {
      call = governanceContract.methods.propose();
    } else {
      call = governanceContract.methods.propose(executor, hash);
    }

    call
      .send({
        from: account.address,
        gasPrice: web3.utils.toWei(await this._getGasPrice(), "gwei"),
      })
      .on("transactionHash", function (hash) {
        console.log(hash);
        callback(null, hash);
      })
      .on("confirmation", function (confirmationNumber, receipt) {
        console.log(confirmationNumber, receipt);
        if (confirmationNumber == 2) {
          dispatcher.dispatch({ type: GET_BALANCES, content: {} });
        }
      })
      .on("receipt", function (receipt) {
        console.log(receipt);
      })
      .on("error", function (error) {
        if (!error.toString().includes("-32601")) {
          if (error.message) {
            return callback(error.message);
          }
          callback(error);
        }
      })
      .catch((error) => {
        if (!error.toString().includes("-32601")) {
          if (error.message) {
            return callback(error.message);
          }
          callback(error);
        }
      });
  };

  getProposals = (payload) => {
    // emitter.emit(GET_PROPOSALS_RETURNED)
    const account = store.getStore("account");
    const web3 = new Web3(store.getStore("web3context").library.provider);

    this._getProposalCount(web3, account, (err, proposalCount) => {
      if (err) {
        return emitter.emit(ERROR, err);
      }

      let arr = Array.from(Array(parseInt(proposalCount)).keys());

      if (proposalCount == 0) {
        arr = [];
      }

      async.map(
        arr,
        (proposal, callback) => {
          this._getProposals(web3, account, proposal, callback);
        },
        (err, proposalsData) => {
          if (err) {
            return emitter.emit(ERROR, err);
          }

          store.setStore({ proposals: proposalsData });
          emitter.emit(GET_PROPOSALS_RETURNED);
        }
      );
    });
  };

  _getProposalCount = async (web3, account, callback) => {
    try {
      const governanceContractVersion = store.getStore(
        "governanceContractVersion"
      );
      const abi =
        governanceContractVersion === 1
          ? config.governanceABI
          : config.governanceV2ABI;
      const address =
        governanceContractVersion === 1
          ? config.governanceAddress
          : config.governanceV2Address;

      const governanceContract = new web3.eth.Contract(abi, address);
      var proposals = await governanceContract.methods
        .proposalCount()
        .call({ from: account.address });
      callback(null, proposals);
    } catch (ex) {
      return callback(ex);
    }
  };

  _getProposals = async (web3, account, number, callback) => {
    try {
      const governanceContractVersion = store.getStore(
        "governanceContractVersion"
      );
      const abi =
        governanceContractVersion === 1
          ? config.governanceABI
          : config.governanceV2ABI;
      const address =
        governanceContractVersion === 1
          ? config.governanceAddress
          : config.governanceV2Address;

      const governanceContract = new web3.eth.Contract(abi, address);
      var proposal = await governanceContract.methods
        .proposals(number)
        .call({ from: account.address });

      proposal.executor =
        governanceContractVersion === 1
          ? "0x0000000000000000000000000000000000000000"
          : proposal.executor;
      proposal.hash = governanceContractVersion === 1 ? "na" : proposal.hash;
      proposal.quorum =
        governanceContractVersion === 1 ? "na" : proposal.quorum;
      proposal.quorumRequired =
        governanceContractVersion === 1 ? "na" : proposal.quorumRequired;

      callback(null, proposal);
    } catch (ex) {
      return callback(ex);
    }
  };

  getVoteStatus = async (payload) => {
    try {
      const account = store.getStore("account");
      const web3 = new Web3(store.getStore("web3context").library.provider);

      const governanceContract = new web3.eth.Contract(
        config.governanceV2ABI,
        config.governanceV2Address
      );

      const status = await governanceContract.methods
        .voters(account.address)
        .call({ from: account.address });

      store.setStore({ votingStatus: status });
      emitter.emit(GET_VOTE_STATUS_RETURNED, status);
    } catch (ex) {
      return emitter.emit(ERROR, ex);
    }
  };

  registerVote = (payload) => {
    const account = store.getStore("account");

    this._callRegisterVote(account, (err, res) => {
      if (err) {
        return emitter.emit(ERROR, err);
      }

      return emitter.emit(REGISTER_VOTE_RETURNED, res);
    });
  };

  _callRegisterVote = async (account, callback) => {
    const web3 = new Web3(store.getStore("web3context").library.provider);

    const governanceContract = new web3.eth.Contract(
      config.governanceV2ABI,
      config.governanceV2Address
    );
    governanceContract.methods
      .register()
      .send({
        from: account.address,
        gasPrice: web3.utils.toWei(await this._getGasPrice(), "gwei"),
      })
      .on("transactionHash", function (hash) {
        console.log(hash);
        callback(null, hash);
      })
      .on("confirmation", function (confirmationNumber, receipt) {
        console.log(confirmationNumber, receipt);
        if (confirmationNumber == 2) {
          dispatcher.dispatch({ type: GET_VOTE_STATUS, content: {} });
        }
      })
      .on("receipt", function (receipt) {
        console.log(receipt);
      })
      .on("error", function (error) {
        if (!error.toString().includes("-32601")) {
          if (error.message) {
            return callback(error.message);
          }
          callback(error);
        }
      })
      .catch((error) => {
        if (!error.toString().includes("-32601")) {
          if (error.message) {
            return callback(error.message);
          }
          callback(error);
        }
      });
  };

  voteFor = (payload) => {
    const account = store.getStore("account");
    const { proposal } = payload.content;

    this._callVoteFor(proposal, account, (err, res) => {
      if (err) {
        return emitter.emit(ERROR, err);
      }

      return emitter.emit(VOTE_FOR_RETURNED, res);
    });
  };

  _callVoteFor = async (proposal, account, callback) => {
    const web3 = new Web3(store.getStore("web3context").library.provider);

    const governanceContractVersion = store.getStore(
      "governanceContractVersion"
    );
    const abi =
      governanceContractVersion === 1
        ? config.governanceABI
        : config.governanceV2ABI;
    const address =
      governanceContractVersion === 1
        ? config.governanceAddress
        : config.governanceV2Address;

    const governanceContract = new web3.eth.Contract(abi, address);

    governanceContract.methods
      .voteFor(proposal.id)
      .send({
        from: account.address,
        gasPrice: web3.utils.toWei(await this._getGasPrice(), "gwei"),
      })
      .on("transactionHash", function (hash) {
        console.log(hash);
        callback(null, hash);
      })
      .on("confirmation", function (confirmationNumber, receipt) {
        console.log(confirmationNumber, receipt);
        if (confirmationNumber == 2) {
          dispatcher.dispatch({ type: GET_PROPOSALS, content: {} });
        }
      })
      .on("receipt", function (receipt) {
        console.log(receipt);
      })
      .on("error", function (error) {
        if (!error.toString().includes("-32601")) {
          if (error.message) {
            return callback(error.message);
          }
          callback(error);
        }
      })
      .catch((error) => {
        if (!error.toString().includes("-32601")) {
          if (error.message) {
            return callback(error.message);
          }
          callback(error);
        }
      });
  };

  voteAgainst = (payload) => {
    const account = store.getStore("account");
    const { proposal } = payload.content;

    this._callVoteAgainst(proposal, account, (err, res) => {
      if (err) {
        return emitter.emit(ERROR, err);
      }

      return emitter.emit(VOTE_AGAINST_RETURNED, res);
    });
  };

  _callVoteAgainst = async (proposal, account, callback) => {
    const web3 = new Web3(store.getStore("web3context").library.provider);

    const governanceContractVersion = store.getStore(
      "governanceContractVersion"
    );
    const abi =
      governanceContractVersion === 1
        ? config.governanceABI
        : config.governanceV2ABI;
    const address =
      governanceContractVersion === 1
        ? config.governanceAddress
        : config.governanceV2Address;

    const governanceContract = new web3.eth.Contract(abi, address);

    governanceContract.methods
      .voteAgainst(proposal.id)
      .send({
        from: account.address,
        gasPrice: web3.utils.toWei(await this._getGasPrice(), "gwei"),
      })
      .on("transactionHash", function (hash) {
        console.log(hash);
        callback(null, hash);
      })
      .on("confirmation", function (confirmationNumber, receipt) {
        console.log(confirmationNumber, receipt);
        if (confirmationNumber == 2) {
          dispatcher.dispatch({ type: GET_PROPOSALS, content: {} });
        }
      })
      .on("receipt", function (receipt) {
        console.log(receipt);
      })
      .on("error", function (error) {
        if (!error.toString().includes("-32601")) {
          if (error.message) {
            return callback(error.message);
          }
          callback(error);
        }
      })
      .catch((error) => {
        if (!error.toString().includes("-32601")) {
          if (error.message) {
            return callback(error.message);
          }
          callback(error);
        }
      });
  };

  getClaimableAsset = (payload) => {
    const account = store.getStore("account");
    const asset = store.getStore("claimableAsset");

    const web3 = new Web3(store.getStore("web3context").library.provider);

    async.parallel(
      [
        (callbackInnerInner) => {
          this._getClaimableBalance(web3, asset, account, callbackInnerInner);
        },
        (callbackInnerInner) => {
          this._getClaimable(web3, asset, account, callbackInnerInner);
        },
      ],
      (err, data) => {
        if (err) {
          return emitter.emit(ERROR, err);
        }

        asset.balance = data[0];
        asset.claimableBalance = data[1];

        store.setStore({ claimableAsset: asset });
        emitter.emit(GET_CLAIMABLE_ASSET_RETURNED);
      }
    );
  };

  _getClaimableBalance = async (web3, asset, account, callback) => {
    let erc20Contract = new web3.eth.Contract(asset.abi, asset.address);

    try {
      var balance = await erc20Contract.methods
        .balanceOf(account.address)
        .call({ from: account.address });
      balance = parseFloat(balance) / 10 ** asset.decimals;
      callback(null, parseFloat(balance));
    } catch (ex) {
      return callback(ex);
    }
  };

  _getClaimable = async (web3, asset, account, callback) => {
    let claimContract = new web3.eth.Contract(
      config.claimABI,
      config.claimAddress
    );

    try {
      var balance = await claimContract.methods
        .claimable(account.address)
        .call({ from: account.address });
      balance = parseFloat(balance) / 10 ** asset.decimals;
      callback(null, parseFloat(balance));
    } catch (ex) {
      return callback(ex);
    }
  };

  claim = (payload) => {
    const account = store.getStore("account");
    const asset = store.getStore("claimableAsset");
    const { tokenIds } = payload.content;

    this._checkApproval(
      asset,
      account,
      tokenIds,
      config.claimAddress,
      (err) => {
        if (err) {
          return emitter.emit(ERROR, err);
        }

        this._callClaim(asset, account, tokenIds, (err, res) => {
          if (err) {
            return emitter.emit(ERROR, err);
          }

          return emitter.emit(CLAIM_RETURNED, res);
        });
      }
    );
  };

  _callClaim = async (asset, account, amount, callback) => {
    const web3 = new Web3(store.getStore("web3context").library.provider);

    const claimContract = new web3.eth.Contract(
      config.claimABI,
      config.claimAddress
    );

    var amountToSend = web3.utils.toWei(amount, "ether");
    if (asset.decimals != 18) {
      amountToSend = (amount * 10 ** asset.decimals).toFixed(0);
    }

    claimContract.methods
      .claim(amountToSend)
      .send({
        from: account.address,
        gasPrice: web3.utils.toWei(await this._getGasPrice(), "gwei"),
      })
      .on("transactionHash", function (hash) {
        console.log(hash);
        callback(null, hash);
      })
      .on("confirmation", function (confirmationNumber, receipt) {
        console.log(confirmationNumber, receipt);
        if (confirmationNumber == 2) {
          dispatcher.dispatch({ type: GET_CLAIMABLE_ASSET, content: {} });
        }
      })
      .on("receipt", function (receipt) {
        console.log(receipt);
      })
      .on("error", function (error) {
        if (!error.toString().includes("-32601")) {
          if (error.message) {
            return callback(error.message);
          }
          callback(error);
        }
      })
      .catch((error) => {
        if (!error.toString().includes("-32601")) {
          if (error.message) {
            return callback(error.message);
          }
          callback(error);
        }
      });
  };

  getClaimable = (payload) => {
    const account = store.getStore("account");
    const asset = store.getStore("claimableAsset");

    const web3 = new Web3(store.getStore("web3context").library.provider);
    async.parallel(
      [
        (callbackInnerInner) => {
          this._getClaimableBalance(web3, asset, account, callbackInnerInner);
        },
        (callbackInnerInner) => {
          this._getClaimable(web3, asset, account, callbackInnerInner);
        },
      ],
      (err, data) => {
        if (err) {
          return emitter.emit(ERROR, err);
        }

        asset.balance = data[0];
        asset.claimableBalance = data[1];

        store.setStore({ claimableAsset: asset });
        emitter.emit(GET_CLAIMABLE_RETURNED);
      }
    );
  };

  getYCRVRequirements = async (payload) => {
    try {
      const account = store.getStore("account");
      const web3 = new Web3(store.getStore("web3context").library.provider);

      const governanceContract = new web3.eth.Contract(
        config.governanceABI,
        config.governanceAddress
      );

      let balance = await governanceContract.methods
        .balanceOf(account.address)
        .call({ from: account.address });
      balance = parseFloat(balance) / 10 ** 18;

      const voteLock = await governanceContract.methods
        .voteLock(account.address)
        .call({ from: account.address });
      const currentBlock = await web3.eth.getBlockNumber();

      const returnOBJ = {
        balanceValid: balance > 1000,
        voteLockValid: voteLock > currentBlock,
        voteLock: voteLock,
      };

      emitter.emit(GET_YCRV_REQUIREMENTS_RETURNED, returnOBJ);
    } catch (ex) {
      return emitter.emit(ERROR, ex);
    }
  };

  _getGasPrice = async () => {
    try {
      const url = "http://gasprice.poa.network/";
      const priceString = await rp(url);
      const priceJSON = JSON.parse(priceString);
      if (priceJSON) {
        return priceJSON.fast.toFixed(0);
      }
      return store.getStore("universalGasPrice");
    } catch (e) {
      console.log(e);
      return store.getStore("universalGasPrice");
    }
  };
}

var store = new Store();

export default {
  store: store,
  dispatcher: dispatcher,
  emitter: emitter,
};