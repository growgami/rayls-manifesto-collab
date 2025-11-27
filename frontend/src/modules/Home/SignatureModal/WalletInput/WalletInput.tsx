"use client";

import { useState } from "react";
import { useWallet } from "@/features/signing/modules/wallet/hooks/useWallet.hook";
import { WalletValidatorService } from "@/features/signing/modules/wallet/services/walletValidator.service";
import { BlockchainType } from "@/features/signing/modules/wallet/types/wallet.types";
import "./WalletInput.css";

export const WalletInput = () => {
  const { wallet, isLoading, error: fetchError, refetch } = useWallet();

  // Form state
  const [selectedBlockchain, setSelectedBlockchain] = useState<BlockchainType>('ETH');
  const [walletAddress, setWalletAddress] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Placeholders for different blockchains
  const placeholders: Record<BlockchainType, string> = {
    ETH: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    SOL: '7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV',
    BTC: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
  };

  // Validate on blur
  const handleBlur = () => {
    if (!walletAddress.trim()) {
      setValidationError(null);
      return;
    }

    const validation = WalletValidatorService.validateWalletAddress(
      walletAddress,
      selectedBlockchain
    );

    if (!validation.valid) {
      setValidationError(validation.error || 'Invalid address');
    } else {
      setValidationError(null);
    }
  };

  // Handle blockchain selection
  const handleBlockchainChange = (blockchain: BlockchainType) => {
    setSelectedBlockchain(blockchain);
    setValidationError(null);
    // Don't clear address - let user keep typing
  };

  // Handle save
  const handleSave = async () => {
    // Validate before save
    const validation = WalletValidatorService.validateWalletAddress(
      walletAddress,
      selectedBlockchain
    );

    if (!validation.valid) {
      setValidationError(validation.error || 'Invalid address');
      return;
    }

    setIsSaving(true);
    setValidationError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
          blockchainType: selectedBlockchain,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setValidationError(result.message || 'Failed to save wallet');
        return;
      }

      // Success: show message and transition to display mode
      setSuccessMessage('Wallet saved successfully!');

      // Auto-transition to display mode after brief success message
      setTimeout(() => {
        setSuccessMessage(null);
        refetch(); // Trigger re-fetch to show display mode
      }, 1500);
    } catch (error) {
      console.error('Error saving wallet:', error);
      setValidationError('Failed to save wallet. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="wallet-container">
        <div className="wallet-loading">Loading wallet data...</div>
      </div>
    );
  }

  // Display mode: Show saved wallet
  if (wallet) {
    const maskedAddress =
      wallet.walletAddress.slice(0, 6) +
      '...' +
      wallet.walletAddress.slice(-4);

    return (
      <div className="wallet-container">
        <div className="wallet-header">
          <h3 className="wallet-title">Your Wallet</h3>
          <div className="wallet-badges">
            <span className="wallet-blockchain-badge">{wallet.blockchainType}</span>
            <span className="wallet-saved-badge">Saved</span>
          </div>
        </div>

        <div className="wallet-display">
          <div className="wallet-address-box">
            <span className="wallet-address-masked">{maskedAddress}</span>
          </div>
        </div>

        <p className="wallet-immutable-notice">
          Wallet addresses are immutable and cannot be changed once saved.
        </p>
      </div>
    );
  }

  // Input form mode: No wallet exists
  return (
    <div className="wallet-container">
      <div className="wallet-header">
        <h3 className="wallet-title">Add Your Wallet</h3>
        <span className="wallet-required-badge">Required</span>
      </div>

      <p className="wallet-description">
        Enter your cryptocurrency wallet address to receive future rewards.
      </p>

      {/* Blockchain selector */}
      <div className="wallet-blockchain-selector">
        <button
          className={`wallet-blockchain-btn ${
            selectedBlockchain === 'ETH' ? 'active' : ''
          }`}
          onClick={() => handleBlockchainChange('ETH')}
          disabled={isSaving}
        >
          Ethereum
        </button>
        <button
          className={`wallet-blockchain-btn ${
            selectedBlockchain === 'SOL' ? 'active' : ''
          }`}
          onClick={() => handleBlockchainChange('SOL')}
          disabled={isSaving}
        >
          Solana
        </button>
        <button
          className={`wallet-blockchain-btn ${
            selectedBlockchain === 'BTC' ? 'active' : ''
          }`}
          onClick={() => handleBlockchainChange('BTC')}
          disabled={isSaving}
        >
          Bitcoin
        </button>
      </div>

      {/* Wallet address input */}
      <div className="wallet-input-section">
        <input
          type="text"
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholders[selectedBlockchain]}
          className={`wallet-address-input ${validationError ? 'error' : ''}`}
          disabled={isSaving}
          aria-label="Wallet address"
        />
      </div>

      {/* Error message */}
      {validationError && (
        <div className="wallet-error-message">{validationError}</div>
      )}

      {/* Success message */}
      {successMessage && (
        <div className="wallet-success-message">{successMessage}</div>
      )}

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={isSaving || !walletAddress.trim()}
        className="wallet-save-btn"
      >
        {isSaving ? 'Saving...' : 'Save Wallet'}
      </button>
    </div>
  );
};
