-- MasteryPath Core Schema

-- Users table
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_users_email ON users(email);

-- Categories (decay constant per category)
CREATE TABLE category (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    decay_constant DOUBLE PRECISION NOT NULL DEFAULT 0.03
);

-- Nodes (global skill pool)
CREATE TABLE node (
    id BIGSERIAL PRIMARY KEY,
    category_id BIGINT NOT NULL REFERENCES category(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    external_key VARCHAR(255) UNIQUE,
    external_url VARCHAR(512)
);
CREATE INDEX idx_node_category ON node(category_id);
CREATE INDEX idx_node_external_key ON node(external_key);

-- Node prerequisites (DAG edges)
CREATE TABLE node_prerequisite (
    prerequisite_node_id BIGINT NOT NULL REFERENCES node(id),
    dependent_node_id BIGINT NOT NULL REFERENCES node(id),
    PRIMARY KEY (prerequisite_node_id, dependent_node_id)
);
CREATE INDEX idx_node_prereq_dependent ON node_prerequisite(dependent_node_id);

-- Paths (curated collections of nodes)
CREATE TABLE path (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT
);

-- Path-Node mapping (ordered)
CREATE TABLE path_node (
    path_id BIGINT NOT NULL REFERENCES path(id),
    node_id BIGINT NOT NULL REFERENCES node(id),
    sequence_order INT NOT NULL DEFAULT 0,
    PRIMARY KEY (path_id, node_id)
);
CREATE INDEX idx_path_node_path ON path_node(path_id);

-- User skill state (stateful mastery engine)
CREATE TABLE user_skill (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    node_id BIGINT NOT NULL REFERENCES node(id),
    mastery_score DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    node_status VARCHAR(20) NOT NULL DEFAULT 'LOCKED',
    last_practiced_at TIMESTAMP,
    last_successful_at TIMESTAMP,
    UNIQUE (user_id, node_id)
);
CREATE INDEX idx_user_skill_user ON user_skill(user_id);
CREATE INDEX idx_user_skill_node ON user_skill(node_id);
CREATE INDEX idx_user_skill_status ON user_skill(node_status);

-- Performance log (immutable event store)
CREATE TABLE performance_log (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    node_id BIGINT NOT NULL REFERENCES node(id),
    occurred_at TIMESTAMP NOT NULL DEFAULT NOW(),
    is_success BOOLEAN NOT NULL,
    error_code VARCHAR(20),
    duration_ms INT,
    attempt_number INT,
    correction_of_id BIGINT REFERENCES performance_log(id)
);
CREATE INDEX idx_perf_log_user ON performance_log(user_id);
CREATE INDEX idx_perf_log_node ON performance_log(node_id);
CREATE INDEX idx_perf_log_user_date ON performance_log(user_id, occurred_at);

-- Maintenance tasks (for decay nudges)
CREATE TABLE maintenance_task (
    id BIGSERIAL PRIMARY KEY,
    user_skill_id BIGINT NOT NULL REFERENCES user_skill(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP,
    UNIQUE (user_skill_id, completed_at)
);
CREATE INDEX idx_maintenance_task_pending ON maintenance_task(user_skill_id) WHERE completed_at IS NULL;
