export const IDL = {
  version: "0.1.0",
  name: "chicken_road",
  instructions: [
    {
      name: "initialize",
      accounts: [
        { name: "gameState", isMut: true, isSigner: false },
        { name: "pastWinners", isMut: true, isSigner: false },
        { name: "authority", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [],
    },
    {
      name: "submitScore",
      accounts: [
        { name: "gameState", isMut: true, isSigner: false },
        { name: "player", isMut: false, isSigner: true },
      ],
      args: [
        { name: "score", type: "u64" },
        { name: "lane", type: "u64" },
      ],
    },
    {
      name: "deposit",
      accounts: [
        { name: "gameState", isMut: true, isSigner: false },
        { name: "payer", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [{ name: "amount", type: "u64" }],
    },
    {
      name: "distributePrize",
      accounts: [
        { name: "gameState", isMut: true, isSigner: false },
        { name: "pastWinners", isMut: true, isSigner: false },
        { name: "winner", isMut: true, isSigner: false },
        { name: "keeper", isMut: false, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [],
    },
  ],
  accounts: [
    {
      name: "GameState",
      type: {
        kind: "struct",
        fields: [
          { name: "authority", type: "publicKey" },
          { name: "prizePool", type: "u64" },
          { name: "lastDistribution", type: "i64" },
          { name: "round", type: "u64" },
          { name: "bump", type: "u8" },
          {
            name: "leaderboard",
            type: { array: [{ defined: "LeaderboardEntry" }, 10] },
          },
        ],
      },
    },
    {
      name: "PastWinnersLog",
      type: {
        kind: "struct",
        fields: [
          {
            name: "entries",
            type: { vec: { defined: "PastWinner" } },
          },
        ],
      },
    },
  ],
  types: [
    {
      name: "LeaderboardEntry",
      type: {
        kind: "struct",
        fields: [
          { name: "player", type: "publicKey" },
          { name: "score", type: "u64" },
          { name: "lane", type: "u64" },
          { name: "timestamp", type: "i64" },
        ],
      },
    },
    {
      name: "PastWinner",
      type: {
        kind: "struct",
        fields: [
          { name: "player", type: "publicKey" },
          { name: "score", type: "u64" },
          { name: "amount", type: "u64" },
          { name: "round", type: "u64" },
          { name: "timestamp", type: "i64" },
        ],
      },
    },
  ],
  events: [
    {
      name: "PrizeDistributed",
      fields: [
        { name: "winner", type: "publicKey", index: false },
        { name: "amount", type: "u64", index: false },
        { name: "round", type: "u64", index: false },
        { name: "score", type: "u64", index: false },
      ],
    },
  ],
  errors: [
    { code: 6000, name: "TooEarly", msg: "Prize interval not elapsed yet" },
    { code: 6001, name: "NoPlayers", msg: "No players on leaderboard" },
    { code: 6002, name: "WrongWinner", msg: "Wrong winner account provided" },
    { code: 6003, name: "EmptyPool", msg: "Prize pool is empty" },
  ],
} as const;
