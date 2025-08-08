# eCommerce AI Search

An AI-powered eCommerce product search application that integrates with the [Fake Store API](https://fakestoreapi.com/) and uses the OpenRouter API for natural language search queries.

## 🚀 Run Locally

### 1. Clone the project

```bash
git clone https://dredsoftlabs-admin@bitbucket.org/dredsoftlabs/ecommerce.git
```

### 2. Go to the project directory

```bash
cd eCommerce
```

### 3. Install dependencies

```bash
npm install

# Or if you have dependency conflicts
npm install react-material-ui-carousel --save --legacy-peer-deps
```

### 4. Add environment variables

Create a `.env` file in the root of the project and add:

```env
OPEN_ROUTER_API_KEY=your_openrouter_api_key_here
```

### 5. Start the server

```bash
npm start
```

The server should now be running.  
Open your browser and go to:

```
http://localhost:3000
```

---

## 🤖 AI Feature Chosen

We use **OpenRouter API** to power natural language search for products.  
The AI can handle queries such as:

- "shoes under 100 dollars"
- "products with rating more than 4"
- "electronics between $50 and $150"
- "men's clothing with high ratings"

---

## 🛠 Tools & Libraries Used

- **Frontend**: React, Material UI, react-material-ui-carousel
- **Backend**: Node.js, Express
- **AI Integration**: OpenRouter API (model: `agentica-org/deepcoder-14b-preview:free`)
- **Data Source**: [Fake Store API](https://fakestoreapi.com/)
- **HTTP Requests**: Axios

---

## 📌 Notable Assumptions

- Product data comes from the Fake Store API, so results depend on its dataset.
- AI is instructed to match based on **all available product fields** (title, description, category, price, rating).
- If the AI fails to parse the query or return valid results, a **simple keyword search** is used as a fallback.
- Prices and ratings are taken as provided by the Fake Store API without additional normalization.

---

## Bonus – AI + Blockchain Integration

This AI-powered eCommerce search could be integrated with blockchain features in several ways:

1. **Token-Gated Pricing** – Special discounts or access to exclusive products for customers holding specific crypto tokens, verified through a connected wallet.
2. **On-Chain User Preferences** – Store personalized shopping preferences (categories, budget ranges) securely on-chain, allowing users to carry them across platforms.
3. **Loyalty Smart Contracts** – Implement decentralized loyalty programs where customers earn blockchain-based reward tokens for purchases, reviews, or referrals.

---

## 📄 License

This project is for demonstration and learning purposes.
