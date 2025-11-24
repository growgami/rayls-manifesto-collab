"use client";

import Image from "next/image";

import "./Home.css";
import { SignatureStrip } from "./SignatureStrip";
import { useTracking } from "@/features/tracking/hooks/useTracking.hook";

export const Home = () => {
  // Silent tracking - monitors user activity without displaying data
  useTracking();

  return (
    <>
      <SignatureStrip />

      <div
        // className="relative h-[160vh] flex mainContainer"
        className="relative h-[200vh] flex mainContainer"
        style={{
          backgroundImage: 'url("/images/background.png")',
        }}
      >
        <main className="manifesto-article">
          <header className="manifesto-header">
            <Image
              src="/images/Rayls_Logo_Gradient.png"
              alt="Description"
              width={150}
              height={56}
            />
          </header>
          <h1>The Rayls manifesto: the $100 trillion homecoming</h1>
          <h2 className="second-heading !text-[var(--color-yellow)]">
            The freedom that started it all.
          </h2>
          <p>
            We grew up in a world where money decided who could dream—where
            access wasn’t about merit, but permission. Those limitations shaped
            entire generations, creating a system where opportunity belonged to
            the privileged rather than the capable.
          </p>
          <p>
            Then in 2009, as the global economy cracked open and communities
            lost their livelihoods, a quiet signal appeared: a line of code
            carrying a newspaper headline about bailouts. That block wasn’t just
            the start of Bitcoin—it was a declaration that the system had to
            change.
          </p>
          <p>
            From that moment, a movement began. Developers, thinkers, and
            dreamers came together to build open financial infrastructure, not
            out of rebellion, but out of necessity. They wanted to prove that
            finance could be transparent, programmable, and fair—something the
            old system had failed to offer.
          </p>
          <p>
            Crypto may have been born from frustration, but what sustained it
            was hope. Hope that education, technology, and collective effort
            could rebuild what was broken. Hope that the next generation
            wouldn’t have to ask for access, but inherit it. And at Rayls, that
            same spirit still drives us forward.
          </p>
        </main>
      </div>
      <main className="manifesto-article" style={{ marginBottom: "0px" }}>
        <h2>When institutions began to listen</h2>
        <p>
          For years, the establishment dismissed this movement—until the old
          rails finally began to crack. Cross-border payments slowed to a crawl,
          and settlement systems built decades ago became too expensive to
          maintain. For the first time, the institutions that defined the last
          century looked up and realized that the future of finance wasn’t being
          rebuilt in boardrooms; it was being coded in the open.
        </p>
        <p>
          This moment isn’t about banks “coming to crypto.” It represents a
          shared evolution in which both sides understand that the rails must be
          rebuilt together. Institutions now see that privacy, compliance, and
          transparency are not optional—they are the prerequisites for a world
          that runs on trust, technology, and global connectivity.
        </p>
        <p>
          That’s where Rayls stands: not in opposition, but in translation.
          We’re building the connective tissue that allows a century of
          institutional capital to move onto open rails safely, compliantly, and
          at scale. From Nuclea, which powers Brazil’s interbank systems, to
          J.P. Morgan testing tokenized treasuries on public networks, the
          signals of this shift are undeniable.
        </p>
        <p>
          The financial world isn’t turning its back on decentralization—it’s
          embracing it carefully, deliberately, and permanently. We built the
          rails that make this migration possible, and the migration is already
          underway. Over the next five years, more than $100 trillion of
          institutional capital will move onchain, establishing a new operating
          standard for global finance.
        </p>
        <h2>Making the invisible visible</h2>
        {/* <h3>Breaking the Chains of Traditional Finance</h3> */}
        <p>
          For decades, the world’s most powerful wealth engines operated in
          silence—private markets, exclusive debt, structured credit,
          receivables. You couldn’t see them, and you couldn’t touch them unless
          you already belonged. That’s how inequality perpetuated itself, not
          always by intent, but by design. Old systems weren’t built to scale
          access; they were built to preserve order.
        </p>
        <p>
          But technology changed the equation. It made the invisible visible.
          Today, you can tokenize an invoice in São Paulo, and a retail investor
          in Nairobi can profit from a piece of it safely and transparently. A
          small factory can turn its receivables into instant liquidity without
          calling a bank, without waiting 90 days, without being penalized for
          existing outside the old financial system.
        </p>

        <p>
          That’s the promise of tokenization. It’s not just a technical
          term—it’s a moral turning point. Fractional ownership means a student
          can invest $10 instead of $10 million. Twenty-four-seven markets mean
          access no longer closes at 5 p.m. Smart contracts mean yield is
          automated, not extracted. This shift redefines who gets to
          participate—and when.
        </p>
        <p>
          And this is where education becomes empowerment. Not through lectures,
          but through participation. When people understand how value flows,
          they learn how to shape it. Every invoice tokenized, every asset
          fractionalized, becomes a lesson written in code—a demonstration of
          what true financial inclusion looks like.
        </p>
        <h2>Yield, but with purpose</h2>
        <p>
          In crypto’s early days, yield often meant risk—unsustainable games
          chasing unsustainable numbers. But the future of yield isn’t
          speculation; it’s utility. The assets being tokenized today—real,
          regulated, verifiable—are rooted in the physical economy. Short-term
          U.S. Treasuries, receivables, and private credit form the backbone of
          global trade, and now they can be accessed directly, with trust and
          compliance built into the protocol itself.
        </p>

        <p>
          That’s why partners like LayerZero, Tether, Obligate, and Compass
          matter. They’re building vaults, liquidity pools, and automated debt
          lifecycles that make institutional-grade yield accessible to
          everyone—transparently, legally, and globally. This is how return gets
          redefined. Yield becomes more than numbers on a screen; it becomes the
          dignity of participating in a system that no longer shuts people out.
          When someone in Buenos Aires or Bangalore earns 9% APY from verified,
          tokenized receivables, that’s not DeFi hype—it’s financial education
          in action.
        </p>
        <p>
          People are learning how money moves, how value grows, and they’re
          doing it inside a system that was once closed to them. In this new
          world, compliance isn’t the enemy; it’s the safety net that lets
          people step confidently onto the new rails. Every compliant token and
          every verified asset becomes a brick in a bridge—connecting trust with
          freedom, and opening the door to a more inclusive financial future.
        </p>
        <h2>The rails we lay.</h2>
        <p>
          This story isn’t about overthrowing the old world—it’s about
          completing it. We’re here to rebuild trust where uncertainty once
          lived and extend opportunity where exclusion once ruled. Rayls exists
          because our team understands both sides of the bridge. We’ve lived the
          discipline of traditional finance and the daring of decentralized
          systems, and we know how regulation breathes and how blockchains
          think.
        </p>
        <p>
          That dual understanding is why we’ve built a network where both worlds
          can finally speak the same language. Our rails aren’t just code;
          they’re conviction—conviction that privacy can be governed, compliance
          can be automated, and freedom can be structured. We believe every
          policy, every ledger entry, and every yield flow can coexist on public
          infrastructure without compromising safety or sovereignty.
        </p>
        <p>
          This is the foundation for a new financial era. We’re building the
          tracks where $100 trillion of institutional liquidity meets billions
          of people hungry for access—where banks, builders, and communities
          operate on common ground. It’s about bringing six billion bank users
          into a system that finally respects their participation and gives them
          tools that were once reserved for the privileged.
        </p>
        <p>
          In this future, every wallet becomes a gateway to opportunity, and
          every transaction becomes a lesson in ownership. This is the moment
          we’ve been building toward. We are Rayls. We are the rails for the
          next century of finance. And as the world’s liquidity moves onchain,
          we’ll ensure it flows through rails built for everyone.
        </p>
        <h2>The Time is Now</h2>
        <p>Don&apos;t wait. The $100 trillion migration is already underway.</p>
        <p>
          The question isn&apos;t whether you&apos;ll participate—it&apos;s whether you&apos;ll be
          early or late.
        </p>
        <p className="font-bold text-white!">
          Be part of the future. Take control of your financial freedom today.
        </p>
        <p className="font-bold text-[26px]">
          Join the movement. Sign the manifesto.
        </p>
        <div className="manifesto-signature">
          <p>
            <i>
              The rails are laid. The destination is clear. All aboard the
              future of finance.
            </i>
          </p>
        </div>
      </main>
    </>
  );
};
