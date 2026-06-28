import { pgTable, uuid, varchar, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const exercises = pgTable("exercises", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name").notNull(),
    description: text("description"),
    instructions: text("instructions"),
    target_body_part: varchar("target_body_part"),
    video_url: varchar("video_url"),
    photo_urls: varchar("photo_urls").array(), // For multiple Cloudinary photos
    created_by: uuid("created_by").references(() => users.id).notNull(),
    is_active: boolean("is_active").default(true).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});