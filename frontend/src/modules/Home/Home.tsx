"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import "./Home.css";
import { SignatureStrip } from "./SignatureStrip";
import { useTracking } from "@/features/tracking/hooks/useTracking.hook";
import { useAssetLoader } from "@/shared/hooks/useAssetLoader.hook";
import { HOME_ASSETS } from "./config/assets.config";

export const Home = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

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

  // Handle scroll button visibility based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const clientHeight = window.innerHeight;

      // Hide button when near bottom (within 100px)
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial position

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    <>
      <div className="hidden md:block">
        <SignatureStrip isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} />
      </div>

      <div
        className="relative h-auto md:h-[200vh] flex bg-no-repeat bg-fixed bg-cover shadow-[inset_0_-50px_50px_-30px_rgba(0,0,0,0.7)]"
        style={{
          backgroundImage: `url('/images/${isMobile ? 'for-mobile' : 'background'}.webp')`,
          backgroundPosition: isMobile ? 'center top' : 'center 35%'
        }}
      >
        <main className="manifesto-article manifesto-article-top">
          <header className="manifesto-header">
            <Image
              src="/images/Rayls_Logo_Gradient.webp"
              alt="Description"
              width={150}
              height={56}
            />
          </header>
          <h1>The Rayls Manifesto</h1>
          <h2 className="second-heading !text-[var(--color-white)]">
            The $100 Trillion Homecoming
          </h2>
          <p className="font-bold">
            A movement to rebuild global finance on open rails.
          </p>
          <p>
            For decades, opportunity belonged to the privileged.
          </p>
          <p>
            <span className="font-bold">Access wasn&apos;t earned; it was permitted.</span>
          </p>
          <p>
            Then a single block in 2009 changed everything. When <span className="font-bold">the global economy cracked open, and entire communities lost their livelihoods, one quiet signal appeared</span>: a line of code carrying a newspaper headline about bailouts.
          </p>
          <p>
            Not just Bitcoin, but <span className="font-bold">the belief that finance could be open, transparent, and built for everyone</span>.
          </p>
          <p>
            From that moment, a movement began. Developers, thinkers, and dreamers came together to <span className="font-bold">build an open financial infrastructure</span>.
          </p>
          <p>
            <span className="font-bold">Crypto wasn&apos;t born from rebellion.</span>
          </p>
          <p>
            It was born from necessity, and sustained by hope:
          </p>
          <p>
            <i>The hope that the next generation wouldn&apos;t need permission to participate.</i>
          </p>
          <p>
            Today, that hope becomes reality.
          </p>
        </main>
      </div>
      <main className="manifesto-article" style={{ marginBottom: "0px" }}>
        <h2>When institutions began to listen</h2>
        <p>
          For years, the establishment dismissed this movement until <span className="font-bold">the old rails started to crack</span>.
        </p>
        <p>
          Cross-border payments slowed to a crawl. Settlement systems built decades ago became expensive to maintain.
        </p>
        <p>
          And for the first time, the institutions that defined the last century looked up and realized: <span className="font-bold">global finance was no longer being built in boardrooms, it was being coded in the open</span>.
        </p>
        <p>
          This moment isn&apos;t about banks &quot;coming to crypto.&quot; It&apos;s about a shared evolution where both sides finally understand that <span className="font-bold">the rails must be rebuilt together</span>.
        </p>
        <p>
          Today, institutions see that the system must evolve. <span className="font-bold">Privacy, compliance, and transparency are non-negotiable</span> for a world that runs on trust and technology.
        </p>
        <p>
          That&apos;s where Rayls stands: not in opposition, but in translation.
        </p>
        <p>
          We&apos;re building the connective tissue that allows a century of institutional capital to <span className="font-bold">move onto open rails safely, compliantly, and at scale</span>.
        </p>
        <p>
          From Nuclea, which powers Brazil&apos;s interbank systems, to J.P. Morgan testing tokenized treasuries on public networks, the signs are clear.
        </p>
        <p>
          The financial world isn&apos;t turning its back on decentralization. It&apos;s embracing it carefully, deliberately, and permanently.
        </p>
        <p>
          We built the rails that make this migration possible.
        </p>
        <p>
          <span className="font-bold">And the migration is already happening.</span>
        </p>
        <p>
          Over the next five years, more than <span className="font-bold">$100 trillion</span> of institutional capital will move <u>onchain</u> as a new operating standard.
        </p>
        <h2>Making the invisible visible</h2>
        <p>
          For decades, the world&apos;s most <span className="font-bold">powerful wealth engines operated in silence</span>: private markets, exclusive debt, structured credit, receivables.
        </p>
        <p>
          You couldn&apos;t see them, and <span className="font-bold">you couldn&apos;t touch them</span> unless you already belonged.
        </p>
        <p>
          That&apos;s how inequality perpetuated itself. Not always by intent, but by design.
        </p>
        <p>
          <span className="font-bold">Old systems weren&apos;t built to scale access</span>; they were built to preserve order.
        </p>
        <p>
          But <span className="font-bold">what happens when technology makes the invisible visible?</span>
        </p>
        <p>
          When you can tokenize an invoice in São Paulo, and a retail investor in Nairobi can profit from a piece of it safely and transparently?
        </p>
        <p>
          When a small factory can turn its receivables into instant liquidity without calling a bank, without waiting 90 days, without being charged for existing outside the system?
        </p>
        <p>
          A migrant worker in Dubai can send tokenized deposits home instantly, without losing up to 10% through remittance fees and delays.
        </p>
        <p>
          A shop owner in Lagos can earn stable yield from verified receivables issued by major institutions on Rayls; something only banks and hedge funds could touch before.
        </p>
        <p>
          Fractional ownership means a student can invest $10, not $10 million.
        </p>
        <p>
          <span className="font-bold">Tokenization is the great equalizer, and we&apos;ve built it into the rail itself.</span>
        </p>
        <p>
          24/7 markets mean that access no longer closes at 5 p.m.
        </p>
        <p>
          Smart contracts mean yield is automated, not extracted.
        </p>
        <p>
          This is how education becomes empowerment, not by lectures, but by participation.
        </p>
        <p>
          When people understand how value flows, they learn to shape it.
        </p>
        <p>
          <span className="font-bold">Every invoice tokenized, every asset fractionalized, is a lesson written in code: <i>this is what inclusion looks like</i>.</span>
        </p>
        <h2>Yield, but with purpose</h2>
        <p>
          In crypto&apos;s early days, yield often meant risk; unsustainable games chasing unsustainable numbers.
        </p>
        <p>
          But the future of yield isn&apos;t speculation. Its utility.
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
        <p>
          This is how we redefine return.
        </p>
        <p>
          Because yield is not just about numbers on a screen.
        </p>
        <p>
          <span className="font-bold">It&apos;s about the dignity of being part of a system that no longer excludes you.</span>
        </p>
        <p>
          When someone in Buenos Aires or Bangalore earns 9% APY from verified, tokenized receivables, that&apos;s not DeFi hype. That&apos;s financial education in action.
        </p>
        <p>
          They&apos;re learning how money moves.
        </p>
        <p>
          They&apos;re learning how value grows.
        </p>
        <p>
          And they&apos;re doing it inside a system that was once closed to them.
        </p>
        <p>
          Compliance isn&apos;t the enemy here; it&apos;s the safety net that lets people step confidently onto the new rails.
        </p>
        <p>
          Every compliant token, every verified asset, is a brick in a bridge between trust and freedom.
        </p>
        <h2>The rails we lay</h2>
        <p>
          <span className="font-bold">Rayls</span> builds compliant, programmable rails for institutional assets to move onto public blockchains. Bringing reliable liquidity and new assets to everyone globally.
        </p>
        <p>
          This story isn&apos;t about overthrowing the old world. It&apos;s about completing it.
        </p>
        <p>
          <span className="font-bold">We&apos;re here to rebuild trust where uncertainty once lived, and to extend opportunity where exclusion once ruled.</span>
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
        <p>
          Our rails aren&apos;t just code. They&apos;re conviction that privacy can be governed, compliance can be automated, and freedom can be structured.
        </p>
        <p>
          That every policy, every ledger entry, every yield flow can coexist on public infrastructure without compromising safety or sovereignty.
        </p>
        <p>
          <span className="font-bold">We are building the tracks where $100 trillion of institutional liquidity meets billions of people hungry for access.</span>
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
        <p>
          This is the moment we&apos;ve been building toward.
        </p>
        <p>
          We are Rayls.
        </p>
        <p>
          We are the rails for the next century of finance.
        </p>
        <p>
          And as the <span className="font-bold">world&apos;s liquidity moves</span> <u>onchain</u>, <span className="font-bold">we will make sure it flows through rails built for everyone</span>.
        </p>
        <h2><i>The Time Is Now</i></h2>
        <p>The $100 trillion migration has begun.</p>
        <p>
          You choose whether you&apos;re early or late.
        </p>
        <p>
          Join the movement. Sign the manifesto.
        </p>
        <p>
          Build the future with us.
        </p>
      </main>

      <div className="block md:hidden signature-strip-embedded">
        <SignatureStrip isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} />
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
    </>
  );
};
