import { Home } from "@/modules";
import { ReferralRedirect } from "@/components/ReferralRedirect";

interface HomePageProps {
  searchParams: Promise<{ ref?: string }>;
}

const HomePage = async ({ searchParams }: HomePageProps) => {
  // Await searchParams (Next.js 15+)
  const params = await searchParams;

  // If there's a ref parameter, redirect through the tracking API
  if (params.ref) {
    return <ReferralRedirect refCode={params.ref} />;
  }

  return <Home />;
};

export default HomePage;
