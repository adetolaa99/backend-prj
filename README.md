# FUO Wallet - Backend

This application is the backend engine to a Blockchain-Based Financial System built as my final-year project using my University, Fountain University, Osogbo (FUO) as a case study. The system allows one to fund a wallet, hold a custom Stellar-based token (FUC) and make transactions all without touching traditional banking apps.

The backend handles authentication, Stellar wallet provisioning, Paystack payment processing, token minting and transaction history. The web and mobile frontends are in separate repositories (links below).

**Related repositories:**

- Web App (React): [fuo-wallet-web](https://github.com/adetolaa99/fuo-wallet-web)
- Mobile App (React Native): [fuo-wallet-mobile](https://github.com/adetolaa99/mobile-prj)

---

## Table of Contents

- [FUO Wallet - Backend](#fuo-wallet---backend)
  - [Table of Contents](#table-of-contents)
  - [How It Works](#how-it-works)
  - [Tech Stack](#tech-stack)
  - [Project Structure](#project-structure)
  - [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
    - [Environment Variables](#environment-variables)
    - [Running the Server](#running-the-server)
  - [API Documentation](#api-documentation)
  - [API Reference](#api-reference)
    - [User Routes](#user-routes)
      - [POST /signup](#post-signup)
      - [POST /login](#post-login)
      - [GET /profile](#get-profile)
      - [POST /send-reset-password-email](#post-send-reset-password-email)
      - [POST /reset-password](#post-reset-password)
    - [Admin Routes](#admin-routes)
      - [POST /login](#post-login-1)
      - [POST /provision](#post-provision)
      - [GET /users](#get-users)
      - [PUT /users/:userId](#put-usersuserid)
      - [DELETE /users/:userId](#delete-usersuserid)
      - [GET /transactions](#get-transactions)
      - [GET /users/:userId/transactions](#get-usersuseridtransactions)
      - [GET /users/:userId/wallet](#get-usersuseridwallet)
    - [Stellar Routes](#stellar-routes)
      - [GET /check-balance/:publicKey](#get-check-balancepublickey)
      - [POST /transfer](#post-transfer)
      - [GET /transactions/:userId](#get-transactionsuserid)
      - [POST /create-asset (Admin)](#post-create-asset-admin)
      - [GET /check-admin-balance/:publicKey (Admin)](#get-check-admin-balancepublickey-admin)
    - [Paystack Routes](#paystack-routes)
      - [POST /create-payment-intent](#post-create-payment-intent)
      - [POST /verify-payment](#post-verify-payment)
      - [POST /mint-tokens](#post-mint-tokens)
      - [GET /callback](#get-callback)
  - [Database Schema](#database-schema)
  - [Authentication](#authentication)
  - [Contributing](#contributing)
  - [License](#license)

---

## How It Works

When a new user signs up, the backend automatically:

1. Generates a Stellar key pair for them
2. Creates and funds their Stellar account on the testnet (seeded with 20 XLM from the distribution account)
3. Establishes a trustline for the FUC custom asset

To fund their wallet, a user initiates a Paystack payment in Naira. Once the payment is verified, the backend mints the equivalent amount of FUC tokens directly to their Stellar wallet. Users can then transfer FUC to other registered users using their Stellar public key. They can also view their full transaction history.

```
User signs up
    |
    v
Stellar keypair generated --> Account funded (20 XLM) --> FUC trustline created
    |
    v
User initiates deposit (Paystack)
    |
    v
Payment verified --> FUC tokens minted to user's Stellar wallet
    |
    v
User transfers FUC to another user's Stellar public key
    |
    v
Transaction recorded in Database
```

---

## Tech Stack

| Layer            | Technology                     |
| ---------------- | ------------------------------ |
| Runtime          | Node.js 20                     |
| Framework        | Express.js                     |
| Database         | PostgreSQL (via Sequelize ORM) |
| Blockchain       | Stellar (Horizon API, testnet) |
| Payments         | Paystack                       |
| Auth             | JWT (jsonwebtoken)             |
| Email            | Resend                         |
| Password Hashing | bcryptjs                       |

---

## Project Structure

```
backend-prj/
├── config/
│   ├── dbConfig.js          # PostgreSQL connection config
│   ├── emailConfig.js       # Resend credentials
│   ├── paystackConfig.js    # Paystack API keys
│   ├── stellarConfig.js     # Stellar network + issuing/distribution keys
│   └── tokenConfig.js       # JWT secret
├── controllers/
│   ├── adminController.js   # Admin: user management, transaction views
│   ├── paystackController.js# Payment initiation, verification, token minting
│   ├── stellarController.js # Balance checks, transfers, asset creation
│   └── userController.js    # Signup, login, profile, password reset
├── middleware/
│   └── auth.js              # JWT verification middleware
├── models/
│   ├── admin.js
│   ├── associations.js      # Sequelize model associations
│   ├── index.js             # DB init + model loading
│   ├── transaction.js
│   └── user.js
├── routes/
│   ├── adminRoutes.js
│   ├── paystackRoute.js
│   ├── stellarRoutes.js
│   └── userRoutes.js
├── services/
│   └── userService.js       # Password reset token logic
├── stellar/
│   └── stellarConnect.js    # Horizon server connection
├── utils/
│   └── sendEmail.js         # Email utility
├── views/
│   ├── payment-already-processed.html
│   ├── payment-error.html
│   └── payment-success.html # Paystack callback HTML pages
├── server.js
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js v20+
- A PostgreSQL database (local or hosted e.g., Render)
- A [Paystack](https://paystack.com) account (test keys are fine for development)
- A [Stellar testnet](https://laboratory.stellar.org) setup with an issuing account and a distribution account

### Installation

```bash
git clone https://github.com/adetolaa99/backend-prj.git
cd backend-prj
npm install
```

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server
PORT=9000
NODE_ENV=development
BASE_URL=http://localhost:9000
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=https://your-frontend-url

# Database (PostgreSQL)
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_HOST=localhost
DB_PORT=5432
DB_DIALECT=postgres

# JWT
JWT_SECRET=your_jwt_secret_key

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxx

# Paystack
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxx
PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxx

# Stellar
STELLAR_NETWORK=https://horizon-testnet.stellar.org
ISSUING_ACCOUNT_SECRET=your_issuing_account_secret
DISTRIBUTION_ACCOUNT_SECRET=your_distribution_account_secret
```

> To get your `RESEND_API_KEY`, log in to your [Resend dashboard](https://resend.com), go to **API Keys** and create a new key. Make sure your sending domain is verified before use.

> For `STELLAR_NETWORK`, use `https://horizon-testnet.stellar.org` for development and `https://horizon.stellar.org` for production.

### Running the Server

**Development** (with auto-reload via nodemon):

```bash
npm run dev
```

**Production:**

```bash
npm start
```

The server starts on `http://localhost:9000` by default. On startup, it authenticates with the database and syncs all Sequelize models before accepting requests.

---

## API Documentation

Interactive API documentation is available via Swagger UI once the server is running:

- **Local:** [http://localhost:9000/api/docs](http://localhost:9000/api/docs)
- **Production:** `{BASE_URL}/api/docs`

The raw OpenAPI spec (useful for importing into Postman or other tools) is available at `/api/docs.json`.

All protected endpoints require a `Bearer` token. Use the **Authorize** button in the Swagger UI to set your JWT before making requests.

---

## API Reference

All protected routes require a `Bearer` token in the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

---

### User Routes

Base path: `/api/users`

#### POST /signup

Creates a new user account and provisions their Stellar wallet automatically.

**Request body:**

```json
{
  "username": "testuser",
  "email": "testuser@example.com",
  "password": "securepassword",
  "firstName": "Test",
  "lastName": "User"
}
```

**Response `201`:**

```json
{
  "message": "You signed up successfully! :)",
  "userId": "uuid-here"
}
```

**Response `400`:** if email or username already exists:

```json
{
  "error": "You've already signed up!"
}
```

---

#### POST /login

Authenticates a user and returns a JWT token (valid for 1 hour).

**Request body:**

```json
{
  "identifier": "testuser",
  "password": "securepassword"
}
```

The `identifier` field accepts either a username or email address.

**Response `200`:**

```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "profile": {
    "username": "testuser",
    "email": "testuser@example.com",
    "firstName": "Test",
    "lastName": "User",
    "stellarPublicKey": "GDXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
  }
}
```

---

#### GET /profile

Returns the authenticated user's profile details, including their Stellar secret key.

**Headers:** `Authorization: Bearer <token>`

**Response `200`:**

```json
{
  "username": "testuser",
  "email": "testuser@example.com",
  "firstName": "Test",
  "lastName": "User",
  "stellarPublicKey": "GDXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "stellarSecretKey": "SXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
}
```

> **Warning:** The response includes the user's `stellarSecretKey`. This key grants full control over the user's Stellar wallet and should never be logged, stored in plain text on the client or exposed in transit without HTTPS. In a production environment, consider whether returning the secret key to the client is necessary at all.

---

#### POST /send-reset-password-email

Sends a password reset link to the user's email address. The link expires after 1 hour.

**Request body:**

```json
{
  "email": "testuser@example.com"
}
```

**Response `200`:**

```json
{
  "message": "Check your e-mail, a password reset link has been sent"
}
```

---

#### POST /reset-password

Resets the user's password using the token from the reset email.

**Request body:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "newPassword": "newSecurePassword"
}
```

**Response `200`:**

```json
{
  "message": "Password reset successful"
}
```

---

### Admin Routes

Base path: `/api/admin`

All routes except `/login` require authentication.

#### POST /login

Authenticates an admin and returns a JWT token (valid for 2 hours).

**Request body:**

```json
{
  "email": "admin@fuowallet.com",
  "password": "adminpassword"
}
```

**Response `200`:**

```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

#### POST /provision

Creates a new admin account.

**Request body:**

```json
{
  "email": "newadmin@fuowallet.com",
  "password": "adminpassword"
}
```

**Response `201`:**

```json
{
  "message": "Admin account created successfully",
  "adminId": "uuid-here"
}
```

---

#### GET /users

Returns a list of all registered users.

**Response `200`:** Array of user objects.

---

#### PUT /users/:userId

Updates a user's details. All fields are optional, you only send the fields you want to change.

**Request body (all fields optional):**

```json
{
  "username": "new_username",
  "email": "newemail@example.com",
  "firstName": "NewFirst",
  "lastName": "NewLast",
  "stellarPublicKey": "GDXX...",
  "stellarSecretKey": "SXXX..."
}
```

**Response `200`:**

```json
{
  "message": "User updated successfully"
}
```

---

#### DELETE /users/:userId

Permanently deletes a user account.

**Response `200`:**

```json
{
  "message": "User deleted successfully"
}
```

---

#### GET /transactions

Returns all transactions across all users, with the associated username and email for each.

**Response `200`:** Array of transaction objects with nested user data.

---

#### GET /users/:userId/transactions

Returns all transactions for a specific user, sorted by most recent first.

**Response `200`:** Array of transaction objects.

---

#### GET /users/:userId/wallet

Returns the Stellar public and secret keys for a specific user.

**Response `200`:**

```json
{
  "stellarPublicKey": "GDXX...",
  "stellarSecretKey": "SXXX..."
}
```

> **Warning:** The response includes the user's `stellarSecretKey`. This key grants full control over the user's Stellar wallet and should never be logged, stored in plain text on the client or exposed in transit without HTTPS.

---

### Stellar Routes

Base path: `/api/stellar`

All routes require authentication.

#### GET /check-balance/:publicKey

Fetches the current balances (XLM and FUC) on a Stellar account.

**Response `200`:**

```json
{
  "balances": [
    { "asset_type": "native", "balance": "19.9999800" },
    { "asset_type": "credit_alphanum4", "balance": "50.0000000" }
  ]
}
```

---

#### POST /transfer

Transfers FUC tokens from the authenticated user's wallet to another Stellar account.

**Request body:**

```json
{
  "receiverPublicKey": "GDXX...",
  "amount": 10
}
```

**Response `200`:**

```json
{
  "message": "Transaction successful!",
  "result": { ... }
}
```

The transaction is also saved to the PostgreSQL `transactions` table.

---

#### GET /transactions/:userId

Returns the authenticated user's transaction history from the database, sorted newest first.

**Response `200`:** Array of transaction records:

```json
[
  {
    "transactionId": "uuid",
    "stellarTransactionId": "stellar-hash",
    "from": "GDXX...",
    "to": "GDYY...",
    "assetAmount": 10,
    "assetCode": "FUC",
    "userId": "uuid",
    "createdAt": "2024-11-01T12:00:00.000Z"
  }
]
```

---

#### POST /create-asset (Admin)

This is an Admin function to issue a new batch of FUC tokens from the issuing account to the distribution account. It creates the trustline on the distribution account if it does not already exist.

**Request body:**

```json
{
  "assetCode": "FUC",
  "amount": "1000000"
}
```

**Response `200`:** `"You've successfully created and issued new tokens!"`

---

#### GET /check-admin-balance/:publicKey (Admin)

This is an Admin function to return the full balance of the issuing or distribution account, including both XLM and FUC.

**Response `200`:**

```json
{
  "balances": [
    { "asset_code": "XLM", "asset_issuer": "", "balance": "9999.9999200" },
    {
      "asset_code": "FUC",
      "asset_issuer": "GDXX...",
      "balance": "950000.0000000"
    }
  ]
}
```

---

### Paystack Routes

Base path: `/api/paystack`

#### POST /create-payment-intent

Initializes a Paystack transaction for the authenticated user. Returns an authorization URL to redirect the user to Paystack's checkout page.

**Request body:**

```json
{
  "amount": 500
}
```

Amount is in Naira. The backend converts it to kobo (multiplies by 100) before sending to Paystack.

**Response `200`:** Paystack transaction initialization object, including `authorization_url` and `reference`.

---

#### POST /verify-payment

Verifies a completed Paystack transaction by reference. Each reference can only be verified once.

**Request body:**

```json
{
  "reference": "paystack_reference_here"
}
```

**Response `200` (success):**

```json
{
  "success": true,
  "amount": 500,
  "userId": "paystack-customer-id"
}
```

**Response `200` (already processed):**

```json
{
  "success": false,
  "message": "Payment reference has already been processed"
}
```

---

#### POST /mint-tokens

Mints FUC tokens to a user's Stellar wallet. Called internally after payment verification but also exposed as a route for manual admin use.

**Request body:**

```json
{
  "userId": "uuid",
  "amount": 500
}
```

**Response `200`:**

```json
{
  "success": true,
  "message": "Tokens minted successfully"
}
```

---

#### GET /callback

Paystack redirects to this endpoint after a payment. It verifies the payment, mints the appropriate FUC tokens and serves an HTML response page to the user.

This endpoint does not require authentication. The `callback_url` is set to `{BASE_URL}/api/paystack/callback` when initializing a transaction.

**Query parameters:** `reference` or `trxref` (provided by Paystack automatically).

**Response:** HTML page (success, error or already-processed).

---

## Database Schema

The application uses three PostgreSQL tables managed via Sequelize.

**users**

| Column                | Type      | Notes                    |
| --------------------- | --------- | ------------------------ |
| id                    | UUID      | Primary key              |
| username              | STRING    | Unique                   |
| email                 | STRING    | Unique                   |
| password              | STRING    | bcrypt hashed            |
| stellarPublicKey      | STRING    | Auto-generated on signup |
| stellarSecretKey      | STRING    | Auto-generated on signup |
| firstName             | STRING    | Optional                 |
| lastName              | STRING    | Optional                 |
| createdAt / updatedAt | TIMESTAMP | Auto-managed             |

**transactions**

| Column                | Type      | Notes                         |
| --------------------- | --------- | ----------------------------- |
| transactionId         | UUID      | Primary key                   |
| stellarTransactionId  | STRING    | Hash from Stellar network     |
| from                  | STRING    | Sender's Stellar public key   |
| to                    | STRING    | Receiver's Stellar public key |
| assetAmount           | FLOAT     | Amount of FUC transferred     |
| assetCode             | STRING    | Always "FUC"                  |
| userId                | UUID      | FK to users                   |
| createdAt / updatedAt | TIMESTAMP | Auto-managed                  |

**admins**

| Column                | Type      | Notes         |
| --------------------- | --------- | ------------- |
| id                    | UUID      | Primary key   |
| email                 | STRING    | Unique        |
| password              | STRING    | bcrypt hashed |
| createdAt / updatedAt | TIMESTAMP | Auto-managed  |

---

## Authentication

User-facing routes are protected with JWT middleware (`middleware/auth.js`). The middleware reads the `Authorization: Bearer <token>` header, verifies the token against `JWT_SECRET` and attaches the decoded user data to `req.user` before passing the request to the controller.

User tokens expire after **1 hour**. Admin tokens expire after **2 hours**.

Password reset tokens are also signed JWTs with a 1-hour expiry. They are generated and verified in `services/userService.js`.

---

## Contributing

This project was built as a final-year academic project but contributions are welcome.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a pull request

---

## License

This project is licensed under the [MIT License](LICENSE).

---
