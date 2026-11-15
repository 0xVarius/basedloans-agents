// Generated from the Sourcify exact-match source for BasedLoansAssetManager on Base mainnet. Do not edit.
export const assetManagerAbi = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "initialOwner",
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
    "name": "AssetInactive",
    "type": "error",
    "inputs": [
      {
        "name": "asset",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "name": "AssetNotConfigured",
    "type": "error",
    "inputs": [
      {
        "name": "asset",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "name": "DuplicateSource",
    "type": "error",
    "inputs": [
      {
        "name": "firstIndex",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "secondIndex",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "name": "InvalidContract",
    "type": "error",
    "inputs": [
      {
        "name": "target",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "name": "InvalidDeviationBps",
    "type": "error",
    "inputs": [
      {
        "name": "provided",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "maxAllowed",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "name": "InvalidLtv",
    "type": "error",
    "inputs": [
      {
        "name": "provided",
        "type": "uint16",
        "internalType": "uint16"
      },
      {
        "name": "minAllowed",
        "type": "uint16",
        "internalType": "uint16"
      },
      {
        "name": "maxAllowed",
        "type": "uint16",
        "internalType": "uint16"
      }
    ]
  },
  {
    "name": "InvalidMinSources",
    "type": "error",
    "inputs": [
      {
        "name": "provided",
        "type": "uint8",
        "internalType": "uint8"
      },
      {
        "name": "minAllowed",
        "type": "uint8",
        "internalType": "uint8"
      },
      {
        "name": "maxAllowed",
        "type": "uint8",
        "internalType": "uint8"
      }
    ]
  },
  {
    "name": "InvalidSource",
    "type": "error",
    "inputs": [
      {
        "name": "index",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "name": "InvalidWethSourceType",
    "type": "error",
    "inputs": [
      {
        "name": "index",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "name": "NoSourcesConfigured",
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
    "name": "SourceIndexOutOfBounds",
    "type": "error",
    "inputs": [
      {
        "name": "index",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "length",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "name": "TooManySources",
    "type": "error",
    "inputs": [
      {
        "name": "provided",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "maxAllowed",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "name": "WethSourcesRequired",
    "type": "error",
    "inputs": []
  },
  {
    "name": "ZeroAddress",
    "type": "error",
    "inputs": []
  },
  {
    "name": "AssetConfigured",
    "type": "event",
    "inputs": [
      {
        "name": "asset",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "sourceCount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "wethSourceCount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "maxDeviationBps",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "maxLtvBps",
        "type": "uint16",
        "indexed": false,
        "internalType": "uint16"
      },
      {
        "name": "minSources",
        "type": "uint8",
        "indexed": false,
        "internalType": "uint8"
      },
      {
        "name": "active",
        "type": "bool",
        "indexed": false,
        "internalType": "bool"
      }
    ],
    "anonymous": false
  },
  {
    "name": "AssetExposureUpdated",
    "type": "event",
    "inputs": [
      {
        "name": "asset",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "maxExposureUsdc",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "name": "AssetLtvUpdated",
    "type": "event",
    "inputs": [
      {
        "name": "asset",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "maxLtvBps",
        "type": "uint16",
        "indexed": false,
        "internalType": "uint16"
      }
    ],
    "anonymous": false
  },
  {
    "name": "AssetRemoved",
    "type": "event",
    "inputs": [
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
    "name": "AssetRiskParamsUpdated",
    "type": "event",
    "inputs": [
      {
        "name": "asset",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "maxDeviationBps",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "maxLtvBps",
        "type": "uint16",
        "indexed": false,
        "internalType": "uint16"
      },
      {
        "name": "minSources",
        "type": "uint8",
        "indexed": false,
        "internalType": "uint8"
      }
    ],
    "anonymous": false
  },
  {
    "name": "AssetSourcesUpdated",
    "type": "event",
    "inputs": [
      {
        "name": "asset",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "sourceCount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "name": "AssetStatusUpdated",
    "type": "event",
    "inputs": [
      {
        "name": "asset",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "active",
        "type": "bool",
        "indexed": false,
        "internalType": "bool"
      }
    ],
    "anonymous": false
  },
  {
    "name": "AssetWethSourcesUpdated",
    "type": "event",
    "inputs": [
      {
        "name": "asset",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "wethSourceCount",
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
    "name": "MAX_DEVIATION_BPS_CAP",
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
    "name": "MAX_LTV_CEILING",
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
    "name": "MAX_SOURCES_CAP",
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
    "name": "MIN_LTV_FLOOR",
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
    "name": "MIN_SOURCES_FLOOR",
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
    "name": "getActiveAssetConfig",
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
        "name": "cfg",
        "type": "tuple",
        "components": [
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
          },
          {
            "name": "maxDeviationBps",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "maxLtvBps",
            "type": "uint16",
            "internalType": "uint16"
          },
          {
            "name": "minSources",
            "type": "uint8",
            "internalType": "uint8"
          },
          {
            "name": "isActive",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "maxExposureUsdc",
            "type": "uint256",
            "internalType": "uint256"
          }
        ],
        "internalType": "struct BasedLoansAssetManager.AssetConfig"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "getAssetConfig",
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
        "name": "cfg",
        "type": "tuple",
        "components": [
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
          },
          {
            "name": "maxDeviationBps",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "maxLtvBps",
            "type": "uint16",
            "internalType": "uint16"
          },
          {
            "name": "minSources",
            "type": "uint8",
            "internalType": "uint8"
          },
          {
            "name": "isActive",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "maxExposureUsdc",
            "type": "uint256",
            "internalType": "uint256"
          }
        ],
        "internalType": "struct BasedLoansAssetManager.AssetConfig"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "getOracleParams",
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
      },
      {
        "name": "maxDeviationBps",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "maxLtvBps",
        "type": "uint16",
        "internalType": "uint16"
      },
      {
        "name": "minSources",
        "type": "uint8",
        "internalType": "uint8"
      },
      {
        "name": "active",
        "type": "bool",
        "internalType": "bool"
      },
      {
        "name": "maxExposureUsdc",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "getRiskParams",
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
        "name": "maxDeviationBps",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "maxLtvBps",
        "type": "uint16",
        "internalType": "uint16"
      },
      {
        "name": "minSources",
        "type": "uint8",
        "internalType": "uint8"
      },
      {
        "name": "active",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "getSourceAt",
    "type": "function",
    "inputs": [
      {
        "name": "asset",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "index",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
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
    "stateMutability": "view"
  },
  {
    "name": "getSourceCount",
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
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "isActive",
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
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "isConfigured",
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
        "type": "bool",
        "internalType": "bool"
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
    "name": "removeAsset",
    "type": "function",
    "inputs": [
      {
        "name": "asset",
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
    "name": "setAssetConfig",
    "type": "function",
    "inputs": [
      {
        "name": "asset",
        "type": "address",
        "internalType": "address"
      },
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
      },
      {
        "name": "maxDeviationBps",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "maxLtvBps",
        "type": "uint16",
        "internalType": "uint16"
      },
      {
        "name": "minSources",
        "type": "uint8",
        "internalType": "uint8"
      },
      {
        "name": "active",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "setAssetExposure",
    "type": "function",
    "inputs": [
      {
        "name": "asset",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "maxExposureUsdc",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "setAssetLtv",
    "type": "function",
    "inputs": [
      {
        "name": "asset",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "maxLtvBps",
        "type": "uint16",
        "internalType": "uint16"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "setAssetRiskParams",
    "type": "function",
    "inputs": [
      {
        "name": "asset",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "maxDeviationBps",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "maxLtvBps",
        "type": "uint16",
        "internalType": "uint16"
      },
      {
        "name": "minSources",
        "type": "uint8",
        "internalType": "uint8"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "setAssetSources",
    "type": "function",
    "inputs": [
      {
        "name": "asset",
        "type": "address",
        "internalType": "address"
      },
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
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "setAssetStatus",
    "type": "function",
    "inputs": [
      {
        "name": "asset",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "active",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "setAssetWethSources",
    "type": "function",
    "inputs": [
      {
        "name": "asset",
        "type": "address",
        "internalType": "address"
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
