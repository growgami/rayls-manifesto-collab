"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/features/signing/modules/auth/hooks/useAuth.hook";
import { useSignatureCount } from "@/features/signing/modules/signature/hooks/useSignatureCount.hook";
import "./SignatureStrip.css";
import { SignatureModal } from "../SignatureModal";

interface SignatureStripProps {
  isModalOpen?: boolean;
  setIsModalOpen?: (isOpen: boolean) => void;
}

export const SignatureStrip = ({ isModalOpen: externalIsModalOpen, setIsModalOpen: externalSetIsModalOpen }: SignatureStripProps) => {
  const [internalIsModalOpen, setInternalIsModalOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const { data: signatureCount, isLoading: countLoading } = useSignatureCount();

  // Use external state if provided, otherwise use internal state
  const isModalOpen = externalIsModalOpen !== undefined ? externalIsModalOpen : internalIsModalOpen;
  const setIsModalOpen = externalSetIsModalOpen || setInternalIsModalOpen;

  // Auto-open modal if user just authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setIsModalOpen(true);
    }
  }, [isAuthenticated]);

  return (
    <>
      <div className="signature-strip">
        <div className="signature-row">
          <p className="sig-title">SIGNATURES</p>
          <p className="sig-count">
            {countLoading ? '...' : (signatureCount?.toLocaleString() || '0')}
          </p>
        </div>
        <button className="sig-btn" onClick={() => setIsModalOpen(true)}>
          {isAuthenticated ? "View My Signature" : "Sign in with X"}
        </button>
        <p className="sig-sub">
          {isAuthenticated
            ? "Click to view your signature card."
            : "Connect your account to add your signature."}
        </p>
      </div>
      <SignatureModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
