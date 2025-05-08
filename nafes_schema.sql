-- SQL script for NAFES application database schema

-- Users table: stores all types of users
CREATE TABLE Users (
    id SERIAL PRIMARY KEY,
    identity_number VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    mobile VARCHAR(20) UNIQUE,
    role VARCHAR(10) NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
    password_hash VARCHAR(255) NOT NULL
);

-- Subscription plans: defines available pricing options
CREATE TABLE SubscriptionPlans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    duration_months INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    description TEXT
);

-- Schools: each school subscribes to a plan
CREATE TABLE Schools (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    plan_id INT NOT NULL REFERENCES SubscriptionPlans(id),
    subscription_start DATE NOT NULL,
    subscription_end DATE NOT NULL
);

-- Admins: application-level administrators
CREATE TABLE Admins (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL UNIQUE REFERENCES Users(id)
);

-- Teachers: associated with a specific school
CREATE TABLE Teachers (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL UNIQUE REFERENCES Users(id),
    school_id INT NOT NULL REFERENCES Schools(id)
);

-- Students: assigned to teachers
CREATE TABLE Students (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL UNIQUE REFERENCES Users(id),
    teacher_id INT NOT NULL REFERENCES Teachers(id)
);

-- Tests: test definitions
CREATE TABLE Tests (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    duration INT -- duration in minutes
);

-- Questions: questions for each test
CREATE TABLE Questions (
    id SERIAL PRIMARY KEY,
    test_id INT NOT NULL REFERENCES Tests(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL, -- e.g., 'multiple_choice', 'true_false'
    content TEXT NOT NULL,
    options JSON, -- JSON array of options for multiple choice
    correct_answer VARCHAR(255) NOT NULL
);

-- Attempts: student test attempts
CREATE TABLE Attempts (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES Students(id),
    test_id INT NOT NULL REFERENCES Tests(id),
    score DECIMAL(5,2),
    date_taken TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Payments: subscription payments
CREATE TABLE Payments (
    id SERIAL PRIMARY KEY,
    school_id INT NOT NULL REFERENCES Schools(id),
    plan_id INT NOT NULL REFERENCES SubscriptionPlans(id),
    amount DECIMAL(10,2) NOT NULL,
    date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) -- e.g., 'pending', 'completed', 'failed'
);

-- Messages: communication between users
CREATE TABLE Messages (
    id SERIAL PRIMARY KEY,
    sender_id INT NOT NULL REFERENCES Users(id),
    receiver_id INT NOT NULL REFERENCES Users(id),
    content TEXT NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
