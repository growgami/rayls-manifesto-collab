"use client";

import { useState } from "react";
import "./SignatureModal.css";

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SignatureModal = ({ isOpen, onClose }: SignatureModalProps) => {
  const [isClosing, setIsClosing] = useState(false);

  if (!isOpen && !isClosing) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  };

  return (
    <div className={`modal-overlay ${isClosing ? "closing" : ""}`} onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Sign in with X</h2>
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
                Connect your X account to verify your signature and unlock a
                personalized share card.
              </p>
            </div>
            <div className="modal-actions">
              <button
                className="modal-sign-btn"
                onClick={() => {
                  window.location.href =
                    "https://twitter.com/i/oauth2/authorize?client_id=c1JLV2E5RVVTUWVYc244WGlrZ3Y6MTpjaQ&scope=users.read%20tweet.read%20offline.access&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fauth%2Fcallback%2Ftwitter&state=EQKrr15yw4qUmOB6TtJr3sSADMogvybEizGHilkvX_U&code_challenge=LjucxyV1br-I6yAvtUznteNL0uNtf_BCLUMWMYVubNk&code_challenge_method=S256";
                }}
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
