import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import { withStyles } from "@material-ui/core/styles";
import {
  Typography,
  Button,
  Card,
  TextField,
  InputAdornment,
} from "@material-ui/core";
import { withNamespaces } from "react-i18next";

import CheckIcon from "@material-ui/icons/Check";
import ClearIcon from "@material-ui/icons/Clear";

import Loader from "../loader";
import Snackbar from "../snackbar";

import Store from "../../stores";
import { colors } from "../../theme";

import {
  ERROR,
  CONFIGURE_RETURNED,
  STAKE,
  STAKE_RETURNED,
  WITHDRAW,
  WITHDRAW_RETURNED,
  GET_REWARDS,
  GET_REWARDS_RETURNED,
  EXIT,
  EXIT_RETURNED,
  GET_YCRV_REQUIREMENTS,
  GET_YCRV_REQUIREMENTS_RETURNED,
  GET_BALANCES_RETURNED,
} from "../../constants";

const styles = (theme) => ({
  root: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    maxWidth: "900px",
    width: "100%",
    justifyContent: "flex-start",
    alignItems: "center",
    marginTop: "40px",
  },
  intro: {
    width: "100%",
    position: "relative",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  introCenter: {
    minWidth: "100%",
    textAlign: "center",
    padding: "48px 0px",
  },
  investedContainer: {
    display: "flex",
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px",
    minWidth: "100%",
    [theme.breakpoints.up("md")]: {
      minWidth: "800px",
    },
  },
  connectContainer: {
    padding: "12px",
    display: "flex",
    justifyContent: "center",
    width: "100%",
    maxWidth: "450px",
    [theme.breakpoints.up("md")]: {
      width: "450",
    },
  },
  disclaimer: {
    padding: "12px",
    border: "1px solid rgb(174, 174, 174)",
    borderRadius: "0.75rem",
    marginBottom: "24px",
  },
  addressContainer: {
    display: "flex",
    justifyContent: "space-between",
    overflow: "hidden",
    flex: 1,
    whiteSpace: "nowrap",
    fontSize: "0.83rem",
    textOverflow: "ellipsis",
    cursor: "pointer",
    padding: "28px 30px",
    borderRadius: "50px",
    border: "1px solid " + colors.borderBlue,
    alignItems: "center",
    maxWidth: "500px",
    [theme.breakpoints.up("md")]: {
      width: "100%",
    },
  },
  walletAddress: {
    padding: "0px 12px",
  },
  walletTitle: {
    flex: 1,
    color: colors.darkGray,
  },
  overview: {
    display: "flex",
    justifyContent: "space-between",
    padding: "28px 30px",
    borderRadius: "50px",
    border: "1px solid " + colors.borderBlue,
    alignItems: "center",
    marginTop: "40px",
    width: "100%",
    background: colors.white,
  },
  overviewField: {
    display: "flex",
    flexDirection: "column",
  },
  overviewTitle: {
    color: colors.darkGray,
    fontSize: "18px"
  },
  overviewValue: {},
  actions: {
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    maxWidth: "900px",
    flexWrap: "wrap",
    background: colors.white,
    border: "1px solid " + colors.borderBlue,
    padding: "28px 30px",
    borderRadius: "50px",
    marginTop: "40px",
  },
  actionContainer: {
    minWidth: "calc(50% - 40px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "20px",
  },
  primaryButton: {
    "&:hover": {
      backgroundColor: "#2F80ED",
    },
    padding: "20px 32px",
    backgroundColor: "#2F80ED",
    borderRadius: "50px",
    fontWeight: 500,
  },
  actionButton: {
    padding: "20px 32px",
    borderRadius: "50px",
  },
  buttonText: {
    fontWeight: "700",
  },
  stakeButtonText: {
    fontWeight: "700",
    color: "white",
  },
  valContainer: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
  },
  actionInput: {
    padding: "0px 0px 12px 0px",
    fontSize: "0.5rem",
  },
  inputAdornment: {
    fontWeight: "600",
    fontSize: "1.5rem",
  },
  assetIcon: {
    display: "inline-block",
    verticalAlign: "middle",
    borderRadius: "25px",
    background: "#dedede",
    height: "30px",
    width: "30px",
    textAlign: "center",
    marginRight: "16px",
  },
  balances: {
    width: "100%",
    textAlign: "right",
    paddingRight: "20px",
    cursor: "pointer",
  },
  stakeTitle: {
    width: "100%",
    color: colors.darkGray,
    marginBottom: "20px",
  },
  stakeButtons: {
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    align: "center",
    marginTop: "20px",
  },
  stakeButton: {
    minWidth: "300px",
  },
  requirement: {
    display: "flex",
    alignItems: "center",
  },
  check: {
    paddingTop: "6px",
  },
  voteLockMessage: {
    margin: "20px",
  },
  title: {
    width: "100%",
    color: colors.darkGray,
    minWidth: "100%",
    marginLeft: "20px",
  },
});

