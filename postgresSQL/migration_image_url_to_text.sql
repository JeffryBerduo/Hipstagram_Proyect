-- Ampliar image_url de VARCHAR(255) a TEXT para soportar imágenes en Base64
ALTER TABLE publicaciones ALTER COLUMN image_url TYPE TEXT;
