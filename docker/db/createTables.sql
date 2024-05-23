CREATE TABLE IF NOT EXISTS "user" (
    id VARCHAR(255) PRIMARY KEY NOT NULL,    
    seconds INTEGER NOT NULL DEFAULT 0, 
    inlab BOOLEAN NOT NULL, 
    lastUpdate TIMESTAMP NOT NULL, 
    lastSeconds INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS "location" (
    id VARCHAR(255) PRIMARY KEY NOT NULL,
    name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "audit" (
    id SERIAL PRIMARY KEY, 
    userId VARCHAR(255) NOT NULL, 
    startTime INTEGER NOT NULL, 
    endTime INTEGER, 
    motivation TEXT, 
    approved BOOLEAN DEFAULT FALSE,
    location VARCHAR(255) NOT NULL,
    FOREIGN KEY(userId) REFERENCES "user"(id),
    FOREIGN KEY(location) REFERENCES "location"(id)
);

CREATE TABLE IF NOT EXISTS "booking" (
    id SERIAL PRIMARY KEY, 
    userId VARCHAR(255) NOT NULL, 
    startTime INTEGER NOT NULL,
    endTime INTEGER,
    FOREIGN KEY(userId) REFERENCES "user"(id)
);

CREATE TABLE IF NOT EXISTS "cookie" (
    cookie VARCHAR(255) PRIMARY KEY NOT NULL,
    userId VARCHAR(255) NOT NULL,
    description TEXT,
    FOREIGN KEY(userId) REFERENCES "user"(id)
);

CREATE TABLE IF NOT EXISTS "notification" (
    id SERIAL PRIMARY KEY, 
    cookie VARCHAR(255) NOT NULL,
    delivered BOOLEAN NOT NULL DEFAULT FALSE,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    time INTEGER NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    FOREIGN KEY(cookie) REFERENCES "cookie"(cookie)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "token" (
    id VARCHAR(255) PRIMARY KEY NOT NULL,
    hash VARCHAR(255) NOT NULL,
    readOnly BOOLEAN NOT NULL,
    admin BOOLEAN NOT NULL,
    description TEXT
);