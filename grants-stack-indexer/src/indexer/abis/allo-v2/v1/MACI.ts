export default [
  {
    inputs: [
      {
        internalType: "address",
        name: "_caller",
        type: "address",
      },
    ],
    name: "CallerMustBePoll",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidMessage",
    type: "error",
  },
  {
    inputs: [],
    name: "MaciPubKeyLargerThanSnarkFieldSize",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "pollId",
        type: "uint256",
      },
    ],
    name: "PollDoesNotExist",
    type: "error",
  },
  {
    inputs: [],
    name: "PoseidonHashLibrariesNotLinked",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "pollId",
        type: "uint256",
      },
    ],
    name: "PreviousPollNotCompleted",
    type: "error",
  },
  {
    inputs: [],
    name: "SignupTemporaryBlocked",
    type: "error",
  },
  {
    inputs: [],
    name: "TooManySignups",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "_pollId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "_coordinatorPubKeyX",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "_coordinatorPubKeyY",
        type: "uint256",
      },
      {
        components: [
          {
            internalType: "address",
            name: "poll",
            type: "address",
          },
          {
            internalType: "address",
            name: "messageProcessor",
            type: "address",
          },
          {
            internalType: "address",
            name: "tally",
            type: "address",
          },
          {
            internalType: "address",
            name: "subsidy",
            type: "address",
          },
        ],
        indexed: false,
        internalType: "struct ClonableMACI.PollContracts",
        name: "pollAddr",
        type: "tuple",
      },
    ],
    name: "DeployPoll",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint8",
        name: "version",
        type: "uint8",
      },
    ],
    name: "Initialized",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "_stateIndex",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "_userPubKeyX",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "_userPubKeyY",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "_voiceCreditBalance",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "_timestamp",
        type: "uint256",
      },
    ],
    name: "SignUp",
    type: "event",
  },
  {
    inputs: [],
    name: "MESSAGE_DATA_LENGTH",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_duration",
        type: "uint256",
      },
      {
        components: [
          {
            internalType: "uint256",
            name: "x",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "y",
            type: "uint256",
          },
        ],
        internalType: "struct DomainObjs.PubKey",
        name: "_coordinatorPubKey",
        type: "tuple",
      },
    ],
    name: "deployPoll",
    outputs: [
      {
        components: [
          {
            internalType: "address",
            name: "poll",
            type: "address",
          },
          {
            internalType: "address",
            name: "messageProcessor",
            type: "address",
          },
          {
            internalType: "address",
            name: "tally",
            type: "address",
          },
          {
            internalType: "address",
            name: "subsidy",
            type: "address",
          },
        ],
        internalType: "struct ClonableMACI.PollContracts",
        name: "pollAddr",
        type: "tuple",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_pollId",
        type: "uint256",
      },
    ],
    name: "getPoll",
    outputs: [
      {
        internalType: "address",
        name: "poll",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getStateAqRoot",
    outputs: [
      {
        internalType: "uint256",
        name: "root",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256[2]",
        name: "array",
        type: "uint256[2]",
      },
    ],
    name: "hash2",
    outputs: [
      {
        internalType: "uint256",
        name: "result",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256[3]",
        name: "array",
        type: "uint256[3]",
      },
    ],
    name: "hash3",
    outputs: [
      {
        internalType: "uint256",
        name: "result",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256[4]",
        name: "array",
        type: "uint256[4]",
      },
    ],
    name: "hash4",
    outputs: [
      {
        internalType: "uint256",
        name: "result",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256[5]",
        name: "array",
        type: "uint256[5]",
      },
    ],
    name: "hash5",
    outputs: [
      {
        internalType: "uint256",
        name: "result",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "left",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "right",
        type: "uint256",
      },
    ],
    name: "hashLeftRight",
    outputs: [
      {
        internalType: "uint256",
        name: "result",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "msgType",
            type: "uint256",
          },
          {
            internalType: "uint256[10]",
            name: "data",
            type: "uint256[10]",
          },
        ],
        internalType: "struct DomainObjs.Message",
        name: "_message",
        type: "tuple",
      },
      {
        components: [
          {
            internalType: "uint256",
            name: "x",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "y",
            type: "uint256",
          },
        ],
        internalType: "struct DomainObjs.PubKey",
        name: "_encPubKey",
        type: "tuple",
      },
    ],
    name: "hashMessageAndEncPubKey",
    outputs: [
      {
        internalType: "uint256",
        name: "msgHash",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            components: [
              {
                internalType: "uint256",
                name: "x",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "y",
                type: "uint256",
              },
            ],
            internalType: "struct DomainObjs.PubKey",
            name: "pubKey",
            type: "tuple",
          },
          {
            internalType: "uint256",
            name: "voiceCreditBalance",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "timestamp",
            type: "uint256",
          },
        ],
        internalType: "struct DomainObjs.StateLeaf",
        name: "_stateLeaf",
        type: "tuple",
      },
    ],
    name: "hashStateLeaf",
    outputs: [
      {
        internalType: "uint256",
        name: "ciphertext",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "initialVoiceCreditProxy",
    outputs: [
      {
        internalType: "contract InitialVoiceCreditProxy",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_maciFactory",
        type: "address",
      },
      {
        internalType: "uint8",
        name: "_stateTreeDepth",
        type: "uint8",
      },
      {
        components: [
          {
            internalType: "uint8",
            name: "intStateTreeDepth",
            type: "uint8",
          },
          {
            internalType: "uint8",
            name: "messageTreeSubDepth",
            type: "uint8",
          },
          {
            internalType: "uint8",
            name: "messageTreeDepth",
            type: "uint8",
          },
          {
            internalType: "uint8",
            name: "voteOptionTreeDepth",
            type: "uint8",
          },
        ],
        internalType: "struct Params.TreeDepths",
        name: "_treeDepths",
        type: "tuple",
      },
      {
        internalType: "address",
        name: "_verifier",
        type: "address",
      },
      {
        internalType: "address",
        name: "_vkRegistry",
        type: "address",
      },
      {
        internalType: "address",
        name: "_signUpGatekeeper",
        type: "address",
      },
      {
        internalType: "address",
        name: "_initialVoiceCreditProxy",
        type: "address",
      },
      {
        internalType: "address",
        name: "_coordinator",
        type: "address",
      },
    ],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "maciFactory",
    outputs: [
      {
        internalType: "contract ClonableMACIFactory",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_pollId",
        type: "uint256",
      },
    ],
    name: "mergeStateAq",
    outputs: [
      {
        internalType: "uint256",
        name: "root",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_numSrQueueOps",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_pollId",
        type: "uint256",
      },
    ],
    name: "mergeStateAqSubRoots",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "nextPollId",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "numSignUps",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256[2]",
        name: "dataToPad",
        type: "uint256[2]",
      },
      {
        internalType: "uint256",
        name: "msgType",
        type: "uint256",
      },
    ],
    name: "padAndHashMessage",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "msgType",
            type: "uint256",
          },
          {
            internalType: "uint256[10]",
            name: "data",
            type: "uint256[10]",
          },
        ],
        internalType: "struct DomainObjs.Message",
        name: "message",
        type: "tuple",
      },
      {
        components: [
          {
            internalType: "uint256",
            name: "x",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "y",
            type: "uint256",
          },
        ],
        internalType: "struct DomainObjs.PubKey",
        name: "padKey",
        type: "tuple",
      },
      {
        internalType: "uint256",
        name: "msgHash",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "polls",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256[]",
        name: "array",
        type: "uint256[]",
      },
    ],
    name: "sha256Hash",
    outputs: [
      {
        internalType: "uint256",
        name: "result",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "x",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "y",
            type: "uint256",
          },
        ],
        internalType: "struct DomainObjs.PubKey",
        name: "_pubKey",
        type: "tuple",
      },
      {
        internalType: "bytes",
        name: "_signUpGatekeeperData",
        type: "bytes",
      },
      {
        internalType: "bytes",
        name: "_initialVoiceCreditProxyData",
        type: "bytes",
      },
    ],
    name: "signUp",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "signUpGatekeeper",
    outputs: [
      {
        internalType: "contract SignUpGatekeeper",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "stateAq",
    outputs: [
      {
        internalType: "contract AccQueue",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "stateTreeDepth",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "subtreesMerged",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "treeDepths",
    outputs: [
      {
        internalType: "uint8",
        name: "intStateTreeDepth",
        type: "uint8",
      },
      {
        internalType: "uint8",
        name: "messageTreeSubDepth",
        type: "uint8",
      },
      {
        internalType: "uint8",
        name: "messageTreeDepth",
        type: "uint8",
      },
      {
        internalType: "uint8",
        name: "voteOptionTreeDepth",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "verifier",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "vkRegistry",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;
