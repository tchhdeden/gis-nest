-- Chuyển kiểu dữ liệu bytea → geometry
ALTER TABLE "locations"
ALTER COLUMN geom TYPE geometry (Point, 4326) USING ST_SetSRID (ST_GeomFromWKB (geom), 4326);

-- Tạo spatial index
CREATE INDEX location_geom_idx ON "locations" USING GIST (geom);