// Generated from the Sourcify exact-match source for BasedLoansOracleManager on Base mainnet. Do not edit.
export const oracleManagerAbi = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "_owner",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_operator",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "name": "InvalidAdapter",
    "type": "error",
    "inputs": [
      {
        "name": "adapter",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "name": "InvalidStalenessParams",
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
    "name": "WethPriceUnavailable",
    "type": "error",
    "inputs": []
  },
  {
    "name": "ZeroAddress",
    "type": "error",
    "inputs": []
  },
  {
    "name": "AdapterApproved",
    "type": "event",
    "inputs": [
      {
        "name": "adapter",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "approved",
        "type": "bool",
        "indexed": false,
        "internalType": "bool"
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
    "name": "StalenessParamsUpdated",
    "type": "event",
    "inputs": [
      {
        "name": "maxPythAge",
        "type": "uint32",
        "indexed": false,
        "internalType": "uint32"
      },
      {
        "name": "minTwapWindow",
        "type": "uint32",
        "indexed": false,
        "internalType": "uint32"
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
    "name": "PRICE_SCALE",
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
    "name": "approveAdapter",
    "type": "function",
    "inputs": [
      {
        "name": "adapter",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "status",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "approvedAdapters",
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
    "name": "getPriceReport",
    "type": "function",
    "inputs": [
      {
        "name": "sources",
        "type": "tuple[]",
        "components": [
          {
            "name": "adapter",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "data",
            "type": "bytes",
            "internalType": "bytes"
          },
          {
            "name": "sourceType",
            "type": "uint8",
            "internalType": "enum SourceType"
          }
        ],
        "internalType": "struct OraclePath[]"
      },
      {
        "name": "wethSources",
        "type": "tuple[]",
        "components": [
          {
            "name": "adapter",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "data",
            "type": "bytes",
            "internalType": "bytes"
          },
          {
            "name": "sourceType",
            "type": "uint8",
            "internalType": "enum SourceType"
          }
        ],
        "internalType": "struct OraclePath[]"
      }
    ],
    "outputs": [
      {
        "name": "minPriceUsdc18",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "maxPriceUsdc18",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "maxDeviationBps",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "validCount",
        "type": "uint8",
        "internalType": "uint8"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "getRawPrice",
    "type": "function",
    "inputs": [
      {
        "name": "adapter",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "data",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "outputs": [
      {
        "name": "price",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "maxPythAge",
    "type": "function",
    "inputs": [],
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
    "name": "minTwapWindow",
    "type": "function",
    "inputs": [],
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
    "name": "setStalenessParams",
    "type": "function",
    "inputs": [
      {
        "name": "_maxPythAge",
        "type": "uint32",
        "internalType": "uint32"
      },
      {
        "name": "_minTwapWindow",
        "type": "uint32",
        "internalType": "uint32"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "toUsdc6",
    "type": "function",
    "inputs": [
      {
        "name": "priceUsdc18",
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
    "stateMutability": "pure"
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
