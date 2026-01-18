CREATE TABLE IF NOT EXISTS "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"buyer_name" text NOT NULL,
	"buyer_name_tamil" text,
	"seller_name" text NOT NULL,
	"seller_name_tamil" text,
	"house_number" text,
	"survey_number" text NOT NULL,
	"document_number" text NOT NULL,
	"transaction_date" text,
	"transaction_value" numeric,
	"district" text,
	"village" text,
	"additional_info" text,
	"pdf_file_name" text,
	"extracted_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "buyer_name_idx" ON "transactions" ("buyer_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "seller_name_idx" ON "transactions" ("seller_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "house_number_idx" ON "transactions" ("house_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "survey_number_idx" ON "transactions" ("survey_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "document_number_idx" ON "transactions" ("document_number");