const emitter = Store.emitter;
const dispatcher = Store.dispatcher;
const store = Store.store;

class Stake extends Component {
  constructor(props) {
    super();

    const account = store.getStore("account");
    const pool = store.getStore("currentPool");
    const governanceContractVersion = store.getStore(
      "governanceContractVersion"
    );
    if (!pool) {
      props.history.push("/");
    }

    this.state = {
      pool: pool,
      loading: !(account || pool),
      account: account,
      value: "options",
      voteLockValid: false,
      balanceValid: false,
      voteLock: null,
      governanceContractVersion: governanceContractVersion,
    };

    if (pool && ["FeeRewards", "Governance"].includes(pool.id)) {
      dispatcher.dispatch({ type: GET_YCRV_REQUIREMENTS, content: {} });
    }
  }

  componentWillMount() {
    emitter.on(ERROR, this.errorReturned);
    emitter.on(STAKE_RETURNED, this.showHash);
    emitter.on(WITHDRAW_RETURNED, this.showHash);
    emitter.on(EXIT_RETURNED, this.showHash);
    emitter.on(GET_REWARDS_RETURNED, this.showHash);
    emitter.on(GET_YCRV_REQUIREMENTS_RETURNED, this.yCrvRequirementsReturned);
    emitter.on(GET_BALANCES_RETURNED, this.balancesReturned);
  }

  componentWillUnmount() {
    emitter.removeListener(ERROR, this.errorReturned);
    emitter.removeListener(STAKE_RETURNED, this.showHash);
    emitter.removeListener(WITHDRAW_RETURNED, this.showHash);
    emitter.removeListener(EXIT_RETURNED, this.showHash);
    emitter.removeListener(GET_REWARDS_RETURNED, this.showHash);
    emitter.removeListener(
      GET_YCRV_REQUIREMENTS_RETURNED,
      this.yCrvRequirementsReturned
    );
    emitter.removeListener(GET_BALANCES_RETURNED, this.balancesReturned);
  }

  balancesReturned = () => {
    const currentPool = store.getStore("currentPool");
    const pools = store.getStore("rewardPools");
    let newPool = pools.filter((pool) => {
      return pool.id === currentPool.id;
    });

    if (newPool.length > 0) {
      newPool = newPool[0];
      store.setStore({ currentPool: newPool });
    }
  };

  yCrvRequirementsReturned = (requirements) => {
    this.setState({
      balanceValid: requirements.balanceValid,
      voteLockValid: requirements.voteLockValid,
      voteLock: requirements.voteLock,
    });
  };

  showHash = (txHash) => {
    this.setState({
      snackbarMessage: null,
      snackbarType: null,
      loading: false,
    });
    const that = this;
    setTimeout(() => {
      const snackbarObj = { snackbarMessage: txHash, snackbarType: "Hash" };
      that.setState(snackbarObj);
    });
  };

  errorReturned = (error) => {
    const snackbarObj = { snackbarMessage: null, snackbarType: null };
    this.setState(snackbarObj);
    this.setState({ loading: false });
    const that = this;
    setTimeout(() => {
      const snackbarObj = {
        snackbarMessage: error.toString(),
        snackbarType: "Error",
      };
      that.setState(snackbarObj);
    });
  };

