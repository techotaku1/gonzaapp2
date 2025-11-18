-- Agrega el campo tramites (varchar) si no existe
ALTER TABLE boleta_payments
  ADD COLUMN IF NOT EXISTS tramites VARCHAR(512);

-- Cambia el tipo de total_precio_neto a decimal(16,2) si no es correcto
ALTER TABLE boleta_payments
  ALTER COLUMN total_precio_neto TYPE DECIMAL(16,2)
  USING total_precio_neto::DECIMAL(16,2);
