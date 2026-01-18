CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  buyer_name TEXT NOT NULL,
  buyer_name_tamil TEXT,
  seller_name TEXT NOT NULL,
  seller_name_tamil TEXT,
  house_number TEXT,
  survey_number TEXT NOT NULL,
  document_number TEXT NOT NULL,
  transaction_date TEXT,
  transaction_value NUMERIC,
  district TEXT,
  village TEXT,
  additional_info TEXT,
  pdf_file_name TEXT,
  extracted_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS buyer_name_idx ON transactions(buyer_name);
CREATE INDEX IF NOT EXISTS seller_name_idx ON transactions(seller_name);
CREATE INDEX IF NOT EXISTS house_number_idx ON transactions(house_number);
CREATE INDEX IF NOT EXISTS survey_number_idx ON transactions(survey_number);
CREATE INDEX IF NOT EXISTS document_number_idx ON transactions(document_number);
