# FUO Wallet - Backend

A blockchain-based financial system built on the Stellar network. Users get a Stellar wallet automatically on signup, fund it in Naira via Paystack and transfer FUC tokens peer-to-peer.

**Full documentation:** [fuo-wallet-docs.vercel.app](https://fuo-wallet-docs.vercel.app)
**Live API Reference:** [fuo-wallet-backend.onrender.com/api/docs](https://fuo-wallet-backend.onrender.com/api/docs)

**Related repositories:**

- Web App (React): [fuo-wallet-web](https://github.com/adetolaa99/fuo-wallet-web)
- Mobile App (React Native): [fuo-wallet-mobile](https://github.com/adetolaa99/fuo-wallet-mobile)

---

## Tech Stack

| Layer      | Technology                     |
| ---------- | ------------------------------ |
| Runtime    | Node.js 20                     |
| Framework  | Express.js                     |
| Database   | PostgreSQL (via Sequelize ORM) |
| Blockchain | Stellar (Horizon API, testnet) |
| Payments   | Paystack                       |
| Auth       | JWT (jsonwebtoken)             |
| Email      | Resend                         |

---

## Quick Start

### Prerequisites

- Node.js v20+
- A PostgreSQL database
- A [Paystack](https://paystack.com) account
- A [Resend](https://resend.com) account with a verified sending domain
- Two Stellar testnet accounts (issuing + distribution) - create them at [Stellar Laboratory](https://laboratory.stellar.org)

### Installation

```bash
git clone https://github.com/adetolaa99/fuo-wallet-backend.git
cd fuo-wallet-backend
npm install
```

### Environment Variables

Create a `.env` file in the root directory:

```env
PORT=9000
NODE_ENV=development
BASE_URL=http://localhost:9000
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000

DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_HOST=localhost
DB_PORT=5432
DB_DIALECT=postgres

JWT_SECRET=your_jwt_secret_key

RESEND_API_KEY=re_xxxxxxxxxxxx

PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxx
PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxx

STELLAR_NETWORK=https://horizon-testnet.stellar.org
ISSUING_ACCOUNT_SECRET=your_issuing_account_secret
DISTRIBUTION_ACCOUNT_SECRET=your_distribution_account_secret
```

### Run

```bash
# Development
npm run dev

# Production
npm start
```

Server runs on `http://localhost:9000`. Full environment variable reference is in the [documentation](https://fuo-wallet-docs.vercel.app/docs/getting-started/environment-variables).

---

## API Documentation

Interactive API reference is available at `/api/docs` when the server is running, powered by Swagger UI. Full endpoint documentation is at the [developer documentation page](https://fuo-wallet-docs.vercel.app).

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a pull request

---

## License

This project is licensed under the [MIT License](LICENSE).

---
