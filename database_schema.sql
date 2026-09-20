-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table for tracked products
CREATE TABLE tracked_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for price and stock history
CREATE TABLE price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES tracked_products(id) ON DELETE CASCADE,
    price NUMERIC, -- Can be null if out of stock or failed but stock fetched
    stock_status TEXT, -- e.g., 'In Stock', 'Out of Stock'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for scrape logs
CREATE TABLE scrape_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES tracked_products(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('success', 'retried', 'failed')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optional: Create indexes for performance
CREATE INDEX idx_price_history_product_id ON price_history(product_id);
CREATE INDEX idx_scrape_logs_product_id ON scrape_logs(product_id);
