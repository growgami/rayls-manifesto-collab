"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import "./Home.css";
import { SignatureStrip } from "./SignatureStrip";
import { SignatureModal } from "./SignatureModal/SignatureModal";
import { useTracking } from "@/features/tracking/hooks/useTracking.hook";
import { useAssetLoader } from "@/shared/hooks/useAssetLoader.hook";
import { HOME_ASSETS } from "./config/assets.config";

export const Home = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  // Silent tracking - monitors user activity without displaying data
  useTracking();

  // Preload all assets (backgrounds + card images)
  const { isLoading: isAssetsLoading, progress } = useAssetLoader({
    assets: HOME_ASSETS,
    onComplete: (results) => {
      const failedCount = results.filter((r) => !r.success).length;
      if (failedCount > 0) {
        console.warn(`${failedCount} assets failed to load, but continuing anyway`);
      }
    },
  });

  // Detect mobile on mount
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia('(max-width: 768px)').matches);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth'
    });
  };

  // Handle scroll for button visibility and parallax effect
  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const clientHeight = window.innerHeight;

      // Hide button when near bottom (within 100px)
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);

      // Track scroll for parallax (desktop only)
      if (!isMobile) {
        setScrollY(scrollTop);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial position

    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile]);

  // Show loading state while assets are loading
  if (isAssetsLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[var(--color-yellow)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[var(--color-foreground)] text-lg">Loading...</p>
          {progress.percentage > 0 && (
            <p className="text-[var(--color-foreground)] text-sm mt-2">
              {progress.percentage}%
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen"
      style={{
        backgroundImage: isMobile
          ? `url('/images/for-mobile.webp')`
          : `url('/images/background.webp')`,
        backgroundPosition: isMobile ? 'center top' : 'center 35%',
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Hero Section - Full viewport landing */}
      <div
        className="relative min-h-screen flex flex-col"
      >
        {/* Fixed header at top with parallax */}
        <header
          className="manifesto-header-fixed"
          style={!isMobile ? {
            transform: `translateY(${scrollY * 0.15}px)`,
            opacity: Math.max(0, 1 - scrollY / 500),
          } : undefined}
        >
          <Image
            src="/images/Rayls_Logo_Gradient.webp"
            alt="Rayls Logo"
            width={150}
            height={56}
          />
        </header>

        {/* Centered content with parallax */}
        <div
          className="manifesto-hero-content"
          style={!isMobile ? {
            transform: `translateY(${scrollY * 0.3}px)`,
            opacity: Math.max(0, 1 - scrollY / 600),
          } : undefined}
        >
          <h1 className="manifesto-hero-title">The Rayls Manifesto</h1>
          <h2 className="manifesto-hero-subtitle">
            The $100 Trillion Homecoming
          </h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="border-2 border-[var(--color-yellow)] text-[var(--color-yellow)] px-8 py-3 rounded-lg font-bold text-lg hover:opacity-90 transition-opacity bg-transparent"
          >
            Sign the Manifesto
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="manifesto-article">
        <p className="manifesto-tagline">
          A movement to rebuild global finance.
        </p>
        <p className="text-lg md:text-xl">
          For decades, opportunity belonged to the privileged.
        </p>
        <p className="text-lg md:text-xl">
          <span className="font-bold text-[var(--color-yellow)]">Access wasn&apos;t earned; it was permitted.</span>
        </p>
        <p className="text-base md:text-lg">
          Then a <span className="font-bold text-xl md:text-2xl">single block in 2009 changed the global economy forever</span>. One quiet signal: a line of code that carried news headlines of bailouts.
        </p>
        <p>
          Not just Bitcoin, but the <span className="font-bold">belief that finance could be open, transparent, and built for everyone</span>.
        </p>
        <p>
          From that moment, a movement began. Bold developers and thinkers came together to <span className="font-bold">build an open financial infrastructure</span>.
        </p>
        <p className="text-lg md:text-xl">
          <span className="font-bold">Crypto wasn&apos;t born from rebellion.</span>
        </p>
        <p>
          It was born from necessity, and sustained by hope:
        </p>
        <blockquote className="border-l-4 border-[var(--color-yellow)] pl-6 my-8 italic text-lg md:text-xl text-gray-300">
          The hope that the next generation wouldn&apos;t need permission to participate.
        </blockquote>
        <p className="text-lg md:text-xl font-semibold">
          Today, that hope becomes reality.
        </p>
      </main>

      <main className="manifesto-article" style={{ marginBottom: "0px" }}>
        <h2>When institutions began to listen</h2>
        <p>
          For years, the establishment dismissed this movement until the <span className="font-bold">old rails started to crack</span>.
        </p>
        <p>
          Cross-border payments slowed to a crawl. Settlement systems built decades ago became expensive to maintain.
        </p>
        <p className="text-lg md:text-xl">
          And for the first time, the institutions that defined the last century looked up and realized: <span className="font-bold text-[var(--color-yellow)]">global finance was no longer being built in boardrooms</span>, it was being coded in the open.
        </p>
        <p>
          This moment isn&apos;t about banks &quot;coming to crypto.&quot; It&apos;s about a shared evolution where both sides finally understand that <span className="font-bold">the rails must be rebuilt together</span>.
        </p>
        <p>
          Today, institutions see that the system must evolve. <span className="font-bold">Privacy, compliance, and transparency are non-negotiable</span> for a world that runs on trust and technology.
        </p>
        <p className="text-lg md:text-xl italic">
          That&apos;s where Rayls stands: not in opposition, but in translation.
        </p>
        <p>
          We&apos;re building the connective tissue that allows a century of institutional capital to <span className="font-bold">move onto open rails safely, compliantly, and at scale</span>.
        </p>

        <div className="my-8 space-y-2">
          <p>
            From Nuclea, which powers Brazil&apos;s interbank systems, to J.P. Morgan testing tokenized treasuries on public networks, the signs are clear.
          </p>
          <p>
            The financial world isn&apos;t turning its back on decentralization. It&apos;s embracing it carefully, deliberately, and permanently.
          </p>
          <p className="font-semibold">
            We built the rails that make this migration possible.
          </p>
          <p className="text-lg md:text-xl font-bold">
            And the migration is already happening.
          </p>
          <p className="text-xl md:text-2xl font-bold">
            Over the next five years, more than <span className="text-[var(--color-yellow)]">$100 trillion</span> of institutional capital will move <u>onchain</u> as a new operating standard.
          </p>
        </div>

        <h2>Making the invisible visible</h2>
        <p>
          For decades, the world&apos;s most <span className="font-bold">powerful wealth engines operated in silence</span>: private markets, exclusive debt, structured credit, receivables.
        </p>
        <p className="text-lg md:text-xl">
          You couldn&apos;t see them, and <span className="font-bold">you couldn&apos;t touch them</span> unless you already belonged.
        </p>
        <p>
          That&apos;s how inequality perpetuated itself. Not always by intent, but by design.
        </p>
        <p>
          <span className="font-bold">Old systems weren&apos;t built to scale access</span>, they were built to preserve order.
        </p>
        <p className="text-lg md:text-2xl font-bold text-[var(--color-yellow)] my-6">
          But what happens when technology makes the invisible visible?
        </p>
        <p>
          When you can tokenize an invoice in São Paulo, and a retail investor in Nairobi can profit from a piece of it safely and transparently?
        </p>
        <p>
          When a small factory can turn its receivables into instant liquidity without calling a bank, without waiting 90 days, without being charged for existing outside the system?
        </p>

        <div className="bg-gradient-to-r from-[var(--color-yellow)]/10 to-transparent border-l-4 border-[var(--color-yellow)] p-6 my-8 rounded-r-lg">
          <p className="mb-3">
            A migrant worker in Dubai can send tokenized deposits home instantly, without losing up to 10% through remittance fees and delays.
          </p>
          <p className="mb-3">
            A shop owner in Lagos can earn stable yield from verified receivables issued by major institutions on Rayls; something only banks and hedge funds could touch before.
          </p>
          <p className="mb-0">
            Fractional ownership means a student can invest $10, not $10 million.
          </p>
        </div>

        <p className="text-xl md:text-2xl font-bold">
          <span className="text-[var(--color-yellow)]">Tokenization is the great equalizer</span>, and we&apos;ve built it into the rail itself.
        </p>

        <div className="bg-[var(--color-yellow)]/5 border border-[var(--color-yellow)]/30 p-6 my-8 rounded-lg">
          <p className="mb-3">
            24/7 markets mean that access no longer closes at 5 p.m.
          </p>
          <p className="mb-3">
            Smart contracts mean yield is automated, not extracted.
          </p>
          <p className="mb-0 italic">
            This is how education becomes empowerment, not by lectures, but by participation.
          </p>
        </div>

        <p>
          When people understand how value flows, they learn to shape it.
        </p>
        <p className="text-lg md:text-xl font-bold">
          Every invoice tokenized, every asset fractionalized, is a lesson written in code: <i className="text-[var(--color-yellow)]">this is what inclusion looks like</i>.
        </p>

        <h2>Yield, but with purpose</h2>
        <p>
          In crypto&apos;s early days, yield often meant risk; unsustainable games chasing unsustainable numbers.
        </p>
        <p className="text-lg md:text-xl">
          But the future of yield isn&apos;t speculation. <span className="font-bold">It&apos;s utility</span>.
        </p>
        <p>
          <span className="font-bold">The assets we&apos;re tokenizing (real, regulated, verifiable) are rooted in the physical economy.</span>
        </p>
        <p>
          <span className="font-bold">Short-term U.S. Treasuries, receivables, and private credit are the foundations of global trade.</span>
        </p>
        <p>
          Now, they can be accessed directly, with trust and compliance built in at the protocol level.
        </p>
        <p>
          That&apos;s why partners like LayerZero, Tether, Obligate, and Compass matter.
        </p>
        <p>
          They&apos;re building vaults, liquidity pools, and automated debt lifecycles that finally make <span className="font-bold">institutional-grade yield accessible to everyone transparently, legally, and globally</span>.
        </p>
        <p className="text-lg md:text-xl font-semibold my-4">
          This is how we redefine return.
        </p>
        <p>
          Because yield is not just about numbers on a screen.
        </p>
        <p className="text-lg md:text-2xl font-bold text-[var(--color-yellow)] my-6">
          It&apos;s about the dignity of being part of a system that no longer excludes you.
        </p>
        <p>
          When someone in Buenos Aires or Bangalore earns 9% APY from verified, tokenized receivables, that&apos;s not DeFi hype. That&apos;s financial education in action.
        </p>

        <div className="my-6 space-y-2">
          <p className="font-bold text-lg">
            They&apos;re learning how money moves.
          </p>
          <p className="font-bold text-lg">
            They&apos;re learning how value grows.
          </p>
        </div>

        <p>
          And they&apos;re doing it inside a system that was once closed to them.
        </p>
        <p>
          Compliance isn&apos;t the enemy here; it&apos;s the safety net that lets people step confidently onto the new rails.
        </p>
        <p className="italic">
          Every compliant token, every verified asset, is a brick in a bridge between trust and freedom.
        </p>

        <h2>The rails we lay</h2>
        <p className="text-lg md:text-xl">
          <span className="font-bold">Rayls</span> builds compliant, programmable rails for institutional assets to move onto public blockchains. Bringing reliable liquidity and new assets to everyone globally.
        </p>
        <p>
          This story isn&apos;t about overthrowing the old world. It&apos;s about completing it.
        </p>
        <p className="text-lg md:text-xl font-bold">
          We&apos;re here to rebuild trust where uncertainty once lived, and to extend opportunity where exclusion once ruled.
        </p>
        <p>
          Rayls exists because our team understands both sides of the bridge.
        </p>
        <p>
          We&apos;ve lived the discipline of traditional finance and the daring of decentralized systems.
        </p>
        <p>
          We know how regulation breathes, and how blockchains think.
        </p>
        <p>
          And we&apos;ve built a network where they can finally speak the same language.
        </p>
        <p className="italic">
          Our rails aren&apos;t just code. They&apos;re conviction that privacy can be governed, compliance can be automated, and freedom can be structured.
        </p>
        <p>
          That every policy, every ledger entry, every yield flow can coexist on public infrastructure without compromising safety or sovereignty.
        </p>
        <p className="text-xl md:text-2xl font-bold my-6">
          We are building the tracks where <span className="text-[var(--color-yellow)]">$100 trillion</span> of institutional liquidity meets billions of people hungry for access.
        </p>
        <p>
          Where banks, builders, and communities learn to <span className="font-bold">operate on common ground</span>.
        </p>
        <p>
          It&apos;s about bringing <span className="font-bold">6 billion bank users into a system that finally respects their participation</span>.
        </p>
        <p>
          It&apos;s about a world where every wallet is a gateway to opportunity, and every transaction is a lesson in ownership.
        </p>
        <p className="text-lg md:text-xl font-semibold my-4">
          This is the moment we&apos;ve been building toward.
        </p>
        <p className="font-bold">
          We are Rayls.
        </p>
        <p className="font-bold">
          We are the rails for the next century of finance.
        </p>
        <p className="text-lg md:text-xl font-bold">
          And as the <span className="text-[var(--color-yellow)]">world&apos;s liquidity moves <u>onchain</u></span>, we will make sure <span className="text-[var(--color-yellow)]">it flows through rails built for everyone</span>.
        </p>

        <h2 className="text-3xl md:text-4xl mt-12"><i>The Time Is Now</i></h2>
        <p className="text-xl md:text-2xl font-bold mb-8">The $100 trillion migration has begun.</p>

        <div className="flex justify-center my-12">
          <button
            onClick={() => setIsModalOpen(true)}
            className="border-2 border-[var(--color-yellow)] text-[var(--color-yellow)] px-12 py-4 rounded-lg font-bold text-xl hover:bg-[var(--color-yellow)] hover:text-black transition-all duration-300 bg-transparent"
          >
            Sign the Manifesto
          </button>
        </div>
      </main>

      <div className="signature-strip-embedded flex justify-center">
        <SignatureStrip setIsModalOpen={setIsModalOpen} />
      </div>

      {showScrollButton && !isModalOpen && (
        <button
          onClick={scrollToBottom}
          className="fixed bottom-6 right-6 bg-white text-black p-4 rounded-full shadow-lg hover:opacity-90 transition-opacity z-[10001]"
          aria-label="Skip to signature"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3"
            />
          </svg>
        </button>
      )}

      <SignatureModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};
