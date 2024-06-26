/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  CartProject,
  ProgressStatus,
  IPublishBatchArgs,
  IPublishMessage,
  PoolInfo,
  MACIPollContracts,
  IMessageContractParams,
  IPubKey,
} from "./features/api/types";
import { Allo, ChainId } from "common";
import { useCartStorage } from "./store";
import {
  Hex,
  InternalRpcError,
  parseAbi,
  parseUnits,
  SwitchChainError,
  UserRejectedRequestError,
  zeroAddress,
} from "viem";
import {
  Keypair as GenKeyPair,
  prepareAllocationData,
  bnSqrt,
} from "./features/api/voting";
import { groupBy, round, uniq } from "lodash-es";
import { getEnabledChains } from "./app/chainConfig";
import { WalletClient, PublicClient } from "wagmi";
import { getContract, getPublicClient } from "@wagmi/core";
import { getPermitType } from "common/dist/allo/voting";
import { MRC_CONTRACTS } from "common/dist/allo/addresses/mrc";
import { getConfig } from "common/src/config";
import { DataLayer } from "data-layer";

import { decodeAbiParameters, parseAbiParameters, formatEther } from "viem";

// NEW CODE
import { Keypair, PCommand, PubKey, PrivKey } from "maci-domainobjs";
import { genRandomSalt } from "maci-crypto";

type ChainMap<T> = Record<ChainId, T>;

const isV2 = getConfig().allo.version === "allo-v2";
interface CheckoutState {
  permitStatus: ChainMap<ProgressStatus>;
  setPermitStatusForChain: (
    chain: ChainId,
    permitStatus: ProgressStatus
  ) => void;
  maciKeyStatus: ChainMap<ProgressStatus>;
  setMaciKeyStatusForChain: (
    chain: ChainId,
    maciKeyStatus: ProgressStatus
  ) => void;
  contributionStatus: ChainMap<ProgressStatus>;
  setContributionStatusForChain: (
    chain: ChainId,
    contributionStatus: ProgressStatus
  ) => void;

  voteStatus: ChainMap<ProgressStatus>;
  setVoteStatusForChain: (chain: ChainId, voteStatus: ProgressStatus) => void;
  chainSwitchStatus: ChainMap<ProgressStatus>;
  setChainSwitchStatusForChain: (
    chain: ChainId,
    voteStatus: ProgressStatus
  ) => void;
  currentChainBeingCheckedOut?: ChainId;
  chainsToCheckout: ChainId[];
  setChainsToCheckout: (chains: ChainId[]) => void;
  /** Checkout the given chains
   * this has the side effect of adding the chains to the wallet if they are not yet present
   * We get the data necessary to construct the votes from the cart store */
  checkoutMaci: (
    chainsToCheckout: { chainId: ChainId; permitDeadline: number }[],
    walletClient: WalletClient,
    pcd?: string
  ) => Promise<void>;

  changeDonations: (
    chainsToCheckout: { chainId: ChainId; permitDeadline: number }[],
    walletClient: WalletClient,
    previousMessages: PCommand[]
  ) => Promise<void>;

  getCheckedOutProjects: () => CartProject[];
  checkedOutProjects: CartProject[];
  setCheckedOutProjects: (newArray: CartProject[]) => void;
}

const defaultProgressStatusForAllChains = Object.fromEntries(
  Object.values(getEnabledChains()).map((value) => [
    value.id as ChainId,
    ProgressStatus.NOT_STARTED,
  ])
) as ChainMap<ProgressStatus>;

