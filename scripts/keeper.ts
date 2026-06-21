import {
  Connection,
  Keypair,
  PublicKey,
  clusterApiUrl,
} from "@solana/web3.js";
import { AnchorProvider, Wallet, Program, BN } from "@coral-xyz/anchor";
import { IDL } from "../src/idl/chicken_road";
import fs from "fs";

const PROGRAM_ID = new PublicKey("ChkRd1111111111111111111111111111111111111111");
const RPC_URL = process.env.RPC_URL || clusterApiUrl("devnet");
const KEEPER_KEYPAIR_PATH = process.env.KEEPER_KEYPAIR || "./keeper.json";

const [GAME_STATE_PDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("game_state")],
  PROGRAM_ID
);
const [PAST_WINNERS_PDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("past_winners")],
  PROGRAM_ID
);

async function runKeeper() {
  const keypairData = JSON.parse(fs.readFileSync(KEEPER_KEYPAIR_PATH, "utf-8"));
  const keypair = Keypair.fromSecretKey(new Uint8Array(keypairData));
  const connection = new Connection(RPC_URL, "confirmed");
  const wallet = new Wallet(keypair);
  const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
  const program = new Program(IDL as any, PROGRAM_ID, provider);

  console.log(`Keeper running. Address: ${keypair.publicKey.toBase58()}`);

  setInterval(async () => {
    try {
      const state = await (program.account as any).gameState.fetch(GAME_STATE_PDA);
      const now = Math.floor(Date.now() / 1000);
      const elapsed = now - state.lastDistribution.toNumber();

      console.log(`Time since last draw: ${elapsed}s / 300s`);

      if (elapsed < 300) return;
      if (state.prizePool.toNumber() === 0) return;

      const topEntry = state.leaderboard[0];
      if (!topEntry || topEntry.player.equals(PublicKey.default) || topEntry.score.toNumber() === 0) return;

      console.log(`Distributing ${state.prizePool.toNumber() / 1e9} SOL to ${topEntry.player.toBase58()}`);

      await (program.methods as any)
        .distributePrize()
        .accounts({
          gameState: GAME_STATE_PDA,
          pastWinners: PAST_WINNERS_PDA,
          winner: topEntry.player,
          keeper: keypair.publicKey,
          systemProgram: PublicKey.default,
        })
        .rpc();

      console.log("Prize distributed successfully!");
    } catch (e) {
      console.error("Keeper error:", e);
    }
  }, 30_000); // check every 30 seconds
}

runKeeper().catch(console.error);
