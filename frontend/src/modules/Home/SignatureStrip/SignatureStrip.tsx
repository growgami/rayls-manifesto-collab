"use client";

import { useEffect } from "react";
import { useAuth } from "@/features/signing/modules/auth/hooks/useAuth.hook";
import { useSignatureCount } from "@/features/signing/modules/signature/hooks/useSignatureCount.hook";
import "./SignatureStrip.css";

interface SignatureStripProps {
  setIsModalOpen?: (isOpen: boolean) => void;
}

export const SignatureStrip = ({ setIsModalOpen }: SignatureStripProps) => {
  const { isAuthenticated } = useAuth();
  const { data: signatureCount, isLoading: countLoading } = useSignatureCount();

  // Format number with k/m suffix
  const formatCount = (count: number): string => {
    const boostedCount = count + 500;

    if (boostedCount < 1000) {
      return boostedCount.toString();
    } else if (boostedCount < 1000000) {
      return (boostedCount / 1000).toFixed(1) + 'k';
    } else {
      return (boostedCount / 1000000).toFixed(1) + 'm';
    }
  };

  // Auto-open modal if user just authenticated
  useEffect(() => {
    if (isAuthenticated && setIsModalOpen) {
      setIsModalOpen(true);
    }
  }, [isAuthenticated, setIsModalOpen]);

  return (
    <div className="signature-strip">
      <div className="signature-row">
        <p className="sig-title">SIGNATURES</p>
        <p className="sig-count">
          {countLoading ? '...' : formatCount(signatureCount || 0)}
        </p>
      </div>
      <button className="sig-btn" onClick={() => setIsModalOpen?.(true)}>
        {isAuthenticated ? "View My Signature" : "Sign in with X"}
      </button>
      <p className="sig-sub">
        {isAuthenticated
          ? "Click to view your signature card."
          : "Connect your account to add your signature."}
      </p>
    </div>
  );
};