export const useCheckoutStore = create<CheckoutState>()(
  devtools((set, get) => ({
    permitStatus: defaultProgressStatusForAllChains,
    setPermitStatusForChain: (chain: ChainId, permitStatus: ProgressStatus) =>
      set((oldState) => ({
        permitStatus: { ...oldState.permitStatus, [chain]: permitStatus },
      })),
    maciKeyStatus: defaultProgressStatusForAllChains,
    setMaciKeyStatusForChain: (chain: ChainId, maciKeyStatus: ProgressStatus) =>
      set((oldState) => ({
        maciKeyStatus: { ...oldState.maciKeyStatus, [chain]: maciKeyStatus },
      })),
    contributionStatus: defaultProgressStatusForAllChains,
    setContributionStatusForChain: (
      chain: ChainId,
      contributionStatus: ProgressStatus
    ) =>
      set((oldState) => ({
        contributionStatus: {
          ...oldState.contributionStatus,
          [chain]: contributionStatus,
        },
      })),
    voteStatus: defaultProgressStatusForAllChains,
    setVoteStatusForChain: (chain: ChainId, voteStatus: ProgressStatus) =>
      set((oldState) => ({
        voteStatus: { ...oldState.voteStatus, [chain]: voteStatus },
      })),
    chainSwitchStatus: defaultProgressStatusForAllChains,
    setChainSwitchStatusForChain: (
      chain: ChainId,
      chainSwitchStatus: ProgressStatus
    ) =>
      set((oldState) => ({
        chainSwitchStatus: {
          ...oldState.chainSwitchStatus,
          [chain]: chainSwitchStatus,
        },
      })),
    currentChainBeingCheckedOut: undefined,
    chainsToCheckout: [],
    setChainsToCheckout: (chains: ChainId[]) => {
      set({
        chainsToCheckout: chains,
      });
    },
    /** Checkout the given chains
     * this has the side effect of adding the chains to the wallet if they are not yet present
     * We get the data necessary to construct the votes from the cart store */
    checkoutMaci: async (
      chainsToCheckout: { chainId: ChainId; permitDeadline: number }[],
      walletClient: WalletClient,
      pcd?: string
    ) => {
      const firstChainToCheckout = chainsToCheckout[0];
      const chainId = firstChainToCheckout.chainId;
      const deadline = firstChainToCheckout.permitDeadline;

      const chainIdsToCheckOut = [chainId];
      get().setChainsToCheckout(
        uniq([...get().chainsToCheckout, ...chainIdsToCheckOut])
      );

      const projectsToCheckOut = useCartStorage
        .getState()
        .projects.filter((project) =>
          chainIdsToCheckOut.includes(project.chainId)
        );

      const projectsByChain = groupBy(projectsToCheckOut, "chainId") as {
        [chain: number]: CartProject[];
      };

      const getVotingTokenForChain =
        useCartStorage.getState().getVotingTokenForChain;

      const totalDonationPerChain = Object.fromEntries(
        Object.entries(projectsByChain).map(([key, value]) => [
          Number(key) as ChainId,
          value
            .map((project) => project.amount)
            .reduce(
              (acc, amount) =>
                acc +
                parseUnits(
                  amount ? amount : "0",
                  getVotingTokenForChain(Number(key) as ChainId).decimal
                ),
              0n
            ),
        ])
      );

      const donations = projectsByChain[chainId];

      set({
        currentChainBeingCheckedOut: chainId,
      });

      await switchToChain(chainId, walletClient, get);

      const token = getVotingTokenForChain(chainId);

      if (token.address !== zeroAddress) {
        try {
          get().setPermitStatusForChain(chainId, ProgressStatus.IN_PROGRESS);

          const owner = walletClient.account.address;
          const erc20Contract = getContract({
            address: token.address as Hex,
            abi: parseAbi([
              "function nonces(address) public view returns (uint256)",
              "function name() public view returns (string)",
              "function approve(address, uint256) public",
            ]),
            walletClient,
            chainId,
          });

          // TODO Make this dynamic
          const approve = await walletClient.writeContract({
            address: token.address as Hex,
            abi: parseAbi(["function approve(address, uint256) public"]),
            functionName: "approve",
            args: [MRC_CONTRACTS[chainId], totalDonationPerChain[chainId]],
          });

          get().setPermitStatusForChain(chainId, ProgressStatus.IS_SUCCESS);
        } catch (e) {
          if (!(e instanceof UserRejectedRequestError)) {
            console.error("approve error", e, {
              donations,
              chainId,
              tokenAddress: token.address,
            });
          }
          get().setPermitStatusForChain(chainId, ProgressStatus.IS_ERROR);
          return;
        }
      } else {
        get().setPermitStatusForChain(chainId, ProgressStatus.IS_SUCCESS);
      }

      try {
        const groupedDonations = groupBy(
          donations.map((d) => ({
            ...d,
            roundId: d.roundId,
          })),
          "roundId"
        );

        const firstRoundId = Object.keys(groupedDonations)[0];

        get().setMaciKeyStatusForChain(chainId, ProgressStatus.IN_PROGRESS);

        const groupedKeyPairs: Record<string, GenKeyPair> = {};
        groupedKeyPairs[firstRoundId] = await generatePubKey(
          walletClient,
          groupedDonations[firstRoundId][0].roundId,
          chainId.toString()
        );

        get().setMaciKeyStatusForChain(chainId, ProgressStatus.IS_SUCCESS);

        const groupedEncodedVotes: Record<string, Hex> = {};

        const groupedAmounts: Record<string, bigint> = {};
        groupedDonations[firstRoundId].forEach((donation) => {
          groupedAmounts[firstRoundId] =
            (groupedAmounts[firstRoundId] || 0n) +
            parseUnits(donation.amount, token.decimal);
        });

        console.log("groupedDonations", groupedDonations);

        const DonationVotesEachRound: Record<
          string,
          Record<string, bigint>
        > = {};
        const SINGLEVOTE = 10n ** 5n;

        // Process each donation
        groupedDonations[firstRoundId].forEach((donation) => {
          const donationAmount = parseUnits(donation.amount, token.decimal);

          // Calculate the vote weight
          const voteWeight = (SINGLEVOTE * donationAmount) / 10n ** 18n;

          // Ensure DonationVotesEachRound is correctly updated
          if (!DonationVotesEachRound[donation.roundId]) {
            DonationVotesEachRound[donation.roundId] = {};
          }

          DonationVotesEachRound[donation.roundId][donation.applicationIndex] =
            voteWeight;
        });

        const messagesPerRound: Record<string, IPublishMessage[]> = {};
        let nonceValue = 0;

        groupedEncodedVotes[firstRoundId] = prepareAllocationData({
          publicKey: groupedKeyPairs[firstRoundId].pubKey,
          amount: groupedAmounts[firstRoundId],
          proof: pcd,
        });

        const messages: IPublishMessage[] = [];

        groupedDonations[firstRoundId].forEach((donation) => {
          messages.push({
            stateIndex: 1n,
            voteOptionIndex: BigInt(donation.applicationIndex),
            nonce: BigInt(nonceValue++),
            newVoteWeight: bnSqrt(
              DonationVotesEachRound[firstRoundId][
                donation.applicationIndex
              ] as bigint
            ),
          });
        });

        console.log(messages);

        console.log("messages", messages);

        messagesPerRound[firstRoundId] = messages;

        get().setContributionStatusForChain(
          chainId,
          ProgressStatus.IN_PROGRESS
        );

        const PublishBatchArgs = await allocate({
          messages,
          walletClient,
          roundId: firstRoundId,
          chainId,
          amount: groupedAmounts[firstRoundId],
          bytes: groupedEncodedVotes[firstRoundId],
          pubKey: groupedKeyPairs[firstRoundId].pubKey,
          privateKey: groupedKeyPairs[firstRoundId].privKey,
        });

        get().setContributionStatusForChain(chainId, ProgressStatus.IS_SUCCESS);

        // Publish the batch of messages
        await publishBatch(PublishBatchArgs);

        donations.forEach((donation) => {
          useCartStorage.getState().remove(donation);
        });
        set((oldState) => ({
          voteStatus: {
            ...oldState.voteStatus,
            [chainId]: ProgressStatus.IS_SUCCESS,
          },
        }));
        set({
          checkedOutProjects: [...get().checkedOutProjects, ...donations],
        });
      } catch (error) {
        let context: Record<string, unknown> = {
          chainId,
          donations,
          token,
        };

        if (error instanceof Error) {
          context = {
            ...context,
            error: error.message,
            cause: error.cause,
          };
        }

        if (!(error instanceof UserRejectedRequestError)) {
          console.error("donation error", error, context);
        }

        get().setVoteStatusForChain(chainId, ProgressStatus.IS_ERROR);
        throw error;
      }
    },

    /** Checkout the given chains
     * this has the side effect of adding the chains to the wallet if they are not yet present
     * We get the data necessary to construct the votes from the cart store */
    changeDonations: async (
      chainsToCheckout: { chainId: ChainId; permitDeadline: number }[],
      walletClient: WalletClient,
      previousMessages: PCommand[]
    ) => {
      const firstChainToCheckout = chainsToCheckout[0];
      const chainId = firstChainToCheckout.chainId;

      const chainIdsToCheckOut = [chainId];
      get().setChainsToCheckout(
        uniq([...get().chainsToCheckout, ...chainIdsToCheckOut])
      );

      const projectsToCheckOut = useCartStorage
        .getState()
        .projects.filter((project) =>
          chainIdsToCheckOut.includes(project.chainId)
        );

      const projectsByChain = groupBy(projectsToCheckOut, "chainId") as {
        [chain: number]: CartProject[];
      };

      const getVotingTokenForChain =
        useCartStorage.getState().getVotingTokenForChain;

      const donations = projectsByChain[chainId];

      set({
        currentChainBeingCheckedOut: chainId,
      });

      await switchToChain(chainId, walletClient, get);

      const token = getVotingTokenForChain(chainId);

      try {
        get().setVoteStatusForChain(chainId, ProgressStatus.IN_PROGRESS);

        const groupedDonations = groupBy(
          donations.map((d) => ({
            ...d,
            roundId: d.roundId,
          })),
          "roundId"
        );

        const firstRoundId = Object.keys(groupedDonations)[0];

        get().setMaciKeyStatusForChain(chainId, ProgressStatus.IN_PROGRESS);

        const groupedKeyPairs: Record<string, GenKeyPair> = {};
        groupedKeyPairs[firstRoundId] = await generatePubKey(
          walletClient,
          groupedDonations[firstRoundId][0].roundId,
          chainId.toString()
        );

        get().setMaciKeyStatusForChain(chainId, ProgressStatus.IS_SUCCESS);

        const groupedAmounts: Record<string, bigint> = {};
        groupedDonations[firstRoundId].forEach((donation) => {
          groupedAmounts[firstRoundId] =
            (groupedAmounts[firstRoundId] || 0n) +
            parseUnits(donation.amount, token.decimal);
        });

        console.log("groupedDonations", groupedDonations);

        const DonationVotesEachRound: Record<
          string,
          Record<string, bigint>
        > = {};
        const SINGLEVOTE = 10n ** 5n;

        // Process each donation
        groupedDonations[firstRoundId].forEach((donation) => {
          const donationAmount = parseUnits(donation.amount, token.decimal);

          // Calculate the vote weight
          const voteWeight = (SINGLEVOTE * donationAmount) / 10n ** 18n;

          // Ensure DonationVotesEachRound is correctly updated
          if (!DonationVotesEachRound[donation.roundId]) {
            DonationVotesEachRound[donation.roundId] = {};
          }

          DonationVotesEachRound[donation.roundId][donation.applicationIndex] =
            voteWeight;
        });

        const messagesPerRound: Record<string, IPublishMessage[]> = {};
        let nonceValue = 0;

        const messages: IPublishMessage[] = [];

        groupedDonations[firstRoundId].forEach((donation) => {
          messages.push({
            stateIndex: 1n,
            voteOptionIndex: BigInt(donation.applicationIndex),
            nonce: BigInt(nonceValue++),
            newVoteWeight: bnSqrt(
              DonationVotesEachRound[firstRoundId][
                donation.applicationIndex
              ] as bigint
            ),
          });
        });

        console.log(messages);

        console.log("messages", messages);

        messagesPerRound[firstRoundId] = messages;

        const publicClient = getPublicClient({
          chainId,
        });

        const abi = parseAbi([
          "function getPool(uint256) view returns ((bytes32 profileId, address strategy, address token, (uint256,string) metadata, bytes32 managerRole, bytes32 adminRole))",
          "function _pollContracts() view returns ((address poll, address messageProcessor,address tally,address subsidy))",
          "function coordinatorPubKey() view returns (uint256 x, uint256 y)",
          "function allocate(uint256, bytes) external payable",
        ]);

        const alloContractAddress =
          "0x1133ea7af70876e64665ecd07c0a0476d09465a1";

        const [Pool] = await Promise.all([
          publicClient.readContract({
            abi: abi,
            address: alloContractAddress as Hex,
            functionName: "getPool",
            args: [BigInt(firstRoundId)],
          }),
        ]);

        const pool = Pool as PoolInfo;
        console.log("pool", pool.strategy);

        const pollContracts = await publicClient.readContract({
          abi: abi,
          address: pool.strategy as Hex,
          functionName: "_pollContracts",
        });

        const poll = pollContracts as MACIPollContracts;

        const stateIndex = previousMessages[0].stateIndex;

        const Messages = messages.map((message) => {
          return {
            stateIndex: stateIndex,
            voteOptionIndex: message.voteOptionIndex,
            nonce: message.nonce,
            newVoteWeight: message.newVoteWeight,
          };
        });

        await publishBatch({
          messages: Messages,
          Poll: poll.poll,
          publicKey: groupedKeyPairs[firstRoundId].pubKey,
          privateKey: groupedKeyPairs[firstRoundId].privKey,
          walletClient,
          chainId,
        });

        donations.forEach((donation) => {
          useCartStorage.getState().remove(donation);
        });
        set((oldState) => ({
          voteStatus: {
            ...oldState.voteStatus,
            [chainId]: ProgressStatus.IS_SUCCESS,
          },
        }));
        set({
          checkedOutProjects: [...get().checkedOutProjects, ...donations],
        });
      } catch (error) {
        let context: Record<string, unknown> = {
          chainId,
          donations,
          token,
        };

        if (error instanceof Error) {
          context = {
            ...context,
            error: error.message,
            cause: error.cause,
          };
        }

        if (!(error instanceof UserRejectedRequestError)) {
          console.error("donation error", error, context);
        }

        get().setVoteStatusForChain(chainId, ProgressStatus.IS_ERROR);
        throw error;
      }
    },
    checkedOutProjects: [],
    getCheckedOutProjects: () => {
      return get().checkedOutProjects;
    },
    setCheckedOutProjects: (newArray: CartProject[]) => {
      set({
        checkedOutProjects: newArray,
      });
    },
  }))
);

