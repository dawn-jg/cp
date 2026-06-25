-- ===== D1 Password Migration: Plaintext → bcrypt =====
-- 更新已存在的明文密码为 bcrypt hash
-- admin123 → $2a$10$FELBju8.rKlM3QINuHZDjuYlJCSrhsJmgfk0wm3pYKkoiXkF4Md6W
-- 123456  → $2a$10$1.h3kno663Bq9V842yvH6eBQ0EPNaqZZlG6fubQfTfYoWqrFmjO2e

-- 仅更新密码长度 < 20（即非 bcrypt hash 的明文密码）
-- admin123
UPDATE users SET password_hash = '$2a$10$FELBju8.rKlM3QINuHZDjuYlJCSrhsJmgfk0wm3pYKkoiXkF4Md6W'
WHERE password_hash = 'admin123';

-- 123456
UPDATE users SET password_hash = '$2a$10$1.h3kno663Bq9V842yvH6eBQ0EPNaqZZlG6fubQfTfYoWqrFmjO2e'
WHERE password_hash = '123456';
