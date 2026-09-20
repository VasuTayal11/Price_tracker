const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { scrapeProduct } = require('./scraper');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_KEY || 'placeholder_key'
);

// Get all tracked products
app.get('/api/products', async (req, res) => {
  const { data, error } = await supabase.from('tracked_products').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Add a product to track
app.post('/api/products', async (req, res) => {
  const { name, url, image_url } = req.body;
  if (!name || !url) return res.status(400).json({ error: 'Name and URL are required' });
  
  const { data, error } = await supabase
    .from('tracked_products')
    .insert([{ name, url, image_url }])
    .select()
    .single();
    
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Delete a tracked product
app.delete('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('tracked_products').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// Get price history for a product
app.get('/api/products/:id/history', async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('price_history')
    .select('*')
    .eq('product_id', id)
    .order('created_at', { ascending: true });
    
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Get scrape logs for a product
app.get('/api/products/:id/logs', async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('scrape_logs')
    .select('*')
    .eq('product_id', id)
    .order('created_at', { ascending: false });
    
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Search INE mock store API
app.get('/api/search', async (req, res) => {
  const { q } = req.query;
  try {
    const response = await fetch('https://demo.inelabteamdev.com/api/catalog?pageSize=100');
    const data = await response.json();
    let results = data.items || [];
    if (q) {
      const lowerQ = q.toLowerCase();
      results = results.filter(p => p.name.toLowerCase().includes(lowerQ));
    }
    res.json(results.slice(0, 10)); // return top 10 matches
  } catch (err) {
    res.status(500).json({ error: 'Failed to search mock store' });
  }
});

// The scheduled endpoint (can be called by cron-job.org)
app.post('/api/scrape', async (req, res) => {
  console.log('Cron job triggered: Scraping all products');
  
  // Fetch all tracked products
  const { data: products, error } = await supabase.from('tracked_products').select('*');
  if (error) return res.status(500).json({ error: error.message });
  
  // For free tier render, we shouldn't block the request too long, but for simplicity we'll await
  // Ideally, use a background worker if the list is huge.
  const results = [];
  
  for (const product of products) {
    console.log(`Scraping ${product.name}...`);
    const result = await scrapeProduct(product.url, { headless: true });
    
    // Log the result
    await supabase.from('scrape_logs').insert([{
      product_id: product.id,
      status: result.status,
      error_message: result.error || null
    }]);
    
    // If successful, save price history
    if (result.status === 'success' || result.status === 'retried') {
      await supabase.from('price_history').insert([{
        product_id: product.id,
        price: result.price,
        stock_status: result.stock
      }]);
    }
    
    results.push({ id: product.id, result });
  }
  
  res.json({ success: true, results });
});

// Observable (headed) run for a specific product
app.post('/api/products/:id/scrape-headed', async (req, res) => {
  const { id } = req.params;
  const { data: product, error } = await supabase.from('tracked_products').select('*').eq('id', id).single();
  
  if (error || !product) return res.status(404).json({ error: 'Product not found' });
  
  // Note: On Render/Cloud this might fail if a display server isn't available,
  // but it's meant for local demonstration as per assignment.
  const result = await scrapeProduct(product.url, { headless: false });
  
  // Log the result
  await supabase.from('scrape_logs').insert([{
    product_id: product.id,
    status: result.status,
    error_message: result.error || null
  }]);
  
  if (result.status === 'success' || result.status === 'retried') {
    await supabase.from('price_history').insert([{
      product_id: product.id,
      price: result.price,
      stock_status: result.stock
    }]);
  }
  
  res.json({ success: true, result });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