export const generatePubKey = async (
  walletClient: WalletClient,
  Poll: string,
  chainID: string
) => {
  const signature = await walletClient.signMessage({
    message: `Sign this message to get your public key for MACI voting on Allo for the round with address ${Poll} on chain ${chainID}`,
  });

  const getUserPubKey = GenKeyPair.createFromSeed(signature);

  return getUserPubKey;
};

export const generatePubKeyWithSeed = async (seed: string) => {
  const getUserPubKey = GenKeyPair.createFromSeed(seed);
  return getUserPubKey;
};

const allocate = async ({
  messages,
  walletClient,
  roundId,
  chainId,
  bytes,
  amount,
  pubKey,
  privateKey,
}: {
  messages: IPublishMessage[];
  walletClient: WalletClient;
  roundId: string;
  chainId: ChainId;
  bytes: Hex;
  amount: bigint;
  pubKey: PubKey;
  privateKey: PrivKey;
}) => {
  const publicClient = getPublicClient({
    chainId,
  });

  const abi = parseAbi([
    "function getPool(uint256) view returns ((bytes32 profileId, address strategy, address token, (uint256,string) metadata, bytes32 managerRole, bytes32 adminRole))",
    "function _pollContracts() view returns ((address poll, address messageProcessor,address tally,address subsidy))",
    "function coordinatorPubKey() view returns (uint256 x, uint256 y)",
    "function allocate(uint256, bytes) external payable",
  ]);

  const alloContractAddress = "0x1133ea7af70876e64665ecd07c0a0476d09465a1";

  const [Pool] = await Promise.all([
    publicClient.readContract({
      abi: abi,
      address: alloContractAddress as Hex,
      functionName: "getPool",
      args: [BigInt(roundId)],
    }),
  ]);

  const pool = Pool as PoolInfo;
  console.log("pool", pool.strategy);

  const pollContracts = await publicClient.readContract({
    abi: abi,
    address: pool.strategy as Hex,
    functionName: "_pollContracts",
  });

  const poll = pollContracts as MACIPollContracts;
  console.log("poll", roundId, poll.poll);

  console.log("bytes", bytes);

  const allocate = await walletClient.writeContract({
    address: alloContractAddress as Hex,
    abi: abi,
    functionName: "allocate",
    args: [BigInt(roundId), bytes],
    value: amount,
  });

  console.log("Transaction Sent");
  const transaction = await publicClient.waitForTransactionReceipt({
    hash: allocate,
  });

  const data = transaction.logs;

  const [stateIndex, voiceCreditsBalance, timestampt] = decodeAbiParameters(
    parseAbiParameters("uint256,uint256,uint256"),
    data[0].data
  );

  console.log(stateIndex);

  console.log("Transaction Mined");

  const Messages = messages.map((message) => {
    return {
      stateIndex: stateIndex,
      voteOptionIndex: message.voteOptionIndex,
      nonce: message.nonce,
      newVoteWeight: message.newVoteWeight,
    };
  });

  return {
    messages: Messages,
    Poll: poll.poll,
    publicKey: pubKey,
    privateKey: privateKey,
    walletClient,
    chainId,
  };
};

