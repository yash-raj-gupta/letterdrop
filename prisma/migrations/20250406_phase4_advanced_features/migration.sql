-- CreateEnum
CREATE TYPE "CustomFieldType" AS ENUM ('TEXT', 'NUMBER', 'DATE', 'SELECT', 'MULTISELECT', 'BOOLEAN');

-- CreateEnum
CREATE TYPE "AutomationTrigger" AS ENUM ('SUBSCRIBE', 'UNSUBSCRIBE', 'TAG_ADDED', 'TAG_REMOVED', 'EMAIL_OPENED', 'LINK_CLICKED', 'DATE_REACHED');

-- CreateEnum
CREATE TYPE "AutomationActionType" AS ENUM ('SEND_EMAIL', 'ADD_TAG', 'REMOVE_TAG', 'WAIT', 'WEBHOOK');

-- CreateTable
CREATE TABLE "custom_fields" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "type" "CustomFieldType" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "options" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "custom_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_field_values" (
    "id" TEXT NOT NULL,
    "customFieldId" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "custom_field_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trigger" "AutomationTrigger" NOT NULL,
    "triggerData" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "automations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_actions" (
    "id" TEXT NOT NULL,
    "automationId" TEXT NOT NULL,
    "type" "AutomationActionType" NOT NULL,
    "order" INTEGER NOT NULL,
    "delayHours" INTEGER NOT NULL DEFAULT 0,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "automation_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhooks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "events" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSentAt" TIMESTAMP(3),
    "failCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhooks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "custom_fields_userId_key_key" ON "custom_fields"("userId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "custom_field_values_customFieldId_subscriberId_key" ON "custom_field_values"("customFieldId", "subscriberId");

-- CreateIndex
CREATE INDEX "automations_userId_isActive_idx" ON "automations"("userId", "isActive");

-- CreateIndex
CREATE INDEX "automation_actions_automationId_order_idx" ON "automation_actions"("automationId", "order");

-- CreateIndex
CREATE INDEX "webhooks_userId_isActive_idx" ON "webhooks"("userId", "isActive");

-- AddForeignKey
ALTER TABLE "custom_fields" ADD CONSTRAINT "custom_fields_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_field_values" ADD CONSTRAINT "custom_field_values_customFieldId_fkey" FOREIGN KEY ("customFieldId") REFERENCES "custom_fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_field_values" ADD CONSTRAINT "custom_field_values_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "subscribers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automations" ADD CONSTRAINT "automations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_actions" ADD CONSTRAINT "automation_actions_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "automations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
