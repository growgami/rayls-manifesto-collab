"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/features/signing/modules/auth/hooks/useAuth.hook";
import { useUserPosition } from "@/features/signing/modules/signature/hooks/useUserPosition.hook";
import { useUserReferral } from "@/features/signing/modules/referral/hooks/useUserReferral.hook";
import { Card } from "./SignatureCard/Card";
import { Referral } from "./ReferralCodes/Referral";
import { WalletInput } from "./WalletInput/WalletInput";
import "./SignatureModal.css";

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SignatureModal = ({ isOpen, onClose }: SignatureModalProps) => {
  const [isClosing, setIsClosing] = useState(false);
  const { isAuthenticated, isLoading, twitterData, signIn, insufficientFollowers, minFollowersRequired } = useAuth();
  const { data: userPosition, isLoading: positionLoading } = useUserPosition();
  const { referralCode } = useUserReferral();

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen && !isClosing) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className={`modal-overlay ${isClosing ? "closing" : ""}`} onClick={handleClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-body">
            <div className="modal-text-section">
              <p className="modal-description">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show insufficient followers error
  if (isAuthenticated && twitterData && insufficientFollowers) {
    return (
      <div className={`modal-overlay ${isClosing ? "closing" : ""}`} onClick={handleClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2 className="modal-title">Unable to Sign</h2>
            <button className="modal-close-btn" onClick={handleClose}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M18 6 6 18"></path>
                <path d="m6 6 12 12"></path>
              </svg>
              <span className="sr-only">Close</span>
            </button>
          </div>
          <div className="modal-body">
            <div className="modal-body-inner">
              <div className="modal-text-section">
                <h3 className="modal-subtitle">Minimum Followers Required</h3>
                <p className="modal-description">
                  To prevent farming and reward our legitimate community, you need at least <strong>{minFollowersRequired} followers</strong> on X to sign the manifesto and receive your signature card.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show Card if authenticated
  if (isAuthenticated && twitterData) {
    return (
      <div className={`modal-overlay ${isClosing ? "closing" : ""}`} onClick={handleClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2 className="modal-title">Your Signature</h2>
            <button className="modal-close-btn" onClick={handleClose}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M18 6 6 18"></path>
                <path d="m6 6 12 12"></path>
              </svg>
              <span className="sr-only">Close</span>
            </button>
          </div>
          {positionLoading ? (
            <div className="modal-body">
              <div className="modal-text-section">
                <p className="modal-description">Loading your signature...</p>
              </div>
            </div>
          ) : (
            <div className="modal-body">
              <div className="signature-content-wrapper">
                <Card
                  user={{
                    name: twitterData.name,
                    username: twitterData.username,
                    profileImageUrl: twitterData.profile_image_url,
                  }}
                  signatureNumber={userPosition || 0}
                />
                {referralCode ? (
                  <Referral referralCode={referralCode} />
                ) : (
                  <WalletInput />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show sign-in modal if not authenticated
  return (
    <div className={`modal-overlay ${isClosing ? "closing" : ""}`} onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Sign the Manifesto</h2>
          <button className="modal-close-btn" onClick={handleClose}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18"></path>
              <path d="m6 6 12 12"></path>
            </svg>
            <span className="sr-only">Close</span>
          </button>
        </div>
        <div className="modal-body">
          <div className="modal-body-inner">
            <div className="modal-text-section">
              <h3 className="modal-subtitle">Add Your Signature</h3>
              <p className="modal-description">
                Connect your account to verify your signature and unlock a
                personalized share card.
              </p>
            </div>
            <div className="modal-actions">
              <button
                className="modal-sign-btn"
                onClick={signIn}
              >
                Sign in with X
              </button>
              <div className="modal-footer-text">
                <p>
                  We only access your public profile information (username,
                  display name, and profile picture) to craft your Rayls
                  signature card.
                </p>
                <p>
                  By connecting, you agree to our privacy policy and terms of
                  service.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
