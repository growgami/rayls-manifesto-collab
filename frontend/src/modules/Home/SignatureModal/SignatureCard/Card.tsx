"use client";

import { useRef, useState, useMemo } from "react";
import { downloadSignatureCard } from "./util/download.util";
import { MilestoneConfig } from "./config/milestone.config";
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

  // Get milestone configuration for this signature number
  const { milestone } = useMemo(
    () => MilestoneConfig.getMilestoneForSignature(signatureNumber),
    [signatureNumber]
  );

  // Generate CSS custom properties for dynamic styling
  const cardStyles = useMemo(() => {
    const { cardStyling = {} } = milestone;

    return {
      "--badge-gradient": MilestoneConfig.getBadgeGradientCSS(milestone),
      "--card-bg-image": cardStyling.backgroundImage
        ? `url(${cardStyling.backgroundImage})`
        : undefined,
      "--card-bg-color": cardStyling.backgroundColor,
    } as React.CSSProperties;
  }, [milestone]);

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
    <>
      {/* Hidden card for download functionality - used by both desktop and mobile */}
      <div
        className="card-canvas"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: -9999,
          opacity: 0,
          pointerEvents: 'none'
        }}
      >
        <div className="card-container" ref={cardRef} style={cardStyles}>
          <div className="card-header">
            <div className="card-profile">
              <img
                src={user.profileImageUrl}
                alt={`${user.name}'s profile`}
                width={80}
                height={80}
                className="card-avatar"
              />
              <div className="card-user-info">
                <h3 className="card-name">{user.name}</h3>
                <p className="card-username">@{user.username}</p>
              </div>
            </div>
          </div>
          <div className="card-signature-badge">
            <span className="card-badge-number">{signatureNumber.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Desktop: Visible card preview with buttons below */}
      <div className="card-canvas hidden md:block">
        <div className="card-container" style={cardStyles}>
          <div className="card-header">
            <div className="card-profile">
              <img
                src={user.profileImageUrl}
                alt={`${user.name}'s profile`}
                width={80}
                height={80}
                className="card-avatar"
              />
              <div className="card-user-info">
                <h3 className="card-name">{user.name}</h3>
                <p className="card-username">@{user.username}</p>
              </div>
            </div>
          </div>
          <div className="card-signature-badge">
            <span className="card-badge-number">{signatureNumber.toLocaleString()}</span>
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
              const tweetText = `I just signed the Rayls Manifesto as signature #${signatureNumber.toLocaleString()}! 🚂\n\n`;
              const tweetUrl = 'https://rayls.io';
              const twitterIntentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(tweetUrl)}`;
              window.open(twitterIntentUrl, '_blank', 'width=550,height=420');
            }}
            className="flex-1 rounded-lg bg-[#1DA1F2] px-6 py-3 font-semibold text-white transition-all hover:bg-[#1a8cd8]"
          >
            Share on 𝕏
          </button>
        </div>
      </div>

      {/* Mobile: Centered buttons only */}
      <div className="flex w-full max-w-md flex-col gap-3 px-4 md:hidden">
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="w-full rounded-lg bg-white px-6 py-3 font-semibold text-black transition-all hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isDownloading ? "Downloading..." : "Download Card"}
        </button>

        <button
          onClick={() => {
            const tweetText = `I just signed the Rayls Manifesto as signature #${signatureNumber.toLocaleString()}! 🚂\n\n`;
            const tweetUrl = 'https://rayls.io';
            const twitterIntentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(tweetUrl)}`;
            window.open(twitterIntentUrl, '_blank', 'width=550,height=420');
          }}
          className="w-full rounded-lg bg-[#1DA1F2] px-6 py-3 font-semibold text-white transition-all hover:bg-[#1a8cd8]"
        >
          Share on 𝕏
        </button>
      </div>
    </>
  );
};
