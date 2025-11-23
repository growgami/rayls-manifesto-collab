"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/features/signing/modules/auth/hooks/useAuth.hook";
import "./SignatureStrip.css";
import { SignatureModal } from "../SignatureModal";

export const SignatureStrip = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isAuthenticated } = useAuth();

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
          <p className="sig-count">62,458</p>
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
