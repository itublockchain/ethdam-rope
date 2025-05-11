![image](https://github.com/user-attachments/assets/6aa00510-9ad1-4f44-bd7d-3ee7b3fd6bb0)


# RØPE - Reliable Over Protocol Exchange

*RØPE* is a trust-minimized, verifiable on/offramp between Web2 payments and Web3 assets. It connects traditional fiat systems to crypto networks without relying on centralized intermediaries or manual confirmation.

---

## 🌉 Why RØPE?

Today, getting crypto with your fiat means trusting someone — a centralized exchange, a counterparty, or a Telegram stranger. You send the money, and you hope it works. If it doesn’t? Good luck.

*RØPE changes that.*

We built a system where trust is no longer part of the equation. You send fiat from a Web2 app — like Wise or Modulr — and receive crypto in your wallet on your chosen chain, within seconds. No KYC. No middlemen. No "waiting for confirmation." Just a smooth, verifiable experience.

---

## 🔧 How It Works

When you send a fiat payment, the request is handled by an agent deployed as an MCP server. This agent acts like an automated operator: it verifies that the payment actually happened, keeps your private data secure, and once everything checks out, it sends the corresponding crypto directly to your wallet on-chain.

With *zkTLS*, the system verifies your fiat payment cryptographically. No screenshots, no API polling, no trust.

This proof feeds directly into the flow and ensures that the payment actually happened before anything moves.

Meanwhile, your sensitive information — wallet addresses, access credentials — is protected on-chain using *Sapphire* and *Oasis Privacy Layer (OPL)*.

Once the payment is verified, the agent — running securely inside a TEE using *ROFL* — triggers the crypto side of the transaction. It interacts with services like *Modulr* (or Wise), and *Uniswap* to perform the onramp, swap or bridge. And then the equivalent asset — say, *USDC* — lands directly in your wallet on any supported chain and token.

---

## 🛡️ What If the Bank Goes Down?

You don’t lose money. Nothing breaks. The system just waits.

This isn’t an escrow. It’s not a swap platform. It’s a verifiable automation layer that connects fiat and crypto with trust-minimized assumptions.

*So RØPE is not just an on/offramp — it’s the shortest, safest, and most verifiable path between money you have and money you use.*

---

## 🔗 Tech Stack Summary

•⁠  ⁠*MCP Server* – Modular agent execution
•⁠  ⁠*ROFL* – TEE-based computation with on-chain attestation
•⁠  ⁠*zkTLS / TLSNotary* – Fiat payment verification
•⁠  ⁠*Sapphire & OPL* – Privacy-preserving storage and computation
•⁠  ⁠*Modulr / Wise* – Fiat input
•⁠  CCTP – Onchain delivery (USDC)

---

## 🧪 What We Built

•⁠  ⁠End-to-end demo flow with live payment simulation
•⁠  TLSNotary verification pipeline
•⁠  ⁠MCP agent architecture & orchestration
•⁠  ⁠TEE computation with ROFL
•⁠  ⁠Private data integration with OPL(Sapphire)
•⁠  ⁠USDC delivery on multiple chains

---

## 📥 Installation

### 1. Clone the repository
git clone https://github.com/itublockchain/ethdam-rope
cd rope

### 2. Build Docker images and start all services
docker-compose build
docker-compose up -d

### 3. Add MCP server to your local machine
You can follow [Antrophic's documentation](https://modelcontextprotocol.io/quickstart/user).

### 4. (Optional) Follow logs
docker-compose logs -f

## 📄 License

MIT
