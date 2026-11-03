import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1793739310257 implements MigrationInterface {
    name = 'InitialSchema1793739310257'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "fullName" character varying(120) NOT NULL,
                "email" character varying(160) NOT NULL,
                "passwordHash" character varying,
                "handle" character varying(60),
                "company" character varying(160),
                "accountType" character varying(20) NOT NULL DEFAULT 'enterprise',
                "origin" character varying(20) NOT NULL DEFAULT 'north-africa',
                "title" character varying(120),
                "location" character varying(120),
                "avatarUrl" character varying(300),
                "language" character varying(2) NOT NULL DEFAULT 'FR',
                "verified" boolean NOT NULL DEFAULT false,
                "role" character varying(10) NOT NULL DEFAULT 'user',
                "status" character varying(12) NOT NULL DEFAULT 'active',
                "suspendedUntil" TIMESTAMP WITH TIME ZONE,
                "suspensionReason" character varying(300),
                "termsAcceptedAt" TIMESTAMP WITH TIME ZONE,
                "lastLoginAt" TIMESTAMP WITH TIME ZONE,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
                CONSTRAINT "UQ_6a7e5f591436179c411f5308a9e" UNIQUE ("handle"),
                CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "wechat_links" (
                "userId" uuid NOT NULL,
                "openid" character varying(64) NOT NULL,
                "mode" character varying(8) NOT NULL,
                "status" character varying(16) NOT NULL DEFAULT 'active',
                "relayMessages" boolean NOT NULL DEFAULT true,
                "relayAlerts" boolean NOT NULL DEFAULT true,
                "lastInteractionAt" TIMESTAMP WITH TIME ZONE,
                "replyConversationId" uuid,
                "linkedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_d0867ff6767756877a482d8d65d" PRIMARY KEY ("userId")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_27ed86320b8685cf70502f331e" ON "wechat_links" ("openid")
        `);
        await queryRunner.query(`
            CREATE TABLE "wechat_bind_codes" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "codeHash" character varying(64) NOT NULL,
                "userId" uuid NOT NULL,
                "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
                "usedAt" TIMESTAMP WITH TIME ZONE,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_f54158ba111eb0e0a1f1a671551" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_655fb9229eb368209f7c52d77f" ON "wechat_bind_codes" ("codeHash")
        `);
        await queryRunner.query(`
            CREATE TABLE "wechat_inbound" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "dedupeKey" character varying(160) NOT NULL,
                "openid" character varying(64) NOT NULL,
                "msgType" character varying(20) NOT NULL,
                "event" character varying(30),
                "receivedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_bdfde8d4ec8f4c39d7ebef0bd91" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_3081fd2704daaceaffa7120645" ON "wechat_inbound" ("dedupeKey")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_120e88942083ab8ceb9ac95a63" ON "wechat_inbound" ("openid")
        `);
        await queryRunner.query(`
            CREATE TABLE "wechat_outbox" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "openid" character varying(64) NOT NULL,
                "kind" character varying(10) NOT NULL,
                "conversationId" uuid,
                "content" text NOT NULL,
                "title" character varying(120) NOT NULL,
                "summary" character varying(120) NOT NULL,
                "url" character varying(300),
                "status" character varying(10) NOT NULL DEFAULT 'pending',
                "attempts" integer NOT NULL DEFAULT '0',
                "templateSentAt" TIMESTAMP WITH TIME ZONE,
                "error" character varying(300),
                "sentAt" TIMESTAMP WITH TIME ZONE,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_9a9b40fe039c361e6ecdf179b48" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_302af4b4efa892790eb48e9042" ON "wechat_outbox" ("userId", "status")
        `);
        await queryRunner.query(`
            CREATE TABLE "wechat_sim_messages" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "openid" character varying(64) NOT NULL,
                "direction" character varying(4) NOT NULL,
                "kind" character varying(10) NOT NULL,
                "content" text NOT NULL,
                "url" character varying(300),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_dea1528ed5f6e895a10cb5bf439" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_0e4e65fd790836e9dff4acacaa" ON "wechat_sim_messages" ("openid")
        `);
        await queryRunner.query(`
            CREATE TABLE "customs_tariffs" (
                "id" SERIAL NOT NULL,
                "country" character varying(40) NOT NULL,
                "category" character varying(30) NOT NULL,
                "categoryLabel" character varying(120) NOT NULL,
                "dutyRate" real NOT NULL,
                "vatRate" real NOT NULL,
                "portFees" integer NOT NULL,
                "port" character varying(120) NOT NULL,
                CONSTRAINT "UQ_334e25e01ce1283ed8f8f123e67" UNIQUE ("country", "category"),
                CONSTRAINT "PK_f99ab70fa0b78a30f1bacdef45a" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "freight_rates" (
                "id" SERIAL NOT NULL,
                "country" character varying(40) NOT NULL,
                "mode" character varying(20) NOT NULL,
                "cost" integer NOT NULL,
                "transitTime" character varying(30) NOT NULL,
                CONSTRAINT "UQ_2b96d50bde6e71e68ed8b69e501" UNIQUE ("country", "mode"),
                CONSTRAINT "PK_9e9d22d5e8a1741ef8cf8b0ab9b" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "import_simulations" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "destCountry" character varying(40) NOT NULL,
                "category" character varying(30) NOT NULL,
                "fobValue" real NOT NULL,
                "shippingMode" character varying(10) NOT NULL,
                "containerType" character varying(10) NOT NULL,
                "result" jsonb NOT NULL,
                "quoteRequested" boolean NOT NULL DEFAULT false,
                "fullName" character varying(120),
                "email" character varying(160),
                "phone" character varying(40),
                "notes" text,
                "reference" character varying(20),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "userId" uuid,
                CONSTRAINT "PK_28ecfbd9a6cda8481be52a2d5a1" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "activity_events" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "type" character varying(30) NOT NULL,
                "userId" uuid,
                "targetType" character varying(20),
                "targetId" character varying(80),
                "day" date NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_f8e8d9dbf64f93f58ae52b4a9e4" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_cdb481c718e32caea0c6f5c36b" ON "activity_events" ("userId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_eff48556970ed4f67961f2d0e1" ON "activity_events" ("type", "createdAt")
        `);
        await queryRunner.query(`
            CREATE TABLE "audit_logs" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "actorId" uuid,
                "actorName" character varying(120) NOT NULL,
                "action" character varying(60) NOT NULL,
                "targetType" character varying(20) NOT NULL,
                "targetId" character varying(80) NOT NULL,
                "targetLabel" character varying(200),
                "details" jsonb NOT NULL DEFAULT '{}',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_2dc33f7f3c22e2e7badafca1d1" ON "audit_logs" ("actorId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_c69efb19bf127c97e6740ad530" ON "audit_logs" ("createdAt")
        `);
        await queryRunner.query(`
            CREATE TABLE "hs_codes" (
                "code" character varying(10) NOT NULL,
                "label" character varying(160) NOT NULL,
                "category" character varying(80) NOT NULL,
                "duties" jsonb NOT NULL,
                "keywords" text,
                "requirements" text,
                "featured" boolean NOT NULL DEFAULT false,
                CONSTRAINT "PK_543de0573ec2cddc69ac0b9ba27" PRIMARY KEY ("code")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "regulation_profiles" (
                "id" character varying(80) NOT NULL,
                "name" character varying(160) NOT NULL,
                "kind" character varying(20) NOT NULL,
                "countryCode" character varying(2),
                "summary" text NOT NULL,
                "requirements" jsonb NOT NULL DEFAULT '[]',
                "documents" jsonb NOT NULL DEFAULT '[]',
                "agencies" jsonb NOT NULL DEFAULT '[]',
                "clearanceTime" character varying(60),
                "guideDocumentId" character varying(120),
                CONSTRAINT "PK_7aadb55da048820fdc8d359b51a" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "service_transactions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "reference" character varying(24) NOT NULL,
                "clientId" uuid NOT NULL,
                "providerId" uuid NOT NULL,
                "title" character varying(160) NOT NULL,
                "description" text NOT NULL,
                "expectedDeliveryDate" date,
                "providerTerms" text,
                "currency" character varying(3) NOT NULL,
                "requestedAmount" integer NOT NULL,
                "amount" integer NOT NULL,
                "commissionRateBps" integer NOT NULL DEFAULT '0',
                "processingFeeAmount" integer NOT NULL DEFAULT '0',
                "refundedAmount" integer NOT NULL DEFAULT '0',
                "paidOutAmount" integer NOT NULL DEFAULT '0',
                "status" character varying(32) NOT NULL DEFAULT 'REQUESTED',
                "serviceStatus" character varying(16) NOT NULL DEFAULT 'requested',
                "paymentProvider" character varying(20),
                "checkoutRef" character varying(80),
                "checkoutAttempts" integer NOT NULL DEFAULT '0',
                "paymentRef" character varying(80),
                "paymentFailureReason" character varying(300),
                "acceptedAt" TIMESTAMP WITH TIME ZONE,
                "paidAt" TIMESTAMP WITH TIME ZONE,
                "startedAt" TIMESTAMP WITH TIME ZONE,
                "completionDeclaredAt" TIMESTAMP WITH TIME ZONE,
                "protectionPeriodStartedAt" TIMESTAMP WITH TIME ZONE,
                "protectionDeadlineAt" TIMESTAMP WITH TIME ZONE,
                "deadlineReminderSentAt" TIMESTAMP WITH TIME ZONE,
                "clientConfirmationAt" TIMESTAMP WITH TIME ZONE,
                "disputeSubmittedAt" TIMESTAMP WITH TIME ZONE,
                "disputeStatus" character varying(20),
                "payoutAuthorizedAt" TIMESTAMP WITH TIME ZONE,
                "payoutCompletedAt" TIMESTAMP WITH TIME ZONE,
                "refundCompletedAt" TIMESTAMP WITH TIME ZONE,
                "cancelledAt" TIMESTAMP WITH TIME ZONE,
                "cancellationReason" character varying(500),
                "settlementProposal" jsonb,
                "payoutHold" boolean NOT NULL DEFAULT false,
                "payoutHoldReason" character varying(500),
                "requiresIntervention" boolean NOT NULL DEFAULT false,
                "interventionReason" character varying(500),
                "releaseBlockedReason" character varying(300),
                "version" integer NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_bc8e3152e64df0800ebad8a1e18" UNIQUE ("reference"),
                CONSTRAINT "PK_e639fbf4dab5a8b1af9aa093fd4" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_ccd8ebe6bce78f868248044175" ON "service_transactions" ("clientId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_1988e07d18ebc77481f3f8c740" ON "service_transactions" ("providerId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_cf4fb7d4e2286fdc46ad95bb59" ON "service_transactions" ("status")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_078285cfa2c1a58d9c390120c1" ON "service_transactions" ("checkoutRef")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_db5e6b21bca6c9f5cf63a73e89" ON "service_transactions" ("status", "protectionDeadlineAt")
        `);
        await queryRunner.query(`
            CREATE TABLE "service_transaction_events" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "transactionId" uuid NOT NULL,
                "actorId" uuid,
                "actorRole" character varying(20) NOT NULL,
                "type" character varying(40) NOT NULL,
                "fromStatus" character varying(32),
                "toStatus" character varying(32),
                "message" character varying(500),
                "details" jsonb NOT NULL DEFAULT '{}',
                "internal" boolean NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_77d29d989d364b5fdbaeefd4ff9" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_7396cd0e395b0d23ed50d6b1b1" ON "service_transaction_events" ("transactionId")
        `);
        await queryRunner.query(`
            CREATE TABLE "service_completion_declarations" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "transactionId" uuid NOT NULL,
                "providerId" uuid NOT NULL,
                "details" text NOT NULL,
                "attachmentIds" jsonb NOT NULL DEFAULT '[]',
                "declaredAt" TIMESTAMP WITH TIME ZONE NOT NULL,
                "ip" character varying(60),
                CONSTRAINT "PK_d73faa35e6adc9b484801b21b0b" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_ae4ae5fb53ce79095a04f2be77" ON "service_completion_declarations" ("transactionId")
        `);
        await queryRunner.query(`
            CREATE TABLE "service_disputes" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "transactionId" uuid NOT NULL,
                "clientId" uuid NOT NULL,
                "reason" character varying(30) NOT NULL,
                "description" text NOT NULL,
                "expectedResolution" character varying(30) NOT NULL,
                "requestedRefundAmount" integer,
                "status" character varying(20) NOT NULL DEFAULT 'open',
                "submittedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
                "openedFromStatus" character varying(32) NOT NULL,
                "reviewerId" uuid,
                "reviewerName" character varying(120),
                "reviewStartedAt" TIMESTAMP WITH TIME ZONE,
                "evidenceRequestedFrom" character varying(10),
                "evidenceRequestMessage" character varying(1000),
                "evidenceRequestedAt" TIMESTAMP WITH TIME ZONE,
                "providerRespondedAt" TIMESTAMP WITH TIME ZONE,
                "outcome" character varying(20),
                "decisionRefundAmount" integer,
                "decisionRationale" text,
                "decidedById" uuid,
                "decidedByName" character varying(120),
                "decidedAt" TIMESTAMP WITH TIME ZONE,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_aba96cc3df5151bc8063eb0c235" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_efabb2828fe2e36e6bf53718d2" ON "service_disputes" ("transactionId")
        `);
        await queryRunner.query(`
            CREATE TABLE "service_dispute_entries" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "disputeId" uuid NOT NULL,
                "authorId" uuid,
                "authorName" character varying(120) NOT NULL,
                "authorRole" character varying(20) NOT NULL,
                "kind" character varying(20) NOT NULL,
                "message" text NOT NULL,
                "attachmentIds" jsonb NOT NULL DEFAULT '[]',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_df0a77f217b7776b5413be6a027" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_9ba91e2ab37ebfab7b2a1408f2" ON "service_dispute_entries" ("disputeId")
        `);
        await queryRunner.query(`
            CREATE TABLE "service_refunds" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "transactionId" uuid NOT NULL,
                "disputeId" uuid,
                "source" character varying(30) NOT NULL,
                "amount" integer NOT NULL,
                "currency" character varying(3) NOT NULL,
                "status" character varying(16) NOT NULL DEFAULT 'approved',
                "attempt" integer NOT NULL DEFAULT '0',
                "providerRef" character varying(80),
                "approvedById" uuid,
                "approvedByName" character varying(120),
                "approvedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
                "submittedAt" TIMESTAMP WITH TIME ZONE,
                "completedAt" TIMESTAMP WITH TIME ZONE,
                "failureReason" character varying(300),
                "lastError" character varying(300),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_abd0582a80c8912b87cf29d47d6" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_d7c836aa584b57456318cb780b" ON "service_refunds" ("transactionId")
        `);
        await queryRunner.query(`
            CREATE TABLE "service_payouts" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "transactionId" uuid NOT NULL,
                "providerId" uuid NOT NULL,
                "amount" integer NOT NULL,
                "commissionAmount" integer NOT NULL DEFAULT '0',
                "processingFeeAmount" integer NOT NULL DEFAULT '0',
                "currency" character varying(3) NOT NULL,
                "status" character varying(16) NOT NULL DEFAULT 'pending',
                "attempt" integer NOT NULL DEFAULT '0',
                "providerRef" character varying(80),
                "basis" character varying(30) NOT NULL,
                "authorizedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
                "submittedAt" TIMESTAMP WITH TIME ZONE,
                "completedAt" TIMESTAMP WITH TIME ZONE,
                "failureReason" character varying(300),
                "lastError" character varying(300),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_7c4685796e103257ce94120dfea" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_b0653c6a37d61ed4cffdfa5559" ON "service_payouts" ("transactionId")
        `);
        await queryRunner.query(`
            CREATE TABLE "service_ledger_entries" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "transactionId" uuid NOT NULL,
                "clientId" uuid NOT NULL,
                "providerId" uuid NOT NULL,
                "eventType" character varying(24) NOT NULL,
                "eventStatus" character varying(16) NOT NULL,
                "currency" character varying(3) NOT NULL,
                "amount" integer NOT NULL,
                "grossAmount" integer NOT NULL,
                "commissionAmount" integer NOT NULL,
                "processingFeeAmount" integer NOT NULL,
                "heldAmount" integer NOT NULL,
                "refundAmount" integer NOT NULL,
                "providerPayoutAmount" integer NOT NULL,
                "paymentProviderRef" character varying(80),
                "disputeId" uuid,
                "decisionRef" character varying(120),
                "actorId" uuid,
                "note" character varying(300),
                "idempotencyKey" character varying(160) NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_52a5bf5291992c08bdd9855d1b5" UNIQUE ("idempotencyKey"),
                CONSTRAINT "PK_3da3e3d71d26bc47e48498c2044" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_a46a0a970fa1e2ae897725a4b8" ON "service_ledger_entries" ("transactionId", "createdAt")
        `);
        await queryRunner.query(`
            CREATE TABLE "payment_webhook_events" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "provider" character varying(20) NOT NULL,
                "eventId" character varying(120) NOT NULL,
                "type" character varying(40) NOT NULL,
                "payload" jsonb NOT NULL,
                "status" character varying(16) NOT NULL DEFAULT 'received',
                "error" character varying(300),
                "receivedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "processedAt" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "UQ_02ca09e6dff85644497cdf32ac9" UNIQUE ("provider", "eventId"),
                CONSTRAINT "PK_750875e71d97974be92cee813ba" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "payout_accounts" (
                "userId" uuid NOT NULL,
                "provider" character varying(20) NOT NULL,
                "accountRef" character varying(80) NOT NULL,
                "status" character varying(16) NOT NULL DEFAULT 'pending',
                "label" character varying(120),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_d92a630fd39408f78ad7e172e41" UNIQUE ("accountRef"),
                CONSTRAINT "PK_32c67382404b2953ec4f906db44" PRIMARY KEY ("userId")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "service_attachments" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "ownerId" uuid NOT NULL,
                "transactionId" uuid,
                "originalName" character varying(200) NOT NULL,
                "storagePath" character varying(120) NOT NULL,
                "mime" character varying(120) NOT NULL,
                "size" integer NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_70061aba570e6c7678d3b29a580" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_0c402fdeb9b739833a5c23a839" ON "service_attachments" ("ownerId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_be51bcc7487a26d08904f78eee" ON "service_attachments" ("transactionId")
        `);
        await queryRunner.query(`
            CREATE TABLE "payment_sandbox_records" (
                "id" character varying(80) NOT NULL,
                "kind" character varying(12) NOT NULL,
                "idempotencyKey" character varying(160) NOT NULL,
                "status" character varying(12) NOT NULL DEFAULT 'pending',
                "behavior" character varying(20) NOT NULL DEFAULT 'normal',
                "amount" integer NOT NULL DEFAULT '0',
                "currency" character varying(3),
                "fee" integer NOT NULL DEFAULT '0',
                "linkedRef" character varying(80),
                "failureReason" character varying(300),
                "metadata" jsonb NOT NULL DEFAULT '{}',
                "settledAt" TIMESTAMP WITH TIME ZONE,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_e40103ecfc32a8a7a5898fd7e3f" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_7339f45d23a9527fe72bfed58c" ON "payment_sandbox_records" ("kind", "idempotencyKey")
        `);
        await queryRunner.query(`
            CREATE TABLE "opportunities" (
                "id" character varying(80) NOT NULL,
                "title" character varying(220) NOT NULL,
                "type" character varying(30) NOT NULL,
                "sector" character varying(80) NOT NULL,
                "fromCountry" character varying(60) NOT NULL,
                "toCountry" character varying(60) NOT NULL,
                "country" character varying(60) NOT NULL,
                "amountLabel" character varying(60) NOT NULL,
                "amountMinUsd" bigint,
                "amountMaxUsd" bigint,
                "amountIcon" character varying(10) NOT NULL DEFAULT 'dollar',
                "partnerType" character varying(80) NOT NULL,
                "image" character varying(300) NOT NULL,
                "description" text NOT NULL,
                "deadline" character varying(40),
                "publishedAt" date NOT NULL,
                "verified" boolean NOT NULL DEFAULT true,
                "urgent" boolean NOT NULL DEFAULT false,
                "status" character varying(20) NOT NULL DEFAULT 'active',
                "placements" text NOT NULL,
                CONSTRAINT "PK_4bd9cd12ddc0ff48a5a97ddebce" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "opportunity_applications" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "fullName" character varying(120) NOT NULL,
                "email" character varying(160) NOT NULL,
                "company" character varying(160),
                "phone" character varying(40),
                "message" text,
                "status" character varying(20) NOT NULL DEFAULT 'submitted',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "opportunityId" character varying(80),
                "userId" uuid,
                CONSTRAINT "UQ_37dc8b25bb71661f9370523afca" UNIQUE ("opportunityId", "email"),
                CONSTRAINT "PK_83ac4daad4d23eafc5b25ab6147" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_8016def1042e507215daff54fb" ON "opportunity_applications" ("opportunityId")
        `);
        await queryRunner.query(`
            CREATE TABLE "newsletter_subscriptions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "email" character varying(160) NOT NULL,
                "topics" text NOT NULL,
                "source" character varying(40),
                "active" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_57fd53bd8b39fe19d2be8136f64" UNIQUE ("email"),
                CONSTRAINT "PK_cfca9a6e4f146a80a6cd2e76f1d" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "notifications" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "title" character varying(160) NOT NULL,
                "body" text NOT NULL,
                "type" character varying(20) NOT NULL DEFAULT 'info',
                "link" character varying(120),
                "kind" character varying(40),
                "targetType" character varying(20),
                "targetId" character varying(80),
                "read" boolean NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "userId" uuid,
                CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_692a909ee0fa9383e7859f9b40" ON "notifications" ("userId")
        `);
        await queryRunner.query(`
            CREATE TABLE "documents" (
                "id" character varying(120) NOT NULL,
                "title" character varying(220) NOT NULL,
                "kind" character varying(60) NOT NULL,
                "category" character varying(60) NOT NULL,
                "format" character varying(10) NOT NULL,
                "sizeLabel" character varying(30) NOT NULL,
                "publishedAt" date NOT NULL,
                "dateLabel" character varying(40) NOT NULL,
                "image" character varying(300),
                "description" text NOT NULL,
                "publisher" character varying(120) NOT NULL DEFAULT 'QIAO Intelligence',
                "countries" text,
                "needs" text,
                "sector" character varying(80),
                "reportType" character varying(60),
                "sections" text,
                "baseDownloads" integer NOT NULL DEFAULT '0',
                "downloadsCount" integer NOT NULL DEFAULT '0',
                "viewsCount" integer NOT NULL DEFAULT '0',
                "premium" boolean NOT NULL DEFAULT false,
                "pages" integer NOT NULL DEFAULT '12',
                CONSTRAINT "PK_ac51aa5181ee2036f5ca482857c" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "document_downloads" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "documentId" character varying(120),
                "userId" uuid,
                CONSTRAINT "PK_0ea2f1e4e5dbf16c11e554c3713" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_6735cfddb4bfec306409c0efe2" ON "document_downloads" ("documentId")
        `);
        await queryRunner.query(`
            CREATE TABLE "resource_requests" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "kind" character varying(20) NOT NULL DEFAULT 'request',
                "title" character varying(220) NOT NULL,
                "email" character varying(160) NOT NULL,
                "details" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "userId" uuid,
                CONSTRAINT "PK_6a6bd0748bed5f2ee77983c1530" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "events" (
                "id" character varying(80) NOT NULL,
                "title" character varying(200) NOT NULL,
                "category" character varying(40) NOT NULL,
                "categoryKey" character varying(30) NOT NULL,
                "startDate" date NOT NULL,
                "endDate" date,
                "dateRange" character varying(20) NOT NULL,
                "monthYear" character varying(20) NOT NULL,
                "time" character varying(60) NOT NULL,
                "location" character varying(120) NOT NULL,
                "country" character varying(60) NOT NULL,
                "isOnline" boolean NOT NULL DEFAULT false,
                "format" character varying(10),
                "onlineUrl" character varying(500),
                "priceLabel" character varying(80),
                "image" character varying(300) NOT NULL,
                "description" text NOT NULL,
                "details" jsonb,
                "placements" text NOT NULL,
                "capacity" integer NOT NULL DEFAULT '0',
                "registrationOpen" boolean NOT NULL DEFAULT true,
                "status" character varying(12) NOT NULL DEFAULT 'published',
                "publishedAt" TIMESTAMP WITH TIME ZONE,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_40731c7151fe4be3116e45ddf73" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_03dcebc1ab44daa177ae9479c4" ON "events" ("status")
        `);
        await queryRunner.query(`
            CREATE TABLE "event_registrations" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "fullName" character varying(120) NOT NULL,
                "email" character varying(160) NOT NULL,
                "companyRole" character varying(200) NOT NULL,
                "badgeCode" character varying(20) NOT NULL,
                "status" character varying(12) NOT NULL DEFAULT 'confirmed',
                "source" character varying(10) NOT NULL DEFAULT 'public',
                "adminNote" character varying(500),
                "confirmedAt" TIMESTAMP WITH TIME ZONE,
                "cancelledAt" TIMESTAMP WITH TIME ZONE,
                "checkedInAt" TIMESTAMP WITH TIME ZONE,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "eventId" character varying(80),
                "userId" uuid,
                CONSTRAINT "UQ_e35b3062b9736865ac4ae9586e9" UNIQUE ("eventId", "email"),
                CONSTRAINT "PK_953d3b862c2487289a92b2356e9" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_e4e6dce237a527e4515f3d430f" ON "event_registrations" ("eventId")
        `);
        await queryRunner.query(`
            CREATE TABLE "contact_messages" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "source" character varying(20) NOT NULL,
                "fullName" character varying(120) NOT NULL,
                "email" character varying(160) NOT NULL,
                "phone" character varying(40),
                "company" character varying(160),
                "role" character varying(120),
                "country" character varying(60),
                "sector" character varying(120),
                "subject" character varying(200),
                "message" text NOT NULL,
                "attachmentName" character varying(200),
                "attachmentPath" character varying(300),
                "context" jsonb,
                "status" character varying(20) NOT NULL DEFAULT 'new',
                "reference" character varying(20) NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "userId" uuid,
                CONSTRAINT "UQ_9c8a067e95b5b4acf8fbb275124" UNIQUE ("reference"),
                CONSTRAINT "PK_b74f96eb2edd977ccfba6533293" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "companies" (
                "id" character varying(60) NOT NULL,
                "name" character varying(120) NOT NULL,
                "nativeName" character varying(120),
                "origin" character varying(20) NOT NULL,
                "businessType" character varying(30) NOT NULL,
                "country" character varying(60) NOT NULL,
                "countryCode" character varying(2) NOT NULL,
                "city" character varying(120) NOT NULL,
                "sector" character varying(80) NOT NULL,
                "sectorGroup" character varying(80) NOT NULL,
                "badges" text NOT NULL,
                "verified" boolean NOT NULL DEFAULT true,
                "rating" real NOT NULL,
                "description" text NOT NULL,
                "turnover" character varying(40),
                "turnoverMusd" real,
                "employees" character varying(40),
                "founded" character varying(10),
                "certifications" text,
                "mainProducts" text,
                "contactEmail" character varying(160),
                "logoColor" character varying(10) NOT NULL DEFAULT '#0c4a9e',
                "isStartup" boolean NOT NULL DEFAULT false,
                "featured" boolean NOT NULL DEFAULT false,
                "addedAt" date NOT NULL,
                "addedLabel" character varying(30) NOT NULL,
                CONSTRAINT "PK_d4bc3e82a314fa9e29f652c2c22" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "company_contact_requests" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "fullName" character varying(120) NOT NULL,
                "email" character varying(160) NOT NULL,
                "organization" character varying(160),
                "message" text NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "companyId" character varying(60),
                "userId" uuid,
                CONSTRAINT "PK_2044577b9825d2e27901d932af5" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_352d039cfd60f81a46e7b6f3b2" ON "company_contact_requests" ("companyId")
        `);
        await queryRunner.query(`
            CREATE TABLE "community_categories" (
                "id" character varying(40) NOT NULL,
                "name" character varying(80) NOT NULL,
                "sortOrder" integer NOT NULL DEFAULT '0',
                "active" boolean NOT NULL DEFAULT true,
                CONSTRAINT "PK_1c0aefe676259870609bd08df2a" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "professional_categories" (
                "id" character varying(40) NOT NULL,
                "name" character varying(80) NOT NULL,
                "sortOrder" integer NOT NULL DEFAULT '0',
                "active" boolean NOT NULL DEFAULT true,
                CONSTRAINT "PK_00098887a508be8ef8b4fd6baf9" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "communities" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "slug" character varying(80) NOT NULL,
                "name" character varying(120) NOT NULL,
                "description" text NOT NULL,
                "rules" text,
                "coverImage" character varying(300),
                "icon" character varying(40) NOT NULL DEFAULT 'Users',
                "languages" text NOT NULL,
                "scope" character varying(160),
                "visibility" character varying(12) NOT NULL DEFAULT 'public',
                "membershipPolicy" character varying(12) NOT NULL DEFAULT 'open',
                "status" character varying(10) NOT NULL DEFAULT 'active',
                "featured" boolean NOT NULL DEFAULT false,
                "sortOrder" integer NOT NULL DEFAULT '0',
                "membersCount" integer NOT NULL DEFAULT '0',
                "postsCount" integer NOT NULL DEFAULT '0',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "categoryId" character varying(40),
                "createdById" uuid,
                CONSTRAINT "PK_fea1fe83c86ccde9d0a089e7ea2" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_42d5225a80ac87aa1254dfe282" ON "communities" ("slug")
        `);
        await queryRunner.query(`
            CREATE TABLE "community_memberships" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "status" character varying(10) NOT NULL,
                "role" character varying(10) NOT NULL DEFAULT 'member',
                "requestMessage" character varying(500),
                "joinedAt" TIMESTAMP WITH TIME ZONE,
                "decidedAt" TIMESTAMP WITH TIME ZONE,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "userId" uuid,
                "communityId" uuid,
                "decidedById" uuid,
                "invitedById" uuid,
                CONSTRAINT "UQ_54f7b5f1404e0106ddf522d314d" UNIQUE ("userId", "communityId"),
                CONSTRAINT "PK_9793d8b3e502f2c2bae656c6bb8" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_488d1ca96e355e11d83480a8f2" ON "community_memberships" ("userId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_2e18334827babeb19cd64ab532" ON "community_memberships" ("communityId", "status")
        `);
        await queryRunner.query(`
            CREATE TABLE "community_posts" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "type" character varying(10) NOT NULL DEFAULT 'post',
                "title" character varying(200),
                "content" text NOT NULL,
                "tags" text NOT NULL,
                "language" character varying(5) NOT NULL DEFAULT 'fr',
                "status" character varying(10) NOT NULL DEFAULT 'published',
                "questionStatus" character varying(10),
                "acceptedCommentId" uuid,
                "locked" boolean NOT NULL DEFAULT false,
                "attachments" jsonb NOT NULL DEFAULT '[]',
                "links" jsonb NOT NULL DEFAULT '[]',
                "likesCount" integer NOT NULL DEFAULT '0',
                "commentsCount" integer NOT NULL DEFAULT '0',
                "editedAt" TIMESTAMP WITH TIME ZONE,
                "firstResponseAt" TIMESTAMP WITH TIME ZONE,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "authorId" uuid,
                "communityId" uuid,
                "professionalCategoryId" character varying(40),
                CONSTRAINT "PK_af0c0b33e03b933e3e48119f2e3" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_7c9e434b072122306431dc28d9" ON "community_posts" ("authorId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_e6e5240467a0b1f3a3285eb3f5" ON "community_posts" ("communityId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_00ea3cceee0698cca59c82942b" ON "community_posts" ("status", "createdAt")
        `);
        await queryRunner.query(`
            CREATE TABLE "community_comments" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "text" text NOT NULL,
                "status" character varying(10) NOT NULL DEFAULT 'published',
                "likesCount" integer NOT NULL DEFAULT '0',
                "editedAt" TIMESTAMP WITH TIME ZONE,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "postId" uuid,
                "authorId" uuid,
                "parentId" uuid,
                CONSTRAINT "PK_bddaf18297fe4a6d1cd539586b3" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_9ad7962abd429eb4ffc64b276b" ON "community_comments" ("parentId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_ef3905ef22f1379a174d22c57f" ON "community_comments" ("postId", "createdAt")
        `);
        await queryRunner.query(`
            CREATE TABLE "community_reactions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "targetType" character varying(10) NOT NULL,
                "targetId" uuid NOT NULL,
                "reactionType" character varying(10) NOT NULL DEFAULT 'like',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "userId" uuid,
                CONSTRAINT "UQ_ea4a5bb0dd64bd688ce06a6d581" UNIQUE (
                    "userId",
                    "targetType",
                    "targetId",
                    "reactionType"
                ),
                CONSTRAINT "PK_2e146ef302d2e8421222402611e" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_70e0dd701ced1d31294229fb9a" ON "community_reactions" ("targetType", "targetId")
        `);
        await queryRunner.query(`
            CREATE TABLE "community_post_bookmarks" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "postId" uuid,
                "userId" uuid,
                CONSTRAINT "UQ_cff1588aa405715881d46b8617a" UNIQUE ("postId", "userId"),
                CONSTRAINT "PK_0bca8a24ce275619e31cf30b724" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "community_follows" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "targetType" character varying(10) NOT NULL,
                "targetId" uuid NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "followerId" uuid,
                CONSTRAINT "UQ_390f7308febff96dd654de3460b" UNIQUE ("followerId", "targetType", "targetId"),
                CONSTRAINT "PK_b948f052c9a834e522c03b2d970" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_c884040b07c627de53d2c9e94c" ON "community_follows" ("followerId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_083ee8f4eb2b58834b21cf1f0e" ON "community_follows" ("targetType", "targetId")
        `);
        await queryRunner.query(`
            CREATE TABLE "community_attachments" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "postId" uuid,
                "originalName" character varying(200) NOT NULL,
                "mime" character varying(100) NOT NULL,
                "size" integer NOT NULL,
                "storagePath" character varying(200) NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "ownerId" uuid,
                CONSTRAINT "PK_23482c5e75d0297b8654a3b79f4" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_c46f83a00342d3b5716ef8e5c6" ON "community_attachments" ("postId")
        `);
        await queryRunner.query(`
            CREATE TABLE "member_profiles" (
                "userId" uuid NOT NULL,
                "headline" character varying(160),
                "bio" text,
                "country" character varying(60),
                "city" character varying(80),
                "languages" text,
                "sectors" text,
                "interests" text,
                "privacy" jsonb NOT NULL DEFAULT '{"profile":"public","company":"public","location":"public","bio":"public","languages":"public","communities":"members","activity":"public","email":"private","messages":"connections"}',
                "notificationPrefs" jsonb NOT NULL DEFAULT '{}',
                "followersCount" integer NOT NULL DEFAULT '0',
                "followingCount" integer NOT NULL DEFAULT '0',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_75df452a05ee3697b2ec22bd8ab" PRIMARY KEY ("userId")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "expert_profiles" (
                "userId" uuid NOT NULL,
                "listed" boolean NOT NULL DEFAULT true,
                "headline" character varying(160) NOT NULL,
                "biography" text,
                "categories" text NOT NULL,
                "countriesServed" text,
                "languages" text,
                "yearsExperience" smallint,
                "verificationStatus" character varying(12) NOT NULL DEFAULT 'none',
                "verificationEvidence" text,
                "verificationNote" character varying(500),
                "verificationRequestedAt" TIMESTAMP WITH TIME ZONE,
                "verifiedAt" TIMESTAMP WITH TIME ZONE,
                "profileViews" integer NOT NULL DEFAULT '0',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "verifiedById" uuid,
                CONSTRAINT "PK_d3919b2c8325bbdbab2c2941913" PRIMARY KEY ("userId")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "member_blocks" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "blockerId" uuid,
                "blockedId" uuid,
                CONSTRAINT "UQ_7bb51edb01aaa4a64f81b514c01" UNIQUE ("blockerId", "blockedId"),
                CONSTRAINT "PK_0bdbdb881f4638676bd5ee8c45d" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_4fa1cbfadd60bd493543e94093" ON "member_blocks" ("blockerId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_ac4f9c31f6a250493bb906b435" ON "member_blocks" ("blockedId")
        `);
        await queryRunner.query(`
            CREATE TABLE "conversations" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "pairKey" character varying(80) NOT NULL,
                "contextType" character varying(10),
                "contextId" character varying(80),
                "contextLabel" character varying(200),
                "lastMessageAt" TIMESTAMP WITH TIME ZONE NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_ee34f4f7ced4ec8681f26bf04ef" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_c2e9a7b1452f56f8ff45b5a21c" ON "conversations" ("pairKey")
        `);
        await queryRunner.query(`
            CREATE TABLE "conversation_participants" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "lastReadAt" TIMESTAMP WITH TIME ZONE,
                "conversationId" uuid,
                "userId" uuid,
                CONSTRAINT "UQ_e43efbfa3b850160b5b2c50e3ec" UNIQUE ("conversationId", "userId"),
                CONSTRAINT "PK_61b51428ad9453f5921369fbe94" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_4453e20858b14ab765a09ad728" ON "conversation_participants" ("conversationId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_18c4ba3b127461649e5f5039db" ON "conversation_participants" ("userId")
        `);
        await queryRunner.query(`
            CREATE TABLE "messages" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "body" text NOT NULL,
                "status" character varying(10) NOT NULL DEFAULT 'sent',
                "source" character varying(10) NOT NULL DEFAULT 'web',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "conversationId" uuid,
                "authorId" uuid,
                CONSTRAINT "PK_18325f38ae6de43878487eff986" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_751332fc6cc6fc576c6975cd07" ON "messages" ("conversationId", "createdAt")
        `);
        await queryRunner.query(`
            CREATE TABLE "moderation_reports" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "targetType" character varying(10) NOT NULL,
                "targetId" uuid NOT NULL,
                "snapshot" text,
                "reason" character varying(20) NOT NULL,
                "description" text,
                "status" character varying(14) NOT NULL DEFAULT 'new',
                "escalated" boolean NOT NULL DEFAULT false,
                "action" character varying(20),
                "resolution" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "resolvedAt" TIMESTAMP WITH TIME ZONE,
                "reporterId" uuid,
                "communityId" uuid,
                "targetUserId" uuid,
                "assignedToId" uuid,
                "resolvedById" uuid,
                CONSTRAINT "PK_a40784ec3803830fe974b4b85fb" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_6beeb86d529a595d73fdc34b80" ON "moderation_reports" ("communityId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_5bb9a5acc4357c538c3f0fe2a7" ON "moderation_reports" ("status", "createdAt")
        `);
        await queryRunner.query(`
            CREATE TABLE "match_requests" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "profileType" character varying(120) NOT NULL,
                "description" text NOT NULL,
                "fullName" character varying(120) NOT NULL,
                "email" character varying(160) NOT NULL,
                "status" character varying(20) NOT NULL DEFAULT 'new',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "userId" uuid,
                CONSTRAINT "PK_7349a97326e887defffe4531598" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "services" (
                "id" character varying(80) NOT NULL,
                "title" character varying(160) NOT NULL,
                "description" text NOT NULL,
                "category" character varying(40) NOT NULL,
                "iconName" character varying(40) NOT NULL,
                "image" character varying(300) NOT NULL,
                "isNew" boolean NOT NULL DEFAULT false,
                "accentColor" character varying(10) NOT NULL DEFAULT 'blue',
                "details" jsonb NOT NULL DEFAULT '[]',
                "sortOrder" integer NOT NULL DEFAULT '0',
                CONSTRAINT "PK_ba2d347a3168a296416c6c5ccb2" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "auth_identities" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "provider" character varying(12) NOT NULL,
                "providerSubject" character varying(160) NOT NULL,
                "displayName" character varying(160),
                "providerEmail" character varying(160),
                "status" character varying(10) NOT NULL DEFAULT 'active',
                "linkedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "userId" uuid,
                CONSTRAINT "UQ_749309947a195ba9df9ede4dd96" UNIQUE ("provider", "providerSubject"),
                CONSTRAINT "PK_63a29aebcddd09448dbeee4666b" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_6ed26ac7e2276ae145ca68c23a" ON "auth_identities" ("userId")
        `);
        await queryRunner.query(`
            CREATE TABLE "user_sessions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "provider" character varying(12) NOT NULL,
                "userAgent" character varying(200),
                "ip" character varying(60),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "lastUsedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
                "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
                "revokedAt" TIMESTAMP WITH TIME ZONE,
                "userId" uuid,
                CONSTRAINT "PK_e93e031a5fed190d4789b6bfd83" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_55fa4db8406ed66bc704432842" ON "user_sessions" ("userId")
        `);
        await queryRunner.query(`
            CREATE TABLE "auth_tickets" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "kind" character varying(10) NOT NULL,
                "secretHash" character varying(64) NOT NULL,
                "payload" jsonb NOT NULL DEFAULT '{}',
                "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
                "usedAt" TIMESTAMP WITH TIME ZONE,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_0e983916520b0e79f76f1a06a5d" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_4c63ce519cdb503dcc778ae065" ON "auth_tickets" ("secretHash")
        `);
        await queryRunner.query(`
            CREATE TABLE "articles" (
                "id" character varying(80) NOT NULL,
                "title" character varying(220) NOT NULL,
                "summary" text NOT NULL,
                "category" character varying(60) NOT NULL,
                "publishedAt" date NOT NULL,
                "dateLabel" character varying(40) NOT NULL,
                "readTime" character varying(30) NOT NULL,
                "image" character varying(300) NOT NULL,
                "author" character varying(120) NOT NULL DEFAULT 'QIAO Intelligence',
                "keyPoints" jsonb NOT NULL DEFAULT '[]',
                "content" jsonb NOT NULL DEFAULT '[]',
                "placements" text NOT NULL,
                "countries" text,
                "sector" character varying(80),
                "analysisType" character varying(60),
                "viewsCount" integer NOT NULL DEFAULT '0',
                CONSTRAINT "PK_0a6e2c450d83e0b6052c2793334" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "appointments" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "specialty" character varying(30) NOT NULL,
                "date" date NOT NULL,
                "time" character varying(5) NOT NULL,
                "fullName" character varying(120) NOT NULL,
                "email" character varying(160) NOT NULL,
                "phone" character varying(40),
                "notes" text,
                "source" character varying(40),
                "status" character varying(20) NOT NULL DEFAULT 'confirmed',
                "meetingLink" character varying(200) NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "userId" uuid,
                CONSTRAINT "PK_4a437a9a27e948726b8bb3e36ad" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_0554c12733d3be64c2e7eaaa5e" ON "appointments" ("specialty", "date", "time")
        `);
        await queryRunner.query(`
            CREATE TABLE "training_domains" (
                "id" character varying(60) NOT NULL,
                "title" character varying(160) NOT NULL,
                "description" text NOT NULL,
                "iconName" character varying(40) NOT NULL,
                "coursesCount" integer NOT NULL,
                "featuredCourse" character varying(200) NOT NULL,
                "duration" character varying(40) NOT NULL,
                "accentColor" character varying(10) NOT NULL DEFAULT 'blue',
                "sortOrder" integer NOT NULL DEFAULT '0',
                "status" character varying(20) NOT NULL DEFAULT 'published',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_16690b7b508355f800dced33c8a" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "courses" (
                "id" character varying(80) NOT NULL,
                "title" character varying(200) NOT NULL,
                "instructor" character varying(120) NOT NULL,
                "instructorRole" character varying(200),
                "instructorImg" character varying(300) NOT NULL,
                "rating" real NOT NULL,
                "reviewsCount" integer NOT NULL,
                "duration" character varying(30) NOT NULL,
                "durationMinutes" integer NOT NULL,
                "price" integer NOT NULL,
                "image" character varying(300) NOT NULL,
                "domain" character varying(30) NOT NULL,
                "level" character varying(30) NOT NULL,
                "format" character varying(40) NOT NULL,
                "badge" character varying(30),
                "badgeColor" character varying(30),
                "description" text NOT NULL,
                "modules" jsonb NOT NULL DEFAULT '[]',
                "sections" text,
                "trainingDomainId" character varying(60),
                "sortOrder" integer NOT NULL DEFAULT '0',
                "status" character varying(20) NOT NULL DEFAULT 'published',
                "publishedAt" TIMESTAMP WITH TIME ZONE,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_3f70a487cc718ad8eda4e6d58c9" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "learning_paths" (
                "id" character varying(80) NOT NULL,
                "title" character varying(200) NOT NULL,
                "coursesCount" integer NOT NULL,
                "duration" character varying(20) NOT NULL,
                "price" integer NOT NULL,
                "image" character varying(300) NOT NULL,
                "description" text NOT NULL,
                "courseIds" jsonb NOT NULL DEFAULT '[]',
                "sortOrder" integer NOT NULL DEFAULT '0',
                "status" character varying(20) NOT NULL DEFAULT 'published',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_2f073530d2af4a865296c06274c" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "course_modules" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "courseId" character varying(80) NOT NULL,
                "title" character varying(200) NOT NULL,
                "description" text,
                "sortOrder" integer NOT NULL DEFAULT '0',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_4c195db0718e8845a6e09075ebc" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_0a332e19d988804687be4637bf" ON "course_modules" ("courseId")
        `);
        await queryRunner.query(`
            CREATE TABLE "course_lessons" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "moduleId" uuid NOT NULL,
                "courseId" character varying(80) NOT NULL,
                "title" character varying(200) NOT NULL,
                "type" character varying(10) NOT NULL,
                "content" text,
                "videoUrl" character varying(500),
                "fileId" uuid,
                "durationMinutes" integer NOT NULL DEFAULT '0',
                "sortOrder" integer NOT NULL DEFAULT '0',
                "published" boolean NOT NULL DEFAULT true,
                "quiz" jsonb,
                "resources" jsonb,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_3b9df6e0f006a24c680208e4e9e" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_596ed2ecd8c2324c49a575ccef" ON "course_lessons" ("moduleId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_a4dc7855b148a230609fbf3854" ON "course_lessons" ("courseId")
        `);
        await queryRunner.query(`
            CREATE TABLE "lesson_notes" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "courseId" character varying(80) NOT NULL,
                "lessonId" uuid NOT NULL,
                "seconds" integer,
                "text" character varying(2000) NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_89780b18199ecda10d5913f3747" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_b401460a5e33e637ede3543097" ON "lesson_notes" ("lessonId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_a12a5536d02d2ed563c08a8915" ON "lesson_notes" ("userId", "courseId")
        `);
        await queryRunner.query(`
            CREATE TABLE "academy_files" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "purpose" character varying(10) NOT NULL,
                "originalName" character varying(200) NOT NULL,
                "mime" character varying(120) NOT NULL,
                "size" integer NOT NULL,
                "storagePath" character varying(200) NOT NULL,
                "uploadedById" uuid,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_2f9779da02ceb17ae282d315e07" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "lesson_progress" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "lessonId" uuid NOT NULL,
                "courseId" character varying(80) NOT NULL,
                "completedAt" TIMESTAMP WITH TIME ZONE,
                "bestScore" integer,
                "attempts" integer NOT NULL DEFAULT '0',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_ad81afae954f3a14766e7bf8106" UNIQUE ("userId", "lessonId"),
                CONSTRAINT "PK_e6223ebbc5f8f5fce40e0193de1" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_eb4349e70765bb218bb4f833f6" ON "lesson_progress" ("userId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_08ea29c5aca5109ece6d1e29d9" ON "lesson_progress" ("courseId")
        `);
        await queryRunner.query(`
            CREATE TABLE "course_favorites" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "userId" uuid,
                "courseId" character varying(80),
                CONSTRAINT "UQ_f85af63b3255c6d9ea8d36f9af9" UNIQUE ("userId", "courseId"),
                CONSTRAINT "PK_8d039c4a7f7ce547b72633a190f" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_eab0a90106e3ee120a511cdb9d" ON "course_favorites" ("userId")
        `);
        await queryRunner.query(`
            CREATE TABLE "cart_items" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "itemType" character varying(10) NOT NULL,
                "itemId" character varying(80) NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "userId" uuid,
                CONSTRAINT "UQ_751c9cbc7aa301d7ba5d7edb651" UNIQUE ("userId", "itemType", "itemId"),
                CONSTRAINT "PK_6fccf5ec03c172d27a28a82928b" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_84e765378a5f03ad9900df3a9b" ON "cart_items" ("userId")
        `);
        await queryRunner.query(`
            CREATE TABLE "orders" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "reference" character varying(20) NOT NULL,
                "items" jsonb NOT NULL,
                "total" integer NOT NULL,
                "currency" character varying(10) NOT NULL DEFAULT 'TND',
                "status" character varying(20) NOT NULL DEFAULT 'confirmed',
                "paymentMethod" character varying(10),
                "chargedAmount" integer,
                "chargedCurrency" character varying(3),
                "exchangeRate" character varying(20),
                "checkoutRef" character varying(200),
                "checkoutAttempts" integer NOT NULL DEFAULT '0',
                "paymentRef" character varying(200),
                "paidAt" TIMESTAMP WITH TIME ZONE,
                "cancelledAt" TIMESTAMP WITH TIME ZONE,
                "handledById" uuid,
                "adminNote" character varying(500),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "userId" uuid,
                CONSTRAINT "UQ_14ea6251b9edf64025257e7475b" UNIQUE ("reference"),
                CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_151b79a83ba240b0cb31b2302d" ON "orders" ("userId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_775c9f06fc27ae3ff8fb26f2c4" ON "orders" ("status")
        `);
        await queryRunner.query(`
            CREATE TABLE "academy_settings" (
                "id" character varying(20) NOT NULL,
                "eurPerTnd" character varying(20),
                "bank" jsonb,
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_ba06bcf9f5f35e7d2636c6a546b" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "enrollments" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "itemType" character varying(10) NOT NULL,
                "itemId" character varying(80) NOT NULL,
                "title" character varying(200) NOT NULL,
                "image" character varying(300) NOT NULL,
                "progress" integer NOT NULL DEFAULT '0',
                "status" character varying(20) NOT NULL DEFAULT 'active',
                "source" character varying(10) NOT NULL DEFAULT 'order',
                "viaPathId" character varying(80),
                "lastLessonId" uuid,
                "lastActivityAt" TIMESTAMP WITH TIME ZONE,
                "completedAt" TIMESTAMP WITH TIME ZONE,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "userId" uuid,
                CONSTRAINT "UQ_6d73ab41612c27e3d4be1c016f0" UNIQUE ("userId", "itemType", "itemId"),
                CONSTRAINT "PK_7c0f752f9fb68bf6ed7367ab00f" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_de33d443c8ae36800c37c58c92" ON "enrollments" ("userId")
        `);
        await queryRunner.query(`
            CREATE TABLE "academy_certificates" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "number" character varying(24) NOT NULL,
                "userId" uuid NOT NULL,
                "courseId" character varying(80) NOT NULL,
                "holderName" character varying(120) NOT NULL,
                "courseTitle" character varying(200) NOT NULL,
                "instructor" character varying(120) NOT NULL,
                "lessonsCount" integer NOT NULL DEFAULT '0',
                "quizzesCount" integer NOT NULL DEFAULT '0',
                "averageScore" integer,
                "issuedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
                "status" character varying(10) NOT NULL DEFAULT 'valid',
                "revokedAt" TIMESTAMP WITH TIME ZONE,
                "revokedReason" character varying(500),
                "revokedById" uuid,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_16ed85364896288908807f1a7fd" UNIQUE ("number"),
                CONSTRAINT "UQ_c9bb30e09aeaa358b37a6329669" UNIQUE ("userId", "courseId"),
                CONSTRAINT "PK_2173c312adff95a6ce9fe55f710" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_e8a66d6bb092ad6a68376776ca" ON "academy_certificates" ("userId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_fb96279cd07e908e59f7fc0926" ON "academy_certificates" ("courseId")
        `);
        await queryRunner.query(`
            ALTER TABLE "wechat_links"
            ADD CONSTRAINT "FK_d0867ff6767756877a482d8d65d" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "import_simulations"
            ADD CONSTRAINT "FK_1b0adc8625e4411bdc72df28223" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "service_transactions"
            ADD CONSTRAINT "FK_ccd8ebe6bce78f8682480441758" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "service_transactions"
            ADD CONSTRAINT "FK_1988e07d18ebc77481f3f8c740a" FOREIGN KEY ("providerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "payout_accounts"
            ADD CONSTRAINT "FK_32c67382404b2953ec4f906db44" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "opportunity_applications"
            ADD CONSTRAINT "FK_8016def1042e507215daff54fbe" FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "opportunity_applications"
            ADD CONSTRAINT "FK_068fc90d41f3ffe8e5333135007" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "notifications"
            ADD CONSTRAINT "FK_692a909ee0fa9383e7859f9b406" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "document_downloads"
            ADD CONSTRAINT "FK_6735cfddb4bfec306409c0efe2d" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "document_downloads"
            ADD CONSTRAINT "FK_dda4875e81a7b1fdf91f12fa347" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "resource_requests"
            ADD CONSTRAINT "FK_2f641bbddb484248a5a9d86cd88" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "event_registrations"
            ADD CONSTRAINT "FK_e4e6dce237a527e4515f3d430f1" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "event_registrations"
            ADD CONSTRAINT "FK_7a072346484fe1d7ee0fb9dfaa8" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "contact_messages"
            ADD CONSTRAINT "FK_c4f2c2dac3ce280013b8d39dd48" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "company_contact_requests"
            ADD CONSTRAINT "FK_352d039cfd60f81a46e7b6f3b21" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "company_contact_requests"
            ADD CONSTRAINT "FK_154170ee91f7a2f47899f266827" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "communities"
            ADD CONSTRAINT "FK_8c9599fdc7b6ebc8b8d3159d609" FOREIGN KEY ("categoryId") REFERENCES "community_categories"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "communities"
            ADD CONSTRAINT "FK_d035f75868bd42e56593ffa4aa7" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "community_memberships"
            ADD CONSTRAINT "FK_488d1ca96e355e11d83480a8f2c" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "community_memberships"
            ADD CONSTRAINT "FK_6ea82875cc58f4b1b14ebe49717" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "community_memberships"
            ADD CONSTRAINT "FK_deca8716c1b87ef676762326a66" FOREIGN KEY ("decidedById") REFERENCES "users"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "community_memberships"
            ADD CONSTRAINT "FK_b473a456fef21ada0e60e517809" FOREIGN KEY ("invitedById") REFERENCES "users"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "community_posts"
            ADD CONSTRAINT "FK_7c9e434b072122306431dc28d9c" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "community_posts"
            ADD CONSTRAINT "FK_e6e5240467a0b1f3a3285eb3f5d" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "community_posts"
            ADD CONSTRAINT "FK_a6e715d3d5a0ccef260cd0e6097" FOREIGN KEY ("professionalCategoryId") REFERENCES "professional_categories"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "community_comments"
            ADD CONSTRAINT "FK_8cd0b0aabf6e25d0d2f28af6ea4" FOREIGN KEY ("postId") REFERENCES "community_posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "community_comments"
            ADD CONSTRAINT "FK_1ec11e701aeddaa30a81c998f23" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "community_comments"
            ADD CONSTRAINT "FK_9ad7962abd429eb4ffc64b276b8" FOREIGN KEY ("parentId") REFERENCES "community_comments"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "community_reactions"
            ADD CONSTRAINT "FK_7d563b835f3908a701100f07e7f" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "community_post_bookmarks"
            ADD CONSTRAINT "FK_587a9116ebd58ef57283abf98b0" FOREIGN KEY ("postId") REFERENCES "community_posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "community_post_bookmarks"
            ADD CONSTRAINT "FK_0e59c43a22319e357ea86b3daaa" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "community_follows"
            ADD CONSTRAINT "FK_c884040b07c627de53d2c9e94c0" FOREIGN KEY ("followerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "community_attachments"
            ADD CONSTRAINT "FK_a5cae5314babe0c1ee3952b7663" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "member_profiles"
            ADD CONSTRAINT "FK_75df452a05ee3697b2ec22bd8ab" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "expert_profiles"
            ADD CONSTRAINT "FK_d3919b2c8325bbdbab2c2941913" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "expert_profiles"
            ADD CONSTRAINT "FK_2e39c68cf43a278e248519b4e34" FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "member_blocks"
            ADD CONSTRAINT "FK_4fa1cbfadd60bd493543e94093f" FOREIGN KEY ("blockerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "member_blocks"
            ADD CONSTRAINT "FK_ac4f9c31f6a250493bb906b435a" FOREIGN KEY ("blockedId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "conversation_participants"
            ADD CONSTRAINT "FK_4453e20858b14ab765a09ad728c" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "conversation_participants"
            ADD CONSTRAINT "FK_18c4ba3b127461649e5f5039dbf" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "messages"
            ADD CONSTRAINT "FK_e5663ce0c730b2de83445e2fd19" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "messages"
            ADD CONSTRAINT "FK_819e6bb0ee78baf73c398dc707f" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "moderation_reports"
            ADD CONSTRAINT "FK_83b642e4e2f5985d3c3fadeb05a" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "moderation_reports"
            ADD CONSTRAINT "FK_6beeb86d529a595d73fdc34b808" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "moderation_reports"
            ADD CONSTRAINT "FK_9941eb077f364b9848639f88f55" FOREIGN KEY ("targetUserId") REFERENCES "users"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "moderation_reports"
            ADD CONSTRAINT "FK_5d45708c29f45082c8b0bf9cd0d" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "moderation_reports"
            ADD CONSTRAINT "FK_ddd8920e8fc543bda2a6c5fc8b0" FOREIGN KEY ("resolvedById") REFERENCES "users"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "match_requests"
            ADD CONSTRAINT "FK_b7ee69d21567cdd9b494766b68a" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "auth_identities"
            ADD CONSTRAINT "FK_6ed26ac7e2276ae145ca68c23af" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "user_sessions"
            ADD CONSTRAINT "FK_55fa4db8406ed66bc7044328427" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "appointments"
            ADD CONSTRAINT "FK_01733651151c8a1d6d980135cc4" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "course_modules"
            ADD CONSTRAINT "FK_0a332e19d988804687be4637bfc" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "course_lessons"
            ADD CONSTRAINT "FK_596ed2ecd8c2324c49a575ccef6" FOREIGN KEY ("moduleId") REFERENCES "course_modules"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "lesson_notes"
            ADD CONSTRAINT "FK_b401460a5e33e637ede35430973" FOREIGN KEY ("lessonId") REFERENCES "course_lessons"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "lesson_progress"
            ADD CONSTRAINT "FK_eb4349e70765bb218bb4f833f68" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "lesson_progress"
            ADD CONSTRAINT "FK_df13299d2740b302dd44a368df9" FOREIGN KEY ("lessonId") REFERENCES "course_lessons"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "course_favorites"
            ADD CONSTRAINT "FK_eab0a90106e3ee120a511cdb9d0" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "course_favorites"
            ADD CONSTRAINT "FK_e19b57fec7a50afaf297ca0ac76" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "cart_items"
            ADD CONSTRAINT "FK_84e765378a5f03ad9900df3a9ba" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "orders"
            ADD CONSTRAINT "FK_151b79a83ba240b0cb31b2302d1" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "enrollments"
            ADD CONSTRAINT "FK_de33d443c8ae36800c37c58c929" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "academy_certificates"
            ADD CONSTRAINT "FK_e8a66d6bb092ad6a68376776ca3" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "academy_certificates" DROP CONSTRAINT "FK_e8a66d6bb092ad6a68376776ca3"
        `);
        await queryRunner.query(`
            ALTER TABLE "enrollments" DROP CONSTRAINT "FK_de33d443c8ae36800c37c58c929"
        `);
        await queryRunner.query(`
            ALTER TABLE "orders" DROP CONSTRAINT "FK_151b79a83ba240b0cb31b2302d1"
        `);
        await queryRunner.query(`
            ALTER TABLE "cart_items" DROP CONSTRAINT "FK_84e765378a5f03ad9900df3a9ba"
        `);
        await queryRunner.query(`
            ALTER TABLE "course_favorites" DROP CONSTRAINT "FK_e19b57fec7a50afaf297ca0ac76"
        `);
        await queryRunner.query(`
            ALTER TABLE "course_favorites" DROP CONSTRAINT "FK_eab0a90106e3ee120a511cdb9d0"
        `);
        await queryRunner.query(`
            ALTER TABLE "lesson_progress" DROP CONSTRAINT "FK_df13299d2740b302dd44a368df9"
        `);
        await queryRunner.query(`
            ALTER TABLE "lesson_progress" DROP CONSTRAINT "FK_eb4349e70765bb218bb4f833f68"
        `);
        await queryRunner.query(`
            ALTER TABLE "lesson_notes" DROP CONSTRAINT "FK_b401460a5e33e637ede35430973"
        `);
        await queryRunner.query(`
            ALTER TABLE "course_lessons" DROP CONSTRAINT "FK_596ed2ecd8c2324c49a575ccef6"
        `);
        await queryRunner.query(`
            ALTER TABLE "course_modules" DROP CONSTRAINT "FK_0a332e19d988804687be4637bfc"
        `);
        await queryRunner.query(`
            ALTER TABLE "appointments" DROP CONSTRAINT "FK_01733651151c8a1d6d980135cc4"
        `);
        await queryRunner.query(`
            ALTER TABLE "user_sessions" DROP CONSTRAINT "FK_55fa4db8406ed66bc7044328427"
        `);
        await queryRunner.query(`
            ALTER TABLE "auth_identities" DROP CONSTRAINT "FK_6ed26ac7e2276ae145ca68c23af"
        `);
        await queryRunner.query(`
            ALTER TABLE "match_requests" DROP CONSTRAINT "FK_b7ee69d21567cdd9b494766b68a"
        `);
        await queryRunner.query(`
            ALTER TABLE "moderation_reports" DROP CONSTRAINT "FK_ddd8920e8fc543bda2a6c5fc8b0"
        `);
        await queryRunner.query(`
            ALTER TABLE "moderation_reports" DROP CONSTRAINT "FK_5d45708c29f45082c8b0bf9cd0d"
        `);
        await queryRunner.query(`
            ALTER TABLE "moderation_reports" DROP CONSTRAINT "FK_9941eb077f364b9848639f88f55"
        `);
        await queryRunner.query(`
            ALTER TABLE "moderation_reports" DROP CONSTRAINT "FK_6beeb86d529a595d73fdc34b808"
        `);
        await queryRunner.query(`
            ALTER TABLE "moderation_reports" DROP CONSTRAINT "FK_83b642e4e2f5985d3c3fadeb05a"
        `);
        await queryRunner.query(`
            ALTER TABLE "messages" DROP CONSTRAINT "FK_819e6bb0ee78baf73c398dc707f"
        `);
        await queryRunner.query(`
            ALTER TABLE "messages" DROP CONSTRAINT "FK_e5663ce0c730b2de83445e2fd19"
        `);
        await queryRunner.query(`
            ALTER TABLE "conversation_participants" DROP CONSTRAINT "FK_18c4ba3b127461649e5f5039dbf"
        `);
        await queryRunner.query(`
            ALTER TABLE "conversation_participants" DROP CONSTRAINT "FK_4453e20858b14ab765a09ad728c"
        `);
        await queryRunner.query(`
            ALTER TABLE "member_blocks" DROP CONSTRAINT "FK_ac4f9c31f6a250493bb906b435a"
        `);
        await queryRunner.query(`
            ALTER TABLE "member_blocks" DROP CONSTRAINT "FK_4fa1cbfadd60bd493543e94093f"
        `);
        await queryRunner.query(`
            ALTER TABLE "expert_profiles" DROP CONSTRAINT "FK_2e39c68cf43a278e248519b4e34"
        `);
        await queryRunner.query(`
            ALTER TABLE "expert_profiles" DROP CONSTRAINT "FK_d3919b2c8325bbdbab2c2941913"
        `);
        await queryRunner.query(`
            ALTER TABLE "member_profiles" DROP CONSTRAINT "FK_75df452a05ee3697b2ec22bd8ab"
        `);
        await queryRunner.query(`
            ALTER TABLE "community_attachments" DROP CONSTRAINT "FK_a5cae5314babe0c1ee3952b7663"
        `);
        await queryRunner.query(`
            ALTER TABLE "community_follows" DROP CONSTRAINT "FK_c884040b07c627de53d2c9e94c0"
        `);
        await queryRunner.query(`
            ALTER TABLE "community_post_bookmarks" DROP CONSTRAINT "FK_0e59c43a22319e357ea86b3daaa"
        `);
        await queryRunner.query(`
            ALTER TABLE "community_post_bookmarks" DROP CONSTRAINT "FK_587a9116ebd58ef57283abf98b0"
        `);
        await queryRunner.query(`
            ALTER TABLE "community_reactions" DROP CONSTRAINT "FK_7d563b835f3908a701100f07e7f"
        `);
        await queryRunner.query(`
            ALTER TABLE "community_comments" DROP CONSTRAINT "FK_9ad7962abd429eb4ffc64b276b8"
        `);
        await queryRunner.query(`
            ALTER TABLE "community_comments" DROP CONSTRAINT "FK_1ec11e701aeddaa30a81c998f23"
        `);
        await queryRunner.query(`
            ALTER TABLE "community_comments" DROP CONSTRAINT "FK_8cd0b0aabf6e25d0d2f28af6ea4"
        `);
        await queryRunner.query(`
            ALTER TABLE "community_posts" DROP CONSTRAINT "FK_a6e715d3d5a0ccef260cd0e6097"
        `);
        await queryRunner.query(`
            ALTER TABLE "community_posts" DROP CONSTRAINT "FK_e6e5240467a0b1f3a3285eb3f5d"
        `);
        await queryRunner.query(`
            ALTER TABLE "community_posts" DROP CONSTRAINT "FK_7c9e434b072122306431dc28d9c"
        `);
        await queryRunner.query(`
            ALTER TABLE "community_memberships" DROP CONSTRAINT "FK_b473a456fef21ada0e60e517809"
        `);
        await queryRunner.query(`
            ALTER TABLE "community_memberships" DROP CONSTRAINT "FK_deca8716c1b87ef676762326a66"
        `);
        await queryRunner.query(`
            ALTER TABLE "community_memberships" DROP CONSTRAINT "FK_6ea82875cc58f4b1b14ebe49717"
        `);
        await queryRunner.query(`
            ALTER TABLE "community_memberships" DROP CONSTRAINT "FK_488d1ca96e355e11d83480a8f2c"
        `);
        await queryRunner.query(`
            ALTER TABLE "communities" DROP CONSTRAINT "FK_d035f75868bd42e56593ffa4aa7"
        `);
        await queryRunner.query(`
            ALTER TABLE "communities" DROP CONSTRAINT "FK_8c9599fdc7b6ebc8b8d3159d609"
        `);
        await queryRunner.query(`
            ALTER TABLE "company_contact_requests" DROP CONSTRAINT "FK_154170ee91f7a2f47899f266827"
        `);
        await queryRunner.query(`
            ALTER TABLE "company_contact_requests" DROP CONSTRAINT "FK_352d039cfd60f81a46e7b6f3b21"
        `);
        await queryRunner.query(`
            ALTER TABLE "contact_messages" DROP CONSTRAINT "FK_c4f2c2dac3ce280013b8d39dd48"
        `);
        await queryRunner.query(`
            ALTER TABLE "event_registrations" DROP CONSTRAINT "FK_7a072346484fe1d7ee0fb9dfaa8"
        `);
        await queryRunner.query(`
            ALTER TABLE "event_registrations" DROP CONSTRAINT "FK_e4e6dce237a527e4515f3d430f1"
        `);
        await queryRunner.query(`
            ALTER TABLE "resource_requests" DROP CONSTRAINT "FK_2f641bbddb484248a5a9d86cd88"
        `);
        await queryRunner.query(`
            ALTER TABLE "document_downloads" DROP CONSTRAINT "FK_dda4875e81a7b1fdf91f12fa347"
        `);
        await queryRunner.query(`
            ALTER TABLE "document_downloads" DROP CONSTRAINT "FK_6735cfddb4bfec306409c0efe2d"
        `);
        await queryRunner.query(`
            ALTER TABLE "notifications" DROP CONSTRAINT "FK_692a909ee0fa9383e7859f9b406"
        `);
        await queryRunner.query(`
            ALTER TABLE "opportunity_applications" DROP CONSTRAINT "FK_068fc90d41f3ffe8e5333135007"
        `);
        await queryRunner.query(`
            ALTER TABLE "opportunity_applications" DROP CONSTRAINT "FK_8016def1042e507215daff54fbe"
        `);
        await queryRunner.query(`
            ALTER TABLE "payout_accounts" DROP CONSTRAINT "FK_32c67382404b2953ec4f906db44"
        `);
        await queryRunner.query(`
            ALTER TABLE "service_transactions" DROP CONSTRAINT "FK_1988e07d18ebc77481f3f8c740a"
        `);
        await queryRunner.query(`
            ALTER TABLE "service_transactions" DROP CONSTRAINT "FK_ccd8ebe6bce78f8682480441758"
        `);
        await queryRunner.query(`
            ALTER TABLE "import_simulations" DROP CONSTRAINT "FK_1b0adc8625e4411bdc72df28223"
        `);
        await queryRunner.query(`
            ALTER TABLE "wechat_links" DROP CONSTRAINT "FK_d0867ff6767756877a482d8d65d"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_fb96279cd07e908e59f7fc0926"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_e8a66d6bb092ad6a68376776ca"
        `);
        await queryRunner.query(`
            DROP TABLE "academy_certificates"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_de33d443c8ae36800c37c58c92"
        `);
        await queryRunner.query(`
            DROP TABLE "enrollments"
        `);
        await queryRunner.query(`
            DROP TABLE "academy_settings"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_775c9f06fc27ae3ff8fb26f2c4"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_151b79a83ba240b0cb31b2302d"
        `);
        await queryRunner.query(`
            DROP TABLE "orders"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_84e765378a5f03ad9900df3a9b"
        `);
        await queryRunner.query(`
            DROP TABLE "cart_items"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_eab0a90106e3ee120a511cdb9d"
        `);
        await queryRunner.query(`
            DROP TABLE "course_favorites"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_08ea29c5aca5109ece6d1e29d9"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_eb4349e70765bb218bb4f833f6"
        `);
        await queryRunner.query(`
            DROP TABLE "lesson_progress"
        `);
        await queryRunner.query(`
            DROP TABLE "academy_files"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_a12a5536d02d2ed563c08a8915"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_b401460a5e33e637ede3543097"
        `);
        await queryRunner.query(`
            DROP TABLE "lesson_notes"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_a4dc7855b148a230609fbf3854"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_596ed2ecd8c2324c49a575ccef"
        `);
        await queryRunner.query(`
            DROP TABLE "course_lessons"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_0a332e19d988804687be4637bf"
        `);
        await queryRunner.query(`
            DROP TABLE "course_modules"
        `);
        await queryRunner.query(`
            DROP TABLE "learning_paths"
        `);
        await queryRunner.query(`
            DROP TABLE "courses"
        `);
        await queryRunner.query(`
            DROP TABLE "training_domains"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_0554c12733d3be64c2e7eaaa5e"
        `);
        await queryRunner.query(`
            DROP TABLE "appointments"
        `);
        await queryRunner.query(`
            DROP TABLE "articles"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_4c63ce519cdb503dcc778ae065"
        `);
        await queryRunner.query(`
            DROP TABLE "auth_tickets"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_55fa4db8406ed66bc704432842"
        `);
        await queryRunner.query(`
            DROP TABLE "user_sessions"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_6ed26ac7e2276ae145ca68c23a"
        `);
        await queryRunner.query(`
            DROP TABLE "auth_identities"
        `);
        await queryRunner.query(`
            DROP TABLE "services"
        `);
        await queryRunner.query(`
            DROP TABLE "match_requests"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_5bb9a5acc4357c538c3f0fe2a7"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_6beeb86d529a595d73fdc34b80"
        `);
        await queryRunner.query(`
            DROP TABLE "moderation_reports"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_751332fc6cc6fc576c6975cd07"
        `);
        await queryRunner.query(`
            DROP TABLE "messages"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_18c4ba3b127461649e5f5039db"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_4453e20858b14ab765a09ad728"
        `);
        await queryRunner.query(`
            DROP TABLE "conversation_participants"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_c2e9a7b1452f56f8ff45b5a21c"
        `);
        await queryRunner.query(`
            DROP TABLE "conversations"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_ac4f9c31f6a250493bb906b435"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_4fa1cbfadd60bd493543e94093"
        `);
        await queryRunner.query(`
            DROP TABLE "member_blocks"
        `);
        await queryRunner.query(`
            DROP TABLE "expert_profiles"
        `);
        await queryRunner.query(`
            DROP TABLE "member_profiles"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_c46f83a00342d3b5716ef8e5c6"
        `);
        await queryRunner.query(`
            DROP TABLE "community_attachments"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_083ee8f4eb2b58834b21cf1f0e"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_c884040b07c627de53d2c9e94c"
        `);
        await queryRunner.query(`
            DROP TABLE "community_follows"
        `);
        await queryRunner.query(`
            DROP TABLE "community_post_bookmarks"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_70e0dd701ced1d31294229fb9a"
        `);
        await queryRunner.query(`
            DROP TABLE "community_reactions"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_ef3905ef22f1379a174d22c57f"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_9ad7962abd429eb4ffc64b276b"
        `);
        await queryRunner.query(`
            DROP TABLE "community_comments"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_00ea3cceee0698cca59c82942b"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_e6e5240467a0b1f3a3285eb3f5"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_7c9e434b072122306431dc28d9"
        `);
        await queryRunner.query(`
            DROP TABLE "community_posts"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_2e18334827babeb19cd64ab532"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_488d1ca96e355e11d83480a8f2"
        `);
        await queryRunner.query(`
            DROP TABLE "community_memberships"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_42d5225a80ac87aa1254dfe282"
        `);
        await queryRunner.query(`
            DROP TABLE "communities"
        `);
        await queryRunner.query(`
            DROP TABLE "professional_categories"
        `);
        await queryRunner.query(`
            DROP TABLE "community_categories"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_352d039cfd60f81a46e7b6f3b2"
        `);
        await queryRunner.query(`
            DROP TABLE "company_contact_requests"
        `);
        await queryRunner.query(`
            DROP TABLE "companies"
        `);
        await queryRunner.query(`
            DROP TABLE "contact_messages"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_e4e6dce237a527e4515f3d430f"
        `);
        await queryRunner.query(`
            DROP TABLE "event_registrations"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_03dcebc1ab44daa177ae9479c4"
        `);
        await queryRunner.query(`
            DROP TABLE "events"
        `);
        await queryRunner.query(`
            DROP TABLE "resource_requests"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_6735cfddb4bfec306409c0efe2"
        `);
        await queryRunner.query(`
            DROP TABLE "document_downloads"
        `);
        await queryRunner.query(`
            DROP TABLE "documents"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_692a909ee0fa9383e7859f9b40"
        `);
        await queryRunner.query(`
            DROP TABLE "notifications"
        `);
        await queryRunner.query(`
            DROP TABLE "newsletter_subscriptions"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_8016def1042e507215daff54fb"
        `);
        await queryRunner.query(`
            DROP TABLE "opportunity_applications"
        `);
        await queryRunner.query(`
            DROP TABLE "opportunities"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_7339f45d23a9527fe72bfed58c"
        `);
        await queryRunner.query(`
            DROP TABLE "payment_sandbox_records"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_be51bcc7487a26d08904f78eee"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_0c402fdeb9b739833a5c23a839"
        `);
        await queryRunner.query(`
            DROP TABLE "service_attachments"
        `);
        await queryRunner.query(`
            DROP TABLE "payout_accounts"
        `);
        await queryRunner.query(`
            DROP TABLE "payment_webhook_events"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_a46a0a970fa1e2ae897725a4b8"
        `);
        await queryRunner.query(`
            DROP TABLE "service_ledger_entries"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_b0653c6a37d61ed4cffdfa5559"
        `);
        await queryRunner.query(`
            DROP TABLE "service_payouts"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_d7c836aa584b57456318cb780b"
        `);
        await queryRunner.query(`
            DROP TABLE "service_refunds"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_9ba91e2ab37ebfab7b2a1408f2"
        `);
        await queryRunner.query(`
            DROP TABLE "service_dispute_entries"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_efabb2828fe2e36e6bf53718d2"
        `);
        await queryRunner.query(`
            DROP TABLE "service_disputes"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_ae4ae5fb53ce79095a04f2be77"
        `);
        await queryRunner.query(`
            DROP TABLE "service_completion_declarations"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_7396cd0e395b0d23ed50d6b1b1"
        `);
        await queryRunner.query(`
            DROP TABLE "service_transaction_events"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_db5e6b21bca6c9f5cf63a73e89"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_078285cfa2c1a58d9c390120c1"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_cf4fb7d4e2286fdc46ad95bb59"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_1988e07d18ebc77481f3f8c740"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_ccd8ebe6bce78f868248044175"
        `);
        await queryRunner.query(`
            DROP TABLE "service_transactions"
        `);
        await queryRunner.query(`
            DROP TABLE "regulation_profiles"
        `);
        await queryRunner.query(`
            DROP TABLE "hs_codes"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_c69efb19bf127c97e6740ad530"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_2dc33f7f3c22e2e7badafca1d1"
        `);
        await queryRunner.query(`
            DROP TABLE "audit_logs"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_eff48556970ed4f67961f2d0e1"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_cdb481c718e32caea0c6f5c36b"
        `);
        await queryRunner.query(`
            DROP TABLE "activity_events"
        `);
        await queryRunner.query(`
            DROP TABLE "import_simulations"
        `);
        await queryRunner.query(`
            DROP TABLE "freight_rates"
        `);
        await queryRunner.query(`
            DROP TABLE "customs_tariffs"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_0e4e65fd790836e9dff4acacaa"
        `);
        await queryRunner.query(`
            DROP TABLE "wechat_sim_messages"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_302af4b4efa892790eb48e9042"
        `);
        await queryRunner.query(`
            DROP TABLE "wechat_outbox"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_120e88942083ab8ceb9ac95a63"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_3081fd2704daaceaffa7120645"
        `);
        await queryRunner.query(`
            DROP TABLE "wechat_inbound"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_655fb9229eb368209f7c52d77f"
        `);
        await queryRunner.query(`
            DROP TABLE "wechat_bind_codes"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_27ed86320b8685cf70502f331e"
        `);
        await queryRunner.query(`
            DROP TABLE "wechat_links"
        `);
        await queryRunner.query(`
            DROP TABLE "users"
        `);
    }

}
