-- CreateTable
CREATE TABLE "sources" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "short_name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "tier" INTEGER NOT NULL DEFAULT 1,
    "scrape_method" TEXT NOT NULL DEFAULT 'playwright',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_scraped" TIMESTAMP(3),
    "last_success" TIMESTAMP(3),
    "last_error" TEXT,
    "trial_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trials" (
    "id" SERIAL NOT NULL,
    "source_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "source_url" TEXT,
    "avma_registry_id" TEXT,
    "species" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "condition_category" TEXT NOT NULL DEFAULT 'other',
    "condition_specific" TEXT,
    "enrollment_status" TEXT NOT NULL DEFAULT 'unknown',
    "eligibility_summary" TEXT,
    "eligibility_details" TEXT,
    "principal_investigator" TEXT,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "financial_info" TEXT,
    "location_city" TEXT,
    "location_state" TEXT,
    "location_lat" DECIMAL(10,7),
    "location_lng" DECIMAL(10,7),
    "first_seen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_changed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "content_hash" TEXT,
    "raw_extraction" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scrape_logs" (
    "id" SERIAL NOT NULL,
    "source_id" INTEGER NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'running',
    "trials_found" INTEGER DEFAULT 0,
    "trials_new" INTEGER DEFAULT 0,
    "trials_updated" INTEGER DEFAULT 0,
    "trials_removed" INTEGER DEFAULT 0,
    "raw_html_hash" TEXT,
    "raw_html_size" INTEGER,
    "extraction_model" TEXT DEFAULT 'claude-haiku-4-5-20251001',
    "extraction_tokens" INTEGER,
    "error_message" TEXT,
    "error_stack" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scrape_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "species_filter" TEXT[],
    "condition_filter" TEXT[],
    "state_filter" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_notified" TIMESTAMP(3),
    "unsubscribe_token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_log" (
    "id" SERIAL NOT NULL,
    "subscription_id" INTEGER NOT NULL,
    "trial_id" INTEGER NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sources_url_key" ON "sources"("url");

-- CreateIndex
CREATE INDEX "sources_is_active_idx" ON "sources"("is_active");

-- CreateIndex
CREATE INDEX "trials_condition_category_idx" ON "trials"("condition_category");

-- CreateIndex
CREATE INDEX "trials_enrollment_status_idx" ON "trials"("enrollment_status");

-- CreateIndex
CREATE INDEX "trials_is_active_idx" ON "trials"("is_active");

-- CreateIndex
CREATE INDEX "trials_location_state_idx" ON "trials"("location_state");

-- CreateIndex
CREATE UNIQUE INDEX "trials_source_id_title_key" ON "trials"("source_id", "title");

-- CreateIndex
CREATE INDEX "scrape_logs_source_id_idx" ON "scrape_logs"("source_id");

-- CreateIndex
CREATE INDEX "scrape_logs_status_idx" ON "scrape_logs"("status");

-- CreateIndex
CREATE INDEX "scrape_logs_started_at_idx" ON "scrape_logs"("started_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_unsubscribe_token_key" ON "subscriptions"("unsubscribe_token");

-- CreateIndex
CREATE INDEX "subscriptions_is_active_idx" ON "subscriptions"("is_active");

-- CreateIndex
CREATE INDEX "subscriptions_email_idx" ON "subscriptions"("email");

-- CreateIndex
CREATE UNIQUE INDEX "notification_log_subscription_id_trial_id_key" ON "notification_log"("subscription_id", "trial_id");

-- AddForeignKey
ALTER TABLE "trials" ADD CONSTRAINT "trials_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scrape_logs" ADD CONSTRAINT "scrape_logs_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_log" ADD CONSTRAINT "notification_log_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_log" ADD CONSTRAINT "notification_log_trial_id_fkey" FOREIGN KEY ("trial_id") REFERENCES "trials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
