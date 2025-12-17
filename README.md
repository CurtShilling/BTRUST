# B Trust - On-Chain Bonds Platform

## Overview

B Trust is a decentralized platform for issuing and trading on-chain bonds on the Solana blockchain. It enables:

- **Issuers**: Deploy collateralized bonds with customizable terms
- **Investors**: Trade bonds, earn yields, and manage portfolios
- **Market Makers**: Provide liquidity in secondary markets

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         B Trust Platform                         │
├─────────────────────────────────────────────────────────────────┤
│  Frontend (Next.js)                                              │
│  ├── Homepage - Bond listings, market overview                   │
│  ├── Deploy Tab - Bond issuance interface                        │
│  ├── Trade Tab - Secondary market trading                        │
│  └── Portfolio - Holdings, yields, PnL tracking                  │
├─────────────────────────────────────────────────────────────────┤
│  Solana Programs (Smart Contracts)                               │
│  ├── Bond Factory - Creates new bond offerings                   │
│  ├── Bond Vault - Manages collateral & liquidations              │
│  ├── Yield Distributor - Handles coupon payments                 │
│  └── Trading Engine - Order matching & settlement                │
├─────────────────────────────────────────────────────────────────┤
│  Backend Services                                                │
│  ├── Indexer - Tracks on-chain events                            │
│  ├── Price Oracle - Collateral valuations                        │
│  └── Analytics API - Portfolio metrics, market data              │
└─────────────────────────────────────────────────────────────────┘
```

## Bond Structure

Each bond includes:
- **Principal**: Face value of the bond
- **Coupon Rate**: Annual yield (fixed or variable)
- **Maturity Date**: When principal is returned
- **Collateral**: Assets backing the bond (optional)
- **Collateral Ratio**: Required collateral/principal ratio
- **Liquidation Threshold**: Ratio triggering liquidation

## Getting Started

### Prerequisites
- Node.js 18+
- Rust & Cargo
- Solana CLI
- Anchor Framework

### Installation

```bash
# Install dependencies
npm install

# Build Solana programs
anchor build

# Run tests
anchor test

# Start frontend
cd app && npm run dev
```

## Project Structure

```
btrust/
├── programs/
│   └── btrust-bond/        # Solana program
├── app/                    # Next.js frontend
├── tests/                  # Integration tests
├── scripts/                # Deployment scripts
└── migrations/             # Program migrations
```

## License

MIT