export const publishBatch = async ({
  messages,
  Poll,
  publicKey,
  privateKey,
  walletClient,
  chainId,
}: IPublishBatchArgs) => {
  const publicClient = getPublicClient({
    chainId,
  });

  const userMaciPubKey = publicKey;

  const userMaciPrivKey = privateKey;

  const abi = parseAbi([
    "function publishMessageBatch((uint256 msgType,uint256[10] data)[] _messages,(uint256 x,uint256 y)[] _pubKeys)",
    "function maxValues() view returns (uint256 maxVoteOptions)",
    "function coordinatorPubKey() view returns ((uint256, uint256))",
  ]);

  const [maxValues, coordinatorPubKeyResult] = await Promise.all([
    publicClient.readContract({
      abi: abi,
      address: Poll as Hex,
      functionName: "maxValues",
    }),
    publicClient.readContract({
      abi: abi,
      address: Poll as Hex,
      functionName: "coordinatorPubKey",
    }),
  ]);

  const maxoptions = maxValues as bigint;

  const maxVoteOptions = Number(maxoptions);

  // validate the vote options index against the max leaf index on-chain
  messages.forEach(({ stateIndex, voteOptionIndex, nonce }) => {
    if (voteOptionIndex < 0 || maxVoteOptions < voteOptionIndex) {
      throw new Error("invalid vote option index");
    }

    // check < 1 cause index zero is a blank state leaf
    if (stateIndex < 1) {
      throw new Error("invalid state index");
    }

    if (nonce < 0) {
      throw new Error("invalid nonce");
    }
  });

  const coordinatorPubKey = new PubKey([
    BigInt(coordinatorPubKeyResult[0]),
    BigInt(coordinatorPubKeyResult[1]),
  ]);

  const sharedKey = Keypair.genEcdhSharedKey(
    userMaciPrivKey,
    coordinatorPubKey
  );

  const payload = messages.map(
    ({ stateIndex, voteOptionIndex, newVoteWeight, nonce }) => {
      const userSalt = genRandomSalt();

      // create the command object
      const command = new PCommand(
        stateIndex,
        userMaciPubKey,
        voteOptionIndex,
        newVoteWeight,
        nonce,
        // we only support one poll for now
        BigInt(0),
        userSalt
      );

      // sign the command with the user private key
      const signature = command.sign(userMaciPrivKey);

      const message = command.encrypt(signature, sharedKey);

      return {
        message: message.asContractParam(),
        key: userMaciPubKey.asContractParam(),
      };
    }
  );

  const preparedMessages = payload.map(
    (obj) => obj.message
  ).reverse() as unknown as IMessageContractParams[];
  const preparedKeys = payload.map((obj) => obj.key).reverse() as unknown as IPubKey[];

  console.log("preparedMessages", preparedMessages);
  console.log("preparedKeys", preparedKeys);

  if (!walletClient) {
    console.log("Wallet client not found");
    return;
  }
  console.log("Poll", Poll);

  const hash = await walletClient.writeContract({
    address: Poll as Hex,
    abi: abi,
    functionName: "publishMessageBatch",
    args: [preparedMessages, preparedKeys],
  });
  console.log("Transaction Sent");
  const transaction = await publicClient.waitForTransactionReceipt({
    hash: hash,
  });
};

