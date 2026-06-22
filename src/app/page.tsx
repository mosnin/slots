import { ClientApp } from '../components/ClientApp';

// Force dynamic rendering — Solana's PublicKey/BN require Buffer at module
// load time, which is not available during Next.js static prerendering.
export const dynamic = 'force-dynamic';

export default function Home() {
  return <ClientApp />;
}
