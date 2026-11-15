// Generated from the Sourcify exact-match source for BasedLoansLendingLedger on Base mainnet. Do not edit.
export const ledgerAbi = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "_usdc",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_owner",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_operator",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_maxLendersPerFill",
        "type": "uint8",
        "internalType": "uint8"
      },
      {
        "name": "_minDeposit",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_minAssetCap",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_maxAssetCap",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "name": "BatchTooLarge",
    "type": "error",
    "inputs": []
  },
  {
    "name": "BelowMinDeposit",
    "type": "error",
    "inputs": [
      {
        "name": "provided",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "minimum",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "name": "CapAboveMaximum",
    "type": "error",
    "inputs": [
      {
        "name": "provided",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "maximum",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "name": "CapBelowMinimum",
    "type": "error",
    "inputs": [
      {
        "name": "provided",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "minimum",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "name": "CapBelowUtilized",
    "type": "error",
    "inputs": [
      {
        "name": "provided",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "utilized",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "name": "CoreAlreadyAuthorized",
    "type": "error",
    "inputs": []
  },
  {
    "name": "CoreNotAuthorized",
    "type": "error",
    "inputs": []
  },
  {
    "name": "InsufficientUnlockedBalance",
    "type": "error",
    "inputs": []
  },
  {
    "name": "InvalidCapBounds",
    "type": "error",
    "inputs": []
  },
  {
    "name": "InvalidInput",
    "type": "error",
    "inputs": []
  },
  {
    "name": "InvalidLoanAccounting",
    "type": "error",
    "inputs": []
  },
  {
    "name": "InvalidMaxLenders",
    "type": "error",
    "inputs": []
  },
  {
    "name": "NoPendingPayment",
    "type": "error",
    "inputs": []
  },
  {
    "name": "NoProceeds",
    "type": "error",
    "inputs": []
  },
  {
    "name": "NotOperatorOrOwner",
    "type": "error",
    "inputs": []
  },
  {
    "name": "NothingToSettle",
    "type": "error",
    "inputs": []
  },
  {
    "name": "NothingToWriteOff",
    "type": "error",
    "inputs": []
  },
  {
    "name": "OwnableInvalidOwner",
    "type": "error",
    "inputs": [
      {
        "name": "owner",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "name": "OwnableUnauthorizedAccount",
    "type": "error",
    "inputs": [
      {
        "name": "account",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "name": "SafeERC20FailedOperation",
    "type": "error",
    "inputs": [
      {
        "name": "token",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "name": "SettlementTooSmall",
    "type": "error",
    "inputs": []
  },
  {
    "name": "ShareAccountingInvariantBroken",
    "type": "error",
    "inputs": []
  },
  {
    "name": "TooManyConfiguredAssets",
    "type": "error",
    "inputs": []
  },
  {
    "name": "Unauthorized",
    "type": "error",
    "inputs": []
  },
  {
    "name": "VaultDepositFailed",
    "type": "error",
    "inputs": []
  },
  {
    "name": "VaultMaxWithdrawExceeded",
    "type": "error",
    "inputs": []
  },
  {
    "name": "VaultNotSet",
    "type": "error",
    "inputs": []
  },
  {
    "name": "ZeroAddress",
    "type": "error",
    "inputs": []
  },
  {
    "name": "AssetCapBoundsUpdated",
    "type": "event",
    "inputs": [
      {
        "name": "newMin",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "newMax",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "name": "AutoRedeployUpdated",
    "type": "event",
    "inputs": [
      {
        "name": "lender",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "enabled",
        "type": "bool",
        "indexed": false,
        "internalType": "bool"
      }
    ],
    "anonymous": false
  },
  {
    "name": "CapUpdated",
    "type": "event",
    "inputs": [
      {
        "name": "lender",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "asset",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "newCap",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "name": "CoreAuthorized",
    "type": "event",
    "inputs": [
      {
        "name": "core",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "name": "CorePaused",
    "type": "event",
    "inputs": [
      {
        "name": "core",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "by",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "name": "CoreRemoved",
    "type": "event",
    "inputs": [
      {
        "name": "core",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "name": "CoreUnpaused",
    "type": "event",
    "inputs": [
      {
        "name": "core",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "name": "Deposit",
    "type": "event",
    "inputs": [
      {
        "name": "lender",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "amount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "name": "Enqueued",
    "type": "event",
    "inputs": [
      {
        "name": "lender",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "asset",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "name": "LiquidityLocked",
    "type": "event",
    "inputs": [
      {
        "name": "lender",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "asset",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "amount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "name": "LiquidityReleased",
    "type": "event",
    "inputs": [
      {
        "name": "lender",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "asset",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "amount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "name": "LoanDisbursed",
    "type": "event",
    "inputs": [
      {
        "name": "to",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "amount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "name": "LoanProceedsClaimed",
    "type": "event",
    "inputs": [
      {
        "name": "loanId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "lender",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "amount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "name": "LoanProceedsCredited",
    "type": "event",
    "inputs": [
      {
        "name": "loanId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "lender",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "amount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "name": "LoanProceedsRedeployed",
    "type": "event",
    "inputs": [
      {
        "name": "loanId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "lender",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "amount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "name": "MaxLendersPerFillUpdated",
    "type": "event",
    "inputs": [
      {
        "name": "oldValue",
        "type": "uint8",
        "indexed": false,
        "internalType": "uint8"
      },
      {
        "name": "newValue",
        "type": "uint8",
        "indexed": false,
        "internalType": "uint8"
      }
    ],
    "anonymous": false
  },
  {
    "name": "MinDepositUpdated",
    "type": "event",
    "inputs": [
      {
        "name": "oldValue",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "newValue",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "name": "OperatorUpdated",
    "type": "event",
    "inputs": [
      {
        "name": "oldOperator",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      },
      {
        "name": "newOperator",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "name": "OwnershipTransferred",
    "type": "event",
    "inputs": [
      {
        "name": "previousOwner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "newOwner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "name": "PartialRedeploy",
    "type": "event",
    "inputs": [
      {
        "name": "lender",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "redeployed",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "withdrawn",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "name": "PositionWrittenOff",
    "type": "event",
    "inputs": [
      {
        "name": "lender",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "asset",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "shares",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "usdcRelease",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "name": "VaultUpdated",
    "type": "event",
    "inputs": [
      {
        "name": "oldVault",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      },
      {
        "name": "newVault",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "name": "WithdrawPreferenceUpdated",
    "type": "event",
    "inputs": [
      {
        "name": "lender",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "preferMusdc",
        "type": "bool",
        "indexed": false,
        "internalType": "bool"
      }
    ],
    "anonymous": false
  },
  {
    "name": "Withdrawal",
    "type": "event",
    "inputs": [
      {
        "name": "lender",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "amount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "name": "WithdrawalAsMusdc",
    "type": "event",
    "inputs": [
      {
        "name": "lender",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "usdcAmount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "sharesTransferred",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "name": "MAX_BATCH_SIZE",
    "type": "function",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint8",
        "internalType": "uint8"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "MAX_CONFIGURED_ASSETS",
    "type": "function",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint8",
        "internalType": "uint8"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "MAX_LENDERS_PER_FILL",
    "type": "function",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint8",
        "internalType": "uint8"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "MUSDC_SEED_AMOUNT",
    "type": "function",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "USDC",
    "type": "function",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "contract IERC20"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "addAuthorizedCore",
    "type": "function",
    "inputs": [
      {
        "name": "core",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "authorizedCores",
    "type": "function",
    "inputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "autoRedeployEnabled",
    "type": "function",
    "inputs": [
      {
        "name": "lender",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "claimLoanProceeds",
    "type": "function",
    "inputs": [
      {
        "name": "core",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "loanIds",
        "type": "uint256[]",
        "internalType": "uint256[]"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "deposit",
    "type": "function",
    "inputs": [
      {
        "name": "amount",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "depositAndSetCaps",
    "type": "function",
    "inputs": [
      {
        "name": "amount",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "assets",
        "type": "address[]",
        "internalType": "address[]"
      },
      {
        "name": "newCaps",
        "type": "uint256[]",
        "internalType": "uint256[]"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "disburseLoan",
    "type": "function",
    "inputs": [
      {
        "name": "to",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "amount",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "getAccount",
    "type": "function",
    "inputs": [
      {
        "name": "lender",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "deposited",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "locked",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "idle",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "getAssetCap",
    "type": "function",
    "inputs": [
      {
        "name": "lender",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "asset",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "maxCap",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "utilized",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "remaining",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "getLenderAssets",
    "type": "function",
    "inputs": [
      {
        "name": "lender",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "address[]",
        "internalType": "address[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "getLenderSummary",
    "type": "function",
    "inputs": [
      {
        "name": "lender",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "deposited",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "locked",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "idle",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "assets",
        "type": "address[]",
        "internalType": "address[]"
      },
      {
        "name": "maxCaps",
        "type": "uint256[]",
        "internalType": "uint256[]"
      },
      {
        "name": "utilized",
        "type": "uint256[]",
        "internalType": "uint256[]"
      },
      {
        "name": "queued",
        "type": "bool[]",
        "internalType": "bool[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "getLoanProceedsUsdc",
    "type": "function",
    "inputs": [
      {
        "name": "core",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "loanId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "lender",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "getMatchableLiquidity",
    "type": "function",
    "inputs": [
      {
        "name": "asset",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "minFillPerLender",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "matchable",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "lenderCount",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "getMatchableLiquidityBatch",
    "type": "function",
    "inputs": [
      {
        "name": "assets",
        "type": "address[]",
        "internalType": "address[]"
      },
      {
        "name": "minFillPerLender",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "matchable",
        "type": "uint256[]",
        "internalType": "uint256[]"
      },
      {
        "name": "lenderCounts",
        "type": "uint256[]",
        "internalType": "uint256[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "getProtocolStats",
    "type": "function",
    "inputs": [],
    "outputs": [
      {
        "name": "deposited",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "locked",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "idle",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "getQueue",
    "type": "function",
    "inputs": [
      {
        "name": "asset",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "head",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "tail",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "getQueueDepth",
    "type": "function",
    "inputs": [
      {
        "name": "asset",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "depth",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "isLenderQueued",
    "type": "function",
    "inputs": [
      {
        "name": "asset",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "lender",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "isQueued",
    "type": "function",
    "inputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "loanProceeds",
    "type": "function",
    "inputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "maxAssetCap",
    "type": "function",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "maxLendersPerFill",
    "type": "function",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint8",
        "internalType": "uint8"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "minAssetCap",
    "type": "function",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "minDeposit",
    "type": "function",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "nextInLine",
    "type": "function",
    "inputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "operator",
    "type": "function",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "owner",
    "type": "function",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "pauseCore",
    "type": "function",
    "inputs": [
      {
        "name": "core",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "pausedCores",
    "type": "function",
    "inputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "prefersMusdc",
    "type": "function",
    "inputs": [
      {
        "name": "lender",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "pullBuybackPayment",
    "type": "function",
    "inputs": [
      {
        "name": "from",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "amount",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "loanId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "redeployLoanProceeds",
    "type": "function",
    "inputs": [
      {
        "name": "core",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "loanIds",
        "type": "uint256[]",
        "internalType": "uint256[]"
      },
      {
        "name": "amount",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "redeployLoanProceeds",
    "type": "function",
    "inputs": [
      {
        "name": "core",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "loanIds",
        "type": "uint256[]",
        "internalType": "uint256[]"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "removeAuthorizedCore",
    "type": "function",
    "inputs": [
      {
        "name": "core",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "renounceOwnership",
    "type": "function",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "requestLiquidity",
    "type": "function",
    "inputs": [
      {
        "name": "asset",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "needed",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "maxLenders",
        "type": "uint8",
        "internalType": "uint8"
      },
      {
        "name": "minFillPerLender",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "loanId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "totalFound",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "lenders",
        "type": "address[]",
        "internalType": "address[]"
      },
      {
        "name": "amounts",
        "type": "uint256[]",
        "internalType": "uint256[]"
      },
      {
        "name": "foundCount",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "name": "setAssetCapBounds",
    "type": "function",
    "inputs": [
      {
        "name": "_newMin",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_newMax",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "setAutoRedeploy",
    "type": "function",
    "inputs": [
      {
        "name": "enabled",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "setMaxLendersPerFill",
    "type": "function",
    "inputs": [
      {
        "name": "_newMax",
        "type": "uint8",
        "internalType": "uint8"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "setMinDeposit",
    "type": "function",
    "inputs": [
      {
        "name": "_newMin",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "setOperator",
    "type": "function",
    "inputs": [
      {
        "name": "_operator",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "setVault",
    "type": "function",
    "inputs": [
      {
        "name": "_vault",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "setWithdrawPreference",
    "type": "function",
    "inputs": [
      {
        "name": "preferMusdc",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "settleBuybackForLender",
    "type": "function",
    "inputs": [
      {
        "name": "loanId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "lender",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "asset",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "principal",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "totalPayment",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "originalFunded",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "totalDeposited",
    "type": "function",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "totalLocked",
    "type": "function",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "totalUtilizedUsdc",
    "type": "function",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "transferOwnership",
    "type": "function",
    "inputs": [
      {
        "name": "newOwner",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "unpauseCore",
    "type": "function",
    "inputs": [
      {
        "name": "core",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "updateCap",
    "type": "function",
    "inputs": [
      {
        "name": "assets",
        "type": "address[]",
        "internalType": "address[]"
      },
      {
        "name": "newCaps",
        "type": "uint256[]",
        "internalType": "uint256[]"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "vault",
    "type": "function",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "withdraw",
    "type": "function",
    "inputs": [
      {
        "name": "amount",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "withdrawAsMusdc",
    "type": "function",
    "inputs": [
      {
        "name": "amount",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "writeOffPosition",
    "type": "function",
    "inputs": [
      {
        "name": "loanId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "lender",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "asset",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  }
] as const
