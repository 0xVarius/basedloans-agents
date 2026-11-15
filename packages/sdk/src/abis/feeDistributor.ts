// Generated from the Sourcify exact-match source for BasedLoansFeeDistributor on Base mainnet. Do not edit.
export const feeDistributorAbi = [
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
        "name": "_tierBps",
        "type": "uint16[3]",
        "internalType": "uint16[3]"
      },
      {
        "name": "_tier1Recips",
        "type": "tuple[]",
        "components": [
          {
            "name": "recipient",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "weightBps",
            "type": "uint16",
            "internalType": "uint16"
          }
        ],
        "internalType": "struct BasedLoansFeeDistributor.Tier1Recipient[]"
      },
      {
        "name": "_tier2Recipient",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "name": "FeeTooHigh",
    "type": "error",
    "inputs": []
  },
  {
    "name": "InvalidBpsSum",
    "type": "error",
    "inputs": []
  },
  {
    "name": "InvalidRecipientCount",
    "type": "error",
    "inputs": []
  },
  {
    "name": "NotOperatorOrOwner",
    "type": "error",
    "inputs": []
  },
  {
    "name": "NothingToClaim",
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
    "name": "Unauthorized",
    "type": "error",
    "inputs": []
  },
  {
    "name": "ZeroAddress",
    "type": "error",
    "inputs": []
  },
  {
    "name": "Claimed",
    "type": "event",
    "inputs": [
      {
        "name": "recipient",
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
    "name": "CoreAuthorized",
    "type": "event",
    "inputs": [
      {
        "name": "oldCore",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "newCore",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "name": "FeeDistributed",
    "type": "event",
    "inputs": [
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
      },
      {
        "name": "tier1Amount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "tier2Amount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "tier3Amount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "name": "GlobalFeeUpdated",
    "type": "event",
    "inputs": [
      {
        "name": "oldFee",
        "type": "uint16",
        "indexed": false,
        "internalType": "uint16"
      },
      {
        "name": "newFee",
        "type": "uint16",
        "indexed": false,
        "internalType": "uint16"
      }
    ],
    "anonymous": false
  },
  {
    "name": "GrowthSubsUpdated",
    "type": "event",
    "inputs": [
      {
        "name": "asset",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "subs",
        "type": "tuple[]",
        "indexed": false,
        "components": [
          {
            "name": "recipient",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "bps",
            "type": "uint16",
            "internalType": "uint16"
          },
          {
            "name": "endTimestamp",
            "type": "uint64",
            "internalType": "uint64"
          }
        ],
        "internalType": "struct BasedLoansFeeDistributor.GrowthSub[]"
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
    "name": "Tier1RecipientsUpdated",
    "type": "event",
    "inputs": [
      {
        "name": "recipients",
        "type": "tuple[]",
        "indexed": false,
        "components": [
          {
            "name": "recipient",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "weightBps",
            "type": "uint16",
            "internalType": "uint16"
          }
        ],
        "internalType": "struct BasedLoansFeeDistributor.Tier1Recipient[]"
      }
    ],
    "anonymous": false
  },
  {
    "name": "TierConfigUpdated",
    "type": "event",
    "inputs": [
      {
        "name": "bps",
        "type": "uint16[3]",
        "indexed": false,
        "internalType": "uint16[3]"
      },
      {
        "name": "tier2Recipient",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      }
    ],
    "anonymous": false
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
    "name": "authorizedCore",
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
    "name": "claim",
    "type": "function",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "distributeFees",
    "type": "function",
    "inputs": [
      {
        "name": "asset",
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
    "name": "getGlobalFee",
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
    "name": "getGrowthSubs",
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
        "name": "",
        "type": "tuple[]",
        "components": [
          {
            "name": "recipient",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "bps",
            "type": "uint16",
            "internalType": "uint16"
          },
          {
            "name": "endTimestamp",
            "type": "uint64",
            "internalType": "uint64"
          }
        ],
        "internalType": "struct BasedLoansFeeDistributor.GrowthSub[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "getTier1Recipients",
    "type": "function",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "tuple[]",
        "components": [
          {
            "name": "recipient",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "weightBps",
            "type": "uint16",
            "internalType": "uint16"
          }
        ],
        "internalType": "struct BasedLoansFeeDistributor.Tier1Recipient[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "globalFeeBps",
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
    "name": "renounceOwnership",
    "type": "function",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "setCore",
    "type": "function",
    "inputs": [
      {
        "name": "_newCore",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "setGlobalFee",
    "type": "function",
    "inputs": [
      {
        "name": "_newFee",
        "type": "uint16",
        "internalType": "uint16"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "setGrowthSubs",
    "type": "function",
    "inputs": [
      {
        "name": "asset",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "subs",
        "type": "tuple[]",
        "components": [
          {
            "name": "recipient",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "bps",
            "type": "uint16",
            "internalType": "uint16"
          },
          {
            "name": "endTimestamp",
            "type": "uint64",
            "internalType": "uint64"
          }
        ],
        "internalType": "struct BasedLoansFeeDistributor.GrowthSub[]"
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
    "name": "setTier1Recipients",
    "type": "function",
    "inputs": [
      {
        "name": "recipients",
        "type": "tuple[]",
        "components": [
          {
            "name": "recipient",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "weightBps",
            "type": "uint16",
            "internalType": "uint16"
          }
        ],
        "internalType": "struct BasedLoansFeeDistributor.Tier1Recipient[]"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "setTierConfig",
    "type": "function",
    "inputs": [
      {
        "name": "bps",
        "type": "uint16[3]",
        "internalType": "uint16[3]"
      },
      {
        "name": "_tier2Addr",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "tier1Bps",
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
    "name": "tier2Bps",
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
    "name": "tier2Recipient",
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
    "name": "tier3Bps",
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
    "name": "totalFeesCollected",
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
    "name": "unclaimedBalances",
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
  }
] as const
