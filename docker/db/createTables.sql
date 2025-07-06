CREATE TABLE IF NOT EXISTS "user" (
    "id" VARCHAR(255) PRIMARY KEY NOT NULL,    
    "seconds" INTEGER NOT NULL DEFAULT 0, 
    "activeLocation" VARCHAR(255),
    FOREIGN KEY("activeLocation") REFERENCES "location"("id")
);

CREATE TABLE IF NOT EXISTS "location" (
    "id" VARCHAR(255) PRIMARY KEY NOT NULL,
    "name" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "audit" (
    "id" SERIAL PRIMARY KEY,
    "userId" VARCHAR(255) NOT NULL,
    "startTime" INTEGER NOT NULL,
    "endTime" INTEGER,
    "location" VARCHAR(255) NOT NULL,
    "summary" TEXT,
    "approved" BOOLEAN DEFAULT FALSE,
    FOREIGN KEY("userId") REFERENCES "user"("id"),
    FOREIGN KEY("location") REFERENCES "location"("id")
);

CREATE TABLE IF NOT EXISTS "booking" (
    "id" SERIAL PRIMARY KEY, 
    "userId" VARCHAR(255) NOT NULL, 
    "startTime" INTEGER NOT NULL,
    "endTime" INTEGER,
    "location" VARCHAR(255) NOT NULL,
    FOREIGN KEY("userId") REFERENCES "user"("id"),
    FOREIGN KEY("location") REFERENCES "location"("id")
);

CREATE TABLE IF NOT EXISTS "cookie" (
    "cookie" VARCHAR(255) PRIMARY KEY NOT NULL,
    "userId" VARCHAR(255) NOT NULL,
    "description" TEXT,
    FOREIGN KEY("userId") REFERENCES "user"("id")
);

CREATE TABLE IF NOT EXISTS "notification" (
    "id" SERIAL PRIMARY KEY, 
    "userId" VARCHAR(255) NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT FALSE,
    "time" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    FOREIGN KEY("userId") REFERENCES "user"("id")
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "notificationDelivery" (
    "cookie" VARCHAR(255) NOT NULL PRIMARY KEY,
    "id" INTEGER NOT NULL,
    "delivered" BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY("cookie") REFERENCES "cookie"("cookie")
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY("id") REFERENCES "notification"("id")
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "token" (
    "id" VARCHAR(255) PRIMARY KEY NOT NULL,
    "hash" VARCHAR(255) NOT NULL,
    "readOnly" BOOLEAN NOT NULL,
    "admin" BOOLEAN NOT NULL,
    "description" TEXT
);

CREATE TABLE IF NOT EXISTS "codes" (
    "code" VARCHAR(255) PRIMARY KEY NOT NULL,  
    "userId" VARCHAR(255), 
    "expirationTime" INTEGER NOT NULL,

    FOREIGN KEY("userId") REFERENCES "user"("id")

);

CREATE TABLE IF NOT EXISTS "event" (
    "id" SERIAL PRIMARY KEY NOT NULL,
    "startTime" INTEGER NOT NULL,
    "endTime" INTEGER,
	"title" TEXT NOT NULL,
    "description" TEXT
);

CREATE TABLE IF NOT EXISTS "config" (
    "id" VARCHAR(255) PRIMARY KEY NOT NULL,
    "value" TEXT
);


CREATE OR REPLACE FUNCTION update_user_seconds()
RETURNS TRIGGER AS $$
DECLARE
    total_seconds INTEGER;
    active_location BOOLEAN;
    user_id VARCHAR(255);
BEGIN
    -- Use id from old if deleting
    IF TG_OP = 'DELETE' THEN
        user_id := OLD."userId";
    ELSE
        user_id := NEW."userId";
    END IF;
    -- Calculate the total seconds for the userId in the audit table, skipping rows with NULL endTime
    SELECT COALESCE(SUM("endTime" - "startTime"), 0) INTO total_seconds
    FROM audit
    WHERE "userId" = user_id AND "endTime" IS NOT NULL AND "approved"=true;

    -- Determine if the user is currently logged in a location
    SELECT EXISTS (SELECT location FROM audit WHERE "userId" = NEW."userId" AND "endTime" IS NULL) INTO active_location;

    -- Update the seconds and activeLocation fields in the user table
    UPDATE "user"
    SET "seconds" = total_seconds, "activeLocation" = active_location
    WHERE "id" = user_id;

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