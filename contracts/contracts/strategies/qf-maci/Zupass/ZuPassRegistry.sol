// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity 0.8.20;

import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import {IZuPassVerifier} from "../interfaces/IZuPassVerifier.sol";

contract ZuPassRegistry is Ownable {

    using EnumerableSet for EnumerableSet.UintSet;

    /// ======================
    /// ======= Structs ======
    /// ======================

    struct ZUPASS_SIGNER {
        uint256 G1;
        uint256 G2;
    }

    /// =====================
    /// ======= Errors ======
    /// =====================

    error AlreadyUsedZupass();
    error InvalidProof();
    error EventIsNotRegistered();
    error InvalidInput();

    /// ======================
    /// ======= Storage ======
    /// ======================

    IZuPassVerifier public immutable zupassVerifier;

    EnumerableSet.UintSet private eventIds;

    mapping(address => EnumerableSet.UintSet) private contractToEventIds;

    mapping(address => mapping(uint256 => bool)) public usedRoundNullifiers;

    mapping(uint256 => ZUPASS_SIGNER) public eventToZupassSigner;

    /// ====================================
    /// ========== Constructor =============
    /// ====================================

    constructor(IZuPassVerifier _zupassVerifier) Ownable(msg.sender) {
        zupassVerifier = _zupassVerifier;
    }

    /// =========================
    /// ====== External =========
    /// =========================

    function setEvents(
        uint256[] memory _eventIds,
        ZUPASS_SIGNER[] memory _ZupassSigners
    ) external onlyOwner {
        if (_eventIds.length != _ZupassSigners.length) revert InvalidInput();
        for (uint256 i = 0; i < _eventIds.length; i++) {
            uint256 eventId = _eventIds[i];
            eventToZupassSigner[eventId] = _ZupassSigners[i];
            eventIds.add(eventId);
        }
    }

    function roundRegistration(uint256[] memory _eventIds) external {
        for (uint256 i = 0; i < _eventIds.length; i++) {
            if (!eventIds.contains(_eventIds[i])) {
                revert EventIsNotRegistered();
            }
            contractToEventIds[msg.sender].add(_eventIds[i]);
        }
    }

    /// @notice Get the whitelisted events for a FundingRound (Strategy)
    /// @return List of whitelisted event IDs
    function getWhitelistedEvents(address _contract) external view returns (uint256[] memory) {
        return contractToEventIds[_contract].values();
    }

    /// @notice Get the Zupass signer for an event
    /// @param _eventId The event ID
    /// @return The Zupass signer
    function getZupassSigner(uint256 _eventId) external view returns (ZUPASS_SIGNER memory) {
        return eventToZupassSigner[_eventId];
    }

    /// ===================================
    /// ==== Zupass Verifier Function =====
    /// ===================================

    /// @notice Validate proof of attendance
    /// @param _pA Proof part A
    /// @param _pB Proof part B
    /// @param _pC Proof part C
    /// @param _pubSignals The public signals
    function validateProofOfAttendance(
        uint[2] memory _pA,
        uint[2][2] memory _pB,
        uint[2] memory _pC,
        uint[38] memory _pubSignals
    ) external returns (bool) {
        // The eventID used to generate the proof as public input
        uint256 eventID = _pubSignals[1];

        // Validate that the event ID used in the proof is whitelisted
        // for the FundingRound (Strategy) that is validating the proof
        if (!contractToEventIds[msg.sender].contains(eventID)) return false;

        // Get the Zupass signer used in the proof publicSignals[13] and publicSignals[14]
        ZUPASS_SIGNER memory signer = ZUPASS_SIGNER({G1: _pubSignals[13], G2: _pubSignals[14]});

        // Validate that the signer of the proof is the same as the one whitelisted for the event
        // That we are validating the proof for
        if (
            signer.G1 != eventToZupassSigner[eventID].G1 ||
            signer.G2 != eventToZupassSigner[eventID].G2
        ) {
            return false;
        }

        // Validate the proof with the Groth16 verifier
        if (!zupassVerifier.verifyProof(_pA, _pB, _pC, _pubSignals)) {
            return false;
        }

        // Get the nullifier used in the proof this is the email hash of the zupass
        uint256 ZupassNullifier = _pubSignals[9];

        // Validate that the nullifier has not been used before
        if (usedRoundNullifiers[msg.sender][ZupassNullifier]) return false;

        // Mark the nullifier as used
        usedRoundNullifiers[msg.sender][ZupassNullifier] = true;

        return true;
    }
}