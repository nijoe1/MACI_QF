import { ChainId } from "common";
import { WalletClient } from "wagmi";

import type { Project } from "data-layer";
import { PrivKey, PubKey } from "maci-domainobjs";

export type {
  ApplicationStatus,
  GrantApplicationFormAnswer,
  ProjectCredentials,
  ProjectOwner,
  ProjectMetadata,
  Project,
  PayoutStrategy,
  MetadataPointer,
  Requirement,
  Eligibility,
  Round,
} from "data-layer";

export type Network = "optimism" | "fantom" | "pgn";

export interface Web3Instance {
  /**
   * Currently selected address in ETH format i.e 0x...
   */
  address: string;
  /**
   * Chain ID & name of the currently connected network
   */
  chain: {
    id: number;
    name: string;
    network: Network;
  };
  provider: WalletClient;
  signer?: WalletClient;
}

export interface IPFSObject {
  /**
   * File content to be saved in IPFS
   */
  // eslint-disable-next-line @typescript-eslint/ban-types
  content: object | Blob;
  /**
   * Optional metadata
   */
  metadata?: {
    name?: string;
    // eslint-disable-next-line @typescript-eslint/ban-types
    keyvalues?: object;
  };
}

export type CartProject = Project & {
  roundId: string;
  chainId: ChainId;
  amount: string;
};

export enum ProgressStatus {
  IS_SUCCESS = "IS_SUCCESS",
  IN_PROGRESS = "IN_PROGRESS",
  NOT_STARTED = "NOT_STARTED",
  IS_ERROR = "IS_ERROR",
}

// NEW CODE

/**
 * Interface that represents user publish message
 */
export interface IPublishMessage {
  /**
   * The index of the state leaf
   */
  stateIndex: bigint;

  /**
   * The index of the vote option
   */
  voteOptionIndex: bigint;

  /**
   * The nonce of the message
   */
  nonce: bigint;

  /**
   * The new vote weight
   */
  newVoteWeight: bigint;
}

/**
 * Interface for the arguments to the batch publish command
 */
export interface IPublishBatchArgs {
  /**
   * User messages
   */
  messages: IPublishMessage[];

  /**
   * The address of the MACI contract
   */
  Poll: string;

  /**
   * The public key of the user
   */
  publicKey: PubKey;

  /**
   * The private key of the user
   */

  privateKey: PrivKey;

  /**
   * A signer object
   */
  walletClient: WalletClient;

  /**
   * The chain id
   */
  chainId: ChainId;
}

export interface PoolInfo {
  profileId: string;
  strategy: string;
  token: string;
  metadata: [bigint, string];
  managerRole: string;
  adminRole: string;
}

export interface MACIPollContracts {
  poll: string;
  messageProcessor: string;
  tally: string;
  subsidy: string;
}

export interface IPubKey {
  x: bigint;
  y: bigint;
}

export interface IMessageContractParams {
  msgType: bigint;
  data: readonly [
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
  ];
}