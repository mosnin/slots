use anchor_lang::prelude::*;

declare_id!("ChkRd1111111111111111111111111111111111111111");

pub const MAX_LEADERBOARD: usize = 10;
pub const PRIZE_INTERVAL: i64 = 300; // 5 minutes in seconds

#[program]
pub mod chicken_road {
    use super::*;

    /// Initialize the prize pool and leaderboard state
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let state = &mut ctx.accounts.game_state;
        state.authority = ctx.accounts.authority.key();
        state.prize_pool = 0;
        state.last_distribution = Clock::get()?.unix_timestamp;
        state.round = 0;
        state.bump = ctx.bumps.game_state;
        Ok(())
    }

    /// Player submits their score. Signs with their wallet.
    pub fn submit_score(ctx: Context<SubmitScore>, score: u64, lane: u64) -> Result<()> {
        let state = &mut ctx.accounts.game_state;
        let player = ctx.accounts.player.key();
        let now = Clock::get()?.unix_timestamp;

        // Update or insert player on leaderboard
        let entry_idx = state.leaderboard.iter().position(|e| e.player == player);
        if let Some(idx) = entry_idx {
            if score > state.leaderboard[idx].score {
                state.leaderboard[idx].score = score;
                state.leaderboard[idx].lane = lane;
                state.leaderboard[idx].timestamp = now;
            }
        } else {
            // Find slot: replace lowest scorer or empty slot
            let min_idx = state
                .leaderboard
                .iter()
                .enumerate()
                .min_by_key(|(_, e)| if e.player == Pubkey::default() { u64::MAX } else { e.score })
                .map(|(i, _)| i)
                .unwrap_or(0);

            let current = state.leaderboard[min_idx];
            if current.player == Pubkey::default() || score > current.score {
                state.leaderboard[min_idx] = LeaderboardEntry {
                    player,
                    score,
                    lane,
                    timestamp: now,
                };
            }
        }

        // Re-sort descending
        state.leaderboard.sort_by(|a, b| b.score.cmp(&a.score));

        Ok(())
    }

    /// Deposit SOL into the prize pool (called by fee collector / token holders)
    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.payer.key(),
            &ctx.accounts.game_state.key(),
            amount,
        );
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.payer.to_account_info(),
                ctx.accounts.game_state.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;
        ctx.accounts.game_state.prize_pool += amount;
        Ok(())
    }

    /// Keeper calls this every 5 minutes to distribute prize to top player
    pub fn distribute_prize(ctx: Context<DistributePrize>) -> Result<()> {
        let state = &mut ctx.accounts.game_state;
        let now = Clock::get()?.unix_timestamp;

        require!(
            now >= state.last_distribution + PRIZE_INTERVAL,
            ChickenError::TooEarly
        );

        let top = state.leaderboard[0];
        require!(
            top.player != Pubkey::default() && top.score > 0,
            ChickenError::NoPlayers
        );
        require!(
            top.player == ctx.accounts.winner.key(),
            ChickenError::WrongWinner
        );

        let prize = state.prize_pool;
        require!(prize > 0, ChickenError::EmptyPool);

        // Transfer lamports from game_state PDA to winner
        **state.to_account_info().try_borrow_mut_lamports()? -= prize;
        **ctx.accounts.winner.to_account_info().try_borrow_mut_lamports()? += prize;

        // Record past winner
        let past = PastWinner {
            player: top.player,
            score: top.score,
            amount: prize,
            round: state.round,
            timestamp: now,
        };

        // Push to past_winners ring buffer (max 50)
        if ctx.accounts.past_winners.entries.len() < 50 {
            ctx.accounts.past_winners.entries.push(past);
        } else {
            let idx = (state.round as usize) % 50;
            ctx.accounts.past_winners.entries[idx] = past;
        }

        state.prize_pool = 0;
        state.last_distribution = now;
        state.round += 1;

        // Reset leaderboard scores (new round)
        for entry in state.leaderboard.iter_mut() {
            entry.score = 0;
            entry.lane = 0;
            entry.timestamp = 0;
        }

        emit!(PrizeDistributed {
            winner: top.player,
            amount: prize,
            round: state.round,
            score: top.score,
        });

        Ok(())
    }
}

// ─── Accounts ────────────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = GameState::SIZE,
        seeds = [b"game_state"],
        bump
    )]
    pub game_state: Account<'info, GameState>,
    #[account(
        init,
        payer = authority,
        space = PastWinnersLog::SIZE,
        seeds = [b"past_winners"],
        bump
    )]
    pub past_winners: Account<'info, PastWinnersLog>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SubmitScore<'info> {
    #[account(mut, seeds = [b"game_state"], bump = game_state.bump)]
    pub game_state: Account<'info, GameState>,
    pub player: Signer<'info>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut, seeds = [b"game_state"], bump = game_state.bump)]
    pub game_state: Account<'info, GameState>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DistributePrize<'info> {
    #[account(mut, seeds = [b"game_state"], bump = game_state.bump)]
    pub game_state: Account<'info, GameState>,
    #[account(mut, seeds = [b"past_winners"], bump)]
    pub past_winners: Account<'info, PastWinnersLog>,
    /// CHECK: validated against leaderboard top entry
    #[account(mut)]
    pub winner: UncheckedAccount<'info>,
    pub keeper: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// ─── State ────────────────────────────────────────────────────────────────────

#[account]
pub struct GameState {
    pub authority: Pubkey,
    pub prize_pool: u64,
    pub last_distribution: i64,
    pub round: u64,
    pub bump: u8,
    pub leaderboard: [LeaderboardEntry; 10],
}

impl GameState {
    pub const SIZE: usize = 8 // discriminator
        + 32  // authority
        + 8   // prize_pool
        + 8   // last_distribution
        + 8   // round
        + 1   // bump
        + LeaderboardEntry::SIZE * 10; // leaderboard
}

#[account]
pub struct PastWinnersLog {
    pub entries: Vec<PastWinner>,
}

impl PastWinnersLog {
    pub const SIZE: usize = 8 // discriminator
        + 4   // vec length
        + PastWinner::SIZE * 50;
}

// ─── Data Structures ──────────────────────────────────────────────────────────

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Default)]
pub struct LeaderboardEntry {
    pub player: Pubkey,
    pub score: u64,
    pub lane: u64,
    pub timestamp: i64,
}

impl LeaderboardEntry {
    pub const SIZE: usize = 32 + 8 + 8 + 8;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Default)]
pub struct PastWinner {
    pub player: Pubkey,
    pub score: u64,
    pub amount: u64,
    pub round: u64,
    pub timestamp: i64,
}

impl PastWinner {
    pub const SIZE: usize = 32 + 8 + 8 + 8 + 8;
}

// ─── Events ───────────────────────────────────────────────────────────────────

#[event]
pub struct PrizeDistributed {
    pub winner: Pubkey,
    pub amount: u64,
    pub round: u64,
    pub score: u64,
}

// ─── Errors ───────────────────────────────────────────────────────────────────

#[error_code]
pub enum ChickenError {
    #[msg("Prize interval not elapsed yet")]
    TooEarly,
    #[msg("No players on leaderboard")]
    NoPlayers,
    #[msg("Wrong winner account provided")]
    WrongWinner,
    #[msg("Prize pool is empty")]
    EmptyPool,
}
