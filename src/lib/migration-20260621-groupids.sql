-- ===== Migration 2026-06-21 (part 2): Add group_ids column to question_sets and rating_groups =====

-- question_sets 加 group_ids 列（JSON 数组存储允许访问的用户组 ID）
ALTER TABLE question_sets ADD COLUMN group_ids TEXT NOT NULL DEFAULT '[]';

-- rating_groups 加 group_ids 列（JSON 数组存储允许访问的用户组 ID）
ALTER TABLE rating_groups ADD COLUMN group_ids TEXT NOT NULL DEFAULT '[]';
