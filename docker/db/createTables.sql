CREATE TABLE IF NOT EXISTS "user" (
    id VARCHAR(255) PRIMARY KEY NOT NULL,    
    seconds INTEGER NOT NULL DEFAULT 0, 
    inlab BOOLEAN NOT NULL
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
    userId VARCHAR(255) NOT NULL,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    time INTEGER NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    FOREIGN KEY(userId) REFERENCES "user"(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "notificationDelivery" (
    cookie VARCHAR(255) NOT NULL PRIMARY KEY,
    id INTEGER NOT NULL,
    delivered BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY(cookie) REFERENCES "cookie"(cookie)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY(id) REFERENCES "notification"(id)
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

CREATE TABLE IF NOT EXISTS "codes" (
     code VARCHAR(255) PRIMARY KEY NOT NULL,  
     userId VARCHAR(255), 
     expirationTime INTEGER NOT NULL,

    FOREIGN KEY(userId) REFERENCES "user"(id)

);

CREATE TABLE IF NOT EXISTS "event" (
    id SERIAL PRIMARY KEY NOT NULL,
    startTime INTEGER NOT NULL,
    endTime INTEGER,
	title TEXT NOT NULL,
    description TEXT
);



CREATE OR REPLACE FUNCTION update_user_seconds()
RETURNS TRIGGER AS $$
DECLARE
    total_seconds INTEGER;
    in_lab BOOLEAN;
    user_id VARCHAR(255);
BEGIN
    -- Use id from old if deleting
    IF TG_OP = 'DELETE' THEN
        user_id := OLD.userId;
    ELSE
        user_id := NEW.userId;
    END IF;
    -- Calculate the total seconds for the userId in the audit table, skipping rows with NULL endTime
    SELECT COALESCE(SUM(endTime - startTime), 0) INTO total_seconds
    FROM audit
    WHERE userId = user_id AND endTime IS NOT NULL AND approved=true;

    -- Determine if the user is currently in the lab
    SELECT EXISTS (SELECT 1 FROM audit WHERE userId = NEW.userId AND endTime IS NULL) INTO in_lab;

    -- Update the seconds and inLab fields in the user table
    UPDATE "user"
    SET seconds = total_seconds, inlab = in_lab
    WHERE id = user_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;



-- Trigger for INSERT operation
CREATE TRIGGER audit_insert_trigger
AFTER INSERT ON audit
FOR EACH ROW
EXECUTE FUNCTION update_user_seconds();

-- Trigger for UPDATE operation
CREATE TRIGGER audit_update_trigger
AFTER UPDATE ON audit
FOR EACH ROW
EXECUTE FUNCTION update_user_seconds();

-- Trigger for DELETE operation
CREATE TRIGGER audit_delete_trigger
AFTER DELETE ON audit
FOR EACH ROW
EXECUTE FUNCTION update_user_seconds();