"use client";

import { useState } from "react";
import "./Referral.css";
import { WalletInput } from "../WalletInput/WalletInput";

interface ReferralProps {
  referralCode: string;
}

export const Referral = ({ referralCode }: ReferralProps) => {
  const [copied, setCopied] = useState(false);

  const baseUrl = process.env.NEXT_PUBLIC_NEXTAUTH_URL || "http://localhost:3000";
  const referralUrl = `${baseUrl}/?ref=${referralCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="referral-container">
      <div className="referral-header">
        <h3 className="referral-title">Your Referral Link</h3>
        <p className="referral-description">
          Share this link with others to invite them to sign the manifesto
        </p>
      </div>

      <div className="referral-url-section">
        <div className="referral-url-box">
          <input
            type="text"
            value={referralUrl}
            readOnly
            className="referral-url-input"
            aria-label="Referral URL"
          />
        </div>

        <button
          onClick={handleCopy}
          className="referral-copy-btn"
          aria-label={copied ? "Copied!" : "Copy to clipboard"}
        >
          {copied ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          )}
          <span className="referral-copy-text">
            {copied ? "Copied!" : "Copy"}
          </span>
        </button>
      </div>

      {/* Wallet input rendered at the bottom of the referral card */}
      <div className="referral-wallet-section">
        <WalletInput />
      </div>
    </div>
  );
};