  render() {
    const { classes } = this.props;
    const {
      value,
      account,
      modalOpen,
      pool,
      loading,
      snackbarMessage,
      voteLockValid,
      balanceValid,
    } = this.state;
    var address = null;
    if (account.address) {
      address =
        account.address.substring(0, 6) +
        "..." +
        account.address.substring(
          account.address.length - 4,
          account.address.length
        );
    }

    if (!pool) {
      return null;
    }
    return (
      <div className={classes.root}>
        <Typography variant={"h5"} className={classes.disclaimer}>
          This project is in beta. Use at your own risk.
        </Typography>
        <div className={classes.intro}>
          <Button
            className={classes.stakeButton}
            variant="outlined"
            color="secondary"
            disabled={loading}
            onClick={() => {
              this.props.history.push("/staking");
            }}
          >
            <Typography variant={"h4"}>Back</Typography>
          </Button>
        </div>
        <div className={classes.overview}>
          <div className={classes.overviewField}>
            <Typography variant={"h3"} className={classes.overviewTitle}>
              {"Owned " 
              + pool.tokens[0].symbol}
            </Typography>
            <Typography variant={"h2"} className={classes.overviewValue}>
              { (pool.tokens[0].isERC721 ? (pool.tokens[0].balance.toString()
                ? pool.tokens[0].balance.toString()
                : "None") : (pool.tokens[0].balance.toString()
                ? (Math.floor(pool.tokens[0].balance * 10000)/10000).toFixed(4)
                : "0"))
              }
            </Typography>
          </div>
          <div className={classes.overviewField}>
            <Typography variant={"h3"} className={classes.overviewTitle}>
              {"Staked " + pool.tokens[0].symbol}
            </Typography>
            <Typography variant={"h2"} className={classes.overviewValue}>
            {pool.tokens[0].stakedTokens}
              {/* {(pool.tokens[0].isERC721 ? (pool.tokens[0].stakedTokens.toString()
                ? pool.tokens[0].stakedTokens.toString()
                : "None") : (pool.tokens[0].stakedTokens.toString()
                ? (Math.floor(pool.tokens[0].stakedTokens * 10000)/10000).toFixed(4)
                : "0"))} */}
            </Typography>
          </div>
          {(pool.id == "ynft-eth" || pool.id == "ynft-dai")  ? (
            <div className={classes.overviewField}>
              <Typography variant={"h3"} className={classes.overviewTitle}>
                Adj. Cover Value
              </Typography>
              <Typography variant={"h2"} className={classes.overviewValue}>
                {pool.id == "ynft-eth" ? pool.tokens[0].stakedCover.toFixed(0) + " ETH" : pool.tokens[0].stakedCover.toFixed(0) + " DAI"}
              </Typography>
            </div>
          ) : null}
          <div className={classes.overviewField}>
            
            <Typography variant={"h3"} className={classes.overviewTitle}>
            {pool.tokens[0].rewardsSymbol != "$"
                ? pool.tokens[0].rewardsSymbol +" Rewards"
                : ""}
            </Typography>
            <Typography variant={"h2"} className={classes.overviewValue}>
              {pool.tokens[0].rewardsAvailable
                ? pool.tokens[0].rewardsAvailable.toFixed(4)
                : "0.0000"}{" "}
            </Typography>
          </div>
        </div>
        {value === "options" && this.renderOptions()}
        {value === "stake" && this.renderStake()}
        {value === "claim" && this.renderClaim()}
        {value === "unstake" && this.renderUnstake()}
        {value === "exit" && this.renderExit()}

        {/* <div className ={classes.root}>
          <Typography variant={"h5"} className={classes.disclaimer}>
          {pool.tokens[0].id + " Pool Stats"}
          </Typography> */}

        {/* <div className={classes.overview}>
        
          <div className={classes.overviewField}>
            <Typography variant={"h3"} className={classes.overviewTitle}>
              {"Total " + pool.tokens[0].id + " Staked"}
            </Typography>
            <Typography variant={"h2"} className={classes.overviewValue}>
              { pool.tokens[0].isERC721 ? (pool.tokens[0].stats.nftsStaked ? pool.tokens[0].stats.nftsStaked : 0) : 
              (pool.tokens[0].stats.totalStaked ? pool.tokens[0].stats.totalStaked.toFixed(4) : "0.0000") 
              }
            </Typography>
          </div>
          {(pool.id == "ynft-eth" || pool.id == "ynft-dai")  ? (
            <div className={classes.overviewField}>
              <Typography variant={"h3"} className={classes.overviewTitle}>
               Total Cover Adjusted Value
              </Typography>
              <Typography variant={"h2"} className={classes.overviewValue}>
                {pool.id == "ynft-eth" ? pool.tokens[0].stats.adjCover.toFixed(2) + " ETH" : pool.tokens[0].stats.adjCover.toFixed(2) + " DAI"}
              </Typography>
            </div>
          ) : null}
          {(pool.id == "ynft-eth" || pool.id == "ynft-dai")  ? (
            <div className={classes.overviewField}>
              <Typography variant={"h3"} className={classes.overviewTitle}>
                Total Cover Book Value
              </Typography>
              <Typography variant={"h2"} className={classes.overviewValue}>
                {pool.id == "ynft-eth" ? pool.tokens[0].stats.totalCover.toFixed(2) + " ETH" : pool.tokens[0].stats.totalCover.toFixed(2) + " DAI"}
              </Typography>
            </div>
          ) : null}
        </div>
        </div> */}
        {snackbarMessage && this.renderSnackbar()}
        {loading && <Loader />}
      </div>
    );
  }

