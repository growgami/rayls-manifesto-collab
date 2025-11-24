"use client";

import Image from "next/image";
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
  return (
    <div className="card-canvas">
      <div className="card-container">
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
    </div>
  );
};
