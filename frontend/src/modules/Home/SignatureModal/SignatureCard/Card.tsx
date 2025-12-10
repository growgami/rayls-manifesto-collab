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
  isProcessing?: boolean;
}

export const Card = ({ user, signatureNumber, isProcessing }: CardProps) => {
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

  // Determine CSS class names based on layout variant
  const cardContainerClass = useMemo(() => {
    const { cardStyling = {} } = milestone;
    return cardStyling.layoutVariant === 'common'
      ? 'card-container card-container--common'
      : 'card-container';
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

  // Show loading state while processing
  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12 px-4">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white"></div>
        <h3 className="text-xl font-semibold text-white text-center">
          Generating your signature card...
        </h3>
        <p className="text-sm text-gray-400 text-center max-w-md">
          This usually takes a few seconds. Please don&apos;t close this window.
        </p>
      </div>
    );
  }

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
        <div className={cardContainerClass} ref={cardRef} style={cardStyles}>
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
            <span className="card-badge-number">#{signatureNumber.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Desktop: Visible card preview with buttons below */}
      <div className="card-canvas hidden md:block">
        <div className={cardContainerClass} style={cardStyles}>
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
            <span className="card-badge-number">#{signatureNumber.toLocaleString()}</span>
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
              const tweetText = `The Rayls manifesto is live. Get yours before the train leaves the station.\n
#${signatureNumber.toLocaleString()}!\n\n`;
              const tweetUrl = 'https://raylsmanifesto.com';
              const twitterIntentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(tweetUrl)}`;
              window.open(twitterIntentUrl, '_blank', 'width=550,height=420');
            }}
            className="flex-1 rounded-lg bg-[#1DA1F2] px-6 py-3 font-semibold text-white transition-all hover:bg-[#1a8cd8]"
          >
            Share on 𝕏
          </button>
        </div>
      </div>

      {/* Mobile: Preview card with buttons below */}
      <div className="flex w-full max-w-md flex-col items-center gap-4 px-4 md:hidden">
        {/* Mobile card preview - scaled down */}
        <div className="flex w-full justify-center -my-26">
          <div className="card-canvas" style={{ transform: 'scale(0.4)', transformOrigin: 'center center' }}>
            <div className={cardContainerClass} style={cardStyles}>
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
                <span className="card-badge-number">#{signatureNumber.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile action buttons */}
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="w-full rounded-lg bg-white px-6 py-3 font-semibold text-black transition-all hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isDownloading ? "Downloading..." : "Download Card"}
        </button>

        <button
          onClick={() => {
            const tweetText = `The Rayls manifesto just went live. The early passports are disappearing fast! Get yours before the train leaves the station.\n
#${signatureNumber.toLocaleString()}! \n\n`;
              const tweetUrl = 'https://raylsmanifesto.com';
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
