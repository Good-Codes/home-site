-- Customer profile fields on User (nullable; existing rows stay valid).

CREATE TYPE "PreferredContact" AS ENUM ('email', 'call', 'whatsapp');
CREATE TYPE "SaProvince" AS ENUM ('EC', 'FS', 'GP', 'KZN', 'LP', 'MP', 'NC', 'NW', 'WC');
CREATE TYPE "OrganisationType" AS ENUM ('startup', 'small_business', 'established', 'agency', 'npo', 'other');
CREATE TYPE "Industry" AS ENUM ('retail', 'healthcare', 'finance', 'logistics', 'education', 'manufacturing', 'professional_services', 'government', 'other');
CREATE TYPE "TeamSize" AS ENUM ('just_me', 'two_to_ten', 'eleven_to_fifty', 'fifty_one_plus');
CREATE TYPE "ReferralSource" AS ENUM ('referral', 'google', 'linkedin', 'existing_client', 'other');

ALTER TABLE "User"
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "preferredContact" "PreferredContact",
  ADD COLUMN "organisation" TEXT,
  ADD COLUMN "jobTitle" TEXT,
  ADD COLUMN "city" TEXT,
  ADD COLUMN "province" "SaProvince",
  ADD COLUMN "organisationType" "OrganisationType",
  ADD COLUMN "industry" "Industry",
  ADD COLUMN "teamSize" "TeamSize",
  ADD COLUMN "referralSource" "ReferralSource";