  renderOptions = () => {
    const { classes } = this.props;
    const { loading, pool, voteLockValid, balanceValid, voteLock } = this.state;

    return (
      <div className={classes.actions}>
        <Typography variant={"h3"} className={classes.title} noWrap>
          {pool.name}
        </Typography>
        <div className={classes.actionContainer}>
          <Button
            fullWidth
            className={classes.primaryButton}
            variant="outlined"
            color="primary"
            disabled={
              !pool.depositsEnabled ||
              (["FeeRewards"].includes(pool.id)
                ? loading || !voteLockValid || !balanceValid
                : loading)
            }
            onClick={() => {
              this.navigateInternal("stake");
            }}
          >
            <Typography className={classes.stakeButtonText} variant={"h4"}>
              Stake Tokens
            </Typography>
          </Button>
        </div>
        <div className={classes.actionContainer}>
          <Button
            fullWidth
            className={classes.actionButton}
            variant="outlined"
            color="primary"
            disabled={loading}
            onClick={() => {
              this.onClaim();
            }}
          >
            <Typography className={classes.buttonText} variant={"h4"}>
              Claim Rewards
            </Typography>
          </Button>
        </div>
        <div className={classes.actionContainer}>
          <Button
            fullWidth
            className={classes.actionButton}
            variant="outlined"
            color="primary"
            disabled={
              pool.id === "Governance" ? loading || voteLockValid : loading
            }
            onClick={() => {
              this.navigateInternal("unstake");
            }}
          >
            <Typography className={classes.buttonText} variant={"h4"}>
              Unstake Tokens
            </Typography>
          </Button>
        </div>
        <div className={classes.actionContainer}>
          <Button
            fullWidth
            className={classes.actionButton}
            variant="outlined"
            color="primary"
            disabled={
              pool.id === "Governance" ? loading || voteLockValid : loading
            }
            onClick={() => {
              this.onExit();
            }}
          >
            <Typography className={classes.buttonText} variant={"h4"}>
              Exit: Claim and Unstake
            </Typography>
          </Button>
        </div>
        {pool.id === "Governance" && voteLockValid && (
          <Typography variant={"h4"} className={classes.voteLockMessage}>
            Unstaking tokens only allowed once all your pending votes have
            closed at Block: {voteLock}
          </Typography>
        )}
      </div>
    );
  };

