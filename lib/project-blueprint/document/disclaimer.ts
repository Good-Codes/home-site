import {
  ESTIMATE_INFO_RETENTION_DISCLOSURE,
  ESTIMATE_ROUGH_DISCLOSURE,
} from "../disclosures";

export const ESTIMATE_PDF_DISCLAIMER = ESTIMATE_ROUGH_DISCLOSURE;

export const ESTIMATE_PDF_RETENTION = ESTIMATE_INFO_RETENTION_DISCLOSURE;

export const ESTIMATE_PDF_TAGLINE = "Built by people. Powered by good code.";

export const ESTIMATE_PDF_CONTACT_EMAIL = "admin@goodcode.co.za";
export const ESTIMATE_PDF_CONTACT_PHONE = "+27 83 560 3912";
export const ESTIMATE_PDF_CONTACT_URL = "https://www.goodcode.co.za";
export const ESTIMATE_PDF_CONTACT_URL_LABEL = "goodcode.co.za";

export const ESTIMATE_PDF_CONTACT = [
  "Good Code",
  ESTIMATE_PDF_CONTACT_EMAIL,
  ESTIMATE_PDF_CONTACT_PHONE,
  ESTIMATE_PDF_CONTACT_URL,
].join(" · ");