/** This function handles switching to a chain
 * if the chain is not present in the wallet, it will add it, and then switch */
async function switchToChain(
  chainId: ChainId,
  walletClient: WalletClient,
  get: () => CheckoutState
) {
  get().setChainSwitchStatusForChain(chainId, ProgressStatus.IN_PROGRESS);
  const nextChainData = getEnabledChains().find(
    (chain) => chain.id === chainId
  );
  if (!nextChainData) {
    get().setChainSwitchStatusForChain(chainId, ProgressStatus.IS_ERROR);
    throw "next chain not found";
  }
  try {
    /* Try switching normally */
    await walletClient.switchChain({
      id: chainId,
    });
  } catch (e) {
    if (e instanceof UserRejectedRequestError) {
      console.log("Rejected!");
      get().setChainSwitchStatusForChain(chainId, ProgressStatus.IS_ERROR);
      return;
    } else if (e instanceof SwitchChainError || e instanceof InternalRpcError) {
      console.log("Chain not added yet, adding", { e });
      /** Chain might not be added in wallet yet. Request to add it to the wallet */
      try {
        await walletClient.addChain({
          chain: {
            id: nextChainData.id,
            name: nextChainData.name,
            network: nextChainData.network,
            nativeCurrency: nextChainData.nativeCurrency,
            rpcUrls: nextChainData.rpcUrls,
            blockExplorers: nextChainData.blockExplorers,
          },
        });
      } catch (e) {
        get().setChainSwitchStatusForChain(chainId, ProgressStatus.IS_ERROR);
        return;
      }
    } else {
      console.log("unhandled error when switching chains", { e });
      get().setChainSwitchStatusForChain(chainId, ProgressStatus.IS_ERROR);
      return;
    }
  }
  get().setChainSwitchStatusForChain(chainId, ProgressStatus.IS_SUCCESS);
}