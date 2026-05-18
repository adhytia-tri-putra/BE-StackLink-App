-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "bg_color" TEXT NOT NULL DEFAULT '#ffffff',
ADD COLUMN     "bg_gradient_end" TEXT NOT NULL DEFAULT '#6366f1',
ADD COLUMN     "bg_gradient_start" TEXT NOT NULL DEFAULT '#ffffff',
ADD COLUMN     "bg_type" TEXT NOT NULL DEFAULT 'solid',
ADD COLUMN     "button_color" TEXT NOT NULL DEFAULT '#6366f1',
ADD COLUMN     "text_color" TEXT NOT NULL DEFAULT '#000000';