  navigateInternal = (val) => {
    this.setState({ value: val });
  };

  renderStake = () => {
    const { classes } = this.props;
    const { loading, pool } = this.state;

    const asset = pool.tokens[0];

    return (
      <div className={classes.actions}>
        <Typography className={classes.stakeTitle} variant={"h3"}>
          Stake your tokens
        </Typography>
        {this.renderAssetInput(asset, "stake")}
        <div className={classes.stakeButtons}>
          <Button
            className={classes.stakeButton}
            variant="outlined"
            color="secondary"
            disabled={loading}
            onClick={() => {
              this.navigateInternal("options");
            }}
          >
            <Typography variant={"h4"}>Back</Typography>
          </Button>
          <Button
            className={classes.stakeButton}
            variant="outlined"
            color="secondary"
            disabled={loading}
            onClick={() => {
              this.onStake();
            }}
          >
            <Typography variant={"h4"}>Stake</Typography>
          </Button>
        </div>
      </div>
    );
  };

  renderUnstake = () => {
    const { classes } = this.props;
    const { loading, pool, voteLockValid } = this.state;

    const asset = pool.tokens[0];
    return (
      <div className={classes.actions}>
        <Typography className={classes.stakeTitle} variant={"h3"}>
          Unstake your tokens
        </Typography>
        {this.renderAssetInput(asset, "unstake")}
        <div className={classes.stakeButtons}>
          <Button
            className={classes.stakeButton}
            variant="outlined"
            color="secondary"
            disabled={loading}
            onClick={() => {
              this.navigateInternal("options");
            }}
          >
            <Typography variant={"h4"}>Back</Typography>
          </Button>
          <Button
            className={classes.stakeButton}
            variant="outlined"
            color="secondary"
            disabled={
              pool.id === "Governance" ? loading || voteLockValid : loading
            }
            onClick={() => {
              this.onUnstake();
            }}
          >
            <Typography variant={"h4"}>Unstake</Typography>
          </Button>
        </div>
      </div>
    );
  };

  overlayClicked = () => {
    this.setState({ modalOpen: true });
  };

  closeModal = () => {
    this.setState({ modalOpen: false });
  };

  onStake = () => {
    this.setState({ amountError: false });
    const { pool } = this.state;
    const tokens = pool.tokens;
    const selectedToken = tokens[0];
    const tokenIds = this.state[selectedToken.id + "_stake"];
    if (tokenIds != undefined) {
      if (selectedToken.isERC721) {
        var tempIds = tokenIds.toString().replace(/(^,)|(,$)/g, "");
        var arrTokenIds = JSON.parse("[" + tempIds + "]");
        if (arrTokenIds.length > 0) {
          this.setState({ loading: true });
          dispatcher.dispatch({
            type: STAKE,
            content: { asset: selectedToken, tokenIds: arrTokenIds },
          });
        }
      } else {
        const amount = this.state[selectedToken.id + '_stake']
        this.setState({ loading: true })
        dispatcher.dispatch({ type: STAKE, content: { asset: selectedToken, tokenIds: amount } })
      }
      
    } else {
      return false;
    }
  };

  onClaim = () => {
    const { pool } = this.state;
    const tokens = pool.tokens;
    const selectedToken = tokens[0];

    this.setState({ loading: true });
    dispatcher.dispatch({
      type: GET_REWARDS,
      content: { asset: selectedToken },
    });
  };

  onUnstake = () => {
    this.setState({ amountError: false });
    const { pool } = this.state;
    const tokens = pool.tokens;
    const selectedToken = tokens[0];
    const tokenIds = this.state[selectedToken.id + "_unstake"];

    if (tokenIds != undefined) {
      if(selectedToken.isERC721) {
        var tempIds = tokenIds.toString().replace(/(^,)|(,$)/g, "");
        var arrTokenIds = JSON.parse("[" + tempIds + "]");
        if (arrTokenIds.length > 0) {
          this.setState({ loading: true });
          dispatcher.dispatch({
            type: WITHDRAW,
            content: { asset: selectedToken, tokenIds: arrTokenIds },
          });
        }
      } else {
        const amount = this.state[selectedToken.id + '_unstake']
        this.setState({ loading: true })
        dispatcher.dispatch({ type: WITHDRAW, content: { asset: selectedToken, tokenIds: amount } })
      }
      
    } else {
      return false;
    }
  };

