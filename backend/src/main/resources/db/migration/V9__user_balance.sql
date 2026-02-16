-- Add a simple wallet/balance to users so marketplace purchases
-- can charge buyers and credit authors.
ALTER TABLE users
    ADD COLUMN balance_cents INT NOT NULL DEFAULT 0;

-- Give existing users some starter balance so they can purchase demo paths.
UPDATE users
SET balance_cents = 10000
WHERE balance_cents = 0;

