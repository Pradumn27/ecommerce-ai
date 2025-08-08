const axios = require('axios');

async function fetchCatalog() {
  const { data } = await axios.get('https://fakestoreapi.com/products');
  return Array.isArray(data) ? data : [];
}

async function fetchCategories() {
  const { data } = await axios.get(
    'https://fakestoreapi.com/products/categories'
  );
  return Array.isArray(data) ? data : [];
}

exports.getCatalog = async (req, res) => {
  try {
    const products = await fetchCatalog();
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load catalog' });
  }
};

exports.getCatalogProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: product } = await axios.get(
      `https://fakestoreapi.com/products/${id}`
    );
    if (!product)
      return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load product' });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await fetchCategories();
    res.json({ success: true, categories });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to load categories' });
  }
};

exports.aiSearch = async (req, res) => {
  const { query, category } = req.body || {};

  let products = [];
  try {
    products = await fetchCatalog();
  } catch (e) {
    products = [];
  }

  const source =
    category && category !== 'all'
      ? products.filter((p) => p.category === category)
      : products;

  try {
    const OPEN_ROUTER_API_KEY = process.env.OPEN_ROUTER_API_KEY;
    if (!OPEN_ROUTER_API_KEY) {
      // If no key, just do a simple search
      const results = simpleConstraintFallback(source, query);
      return res.json({
        success: true,
        products: results,
        note: 'fallback-no-key',
      });
    }

    const catalogData = source.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      category: p.category,
      price: p.price,
      rating: p.rating?.rate,
      currency: 'USD',
    }));

    const systemPrompt = `
You are a highly robust product-search AI for an e-commerce site. Queries may be informal, vague, or wildly phrased. Your goal is to return the most relevant products from the provided catalog.

INPUTS YOU RECEIVE:
- A natural-language query
- A product catalog array where each item has: id, title, description, category, price, rating

STRICT RULES:
- Use ONLY the provided catalog data. Never invent data or ids.
- Interpret colloquial language, misspellings, synonyms, and shorthand.
- Extract constraints (category, price, rating, keywords). Examples:
  - "under $X" => price < X; "over $X" => price > X; "between $X and $Y" => X <= price <= Y
  - "more than X stars" => rating > X; "at least X stars" => rating >= X; "below X stars" => rating < X
  - Category synonyms (e.g., "men", "men's", "mens" => men's clothing; "women", "ladies" => women's clothing; jewellry/jewelry => jewelery)
- Combine multiple constraints with AND logic when reasonable. Support soft matching if exact matches do not exist.
- If the query is unrelated to shopping or cannot be mapped to the catalog, return an empty list.
- If constraints mention attributes NOT present in the catalog (e.g., brand, color), ignore those attributes and match on available ones.
- Prefer higher relevance when multiple items match: stronger constraint satisfaction first, then textual similarity to title/description.

OUTPUT FORMAT:
- Return ONLY valid JSON: {"ids": [number, number, ...]} with no commentary.
`;
    const userPrompt = `User query: "${query || ''}"
Catalog: ${JSON.stringify(catalogData)}`;

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'agentica-org/deepcoder-14b-preview:free',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2,
        max_tokens: 500,
      },
      {
        headers: {
          Authorization: `Bearer ${OPEN_ROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const rawText = response?.data?.choices?.[0]?.message?.content?.trim();
    let ids = [];
    try {
      ids = JSON.parse(rawText).ids || [];
    } catch (e) {
      // ignore, fallback below
    }

    const idSet = new Set(ids.map((x) => String(x)));
    let matches = source.filter((p) => idSet.has(String(p.id)));

    if (matches.length === 0) {
      matches = simpleConstraintFallback(source, query);
    }

    res.json({ success: true, products: matches });
  } catch (err) {
    const results = simpleConstraintFallback(source, query);
    res.json({ success: true, products: results, note: 'fallback' });
  }
};

function simpleConstraintFallback(source, query) {
  if (!query) return source;
  const q = query.toLowerCase();

  let filtered = source;

  // Price between e.g. "between $20 and $50"
  const priceBetween = q.match(
    /(between|from)\s*\$?(\d+(?:\.\d+)?)\s*(and|to)\s*\$?(\d+(?:\.\d+)?)/
  );
  if (priceBetween) {
    const low = parseFloat(priceBetween[2]);
    const high = parseFloat(priceBetween[4]);
    filtered = filtered.filter((p) => p.price >= low && p.price <= high);
  }

  // Price under
  const underMatch = q.match(/under\s*\$?(\d+(?:\.\d+)?)/);
  if (underMatch) {
    const limit = parseFloat(underMatch[1]);
    filtered = filtered.filter((p) => p.price < limit);
  }

  // Price over
  const overMatch = q.match(
    /(over|above|greater than|more than)\s*\$?(\d+(?:\.\d+)?)/
  );
  if (overMatch) {
    const limit = parseFloat(overMatch[2]);
    filtered = filtered.filter((p) => p.price > limit);
  }

  // Rating between e.g. "between 3 and 4 stars"
  const ratingBetween = q.match(
    /(between|from)\s*(\d(\.\d+)?)\s*(and|to)\s*(\d(\.\d+)?)\s*stars?/
  );
  if (ratingBetween) {
    const low = parseFloat(ratingBetween[2]);
    const high = parseFloat(ratingBetween[5]);
    filtered = filtered.filter(
      (p) => (p.rating?.rate ?? 0) >= low && (p.rating?.rate ?? 0) <= high
    );
  }

  // Rating more than
  const ratingMore = q.match(
    /(rating\s*)?(more than|above|at least|>=)\s*(\d(\.\d+)?)/
  );
  if (ratingMore) {
    const minRating = parseFloat(ratingMore[3]);
    filtered = filtered.filter((p) => (p.rating?.rate ?? 0) >= minRating);
  }

  // Rating less than
  const ratingLess = q.match(
    /(rating\s*)?(less than|below|under|<=)\s*(\d(\.\d+)?)/
  );
  if (ratingLess) {
    const maxRating = parseFloat(ratingLess[3]);
    filtered = filtered.filter((p) => (p.rating?.rate ?? 0) <= maxRating);
  }

  // Keyword match
  const keywords = q.replace(/under.*|over.*|rating.*$/gi, '').trim();
  if (keywords) {
    filtered = filtered.filter((p) =>
      (p.title + ' ' + p.description + ' ' + p.category)
        .toLowerCase()
        .includes(keywords)
    );
  }

  return filtered;
}