  onExit = () => {
    const { pool } = this.state;
    const tokens = pool.tokens;
    const selectedToken = tokens[0];

    this.setState({ loading: true });
    dispatcher.dispatch({ type: EXIT, content: { asset: selectedToken } });
  };

  renderAssetInput = (asset, type) => {
    const { classes } = this.props;

    const { loading } = this.state;

    const amount = this.state[asset.id + "_" + type];
    const amountError = this.state[asset.id + "_" + type + "_error"];
    return (
      <div className={classes.valContainer} key={asset.id + "_" + type}>
        <div className={classes.balances}>
          {type === "stake" && (
            <Typography
              variant="h4"
              onClick={() => {
                this.setAmount(asset.id, type, (asset.isERC721 ? (asset ? asset.balance : []) : ((asset && asset.balance
                  ? (Math.floor(asset.balance*10000)/10000).toFixed(4) : '0.0000'))))
              }}
              className={classes.value}
              noWrap
            >
              {"Owned " +asset.symbol+": "+
                (asset.isERC721 ? (asset && asset.balance.toString()
                ? asset.balance.toString()
                : "None") : (asset && asset.balance
                  ? (Math.floor(asset.balance*10000)/10000).toFixed(4) : '0.0000'))}
            </Typography>
          )}
          {type === "unstake" && (
            <Typography
              variant="h4"
              onClick={() => {
                this.setAmount(asset.id, type, (asset.isERC721 ? (asset ? asset.stakedTokens : []) : ((asset && asset.stakedTokens
                  ? (Math.floor(asset.stakedTokens*10000)/10000).toFixed(4) : '0.0000'))))
              }}
              className={classes.value}
              noWrap
            >
              {"Staked " +asset.symbol+": "+
                (asset && asset.isERC721
                  ? asset.stakedTokens.toString()
                  : Math.floor(asset.stakedTokens*10000)/10000)}
            </Typography>
          )}
        </div>
        <div>
          <TextField
            fullWidth
            disabled={loading}
            className={classes.actionInput}
            id={"" + asset.id + "_" + type}
            value={amount}
            error={amountError}
            onChange={this.onChange}
            placeholder="0"
            variant="outlined"
            InputProps={{
              endAdornment: (
                <InputAdornment
                  position="end"
                  className={classes.inputAdornment}
                >
                  <Typography variant="h3" className={""}>
                    {asset.symbol}
                  </Typography>
                </InputAdornment>
              ),
              startAdornment: (
                <InputAdornment
                  position="end"
                  className={classes.inputAdornment}
                >
                  <div className={classes.assetIcon}>
                    <img
                      alt=""
                      src={require("../../assets/" +
                        asset.symbol +
                        "-logo.png")}
                      height="30px"
                    />
                  </div>
                </InputAdornment>
              ),
            }}
          />
        </div>
      </div>
    );
  };

  renderSnackbar = () => {
    var { snackbarType, snackbarMessage } = this.state;
    return (
      <Snackbar type={snackbarType} message={snackbarMessage} open={true} />
    );
  };

  onChange = (event) => {
    let val = [];
    val[event.target.id] = event.target.value;
    this.setState(val);
  };

  setAmount = (id, type, tokenIds) => {
    if ((tokenIds != undefined && tokenIds.length > 0) || Number((Math.floor((tokenIds === '' ? '0' : tokenIds)*10000)/10000).toFixed(4)) > 0) {
      let val = [];
      val[id + "_" + type] = tokenIds.toString();
      this.setState(val);
    }
  };
}

export default withRouter(withStyles(styles)(Stake));