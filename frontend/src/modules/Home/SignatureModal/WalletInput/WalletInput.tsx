"use client";

import { useState } from "react";
import { useWallet } from "@/features/signing/modules/wallet/hooks/useWallet.hook";
import { WalletValidatorService } from "@/features/signing/modules/wallet/services/walletValidator.service";
import { BlockchainType } from "@/features/signing/modules/wallet/types/wallet.types";
import { refreshSession } from "@/features/signing/modules/auth/utils/sessionRefresh.util";
import "./WalletInput.css";

export const WalletInput = () => {
  const { wallet, isLoading, error: fetchError, refetch } = useWallet();

  // Form state (ETH is the only supported blockchain type)
  const [walletAddress, setWalletAddress] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Validate on blur
  const handleBlur = () => {
    if (!walletAddress.trim()) {
      setValidationError(null);
      return;
    }

    const validation = WalletValidatorService.validateWalletAddress(
      walletAddress,
      'ETH'
    );

    if (!validation.valid) {
      setValidationError(validation.error || 'Invalid address');
    } else {
      setValidationError(null);
    }
  };

  // Handle save
  const handleSave = async () => {
    // Validate before save
    const validation = WalletValidatorService.validateWalletAddress(
      walletAddress,
      'ETH'
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
          blockchainType: 'ETH',
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setValidationError(result.message || 'Failed to save wallet');
        return;
      }

      // Success: show message and transition to display mode
      setSuccessMessage('Wallet saved successfully!');

      // Refresh session to include new wallet data
      await refreshSession();

      // Auto-transition to display mode after brief success message
      setTimeout(() => {
        setSuccessMessage(null);
        refetch(); // Trigger re-read from session to show display mode
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
          <h3 className="wallet-title">Your EVM Wallet</h3>
          <div className="wallet-badges">
            <span className="wallet-blockchain-badge">EVM</span>
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
        <h3 className="wallet-title">Submit your wallet to be apart of whats next</h3>
        <span className="wallet-required-badge">Required</span>
      </div>

      <p className="wallet-description">
        Enter your EVM-compatible wallet address to receive future rewards.
      </p>

      {/* Wallet address input */}
      <div className="wallet-input-section">
        <label htmlFor="wallet-address-input" className="wallet-input-label">
          EVM-Compatible Address
        </label>
        <input
          id="wallet-address-input"
          type="text"
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
          onBlur={handleBlur}
          placeholder="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
          className={`wallet-address-input ${validationError ? 'error' : ''}`}
          disabled={isSaving}
          aria-label="EVM-compatible wallet address"
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
