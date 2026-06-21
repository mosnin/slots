import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { AnchorProvider, Program, BN } from "@coral-xyz/anchor";
import { IDL } from "../idl/chicken_road";

export const PROGRAM_ID = new PublicKey(
  "ChkRd1111111111111111111111111111111111111111"
);
export const RPC_URL =
  import.meta.env.VITE_RPC_URL || clusterApiUrl("devnet");

export const connection = new Connection(RPC_URL, "confirmed");

export const [GAME_STATE_PDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("game_state")],
  PROGRAM_ID
);

export const [PAST_WINNERS_PDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("past_winners")],
  PROGRAM_ID
);

export function getProgram(provider: AnchorProvider) {
  return new Program(IDL as any, PROGRAM_ID, provider);
}

export function lamportsToSol(lamports: number | bigint): string {
  return (Number(lamports) / 1e9).toFixed(4);
}

export function shortenAddress(address: string): string {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export async function fetchGameState(provider: AnchorProvider) {
  const program = getProgram(provider);
  try {
    const state = await (program.account as any).gameState.fetch(GAME_STATE_PDA);
    return state;
  } catch {
    return null;
  }
}

export async function fetchPastWinners(provider: AnchorProvider) {
  const program = getProgram(provider);
  try {
    const log = await (program.account as any).pastWinnersLog.fetch(PAST_WINNERS_PDA);
    return log.entries;
  } catch {
    return [];
  }
}

export async function submitScore(
  provider: AnchorProvider,
  score: number,
  lane: number
) {
  const program = getProgram(provider);
  await (program.methods as any)
    .submitScore(new BN(score), new BN(lane))
    .accounts({
      gameState: GAME_STATE_PDA,
      player: provider.wallet.publicKey,
    })
    .rpc();
}
