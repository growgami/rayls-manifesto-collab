"use client";

import { useState } from "react";
import "./SignatureStrip.css";
import { SignatureModal } from "../SignatureModal";

export const SignatureStrip = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="signature-strip">
        <div className="signature-row">
          <p className="sig-title">SIGNATURES</p>
          <p className="sig-count">62,458</p>
        </div>
        <button className="sig-btn" onClick={() => setIsModalOpen(true)}>
          Sign in with X
        </button>
        <p className="sig-sub">Connect your account to add your signature.</p>
      </div>
      <SignatureModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
