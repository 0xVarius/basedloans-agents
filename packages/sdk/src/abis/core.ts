// Generated from the Sourcify exact-match source for BasedLoansCore on Base mainnet. Do not edit.
export const coreAbi = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "_usdc",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_assetManager",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_oracleManager",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_ledger",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_feeDistributor",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_pyth",
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
        "name": "_termDurations",
        "type": "uint32[3]",
        "internalType": "uint32[3]"
      },
      {
        "name": "_termPremiumsBps",
        "type": "uint16[3]",
        "internalType": "uint16[3]"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "name": "AssetNotActive",
    "type": "error",
    "inputs": []
  },
  {
    "name": "BelowMinBuyback",
    "type": "error",
    "inputs": [
      {
        "name": "amount",
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
    "name": "BuybackExceedsRemaining",
    "type": "error",
    "inputs": [
      {
        "name": "amount",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "remaining",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "name": "EthRefundFailed",
    "type": "error",
    "inputs": []
  },
  {
    "name": "ExcessivePriceDeviation",
    "type": "error",
    "inputs": [
      {
        "name": "actual",
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
    "name": "ExposureCapExceeded",
    "type": "error",
    "inputs": [
      {
        "name": "asset",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "current",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "cap",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "name": "InsufficientOracleSources",
    "type": "error",
    "inputs": [
      {
        "name": "valid",
        "type": "uint8",
        "internalType": "uint8"
      },
      {
        "name": "required",
        "type": "uint8",
        "internalType": "uint8"
      }
    ]
  },
  {
    "name": "InvalidClaimBatch",
    "type": "error",
    "inputs": []
  },
  {
    "name": "InvalidContract",
    "type": "error",
    "inputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "name": "InvalidTermConfig",
    "type": "error",
    "inputs": []
  },
  {
    "name": "InvalidTermIndex",
    "type": "error",
    "inputs": []
  },
  {
    "name": "LoanExpired",
    "type": "error",
    "inputs": []
  },
  {
    "name": "LoanInactive",
    "type": "error",
    "inputs": []
  },
  {
    "name": "LoanTooSmall",
    "type": "error",
    "inputs": [
      {
        "name": "amount",
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
    "name": "NotBorrower",
    "type": "error",
    "inputs": []
  },
  {
    "name": "NotOperatorOrOwner",
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
    "name": "Paused",
    "type": "error",
    "inputs": []
  },
  {
    "name": "PythFeeTooLow",
    "type": "error",
    "inputs": [
      {
        "name": "provided",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "required",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "name": "ReentrancyGuardReentrantCall",
    "type": "error",
    "inputs": []
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
    "name": "ShortfallTooLarge",
    "type": "error",
    "inputs": [
      {
        "name": "funded",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "requested",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "maxShortfallBps",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "name": "ShortfallTooLoose",
    "type": "error",
    "inputs": [
      {
        "name": "borrowerBps",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "globalMaxBps",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "name": "ZeroAddress",
    "type": "error",
    "inputs": []
  },
  {
    "name": "ZeroAmount",
    "type": "error",
    "inputs": []
  },
  {
    "name": "BuybackMade",
    "type": "event",
    "inputs": [
      {
        "name": "loanId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "borrower",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "payment",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "collateralReturned",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "buybackRemaining",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "name": "CollateralClaimed",
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
        "name": "collateralAmount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "name": "ContractsUpdated",
    "type": "event",
    "inputs": [
      {
        "name": "assetManager",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      },
      {
        "name": "oracleManager",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      },
      {
        "name": "ledger",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      },
      {
        "name": "feeDistributor",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      },
      {
        "name": "pyth",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "name": "LoanFullyRepaid",
    "type": "event",
    "inputs": [
      {
        "name": "loanId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "borrower",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "name": "LoanOpened",
    "type": "event",
    "inputs": [
      {
        "name": "core",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "loanId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "borrower",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "asset",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      },
      {
        "name": "collateralAmount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "totalFunded",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "netDisbursed",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "buybackPrice",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "createdAt",
        "type": "uint32",
        "indexed": false,
        "internalType": "uint32"
      },
      {
        "name": "expiryTimestamp",
        "type": "uint32",
        "indexed": false,
        "internalType": "uint32"
      }
    ],
    "anonymous": false
  },
  {
    "name": "LoanSettled",
    "type": "event",
    "inputs": [
      {
        "name": "loanId",
        "type": "uint256",
        "indexed": true,
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
    "name": "PausedStateChanged",
    "type": "event",
    "inputs": [
      {
        "name": "paused",
        "type": "bool",
        "indexed": false,
        "internalType": "bool"
      }
    ],
    "anonymous": false
  },
  {
    "name": "TermsUpdated",
    "type": "event",
    "inputs": [
      {
        "name": "durations",
        "type": "uint32[3]",
        "indexed": false,
        "internalType": "uint32[3]"
      },
      {
        "name": "premiumsBps",
        "type": "uint16[3]",
        "indexed": false,
        "internalType": "uint16[3]"
      }
    ],
    "anonymous": false
  },
  {
    "name": "BPS_DENOMINATOR",
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
    "name": "MAX_CLAIM_BATCH",
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
    "name": "MAX_SHORTFALL_CEILING",
    "type": "function",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint16",
        "internalType": "uint16"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "MIN_BUYBACK_USDC",
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
    "name": "MIN_LOAN_USDC",
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
    "name": "TERM_COUNT",
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
    "name": "USE_GLOBAL_SHORTFALL",
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
    "name": "assetExposure",
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
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "assetManager",
    "type": "function",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "contract IAssetManager"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "buyback",
    "type": "function",
    "inputs": [
      {
        "name": "loanId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "payment",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "claimCollateral",
    "type": "function",
    "inputs": [
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
    "name": "collateralClaimed",
    "type": "function",
    "inputs": [
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
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "defaultCollateralBase",
    "type": "function",
    "inputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
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
    "name": "feeDistributor",
    "type": "function",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "contract IFeeDistributor"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "getBorrowerLoans",
    "type": "function",
    "inputs": [
      {
        "name": "borrower",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256[]",
        "internalType": "uint256[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "getClaimableCollateral",
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
    "name": "getExposureRemaining",
    "type": "function",
    "inputs": [
      {
        "name": "loanId",
        "type": "uint256",
        "internalType": "uint256"
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
    "name": "getLoan",
    "type": "function",
    "inputs": [
      {
        "name": "loanId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "borrower",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "asset",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "collateralAmount",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "collateralRemaining",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "totalFunded",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "buybackPrice",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "buybackRemaining",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "createdAt",
        "type": "uint32",
        "internalType": "uint32"
      },
      {
        "name": "expiryTimestamp",
        "type": "uint32",
        "internalType": "uint32"
      },
      {
        "name": "active",
        "type": "bool",
        "internalType": "bool"
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
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "getLoanCollateralValue",
    "type": "function",
    "inputs": [
      {
        "name": "loanId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "collateralValueUsdc6",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "getLoanLedger",
    "type": "function",
    "inputs": [
      {
        "name": "loanId",
        "type": "uint256",
        "internalType": "uint256"
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
    "name": "getTermConfig",
    "type": "function",
    "inputs": [],
    "outputs": [
      {
        "name": "durations",
        "type": "uint32[3]",
        "internalType": "uint32[3]"
      },
      {
        "name": "premiumsBps",
        "type": "uint16[3]",
        "internalType": "uint16[3]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "ledger",
    "type": "function",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "contract ILendingLedger"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "loanSettled",
    "type": "function",
    "inputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
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
    "name": "maxShortfallBps",
    "type": "function",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint16",
        "internalType": "uint16"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "nextLoanId",
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
    "name": "openLoan",
    "type": "function",
    "inputs": [
      {
        "name": "asset",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "collateralAmount",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "requestedGrossUsdc",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "termIndex",
        "type": "uint8",
        "internalType": "uint8"
      },
      {
        "name": "borrowerMaxShortfallBps",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "pythUpdateData",
        "type": "bytes[]",
        "internalType": "bytes[]"
      }
    ],
    "outputs": [
      {
        "name": "loanId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "payable"
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
    "name": "oracleManager",
    "type": "function",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "contract IOracleManager"
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
    "name": "paused",
    "type": "function",
    "inputs": [],
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
    "name": "pyth",
    "type": "function",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "contract IPyth"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "renounceOwnership",
    "type": "function",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "setContracts",
    "type": "function",
    "inputs": [
      {
        "name": "_assetManager",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_oracleManager",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_ledger",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_feeDistributor",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_pyth",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "setMaxShortfall",
    "type": "function",
    "inputs": [
      {
        "name": "_maxShortfallBps",
        "type": "uint16",
        "internalType": "uint16"
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
    "name": "setPaused",
    "type": "function",
    "inputs": [
      {
        "name": "_paused",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "setTerms",
    "type": "function",
    "inputs": [
      {
        "name": "_termDurations",
        "type": "uint32[3]",
        "internalType": "uint32[3]"
      },
      {
        "name": "_termPremiumsBps",
        "type": "uint16[3]",
        "internalType": "uint16[3]"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "termDurations",
    "type": "function",
    "inputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint32",
        "internalType": "uint32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "termPremiumsBps",
    "type": "function",
    "inputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint16",
        "internalType": "uint16"
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
  }
] as const
