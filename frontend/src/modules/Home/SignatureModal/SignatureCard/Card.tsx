"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { downloadSignatureCard } from "./util/download.util";
import "./Card.css";

interface CardProps {
  user: {
    name: string;
    username: string;
    profileImageUrl: string;
  };
  signatureNumber: number;
}

export const Card = ({ user, signatureNumber }: CardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!cardRef.current || isDownloading) return;

    setIsDownloading(true);
    try {
      await downloadSignatureCard({
        cardRef: cardRef.current,
        username: user.username,
        signatureNumber,
      });
    } catch (error) {
      // Error is already logged in the utility function
      alert("Failed to download signature card. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="card-canvas">
      <div className="card-container" ref={cardRef}>
      <div className="card-header">
        <div className="card-profile">
          <Image
            src={user.profileImageUrl}
            alt={`${user.name}'s profile`}
            width={64}
            height={64}
            className="card-avatar"
          />
          <div className="card-user-info">
            <h3 className="card-name">{user.name}</h3>
            <p className="card-username">@{user.username}</p>
          </div>
        </div>
        <div className="card-signature-badge">
          <span className="card-badge-label">Signature</span>
          <span className="card-badge-number">#{signatureNumber.toLocaleString()}</span>
        </div>
      </div>

      <div className="card-divider"></div>

      <div className="card-quote-section">
        <p className="card-quote">
          &ldquo;The rails are laid. The destination is clear. All aboard the future of finance.&rdquo;
        </p>
        <p className="card-attribution"> The Rayls Manifesto</p>
      </div>

      <div className="card-footer">
        <p className="card-footer-text">
          Thank you for signing the manifesto and joining the movement.
        </p>
      </div>
    </div>

    <div className="mt-6 flex w-full gap-3">
      <button
        onClick={handleDownload}
        disabled={isDownloading}
        className="flex-1 rounded-lg bg-white px-6 py-3 font-semibold text-black transition-all hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isDownloading ? "Downloading..." : "Download Card"}
      </button>

      <button
        onClick={() => {
          const tweetText = `I just signed the Rayls Manifesto as signature #${signatureNumber.toLocaleString()}! 🚂\n\n"The rails are laid. The destination is clear. All aboard the future of finance."\n\n`;
          const tweetUrl = 'https://rayls.io'; // Replace with your actual URL
          const twitterIntentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(tweetUrl)}`;
          window.open(twitterIntentUrl, '_blank', 'width=550,height=420');
        }}
        className="flex-1 rounded-lg bg-[#1DA1F2] px-6 py-3 font-semibold text-white transition-all hover:bg-[#1a8cd8] disabled:cursor-not-allowed disabled:opacity-50"
      >
        Share on 𝕏
      </button>
    </div>
    </div>
  );
};
