import { Connection, Keypair, PublicKey, sendAndConfirmTransaction, Transaction } from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID, getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction, createMintToInstruction,
  getMint, getAccount, ExtensionType, getExtensionTypes,
} from "@solana/spl-token";
import bs58 from "bs58";

const RPC_URL = process.env.HELIUS_RPC_URL || "https://api.devnet.solana.com";
const MINT_ADDRESS = process.env.NEXT_PUBLIC_SOULBOUND_MINT;
const AUTHORITY_SECRET = process.env.MINT_AUTHORITY_SECRET || "";

async function mintSoulboundBadge() {
  if (!MINT_ADDRESS) throw new Error("NEXT_PUBLIC_SOULBOUND_MINT is not defined.");
  if (!AUTHORITY_SECRET) throw new Error("MINT_AUTHORITY_SECRET is missing.");
  const recipientArg = process.argv[2];
  if (!recipientArg) throw new Error("Usage: npx tsx scripts/mint-soulbound-badge.ts <PATRON_WALLET_PUBKEY>");

  const connection = new Connection(RPC_URL, "confirmed");
  const mint = new PublicKey(MINT_ADDRESS);
  const recipient = new PublicKey(recipientArg);
  const authority = Keypair.fromSecretKey(bs58.decode(AUTHORITY_SECRET));
  const mintInfo = await getMint(connection, mint, "confirmed", TOKEN_2022_PROGRAM_ID);
  const extensions = getExtensionTypes(mintInfo.tlvData);
  if (!extensions.includes(ExtensionType.NonTransferable)) throw new Error("Mint lacks NonTransferable extension.");
  if (mintInfo.decimals !== 0) throw new Error(`Expected zero decimals; found ${mintInfo.decimals}.`);
  if (!mintInfo.mintAuthority?.equals(authority.publicKey)) throw new Error("Signer is not mint authority.");

  const ata = getAssociatedTokenAddressSync(mint, recipient, false, TOKEN_2022_PROGRAM_ID);
  const transaction = new Transaction();
  const existingAta = await connection.getAccountInfo(ata, "confirmed");
  if (!existingAta) {
    transaction.add(createAssociatedTokenAccountInstruction(authority.publicKey, ata, recipient, mint, TOKEN_2022_PROGRAM_ID));
  } else {
    const tokenAccount = await getAccount(connection, ata, "confirmed", TOKEN_2022_PROGRAM_ID);
    if (!tokenAccount.owner.equals(recipient) || !tokenAccount.mint.equals(mint)) throw new Error("Existing ATA does not match recipient and mint.");
    if (tokenAccount.amount > 0n) throw new Error("Recipient already holds this badge; refusing duplicate mint.");
  }
  transaction.add(createMintToInstruction(mint, ata, authority.publicKey, 1n, [], TOKEN_2022_PROGRAM_ID));
  const signature = await sendAndConfirmTransaction(connection, transaction, [authority], { commitment: "confirmed" });
  console.log("Soulbound badge minted:", { mint: mint.toBase58(), recipient: recipient.toBase58(), ata: ata.toBase58(), signature });
}
mintSoulboundBadge().catch((error: unknown) => {
  console.error("Minting failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
