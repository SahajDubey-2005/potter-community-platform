import React, { useEffect, useState, useRef } from "react";
import { firebaseAuth } from "./firebase";
import { createUserWithEmailAndPassword, sendEmailVerification, reload, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { QRCodeSVG } from "qrcode.react";
import ProfessionalNetworkPage from "./components/ProfessionalNetworkPage";
import CommunityAssistant from "./components/CommunityAssistant";
import {
  Home,
  Users,
  Mail,
  Bell,
  CalendarDays,
  FileText,
  ShoppingBag,
  HeartPulse,
  User,
  Settings,
  LogOut,
  Search,
  Menu,
  MoreHorizontal,
  X,
  ChevronRight,
  ChevronDown,
  Check,
  Lock,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Clock,
  Bookmark,
  ShoppingCart,
  Plus,
  Eye,
  EyeOff,
  GraduationCap,
  Landmark,
  Megaphone,
  AlertTriangle,
  UserCheck,
  Sparkles,
  Heart,
  SlidersHorizontal,
  Briefcase,
  IndianRupee,
  CreditCard,
  QrCode,
  Smartphone,
  Receipt,
  RotateCcw,
  ClipboardCheck,
  FileCheck,
  Phone,
  TrendingUp,
  ImagePlus,
  Trash2,
  UserRound,
  Languages,
} from "lucide-react";

// Authentication endpoints must be implemented by your secure backend.
const AUTH_API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");

async function authApi(path, options = {}) {
  const token =
    sessionStorage.getItem("potterCommunityAccessToken") ||
    localStorage.getItem("token");

  const headers = {
    ...(options.body instanceof FormData
      ? {}
      : { "Content-Type": "application/json" }),
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${AUTH_API_BASE}${path}`, {
    ...options,
    headers,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detail = payload.detail;

    let errorMessage = "Request failed. Please try again.";

    if (typeof detail === "string") {
      errorMessage = detail;
    } else if (Array.isArray(detail)) {
      errorMessage = detail
        .map((item) => item?.msg || JSON.stringify(item))
        .join(", ");
    } else if (detail && typeof detail === "object") {
      errorMessage = detail.message || JSON.stringify(detail);
    } else if (typeof payload.message === "string") {
      errorMessage = payload.message;
    } else if (typeof payload.error === "string") {
      errorMessage = payload.error;
    }

    throw new Error(errorMessage);
  }

  return payload;
}

/* =========================================================
   PUBLIC FEATURES
========================================================= */

const publicFeatures = [
  {
    title: "Announcements",
    description: "Stay updated with important community announcements.",
    icon: Megaphone,
    page: "announcements",
  },
  {
    title: "Events",
    description: "Explore upcoming Potter Community events.",
    icon: CalendarDays,
    page: "events",
  },
  {
    title: "Marketplace",
    description: "Discover products created by Potter Community artisans.",
    icon: ShoppingBag,
    page: "marketplace",
  },
  {
    title: "Government Schemes",
    description: "Explore useful government schemes and benefits.",
    icon: Landmark,
    page: "schemes",
  },
  {
    title: "Scholarships",
    description: "Find scholarships and educational opportunities.",
    icon: GraduationCap,
    page: "scholarships",
  },
  {
    title: "Matrimonial",
    description: "Find suitable matches within the community.",
    icon: Heart,
    page: "matrimonial",
  },
];

/* =========================================================
   MEMBER FEATURES
========================================================= */

const memberFeatures = [
  {
    title: "Member Directory",
    description: "Connect with verified Potter Community members.",
    icon: Users,
    page: "members",
  },
  {
    title: "Private Documents",
    description: "Access documents available to verified members.",
    icon: FileText,
    page: "documents",
  },
  {
    title: "Emergency Support",
    description: "Request location-based emergency assistance.",
    icon: HeartPulse,
    page: "emergency",
  },
  {
    title: "Personalized Notifications",
    description: "Receive updates relevant to your membership.",
    icon: Bell,
    page: "notifications",
  },
  {
    title: "My Profile",
    description: "Manage your verified community profile.",
    icon: User,
    page: "profile",
  },
];

/* =========================================================
   ANNOUNCEMENTS - 7
========================================================= */


/* =========================================================
   REAL-WORLD / VERIFIED DATA
   Community-specific content is intentionally empty until
   the Potter Community admin publishes verified records.
========================================================= */

const announcements = [];
const events = [];

/* =========================================================
   GOVERNMENT SCHEMES - REAL
   Sources: Government of India / official scheme portals.
========================================================= */

const schemes = [
  {
    id: "kumhar-sashaktikaran",
    scope: "National",
    state: "All India",
    title: "Kumhar Sashaktikaran Programme (KSP)",
    category: "Potter-Specific Artisan Support",
    ministry: "Khadi and Village Industries Commission (KVIC), Ministry of MSME",
    description:
      "A pottery-focused initiative intended to strengthen traditional potters by improving their tools, skills, productivity and livelihood opportunities.",
    benefit:
      "Depending on current local implementation and availability: pottery-wheel/equipment assistance and skill support. This is not an unconditional cash grant; the exact assistance depends on the approved programme and selection.",
    eligibility:
      "Traditional potters and eligible pottery artisans, subject to current KVIC programme criteria and availability in the applicant's area.",
    documents:
      "Identity and address proof, bank details, evidence of pottery work if requested, and any documents specified by the local KVIC office.",
    applicationUrl: "https://www.kviconline.gov.in/",
    sourceLabel: "KVIC official website",
    applicationNote:
      "Contact the district KVIC office or state Khadi and Village Industries Board to confirm current local availability, eligibility and application dates. Benefits are not guaranteed."
  },
  {
    id: "gramodyog-vikas-pottery",
    scope: "National",
    state: "All India",
    title: "Gramodyog Vikas Yojana — Pottery Activity",
    category: "Pottery Training & Equipment",
    ministry: "Khadi and Village Industries Commission (KVIC), Ministry of MSME",
    description:
      "The pottery-related component of Gramodyog Vikas Yojana supports pottery artisans through skill development, improved production methods and equipment assistance.",
    benefit:
      "Depending on the approved activity: wheel-pottery, press-pottery or jigger-jolly training, and possible equipment such as pottery wheels, clay blungers or granulators. Support depends on the current programme and local implementation.",
    eligibility:
      "Eligible pottery artisans, trainees or pottery groups selected under the applicable KVIC activity. Current age and selection conditions must be confirmed with the implementing office.",
    documents:
      "Identity and address proof, bank details, evidence of pottery activity if requested, and application/training documents specified by KVIC.",
    applicationUrl: "https://champions.gov.in/Ministry-of-MSME_Portal/youth_Entrepreneurs-rural_urban_self_employment/New_Schemes.htm",
    sourceLabel: "Ministry of MSME — GVY Pottery Activity",
    applicationNote:
      "Contact KVIC or your state Khadi and Village Industries Board to check current pottery training/equipment batches and application dates. Assistance is subject to approval and availability."
  },
  {
    id: "pm-vishwakarma-potter",
    scope: "National",
    state: "All India",
    title: "PM Vishwakarma — Potter (Kumhaar) Trade",
    category: "Traditional Artisan Support",
    ministry: "Ministry of Micro, Small and Medium Enterprises",
    description:
      "The national PM Vishwakarma scheme explicitly lists Potter (Kumhaar) among its 18 eligible traditional trades. It is relevant to eligible potters, although it is not exclusive to pottery alone.",
    benefit:
      "Eligible beneficiaries may receive recognition through a certificate and ID card, skill training, toolkit incentive up to ₹15,000, concessional collateral-free credit in tranches up to ₹3 lakh, and marketing/digital transaction support, subject to scheme rules.",
    eligibility:
      "Generally for Indian citizens aged 18 or older who are self-employed and actively practising the notified Potter (Kumhaar) trade, subject to household, prior-loan and other scheme restrictions.",
    documents:
      "Aadhaar-based identity verification and the documents requested through the official registration process.",
    applicationUrl: "https://pmvishwakarma.gov.in/",
    sourceLabel: "PM Vishwakarma official portal",
    applicationNote:
      "Registration is processed through the official portal/participating Common Service Centre (CSC). Confirm the current eligibility rules before applying; approval is not guaranteed."
  },
  {
    id: "gujarat-potter-toolkit",
    scope: "State",
    state: "Gujarat",
    title: "Toolkit Assistance Scheme for Potters",
    category: "Gujarat — Pottery Equipment",
    ministry: "Gujarat Matikam Kalakari & Rural Technology Institute (GMKRTI)",
    description:
      "A Gujarat state programme to improve pottery productivity by helping eligible working potters obtain foot-operated or electric pottery wheels and electric pug mills.",
    benefit:
      "The official scheme page describes 75% government assistance for eligible equipment, with a 25% beneficiary contribution. Confirm current rates, equipment availability and application status before applying.",
    eligibility:
      "Potters aged 18–50 who are engaged in pottery work. The official page states there is no income limit; final eligibility is determined by GMKRTI.",
    documents:
      "Identity, age, residence and pottery-work proof, plus any documents required in the official application.",
    applicationUrl: "https://gmkrti.gujarat.gov.in/schemes/toolkit_assistance_scheme_for_potters",
    sourceLabel: "GMKRTI Gujarat official scheme page",
    applicationNote:
      "This programme is for eligible applicants in Gujarat. Use the official scheme page to check the live application process, required documents and current availability."
  },
  {
    id: "up-matikala-rojgar",
    scope: "State",
    state: "Uttar Pradesh",
    title: "Mukhyamantri Matikala Rojgar Yojana",
    category: "Uttar Pradesh — Pottery Enterprise",
    ministry: "Uttar Pradesh Matikala Board",
    description:
      "A state programme supporting eligible pottery artisans who want to establish a pottery-related unit producing items such as kulhads, household clay products, toys, decorative items and garden pots.",
    benefit:
      "The official scheme page describes bank-financed projects up to ₹10 lakh, with a 5% entrepreneur contribution and 25% of the capital loan amount provided as margin money under the scheme rules. Confirm the current guidelines before relying on these figures.",
    eligibility:
      "Eligible applicants establishing an individual pottery-related enterprise in Uttar Pradesh, selected through the Board's prescribed process and subject to current criteria.",
    documents:
      "Residence and identity proof, project details, bank-required documents and other documents requested by the Uttar Pradesh Matikala Board.",
    applicationUrl: "https://upmatikalaboard.in/Home/MatikalaRojgaar",
    sourceLabel: "Uttar Pradesh Matikala Board",
    applicationNote:
      "For current eligibility and applications, use the official Uttar Pradesh Matikala Board portal or contact the district Gramodyog office. Loan sanction and margin-money release are subject to the scheme process."
  },
  {
    id: "up-matikala-toolkit",
    scope: "State",
    state: "Uttar Pradesh",
    title: "Matikala Tool-Kit Distribution Scheme",
    category: "Uttar Pradesh — Artisan Tools",
    ministry: "Uttar Pradesh Matikala Board",
    description:
      "A state programme listed by the Uttar Pradesh Matikala Board to provide modern tools to economically weaker pottery artisans.",
    benefit:
      "Tool-kit assistance for eligible pottery artisans, according to the current scheme guidelines and availability. The official listing does not establish a universal cash amount.",
    eligibility:
      "Eligible pottery artisans in Uttar Pradesh selected under the Board's current rules.",
    documents:
      "Identity and residence proof, evidence of pottery work and any documents listed in the current application instructions.",
    applicationUrl: "https://upmatikalaboard.in/Home/Index",
    sourceLabel: "Uttar Pradesh Matikala Board",
    applicationNote:
      "Check the Board's official portal or district Gramodyog office for the current application window, selection rules and tool-kit availability."
  },
  {
    id: "up-matikala-skill",
    scope: "State",
    state: "Uttar Pradesh",
    title: "Matikala Skill Development Scheme",
    category: "Uttar Pradesh — Pottery Training",
    ministry: "Uttar Pradesh Matikala Board",
    description:
      "Practical pottery and craft training for eligible artisans, including everyday clay products, decorative products, toys, idols and surface-decoration techniques.",
    benefit:
      "The Board describes a 15-day pottery craft training programme. Training access and any associated support depend on selection and current programme availability.",
    eligibility:
      "Candidates selected under the Uttar Pradesh Matikala Board's current criteria; the published description links practical training to beneficiaries selected for the Mukhyamantri Matikala Rojgar Yojana.",
    documents:
      "Identity and residence proof, pottery/business application details and any documents requested by the district Gramodyog office.",
    applicationUrl: "https://upmatikalaboard.in/Home/MatikalaKaushal",
    sourceLabel: "Uttar Pradesh Matikala Board",
    applicationNote:
      "Use the official Board page or contact the district Gramodyog office to verify current batches, selection requirements and application dates."
  },
  {
    id: "chhattisgarh-matikala-registration",
    scope: "State",
    state: "Chhattisgarh",
    title: "Chhattisgarh Matikala Board — Potter/Clay Artisan Registration",
    category: "Chhattisgarh — Artisan Registration",
    ministry: "Chhattisgarh Matikala Board / Rural Industries Department",
    description:
      "An official registration service for residents engaged in pottery (Kumhari) and clay work. Registration identifies artisans for possible inclusion in Board welfare and support programmes.",
    benefit:
      "Registration may enable eligible artisans to access pottery-related schemes, training, exhibitions, marketing support and electric-wheel assistance when such support is available. Registration itself is not a guaranteed grant.",
    eligibility:
      "Applicants engaged in pottery or clay work, native residents of Chhattisgarh, and at least 18 years old under the published service conditions.",
    documents:
      "Identity and residence proof, age proof and evidence of pottery/clay work, as required by the official registration service.",
    applicationUrl: "https://uat-ed.cgstate.gov.in/instractionPageNew.do?lang=en&serviceId=211",
    sourceLabel: "Chhattisgarh government Sewa Setu service",
    applicationNote:
      "This is a state registration service, not a guaranteed cash benefit. Check the live Chhattisgarh government service portal for current availability and linked schemes."
  }
];

/* =========================================================
   POTTERY-RELEVANT SCHOLARSHIPS
   This national Ministry of Culture scholarship explicitly
   includes Pottery & Ceramics under Visual Arts. It is not
   exclusive to potters; eligibility is based on artistic
   proficiency and advanced training requirements.
   No verified state scholarship specifically for potters
   or their family members was identified in this update.
========================================================= */
const scholarships = [
  {
    id: "young-artistes-pottery-ceramics",
    scope: "National",
    state: "All India",
    title: "Scholarships to Young Artistes in Different Cultural Fields",
    category: "All India — Pottery & Ceramics / Visual Arts",
    ministry: "Ministry of Culture, Government of India",
    amount: "₹5,000 per month for 2 years",
    description:
      "A national scholarship supporting young artists pursuing advanced training in eligible cultural fields. The official scheme explicitly lists Pottery & Ceramics under Visual Arts, making it relevant to eligible pottery artists.",
    eligibility:
      "Indian nationals aged 18–25 as specified in the current scheme guidelines, with demonstrated proficiency in the chosen art. The scheme is for advanced training, not beginners, and requires evidence of at least five years of training with a Guru or institute. Selection is merit-based and subject to the current official guidelines.",
    deadline:
      "Application dates vary by batch. Check the official Ministry of Culture advertisement page for the current batch and deadline.",
    documents:
      "Application form, proof of age and education, photograph, and supporting evidence of artistic proficiency and the required training history. Follow the current official guidelines for the exact document list.",
    applicationUrl:
      "https://culture.gov.in/award-scholarships-young-artists-different-cultural-fields",
    sourceLabel: "Ministry of Culture, Government of India",
    applicationNote:
      "This scholarship includes Pottery & Ceramics but is not exclusively for potters. Check the latest batch advertisement and eligibility conditions before applying."
  }
];

/* =========================================================
   COMMUNITY-SPECIFIC DATA
   No fictional people, products, events or matrimonial
   profiles are presented as real.
========================================================= */

const members = [];
const matrimonialProfiles = [];

// Clearly labelled fictional records with AI-generated sample portraits, used only to preview the matrimonial UI.
// These are not real people or verified members. Real approved profiles from the API always take priority.
const DEMO_MATRIMONIAL_PROFILES = [
  {
    id: "demo-matrimonial-01", photoData: "data:image/jpeg;base64,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", name: "Aarav Kumar", age: 27,
    gender: "Male", education: "B.Tech", occupation: "Pottery business owner",
    location: "Patna, Bihar", maritalStatus: "Never married",
    description: "Enjoys traditional pottery, travelling and helping grow the family craft business.",
    interests: "Pottery · Travel · Reading", status: "DEMO", verified: false,
  },
  {
    id: "demo-matrimonial-02", photoData: "data:image/jpeg;base64,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", name: "Meera Kumari", age: 25,
    gender: "Female", education: "M.Com", occupation: "Accounts executive",
    location: "Jaipur, Rajasthan", maritalStatus: "Never married",
    description: "Interested in art, cultural activities and supporting local artisans.",
    interests: "Art · Music · Cooking", status: "DEMO", verified: false,
  },
  {
    id: "demo-matrimonial-03", photoData: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBAUEBAYFBQUGBgYHCQ4JCQgICRINDQoOFRIWFhUSFBQXGiEcFxgfGRQUHScdHyIjJSUlFhwpLCgkKyEkJST/2wBDAQYGBgkICREJCREkGBQYJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCT/wAARCAEYAPADASIAAhEBAxEB/8QAHAAAAgMAAwEAAAAAAAAAAAAABQYDBAcAAggB/8QARBAAAgEDAwIEAwQJAQUHBQAAAQIDAAQRBRIhBjETQVFhByJxFDKBoRUjQlKRscHR8GIkMzRy4RYlNUNUZIIXRJKi8f/EABsBAAIDAQEBAAAAAAAAAAAAAAMEAQIFAAYH/8QALhEAAgIBBAEEAQMDBQEAAAAAAQIAAxEEEiExQQUTIlFhFDJxocHRBiNCgbHh/9oADAMBAAIRAxEAPwAxo9yIYDg4NS31488ZAJNAoXkgOD2zRa3KMu4nNYNqgNmH3Yitq2lS3EwYDv3qXT+mGk7jNNaWiTHJAxRiwsUUAbRQjqzjAnKNxiVJ0wUXt+VVodDkjkwy+daW9ihHIFUZrGNcnAoS6ts4M4Jgxds9DDMDt5po062+zAA18tYlQj0q40kYHBpXVszcQjKBClpOgZQSKOW1wDgZpBurzwSGVyCKt2HUXADt81X0dnt8GBYxv1KRXjKjzpL1az8SU4q3rHWWm6RaLPfz+GrtsQBSzMfPAHp5nyoN1B1bo2lWYdrsSXMoDp4eGCoedx/DtTj6e3UsPbH/AH4lcjEGXOm/OOKt6fZYOBSBq/XraTKJY9Xka3nyV8UAsVPfj3/CiujfFCPUmRYrRYiQBv2kqfcClvUPQ9RYmKmGZypzNEjhymB3HcVRvrWMIzthFAySTgAe5oTe6m+m2sM9/PHdwXbMm63YgcYI3E/cP171JrTG6hgSGSO4iZg7lzuK9tpZPNecnvildN/pi6psmwGEZCRKUsMd4M2k0VwNwX9WwbGfpQW/UKrI6kd8MP60QvuorixUST2ytDEc+PCcgDOMgjsM1XvdVtWkG6MSrMM/McAc91Pqa0R6ZZnrGJTZFtY2e4QEcHt71pHTFqojUAckUmJpwuLsSWKvLEB281+o9qeencx4VgVYYyD5UC9SnBlkHMZza5g/CgN5pQmmJK5pkEuI/LtVOQKGzQBbt6liuZTstHCgHFfNQ04iJsL5Ubs2Qoc44qG/ddpqp1BHM7bMyvjJDcFSDioSWcc0c1y3RnLD60HVQRitOly4Bgdsl0+MmUYowyMsZqvo9tuk7Uelsx4R4p1sgQy9RU8ZkuTR+xuhtTmg13CEuWGK7wzGIqfQ1nW07+Z2ziU9YgNsxIHnVO3vXGAeBRDqa4RWcEilwXiqpORimHUkyjdx20+dCoyRRWG+jTjcKzi11xl4B4q+NVkYZzS36Y5l68x8m1VAn3hQ6fVk82pKu9bkiXknFDJdekkbvVk0nOZDNhpoS6wi/tCusurgjhqQYdTcnJY1bivmk+UMAccZOM0wdMJffGK61PecA1VTWo4ruCzjWW5vZziOCFdzH3PoKraLp1zr13NZ2bRi7SB5kjlbZv244ye3fvUMUNx0sNYF6YbTVSMRDxAzxlxh1EnYZXHymmdP6cH5bqBczp1X17a2921laPE89spj8crjg/eA/eGR580oXOr20CNdJLA8s0eHhuFyitnhgR/KlbWWaG+dLmAyP+ydhBI+o4P1qOz16307cfB8aQD5Nq8J69+Sa1gMfFeBKjA5MLWmpaTIzjUIo/EJ/wCJgfeyn3RvL2qbUoB9lH2KYK0CkpNb/KJoye+PUHuKUdV1CPVbn7UxG/GC4HJ+vrX3TdZaL5NzLsYEAnIweD+FXUAcGVLE8xk6c681XQ7vwJpDOp+9FN86Sr+NaP091TptwTNb3raUpdWjt2AkQknlFz5eoPIB9qxi/RZASCBj50P7vqK+2eq+LG8LHbIvzDPn70N0ELXaRwZvGq3VlqLzpasbcsflQbWQntypPGee1L+oaLNGxiikhvDgKphkwqcdtvmfxrL9O6ta3At7keJAxwu45KHzUn2/lRqw6lks7sGOTCd1XdkMvp9RQ+oXcGmgtcHT200reQSSIypK0LZzuyCrEdyvH8ae9P8AEsI/GuNqW7Yw7kAA+2ayo6tpV/Ck7EwSkjLxpkE+rDz+vei0/VF1LfxXOoXX2mJgApYghceg7AUlfpVuOc4lSpB4mvahdRWMUXjXEKGQZT58g/iOKE3eqBTjNUIdd0HV9DEN4yxMGDRqrbQxHmB5j1oPp19aTlLV5yrlm8LI+Vl8hu9azrfTdo3LCAxnh1zwiATwamutVjePO+qA0zIDYqhqdrLBESue1ZtdCs3ME2cypquohieaGQXIPnQW/vpBMVbPerFhKXxW5TQFE4GPnTyhzmmC4KrER7UC6aG2PJ9KYPsxnHNMOBiSv3E+/IN01U5mwOK0fTek4biTfJGGz6ijL9DWLqP9nT+FBWhjzJ90Tz/1ffEyMB60rtfOVxzTH1bb4lcnuDSwISTwKYVQRBN3LthIWYUyQR70BoHpln2pgQGIdqBaOeIerqDtVtyy4FAxEVbtTRc4deaHvZgnIrkOO4CwcwYARUOratFplvG7YE7AgBmwpx+0fQDzoqLX5xntWbdYiW86inV/HeCIiJEX7zY7n6ZpmsbjKrxHvS+pbKLRM2kVv+kJvmN8jNumTndG4PY+48qF3PUMt7LPcXBMhuGJk3cgt50nMy2bKIFdFHcE8/X61X/SJjJwxaNjhvr5H2NaIIUYlOTDUt3BHIrQSSojHaU3ZQ/T0NDdSdHYhl3kdiOGx/WqUsrkM8UnynuQOG+o9feoTc/aAElOHHY124SMGRSxRyxB1JEmcB14J9j71ThnkhkMb88/KfX1FWHJt3Yl1ZW7j196ryDxvmHzD1FDYywEvvfl4AB95Tkf5/nehz3TJMki5wp/iD/n5V38GU+R+bv9a7x6fNKdpQn8O1ULy4UyKWTLucHJAY+5H/SpUvGMO0k/qzuH0qzLodyNoCMSB3x5VVksJYY2BU896puBltrCG9D6hW0udssrJCy7gSCce2POj8+uQkePBkxEYcMeT/q2jtis5KSB1YnYq8bj5UUsLweE6BTx9zNQy+RLI/gzZekJdPKu02okTSxbBK8YK8/s+3sRRO20uJ7r9HmWN1kJZfs82HJHYhT3P51mPSd7G2oRhZorcqdyKDuCj0we/wBK1BbLT9QjRofCaRgTvjOFZh5Ad1b0IqGU7czsjMd+hdRuZL240HUZPGmgjE9tM3DSxZwcj95T3+tMOr2CmNhjyrNtF1SZuqOmHWVZryG4kt5ZScGaBk/a/wBXH8RWsXv61CAM5rD1FW18jzJ8TGeorIRXfA7mpdLg7cUx9R9PzzTB1Xzofb2UlqQHXFaFbZQSq9xr0BdqAetOWnWobHFJ+hc7RT7paAAUReZJPEYNLtFVBxRQoFA+oqnYyAKBV1zkD6inF6gTPKvXEY3syjgmlOBAWpj6svxLuUetK8c21qSoB2cy7dw/pq4ai8qjZQDTbsZoyZDItUccw1Z4lGd9prr4u5a+Xnc1DCfKu2+YN+58uNXs9KVnut7SeGzxIvYlfM+1ZG+sCW7nurgovjuz4JO45PfNNPxBFzb6hbkBxG9rIrAjtzkfxH8qzh8ySEt5mnKeAJQ9Q9NK/h5QiRDyGNB55T4hYZUngg+dSQR7VLxlgo4GW+8fp6V2tLeS9c7VyB2I4zR2cAZMhVJOBI4nJ4Uke2anSB5TwGz/AMtM+jdJSTYdouPpTNY9G+GfliGf9VJvrFXgR2vRO3JmfrpNzOgwjD8O9XdH6MuLy6VSjAHzC1rNh0esmNyYHoKcdF6bgtgMRKMe1AOrY9RldCo7mcaZ8NYYYl8XDDHII86IQfD+CPjw8+QyK1BNOQHlRj6VZj06InJA9qXYufMaWpB4maN0HB4DBYsMByw9aWNU6JPzfq/l7YA7Vvv2S3EeMA4oVdaPHLISkanNcAw8ziqnxPLPUPSM1mxdUJA57UI0izNzdC2BSIyEKDLKEUZOOTjmvSHV/TKyIUCJuKfMFHasKvrRNL1Sa0nxsZtyAjsfY+R9vOn9NbuO1pm6qgJ81hl4dKg1ZFt7eOWbwyDOFYJK4G3ciDk5I7+tGbS+k0e5giY7pozlow2dv+kn97Hf0NA7V7lbFoLXUUjQMX4baTnuMjkfSukSLHFvWcSuvJKAgKfLk0/gHiI5mmdOonUPW1vf2w2xQJ9olJ+U7+38cnP8a3GCAOu4ivOfw36gitNV3uyvDefIhU8q/Yrj8c16I0+5BiUHjgZrG1QAfmGXmQ6haK37OaXdR05MFtvanGYKy5oJqUW5SB50PcF5hCBtgzQU2yhaftPT5RikzRtPkFxkHinyxhKIuaaqsVujAy5G5j5r7Jq4ixuPANRyuADQPUpgOB61exygyJTE87ahGZt7MO5oDLEVY4rWl6Ss7r5GVvwNcPw108n5lkOf9VCrslzW0y7TWIcZ9aabVfEUAdzTQvw1sIzlFk//ACq/a9HWtsQRvz7moscQtSkRbttCWfl1zmicfS8JUfqwB9KYo9IEJG3JHvVpodkWO1JNacxsUKRzPN3xG1kXWpywyxSROhMOJGwcLwODWYlSBISc4OwH+daj8XIILjqu/WKXfIrBj4rD5iRyB7Cs1vlZiECBFHZR5mttW3KD+JmldpIkUcjOWiXuyhB7ZPNaR0V0qZ0RtnHnxSX0no76rqixquQCBXonpjSY9Ot44gBwvc+tJayzpZoaKrOWlvSOn7S3hAaIfL5Uah0yzDZEagnyrkUeSMc+9Xo7cAAgHNIjPianAnVLeKM4CYHtVuFVAG0ZqIoQwUA58z6VdhT5RxmiymZAyt2296+qWA+UVYkXJxgE13itmfnGBXETgZRfxCc+vpX2PIPJJxVue2KciqgDdiNpqANsk8ytf2q3DPIQO2Me1ecPilpxi1zci4IavTFwubdxgdqwP4loI9RYTjg5x7HypjTcWRPVjNczeG88OXxBlSxwV96OR3JDhMMUlT75HB47Up3DkTswPc7vxqWy1G5do4nkZ9pyMnjB7itMuZkARj0W/ZZbXwk+e2uVPHAMZbjPvnivVOl3EjABs15W6As21HW7WzcHY9yivj0DZ5r1nY2gDVh+p2YYAdy4hNJPk5NU7hfEbAFXjCccVCV2t81YWpvsCy5MsaTbhMsRzR2OXaBQS1uFQ8GrT3YC8GraTWEDM7jEnvr5UBGaXdQvwTnPnXe+eWfOKDS28xfkk81p/rN64MCSfEKWOksj5I4NFxYfL2qWGeIKM+QFTpewds0wtiqcExwsZT+xEeVVZ7fbzijJuISODVG8kj2nDVc2KRwZytzBEsyx/eHaht9qaY2ipdRmByF70BuIXJyaTY8xrdgTDvi9YXUfU89y0UMcV388bKOSoGCSfX1rOY5Qs6tndzxn0rdPi9oJu9AGpDd4lqSh/wCRv+uKwlISMBgcgcGtnS2bkH4mdauGjz0LJDDfDwhgseK3GxYG3jb2/jWC/Du3kvNbSNR8o5P0Fb9psPjyJGvAA59qU1Zy+BNLQjCZMLWzb8Y5+lHIIU8MZbHpS0nUuj6fujE6s6nBx60Mv/ijodguXuwzDyQZqy0PjqEa9Ae49+FHkAMM1IIlUDnnNZvZfFPTLxwYdxUsMk9x+FM0XUQuUSSKQYbke9DZtn7hCph/2mMDvHGctjIr4b9E5yAKSepupZNNtHmjOWHODWVa31prl4whtLyREyzbt+BgnjNWqzYeJS5xUOZ6Cm16yRT4smAvcnyrqmt6M7IjXkKlu2WrzDDfarcTfPf6hcnzEQwp/E0d0y31OQCQwzKe3zyk8U37SDsxD9SzH4ieib2zKRmVcPGRkEHOaxj4wdPyXWntewL80YycVLZ9X9SdLwgrG13Ai/NbuxI2+eM9qIWfXFl1SlxY3lkLZWgMgdJhIp5AwRjg88UGylgfcr5Ah0vRh7dnBM83um9TKMnBxn0NW9HjiF6hlUlAcHn8KIa7ot103rF5Z3MRWCRi8Tdw6Z4IofbsqqZCuMN+yeCP6U8DkTMIwZtXwP6eT/tFqV3Mqn7PCipx++Tz9Rit8tIwCBWPfA63kWzvtRcuVnKRAkcHaM/x5xWwwzLgYryvqFpOoYfUkGEQiBT2oTfvtJ21bMh2/eobePjNJWvuGBOYyvFcMZKJRsSozQqBec+9X0mAXGe1SmnITIkS54QZa6GzVsECoEv0IxuHFWYryPjJFMV/mQDLDRKoNViVD4qzenYuR6UEkuHE3niq6y3DRlyRDca5FQXcG5TX21kZwKtPFuSj6cgiWQ4i9LaAnkVWlsQ3lRyWHB7VC0VNbcwu6KfUehLqmhX9ixCiaB0zjOOOPzFeTZlKzEZAO7gfSvbEsKspBAI8/pXjfrPTJdD6g1GykiZPAuZFU4wGAbIx+BFPaHjKwF/gxq+EFxY2z6lfX9zDbrGqoGlbAJPfHrTTqXWs15E0GiGZYX3I9wRs3j0XPOKStE08atolydLnAk0m3Df7sMssjqXfnyIxjPtTtZ2UEVvaS4XbHAm3j1GST780RjWrFz3DVmwoEHAiymkareAiCIuCeWkc81Wvelr63G64trRV9Cn9c0dueqZUk8O1VsMSI44l3Sy47kDyHuaT9U6nvdRLFo4V5ARHdnZyTjH1q623P1wIN66U7OTCcOmpajfblI39FJANENN631RX+x6fYyTzxHaQckKaEGzn0y8MMkiBeNzRsWQE+X4U7fC/S2l60vIioMcMSSt6FjwKG2TneMw1Q5ArOMwJ1NrPVEkITUbBYkYqNwGAuTgZ/GqF1cxaPGIgA8g4LYyzt51rPxm0aVOmf0rbICbR0eVcfejDDP8ADvWS6pZrqsYuo32puKylVJO4HlfYVwG5esfxLWDa3ZPHmfLLqQQyoJdoL8CONN7f2o9a9aQuPDiuEjkXjZcw7AT6bhQ+LSbXV4LSMypB9lUqpt1AODzzn+dEY+mLKOymt5ZZHinYGRWIJfHbJ/tVSK+jKqLs5HUL6T1JHqMvgyxmKUcNGxyCPUHzFFfh9ow/Rc9vbvs3XUyv8oOcMQPyqh0z0VYtMptXkRcj5c7gPpntT18PdLMGlGfGfFuJ5AfUGVgP5UNk7VTxGVPILDnmYt8Y9A1PS78WK3LXNsUW6hSRAWjOSGVW7ge1Auh+godRjudQ1iae3slIAWIfPIx8hnzrX/jpYMLTTNSQDckrW7/RhkfmDV7TulIYOlpMZfbtljYjGVxg/wA6NZcUqAXuBo0y2Xnf1/mffh5o56Y0WW3SeSeGW4aWKRuN8ZA2tjyOOD7iniymduTS50yhfp+AFsmCWSE+wzkfzNHrdxGADXmb3L2lm8xPV0eze1Y6BhJpiFyDQy8utrcmvtxeKinBoJeXhc8d66tNzYi5xDtpKJE471NIpWMmqGhkulFrpP1R+lbLIErl8fGKN5qb2s7AHjNT2erSXGME96FaztWZgTzmvmjPidVzwSKwrbwFOBFxnOJpd25IAz5VTW1LvmrJPiNVu1gz5U3qKd54mhjM5bwhUBqUyAcVKyGNarMu41WsFeJQzrKNwzVdlq4YW21EYz6VoVnIhFMrFOO1YP1qlt139tintEhurWRhBMv7QBxg+9egDGVVj6An8qyHRtMimvLp5VDL4km4evP/AFqzWFGBE0tHSltdm4fUVvhBolvFpmrwDBJnWJz/APDB/nRKHRJLjRIYlbEkIa3kJ8ihKn+Qrnw4tTpl31DYZDCHUcDB/ZKZH5U2ixFrq8kUhC2+pEPG3kJwMMn/AMgAR6kGmLDuc4/mBqXai5/iZinTlrYXLSiSQTA58Tdg/hVU2lhDM5htklmdt2UjyxPr7VsE/Slux+ZEJ9GFdYekraH59ij2Ran3GMIKUHiZjpmjXc8vjSJtA7Jjt9aa/g3pRtrrUrxmLCa7aFGJzlY8g/8A7M38Kn6w1G10azez09ozqMg2xovPhZ43vjsB6dyabOhtMg0rTLezhQlbeMKCe7HuSfcnJ/GrbmPx+5wrUHd9Q7rdhBd6e1tLGHhlUo6nsykYIrK+k+lorS51Dpu7AMlo3ixFhgzQNwr+/YKfQj3rabcpcfq5AMYpL606buLqaC/sRNDe2JYxTQ8OAe688EHzB4NXYY/gzhyQPIirefDy0WcvEn1xwRVnT+grdpATGWwf2iTXWx6u1lW2S2NjdkcblkaEn6qQQD9DTBp2ta5fcJZadYgnG9macj8AAPzoOATyYYggcLLcumRaBpDzRpvuGHhWyAcyTNwij8eT6AE0b0fT00nTLawB3CCFY9w/aIHJ/E5P4130rTLaK4W9vbia/vVUqs0+AIwe4jQcJn8T71ZvyiDfHjB96IwCr8YryzfKZ/8AFK2fUOlrqJIjLJFLHKqjucN5fgap9F9S3F/Amn37Byw8PtjgjFHeqn22j/Ngu8eD/wDMH+lBNO0uM9XAWykRI29zjhT3NLWAsqn8n+0c020M38D+8LaPA1jYSxsMEzscfTj+ldpr4L581LqdykUcZXjfvfPrljS694JZtoasl68ucTE9RuL6hiYRnupJVO01UVyT8xrs0wRKgaVWYEGj6dPlER3GrQGAiNX7268OM/SgujS7UFS6vdLHAxz5U9qs7cCMMcCJut3u68fnzqLTr8JOhLYwaAatqRe7cg+dRw3pYAhsVlLRx8olnnM3y3k3MOaM2gGAaBW8TI/NGrWQACiG3maYaXXQOtRiAAdqkV92AKnCAjk1CMWMrulcR8VE8Q9KklJiziqkl2BnmiC0LOLT5IowQex71lt9bNot7qkSgkcSL9Cf/wCVpEl0D50qdTQRm6S6kH6pkMcuB5ev8qmq4WPtMd9PvKuV+4i9HeGNe1TON1z4U+PUgFT/AErRILK2voWguoUmhb7yuMg+lZybSXp/qzTHLRtb3kc0cbq3LYwwyK0G0uxGMMeaePwwY43yZgPudLzRJbVD9h1XU40/ZjZ0lC+wLDOPxNLeo6bqM6Ml7q1+0XmplCA/ggH86bH1AGPIJAPPIxSj1Fq4aQRISS5wKs2oJ6MNXQAPkJU6b0bTjqy74kW3hBkC44Z/In1NO0WqWljOwjGc8mk5vs1ppjySyNHsQkupww+lZPd9ZQ6Rqrvaz3M8m7O95SdwPqKsi2N+2CstqQ/Kejk6qSBJJNqjBzz5UE/+sehG4NrJdxO5baSqnAPpnGKxy9+JqSaaWKnMjBCueM0Ftut2kmikaCNZFf5QRwo9cUSqm1u4K3U0A8TbLu3BklvoBjfIZAo9DRjRdfhmiXGAR3pK03rvT3tGcsT8vG/vu8xQVOrrQ3rXNnMEDN+siPH4ihPp3HIEMurrOATNqXUA33ex4z5Cu0l2Hj247dvSlC01J5rVHXkMAaIQ6igVNzc+mfLsaXV2JxL2hRyJS65unS0tI0TcZZMd+1H9Ms45NHWwtDJvjflm++wPcH3pJ6vuZLzbIi/JCwwd2MDOe3nTxp3UmmSKt8rqrlQ0gB74Hf60y4CqoJi9DHc5HjEU+srzGptDC36uBFi49QOfzpbtrphLnPNHjbfpm6muHGPFkZ8fU5q1D0rGGU7QOaQBBzPOWOXcsfMksdIkvoldiVBHlU8/TLxLuQscU2aZp4ihCj0oitiGjbcMjFLHUmt8CM10grmJdhDJFEQwIIqhrXiSQsvPanSTTlG4gUvaxbKiOafGrV1BhHT4zG9RheO4kyD3qiLtkOPSmHWUUyy/WluaElzgVVBvmdPVboiKOB2FVpLtYTwcCq11qIMYwc8UA1DUjuAyRSliD/jGd+I4WWoq55NX0u8+dZvBrLxyDa1HrHXNxAYHNAZtq4PEgPzGO/utqUs6hqexu+KJzXHjrnNA9UsmkBYCkVtJsyepZicT7HqYfndXS5YXyrGT58Gg8cMyyhcHFGraAkDinAwRgwMmq0qwYeIh/EmOTTLTS71VVEs71FBxztII70UbVknWOWFlKlQTzU3xK0HVdR6Yv0hjhkghj+0b3bDAJ83b14rPrLUpvs8ex9x8IPkdj2P8q3UZLq8qepre+Pc3Kc5Aj2+qGRDg59qzbqzq0WF42CWmztVR+yPM056XexagWhJCzbckAeVYz11ZzjqeeEEkPIce9TpahvO6E1V7e2NnmXb/AKk1TXYJYoXkOedi+YFL0XT2o3UyzLESW824wPWj+kWGuaSVjisItsvDTZJOP6U9aT0hq9/GX+0WUP7owSfxp/3SOEEVTSmw5Y8xKs/hq0tg6XOqW6K5DfKCWB9qmg+HjRs2653IANr4weK0KPoO/EsYl1SNU/b2oOfpR5OidIjiLXNxPdyY2hS/H8BVA9n3Hf0NYHImP3tlY6daXAlvkiy26Pc3H0pVgupRcZBBjY8SDOD/ANK2y7+GGm3U6mS2RIVbcI/Mn3pc6y6Rh0u1jmVVQCZVA/01K34O0nMSv0uORxHTp+SS36Vs7hzvk8MUKs7+W71F1LlAxaLg88nNXtRuYbfR7SC2A2oRx6cUGt/DitpmVwj5ZvEzyCTnP8KTQDJP3GHJOB9Qlrt0Y9JdQ6s7yjZjyHnR2bSzFCqRRiNdo4Axnik22vBrPUmm2ke6SJ7hF8MDuAQSf4D8q2C+tUOTgYNJ+o6gVbEPfMytSxLcQDo1v4RAaj5AwCKWL29bT5Mjyrva9Sxy/KM7vShLhlyIoDiOlhqCxna1FX1CIx4UikWO6kkwwBA9atR3rAYZjWbqQzZCmMU3Y7jI06spOaUepbtUjfaakn1V0GFJNLGu3ryI+T5U7oqDsG6FsuBHESdTujJcvzxmqwhDJk1FeSbrk7e2asQqzKK0+AOJnsZtscbOcljjFVrmz8QknJojZMjINx8q+3ZjUZXFfOrvVbVv2DqOisFcxXntTbTbucVct7tFZfmArmpSKw54NAZpWVsrmvX0YurBaAbgzQ7K4WVRz5VPPtKEUiafrcsIClv40x2OpeOoLNmhWUbBgTg8IRWSls7aIQ2qAZxUVpKjrmrjToF8qXXTnGTLKZ8uII57SS3cApKjIw9iMH+dedLSJtDubjSbuNRJZSm3bPfaDwR7EEV6Blv0RCSwrCfjBbNp+vR67EW8G+UQzHyR1GF/iPzFaHpjFbDWfP8A6Iaqza2ZT069lstSLqxbuGbyznn8q51pY2t5eaXfAAAtgsPPnNLlhrm9PlYCVTge4q7r+q/7NbqrAAAvj09K3Ah3iPe4PbM020s4JbKGWNFbAw3HeorvU9P05XEi7HQZIHkKA9C63NfwrG2QOFCjsp9fxNHtd0ePUbGaMx/OR3x50BgUfaY7W+5NyRXvPiLZQSlVjZsc5LcYr7bfFIyblhg+YEDike66XuptSkgRCqDKKG7kY7mi3RnTFxb3yXVxtMUbbeT3B8jTprrC58xM6m9m2k8TYdJupr23S5lGUZQVBGD+NIXxO1RgojjcSZIHy90byrQFlhsrRmkZUSJN7YPArHOuJnv7p5ncEk4cKMfQ+496Bp6yXyYTVWYTAlltXkOl2yCQqzDa2e+Mc/jVO51No7cxcMSu9sHj/SP4UKs7+F428RyXiU9/MntQSS/lubgWtsrStI21UHctmmBUN0Sa47Zp3wlsJL7X5NUeRlh048EdndwRj+HNbRJdJLGcY7Ul9LaGemegQnhkXJdJrgjklzwf4dquWGqGZMbq8f67p3t1AsXrGP6mAu+BCn6kPUUXiqdveqHTmnEy75BnmjNzEZkPma66YVtn2sMU5owwrw0U4zD0KIV24AFDdRYQtwcZqy93FChbeKVdZ1pTLtDUPV1MRlZLECHbeMToSaE69ZjwWI9Km0fUA8J5rrq1wGibJ4xT2lzgAwyAbZms8Wy4YY86uQYRAag1FgtwSPWohdDZjNPbRFGE1n9LLF2NRvrgbA3UsrJLNKQM1a+ySxJvZTivNL6XU7+4w5hw5hG8uzcYAqBkwtUnvVQc12j1FJF5rVFYRcCcSJJ4XzZFHdI5AXPNL0d1ulAI4NMWl4GDSl77BuMoO4w283gL3qC71UgEIc1Gyll4OaoyQuhJrKT1EO+3EKVMhuNQk7k0E6gs7bqLS5tPus+HKO47g+RFX7uNgfaqckLEZxWzVWOGWUOZhGoWF30zqb2l4pUHLRSHjxEzgEVVvNVefCmTIxwF/ZxWv9Y6DZ9TaOYTsNzbb0WQfejbvj8xWHajpt5o9wILkEHnaw7GvRUPv/d3HGVggPgx56Q1k2EqXAlbZENxGe5p8uOvWuIAI2ijDclPMj61h9pqDW0LfMV2qcg/tf4atw62VlVgTjbto7UgnJnV3lRgGaudWt7WWS7EaSRKcoD3Ykck1RTWozIscbKQxZ1x2XPrSFea8fAwHwQu3GaoWPUP2VX5JY+dU2GENwzNDueqZ7dvszSbo9gRvQmlzWtSikhRYGJcc5znB8gPalq51tpXZSGLk9wcfh9a6xJLqDMtqruWkwo/dA8yfr/KjhQoyYBrCxwJyW8leSTb3z90evpWh/DDo1YbhNTvk3XQOUB/8vP9aC6P0iEljkOJJu5Y9gfatZ6X0828SjbjPvSGo1HBCx3Tac5BaXviBeXWn/DjWbiyuJILm3iSZJIzhlKuppY+HXVR6x0r7VMsceoQNsuFjG1ZR5SAeR9R+NNfXkIn6D1+Ecg2Ep+uBn+lYd8E9SNnrDqZNqErn0IPkaJo9OuprNTeevwYt6quGDT0VHaMYwTnFDNVP2cbhwaZoXia3yCCKVddbxWZU7VjLU9bFHHIibbduRF2+1uRUZQeaXp7qWWTcSaLy2JZzkVC+nhRnFHCZ7gFkul6i0IAJqzf6gXjPOc0KCeG9TS/NHVwgWWLFeBF/UpSGY0FN8yMQTTLc6e0+cAmg99oMwGQhqcnzOUZmu2uniKfJXFEpFV1KkDFR6rdxWj7sjtQ39OwP91hk1kaB2dMmM5UQPrEQjnZFHHlVWzhdpcd6KzqLhy7D71WdMtY9+eM03vBOIuVOZ2t9OygZlorABCo2k496sxoqx8CqFzOsZIzg1XVacOmJfbjmF7eUkDNd5zkZxVLTpTMoIq7O/yYxzWMvpu05EMG4gu7cEgVVvLmO3tJZ8ZESFyB7Cob6VllIzQPqO8eDT5IclWlU5z3xXo/T9KbXVPHn+IJ2wuYD+H+onVINdjnOZFvfEI9N6/3FQdS9PRXAPipk+RxQT4Z3y2fV2rWLnAuoVkXPmVP9jWlX1sJoirAFT5U5rSUvYzZ0Sh9Oo+pguraA8MxEedgJwrUGeC5gk2yIyqCCRjg4862DVdDSV2aEM20n6j+9CTp6FSjKp3DbgqOKImqIHMBZpOeJl0xZhtyeM5/jXWOOUbdgfdnIwK0n9BwuMeHGAD2C+dW7fRY/EBZF3Y448q460fUgaInzEfRemLu/uBuHhIMfMe+fatE0rpeHTofCjVuO5xyxq/YafHDtAXBJz6n8qYrO1aYc4GCOw4x/el7NQX76jNWmC9dylpmjmCTIHJAytOGnQiKLA7+dUra2ZmIUYUHn3ozbxCMeVJs+ZoIm2Q62YjoV/DL8ySW7owPmCpGK87dB2zabrVyE3PGrLj1xmtr651NbTSZ1U8spFZH0xA32hXI5dmYkHnk4H8q3PRgd0xfViMTatN1VpJzDvO2YAr7Pj+v9qufZWuDlgR9aTLO/FhfQvu+UgBlP+dxRnXOq9S0XU4bhoxeabd4BTAzDJ5gN5A9xn3rU1/pvvtvTgzBSzbwepZ1C2WFu1DrhVK8URvLy11V/CtLpBcEBlilwpYH91ux/KgtwLm1m8G5hkib0cYz/esC7S20HFi4jtWx/wBplGdMP2qNm7CjCaeZ03YoZe2xgbtxS7GXsqzCWmaf9owccUebppZ4lyg5od0tcI5VCe1aDaRoUX8KFnJjFFORMt1fUpL1iiknyrvpOjucSMDUul6b4t4wIzzTtp+lLHHyvFY+q1H6cbUiaqSYvT2nhxjyIFU47wW7g5ph1qEQoe1Jszb7nYD51bT2GzmWJ8Rnh1QPFxzQq8uGkn5BC5q5p+nMEUtnmrN1o+5C4KgY5JOAK0K7S7bByZQg9y30/Om3bxRXVJ7WztTNPIsYxxnufpWZSddW2kX32a0iNxg4aYnCn6D+ppX6u63vtQWO4bEolbwo0LFRg/u48h5+tbul9FYndfwPrz/8lDqMDCy/rfWd/ruqtY6HItlbKwSS7YAtknAA9/Yc181O68Nrez8aabw0ZTJMxZn9yfrmk7Sxcw6pMsLI8VsS5ITl3IwOfr/KiStKl2njNuYDDc9j6Vv11JUu1BgQByTkmAri5fRuqLXUo2xtID4/dJwa2rT75L+1SRSDuGcZ71i/U1uxKE/KGyKa/h7rzParbzHLJ8tYPq1GTvE3PTLsfAx6uLFXVinGe/qKBXenhWJY/jimZJUlHP4VWvLMSLlCG9j3rDDEHE2SoMWhZlJQwX5fPaaIW8Vu2cjJ8ga5JbncVwVI8jX22sXEm7HFQzTkWW4IFycYPHZe1F7aM4GcKvoKhs7InG1c+/lRSOOOLgkMfyFULQgUCTwKoTjj3rk1ysaHkAAVWmuti5yBQbVNSKxEZ5xUopJnOwAin1/qnio0Stx2pe0KJ4yjr4hSNQe3bk8mvmu3ZnvwvDAZY57Vc6dZ01GSJiWjkURucDzH9DXrvS6dqbvueW9Rt3vj6hO+lMwJU8kBuP8APWq/UV1ezdLyhXSQ2wSRN4y20NzkfQ0QhgEcqfKGGOR61fewgubYxOkRjnDw7yrKwDDH04JrZ2kzLziKP228WS1jljkmjdA8MkDbQRjzz2p06T6+crHp2qRrdxHjMqghT7Gk8KYdLjszIPEt8oDj73kRQi2VrXWEkhddw5Kk9/UVVvo8iSPsTZLvXLCxuBDLamGFzmOaHJU/UHz9qgvrJdRhaezZbiMdzHyV+o7ik+TqmbT7qSyuLb5XIkhliIO8Y81PG4duKL6T1ppSTpdPEbWQHDqqPGfrgcUpf6Xp7RwNp/H+IVNVYvB5Et6NG9tdjHbNaPp8jmJMj0pc0zX9A6imDbYop+6MjBXk/DsTTdpj2cyJHDMrPn7rcNXmtZ6VqKcso3D8f4m1o9XSw2k4P5iX04FknZj5GniNkWL8KzzS5ja3JAPnTX+kP9n98V5/UUCxsxJGAgfqm9CK3NJmmz+PqS5BOWwPej+sWlxfyGWR1t7YZ3SydvwH7RoLDrVjYo/6ItJroDIkuAAXY+gPYfQVt+l+iWWJk8L9/wCIrZcFP5jfd6xaadGqczXBHEMfJH19KT+rddvBZy7rsbnXGxfuRg/Tz8qH3HU1yURLTTBbStkMZpQcj2C80u9TxyG0WKaUtKfmcj5QD5ADyAr1mk9Po0i/7Q5+/MXZ2c/LqLrXM93dlZHjaJOMopUH2x51Lrs6/btOhAwsYqtp9sEdRk8tnmu2uIftcTeYwRRecS3EOWtuI47gqQNxVsk9iePxqZLcxOCOyjHzV803mzWRsFicjjnjjv5Vxpm8QbvXg0THEqDKHUcRe3zj5lxgfnQrQ7ptN1MYJCseR6UY165gtojLcyLHHjGfMn0x60AW4jubWO4gclccbhzkGkNTULFKeY3RYUYNNg0zUlliU5ycUVWTxEznFZ/oF+ZrOORWxxTRp18XOwkgn0ryNtWDPT1WZEuzTvG3zqrr6Gu8eowgD9XjHlUskYZQSck+1QiGINnGaXPMZEuxanJINqgAelWo5vl5IJA8qGpjPyrVrayREniuxOzK9/fEAoKXdWuG8E8+XPtRaZHnkzggZ/Gl/rIm0sFt1KrPdsIY8nGMnBJ9hmnaKyzBRFL7MKWMU9Lf9I3NzMSAvln8u9HNIZ472TbGWJl9MZGfIUuaRGtjK7NNuCFgzp90hScke3FBNI+JF9p10xniS5t2cttPyuoz5EV66u1KlUGeWsVnJM1tnaK4KhVK5Pc8ke1W5kLQGWKdomXB5OBn+lL2n9Q2HUcKz2c4lkXkxAhZAfdfP6ijUL7HAWUDeuRnuPw/pWgpBGRFTkcGLWu7rbUZw7ZLnfyfMjPlS3cSkXsbBcnNMuuqhucrtyEAYL2zk0r6mpSVGGQM+VCcS6xzvoYdS06BpE3lFGSO49G/pQ+w06R58tdSrEh5AY5xVm0k3aZGc+4xwR9Kit5TH4jbyBu7jvmr8eZWMmmdQWkMyWU0EUkB+6jruwfX1z9KJWk95pt80kF/PHCWDxLIPEVPVTnn6HNIKSFZVlLLuDYPvTNb6qZ7WNHXJQjBB8v886lTOMaYrOeS5KxISwJJPYKPUnyFEY9agAFvYqt5MELyXT/LbQgHHB/bP0oTrerBZ3N2PBtwvy6ep+83rI3n9KXeotcu5LVYodv60ABkwAg9APKsbQ+i10jfd8m/oIV7ixwvUG9V6nPr+otai/uJoYziVkO1D/pFct702CRrHtUJwvPA/wClU4d6p4aWwH1PBPqfWuai7W0BbID7ePrWx1zBAeIeS8sLpGnlNuZlHZX2s35UkdR3T3DuiIEXyBfJqlHPKZ0UyZHc1FqMYPz+IQx7ZHH0zQmcsJcKBJ9NtwY03ckDPJrpri7poSuck96n06F40UsdzMOfYVHq4IjR1bkMMVBHE6HNMnRNOhUj5tpY8cHmqWp3MVkHu7iRY0QZyT972A86+T6hHYaZDI/6wvGdkQP3iO5PtWd6zqF5qtx4ty2QvCoPuqPQCh33hBx3L1V7p31vWZdcufEYbIU4jjz29z70V6JtrzVbifSreDxx4T3BUMAyhR8xUH7xx5ClcAiiNjJdWc8N7ZzPBcQsHjkQ4ZSPSswO27cO43tGMTQunJ4LOSK0LSbZcgyN93cTwB6DHr509WFhLbTg4bFYtD1VcPezS3ccZMrb3CLtGfMge/etC6X+JMsUgWdJL6zACkMAJE/5T5/Q0rqdL7vyr78iO6XVCv42dfc1S1sfGhD4HIrj6R82QKuaBqWn6rZC40+ZZomPK9mQ+jDuDRlIlDZGDjy9KwzSQcGbYsBGRAEek7TuORipLqy2wjanJ/jRwKGByPXOfKqWq6haaPp0+o3kgEEK592Pko9yalaiSAJDWYGTEzXtVtOlrI3F188zZEMIPzSN/QeprNrnUr3W7tNQvJAJVO5AB8sYByAo/wAzVbqrqG71e/udUuAhbYSiEZSNR2Uf53OaSbvX7+9IjD+GuNuEr0umoTTDLDLGee1Ooa84XhYb1/XILeyuLC0ZmmlAQsP2Vz82T6n+ppM2EGi0VnhCTy3nXVbAsxJFXs3OcmAXCyjFJLA4kidkcdmU4Ip56W+IV3DLHb6sr3UQ+7Ov+9j9/wDUPalr9GkgEjvVzTNNZJ1ceXNWp9xW4lX2kczQNVlFxLHPG8bpJHuV07MPWgWqYMak4bFXbS2SK1CqDtGWwTkDJ8vaquooCvyKCPfmtMkkcxMDmG9G2z6aqLIC68kdsVCwaGEoWz8xOR3obpQYYUSBTjBzRCdlAG1s+RJHGasDkTsYMhik3MwZiwXntV3SrgiRY+Rz29KDpKY3YAqD2BxxUkF0Yp/IDPlUBpxEO6nqrXdy0zsxG48e+a+rOtzarwMjzoRfXKmNgihQGzjPJJqHT7yQOynB2nIB7Yqd+Didt4hdV5yZOT2ycYFVdRm2rhHBXGO+fyqWK4U/fXkDOW86B6nc+LJ2HByMDGKljxIUcyOFRJcDC4PmO1TalEpRQR8tRWqCSXgtk1a1ARNbkbmVhx7ChjqWn2BF4EWQMZxniq1+rSW2GYnDcYqWyj326tuJB8x51IYsBlJ7+VS3M4QDKrSxghmJ27Rn0zVObSh4TMRzRdIdjMM/KDmpDADA3AOBz7UFqwe5dWxFh9MBGQOantbTYNpolEgI2nBx51xYcP2znzoBqA5EKHzAl/p5z4kY5FVIzIPmjd0YdwDimcxjPzDINVrjS0kBlhwrjuvrQmqyciXDyPp/q3V+mb9LuzupAynkMchh6EeYr0n0B19YdbaZ4tuohvYiBcWxPKk/tD1U+v4V5jFusgKsDxxj3oj01rF90drVvqtmxLwt8yZ4lT9pD7EfnilrtNvHPcZo1Ptn8T1ZNN4MpUrtJ5Izx9axP4kdZx6jfPvuRHptuSsQH/mt5uB5+g9vrR7r74pWB0aJNJkE1xqEIk3A/wC6jYdj7ntj2NYPqsk13L4kshdmJ7+X09KFpafaPuEc+IfV6j3BsHXmW9W1/wDSKfZreNkh8y33n/tVe1sTkE+dRWdryGYfSi8SbSOx8qdALHLRDgcCdTCVTbxnPNSwwjBO3txXcxsT27VYSI7cf4aOqQZM6R2wZdxGOKKWVsiL93kjGaiji7AYPtRS1iBXk/hTCJBM0khjYRlQQOMfhVS8iYJlyMgds4oh90HjJ/zmqlzErKGbJo2OIORaTGCHA528rlatTxeGWZiSDgmutioiMh3BWHbIqZlYqG7oT6efrUAcSYLnOyUlaru7ySBQACfSrd3GIznAyc8nvVaJt8o5HcdqridCBtbuYAC2lbI5Yxn5fp71Da2Vyl4i+BONwIP6tuPyrlcpVrT3DisSWea8tg0a2kr+XKGhsVjqF1IQLK4+YjtC3H5VyuVJuYyjKB1C9joGoCX/AMPvTx38B/7V11LSL0WjA6fdJ6gwsM/lXK5UNe3UoBItOs5obRVMToe5BGDVl4Ji3Ebn8K5XKsLmxCe2JSbTL64yY7O4bnjbGT/KpY9E1V42zpl99Ps78/lXK5Qn1DCRtEoxaFqy3DL+ir/Gcf8ADP8A2qd9A1NRk6bfZB5/2d/7VyuUH9S0ticXQNUl7aXfnnytn/tXSXpvWkDGPSdSP0tJP7VyuVC3sZcCQr0zrMpLfoTU1kx/6OTDflUl10rrDwjxNF1IheQFtZMt7dq5XKJ7p2mcFyZR1PpDqW0uhFeaJqEbOMqEgZlI9AVGOKgl6X1YeF/3RqJJB/8AtZP7VyuUpXczAEwpEli6U1sHP6G1Pn/2kn9qI2/TGrFf/CdRz25tZP7VyuU2jnGYJp2/7Oasr86XqHf/ANM/9qmTQdUIb/uy+G3/ANs/9q5XK5b2lSsnTR9RDAtp92vPnAw/pVtdPu4h/wALN3/cIrlcoq3tKFZZg0vUrgts0+7fzysLH+lQXGl6uQR+ir/t5Wsn9q5XKZFhxKbRPg0fWFjyNLv+3c2r/wBq7LZagF/WWF2Djt4TD+lcrlCe9l6kkcSC/wBE1B1BWxu2z+7Cx/pQxNH1ZZWzpl/7EWz/ANq5XKG2oYjM5Vn/2Q==", name: "Rohan Prajapati", age: 29,
    gender: "Male", education: "MBA", occupation: "Handicraft entrepreneur",
    location: "Ahmedabad, Gujarat", maritalStatus: "Never married",
    description: "A sample profile representing a young entrepreneur connected with traditional crafts.",
    interests: "Business · Fitness · Heritage", status: "DEMO", verified: false,
  },
  {
    id: "demo-matrimonial-04", photoData: "data:image/jpeg;base64,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", name: "Kavya Sharma", age: 26,
    gender: "Female", education: "B.Ed", occupation: "Teacher",
    location: "Lucknow, Uttar Pradesh", maritalStatus: "Never married",
    description: "Values family, education and preserving traditional Indian art forms.",
    interests: "Teaching · Painting · Music", status: "DEMO", verified: false,
  },
  {
    id: "demo-matrimonial-05", photoData: "data:image/jpeg;base64,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", name: "Vikram Patel", age: 30,
    gender: "Male", education: "B.Com", occupation: "Family pottery business",
    location: "Indore, Madhya Pradesh", maritalStatus: "Never married",
    description: "Helps manage a family pottery business and enjoys community events.",
    interests: "Crafts · Cricket · Travel", status: "DEMO", verified: false,
  },
  {
    id: "demo-matrimonial-06", photoData: "data:image/jpeg;base64,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", name: "Ananya Das", age: 24,
    gender: "Female", education: "M.A. Fine Arts", occupation: "Art instructor",
    location: "Kolkata, West Bengal", maritalStatus: "Never married",
    description: "Passionate about clay modelling, creative learning and cultural programmes.",
    interests: "Sculpting · Reading · Dance", status: "DEMO", verified: false,
  },
  { id: "demo-matrimonial-02", photoData: "data:image/jpeg;base64,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", name: "Rahul Kumar", age: 29, gender: "Male", education: "B.Tech Computer Science", occupation: "Software Developer", location: "Patna, Bihar", maritalStatus: "Never married", description: "Values family, learning and a balanced lifestyle. Enjoys volunteering and exploring new places.", interests: "Technology · Travel · Volunteering", status: "DEMO", verified: false },
  { id: "demo-matrimonial-03", photoData: "data:image/jpeg;base64,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", name: "Priya Sharma", age: 26, gender: "Female", education: "M.Com", occupation: "Accountant", location: "Jaipur, Rajasthan", maritalStatus: "Never married", description: "A warm and practical person who enjoys music, cooking and spending time with family.", interests: "Music · Cooking · Reading", status: "DEMO", verified: false },
  { id: "demo-matrimonial-04", photoData: "data:image/jpeg;base64,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", name: "Amit Verma", age: 31, gender: "Male", education: "MBA", occupation: "Small Business Owner", location: "Lucknow, Uttar Pradesh", maritalStatus: "Never married", description: "Entrepreneur with an interest in community development and traditional crafts.", interests: "Business · Heritage · Cricket", status: "DEMO", verified: false },
  { id: "demo-matrimonial-05", photoData: "data:image/jpeg;base64,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", name: "Sneha Patel", age: 27, gender: "Female", education: "B.Sc Nursing", occupation: "Staff Nurse", location: "Ahmedabad, Gujarat", maritalStatus: "Never married", description: "Caring and optimistic, with a passion for healthcare and social service.", interests: "Healthcare · Gardening · Music", status: "DEMO", verified: false },
  { id: "demo-matrimonial-06", photoData: "data:image/jpeg;base64,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", name: "Vikram Singh", age: 33, gender: "Male", education: "M.Tech Civil Engineering", occupation: "Civil Engineer", location: "Bengaluru, Karnataka", maritalStatus: "Divorced", description: "Enjoys architecture, weekend hikes and meaningful conversations. Looking forward to a fresh start.", interests: "Architecture · Hiking · Photography", status: "DEMO", verified: false },
  { id: "demo-matrimonial-07", photoData: "data:image/jpeg;base64,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", name: "Kavya Reddy", age: 25, gender: "Female", education: "B.Ed", occupation: "School Teacher", location: "Hyderabad, Telangana", maritalStatus: "Never married", description: "Patient and cheerful educator who loves books, cultural events and mentoring children.", interests: "Teaching · Books · Dance", status: "DEMO", verified: false },
  { id: "demo-matrimonial-08", photoData: "data:image/jpeg;base64,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", name: "Suresh Yadav", age: 30, gender: "Male", education: "Diploma in Ceramics", occupation: "Pottery Entrepreneur", location: "Varanasi, Uttar Pradesh", maritalStatus: "Never married", description: "Part of a pottery family and passionate about preserving traditional skills while growing a modern business.", interests: "Pottery · Business · Travel", status: "DEMO", verified: false },
  { id: "demo-matrimonial-09", photoData: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBAUEBAYFBQUGBgYHCQ4JCQgICRINDQoOFRIWFhUSFBQXGiEcFxgfGRQUHScdHyIjJSUlFhwpLCgkKyEkJST/2wBDAQYGBgkICREJCREkGBQYJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCT/wAARCAEYAPADASIAAhEBAxEB/8QAHAAAAgMBAQEBAAAAAAAAAAAABQYDBAcCAAEI/8QARxAAAgEDAgQEAgcFBgMHBQEAAQIDAAQRBSEGEjFBEyJRYXGBBxQyQpGx0RUjUqHBJDNDYrLhU3LwFnOCkpOi8SVEdISUwv/EABsBAAIDAQEBAAAAAAAAAAAAAAMEAQIFBgAH/8QAMREAAQQCAgEDAwIFBAMAAAAAAQACAxEEIRIxQRMiUQUyYXHwFJGxwdEjM4GhJOHx/9oADAMBAAIRAxEAPwAjwZp88scbNc3Lbd5nP9adH02Q7eJLj/nb9aTuDNUWNFQ9RtWjWdwk4BOKyPa7SYDQQkfiOwuEhYxzTgj0kYf1rOX4h1KyuGi+t3PXp4zfrW08SxRpbuwwdqxLVLcS6q/KOpoIYWOKkMANq9LxNqcsQBvLgAekrfrQW94h1JvIL+8GfSd/1og9iyxbjagN0mJ8UIlzjdoL3WdK3b3uoNub+8P/AOw/61OdUv4l3vrz/wBd/wBaitAAK9dDyE0VtgbQXdqGTifUYTvfXWP++f8AWuE4sv3OPr116f37/rQHUSwcgGvmmK0koBAAO2T296K1zq7U0mu21TUrlsC9uwuO87j+tEYZ7ppuYXlzJyZbzTPy7Dr13obpVrJG3I0Qdg+Cp7jG+PzpiW0stOhE97cHcHMQ6kEY3P8AOmIoXvOl46Rrh6aeBQXvbhXK7v4jbZ+fWutYtbr60TDd85CgDnnYgt6nftStd8W20uILQSADuO59/U1YtZoLmF2ceZVzl25Sp7HI7U+IAG0Spa2+1xe2OrzTuDe8rD7kdyygfAZqG/0LUo7b62JNTaM4HI8znfuQwOMDrVfUbu3ibw5HfmbfmXBH496Z+BNbubeYwxzxzwybeCzgqfip3HyoL8dqO2IOSNaLqMLyM99eMI2wymeQMo9SpPT3pisdXurXCvd3HwaVs/nWh8U6JZTIlwFjTy4yo5o1Y9uYbisw1C2uYrgRNh0Y8qOp5gD2wfTtilXxuZ0gvgI2ESm127uW5EuZ8f8Aet+tdLc3SrvdXH/qt+tB9P5uYnGcDOM71Jd6iApANIGEyHk5BJrS4v7+85yFvLoZ9J3/AFrm0hvphzNe3mP/AMh/1oU9/wA8wBOd6aNFljkUA4qspcxtMV/G0H1CK/hHNFfXoI7fWJP1qXQdcv7WTD3t0d/vTOfzNFtVjTcLil8w/vPLV8d7qtykFPB4uuY7Y/2qXP8A3jfrSZq2r317deW9uuvadx/WorhZjHy5OKq2alJfPRzLZpDLi5EI/rvh5a9vP/6H/WqTarfWs+Pr93gHvO/61fuL1EiPTpSvd3RlnOOma9J0p3dJ90/Xbh4ATeXBPvK361T1PX7wSoi3dzuw/wAVvX40A0+dgoXOKKR6e13IjYyOYUK6CIWaTTHZS6bNlCRTVpGutEgEhwaB6zeoJ8DFdaXA1+xZc4HpWVLkvE4YxHa7ekX4h19XtipbYikG2CT3rynoTTdrehO1k5OdhSVa81tKUPUHFatkjas6+kUvuURH0xSVdTK12R70x6reEQEDbNJU0rC5znvXo2Whcdo9b/ZHvX24UkYrjTW8YqKOHT+aIsR2oUz+OlUt2ky+tlZgDtnvUlrYyAq4XmU9Me3b2qzqqpal3k2UDrQ+xvXnjLSDkhBwUPcfrT2JF6nfSmkXiuXgl/eXDEjcKozyn2NBuKOICHXCyx9AVI2z6j29qK2jweIF8TysMqkIwfmTX3UNJi1CaJZmZcghFcggntn0HvWyRxbpVGyle01CdiFV0hQHBkbff0FMFlqUVsgP7Ul5s74IA/CkjWra6t7qSNgR4TcvKvb2oZJdTRjHISc7AnYUNr1chaY9rNekS2t2k+Wz4bqCPlii+jQiyuy93FDE6DmUSsRG/usg3U59enesj07XbqzlVxKEIOQFNafonHVtrtulrqhQTZwJQuAf+Yd/jUk2rsIT7qeuyTJbxlJra4jXIDMBIPmPLIppd/agkkaSFkQs2JMr5GPuO3xoVqkjWsYhiUtDjy27PzIfeM9VPt0oXb6oWRbmO4dHj25yMsp7qw7iqFlovqbpNLWsBs3uLZZA8Z86A5Ke+e49/wAaXb64V5GETMMf8QYJPfFX9I1JmuMpK0M32zGd0YH7y+qnuO1EdR02znj+sRQhUwWbzE+b+H2Hoazpoi066Q5IgRyale3gaRgSDTNpbCNOU7Gqq20cbEIG5R/ENx8al+sJElLcPlI7JUup3pVCAd6HWcwkfJNVNR1FcHeh9vqBEuB3qQAEQ+0UnaK2S4jyMZoZf2ohO3WpLPUhHCBmq99qKSMBnrUOaKsIcY9yrPaSTpjeqMmlmJ84pn0lY5gAcGotZgWHJFTXIK7/AGuQWGNVAxTXw9LGzxocHLAUiy33JIVB6UT0HV+TULVeb7UyD8WFUo9FXJtMWt3Li5JyetaBwLZH6sjsOoyazyzA1PUI+YZXOcVsvDVvFBboBgYFKw4lTF5V4mm7XOvWqi1ZQOorKdRswl82Bjetf1yWMwsMjpWUao/NqBx0p+RvwmH7QPVoMx4HSk+6TlnzT7qSq0XvSddWrS3HKo71MOu0IH5VvRm5HXNOMTpLGqFgvNtk9qj4W4Qa5iWV13xmpOMbQcPaXNdHbkXYep7D8azMiZj5RG3tQdrPOMb1ZdQ+qxnEcGGlYd27LQm5u2FqrW6KxztHn7PufahupXytCvOnJO555CrEhie5B6VFp7u3M683O223UD0rpsaPg0BQ74RO1uZIQS0pMjbs36f0FEodScspVTk9Wc7n9KXpLtI3wftnrg5NHOHtOmunDqjHO/rTL3gBVYwk6V3WIo7i1a5ePDsRk5HUUKGix6haieOEb7Y96e5OFJ76wIEZDHZRjc0b4T4Hms7BkvI1WQk4HXArOe/4WzHjNMVntYzecKNGpZFbmz19DQWRLvSpgS0mAfjX6NueEYWlkjdQOYA7euOopH4p4FLBigVjg4AHWvRzkHaXlxbFtS3omtW+p6eIrhpPQEfd9/lX2aCWO6JViLkdR92dfUe9L9tZy6XfvCcgMdvjTDHc/X7CMg/voD5WHXHang4HYSRB6Ku2Fyk7pEGaOSNuaNwMFD6fqKd9B4jSSzfS7uONSHLnCAZ/zBu49u1ZtcTNJGL238s0X96o7j1+H5UwafdK0CXzSLEI8MQ4OW9gvf0PboapIwEIkTvBTDq0brmSIx+Iu/Igw2PU+tAZp/GwvhruA2Rtv3+VM5u7XWoEOmJNE4jAV5Gy5IG+cbA/0oOtg+WeRUDA74PX3xWVI0g0UKZojNt8oLJYmbJIqGOw8NufFMTokUZyN8UJklCyYb5VSkBp5bKguZWhTIoO19JJNvnrR24g8ePYbUMGn4kzjvUAfKo0gFMGgXjEKCelEtVbxYj8KpaTaAJkdas3coClD1qocQUwaeEmz2U73LYHlJo5oOiut9aOQdpkP/uFXrC1SaXcZ3pt0rTkSaBsf4i/mKh7/hA5UaS1ot8tvdpz7Gte0DU1lgUKe1YSsjBg42IOa1ngS6S8tUB+1ir8rdSNA83xKt8V6hLboSCazuXUTPcFu9apxNpaT2pON8VlF1ZGG9ZAD1qSSEwbBUzs06dajttMUSB3G+c71dis5I4w5QgD1ri6u+RRy4yKWfLfSG5wWocJpDHZ8x5Rhep7Vlv05aqs19p+mrMqBgZ5E6YXOFz7nc0Z0LioRxCJn5eXc56HHQVkH0ga4+ucQ6jqTOCpPhR+bOFXb9T86Jh47XSCT4VWFLU/9tu5HXPIpwMjGfT9a810YYmSFiE6ZHV/9qriWQWQQu/mICqT3P8AtUkuY0ULjfAFbzVBRHhnSZNUvUWQ+UHp2rdOFOHYreAFY8kjAONh70gfR5pSlkkZSxHUAda2/TmjSBVAwANqz557dS1cWCm2vttYRQcuFGwwBV8RqB9nao0ZSdtvlUmScbmhF9psNUUsEcn2lBNULzSo50K8oHcH0ossTMcYqb6rzLjFUNlWsBYPx5wZLC7XVsq5DcxGPyrM7TVHsb6SF8qMnIPb1r9RcQ6KbqB15TnG1fn3j3hCexuzdpEQQcnA6imceajxckcqDXNqrLOY50uIX+0d/c9/x9O9F7OYWlwkjMWtpfKwJzyH0/T2pY0pzNacjeYgbA+1MenT297C0CY52GOSU8uT8exzWg7YtZ7NFM2lXs+jXIkh5fqxPMpIzyGjd81qxFxbR80co5iWO+T1A+dKtpcqtsIXikE8HlaOTqfw6j8qMWV1DPZtF5kIHNy83MUPf/467UjONWjvYJGUhmp3QXID7e1A7Z3lmYE5GdqLalE0av4bKwOM4AOPTB9D60Ms1AmDYxk4+dI86KzyOIpMVrb5g6VRvEED5o1YgNEBQvX05VPwq7TZSw7UumX6DbIr2pPzPzL8qWNOu3E5QnvTOsZmjU4qHjaZZbFe0OJgAzim7S5VW6t0J6yJj/zCgFhyRwjm2IFRprAh1izXmwDPGB/5xS1HmvOAIsLiLhtnjJ5T0o9wE0lpcvbvkFW2pv0rSUuLdW5c5FVY9EFhfPOoxvRSPdaYMVEOCPaoeeyJ9qSbDSo7jUHlkAPpTHqeqqlkwJ7UradrCCdjzDY1eXbCAiuIHaIa5ZpBbMVAG1ZvcyPLOyKMjOKceJuI0NuYk6nvSlaFSOc4y3Tek2QGko9wJ0q18f2dp81wGAwp+W1ZVcvzkBgSX3Yetabx2wj0pYYicSkKSdvjWYyHx74kbIp5c+wrVwouDSrxigudQ/cGJD90fga6iJuLmCJRnofjUeqHxJXx0zkfhRHg6I3WpQgLzEEAU851NJV2tt4C2jgrSvqVpG7f3jjJ9vatC0+AEDcmgWi2TGKJQvQCm6ytTEMttWJRc610AIaKUyWeRUhtiAMCphMkY8xANcm+hhieSR1CIpZmJ2AAyaPoaVBZOl9iiA+1tivst1HAhZ2VVG+ScUv2fGNhrukyajpjvJEjMhDLykEe386znirUdX4j/s8UjrFsCqnAqWu3SiRhZpw2nbX/AKS9C0xmj8ZbmT+GM5x86RNV4mHE8biLSXkhP8KHI+Br7w1wHpsTeLqRE7Zzyk4QfH1rQLbVNG0y2FvE9nGq7BFYDFEMrPAtBEUruzS/NVzENL1Ke3EbopPMquMH3FRST+BIJ1OUYjmx/Jv6GtI+leyttQ5b22RRIvRlrM4TzKwK5U/d9u6/HuKbgmD2pCeExupNOj37Xf7yFueVdzG+5I9vUUwx2N2kyXMNsRFIvNIRhnI9RjsKz2ylfTblOR+dD54pBtzfoexFPNtfDUrGMR5UDzKV2KN3+B9RXpW2FaJ/yic3CV08Ej2kMmARzfw4PXGd6Dahot5p7qZIjsSWI9ad/o6jfUJ2t3y08K5CEkhh/wBfnThxFoFtcaVJKVHMNvesWW2uQsiIXYWZaO3OgzQ/iMgK1XI3WymkTmBwSKBcT3wMeQaux1mlnhm0E0rz3x+NaDp1sGgG3as70Rs3YrUdGUNACfSjSaKvMqN7N9WjI6UpzaiZNasfN/8Acxf61pi4jmEatSBFMZtcsyOguYv9YqzWjtVjX6v4SIa0QN6VNrEIYkJig2g6ksEYQnBFG4ybw5HerOjIFFb+R9OlgbbwkTiGGbw2RAaRgJbeVhzGtk1zTo44HYjfFZLrRWG4lx2qnH5WbI3SC6lckgktmq2m3oLcpIwDVS+uBLzAOBjqO9Q2kLghlBBJ6nvVT+EmGlfOOL9WWCPnyqhnJ/kKQogAwPMp329aOcV3fNcMrHPIMUvxkooJ64zWhCKYE3VUF9uH59/X8xTT9G9qraqX3wmMUpk86Y752p3+j11gjecjZcsffFenNMpGxxcllbHe8X2/C9pAiqJruYcwT+FfU0t6hx1xlqpZrC2nhi/jSP8ALNXuEtHjw2s6uRLeTnnAfcRr2AHwoxqXGWm2YMQILL13AC/E9BSbZA32sFlaLonP97zQSVbXfFlxcB72a5ODsXk6fKnjh26uVRobtueNlxhjkHPaku747tLiYiN7NxnHKspDfzGKIaZrDSyrJDzch6g0OYSHZCvBwH2m1o9jpVrBpxt7G1SCEZblQYGaUdVeOzlkQKEVNzgda0bhxludOHl3IpM4r0KWaS5jjIR5QQjkZCH1oYZdE+UwZCbWY61xRqMQ8a2izH4nhh3GY4zjOPdsb1SsNT1vV49RLa1bxrbReIMxgpJvjlG2cntTXPpMMemjR7uR3tg3NymPA5vXPXPvXWjaBpdvKRb2hlYnIREOPxNPNlYxtUs90MkjrtKOiLrF/C0N1bFYicgf7dqD6/okmkXZlRT4Um+P4TX6E0fhlpl8SSJVLfdUbCl7j7gcyWjvEnmAzjFCbNTuQGkV2PbeJNlYbGY5kYqA0bbyR91P8QrqKe/0SRbiFpJbf7xDdB79xXFzaSabqBCFo36gevt8aK6NrVjBNy3cDrzbNy7A/LpWiHBwWXxo0U8/R/xUYtUtL2NgY84ZyPMoPUGtT4o1eBLJjsqsOYkd9qxiBNMS4U6Y4SzCc5CQMJWfuCi7P8SQBRO+1DWbvSkm8KWSIDkKspBVR7d8etZ2TFu0d3ubaWr3UxNf3CxSc2GJAxufXFBdTuHuQB2q41sFnZowyuGIbPc561GbUMOlBbxDrCz62q2jKUuAa0jTrjltgB6UlafZ8si7U12mY4uXvivTHyrvaCNobrvPcsYxnJr2gcHpJd27upLCVWz/AOIUQNrmYOwzvTpw5BCzRdMhhQfVNUENrQDShguJvrihSeUHen3Sr9I4gSQKRrKSNpCRgk1Zvp7yNAsQIX1FbbntkoL6rl+jmBsZNJl4g1RJIWCnOayLiB8zSmnFZZJYsylvnSlxGiAs3Y7UrOziuT+ufTmwUWdJZ02zNxcsSMgjBFM13o6WenGULhjQrQHUT74ADUf4t1CFdIWJiV8hBI98n8h/Os+yXALm422sS16f+3yYO+aHyHt3J71JdyrLeM5O5Y4GN6qs/O4xv2HvW00UAFZx2u0YYO/frWhfRrAs8I5hlS2CPWs6c+EnL3rUvohhEltKP4ZR/MUHK/27TOJ/uAJp4r1d9J0+RkyDjCn0rOktzxBps8811IZ45AYrQ5Bde7Z7sa3C74btb7DNAJD6NvQkcJ3FoxWDT43z94nApSCQRi62tDIjdKe9JP4X0O7gNxcXlpatFNbmFVnUN1OQSo9BR/hrh9bQym28TwpGHMCfKN/ujtTPpvCN1dMv1zlCDfw0GF+frTNJpENlAiooAG5q0kxcFEWO1hV/hFzGDAcY60V1bSo7h+YqM4yKD8P4N1zZ2BptdlngIH2gNqrG3kyleQlr7CU5dAtpj54sGrFnw3ApGBtXtZa+sbY3qDmjj3dfb1r5pfEUN2gKthu4qvNoNORgxxFtTBa2cduvKoGKp6xpyz27ZAYV0uoq3Q1294JIyCdqu57SKQuDweS/LP0zaP8AsrU0liHKGLEfhn+lZymqu2A/mB6HO/wrdfp+0z61p9vOmxEvKT7GsCuoFtpfCJyuKZxXWwBZuYCHkpq4b1mJJPCmaeIZBWVNyn/h/StLt72ylYyadqN1IrgSMkobMbd2Gd8e1YbbFgwZGIkXp71pHBWpSXl1awymUoVYeYfZOOoPepyW21Vx3WaVnUVRr/mt0jfxSR4UeQVbG4wf5dqrRxx7c3iAd9gaPasjePL46AkDlPlBbkP3gep+PyoRc8rNKY2RwuTlNgwHcCs49pdzaK+wvEJQI1IA9TkmjNvMMClq1V2fmo1E5CYPWpl+1RJ1aLMw5ObtXWg6y0WqQxcxwZFH86GyTssNDbK88PV7bfczJ/qFJQNNm0uTaauHNQM+oCNjsTtWrWmkpc2oYqDtWV8PaPL9aSVQdjmtm0c+HZrzbbVtU3jYXY57wIWyRlJ2v2Yso2Kris11uUzu3oK1TjCZTE+DWUXp5i47HrQ3uJFLDyMySVoY86QW0uTDcjlOANyTUHGWrSPbKhbYjYA9sVZdTHMVUkBlwWHf2pU4nmZiVLfZGP6n+lChZbtpWIUCUpTuTKcbk7VPHF4IVjjmPQCuEMcb8xUu/b+EfrXnmyxZiST2FaiovSwM05RtgP51pv0T3P1e5uYDsWVHH5Uk6LAuqShm5QwHK3MMkEdx8RTJw7L+zNchkBxGx8P5Hp/MUtM62lnlN47OLhJ4X6L0zom2SaaLezjkiDOo3pR0K6SSGN8/aUEUyxXvkxms6J4Ha2XsvpWZYY4QWAAApfvb1b3UIrUMFQnJNXdSvj4DYbO1K1krzzPOWIPN5T6VL5QTQUtioWUde6i0eY4YYY7EnrUs/E/LA7qzeVc4XqfakHV9Clur9ry5JnkGyMSfKPb0qWz+vBli87D4bmhlzj0rgNHaabDXtY1qKS3ubIW0DqRvJznHvt1oNqdvPpE/1i2yAPtL2NH9P1GzsUCXM8aN3Gcn+VR67rOhC2eSW9hVQNy21XLCQqguaetKtpfESXka+bDDqPQ0YXUSVwDnNZ7pF5Z6nqSPp0geLn5S69GH+1O8UDIvKRmgOtppE5BwS99JWmftPhefI3VlYH03r80cRadNZSxlwN3ddmycg+nbrX6h+kSVoOC9UKNyOtszK38JG4Nfm/iW6kltdOs7pw97GC056nmJ7noT06bYp7DLuQpZGeBR+Uvwg8wx1IyPlWh/Ry7teqq5YK4flHXHqKRoIMqhG5U7imTh6SS0nU4I5jjPwp+dttKSxjTls11p8UsF0ztCbVF/fyTHAhBOQynqp9B0JNJmsJYyuuIxzc5BdF8N2X7rH7p/Wj9u1xLFBeQyurleUhW2x6H1+BrqfT7RgCDDFJIvOFCDkz//AJ/Ks8OGgiZHdJds9PVuXwmUqTjz+Ur8e3z6VJKBHIR2BxVzwJVkaNuYHG4zsfw2NDNSl8EE9MVZ7QRSXl+1RXlxyDAO1BbWR5NbtCM48eP/AFCuLrUDK+AaJ6JZeLfWj4/xk/1ChtYGC0oFufCumI8Kty9qYbl/q0WBsKpcLry2ygelEb+2MykUVt8VpCZxaGk6Wd8U3zTM0abmlS10p7mXMg2Jp21fTRHK7EdaH28SxJtgU1BDz7Wl9M+lnJfbukv3+gjJwnRc7VkPEA/tE5wftMfhvj+lb9c3aSEpyjIG59awjiMee7ZnBbnAGO/XeiyQhjgQtH619Ojx2gs/KVCuAxPXoPauADgt3FWXiKkA+mTXHLhCNhnJq4XJFWtCvPqGq25ZsI5Ctnpv0P409voUlyJ5rRmBiw/Iw3z1xWZTDLfKte4BuZ9R4bN4OVjbOkM5Y7ncAEepwRSmUONPCbw3B1xlaHwdqn1jR4ZM7gb0zR6kDjekrQoV0zVbvTQ45dpkHoG6/wA80wG3YN12NZMlXYXQQHVFX7/Ux4DDOewqpZzeBHzSMFA65Nek055YCybshDY9aQOMtP4uu5H/AGbLGtsOqD7VWibyNKsr6TfqHGFkuYoCHPdz0+Qqpa6jq98jG0t7qdGOCyJhfxoXwslvp8cbz2EL3IKnmlcsAcbjHp1p9t+KZYLJ7WN7WGM5x4abrnfbNNBlJhjJOIMbP5lUP+weoqFl1W9iso3RiFRstzDt6UC4m4ItdeitrK2SQI/htJI2eYkdQPY9aYLviCW7lVmkkuZhspc5x8B2o9oNq0afWLohpmGw/hFXtrfKieNzWcpnWfjwlux4bh4elt47aNUijAXAFNNu4dd8VNd2onHNy7VRyISd+lJSA3ZSjCCKSp9L87DgrUoYt5JoxCg9SxAr866zp+oWqWM1zG/hx26RBsbLy52/3rcPpB1H6/qFhpiklfFEkgAJ77DYH3PyobxlaWeq8OwQWljIht4V8WSKFmMgYFlbLYAyOg9KLBkek4Cu0jlQepZWPLjlYDbG+R+NMfDssl1C8Yy6KeeRfQj71AI4WGUYYblwR7jO1XeHb+TTrtJF7gEg9COhFbMmxpZcWnbWtcPSwtYY5WyuNlG7D3H/AF0q1efVZFkVmOUOFkiP2vfB6iqXD09pcoRbuInkTyq4yFPse49jRGVI2KiUL4i9WUlGJ9PSshwo2nJ22AUJSa3YskTyzZHmBUKVb1/+KBa9cRrGyFBv94faHwq7qcYtJRNDlQzHAyPKfiKX9eu0lHNlhJnzDGx9/jRgbSkn2oGWVbjyluXO3N1p44UUPcW2f+Kn+oUhbl+am3hO+5Ly2BP+Kg/9wqJR7Uo5fojhcrHaqWPajbPHJtmke11T6pABzY5RUml8Si6lYc2wOKp64aeKa5AGlY4lCRoxpOupisZ5aN8UahzQlhuKUrjUFkj5R1pyPK4NoLocL6y3HiLPKiFyzTbsME4x71lfEsAj1CYHlCMQV+AY1orv4ZaTOT1IpH4yh3gnU7cvI345H9apHK4milcnOfLHxelKVf3jk9OlU5zui+29EZ1wze7E0OlwZTnp2NPDQWI7tREcxJ9Nq1v6ItQWbhrV9KSa3gmRjMPEAJk5gOXAPoyAbetZKi8rnfrTj9G2iajca1HqqRGOygSZGnaMMuTGwAAPU5I37Gls5gdCeRryjYji2UUFaj45voeMNP1i+ZIoLuAK0ak/u0LEAn5jPwrd9PuEvLZTkZI2NflPWl1M6pKdYE31s4D+KNzgYHtjHpWp/Rhx5z20ekXsv9phGImY/wB6g6fMUpk43sDmeFo4WUfULJPK2W3nNu2GO1dhIndmwOVvShUV2tygbNELOQN5c4NINNFakg0q97otlOSzxdfvLsaFvoMaP+7MpHuaa44FkGc/KrcOnwyYBUUYBx6KhkzmigUv6TpWGXw083cgZNNdtZSQxgEHJqxBDFbABcAVZe4iCgZFEEbRsnaC+Rziq9woiiJPYUpa9qcVjbyTSMFVQSTRXiHW47aEgsATsKy/iXUZdVVgCRCvb+KhPPI0ob7RayvXvpM4jTWL9LS7FvEZyyKEBZRttn5Cg0vGnEl5vLq1yqhcEI3KGGSRn1xnA9BVbiCMJrV10+1/SqgA5MDuM1rxwx8QeIWDJLJyIsorZXJxC7tzMc8xJ6nNSrmOV+QjMb7D2NDrf+6X/KaIksJI5wAQw5W+I/UUU/CqFoHCbyyhJ4SPDTaRf4T6n2p6upo5UEt0IYCw5A0ecDbY471l/BmqT6XfJPbTciNsQwyGHoa1wR2+v2Y8FYbeYDmXlGV/DsPyrOnj2tBnvZST9TjiWCF1ib94nMWk3Rm9VA/rSXq6El/8pAPxrU5+FL17B1lmhitElLrh+bxBjcon2mPX0FIOsQ2t3MIrGKQJzdXfmeQ+uBsPgKhuklM3i2ksCMntRLSGeC/tjuB4qf6hV8aHcRIJJIWRD0LYGfl1r7BbhL232/xU/wBQrzn6StrVNWkMUDEHtQnh+65ZnycDNFdUXxbYn2pe0tWWU49axDLynAVXm3ghM+tustnjPWkq5n5JgiHBz1pg1i6Mdrue1KCXAlu9hv6k5x8K1yaApEdYdaKTW7eAWzzKwxS7xXao1nIgUA8y4J7ADenGOJTZczH7QPLjsRSZxXOGV48k7ZOO5NXY4l4CeebopGuz5GfGM+VRVCSHIz7/AJ0QuBhkRvXp6e1fZIRyn5HNazekq4IWbZpZEVDhzhR756V+r+C/2Dw9wrHpl5DbzGG1EZaGQMpwoLYOxGSc771+W7TUJ9L1K2vbVwlxbyLNExGQrocgkd6cLv6eeNbkSLcS2EvO5c/2VRuVKnGP+bPxApDOgkloM6CYxZWR3zU/0vaYhDXkbR80D8p/eKQFzy4GOpzWYRyyRsssTskiHmVlOCDThrf0qcRcQafc6feR6asNyGDmK0VWwWDHB+IpSiTFEw4nxx8H+FTKkbI/kxbjwdxJPPptrNcnm541JcevvTnDqakB0cVl/wBHMom0VYjvyMy4+dNLwTQNmFiB6dqy5W08hb2PJyjBKe7DWkbbIyKMw6pGRkMAazCK5nBzghh3BxV1NUugMYJoZJHRTDQ3ytBudWjTzGTb40MvuKo4EwjZPoNyaUWmurogMxAqeKw5d2yW96ry/K8aHQUd5dXGr3HiSkhB0Wqup23LbMANgPxo3a2Y5c4wKr6pCWjK4xgVYHaXcNFfnviuIx6zc7dcflQpG5RGe3Q0f40Tl1mTFLqYK8p6Z/Ct+LbAucl08q5EwQFT0q9B+9UwnHN1U+/+9DYH35WGD0B/pVmNvDYKTj0PpUuC81yL6Rcx290plYoCdmyRyn39RWu8O6pbzQrFHdsXICyRYByexB7isejbxMzIMyr/AHiDqfcUzaHeOjxSwK5cDnCgdQOu3fHtSsovadgdWlqFpxKllPLDOjFwrRLIuOaMH2IpWma5F3MtuPDjTALLyhsHp5h1B9qvT3FpfeHeO06yTrnHICMjb7VQW8ctvcP4oUpMPKmO1LE+FTKFtsqt9TBXJG/rUCWqi8tsj/GT/UKLTEi38Tk8gPKG9/Q0H+sc+o2yg9Zox/7hVCNLIs2n4Si4sx3yKF28YhlYe+al0efxbVRnO1c3X7tmascUJvyjkbBQriC958RKMsemKCwoI5Av+K528ucfKvmpTST34UAgdc47etWbKQK4iixzZ3OM1rg62rNPI7RYTi1tCznIAwc96QNeuhMXK5UM3WmjV7triQWMBUv95gOp7n4Ck3iWRIZ1tk3EaYwOpJo8IFp3pqATvzZbOMDP9BUksoNpGe/Sq90CgCnALdfb2qGSY/VuUEkA7VoWgkKvI+Yg3cMfwNejwUYkZ5fyqMtsyeo/nXoJP3bAn7W1TaGvSYjfHp0NfC4TJ7EZFcTvzYHfpU9tp81yVBjfwwMsQK8TWyoAvQT79GMjG3k/hMpH8hWrxWweMcy5261nf0eaaLWLwiMb5NanYpiIKdyNt6w8p1vJC6DDbUYBQ6TTwpBC18+r49PnR14VYdMVD4Sg9KT5J4KjBCNvX2q+lvkbjHt3NSIiDB71PGCxGFyagFQ5ejgAQ9tqGalH+6bHYdaO+EeTzHt0FCNTAETj2orO0F6/PnHcYTWpQP4Q386VgoExX19aauORnWHl+7nlz7UsPGzMcDJG4IroYPsC5yce8r7hvu/aHUHvUjOWTBU1yik4DDJHcdqIwQLMuH2PZh0PxoyEFHp12ququxTH2XPanfRreVxHGzQch/eqc9T6g+h7ikqfTpIwWQZGNmG4+dH+G3uY7ZHiYIU51II5lGBzdKWmCbgO6T3pF3HLayJDI6XEfTIB8ufU9PSrlw3NbwyFfEmT924ikDAA/ZJI752xQfhu4jubmKWO2kikkyHx5o9+6nrn2NMd3p0NgHSXy27oBHMgyobrsR1+HWkXikWfbaKXdQuTDLNGpI5BjLdSaH2BeTVbL3uIv9Yolq0DRtJiYXlsxCrOYioY9fLnfautLtPEv7S4yORZ4yxY4wQw2Hr8KhZpYj/DTEwrn0qfWXYIwRSSdgB1qpw4SsYB7VNrUjJGzDAbse496xSP/IUnYSYwmupuZGJOcDft+lFnC2MH7soZTsCpyF23OfYVa0TQpL2UhvCXu0kr8qID3Y+/40ef6LdXudRjgmnsoLZU2fxubxQT2AGenrWzHE54sDScxcV5HPiaSkFXTNNFw7B55xkMfT0FI96zySS3Uy8vM3lz1I7VvV99G8AQxNqCGRI+VOWEcqen2jWW67wJc2l6yXd80gVTjw0CnPrv2p6CAg7C0Y/p2RMaY3+izW6LSSszHCjqfT4VBLKBE2OmRWgz/R1b3GnrcQvLNLuH5mw0Z9QOn61V076M0liDTzzPg/w8oornBospbI+nzRfcFnp5ywCglic7UTstAurmPncGNM59yfQVpNj9GsEcgZJX+WKa9L4Eht2Ehy79jJvj4Cl35QHSCzEJ25ZZp3CpicNPAzMdwcZo5+wharGXRB4jqgBJGN+3rWnpw5DGMleY+tDtb0hBbIzlE8N1O+3Nv0FJvmLjtONgDRpUNAsPq04IXrTtbReUEdaG2Om+EUHU4yD6ijUURRRilJTadi0FMke2MV0LeIndRXUZxUye+9Lo6iFtEDsCanjjC9FwK7VVO9druMb1K8SoZcBd+tL+tN+6ZV6gUavmK7ZNAtVPJbsxGTjp60aMbQJDpYbxpbkSNtkkk0ogFW5SSMnH+1P/ABTbNKzEKSScUi3ShWwBnJJzXQY/2rn8ge5fEXkc4zj7ymiEPl5XQHH3lFUUbmGeYAgbNjP4+1EbKVWHJIojkG4I3BHqPajgbQgVejRjh43IQ9SO3vR7hqFOS4huY4cjLZ6A7dTj270EgmFnJkjmiemvhixt75JQbsRSRgeGSMh1O2PiPyoE49qaxhbwFZ4Tg+r6svgXxjePziNyCD7q3Rh8d6eprmWWKaO5trO9YHmV5tzGT/y7UE4S+jriC31sfVLOK9ERwpt5F8v+UhqcrrhPWBNIP2fNYXKjLYiPlHy/OkpO/wAJ10Z4V5StPHG+nPFc2vM5YNGwbkRR3GPyO1AEuoYJOQR4JdSu+Qu/X40d1q2n09JmfxIzsGEjczuf09jQFbdZp47iRSsXMC5QdN+w9M/hQ9dBZErnWmTSYFiIAYEeuKP2fCdxxLICq+FbKwVpeUZPsPU/yFDuE9ObWtWS35jHAi+JM/8ACg/qegp7v9agtY/qNtbKyLhIlViAvw9SanD+n+vLzd0FsfTvpzsl2hoKvHwbFEYVsoHuo7d+dYY1/dhsdWb77UP1W+u7ImK8vZISpMmIACzHGyk9hU9gmuXsVwbS7FuiEo6+Nygn0wKBXUd1o2oJ+07ZgyEO8b7kiuka1jTwHjwu4xIByMZcDxGgO/8ACFtrUkjI1ushuCTkDJOf61xdEalB4krq9xjDEjBHtj0qaLWbtdae7t7PxDIqkB1+2U+9gfkPSh15cNLdyzpH4ZZ2fkH3cnpUduoilrBnqO22qHd/9L2mPd6ZcJeJExt48hgcM3TfY7bZ2q9w0YJ9UltpSzRXJzF4gwcgenbbsKs6lHEdHNzbXERGBGwk7kjqFG+Qe9K+hxX91eQmzYvPbHmQc3QA5wPj/WknMD2vvSyHwDJbLzFeL/TYWgXPDCxvzw5U+3SvCyu4l5Wj5sdCKZNOuI761jl7OoNEEt0YfZG1YhaVxp9po9pCkmliOJI2HyqjqF0jWzM7coXfm6GtHm0qGYHKD8KDanwvDLbyfu16HtVS1TyBQi2EAReRw8RAZH78p3FXlRSCoZciq1rorR2MEmGOFGRn161cXSmjwV5uXuM0EjwURpXAhNWIojkZB+NSx2WVDITirMKMp5SOnpQjHtF5aVcQ4GK6EYG1XxEpG+9csi59AKt6ajmgd7G0kuANh1odqloPA5cbtR+eJsFlXr3NB7uC6nBwqqgBPM+wo0baQnklY3xraSQviOQKxY5AO4GP65rOLj7eT1O1a7xlpxgtWuLpua6Y5CDqFz0A9N85rI7rMczBh0kxWxi3x2snLjLSCVEU84C5zk9K5gu3gf7Ktg5x2qXmOSgP3f8A5qBEXmDEgY2GPvU0kkfsDHfxGPxQvMR5WG4PtTpwDpMja1b2LXMOZnCBs7D4j+lIGjeaZCoyCeRs+h9aeuH7m4h1XTrueBj5wyS9PEUHG/rj161SQWEeE05fqHg2yggs5TdyJbvAok8GHYKASObPU7j5U2afri30kjGGRHU8jbeXHbf+lZDHq1xNNb3kNx5Hdi6AY8rY5l9xkCm7RdfuLiG7LMRGkhWJFG47fiTS4B8J2SLmU9iCwumd5ra3c9MyRKSfbcUq8WfRnw3rtpc3n1drG6jQymS1woYouR5cYI27YqQazBpEL3TMlugk5JDuTzemD3PWoTxQ0mm3HnCwSxS8kshGWBU9B8aP6ILbIXj9PlLS5vSzjRLZNF0Hw3ZYbidPEnJPmydlUfAHPxNV72S61aXxobdykaCNfDTZQo7n1xuTXteu2njin5YwruyjDec4xuw7ddqiHE/h6NHYR2qrLHzqJeY7h/tHH8XanmNMcYDAvoOHiHHib6LbPX6fKXFvrzSrlbu0mJVHDtGW8r49R3rteJbjUQEvpmnBYuWfdifUmrsXC9/dLHIiACVsKjHBxjIb4HoDXWmaT+1IhoscMcconLmQp+8jIGCAfluPYVeWWMe7ulsyT4o/1BRI7PkD5UWva1bubWXSreSz+rAEHxOY82MEj0B9KtcN3FrPa6i06xSSyIOZncZ5SCWAHcnb4YoLqek3emXRtLiNwDkJIVIEgzjPt7jtQYJLGz23K3ixsV5QN9qG5jJGU0/8qn8LDLBwidr5782p7O4Mq3cGchdwSMEjtXoEjtzFd8wMZOHAOCpHaotIDSXczs/Mpg3z23q3pmhy6sty8MiK0A5uRur9en4Vd9AW46RslreHN5oDv/lPXBOtw3TT2kUTxRx4eIO3N5T1Gfjv86dkbGDnasqtdYn0AxWU8eXtT0TG+d8H2wf+sVp2m3Ed7axzRNzxyKGU+oNYmVFxdyHRXB/WcMxSes0e13Xn932ryPk4rqQB4yPWoMlTmuhICCKTtY1KjZRqYDFgeUkYIHT4Cp4okKYBzjbeq9tiO9mQBsN5ugxVgnwZs+bD42AzvQq1auD4X0RGNiyjPqvrXDxhjzLtmrS71GQdygye/oanhfSsHKHlYdcVwqMx9vU18urhLaPxZZAgXfDHr7VSvtZeTmitl5G2yT9rB/kvz39qMzHc5MRwPf0FauLi2ghLXDhW326n5Cl3X57/AFOzVbLw4Ud+UvzZdFUZJYds7bVesrCSd3umVWjcnzuDlfcA9fgelRamEu//AKdYxcsXLmVl2yfUnuaO5jWDj5RSxrDTdn5+Fm3ENvElhKsSPJI+fEuH3Zz+lY1rVubeRkPUENmv0bxFpsMNkIyG5gcY9axTjvSms5w8g5Wfqg6haNC7ays4cxaUUUvIGH8J2qMgMQep6bdKkYtHyRjoBv8A5qmgRSSQMqeopq1k0u9Pmmt7qOSLlUluQh/st6g+1bnwfpCJpkdw1mbmzmJ57SRvPbuOrxt6DOfcVmei6PaagpHigCXCvC3UHsw/WmuDXb7g2JLPJ+qr/csowobHcdm/kRQZCT9qZiaB93S1aDTxpkcak5ZCGJPRl9fhXMFzcrbqImEhmlPNHnGQfUdevp6ChGncTWfEGgJb3kkkNxgeDMm+D/Ve1ENIhUairt/gweSQdBgevb1HftVonXpbP09oLi8+P+04pqL2yRRs3iDxFjm5gHbGMBm98439M11ewW50u/f6layPFHIYz9kgYP5dsdaWrDWFvdQjtII3jgdTC5jHJI2RsxPbft2o3qNpLd6fAlsUfzcisWKkAqRk+o7H4Uw5vEAFaMsBiFP0Tv8Af76SK80cdvdq+frDosaKR038x9th/OhK3E9m5dTys6FCSucqwwevtRCO5S51RZb9wySuDKx2G/rU3Ed9Bq0yiGMIIwQH/i3/ACGwFOXxcGkdrtWEteI3NsO2T4CparxFd38Fta2viwCOMRkK5JkOAPwwBgUFh1G90q/kW5d/34xI6tliCeoPr60zcIXEFtqcaSLGJOYukm3MMKcqM7b9ie9Cda1WG+kvmNjCPrRyHAw0W+2KC8CzGG6V2NaHnHZH7a7/AFKm4k4ts9RS0tEjlWRAPFd2yH8vKMe2Pn60DtZri31hbuDLvGBLzEZGAMEn296HvYy3JhRcGRXCqxOAVJxufY0Y1m31Dge8jKXfOCB54iQJIyfMp+YxigjjEPTb2b0oMcWNGYI+yDQPn5UvCmjS6pqGrrJJHAkRLPMg5o1AyxCkde2K81rf6HePFIHt5RkZHRh7HuKZOBdSs72K7ijWeK4u7uSePlYBSCQAFXpzYBG+1TcaaxZQWcdjdXETyxSczOo2BGQeXucnJPagsypPV4OGkjj503r/AMO9ttPj+6VLWVYbyKeaFbpVbmaOQnD/ABNOnBnEaxXrWV5IQty3PGXXlCse3pg/n8aR4bu3ug7wpKY0+05XAo3Bd/8AaC/sILu5jjSJBCrBeUqo/M01PG2Qfj+iY+pYjJ4yHjVd/FbFBa28e2w+NQlMbUscLcZxM37O1KYc6HkjuD0bsAx7H0Pem9xzYwM59Kw5YXMdxK+e5OJLiyenIP8A2hZAS9U43YYzmrbReOvJgknpjtXp7TB8WR+QJ6HH4mq11r1vAhWzUSvuB1wW/hHcn2r0MDnEgqrIHykcApnD2cKPcOjKv28HGap3GvpgJbkIrqWV3X7WOvKPX47UH1O/8Z+a68d3OPDjXBfm7AD7I3+PSuLvSnvYoI5bmO3YOBJGG8uSMkMepI98CnW47WfctOPCYyjMe1FdXMU8knhO08j9RzZwR6t29wv40U060hBt7u4n8VmXyLy8qLn/AC+vud6s6Jw5aaeqyPlpSuSr7AfL8KJm3FxceIYwCBgMfT0xXpJWjTVGRlR/ZHdfKhuFMoC8/Ih6nGc1SiiKQsRhXY5baisyBOZdtwFUex61G8QMLswPhpjmwP5UtW7KzueqSzqtkEtpLqRQFj86g75YVj30oWMiQSSzIBcygSPj7g7KPhW53Vv4zSX5yba3Xyp2duxx7VkvF9nLqM13LP51QMCB37gfHtR49Aa7QZRY4rFFSO4XAOGG4FTRxNFIinYkbN71UvEeKV3ClfMRt2ohpl/A8fJOocdwdse4PamRpYpFlXdNuJ7e7XwysZyPtHbPp8DTpJqltrGmNb6gjQMo5XIXOPiPT8qVpdOKWxvYl8e0yAQPM8Q/zDuvvXZvJbVUJmEkDfdJyVHqO9QQCiNJaiGmS6pos/hWsqXVm+6Ojhl+YO4p54W4ydJUi1G35ArjJD/9fzrJrzmiuiBtDLuc/Z5vUUa0a4W7tzEZW8WLzRu3VQO3woTmeQmsWZzXU0r9I6ZNaKto3PCwfMgMaZwSdjkdPia61OOLSLaa6WIPA5zLE8hdB1yeUb9CenSs44I4jngu/wBm3JRC/kKuTyhyPKcjsw/nWm6pqAstHF7Ky4ijYqCMjPKQMDqd8detXjcSRa3opC4WN32P7JB4kFijW8VkVZliCyFemf19ao3OmiLTbS5MwZrjmJQNugB2296uzacbu3ur793aKsm0b5wAQSAPwxVrQbm1v0TT75JWgijLckRCtKwyVJPXvjFOukLWAjddrtxMYoWllnj389JYdbiEEqonUdVPWrt/a2T6St5bXLSsQgZeTHhsc5VvTpt61bm0+b6/PBZxmcQoZD4Z5uVMZJz3xXNomnSaXcsJpIbpImaRXYeHcHPkXl659/WomeaDmpp89hr2nyOvz8r5pdpot5qVpBpzyyO2CxlxseXzZHTr+NJfG19c881vc3Jma2JjU/xL2Px2wan8RoJfrNtzqyZEkYOCB0JFDtfnt9QubUwxCFS4hZCdyOoJ9+tLuZwfy70l8jGMZLrJ1W+x+7VpNUnsre2gtGInwApU4IOOvtRC3thb6rHdXbftMMiyOzjZsjtn0qno2m3ovUuuVSk+UUDDZTODn0pwi0Mm7t7KN0ClVRWJzgdd/kelQxzXHfSJ60d046oopoa6Sul3ly6LHGxbMOQOXKgFQO5bt6YzSnNY3Vu0fNbzIJd4+ZT5x7etMtpw7eahfNp9nFzmJiHc7KgzjJ9Ph1rStO0620ixtFu3+t3NshSKQplwPRR2HvV42NgstN2smbPjwCSw8y7xfQrSUeD+DNRksSNSUWlu8ni8mB4rjlxhs9F77701C5s9Kt/qtiBIIFwOaQlV+LHqfhUWpXtxfoyRjkTsAchvbbdz7Db3qhfQTWVtNevII08PJY/3vsg7L8F3qpbyNuWHK5+U/lMezoDq11f3ssls09y5UoOdY2ADE5+6vYf5iM1V5bG3gnn5pCS+XYnAJIBzjqxI6n8qLW5tk0lBcrEEeMNJIGIJB+9tud9t6D3kE9zdWsdjFNcuAYjJIo8QY6Fj0HcfKhtPvoL0RBcWdAE/ovuiRwmR50VpriQlgJkKkRg4Kp6kd6ZbfQ1EUksrEzPnAIAC56bdzXzSNFXTY+dj4lwcktuQh7hR2/rRI88n2Ty4GQfeonlF+1Z2ZlcpCWHXz+/Cq21mYoBbmRpDsOd9yfnUs3Jb5Pdu1drIBHgkgDO3ofSo1jaZueQnkHQHvS3CzZShcXG3KNUDMjORhtyxHSqF6sl3P4MUpiQDzMDjlX+pNXXuDM/1OIDxPQdAPU13Z2SK3PgukbbMerv3b5dBRBGXOo9K98NntU9REUFgbeMciouOUjpWWazbhNN1K5z/AHgLFfTGw/GtR18n6vMU2KqTmkTi61FpwpcqAfHaNeYemRmmi0DaCTq1+d9fsRBIsI8xMPMWHTmzk0ATKNy4yvUevwp71+0aXxJVAUJCuw6DNJ1xbGHwxgAsxGc9CK8AsydvEotoGu3uizi4t5C6Abp1yPh3pinOn8QqbiyENvcuuWhKgI/w9PlSjbxtExZM7bsPzxV6GI48eFwgJGQp+y3Zh8a9xQmvPRU9ytxaRqk8bAJ5GVh9n0Py/KvRTpa3cWE5GYZJX7LDp8jRjT7lNVt5dP1Ass6jySDt6fEe1C72ykicQuv7xCAMdCPaqFFBo2E2abcFrWK6mBItv3UzD7TwE7MPddiPhWn6Vql5qfDcsayrNIviLOoUElUUg49ASQ3zrJOEp/Cke2n5mWVSu++D0x8DTVwdrFzpE2qWtu8zNc2WVZx5sDKOPmMb1Qv4kFb8MhHF7R939Vp7i08C3nvYGFtZRAl1wRK3PnkKdTnI/A0j6vc28mpy3FhD9Wi5uZFHY+uO2fSvV6rYhJ2V2v0eMHk8/p+PBXN1ercBLmBWhuuYhzGeVQuABj365oX4SGVDIDycw5uXrjO+PlXq9WgzWltQtDQWhTX8FrpmrXOoWFu82nh3ijMm+zLgZ9etZ7raizuIRK55A486jqter1Jym9LOzCf4ZxPYFfy/+prTiKMos0ECW0pCkJCMKuBimjgiy1fifWkuLcrZ2luVLyFeYADoBnqfyr1eqoAjYeIS+a7+HwnSRgWBX81qbXFpoUQsrKLmkZuZz9psn7zfxMfT8qgt0NzNLFzyySTgtzyKBnl659B6L6ivV6pGm2uTrjDz8kX/AHUtrbra3sYkuPGml5kMmByooGT7fIbULvbyC51A29zEJ1cGOLwgAjDOSd/sknv7bV6vVcGzaPjt5u5O74/5/wALqz0kuZbGyeNM4k5JMyeGP+f09hTJZWcdihj8TmZgCz8uMkew6AdhXq9S8pSOdM5x4nyAVZeTBLNgA1XWZVbDElACRj8q9XqqGgt2kWjS5SPx5i3KeUgcxPTIqvqN3ISYYVVxIAiKPtZr1erzGikSLbt+FJDbG1i8GJg13MR4jjuf0FX3Xw4hFHtyjAr1epqkCRxJFobfRwySxwZ/vTgr8NzSrxtZieycN5XkypA6Y6j8M16vVDulI8LELyDx9Pvo3XldUCsfUqTSVqcKR+CWXymTB9tq9Xqs3pIZPTV6D9ywJYFc4b8s1PaRm1vprWRcxnzKPVD1/wCvavV6pKUCuuZIU5gf39q25/4kZ3Bo5Gseu2cXIV8UdgeUsPY+o9O+a9XqC5MR70pbaxls7VpMhJo5eUKRvvVnTvrJ4gijt3IkeyuDIg/4eObc++M4r1eoRG1u47iGMP5C/9k=", name: "Neha Das", age: 28, gender: "Female", education: "M.A. Sociology", occupation: "Community Coordinator", location: "Kolkata, West Bengal", maritalStatus: "Widowed", description: "Community-minded and independent, interested in education, culture and meaningful connections.", interests: "Community Work · Art · Reading", status: "DEMO", verified: false },
  { id: "demo-matrimonial-10", photoData: "data:image/jpeg;base64,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", name: "Deepak Mishra", age: 32, gender: "Male", education: "B.Com", occupation: "Banking Professional", location: "Indore, Madhya Pradesh", maritalStatus: "Never married", description: "Grounded and family-oriented. Enjoys sports, financial literacy and travelling with friends.", interests: "Finance · Badminton · Travel", status: "DEMO", verified: false },
  { id: "demo-matrimonial-11", photoData: "data:image/jpeg;base64,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", name: "Anjali Nair", age: 29, gender: "Female", education: "B.Arch", occupation: "Architect", location: "Kochi, Kerala", maritalStatus: "Never married", description: "Creative professional who appreciates sustainable design, nature and cultural traditions.", interests: "Design · Nature · Sketching", status: "DEMO", verified: false },
  { id: "demo-matrimonial-12", photoData: "data:image/jpeg;base64,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", name: "Manoj Kumar", age: 35, gender: "Male", education: "M.A. Economics", occupation: "Lecturer", location: "Ranchi, Jharkhand", maritalStatus: "Divorced", description: "An educator who values mutual respect, honest communication and lifelong learning.", interests: "Teaching · History · Music", status: "DEMO", verified: false },
];

/* =========================================================
   APP
========================================================= */

const ROLE_DASHBOARD_CONFIG = {
  "General Member": {
    title: "Member Dashboard",
    description: "Your membership, community services, and updates in one place.",
    actions: [{ label: "My Profile", page: "profile" }, { label: "Documents", page: "documents" }, { label: "Scholarships", page: "scholarships" }, { label: "Marketplace", page: "marketplace" }],
  },
  "Marketplace Seller": {
    title: "Seller Dashboard",
    description: "Manage your pottery listings and connect with customers.",
    actions: [{ label: "Marketplace", page: "marketplace" }, { label: "My Profile", page: "profile" }, { label: "Events", page: "events" }, { label: "Payments & Fees", page: "payments" }],
  },
  "Super Admin": {
    title: "Super Admin Dashboard",
    description: "Community-wide oversight and administration.",
    actions: [{ label: "Members", page: "members" }, { label: "Committee & Roles", page: "committee-roles" }, { label: "Emergency Requests", page: "emergency" }, { label: "Help & Support", page: "support-inquiries" }, { label: "Payments & Fees", page: "payments" }, { label: "Events", page: "events" }, { label: "Announcements", page: "announcements" }, { label: "Official records", page: "community-records" }],
  },
  "Admin": {
    title: "Admin Dashboard",
    description: "Manage community operations and member services.",
    actions: [{ label: "Members", page: "members" }, { label: "Committee & Roles", page: "committee-roles" }, { label: "Emergency Requests", page: "emergency" }, { label: "Help & Support", page: "support-inquiries" }, { label: "Announcements", page: "announcements" }, { label: "Events", page: "events" }, { label: "Documents", page: "documents" }, { label: "Official records", page: "community-records" }],
  },
  "President / Head": {
    title: "President Dashboard",
    description: "Oversee community activities, leadership, and key updates.",
    actions: [{ label: "Members", page: "members" }, { label: "Events", page: "events" }, { label: "Announcements", page: "announcements" }, { label: "Payments & Fees", page: "payments" }, { label: "Official records", page: "community-records" }],
  },
  "Secretary": {
    title: "Secretary Dashboard",
    description: "Coordinate records, announcements, and community events.",
    actions: [{ label: "Official records", page: "community-records" }, { label: "Announcements", page: "announcements" }, { label: "Events", page: "events" }, { label: "Members", page: "members" }],
  },
  "Treasurer": {
    title: "Treasurer Dashboard",
    description: "Review membership fees and community financial activity.",
    actions: [{ label: "Payments & Fees", page: "payments" }, { label: "Members", page: "members" }, { label: "Events", page: "events" }, { label: "My Profile", page: "profile" }],
  },
  "Director": {
    title: "Director Dashboard",
    description: "Review community performance and coordinate assigned responsibilities.",
    actions: [{ label: "Members", page: "members" }, { label: "Events", page: "events" }, { label: "Announcements", page: "announcements" }, { label: "Scholarships", page: "scholarships" }],
  },
  "Nominated Director": {
    title: "Nominated Director Dashboard",
    description: "Access community updates and your assigned coordination tools.",
    actions: [{ label: "Members", page: "members" }, { label: "Events", page: "events" }, { label: "Announcements", page: "announcements" }, { label: "My Profile", page: "profile" }],
  },
  "Scholarship Officer": {
    title: "Scholarship Officer Dashboard",
    description: "Focus on scholarship information and applicant support.",
    actions: [{ label: "Scholarships", page: "scholarships" }, { label: "Documents", page: "documents" }, { label: "Members", page: "members" }, { label: "Announcements", page: "announcements" }],
  },
  "Matrimonial Coordinator": {
    title: "Matrimonial Coordinator Dashboard",
    description: "Coordinate matrimonial services and community requests.",
    actions: [{ label: "Matrimonial", page: "matrimonial" }, { label: "Members", page: "members" }, { label: "Announcements", page: "announcements" }, { label: "My Profile", page: "profile" }],
  },
  "Event Coordinator": {
    title: "Event Coordinator Dashboard",
    description: "Plan events, track registrations, and share community updates.",
    actions: [{ label: "Events", page: "events" }, { label: "Announcements", page: "announcements" }, { label: "Members", page: "members" }, { label: "My Profile", page: "profile" }],
  },
  "Verification Officer": {
    title: "Verification Officer Dashboard",
    description: "Review membership records and document verification tasks.",
    actions: [{ label: "Members", page: "members" }, { label: "Documents", page: "documents" }, { label: "My Profile", page: "profile" }, { label: "Announcements", page: "announcements" }],
  },
  "Media Coordinator": {
    title: "Media Coordinator Dashboard",
    description: "Coordinate announcements and community communication.",
    actions: [{ label: "Announcements", page: "announcements" }, { label: "Events", page: "events" }, { label: "Marketplace", page: "marketplace" }, { label: "My Profile", page: "profile" }],
  },
  "Legal Grievance Coordinator": {
    title: "Legal & Grievance Dashboard",
    description: "Coordinate community support requests and grievance follow-up.",
    actions: [{ label: "Emergency Support", page: "emergency" }, { label: "Documents", page: "documents" }, { label: "Members", page: "members" }, { label: "My Profile", page: "profile" }],
  },
};

function normalizeCommunityRole(role) {
  const value = String(role || "").trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
  const aliases = {
    "normal member": "General Member",
    "general member": "General Member",
    "member": "General Member",
    "president": "President / Head",
    "president/head": "President / Head",
    "president / head": "President / Head",
    "head": "President / Head",
    "superadmin": "Super Admin",
    "committee member": "Director",
    "marketplace seller": "Marketplace Seller",
    "scholarship officer": "Scholarship Officer",
    "matrimonial coordinator": "Matrimonial Coordinator",
    "event coordinator": "Event Coordinator",
    "verification officer": "Verification Officer",
    "media coordinator": "Media Coordinator",
    "legal grievance coordinator": "Legal Grievance Coordinator",
    "legal & grievance coordinator": "Legal Grievance Coordinator",
  };
  return aliases[value] || Object.keys(ROLE_DASHBOARD_CONFIG).find((name) => name.toLowerCase() === value) || String(role || "General Member").trim();
}

function LanguageSelector() {
  const [language, setLanguage] = useState(() => {
    try { return localStorage.getItem("potterCommunityLanguage") || "en"; }
    catch { return "en"; }
  });

  const changeLanguage = (nextLanguage) => {
    setLanguage(nextLanguage);
    try { localStorage.setItem("potterCommunityLanguage", nextLanguage); } catch {}
    // Apply the selected language from a clean page load. Google Translate can
    // otherwise leave the previous language active after the selector changes.
    if (typeof window.changePotterCommunityLanguage === "function") {
      window.changePotterCommunityLanguage(nextLanguage, true);
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="language-switcher" title="Choose website language">
      <Languages size={17} aria-hidden="true" />
      <label className="sr-only" htmlFor="potter-language-select">Website language</label>
      <select
        id="potter-language-select"
        value={language}
        onChange={(event) => changeLanguage(event.target.value)}
        aria-label="Website language"
      >
        <option value="en">English</option>
        <option value="hi">हिन्दी</option>
        <option value="kn">ಕನ್ನಡ</option>
      </select>
      <div id="google_translate_element" className="google-translate-hidden" aria-hidden="true" />
    </div>
  );
}

function App() {
  useEffect(() => {
    // Google Translate translates visible page content, including most React-rendered
    // text. The native selector stays visible; the Google widget stays hidden.
    const supportedLanguages = new Set(["en", "hi", "kn"]);
    const getSavedLanguage = () => {
      try {
        const saved = localStorage.getItem("potterCommunityLanguage") || "en";
        return supportedLanguages.has(saved) ? saved : "en";
      } catch {
        return "en";
      }
    };

    const setTranslateCookie = (languageCode) => {
      const value = `/en/${languageCode}`;
      // Replace the host cookie; this is the important cookie on localhost.
      document.cookie = `googtrans=${value}; path=/; SameSite=Lax`;
      // Also replace a domain cookie when running on a real multi-label domain.
      const hostname = window.location.hostname;
      const hostnameParts = hostname.split(".");
      if (hostnameParts.length > 1 && hostname !== "localhost" && !/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
        const rootDomain = hostnameParts.slice(-2).join(".");
        document.cookie = `googtrans=${value}; path=/; domain=.${rootDomain}; SameSite=Lax`;
      }
    };

    window.changePotterCommunityLanguage = (languageCode, reload = false) => {
      if (!supportedLanguages.has(languageCode)) return;
      setTranslateCookie(languageCode);
      if (reload) {
        // A fresh load makes Google Translate consistently restore English too,
        // rather than leaving translated text behind in the current DOM.
        window.location.reload();
        return;
      }

      let attempts = 0;
      const applyLanguage = () => {
        const combo = document.querySelector(".goog-te-combo");
        if (combo) {
          if (combo.value !== languageCode) {
            combo.value = languageCode;
            combo.dispatchEvent(new Event("change", { bubbles: true }));
          }
          return;
        }
        attempts += 1;
        if (attempts < 60) window.setTimeout(applyLanguage, 250);
      };
      applyLanguage();
    };

    window.googleTranslateElementInit = () => {
      if (!window.google?.translate?.TranslateElement) return;
      const container = document.getElementById("google_translate_element");
      if (!container || container.dataset.initialized === "true") return;
      container.dataset.initialized = "true";
      new window.google.translate.TranslateElement({
        pageLanguage: "en",
        includedLanguages: "en,hi,kn",
        autoDisplay: false,
        multilanguagePage: true,
        layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
      }, "google_translate_element");

      const savedLanguage = getSavedLanguage();
      if (savedLanguage !== "en") {
        setTranslateCookie(savedLanguage);
        window.setTimeout(() => window.changePotterCommunityLanguage(savedLanguage), 500);
      }
    };

    if (!document.querySelector('script[data-potter-google-translate="true"]')) {
      const script = document.createElement("script");
      script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      script.dataset.potterGoogleTranslate = "true";
      script.onerror = () => {
        console.warn("Google Translate could not load. Check your internet connection or browser extensions.");
      };
      document.body.appendChild(script);
    } else if (window.google?.translate?.TranslateElement) {
      window.googleTranslateElementInit();
    }

    // If a component re-renders/remounts, the saved language remains applied.
    const savedLanguage = getSavedLanguage();
    // Keep Google Translate's cookie aligned with the user's actual selector value.
    // Do not reload here; selecting a language explicitly triggers the clean reload.
    setTranslateCookie(savedLanguage);
    if (savedLanguage !== "en") {
      window.setTimeout(() => window.changePotterCommunityLanguage(savedLanguage), 800);
    }
  }, []);

  const [authenticated, setAuthenticated] = useState(false);
  const [activeRole, setActiveRole] = useState("General Member");
  const [activeUser, setActiveUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem("potterCommunityUser") || "null"); }
    catch { return null; }
  });
  const [authModal, setAuthModal] = useState(null);
  const [verificationPending, setVerificationPending] =
    useState(false);
  const [currentPage, setCurrentPage] = useState("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [memberPrompt, setMemberPrompt] = useState(false);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [pendingMemberships, setPendingMemberships] = useState([]);
  const [memberDirectory, setMemberDirectory] = useState([]);
  const [memberDirectoryLoading, setMemberDirectoryLoading] = useState(false);
  const [memberDirectorySearch, setMemberDirectorySearch] = useState("");
  const [membershipLoading, setMembershipLoading] = useState(false);
  const [membershipError, setMembershipError] = useState("");
  const [membershipActionLoading, setMembershipActionLoading] = useState(null);
  const [reviewingMembership, setReviewingMembership] = useState(null);
  const [reviewDetailsLoading, setReviewDetailsLoading] = useState(false);
  const [reviewDetailsError, setReviewDetailsError] = useState("");
  const [documentRequestStatus, setDocumentRequestStatus] = useState("");
  const [documentRequestBusy, setDocumentRequestBusy] = useState(false);
  const [documentReviewBusy, setDocumentReviewBusy] = useState(null);

  useEffect(() => {
    const token = sessionStorage.getItem("potterCommunityAccessToken") || localStorage.getItem("token");
    if (!token || sessionStorage.getItem("potterCommunityDemoMode") === "true") return undefined;

    let cancelled = false;
    const restoreSession = async () => {
      try {
        const user = await authApi("/auth/me");
        if (cancelled) return;
        const role = normalizeCommunityRole(user.role || "General Member");
        const restoredUser = { ...user, role };
        sessionStorage.setItem("potterCommunityAccessToken", token);
        sessionStorage.setItem("potterCommunityUser", JSON.stringify(restoredUser));
        setActiveUser(restoredUser);
        setActiveRole(role);
        setAuthenticated(true);
        setCurrentPage(role === "ADMIN" ? "members" : "dashboard");
      } catch {
        if (cancelled) return;
        sessionStorage.removeItem("potterCommunityAccessToken");
        sessionStorage.removeItem("potterCommunityUser");
        localStorage.removeItem("token");
        setActiveUser(null);
        setAuthenticated(false);
      }
    };
    restoreSession();
    return () => { cancelled = true; };
  }, []);

  const loadPendingMemberships = async () => {
    setMembershipLoading(true);
    setMembershipError("");

    try {
      const data = await authApi("/auth/admin/memberships/pending");
      setPendingMemberships(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load pending memberships:", error);
      setMembershipError(error.message || "Could not load membership requests.");
    } finally {
      setMembershipLoading(false);
    }
  };

  const loadMemberDirectory = async () => {
    if (!authenticated) return;
    setMemberDirectoryLoading(true);
    try {
      const rows = await authApi("/auth/admin/members");
      setMemberDirectory(Array.isArray(rows) ? rows : []);
    } catch (error) {
      console.error("Failed to load member directory:", error);
    } finally {
      setMemberDirectoryLoading(false);
    }
  };

  const setMemberActivation = async (member, isActive) => {
    try {
      await authApi(`/auth/admin/members/${member.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: isActive }),
      });
      await loadMemberDirectory();
    } catch (error) {
      alert(error.message || "Could not update member access.");
    }
  };

  const handleMembershipAction = async (userId, action) => {
    setMembershipActionLoading(`${action}-${userId}`);

    try {
      const remark = action === "reject" ? window.prompt("Add the reason for rejecting this membership request.") : null;
      if (action === "reject" && (!remark || remark.trim().length < 3)) return;
      await authApi(
        `/auth/admin/memberships/${userId}/${action}`,
        { method: "PATCH", ...(remark ? { body: JSON.stringify({ remark: remark.trim() }) } : {}) }
      );

      await loadPendingMemberships();
      if (reviewingMembership?.id === userId) setReviewingMembership(null);
    } catch (error) {
      console.error(`Failed to ${action} membership:`, error);
      alert(error.message || `Failed to ${action} membership.`);
    } finally {
      setMembershipActionLoading(null);
    }
  };

  const forwardMembership = async (userId, nextStage) => {
    const endpoint = nextStage === "verification" ? "forward-to-verification" : "forward-to-president";
    setMembershipActionLoading(`${nextStage}-${userId}`);
    try {
      await authApi(`/auth/admin/memberships/${userId}/${endpoint}`, { method: "POST" });
      await loadPendingMemberships();
      await viewMembershipApplication(userId);
    } catch (error) {
      alert(error.message || "Could not forward this application.");
    } finally { setMembershipActionLoading(null); }
  };

  const viewMembershipApplication = async (userId) => {
    setReviewDetailsLoading(true);
    setReviewDetailsError("");
    setDocumentRequestStatus("");
    setReviewingMembership(null);
    try {
      const details = await authApi(`/auth/admin/memberships/${userId}`);
      setReviewingMembership(details);
    } catch (error) {
      setReviewDetailsError(error.message || "Could not load the application details.");
    } finally {
      setReviewDetailsLoading(false);
    }
  };

  const requestMembershipDocuments = async () => {
    if (!reviewingMembership?.id) return;
    setDocumentRequestBusy(true);
    setDocumentRequestStatus("");
    try {
      const result = await authApi(`/auth/admin/memberships/${reviewingMembership.id}/request-documents`, { method: "POST" });
      setDocumentRequestStatus(result.message || "The member was asked to resubmit their documents.");
    } catch (error) {
      setDocumentRequestStatus(error.message || "Could not request documents.");
    } finally {
      setDocumentRequestBusy(false);
    }
  };

  const reviewApplicationDocument = async (documentId, status) => {
    if (!reviewingMembership?.id) return;
    setDocumentReviewBusy(documentId);
    setDocumentRequestStatus("");
    try {
      await authApi(`/verification/${documentId}/review`, {
        method: "PATCH",
        body: JSON.stringify({ status, admin_remark: null }),
      });
      setDocumentRequestStatus(`Document ${status.toLowerCase()}.`);
      await viewMembershipApplication(reviewingMembership.id);
      await loadPendingMemberships();
    } catch (error) {
      setDocumentRequestStatus(error.message || "Could not update document review.");
    } finally {
      setDocumentReviewBusy(null);
    }
  };

  const openMembershipDocument = async (membershipDocument) => {
    const token = sessionStorage.getItem("potterCommunityAccessToken") || localStorage.getItem("token");
    const previewWindow = window.open("about:blank", "_blank");
    if (!previewWindow) {
      alert("Allow pop-ups for this site to view the document in a new tab.");
      return;
    }
    try {
      const response = await fetch(`${AUTH_API_BASE}${membershipDocument.download_url}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error("The document could not be opened.");
      const blobUrl = URL.createObjectURL(await response.blob());
      previewWindow.opener = null;
      previewWindow.location.href = blobUrl;
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 5 * 60_000);
    } catch (error) {
      previewWindow.close();
      alert(error.message || "The document could not be opened.");
    }
  };

  useEffect(() => {
    if (
      authenticated &&
      (String(activeUser?.role || "").toUpperCase() === "ADMIN" || activeUser?.permissions?.includes("membership.review") || activeUser?.permissions?.includes("community.approve"))
    ) {
      loadPendingMemberships();
    }
  }, [authenticated, activeUser?.role, activeUser?.permissions]);

  useEffect(() => {
    if (authenticated && (
      String(activeUser?.role || "").toUpperCase() === "ADMIN"
      || activeUser?.permissions?.includes("membership.view")
      || activeUser?.permissions?.includes("members.manage")
    )) loadMemberDirectory();
  }, [authenticated, activeUser?.role, activeUser?.permissions]);

  const openMemberFeature = (page) => {
    if (!authenticated) {
      setMemberPrompt(true);
      return;
    }

    setCurrentPage(page);
    setSidebarOpen(false);
  };

  const navigate = (page, memberOnly = false) => {
    // Public marketplace browsing is free; other community areas stay member-only.
    if (!authenticated && page !== "home" && page !== "marketplace" && page !== "checkout") {
      setMemberPrompt(true);
      return;
    }
    if (!authenticated && memberOnly && page !== "marketplace" && page !== "checkout") {
      setMemberPrompt(true);
      return;
    }
    setCurrentPage(page);
    setSidebarOpen(false);
  };

  const logout = () => {
    sessionStorage.removeItem("potterCommunityAccessToken");
    sessionStorage.removeItem("potterCommunityUser");
    sessionStorage.removeItem("potterCommunityDemoMode");
    localStorage.removeItem("token");
    setActiveUser(null);
    setActiveRole("General Member");
    setAuthenticated(false);
    setCurrentPage("home");
  };

  const addToCart = (product) => {
    // Shopping is public; seller and advanced marketplace tools require membership.
    setCart((previousCart) => [...previousCart, product]);
  };
  const removeCartItem = (index) => setCart((previousCart) => previousCart.filter((_, itemIndex) => itemIndex !== index));

  const membershipReviewStage = reviewingMembership?.review_stage || "ADMIN_REVIEW";
  const isPlatformAdmin = String(activeUser?.role || "").toUpperCase() === "ADMIN";
  const isSuperAdmin = String(activeUser?.role || "").toUpperCase() === "SUPER ADMIN";
  const canReviewDocuments = isPlatformAdmin || isSuperAdmin || activeUser?.permissions?.includes("documents.review");
  const canForwardToVerification = (isPlatformAdmin || isSuperAdmin) && membershipReviewStage === "ADMIN_REVIEW";
  const canForwardToPresident = !isPlatformAdmin && canReviewDocuments && membershipReviewStage === "VERIFICATION_OFFICER_REVIEW";
  const canApproveMembership = (isSuperAdmin || (!isPlatformAdmin && activeUser?.permissions?.includes("community.approve"))) && membershipReviewStage === "PRESIDENT_REVIEW";
  const allMembershipDocumentsApproved = Boolean(reviewingMembership?.documents?.length)
    && reviewingMembership.documents.every((document) => document.status === "APPROVED");
  const canRejectMembership = membershipReviewStage === "ADMIN_REVIEW"
    ? isPlatformAdmin || isSuperAdmin
    : membershipReviewStage === "VERIFICATION_OFFICER_REVIEW"
      ? !isPlatformAdmin && canReviewDocuments
      : (isSuperAdmin || (!isPlatformAdmin && activeUser?.permissions?.includes("community.approve")));

  return (
    <div className={`app ${authenticated && sidebarOpen ? "sidebar-visible" : "sidebar-hidden"}`}>
      <style>{`
        @media(max-width:600px) { }
        /* Keep Google Translate available for automatic language switching, but hide its floating widget/logo. */
        .google-translate-hidden { position:fixed !important; left:-10000px !important; top:0 !important; width:1px !important; height:1px !important; overflow:hidden !important; opacity:0 !important; pointer-events:none !important; }
        .google-translate-hidden, .google-translate-hidden * { visibility:hidden !important; }
        /* Hide Google's top translation notification bar without disabling translation. */
        .goog-te-banner-frame,
        .goog-te-banner-frame.skiptranslate,
        iframe.goog-te-banner-frame,
        .goog-te-balloon-frame,
        #goog-gt-tt,
        .goog-te-spinner-pos,
        .goog-te-gadget-icon,
        .goog-te-menu-frame { display:none !important; visibility:hidden !important; height:0 !important; }
        html, body { top:0 !important; }
        body { position:static !important; }
        .skiptranslate { border:0 !important; }
        .sidebar { position:fixed !important; z-index:1200 !important; inset:0 auto 0 0 !important; width:min(290px,86vw) !important; height:100dvh !important; transform:translateX(-105%) !important; visibility:hidden !important; opacity:0 !important; box-shadow:18px 0 55px rgba(49,31,20,.18) !important; transition:transform .28s ease, opacity .22s ease, visibility .28s ease !important; }
        .sidebar.sidebar-open { transform:translateX(0) !important; visibility:visible !important; opacity:1 !important; }
        .sidebar-hidden .sidebar { pointer-events:none !important; }
        .main.authenticated-main { width:100% !important; margin-left:0 !important; }
        /* Brand and navigation control form one intentional, compact header stack. */
        .top-header { min-height:96px !important; display:flex !important; align-items:center !important; justify-content:space-between !important; padding:10px 28px 10px 30px !important; box-sizing:border-box; }
        .header-left { display:flex !important; flex-direction:column !important; align-items:flex-start !important; justify-content:center !important; gap:5px !important; padding:0 !important; margin:0 !important; min-width:220px; }
        .logo-area { order:0; display:flex !important; align-items:center !important; gap:11px !important; margin:0 !important; min-height:42px; cursor:pointer; }
        .logo-area .logo-icon { width:42px !important; height:42px !important; min-width:42px !important; display:grid !important; place-items:center !important; border-radius:13px !important; }
        .logo-area h2 { margin:0 0 2px !important; font-size:17px !important; line-height:1.2 !important; }
        .logo-area span { display:block; font-size:10px !important; line-height:1.3 !important; }
        .sidebar-toggle-button { order:1; display:inline-grid !important; place-items:center !important; width:38px; height:32px; flex:none; border:1px solid #ead8ca; border-radius:10px; background:#fffaf5; color:#8e4c32; cursor:pointer; margin:0 0 0 53px !important; padding:0 !important; box-shadow:0 2px 7px rgba(65,42,27,.045); transition:background .2s ease,border-color .2s ease; }
        .sidebar-toggle-button:hover { background:#f4e4d7; border-color:#d8b49d; }
        .header-left .mobile-menu-button { display:none !important; }
        @media(max-width:800px) { .top-header { min-height:88px !important; padding:8px 14px !important; } .header-left { min-width:190px; gap:4px !important; } .logo-area { gap:8px !important; } .logo-area .logo-icon { width:38px !important; height:38px !important; min-width:38px !important; } .logo-area h2 { font-size:15px !important; } .sidebar-toggle-button { width:36px; height:30px; margin-left:46px !important; } }
        .sidebar-overlay { position:fixed !important; inset:0 !important; z-index:1190 !important; background:rgba(35,24,18,.38) !important; backdrop-filter:blur(3px); }
        .sidebar-mobile-close { display:flex !important; justify-content:flex-end; padding:12px 14px 4px; }
        .sidebar-mobile-close button { display:grid; place-items:center; width:38px; height:38px; border:1px solid #ead8ca; border-radius:12px; background:#fffaf5; color:#8e4c32; cursor:pointer; }
        .dashboard-welcome { position:relative; overflow:hidden; padding:30px 32px !important; border:1px solid #ead5c4; border-radius:22px; background:radial-gradient(circle at 88% 18%,rgba(195,112,73,.18),transparent 28%),linear-gradient(120deg,#fffaf5 0%,#f5e5d8 100%); box-shadow:0 12px 32px rgba(77,45,27,.07); margin-bottom:22px !important; }
        .dashboard-welcome h1 { font-family:Georgia,serif; font-size:clamp(29px,3vw,39px) !important; letter-spacing:-.7px; color:#38251b; margin:8px 0 9px !important; }
        .dashboard-welcome p { max-width:620px; line-height:1.75; color:#806b5e; }
        .dashboard-welcome:after { content:'🏺'; position:absolute; right:7%; top:50%; transform:translateY(-50%) rotate(-12deg); font-size:clamp(58px,7vw,94px); opacity:.13; pointer-events:none; }
        .dashboard-stats { gap:16px !important; margin:22px 0 24px !important; }
        .dashboard-stats > * { border:1px solid #ead8ca !important; border-radius:17px !important; box-shadow:0 8px 22px rgba(65,42,27,.045); transition:transform .2s ease,box-shadow .2s ease; }
        .dashboard-stats > *:hover { transform:translateY(-3px); box-shadow:0 14px 28px rgba(65,42,27,.09); }
        .dashboard-layout > * { border:1px solid #ead8ca !important; border-radius:19px !important; box-shadow:0 8px 24px rgba(65,42,27,.045); }
        .dashboard-main-card,.dashboard-side-card { padding:24px !important; }
        .dashboard-empty-message { padding:22px; border-radius:13px; background:#fff8f1; color:#856f60; }
        .dashboard-welcome { min-height:190px; display:flex; align-items:center; justify-content:space-between; gap:24px; }
        .dashboard-welcome .welcome-small { display:inline-flex; align-items:center; padding:7px 11px; border-radius:99px; background:#f0dfd1; color:#9b4f32; font-size:10px; font-weight:900; letter-spacing:.16em; }
        .dashboard-welcome h1 { line-height:1.12 !important; }
        .dashboard-stats > * { background:linear-gradient(145deg,#fffefa,#fff8f1) !important; }
        .dashboard-quick-links button { min-height:82px; transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease !important; }
        .dashboard-quick-links button:hover { transform:translateY(-3px); border-color:#c98d6c !important; box-shadow:0 12px 24px rgba(65,42,27,.09) !important; }
        .dashboard-layout { gap:18px !important; }
        .top-header { position:sticky; top:0; z-index:1000; box-shadow:0 4px 18px rgba(57,37,25,.035); }
        @media(max-width:800px) { .dashboard-welcome { min-height:150px; align-items:flex-start; flex-direction:column; } }
        @media(max-width:800px) { .sidebar-toggle-button { display:inline-grid; } .dashboard-welcome { padding:22px !important; } .dashboard-welcome:after { right:5%; opacity:.08; } }
      `}</style>
      {authenticated && (
        <Sidebar
          currentPage={currentPage}
          navigate={navigate}
          logout={logout}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeUser={activeUser}
        />
      )}

      <div
        className={
          authenticated
            ? "main authenticated-main"
            : "main"
        }
      >
        <Header
          authenticated={authenticated}
          setAuthModal={setAuthModal}
          setSidebarOpen={setSidebarOpen}
          navigate={navigate}
          cart={cart}
          activeRole={activeRole}
          activeUser={activeUser}
        />

        {!authenticated ? (
          <PublicContent
            currentPage={currentPage}
            navigate={navigate}
            setAuthModal={setAuthModal}
            openMemberFeature={openMemberFeature}
            search={search}
            setSearch={setSearch}
            addToCart={addToCart}
            cart={cart}
            clearCart={() => setCart([])}
            removeCartItem={removeCartItem}
          />
        ) : (
          <MemberContent
            currentPage={currentPage}
            navigate={navigate}
            activeRole={activeRole}
            activeUser={activeUser}
            pendingMemberships={pendingMemberships}
            membershipLoading={membershipLoading}
            membershipError={membershipError}
            membershipActionLoading={membershipActionLoading}
            memberDirectory={memberDirectory}
            memberDirectoryLoading={memberDirectoryLoading}
            memberDirectorySearch={memberDirectorySearch}
            setMemberDirectorySearch={setMemberDirectorySearch}
            loadMemberDirectory={loadMemberDirectory}
            setMemberActivation={setMemberActivation}
            loadPendingMemberships={loadPendingMemberships}
            handleMembershipAction={handleMembershipAction}
            forwardMembership={forwardMembership}
            viewMembershipApplication={viewMembershipApplication}
            search={search}
            setSearch={setSearch}
            addToCart={addToCart}
            cart={cart}
            clearCart={() => setCart([])}
            removeCartItem={removeCartItem}
          />
        )}
      </div>

      {authModal && (
        <AuthModal
          type={authModal}
          close={() => setAuthModal(null)}
          onAuthenticated={(role, user) => {
            const rawRole = role || user?.role || "General Member";
            console.log("AUTH ROLE DEBUG:", {
              roleFromLogin: role,
              roleFromUser: user?.role,
              rawRole,
              normalizedRole: normalizeCommunityRole(rawRole),
            });

            const assignedRole = normalizeCommunityRole(rawRole);
            setActiveRole(assignedRole);
            setActiveUser(user || null);

            try {
              if (user) {
                sessionStorage.setItem(
                  "potterCommunityUser",
                  JSON.stringify({ ...user, role: assignedRole })
                );
              }
            } catch {}

            setAuthenticated(true);
            setAuthModal(null);

            // Keep the page in sync with the logged-in user.
            // Admins should be able to open Member Directory directly.
            if (assignedRole === "ADMIN") {
              setCurrentPage("members");
            } else {
              setCurrentPage("dashboard");
            }
          }}
          onRegistered={() => {
            setAuthModal(null);
            setVerificationPending(true);
          }}
        />
      )}

      {(reviewDetailsLoading || reviewDetailsError || reviewingMembership) && (
        <div className="modal-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) { setReviewingMembership(null); setReviewDetailsError(""); } }}>
          <section className="auth-modal" role="dialog" aria-modal="true" aria-label="Membership application details" style={{ width: "min(760px, calc(100vw - 32px))", maxWidth: 760, maxHeight: "calc(100dvh - 32px)", overflowY: "auto", padding: 24 }}>
            <button className="modal-close" type="button" onClick={() => { setReviewingMembership(null); setReviewDetailsError(""); }} aria-label="Close application details">×</button>
            {reviewDetailsLoading ? <p>Loading application details…</p> : reviewDetailsError ? <p role="alert">{reviewDetailsError}</p> : reviewingMembership && <>
              <h2 style={{ marginTop: 0 }}>Application details</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                {[
                  ["Full name", reviewingMembership.full_name],
                  ["Phone", reviewingMembership.phone_number],
                  ["Email", reviewingMembership.email],
                  ["Phone verification", reviewingMembership.phone_verified ? "Verified" : "Not verified"],
                  ["Date of birth", reviewingMembership.application_details?.date_of_birth],
                  ["Gender", reviewingMembership.application_details?.gender],
                  ["Blood group", reviewingMembership.application_details?.blood_group],
                  ["Permanent address", reviewingMembership.application_details?.permanent_address],
                  ["Correspondence address", reviewingMembership.application_details?.correspondence_address],
                ].map(([label, value]) => <div key={label} style={{ padding: 12, border: "1px solid #ead8cc", borderRadius: 10 }}><small style={{ color: "#806b5e" }}>{label}</small><div style={{ marginTop: 4, overflowWrap: "anywhere" }}>{value || "Not provided"}</div></div>)}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 22 }}><h3 style={{ margin: 0 }}>Submitted documents</h3><button type="button" className="btn btn-outline" onClick={() => viewMembershipApplication(reviewingMembership.id)} disabled={reviewDetailsLoading}>Refresh application</button></div>
            <p style={{ color: "#806b5e", fontSize: 12 }}>Review stage: {membershipReviewStage.replaceAll("_", " ")}</p>
            {reviewingMembership.documents?.length ? <div style={{ display: "grid", gap: 8, marginTop: 10 }}>{reviewingMembership.documents.map((document) => <div key={document.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", border: "1px solid #ead8cc", borderRadius: 10, padding: 12 }}><div><strong>{document.document_type}</strong><div style={{ color: "#806b5e", fontSize: 12 }}>Status: {document.status} · Submitted {document.created_at ? new Date(document.created_at).toLocaleString() : "date unavailable"}</div></div><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{canReviewDocuments && <button type="button" className="btn btn-outline" onClick={() => openMembershipDocument(document)}>View document</button>}{canReviewDocuments && document.status === "PENDING" && <><button type="button" className="btn btn-primary" onClick={() => reviewApplicationDocument(document.id, "APPROVED")} disabled={documentReviewBusy !== null}>{documentReviewBusy === document.id ? "Saving…" : "Approve document"}</button><button type="button" className="btn btn-outline" onClick={() => reviewApplicationDocument(document.id, "REJECTED")} disabled={documentReviewBusy !== null}>Reject</button></>}</div></div>)}</div> : <div style={{ marginTop: 10, padding: 12, border: "1px solid #f0d8c9", borderRadius: 10, background: "#fff8f2" }}><p style={{ margin: "0 0 10px", color: "#806b5e" }}>No uploaded document records are attached to this application in the server. Ask the member to resubmit their files; then refresh this application.</p>{(isPlatformAdmin || activeUser?.permissions?.includes("membership.review")) && <button type="button" className="btn btn-outline" onClick={requestMembershipDocuments} disabled={documentRequestBusy}>{documentRequestBusy ? "Sending request…" : "Ask member to resubmit documents"}</button>}{documentRequestStatus && <p role="status" style={{ margin: "9px 0 0", color: "#39734a", fontSize: 12 }}>{documentRequestStatus}</p>}</div>}
              {canForwardToVerification && !allMembershipDocumentsApproved && <p style={{ margin: "10px 0 0", color: "#806b5e", fontSize: 12 }}>Approve every uploaded document above before forwarding this application.</p>}
              {documentRequestStatus && reviewingMembership.documents?.length > 0 && <p role="status" style={{ margin: "9px 0 0", color: "#39734a", fontSize: 12 }}>{documentRequestStatus}</p>}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap", marginTop: 22, paddingTop: 16, borderTop: "1px solid #ead8cc" }}>
                {canRejectMembership && <button type="button" className="btn btn-outline" onClick={() => handleMembershipAction(reviewingMembership.id, "reject")} disabled={membershipActionLoading !== null}>{membershipActionLoading === `reject-${reviewingMembership.id}` ? "Rejecting…" : "Reject application"}</button>}
                {canForwardToVerification && <button type="button" className="btn btn-primary" onClick={() => forwardMembership(reviewingMembership.id, "verification")} disabled={membershipActionLoading !== null || !allMembershipDocumentsApproved}>{membershipActionLoading === `verification-${reviewingMembership.id}` ? "Forwarding…" : "Forward to Verification Officer"}</button>}
                {canForwardToPresident && <button type="button" className="btn btn-primary" onClick={() => forwardMembership(reviewingMembership.id, "president")} disabled={membershipActionLoading !== null || !allMembershipDocumentsApproved}>{membershipActionLoading === `president-${reviewingMembership.id}` ? "Forwarding…" : "Forward to President"}</button>}
                {canApproveMembership && <button type="button" className="btn btn-primary" onClick={() => handleMembershipAction(reviewingMembership.id, "approve")} disabled={membershipActionLoading !== null}>{membershipActionLoading === `approve-${reviewingMembership.id}` ? "Approving…" : "Approve membership"}</button>}
              </div>
            </>}
          </section>
        </div>
      )}

      {verificationPending && (
        <VerificationPending
          close={() => setVerificationPending(false)}
          setAuthModal={setAuthModal}
        />
      )}

      {memberPrompt && (
        <MemberPrompt
          close={() => setMemberPrompt(false)}
          setAuthModal={setAuthModal}
        />
      )}
    </div>
  );
}

/* =========================================================
   HEADER
========================================================= */

function Header({
  authenticated,
  setAuthModal,
  setSidebarOpen,
  navigate,
  cart,
  activeRole,
  activeUser,
}) {
  const [profile, setProfile] = useState(() => {
    try {
      return getStoredProfile();
    } catch {
      return { fullName: "", profilePhoto: "" };
    }
  });

  useEffect(() => {
    const updateProfile = () => {
      setProfile(getStoredProfile());
    };

    window.addEventListener(
      "potter-profile-updated",
      updateProfile
    );

    return () =>
      window.removeEventListener(
        "potter-profile-updated",
        updateProfile
      );
  }, []);

  // The authenticated account is the source of truth for the header identity.
  // `potterProfile` is browser-wide and can belong to a previous account.
  const displayName =
    activeUser?.full_name ||
    activeUser?.fullName ||
    activeUser?.name ||
    profile.fullName ||
    "Your Name";
  const initials = displayName !== "Your Name"
    ? displayName
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("")
    : "PC";
  return (
    <header className="top-header">
      <div className="header-left">
        <div
          className="logo-area"
          onClick={() =>
            navigate(authenticated ? "dashboard" : "home")
          }
        >
          <div className="logo-icon">
            <span>🏺</span>
          </div>

          <div>
            <h2>Potter Community</h2>
            <span>Connect • Support • Grow</span>
          </div>
        </div>

        {authenticated && (
          <button
            type="button"
            className="sidebar-toggle-button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation menu"
            title="Open all features"
          >
            <Menu size={21} />
          </button>
        )}
      </div>

      {!authenticated ? (
        <div className="auth-buttons">
          <LanguageSelector />
          <button
            className="btn btn-outline"
            onClick={() => navigate("marketplace")}
            title="Browse pottery products for free"
          >
            <ShoppingBag size={15} /> Shop Pottery
          </button>
          <button className="btn btn-outline" onClick={() => navigate("checkout")} title="Open your shopping cart">
            <ShoppingCart size={15}/> Cart {cart.length > 0 ? `(${cart.length})` : ""}
          </button>
          <button
            className="btn btn-outline"
            onClick={() => setAuthModal("signin")}
          >
            Sign In
          </button>

          <button
            className="btn btn-primary"
            onClick={() => setAuthModal("signup")}
          >
            Sign Up
          </button>
        </div>
      ) : (
        <div className="header-actions">
          <LanguageSelector />
          <button
            className="header-icon-button"
            onClick={() =>
              navigate("notifications", true)
            }
          >
            <Bell size={19} />
            <span className="notification-dot"></span>
          </button>

          <button
            className="header-icon-button"
            onClick={() => navigate("checkout")}
            title="Open shopping cart"
          >
            <ShoppingCart size={19} />

            {cart.length > 0 && (
              <span className="cart-count">
                {cart.length}
              </span>
            )}
          </button>

          <div
            className="mini-profile"
            onClick={() => navigate("profile", true)}
          >
            <div className="mini-avatar">
              {profile.profilePhoto ? (
                <img
                  src={profile.profilePhoto}
                  alt="Profile"
                  style={{ width: "100%", height: "100%", maxWidth: "100%", maxHeight: "100%", objectFit: "cover", objectPosition: "center", transform: `scale(${Number(profile.photoZoom || 1)})`, display: "block" }}
                />
              ) : (
                initials
              )}
            </div>

            <div className="mini-profile-text">
              <strong>{displayName}</strong>
              <span>{activeRole || "General Member"}</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

/* =========================================================
   SIDEBAR
========================================================= */

function Sidebar({
  currentPage,
  navigate,
  logout,
  sidebarOpen,
  setSidebarOpen,
  activeUser,
}) {
  const canManageRoles = String(activeUser?.role || "").toUpperCase() === "ADMIN"
    || String(activeUser?.role || "").toUpperCase() === "SUPER ADMIN"
    || activeUser?.permissions?.includes("roles.manage");
  const menu = [
    {
      title: "Main",
      items: [
        {
          label: "Dashboard",
          icon: Home,
          page: "dashboard",
        },
        {
          label: "Members",
          icon: Users,
          page: "members",
          member: true,
        },
        {
          label: "Announcements",
          icon: Megaphone,
          page: "announcements",
        },
        {
          label: "Meetings & Minutes",
          icon: FileText,
          page: "community-records",
        },
        {
          label: "Events",
          icon: CalendarDays,
          page: "events",
        },
        {
          label: "Professional Network",
          icon: Users,
          page: "professional-network",
          member: true,
        },
        {
          label: "AI Community Assistant",
          icon: Sparkles,
          page: "community-assistant",
          member: true,
        },
        {
          label: "Matrimonial",
          icon: Heart,
          page: "matrimonial",
        },
      ],
    },
    {
      title: "Services",
      items: [
        {
          label: "Documents",
          icon: FileText,
          page: "documents",
          member: true,
        },
        {
          label: "Government Schemes",
          icon: Landmark,
          page: "schemes",
        },
        {
          label: "Widow Pension & Assistance",
          icon: IndianRupee,
          page: "widow-assistance",
          member: true,
        },
        {
          label: "Scholarships",
          icon: GraduationCap,
          page: "scholarships",
        },
        {
          label: "Marketplace",
          icon: ShoppingBag,
          page: "marketplace",
        },
        {
          label: "Payments & Fees",
          icon: CreditCard,
          page: "payments",
          member: true,
        },
        {
          label: "Emergency Support",
          icon: HeartPulse,
          page: "emergency",
          member: true,
        },
      ],
    },
    {
      title: "Account",
      items: [
        {
          label: "Notifications",
          icon: Bell,
          page: "notifications",
          member: true,
        },
        {
          label: "My Profile",
          icon: User,
          page: "profile",
          member: true,
        },
        {
          label: "Settings",
          icon: Settings,
          page: "settings",
          member: true,
        },
      ],
    },
    {
      title: "Administration",
      items: [
        {
          label: "Committee & Roles",
          icon: Users,
          page: "committee-roles",
          member: true,
        },
      ],
    },
  ];

  return (
    <>
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`sidebar ${
          sidebarOpen ? "sidebar-open" : ""
        }`}
      >
        <div className="sidebar-mobile-close">
          <button onClick={() => setSidebarOpen(false)}>
            <X size={21} />
          </button>
        </div>

        <div className="sidebar-content">
          {menu.filter((section) => section.title !== "Administration" || canManageRoles).map((section) => (
            <div
              className="sidebar-section"
              key={section.title}
            >
              <div className="sidebar-section-title">
                {section.title}
              </div>

              {section.items.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={`${item.label}-${item.page}`}
                    className={`sidebar-item ${
                      currentPage === item.page
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      navigate(item.page, item.member)
                    }
                  >
                    <Icon size={19} />

                    <span>{item.label}</span>

                    {item.member && (
                      <Lock
                        size={13}
                        className="menu-lock"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="sidebar-bottom">
          <button
            className="sidebar-item logout-button"
            onClick={logout}
          >
            <LogOut size={19} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}


function SchemeTypeTabs({ value, onChange, nationalCount, stateCount }) {
  const options = [
    { id: "National", label: `All-India Schemes (${nationalCount})` },
    { id: "State", label: `State-Specific Schemes (${stateCount})` },
  ];

  return (
    <div className="scheme-type-tabs" style={{ display: "flex", gap: 10, flexWrap: "wrap", margin: "18px 0 22px" }} role="tablist" aria-label="Scheme coverage">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          role="tab"
          aria-selected={value === option.id}
          className={`btn ${value === option.id ? "btn-primary" : "btn-outline"}`}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function ScholarshipTypeTabs({ value, onChange, nationalCount, stateCount }) {
  const options = [
    { id: "National", label: `All-India Scholarships (${nationalCount})` },
    { id: "State", label: `State-Specific Scholarships (${stateCount})` },
  ];

  return (
    <div className="scheme-type-tabs" style={{ display: "flex", gap: 10, flexWrap: "wrap", margin: "18px 0 22px" }} role="tablist" aria-label="Scholarship coverage">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          role="tab"
          aria-selected={value === option.id}
          className={`btn ${value === option.id ? "btn-primary" : "btn-outline"}`}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/* =========================================================
   PUBLIC CONTENT
========================================================= */

function PublicContent({ currentPage, navigate, setAuthModal, openMemberFeature, search, setSearch, addToCart, cart, clearCart, removeCartItem }) {
  if (currentPage === "marketplace" || currentPage === "checkout") {
    return <MarketplacePage currentPage={currentPage} authenticated={false} navigate={navigate} search={search} setSearch={setSearch} addToCart={addToCart} cart={cart} clearCart={clearCart} removeCartItem={removeCartItem} setAuthModal={setAuthModal} />;
  }
  return <PublicHome setAuthModal={setAuthModal} navigate={navigate} openMemberFeature={openMemberFeature} />;
}

/* =========================================================
   PUBLIC HOME
========================================================= */

function PublicHome({ setAuthModal, navigate, openMemberFeature }) {
  // Keep the public landing page focused on four previews.
  // Marketplace is open to everyone; the other sections remain behind member access.
  const previewFeatures = [
    publicFeatures.find((feature) => feature.page === "marketplace"),
    publicFeatures.find((feature) => feature.page === "schemes"),
    publicFeatures.find((feature) => feature.page === "scholarships"),
    memberFeatures.find((feature) => feature.page === "members"),
  ].filter(Boolean);

  return (
    <main className="premium-landing">
      <style>{`
        .premium-landing {
          --clay:#b65f43; --clay-dark:#88432f; --ink:#2e261f;
          --muted:#786d62; --cream:#fbf6ee; --paper:#fffdf9; --sage:#596c55;
          color:var(--ink); background:var(--cream); overflow:hidden;
          font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;
        }
        .premium-landing *{box-sizing:border-box}
        .premium-landing button{font:inherit}
        .premium-wrap{width:min(1180px,calc(100% - 48px));margin:0 auto}
        .premium-hero{position:relative;isolation:isolate;padding:74px 0 68px;background:
          radial-gradient(ellipse at 78% 30%,rgba(224,177,125,.32),transparent 33%),
          radial-gradient(ellipse at 90% 100%,rgba(185,95,67,.12),transparent 35%),
          linear-gradient(135deg,#fbf7f0,#f3e7d7 58%,#faf2e7);border-bottom:1px solid #eadfd1}
        .premium-hero:before{content:"";position:absolute;inset:0;z-index:-1;opacity:.17;
          background-image:radial-gradient(#9b765b .7px,transparent .7px);background-size:18px 18px}
        .premium-hero-grid{display:grid;grid-template-columns:1.05fr .95fr;gap:52px;align-items:center}
        .premium-eyebrow{display:inline-flex;align-items:center;gap:9px;padding:9px 13px;
          border:1px solid #d9b7a2;border-radius:999px;background:#fff9f0;color:var(--clay-dark);
          font-size:10px;font-weight:850;letter-spacing:.15em;text-transform:uppercase}
        .premium-dot{width:7px;height:7px;border-radius:50%;background:var(--clay);box-shadow:0 0 0 4px #b65f4320}
        .premium-hero h1{max-width:650px;margin:23px 0 18px;font-family:Georgia,"Times New Roman",serif;
          font-size:clamp(43px,5.5vw,72px);line-height:1.01;letter-spacing:-.055em;font-weight:500}
        .premium-hero h1 em{display:block;color:var(--clay);font-weight:500}
        .premium-copy{max-width:530px;margin:0;color:var(--muted);font-size:15px;line-height:1.9}
        .premium-actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:28px}
        .premium-btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:49px;
          padding:0 20px;border:1px solid transparent;border-radius:12px;cursor:pointer;text-decoration:none;
          font-size:12px;font-weight:800;transition:transform .2s,box-shadow .2s,background .2s}
        .premium-btn:hover{transform:translateY(-2px)}
        .premium-primary{color:#fffaf4;background:linear-gradient(135deg,#bd684a,#93462f);
          box-shadow:0 10px 24px #92432c35}
        .premium-primary:hover{box-shadow:0 14px 28px #92432c48}
        .premium-secondary{color:#47382e;background:#ffffffa8;border-color:#5b422e2b}
        .premium-security{display:flex;align-items:center;gap:9px;margin-top:19px;color:#817367;font-size:11px}
        .premium-security svg{color:var(--sage);flex:none}
        .premium-art{min-height:370px;position:relative;display:grid;place-items:center;border-radius:30px;overflow:hidden;
          background:linear-gradient(145deg,#ffffffa6,#efdcc666);border:1px solid #ffffffd9;
          box-shadow:0 24px 70px #5336221a,inset 0 1px #ffffffcc}
        .premium-art:before,.premium-art:after{content:"";position:absolute;border:1px solid #a66c4b30;border-radius:50%}
        .premium-art:before{width:340px;height:340px}.premium-art:after{width:260px;height:260px}
        .premium-sun{position:absolute;width:230px;height:230px;top:32px;right:35px;border-radius:50%;
          background:linear-gradient(135deg,#e7c49b,#d99a6d);opacity:.48}
        .premium-vase{position:relative;z-index:1;width:175px;height:218px;filter:drop-shadow(0 22px 15px #5c362d30);
          animation:potter-float 5s ease-in-out infinite}
        .premium-vase svg{width:100%;height:100%;overflow:visible}
        .premium-orbit{position:absolute;z-index:3;display:flex;align-items:center;gap:10px;padding:12px 14px;
          border-radius:14px;background:#fffdf9ed;border:1px solid #ffffffeb;box-shadow:0 12px 28px #47302020;
          animation:potter-float 5s ease-in-out infinite}
        .premium-orbit.one{top:38px;left:16px}.premium-orbit.two{top:125px;right:12px;animation-delay:-2s}
        .premium-orbit-icon{display:grid;place-items:center;width:32px;height:32px;border-radius:10px;color:#8c4c35;background:#f5e4d5}
        .premium-orbit strong{display:block;font-size:11px}.premium-orbit span{display:block;margin-top:3px;color:#84766b;font-size:10px}
        .premium-art-label{position:absolute;z-index:2;bottom:22px;left:22px;right:22px;display:flex;align-items:center;
          justify-content:space-between;gap:12px;padding:13px 15px;border-radius:15px;background:#fffdf9e8;
          border:1px solid #ffffffdb;backdrop-filter:blur(12px)}
        .premium-art-label strong{display:block;font:600 17px Georgia,serif}.premium-art-label span{display:block;margin-top:3px;color:var(--muted);font-size:10px}
        .premium-art-seal{display:grid;place-items:center;width:40px;height:40px;flex:none;border-radius:13px;color:var(--clay-dark);background:#f5e6d6}
        .premium-trust{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:#5d453020;border-bottom:1px solid #e9ddce}
        .premium-trust-item{display:flex;align-items:center;justify-content:center;gap:10px;padding:20px 12px;background:#fffaf3;color:#55473b;font-size:11px;font-weight:800}
        .premium-trust-item svg{color:var(--clay)}
        .premium-benefits{padding:78px 0 84px}
        .premium-heading{max-width:680px;margin:0 auto 34px;text-align:center}
        .premium-kicker{color:var(--clay);font-size:10px;font-weight:900;letter-spacing:.19em;text-transform:uppercase}
        .premium-heading h2{margin:12px 0;font:500 clamp(31px,4vw,46px)/1.12 Georgia,serif;letter-spacing:-.035em}
        .premium-heading p{margin:0;color:var(--muted);font-size:13px;line-height:1.85}
        .premium-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
        .premium-card{position:relative;min-width:0;text-align:left;padding:22px;border:1px solid #5b412d20;border-radius:19px;
          background:#fffdf9ed;color:inherit;cursor:pointer;box-shadow:0 4px 14px #402c1e08;overflow:hidden;
          transition:transform .22s,box-shadow .22s,border-color .22s}
        .premium-card:before{content:"";position:absolute;width:100px;height:100px;top:-50px;right:-40px;border-radius:50%;
          background:#b95f430f;transition:transform .25s}
        .premium-card:hover{transform:translateY(-5px);border-color:#b95f4350;box-shadow:0 18px 34px #402c1e16}
        .premium-card:hover:before{transform:scale(1.5)}
        .premium-card-top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
        .premium-icon{display:grid;place-items:center;width:48px;height:48px;border-radius:15px;color:#934c35;
          background:linear-gradient(145deg,#f7e7d7,#f2d8c2);box-shadow:inset 0 1px #ffffffd9}
        .premium-lock{display:inline-flex;align-items:center;gap:5px;white-space:nowrap;padding:6px 8px;border-radius:999px;
          color:#79654f;background:#f5eee4;font-size:9px;font-weight:900;letter-spacing:.04em;text-transform:uppercase}
        .premium-free-pill{color:#4e6848;background:#eaf0e4}
        .premium-card h3{margin:19px 0 8px;font-size:15px;letter-spacing:-.02em;font-weight:850}
        .premium-card p{min-height:48px;margin:0;color:var(--muted);font-size:11px;line-height:1.75}
        .premium-card-footer{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:18px;padding-top:14px;
          border-top:1px solid #5b412d18;color:var(--clay-dark);font-size:10px;font-weight:900}
        .premium-card-footer svg{transition:transform .2s}.premium-card:hover .premium-card-footer svg{transform:translateX(4px)}
        .premium-memories{padding:64px 0 72px;background:linear-gradient(180deg,#fbf6ee 0%,#f7ecdf 100%);border-top:1px solid #eadfd1;border-bottom:1px solid #eadfd1;overflow:hidden}
        .premium-memories-head{width:min(1180px,calc(100% - 48px));margin:0 auto 26px;display:flex;align-items:flex-end;justify-content:space-between;gap:18px}
        .premium-memories-head h2{margin:9px 0 7px;font:500 clamp(28px,3.4vw,40px)/1.12 Georgia,serif;letter-spacing:-.035em;color:var(--ink)}
        .premium-memories-head p{max-width:560px;margin:0;color:var(--muted);font-size:12px;line-height:1.8}
        .premium-memories-note{flex:none;color:var(--clay-dark);font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
        .premium-memory-window{width:100%;overflow:hidden;position:relative;mask-image:linear-gradient(90deg,transparent,#000 4%,#000 96%,transparent)}
        .premium-memory-track{display:flex;width:max-content;gap:18px;padding:8px 0;animation:premium-memory-scroll 48s linear infinite;will-change:transform}
        .premium-memory-window:hover .premium-memory-track,.premium-memory-window:focus-within .premium-memory-track{animation-play-state:paused}
        .premium-memory-card{position:relative;flex:0 0 300px;height:218px;overflow:hidden;border:1px solid #d9c0aa;border-radius:19px;background:#e8d7c7;box-shadow:0 12px 28px #51352212}
        .premium-memory-card img{display:block;width:100%;height:100%;object-fit:cover;transition:transform .45s ease}
        .premium-memory-card:hover img{transform:scale(1.06)}
        .premium-memory-card:after{content:"";position:absolute;inset:35% 0 0;background:linear-gradient(transparent,#20150fd9)}
        .premium-memory-caption{position:absolute;z-index:1;left:16px;right:16px;bottom:15px;color:#fffaf4}
        .premium-memory-caption strong{display:block;font-size:13px;font-weight:850;letter-spacing:.01em}
        .premium-memory-caption span{display:block;margin-top:4px;color:#fffaf4d9;font-size:10px}
        @keyframes premium-memory-scroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        .premium-how{padding:0 0 80px}
        .premium-how-panel{display:grid;grid-template-columns:.9fr 1.1fr;gap:35px;align-items:center;padding:36px;border-radius:24px;
          color:#fff6eb;background:linear-gradient(125deg,#352c24,#49372c 54%,#6c4332);box-shadow:0 18px 42px #31241b22}
        .premium-how-panel h2{margin:12px 0;font:500 clamp(28px,3vw,39px)/1.12 Georgia,serif;letter-spacing:-.035em}
        .premium-how-panel p{margin:0;max-width:390px;color:#fff6ebba;font-size:12px;line-height:1.85}
        .premium-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
        .premium-step{min-height:142px;padding:17px 14px;border-radius:16px;border:1px solid #ffffff24;background:#ffffff0e}
        .premium-step-num{color:#e2a17e;font:25px Georgia,serif}.premium-step strong{display:block;margin:13px 0 7px;font-size:11px}
        .premium-step span{display:block;color:#fff6eba8;font-size:10px;line-height:1.7}
        .premium-cta{position:relative;overflow:hidden;padding:47px 0;color:#fff8ef;background:linear-gradient(115deg,#c16b4d,#98472f)}
        .premium-cta:after{content:"";position:absolute;width:300px;height:300px;right:7%;top:-170px;border:1px solid #ffffff2a;border-radius:50%;
          box-shadow:0 0 0 35px #ffffff09,0 0 0 70px #ffffff06;pointer-events:none}
        .premium-cta-inner{position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;gap:28px}
        .premium-cta h2{max-width:650px;margin:9px 0;font:500 clamp(28px,3.5vw,42px)/1.1 Georgia,serif;letter-spacing:-.03em}
        .premium-cta p{margin:0;color:#fff8efcc;font-size:12px;line-height:1.7}
        .premium-cta .premium-btn{flex:none;background:#fff8ef;color:#8b422d;box-shadow:0 10px 25px #451f1329}
        .premium-footnote{padding:21px 12px;text-align:center;color:#8b7b6e;background:#f8f1e7;font-size:10px}
        @keyframes potter-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @media(max-width:900px){.premium-hero-grid{grid-template-columns:1fr .85fr;gap:24px}.premium-art{min-height:330px}.premium-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.premium-how-panel{grid-template-columns:1fr}}
        @media(max-width:640px){
          .premium-wrap{width:calc(100% - 30px)}.premium-hero{padding:42px 0 34px}.premium-hero-grid{grid-template-columns:1fr;gap:28px}
          .premium-hero h1{font-size:clamp(41px,12vw,56px)}.premium-copy{font-size:13px}.premium-art{min-height:305px;border-radius:23px}
          .premium-vase{width:145px;height:185px}.premium-orbit.one{top:20px;left:8px}.premium-orbit.two{top:100px;right:7px}
          .premium-trust{grid-template-columns:repeat(2,1fr)}.premium-trust-item{justify-content:flex-start;padding:14px 12px;font-size:10px}
          .premium-benefits{padding:56px 0}.premium-grid{grid-template-columns:1fr;gap:12px}.premium-card{padding:19px}.premium-card p{min-height:0}
          .premium-how{padding-bottom:55px}.premium-how-panel{padding:24px 18px;gap:23px}.premium-steps{grid-template-columns:1fr}
          .premium-memories{padding:46px 0 52px}.premium-memories-head{width:calc(100% - 30px);display:block;margin-bottom:18px}.premium-memories-note{display:inline-block;margin-top:12px}.premium-memory-card{flex-basis:250px;height:190px}.premium-memory-track{gap:12px}
          .premium-step{min-height:auto}.premium-step strong{margin-top:8px}.premium-cta{padding:36px 0}
          .premium-cta-inner{align-items:flex-start;flex-direction:column}.premium-cta .premium-btn{width:100%}
        }
        @media(prefers-reduced-motion:reduce){.premium-landing *,.premium-landing *:before,.premium-landing *:after{animation-duration:.01ms!important;transition-duration:.01ms!important}.premium-memory-window{overflow-x:auto;mask-image:none}.premium-memory-track{animation:none}}
      `}</style>

      <section className="premium-hero">
        <div className="premium-wrap premium-hero-grid">
          <div>
            <div className="premium-eyebrow"><span className="premium-dot" /> A community shaped by tradition</div>
            <h1>Rooted in craft.<em>Stronger together.</em></h1>
            <p className="premium-copy">
              A dedicated space for the Potter Community to connect, grow livelihoods,
              discover opportunities and carry a timeless craft into the future.
            </p>
            <div className="premium-actions">
              <button className="premium-btn premium-primary" onClick={() => setAuthModal("signup")}>
                Request membership <ArrowRight size={17} />
              </button>
              <a className="premium-btn premium-secondary" href="#member-benefits">
                Discover member benefits <ChevronRight size={17} />
              </a>
            </div>
            <div className="premium-security"><ShieldCheck size={16} /> Member spaces unlock after membership verification.</div>
          </div>

          <div className="premium-art" aria-label="Decorative pottery illustration">
            <div className="premium-sun" />
            <div className="premium-orbit one"><div className="premium-orbit-icon"><ShieldCheck size={17} /></div><div><strong>Verified community</strong><span>Built on trust</span></div></div>
            <div className="premium-orbit two"><div className="premium-orbit-icon"><ShoppingBag size={17} /></div><div><strong>Artisan marketplace</strong><span>Made by the community</span></div></div>
            <div className="premium-vase">
              <svg viewBox="0 0 200 250" role="img" aria-label="Handcrafted terracotta vase">
                <defs>
                  <linearGradient id="potterVaseGradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#d98d63" /><stop offset="48%" stopColor="#b85e40" /><stop offset="100%" stopColor="#85402f" />
                  </linearGradient>
                  <linearGradient id="potterVaseHighlight" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#fff0dc" stopOpacity=".55" /><stop offset="100%" stopColor="#fff0dc" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <ellipse cx="100" cy="232" rx="64" ry="9" fill="#7e5138" opacity=".16" />
                <path d="M77 24 C79 42 79 48 66 61 C48 80 38 104 43 145 C48 190 65 218 100 222 C135 218 152 190 157 145 C162 104 152 80 134 61 C121 48 121 42 123 24 Z" fill="url(#potterVaseGradient)" />
                <path d="M77 24 C79 42 79 48 66 61 C48 80 38 104 43 145 C48 190 65 218 100 222 C135 218 152 190 157 145 C162 104 152 80 134 61 C121 48 121 42 123 24 Z" fill="url(#potterVaseHighlight)" />
                <path d="M75 23 Q100 17 125 23 L122 34 Q100 40 78 34 Z" fill="#8b402d" /><ellipse cx="100" cy="23" rx="25" ry="7" fill="#e6ad83" /><ellipse cx="100" cy="24" rx="18" ry="4" fill="#77402e" />
                <path d="M45 126 Q100 139 155 126 M43 139 Q100 152 157 139 M47 153 Q100 166 153 153" fill="none" stroke="#f3c49d" strokeWidth="2.2" opacity=".52" />
                <path d="M64 79 Q100 91 136 79" fill="none" stroke="#f3c49d" strokeWidth="2" opacity=".45" /><path d="M47 177 Q100 188 153 177" fill="none" stroke="#6f3528" strokeWidth="2" opacity=".35" />
                <path d="M60 75 C48 102 50 166 71 198" fill="none" stroke="#fff0dc" strokeWidth="5" strokeLinecap="round" opacity=".22" />
              </svg>
            </div>
            <div className="premium-art-label"><div><strong>Tradition with a future</strong><span>Preserving craft. Opening doors.</span></div><div className="premium-art-seal"><Sparkles size={19} /></div></div>
          </div>
        </div>
      </section>

      <div className="premium-trust">
        <div className="premium-trust-item"><ShieldCheck size={18} /> Verified member access</div>
        <div className="premium-trust-item"><Landmark size={18} /> Scheme & benefit discovery</div>
        <div className="premium-trust-item"><Users size={18} /> Community connections</div>
        <div className="premium-trust-item"><HeartPulse size={18} /> Support when it matters</div>
      </div>

      <section className="premium-benefits" id="member-benefits">
        <div className="premium-wrap">
          <div className="premium-heading">
            <span className="premium-kicker">Inside the community</span>
            <h2>Everything you need, in one place.</h2>
            <p>Membership brings the community’s tools and opportunities together. Explore what’s included — every section opens for verified members.</p>
          </div>
          <div className="premium-grid">
            {previewFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <button className="premium-card" key={feature.page} onClick={() => feature.page === "marketplace" ? navigate("marketplace") : openMemberFeature(feature.page)}
                  aria-label={feature.page === "marketplace" ? "Browse the public pottery marketplace" : `${feature.title}. Become a member to unlock this feature.`}>
                  <div className="premium-card-top">
                    <div className="premium-icon"><Icon size={22} /></div>
                    {feature.page === "marketplace" ? (
                      <span className="premium-lock premium-free-pill"><ShoppingBag size={11} /> Free for everyone</span>
                    ) : (
                      <span className="premium-lock"><Lock size={11} /> Member access</span>
                    )}
                  </div>
                  <h3>{feature.title}</h3><p>{feature.description}</p>
                  <div className="premium-card-footer"><span>Unlock with membership</span><ArrowRight size={16} /></div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="premium-how">
        <div className="premium-wrap">
          <div className="premium-how-panel">
            <div>
              <span className="premium-kicker" style={{ color: "#e7ae8b" }}>Your next step</span>
              <h2>Join the people behind the craft.</h2>
              <p>Request membership, complete the verification process, and unlock community tools designed to help you connect and move forward.</p>
            </div>
            <div className="premium-steps">
              <div className="premium-step"><div className="premium-step-num">01</div><strong>Request access</strong><span>Submit your membership details.</span></div>
              <div className="premium-step"><div className="premium-step-num">02</div><strong>Get verified</strong><span>Your request is reviewed by the community.</span></div>
              <div className="premium-step"><div className="premium-step-num">03</div><strong>Explore more</strong><span>Access member features once approved.</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="premium-memories" aria-label="Pottery community memories">
        <div className="premium-memories-head">
          <div>
            <span className="premium-kicker">Moments made together</span>
            <h2>Memories shaped by clay & community.</h2>
            <p>Discover the joy of learning, creating and sharing through pottery activities and artisan workshops.</p>
          </div>
          <span className="premium-memories-note">Indian pottery traditions · Sample gallery</span>
        </div>
        <div className="premium-memory-window" tabIndex={0} aria-label="Moving gallery. Hover or focus to pause.">
          <div className="premium-memory-track">
            {[
              {
                image: "https://anandfoundation.com/wp-content/uploads/2016/07/20160624_155455-scaled.jpg",
                title: "Potters working together in Kumhar Gram",
                detail: "Traditional wheel and diya-making · Photo: Anand Foundation",
              },
              {
                image: "https://media.assettype.com/indiawaterportal/2025-04-16/zymjdtjh/IMG20250207130443.jpg?auto=format%2Ccompress&fit=max&w=1000",
                title: "Preparing the kiln in rural Bihar",
                detail: "Babita Devi preparing a pottery furnace · Photo: Sharat Chandra Prasad / India Water Portal",
              },
              {
                image: "https://flows.hypotheses.org/files/2021/10/brahmaputra-2.jpg",
                title: "Women shaping clay by hand",
                detail: "Traditional pottery along the Brahmaputra · Photo: FLOWs",
              },
              {
                image: "https://cf-images.assettype.com/TNIE/import/2022/9/18/original/whrrr.JPG?auto=format%2Ccompress&fit=max&w=1000",
                title: "Keeping Narayanapura’s pottery alive",
                detail: "Artisans from a pottery village near Bengaluru · Photo: The New Indian Express",
              },
              {
                image: "https://www.alphonsostories.com/AlphonSoStoriesImages/downloads/Traditional-Indian-potter-making-clay-pot.jpg",
                title: "A village potter at the wheel",
                detail: "Hand-shaping an earthen vessel · Photo: AlphonSoStories",
              },
              {
                image: "https://angadi.co/cdn/shop/files/Clay-Cooking-Pot-Zishta-7345-277571_c4b519e1-dd9c-4917-9c20-94fe30f52fd9.jpg?v=1736205295&width=1445",
                title: "Traditional pottery in an Indian courtyard",
                detail: "Local artisans shaping clay vessels · Photo: Angadi / Zishta",
              },
            ].concat([
              {
                image: "https://anandfoundation.com/wp-content/uploads/2016/07/20160624_155455-scaled.jpg",
                title: "Potters working together in Kumhar Gram",
                detail: "Traditional wheel and diya-making · Photo: Anand Foundation",
              },
              {
                image: "https://media.assettype.com/indiawaterportal/2025-04-16/zymjdtjh/IMG20250207130443.jpg?auto=format%2Ccompress&fit=max&w=1000",
                title: "Preparing the kiln in rural Bihar",
                detail: "Babita Devi preparing a pottery furnace · Photo: Sharat Chandra Prasad / India Water Portal",
              },
              {
                image: "https://flows.hypotheses.org/files/2021/10/brahmaputra-2.jpg",
                title: "Women shaping clay by hand",
                detail: "Traditional pottery along the Brahmaputra · Photo: FLOWs",
              },
              {
                image: "https://cf-images.assettype.com/TNIE/import/2022/9/18/original/whrrr.JPG?auto=format%2Ccompress&fit=max&w=1000",
                title: "Keeping Narayanapura’s pottery alive",
                detail: "Artisans from a pottery village near Bengaluru · Photo: The New Indian Express",
              },
              {
                image: "https://www.alphonsostories.com/AlphonSoStoriesImages/downloads/Traditional-Indian-potter-making-clay-pot.jpg",
                title: "A village potter at the wheel",
                detail: "Hand-shaping an earthen vessel · Photo: AlphonSoStories",
              },
              {
                image: "https://angadi.co/cdn/shop/files/Clay-Cooking-Pot-Zishta-7345-277571_c4b519e1-dd9c-4917-9c20-94fe30f52fd9.jpg?v=1736205295&width=1445",
                title: "Traditional pottery in an Indian courtyard",
                detail: "Local artisans shaping clay vessels · Photo: Angadi / Zishta",
              },
            ]).map((memory, index) => (
              <article className="premium-memory-card" key={`memory-${index}`} aria-hidden={index >= 6}>
                <img
                  src={memory.image}
                  alt={index >= 6 ? "" : memory.title}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={(event) => {
                    event.currentTarget.style.visibility = "hidden";
                  }}
                />
                <div className="premium-memory-caption">
                  <strong>{memory.title}</strong>
                  <span>{memory.detail}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="premium-cta">
        <div className="premium-wrap premium-cta-inner">
          <div>
            <span className="premium-kicker" style={{ color: "#f5c4a8" }}>Become part of something lasting</span>
            <h2>Your craft deserves a connected community.</h2>
            <p>Join the Potter Community and discover what we can build together.</p>
          </div>
          <button className="premium-btn" onClick={() => setAuthModal("signup")}>Request membership <ArrowRight size={17} /></button>
        </div>
      </section>
      <footer className="premium-footnote">Potter Community · Connect with tradition. Grow together. · Member features are available after verification.</footer>
    </main>
  );
}

const MARKETPLACE_CATEGORIES = [
  "All pottery",
  "Home & décor",
  "Planters",
  "Tableware",
  "Traditional craft",
  "Idols",
  "Marriage",
  "Other pottery",
];

// Clearly labelled sample listings used to demonstrate each marketplace section.
// These are not real sellers' listings and are deliberately excluded from ordering.
const DEMO_MARKET_PRODUCTS = [
  {
    id: "demo-home-1",
    name: "Handcrafted Terracotta Vase",
    category: "Home & décor",
    description: "A warm terracotta accent piece for shelves, living rooms and entryways.",
    price: 450,
    image: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=900&q=85",
    seller_name: "Sample artisan",
    isDemo: true,
  },
  {
    id: "demo-home-2",
    name: "Decorative Ceramic Vase",
    category: "Home & décor",
    description: "A simple handcrafted ceramic vase for everyday home styling.",
    price: 620,
    image: "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?auto=format&fit=crop&w=900&q=85",
    seller_name: "Sample artisan",
    isDemo: true,
  },
  {
    id: "demo-planter-1",
    name: "Classic Clay Planter",
    category: "Planters",
    description: "A natural clay planter for balcony, garden and indoor plants.",
    price: 250,
    image: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=900&q=85",
    seller_name: "Sample artisan",
    isDemo: true,
  },
  {
    id: "demo-planter-2",
    name: "Handmade Tabletop Planter",
    category: "Planters",
    description: "A compact planter with a handcrafted finish for small spaces.",
    price: 320,
    image: "https://images.unsplash.com/photo-1497250681960-ef046c08a56e?auto=format&fit=crop&w=900&q=85",
    seller_name: "Sample artisan",
    isDemo: true,
  },
  {
    id: "demo-tableware-1",
    name: "Rustic Ceramic Bowl Set",
    category: "Tableware",
    description: "A coordinated set of handmade bowls for serving and dining.",
    price: 650,
    image: "https://images.unsplash.com/photo-1576021182211-9ea8d8d9f45c?auto=format&fit=crop&w=900&q=85",
    seller_name: "Sample artisan",
    isDemo: true,
  },
  {
    id: "demo-tableware-2",
    name: "Handmade Clay Dinner Plate",
    category: "Tableware",
    description: "A handcrafted plate with a natural earthy finish.",
    price: 380,
    image: "https://images.unsplash.com/photo-1493106641515-6b5631de4bb9?auto=format&fit=crop&w=900&q=85",
    seller_name: "Sample artisan",
    isDemo: true,
  },
  {
    id: "demo-craft-1",
    name: "Traditional Terracotta Artwork",
    category: "Traditional craft",
    description: "Decorative clay artwork inspired by traditional pottery techniques.",
    price: 550,
    image: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=900&q=85",
    seller_name: "Sample artisan",
    isDemo: true,
  },
  {
    id: "demo-idol-1",
    name: "Handcrafted Clay Idol",
    category: "Idols",
    description: "A decorative clay idol crafted in a traditional artisan style.",
    price: 800,
    image: "https://images.unsplash.com/photo-1572119865084-43c285814d63?auto=format&fit=crop&w=900&q=85",
    seller_name: "Sample artisan",
    isDemo: true,
  },
  {
    id: "demo-marriage-1",
    name: "Wedding Kalash Set",
    category: "Marriage",
    description: "A decorative terracotta kalash set for wedding ceremonies and rituals.",
    price: 950,
    image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=900&q=85",
    seller_name: "Sample artisan",
    isDemo: true,
  },
  {
    id: "demo-other-1",
    name: "Artisan Clay Decorative Piece",
    category: "Other pottery",
    description: "A unique handmade clay piece suitable for gifting and display.",
    price: 400,
    image: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=900&q=85",
    seller_name: "Sample artisan",
    isDemo: true,
  },
];

/* =========================================================
   MARKETPLACE — FREE PUBLIC BROWSING
========================================================= */
function MarketplacePage({ currentPage = "marketplace", authenticated, navigate, search, setSearch, addToCart, cart, clearCart = () => {}, removeCartItem = () => {}, setAuthModal, activeUser = null }) {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [marketNotice, setMarketNotice] = useState("");
  const [productBusy, setProductBusy] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [productDraft, setProductDraft] = useState({ name: "", description: "", category: "Home & décor", price: "", image_url: "" });
  const [productImageFile, setProductImageFile] = useState(null);
  const [productImagePreview, setProductImagePreview] = useState("");
  const [orders, setOrders] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("All pottery");
  const [sortOrder, setSortOrder] = useState("newest");
  // Keep buying and selling as separate marketplace experiences.
  const [activeMarketMode, setActiveMarketMode] = useState("purchase");
  const [buyerDetails, setBuyerDetails] = useState({ name: activeUser?.full_name || "", phone: activeUser?.phone_number || "", email: activeUser?.email || "", address: "" });
  const canManage = authenticated && (
    ["ADMIN", "SUPER ADMIN"].includes(String(activeUser?.role || "").toUpperCase())
    || activeUser?.permissions?.includes("marketplace.manage")
  );
  const isApprovedMember = authenticated && String(activeUser?.membership_status || "").toUpperCase() === "APPROVED";
  const canPublish = isApprovedMember;
  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      const rows = await authApi("/marketplace/products");
      setProducts(Array.isArray(rows) ? rows : []);
    } catch (error) {
      setMarketNotice(error.message || "Could not load marketplace listings.");
    } finally {
      setLoadingProducts(false);
    }
  };
  const loadOrders = async () => {
    if (!authenticated) return;
    try {
      const rows = await authApi(canManage || isApprovedMember ? "/marketplace/seller-orders" : "/marketplace/orders");
      setOrders(Array.isArray(rows) ? rows : []);
    } catch {
      // Keep shopping usable when order history is not available.
    }
  };
  useEffect(() => { loadProducts(); loadOrders(); }, [authenticated, canManage, isApprovedMember]);
  const saveProduct = async (event) => {
    event.preventDefault();
    setProductBusy(true);
    setMarketNotice("");
    try {
      let imageUrl = productDraft.image_url.trim() || null;
      if (productImageFile) {
        const imageForm = new FormData();
        imageForm.append("file", productImageFile);
        const uploadedImage = await authApi("/marketplace/upload-image", { method: "POST", body: imageForm });
        imageUrl = uploadedImage.image_url;
      }
      await authApi(editingProductId ? `/marketplace/products/${editingProductId}` : "/marketplace/products", {
        method: editingProductId ? "PATCH" : "POST",
        body: JSON.stringify({ ...productDraft, price: Number(productDraft.price), image_url: imageUrl }),
      });
      setProductDraft({ name: "", description: "", category: "Home & décor", price: "", image_url: "" });
      setProductImageFile(null);
      setProductImagePreview("");
      setEditingProductId(null);
      setMarketNotice(editingProductId ? "Listing updated." : "Your listing is now visible in the marketplace.");
      await loadProducts();
    } catch (error) {
      setMarketNotice(error.message || "Could not save this listing.");
    } finally {
      setProductBusy(false);
    }
  };
  const editProduct = (product) => {
    setActiveMarketMode("sell");
    setEditingProductId(product.id);
    setProductImageFile(null);
    setProductImagePreview(product.image ? resolveProductImage(product.image) : "");
    setProductDraft({ name: product.name, description: product.description, category: product.category, price: String(product.price), image_url: product.image || "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const resolveProductImage = (image) => image && image.startsWith("/") ? `${AUTH_API_BASE}${image}` : image;
  const groupedCart = Object.values(cart.reduce((groups, item) => {
    const key = String(item.id);
    if (!groups[key]) groups[key] = { ...item, quantity: 0 };
    groups[key].quantity += 1;
    return groups;
  }, {}));
  const cartSubtotal = groupedCart.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0);
  const resetProductForm = () => {
    setEditingProductId(null);
    setProductDraft({ name: "", description: "", category: "Home & décor", price: "", image_url: "" });
    setProductImageFile(null);
    setProductImagePreview("");
  };
  const removeProduct = async (product) => {
    if (!window.confirm(`Remove “${product.name}” from the marketplace?`)) return;
    try {
      await authApi(`/marketplace/products/${product.id}`, { method: "DELETE" });
      setMarketNotice("Listing removed.");
      await loadProducts();
    } catch (error) {
      setMarketNotice(error.message || "Could not remove this listing.");
    }
  };
  const placeOrder = async () => {
    if (!buyerDetails.name.trim() || buyerDetails.phone.replace(/\D/g, "").length < 10 || buyerDetails.address.trim().length < 8) {
      setMarketNotice("Enter your name, a valid phone number, and delivery address to place the order.");
      return;
    }
    const quantities = cart.reduce((result, item) => {
      result[item.id] = (result[item.id] || 0) + 1;
      return result;
    }, {});
    try {
      const order = await authApi("/marketplace/orders", {
        method: "POST",
        body: JSON.stringify({
          items: Object.entries(quantities).map(([product_id, quantity]) => ({ product_id: Number(product_id), quantity })),
          buyer_name: buyerDetails.name.trim(), buyer_phone: buyerDetails.phone.trim(),
          buyer_email: buyerDetails.email.trim() || null, delivery_address: buyerDetails.address.trim(),
        }),
      });
      clearCart();
      setMarketNotice(`Order request #${order.id} submitted. Total: ₹${Number(order.total_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}. The artisan will contact you to arrange payment and delivery.`);
      await loadOrders();
    } catch (error) {
      setMarketNotice(error.message || "Could not submit your order request. Please refresh listings and retry.");
      await loadProducts();
    }
  };
  if (currentPage === "checkout") {
    return (
      <PageWrapper>
        <style>{`
          .market-checkout-page{width:min(1220px,calc(100% - 48px));max-width:1220px;margin:0 auto;padding:24px 0 40px;color:#503326}
          .market-checkout-heading{display:flex;align-items:center;justify-content:space-between;gap:18px;margin:0 0 24px;padding:25px 28px;border:1px solid #ead8c8;border-radius:22px;background:radial-gradient(circle at 90% 0%,rgba(225,190,160,.3),transparent 36%),linear-gradient(135deg,#fffdf9,#fbf1e8);box-shadow:0 12px 30px rgba(80,51,38,.07)}
          .market-checkout-heading h1{margin:9px 0 6px;color:#382b21;font:600 36px Georgia,serif;letter-spacing:-.7px}
          .market-checkout-heading p{margin:0;color:#806b5e;font-size:13px;line-height:1.7}
          .market-checkout-heading>.btn{min-height:42px;padding:0 17px;border-radius:999px;background:#fffaf5}
          .market-checkout-layout{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(330px,.82fr);gap:24px;align-items:start}
          .market-checkout-items,.market-checkout-summary{min-width:0;padding:25px;border:1px solid #ead9ca;border-radius:21px;background:linear-gradient(180deg,#fffefa,#fffaf5);box-shadow:0 12px 32px rgba(80,51,38,.07)}
          .market-checkout-items h2,.market-checkout-summary h2{display:flex;align-items:center;justify-content:space-between;margin:0 0 20px;color:#503326;font-size:17px;font-weight:850;letter-spacing:-.2px}
          .market-checkout-items h2 span{padding:6px 10px;border-radius:999px;background:#f5e8dc;color:#8a5a43;font-size:11px;font-weight:700}
          .market-checkout-row{display:grid;grid-template-columns:88px minmax(0,1fr) auto auto;align-items:center;gap:16px;padding:19px 0;border-top:1px solid #efe4da}
          .market-checkout-thumb{width:88px;height:88px;display:grid;place-items:center;overflow:hidden;border:1px solid #efdfd1;border-radius:15px;background:#f6e9df;color:#a95338}
          .market-checkout-thumb img{width:100%;height:100%;object-fit:cover}
          .market-checkout-product{display:flex;min-width:0;flex-direction:column;gap:6px}
          .market-checkout-product strong{color:#503326;font-size:14px;font-weight:800}
          .market-checkout-product small{color:#9a7865;font-size:10px;text-transform:uppercase;letter-spacing:.07em}
          .market-checkout-product span{color:#806b5e;font-size:12px}
          .market-checkout-row .market-quantity-control{display:flex;align-items:center;gap:10px;padding:5px;border:1px solid #e5d2c2;border-radius:999px;background:#fffaf5;box-shadow:0 3px 9px rgba(80,51,38,.05)}
          .market-checkout-row .market-quantity-control button{display:grid;place-items:center;width:30px;height:30px;border:0;border-radius:50%;background:#a95338;color:#fffaf4;font-size:19px;line-height:1;cursor:pointer}
          .market-checkout-row .market-quantity-control strong{min-width:18px;color:#503326;font-size:13px;text-align:center}
          .market-line-total{white-space:nowrap;color:#503326;font-size:14px;font-weight:850}
          .market-checkout-summary{position:sticky;top:18px;padding:25px;background:linear-gradient(180deg,#fffdf9,#fbf2e9)}
          .market-checkout-summary .market-buyer-fields{display:grid;grid-template-columns:1fr;gap:11px;margin-bottom:18px}
          .market-checkout-summary .market-buyer-fields input,.market-checkout-summary .market-buyer-fields textarea{box-sizing:border-box;width:100%;min-height:44px;padding:12px 14px;border:1px solid #e2cdbb;border-radius:11px;background:#fffefa;color:#503326;font:inherit;font-size:13px;transition:border-color .18s ease,box-shadow .18s ease}
          .market-checkout-summary .market-buyer-fields textarea{min-height:94px;resize:vertical}
          .market-checkout-summary .market-buyer-fields input:focus,.market-checkout-summary .market-buyer-fields textarea:focus{outline:none;border-color:#b66a4c;box-shadow:0 0 0 3px rgba(169,83,56,.11)}
          .market-checkout-summary .market-buyer-fields input::placeholder,.market-checkout-summary .market-buyer-fields textarea::placeholder{color:#a18d7e}
          .market-checkout-total,.market-checkout-grand{display:flex;justify-content:space-between;gap:12px;padding:13px 0;border-top:1px solid #f0e5dc;color:#806b5e;font-size:12px}
          .market-checkout-total strong{color:#503326}
          .market-checkout-grand{margin-top:7px;padding:17px 0;border-top:1px dashed #d9c2af;color:#503326;font-size:14px;font-weight:850}
          .market-checkout-grand strong{color:#984c32;font-size:24px}
          .market-place-order{display:flex;width:100%;min-height:49px;align-items:center;justify-content:center;gap:9px;margin-top:13px;border-radius:12px;font-size:13px;font-weight:850;box-shadow:0 8px 18px rgba(169,83,56,.2)}
          .market-checkout-note{display:block;margin-top:13px;padding:11px 12px;border-radius:10px;background:#f6eadf;color:#806b5e;font-size:10px;line-height:1.65}
          .market-checkout-empty{display:flex;flex-direction:column;align-items:center;gap:12px;padding:68px 24px;border:1px dashed #d8bda9;border-radius:20px;background:linear-gradient(135deg,#fffaf5,#f5e8dc);color:#a95338;text-align:center}
          .market-checkout-empty h2{margin:0;color:#503326;font-size:21px}
          .market-checkout-empty p{margin:0 0 8px;color:#806b5e;font-size:13px}
          .market-checkout-notice{margin-top:16px;padding:14px 16px;border:1px solid #e8d2c0;border-radius:12px;background:#fff5eb;color:#704a34;font-size:12px}
          @media(max-width:900px){.market-checkout-layout{grid-template-columns:1fr}.market-checkout-summary{position:static}}
          @media(max-width:650px){.market-checkout-page{width:calc(100% - 28px);padding-top:15px}.market-checkout-heading{align-items:flex-start;flex-direction:column;padding:18px;margin-bottom:16px}.market-checkout-heading h1{font-size:30px}.market-checkout-items,.market-checkout-summary{padding:17px}.market-checkout-row{grid-template-columns:64px minmax(0,1fr) auto;gap:10px;padding:14px 0}.market-checkout-thumb{width:64px;height:64px}.market-checkout-row .market-quantity-control{grid-column:2;justify-self:start}.market-line-total{grid-column:3;grid-row:2;text-align:right;font-size:12px}}
        `}</style>
        <div className="market-checkout-page">
          <div className="market-checkout-heading">
            <div><span className="market-kicker"><ShoppingCart size={14}/> YOUR SHOPPING CART</span><h1>Checkout</h1><p>Review your pottery items and submit one combined order.</p></div>
            <button type="button" className="btn btn-outline" onClick={() => navigate("marketplace")}><ShoppingBag size={15}/> Continue shopping</button>
          </div>
          {!groupedCart.length ? (
            <div className="market-checkout-empty"><ShoppingCart size={34}/><h2>Your cart is empty</h2><p>Add handmade pottery from the marketplace to see it here.</p><button className="btn btn-primary" onClick={() => navigate("marketplace")}>Browse marketplace <ArrowRight size={15}/></button></div>
          ) : (
            <div className="market-checkout-layout">
              <section className="market-checkout-items"><h2>Order items <span>{cart.length} item(s)</span></h2>
                {groupedCart.map((item) => <div className="market-checkout-row" key={item.id}>
                  <div className="market-checkout-thumb">{item.image ? <img src={resolveProductImage(item.image)} alt={item.name}/> : <ShoppingBag size={22}/>}</div>
                  <div className="market-checkout-product"><strong>{item.name}</strong><small>{item.category || "Handcrafted pottery"}</small><span>₹{Number(item.price).toLocaleString("en-IN", {minimumFractionDigits:2})} each</span></div>
                  <div className="market-quantity-control"><button type="button" aria-label={`Remove one ${item.name}`} onClick={() => { const index = cart.findIndex((entry) => String(entry.id) === String(item.id)); if (index >= 0) removeCartItem(index); }}>−</button><strong>{item.quantity}</strong><button type="button" aria-label={`Add one ${item.name}`} onClick={() => addToCart(item)}>+</button></div>
                  <strong className="market-line-total">₹{(Number(item.price) * item.quantity).toLocaleString("en-IN", {minimumFractionDigits:2})}</strong>
                </div>)}
              </section>
              <aside className="market-checkout-summary"><h2>Delivery details</h2><div className="market-buyer-fields"><input required placeholder="Your name" value={buyerDetails.name} onChange={(event) => setBuyerDetails({ ...buyerDetails, name: event.target.value })}/><input required type="tel" placeholder="Phone number" value={buyerDetails.phone} onChange={(event) => setBuyerDetails({ ...buyerDetails, phone: event.target.value })}/><input type="email" placeholder="Email (optional)" value={buyerDetails.email} onChange={(event) => setBuyerDetails({ ...buyerDetails, email: event.target.value })}/><textarea required className="address" placeholder="Full delivery address" value={buyerDetails.address} onChange={(event) => setBuyerDetails({ ...buyerDetails, address: event.target.value })}/></div><div className="market-checkout-total"><span>Subtotal ({cart.length} items)</span><strong>₹{cartSubtotal.toLocaleString("en-IN", {minimumFractionDigits:2})}</strong></div><div className="market-checkout-total"><span>Delivery</span><span>To be arranged by artisan</span></div><div className="market-checkout-grand"><span>Order total</span><strong>₹{cartSubtotal.toLocaleString("en-IN", {minimumFractionDigits:2})}</strong></div><button type="button" className="btn btn-primary market-place-order" onClick={placeOrder}>Submit combined order <ArrowRight size={16}/></button><small className="market-checkout-note">One order request will be created for all items. The artisans will contact you to arrange payment and delivery.</small></aside>
            </div>
          )}
          {marketNotice && <div role="status" className="market-checkout-notice">{marketNotice}</div>}
        </div>
      </PageWrapper>
    );
  }

  const allMarketplaceProducts = [
    ...products.map((product) => ({ ...product, isDemo: false })),
    ...DEMO_MARKET_PRODUCTS,
  ];

  const normalizedSearch = search.trim().toLowerCase();
  const matchingProducts = allMarketplaceProducts.filter((product) =>
    `${product.name || ""} ${product.description || ""} ${product.category || ""} ${product.seller_name || ""}`
      .toLowerCase()
      .includes(normalizedSearch)
  );

  const filteredProducts = matchingProducts
    .filter((product) =>
      categoryFilter === "All pottery" ||
      String(product.category || "").toLowerCase() === categoryFilter.toLowerCase()
    )
    .sort((a, b) => {
      if (sortOrder === "price-low") return Number(a.price) - Number(b.price);
      if (sortOrder === "price-high") return Number(b.price) - Number(a.price);
      // Keep demo products stable while real listings are ordered newest first.
      if (a.isDemo && !b.isDemo) return 1;
      if (!a.isDemo && b.isDemo) return -1;
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });

  const categoryCounts = MARKETPLACE_CATEGORIES.reduce((counts, category) => {
    counts[category] = category === "All pottery"
      ? matchingProducts.length
      : matchingProducts.filter(
          (product) => String(product.category || "").toLowerCase() === category.toLowerCase()
        ).length;
    return counts;
  }, {});
  return (
    <PageWrapper>
      <style>{`
        .market-public-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap}
        .market-kicker{display:inline-flex;align-items:center;gap:7px;color:#985239;font-size:10px;font-weight:900;letter-spacing:.14em;margin-bottom:8px}
        .market-free-badge{display:inline-flex;align-items:center;gap:7px;padding:9px 12px;border-radius:99px;background:#edf2e8;color:#4f6848;font-size:11px;font-weight:800}
        .market-public-banner{display:flex;align-items:center;gap:16px;padding:22px;margin:18px 0;border:1px solid #d9c0aa;border-radius:18px;background:linear-gradient(110deg,#f2e0ce,#fffaf4 58%,#f3e4d4);box-shadow:0 10px 25px #5135220b}
        .market-banner-icon{display:grid;place-items:center;width:54px;height:54px;flex:none;border-radius:16px;background:#a95338;color:#fff7ed}
        .market-banner-copy{flex:1;min-width:180px}.market-banner-copy strong{display:block;font:500 22px Georgia,serif;color:#382a20}.market-banner-copy span{display:block;margin-top:5px;color:#796d61;font-size:12px;line-height:1.7}
        .market-mode-switch{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin:22px 0 20px}
        .market-mode-card{position:relative;display:flex;align-items:center;gap:15px;min-width:0;padding:18px 20px;border:1px solid #e5d2c1;border-radius:17px;background:linear-gradient(145deg,#fffdf9,#fff7ef);color:#503326;text-align:left;cursor:pointer;transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease}
        .market-mode-card:hover{transform:translateY(-2px);border-color:#c98261;box-shadow:0 10px 24px #56351e12}
        .market-mode-card[aria-pressed="true"]{border:1.5px solid #a95338;background:linear-gradient(120deg,#f4e2d3,#fffaf5);box-shadow:0 8px 22px #56351e12}
        .market-mode-icon{display:grid;place-items:center;flex:none;width:48px;height:48px;border-radius:14px;background:#a95338;color:#fff8f1}
        .market-mode-copy{display:block;min-width:0;flex:1}.market-mode-copy strong{display:block;font-size:15px;font-weight:850;color:#503326}.market-mode-copy small{display:block;margin-top:5px;color:#806b5e;font-size:11px;line-height:1.55}
        .market-mode-arrow{color:#a95338;flex:none}.market-mode-card[aria-pressed="true"]:after{content:"";position:absolute;left:20px;right:20px;bottom:-1px;height:3px;border-radius:3px;background:#a95338}
        .market-sell-access{margin:0 0 18px;padding:16px 18px;border:1px solid #e5d2c1;border-radius:14px;background:#fff8f0;color:#76533e;font-size:12px;line-height:1.65}
        .market-sell-access strong{display:block;margin-bottom:4px;color:#503326;font-size:14px}
        .market-toolbar{display:flex;align-items:center;justify-content:space-between;gap:15px;flex-wrap:wrap;margin:22px 0 14px}.market-toolbar .search-box{flex:1;min-width:230px}
        .market-categories{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:22px}.market-chip{padding:8px 13px;border:1px solid #ddc9b7;border-radius:99px;background:#fffaf4;color:#6c4b39;font-size:11px;font-weight:750;cursor:pointer}.market-chip:hover{background:#f0dfce}
        .market-chip{display:inline-flex;align-items:center;gap:7px}
        .market-chip-count{display:inline-grid;place-items:center;min-width:19px;height:19px;padding:0 5px;border-radius:99px;background:#f1e4d8;color:#80513a;font-size:9px;font-weight:850}
        .market-chip[aria-pressed="true"] .market-chip-count{background:#fff2e8;color:#9b5237}
        .market-product-image-wrap{position:relative;overflow:hidden;background:#f1dfcc}
        .market-product-image-wrap .market-product-img{display:block;transition:transform .35s ease}
        .market-product:hover .market-product-img{transform:scale(1.035)}
        .market-demo-badge{position:absolute;top:11px;left:11px;padding:6px 9px;border-radius:99px;background:#a95338;color:#fffaf4;font-size:9px;font-weight:850;letter-spacing:.07em}
        .market-product-image-fallback{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;width:100%;height:190px;background:linear-gradient(145deg,#f1dfcc,#e2c2a6);color:#9a5237;font-size:11px}
        .market-seller-name{margin:0 0 8px!important;color:#806b5e;font-size:10px!important}
        .market-product-bottom button:disabled{opacity:.75;cursor:not-allowed}

        .market-empty{display:flex;flex-direction:column;align-items:center;text-align:center;padding:48px 20px 52px;border:1px dashed #d6bba5;border-radius:22px;background:linear-gradient(135deg,#fffaf4,#f5e8d9)}
        .market-empty-icon{position:relative;display:grid;place-items:center;width:76px;height:76px;margin-bottom:18px;border-radius:25px;background:#ead2bd;color:#9b5237}.market-empty-icon:after{content:'✦';position:absolute;top:-8px;right:-5px;color:#b65f43;font-size:25px}
        .market-empty h2{margin:8px 0;font:500 clamp(25px,3vw,34px) Georgia,serif;color:#362920}.market-empty p{max-width:510px;margin:0 0 19px;color:#786d62;font-size:12px;line-height:1.8}
        .market-product{overflow:hidden;border:1px solid #e3d5c7;border-radius:17px;background:#fffdf9;box-shadow:0 6px 18px #3b29180b}.market-product-img{display:flex;align-items:center;justify-content:center;width:100%;height:190px;object-fit:cover;background:linear-gradient(145deg,#f1dfcc,#e2c2a6);color:#9a5237}.market-product-body{padding:16px}.market-product-body h3{margin:8px 0;font-size:15px;color:#382b21}.market-product-body p{color:#786d62;font-size:11px;line-height:1.65}.market-product-bottom{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:13px}.market-product-bottom strong{font-size:15px;color:#88432f}
        .market-cart-bar{position:sticky;bottom:14px;display:flex;align-items:flex-start;justify-content:space-between;gap:15px;flex-wrap:wrap;margin-top:22px;padding:14px 16px;border:1px solid #ddc8b6;border-radius:16px;background:#fffdf7f2;box-shadow:0 12px 30px #3623171c;backdrop-filter:blur(12px)}
        .market-buyer-fields{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:8px;width:100%}.market-buyer-fields input{min-width:0;padding:10px;border:1px solid #ddc9b7;border-radius:9px;font:inherit;font-size:12px}.market-buyer-fields .address{grid-column:1/-1}
        .market-sell-section{margin-bottom:20px;padding:20px;border:1px solid #e5d2c1;border-radius:18px;background:linear-gradient(145deg,#fffdf9 0%,#fff8f0 100%);box-shadow:0 8px 24px rgba(80,51,38,.06)}
        .market-sell-heading{margin:0 0 5px;color:#503326;font-size:18px;font-weight:800;letter-spacing:-.02em}
        .market-sell-description{margin:0 0 18px;color:#786d62;font-size:12px;line-height:1.6}
        .market-sell-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
        .market-sell-field{display:flex;flex-direction:column;gap:7px;min-width:0}
        .market-sell-field label{font-size:11px;font-weight:750;color:#684633}
        .market-sell-field input,.market-sell-field select,.market-sell-field textarea{width:100%;min-width:0;box-sizing:border-box;padding:12px 13px;border:1px solid #dfcbbb;border-radius:10px;background:#fff;color:#503326;font:inherit;font-size:13px;outline:none;transition:border-color .18s ease,box-shadow .18s ease,background .18s ease}
        .market-sell-field input,.market-sell-field select{height:44px}
        .market-sell-field textarea{min-height:104px;resize:vertical;line-height:1.55}
        .market-sell-field input::placeholder,.market-sell-field textarea::placeholder{color:#a18d7e}
        .market-sell-field input:focus,.market-sell-field select:focus,.market-sell-field textarea:focus{border-color:#a95338;box-shadow:0 0 0 3px rgba(169,83,56,.12);background:#fffdfb}
        .market-sell-field-wide{grid-column:1/-1}
        .market-image-upload{display:flex;align-items:center;gap:14px;min-height:92px;padding:12px;border:1px dashed #d8b7a0;border-radius:12px;background:#fffaf5}
        .market-image-preview{width:76px;height:76px;flex:0 0 76px;display:flex;align-items:center;justify-content:center;overflow:hidden;border-radius:10px;background:#f2e3d6;color:#9a5237}
        .market-image-preview img{width:100%;height:100%;object-fit:cover}
        .market-image-upload-copy{display:flex;flex:1;min-width:0;flex-direction:column;gap:5px}
        .market-image-upload-copy strong{font-size:12px;color:#503326}
        .market-image-upload-copy span{font-size:11px;color:#8a7669;line-height:1.45}
        .market-image-upload-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:4px}
        .market-image-upload-button{display:inline-flex;align-items:center;gap:7px;padding:8px 11px;border:1px solid #d9b59d;border-radius:9px;background:#fff;color:#88432f;font-size:11px;font-weight:750;cursor:pointer}
        .market-image-upload-button:hover{background:#f8e9dd}
        .market-sell-actions{grid-column:1/-1;display:flex;gap:10px;flex-wrap:wrap;padding-top:2px}
        .market-cart-bar{align-items:center}.market-cart-bar>div{display:flex;align-items:center;gap:14px;flex-wrap:wrap}.market-cart-bar strong{display:inline-flex;align-items:center;gap:8px;color:#503326}.market-cart-bar span{font-size:12px;color:#806b5e}.market-checkout-page{max-width:1180px;margin:0 auto}.market-checkout-heading{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:22px}.market-checkout-heading h1{margin:8px 0 5px;color:#382b21;font:600 32px Georgia,serif}.market-checkout-heading p{margin:0;color:#806b5e;font-size:13px}.market-checkout-layout{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(300px,.85fr);gap:20px;align-items:start}.market-checkout-items,.market-checkout-summary{padding:20px;border:1px solid #e6d5c7;border-radius:18px;background:#fffdf9;box-shadow:0 8px 24px rgba(80,51,38,.05)}.market-checkout-items h2,.market-checkout-summary h2{display:flex;justify-content:space-between;align-items:center;margin:0 0 16px;color:#503326;font-size:17px}.market-checkout-items h2 span{font-size:11px;color:#8a7669;font-weight:500}.market-checkout-row{display:grid;grid-template-columns:76px minmax(0,1fr) auto auto;align-items:center;gap:14px;padding:14px 0;border-top:1px solid #f0e5dc}.market-checkout-thumb{width:76px;height:76px;display:grid;place-items:center;overflow:hidden;border-radius:12px;background:#f4e7dc;color:#a95338}.market-checkout-thumb img{width:100%;height:100%;object-fit:cover}.market-checkout-product{display:flex;min-width:0;flex-direction:column;gap:5px}.market-checkout-product strong{color:#503326;font-size:13px}.market-checkout-product small,.market-checkout-product span{color:#887568;font-size:11px}.market-quantity-control{display:flex;align-items:center;gap:10px;padding:5px;border:1px solid #e7d5c7;border-radius:10px}.market-quantity-control button{width:25px;height:25px;border:0;border-radius:7px;background:#f5e7dc;color:#88432f;font-size:17px;cursor:pointer}.market-quantity-control strong{min-width:14px;text-align:center;font-size:12px}.market-line-total{white-space:nowrap;color:#503326;font-size:12px}.market-checkout-summary .market-buyer-fields{grid-template-columns:1fr;margin-bottom:16px}.market-checkout-summary .market-buyer-fields textarea{min-height:82px;resize:vertical}.market-checkout-summary .market-buyer-fields input,.market-checkout-summary .market-buyer-fields textarea{box-sizing:border-box;width:100%;padding:11px;border:1px solid #ddc9b7;border-radius:9px;font:inherit;font-size:12px}.market-checkout-total,.market-checkout-grand{display:flex;justify-content:space-between;gap:10px;padding:11px 0;border-top:1px solid #f0e5dc;color:#806b5e;font-size:12px}.market-checkout-total strong{color:#503326}.market-checkout-grand{margin-top:4px;color:#503326;font-weight:800;font-size:14px}.market-checkout-grand strong{font-size:20px;color:#984c32}.market-place-order{width:100%;justify-content:center;margin-top:12px}.market-checkout-note{display:block;margin-top:12px;color:#887568;font-size:10px;line-height:1.6}.market-checkout-empty{display:flex;flex-direction:column;align-items:center;gap:10px;padding:55px 20px;border:1px dashed #d8bda9;border-radius:18px;background:#fffaf5;color:#a95338;text-align:center}.market-checkout-empty h2{margin:0;color:#503326}.market-checkout-empty p{margin:0 0 8px;color:#806b5e;font-size:12px}.market-checkout-notice{margin-top:15px;padding:12px;border:1px solid #e8d2c0;border-radius:10px;background:#fff5eb;color:#704a34;font-size:12px}
        @media(max-width:850px){.market-checkout-layout{grid-template-columns:1fr}}
        @media(max-width:650px){.market-checkout-heading{align-items:flex-start;flex-direction:column}.market-checkout-row{grid-template-columns:58px minmax(0,1fr) auto;gap:9px}.market-checkout-thumb{width:58px;height:58px}.market-line-total{grid-column:2/4;text-align:right}.market-cart-bar{align-items:flex-start;flex-direction:column}.market-cart-bar .btn{width:100%}.market-checkout-items,.market-checkout-summary{padding:14px}}
        @media(max-width:650px){.market-public-banner{align-items:flex-start;flex-wrap:wrap;padding:16px}.market-mode-switch{grid-template-columns:1fr;gap:10px;margin:16px 0}.market-mode-card{padding:14px}.market-cart-bar{align-items:flex-start;flex-direction:column}.market-cart-bar .btn{width:100%}.market-sell-section{padding:15px}.market-sell-form{grid-template-columns:minmax(0,1fr)}.market-sell-field-wide,.market-sell-actions{grid-column:1}}
        /* Premium cart quantity and checkout presentation */
        .market-product-quantity{min-width:112px;justify-content:space-between;gap:12px;padding:5px 6px;border:1px solid #d9bca7;border-radius:999px;background:linear-gradient(180deg,#fffdfa,#f8eee5);box-shadow:0 4px 12px rgba(80,51,38,.08)}
        .market-product-quantity button,.market-quantity-control button{display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:#a95338;color:#fffaf4;font-size:19px;font-weight:600;line-height:1;box-shadow:0 2px 5px rgba(80,51,38,.14);transition:transform .16s ease,background .16s ease}
        .market-product-quantity button:hover,.market-quantity-control button:hover{background:#87412e;transform:scale(1.06)}
        .market-product-quantity strong{min-width:20px;color:#503326;font-size:13px;font-weight:850}
        .market-add-cart{min-height:38px;padding:0 13px;border-radius:999px;box-shadow:0 5px 13px rgba(169,83,56,.18)}
        .market-cart-bar{padding:17px 20px;border:1px solid #d9bca7;border-radius:18px;background:linear-gradient(115deg,rgba(255,253,249,.98),rgba(250,239,228,.97));box-shadow:0 14px 34px rgba(59,41,24,.16)}
        .market-cart-bar>div{gap:7px 18px}.market-cart-bar strong{font-size:13px}.market-cart-bar span{font-size:12px}.market-cart-bar .btn{min-height:42px;padding:0 19px;border-radius:999px;box-shadow:0 6px 16px rgba(169,83,56,.2)}
        .market-checkout-page{max-width:1220px;padding:4px 0 24px}
        .market-checkout-heading{margin-bottom:25px;padding:22px 24px;border:1px solid #ead8c8;border-radius:20px;background:radial-gradient(circle at top right,rgba(225,190,160,.24),transparent 38%),linear-gradient(135deg,#fffdf9,#fbf1e8);box-shadow:0 10px 28px rgba(80,51,38,.06)}
        .market-checkout-heading h1{font-size:35px;letter-spacing:-.7px}.market-checkout-heading p{font-size:12px;line-height:1.7}
        .market-checkout-heading>.btn{min-height:40px;border-radius:999px;background:#fffaf5}
        .market-checkout-layout{gap:22px;grid-template-columns:minmax(0,1.45fr) minmax(320px,.82fr)}
        .market-checkout-items,.market-checkout-summary{padding:23px;border:1px solid #ead9ca;border-radius:20px;background:linear-gradient(180deg,#fffefa,#fffaf5);box-shadow:0 12px 30px rgba(80,51,38,.07)}
        .market-checkout-items h2,.market-checkout-summary h2{margin-bottom:19px;font-size:16px;font-weight:850;letter-spacing:-.2px}
        .market-checkout-row{grid-template-columns:82px minmax(0,1fr) auto auto;gap:15px;padding:17px 0;border-top:1px solid #efe4da}
        .market-checkout-thumb{width:82px;height:82px;border:1px solid #efdfd1;border-radius:14px;background:#f6e9df}
        .market-checkout-product strong{font-size:13px}.market-checkout-product small{font-size:10px;text-transform:uppercase;letter-spacing:.06em}.market-checkout-product span{font-size:11px}
        .market-checkout-row .market-quantity-control{gap:10px;padding:5px;border:1px solid #e5d2c2;border-radius:999px;background:#fffaf5;box-shadow:0 3px 9px rgba(80,51,38,.05)}
        .market-checkout-row .market-quantity-control strong{min-width:18px;color:#503326;font-size:12px}
        .market-line-total{font-size:13px;font-weight:850}
        .market-checkout-summary{position:sticky;top:18px;padding:23px;background:linear-gradient(180deg,#fffdf9,#fbf2e9)}
        .market-checkout-summary .market-buyer-fields{gap:10px}
        .market-checkout-summary .market-buyer-fields input,.market-checkout-summary .market-buyer-fields textarea{padding:12px 13px;border:1px solid #e2cdbb;border-radius:11px;background:#fffefa;color:#503326;transition:border-color .18s ease,box-shadow .18s ease}
        .market-checkout-summary .market-buyer-fields input:focus,.market-checkout-summary .market-buyer-fields textarea:focus{outline:none;border-color:#b66a4c;box-shadow:0 0 0 3px rgba(169,83,56,.11)}
        .market-checkout-total{padding:13px 0;font-size:12px}.market-checkout-grand{margin-top:7px;padding:16px 0;border-top:1px dashed #d9c2af;font-size:14px}.market-checkout-grand strong{font-size:23px}
        .market-place-order{min-height:48px;border-radius:12px;font-size:13px;font-weight:800;box-shadow:0 8px 18px rgba(169,83,56,.2)}
        .market-checkout-note{padding:10px 11px;border-radius:10px;background:#f6eadf;color:#806b5e;font-size:10px}
        .market-checkout-empty{padding:65px 22px;border:1px dashed #d8bda9;border-radius:20px;background:linear-gradient(135deg,#fffaf5,#f5e8dc)}
        @media(max-width:850px){.market-checkout-summary{position:static}}
        @media(max-width:650px){.market-checkout-heading{padding:17px}.market-checkout-heading h1{font-size:29px}.market-checkout-items,.market-checkout-summary{padding:16px}.market-checkout-row{grid-template-columns:58px minmax(0,1fr) auto;gap:9px}.market-checkout-thumb{width:58px;height:58px}.market-checkout-row .market-quantity-control{grid-column:2;justify-self:start}.market-line-total{grid-column:3;grid-row:2;text-align:right}.market-product-bottom{align-items:center}.market-product-quantity{min-width:102px}}
      `}</style>
      {marketNotice && <div role="status" style={{ margin: "0 0 16px", padding: "12px 14px", border: "1px solid #e8d2c0", borderRadius: 10, background: "#fff5eb", color: "#704a34", fontSize: 12 }}>{marketNotice}</div>}
      <div className="market-public-head">
        <div><span className="market-kicker"><ShoppingBag size={14}/> OPEN TO EVERYONE</span><PageHeader title="Potter Marketplace" description="Discover handmade pottery and support local artisans. Browsing is free for everyone — no membership required." /></div>
        <span className="market-free-badge"><CheckCircle size={14}/> Free public access</span>
      </div>
      <div className="market-public-banner">
        <div className="market-banner-icon"><ShoppingBag size={25}/></div>
        <div className="market-banner-copy"><strong>Every pot has a story. Find yours.</strong><span>Explore artisan-made pieces and help pottery makers reach more customers.</span></div>
        {!authenticated && <button className="btn btn-outline" onClick={() => setAuthModal("signup")}>Join to become a seller <ArrowRight size={15}/></button>}
        {authenticated && !isApprovedMember && <span className="market-free-badge" title="Selling opens after membership approval">Membership approval required to sell</span>}
      </div>
      <div className="market-mode-switch" role="group" aria-label="Choose marketplace activity">
        <button type="button" className="market-mode-card" aria-pressed={activeMarketMode === "purchase"} onClick={() => setActiveMarketMode("purchase")}>
          <span className="market-mode-icon"><ShoppingCart size={23}/></span>
          <span className="market-mode-copy"><strong>Purchase pottery</strong><small>Browse handmade products, compare prices and place an order.</small></span>
          <ArrowRight className="market-mode-arrow" size={19}/>
        </button>
        <button type="button" className="market-mode-card" aria-pressed={activeMarketMode === "sell"} onClick={() => { if (!authenticated) { setAuthModal("signup"); return; } setActiveMarketMode("sell"); }}>
          <span className="market-mode-icon"><ShoppingBag size={23}/></span>
          <span className="market-mode-copy"><strong>Sell your pottery</strong><small>{canPublish ? "Create and manage your artisan product listings." : authenticated ? "Membership approval is required to publish products." : "Join the community to list your handmade pottery."}</small></span>
          <ArrowRight className="market-mode-arrow" size={19}/>
        </button>
      </div>
      {activeMarketMode === "purchase" && <>
      <div className="market-toolbar">
        <div className="search-box"><Search size={18}/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search pottery, clay art, planters..." aria-label="Search marketplace products"/></div>
        <span style={{display:"inline-flex",alignItems:"center",gap:8,color:"#786d62",fontSize:11}}><ShoppingCart size={16}/>{cart.length ? `${cart.length} item(s) in cart` : "Browse freely — no membership needed"}</span>
      </div>
      <div className="market-toolbar" style={{ marginTop: -6 }}><span style={{ color: "#786d62", fontSize: 11 }}>{filteredProducts.length} product(s)</span><label style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#786d62", fontSize: 11 }}>Sort by <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} style={{ padding: "9px 12px", border: "1px solid #ddc9b7", borderRadius: 9, background: "#fffdf9", color: "#503326" }}><option value="newest">Newest</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select></label></div>
      <div className="market-categories" aria-label="Filter products by pottery category">
        {MARKETPLACE_CATEGORIES.map((category) => (
          <button
            key={category}
            className="market-chip"
            aria-pressed={categoryFilter === category}
            style={categoryFilter === category
              ? { background: "#a95338", color: "#fffaf4", borderColor: "#a95338" }
              : undefined}
            onClick={() => setCategoryFilter(category)}
          >
            {category}
            <span className="market-chip-count">{categoryCounts[category] || 0}</span>
          </button>
        ))}
      </div>

      {loadingProducts && <div className="empty-state">Loading marketplace listings…</div>}
      {filteredProducts.length ? (
        <div className="product-grid">
          {filteredProducts.map((product) => (
            <article className="market-product" key={product.id}>
              <div className="market-product-image-wrap">
                {product.image ? (
                  <img
                    className="market-product-img"
                    src={resolveProductImage(product.image)}
                    alt={product.name}
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                      event.currentTarget.nextElementSibling?.removeAttribute("hidden");
                    }}
                  />
                ) : null}
                <div className="market-product-image-fallback" hidden={Boolean(product.image)}>
                  <ShoppingBag size={32} />
                  <span>Pottery product</span>
                </div>
                {product.isDemo && <span className="market-demo-badge">DEMO PRODUCT</span>}
              </div>

              <div className="market-product-body">
                <span className="market-kicker">{product.category || "HANDCRAFTED POTTERY"}</span>
                <h3>{product.name}</h3>
                <p>{product.description || "A unique handmade piece crafted with care."}</p>
                <p className="market-seller-name">
                  {product.isDemo
                    ? "Sample artisan listing"
                    : `Made by ${product.seller_name || "Community artisan"}`}
                </p>

                <div className="market-product-bottom">
                  <strong>₹{Number(product.price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
                  {product.isDemo ? (
                    <button
                      type="button"
                      className="btn btn-outline"
                      disabled
                      title="Sample product only; ordering is disabled"
                    >
                      Demo preview
                    </button>
                  ) : (() => {
                    const quantityInCart = cart.filter((entry) => String(entry.id) === String(product.id)).length;
                    return quantityInCart > 0 ? (
                      <div className="market-quantity-control market-product-quantity" aria-label={`${quantityInCart} ${product.name} in cart`}>
                        <button type="button" aria-label={`Remove one ${product.name}`} onClick={() => {
                          const index = cart.findIndex((entry) => String(entry.id) === String(product.id));
                          if (index >= 0) removeCartItem(index);
                        }}>−</button>
                        <strong>{quantityInCart}</strong>
                        <button type="button" aria-label={`Add one ${product.name}`} onClick={() => addToCart(product)}>+</button>
                      </div>
                    ) : (
                      <button type="button" className="btn btn-primary market-add-cart" onClick={() => addToCart(product)}>
                        <ShoppingCart size={15}/> Add to cart
                      </button>
                    );
                  })()}
                </div>

                {!product.isDemo && product.can_manage && (
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <button type="button" className="btn btn-outline" onClick={() => editProduct(product)}>Edit</button>
                    <button type="button" className="btn btn-outline" onClick={() => removeProduct(product)}>Remove</button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : !loadingProducts ? (
        <div className="market-empty"><div className="market-empty-icon"><ShoppingBag size={34}/></div><span className="market-kicker">THE ARTISAN SHELF</span><h2>{search ? "No matching pottery found" : "Beautiful things are being shaped."}</h2><p>{marketNotice && !products.length ? marketNotice : search ? "Try another keyword or choose All pottery to browse again." : "No pottery has been listed yet. Verified community members can publish the first product."}</p>{search && <button className="btn btn-outline" onClick={() => setSearch("")}>Show all pottery</button>}</div>
      ) : null}
      {cart.length > 0 && <div className="market-cart-bar"><div><strong><ShoppingCart size={18}/> {cart.length} item(s) in your cart</strong><span>Combined subtotal: ₹{cartSubtotal.toLocaleString("en-IN", {minimumFractionDigits:2})}</span></div><button className="btn btn-primary" onClick={() => navigate("checkout")}>Go to checkout <ArrowRight size={16}/></button></div>}
      </>}
      {activeMarketMode === "sell" && (canPublish ? (
        <>
<section className="market-sell-section"><h2 className="market-sell-heading">{editingProductId ? "Edit marketplace listing" : "Sell your pottery"}</h2><p className="market-sell-description">Verified community members can add and manage their own products.</p><form className="market-sell-form" onSubmit={saveProduct}><div className="market-sell-field"><label htmlFor="market-product-name">Product name</label><input id="market-product-name" required minLength={2} maxLength={160} placeholder="e.g. Handcrafted terracotta vase" value={productDraft.name} onChange={(e) => setProductDraft({ ...productDraft, name: e.target.value })} /></div><div className="market-sell-field"><label htmlFor="market-product-category">Product type</label><select id="market-product-category" value={productDraft.category} onChange={(e) => setProductDraft({ ...productDraft, category: e.target.value })}>{["Home & décor", "Planters", "Tableware", "Traditional craft", "Idols", "Marriage", "Other pottery"].map((item) => <option key={item}>{item}</option>)}</select></div><div className="market-sell-field"><label htmlFor="market-product-price">Price (₹)</label><input id="market-product-price" required type="number" min="0.01" step="0.01" placeholder="Enter price in rupees" value={productDraft.price} onChange={(e) => setProductDraft({ ...productDraft, price: e.target.value })} /></div><div className="market-sell-field market-sell-field-wide"><label htmlFor="market-product-image-file">Product image <span style={{fontWeight:500,color:"#9a8778"}}>(optional · JPG, PNG, WEBP up to 5 MB)</span></label><div className="market-image-upload"><div className="market-image-preview">{productImagePreview ? <img src={productImagePreview} alt="Selected product preview"/> : <ShoppingBag size={26}/>}</div><div className="market-image-upload-copy"><strong>{productImageFile ? productImageFile.name : productImagePreview ? "Product image selected" : "Add a photo of your pottery"}</strong><span>Choose an image directly from your device. A preview will appear here.</span><div className="market-image-upload-actions"><label className="market-image-upload-button" htmlFor="market-product-image-file"><Plus size={14}/>{productImagePreview ? "Change image" : "Choose image"}</label>{productImagePreview && <button type="button" className="market-image-upload-button" onClick={() => { setProductImageFile(null); setProductImagePreview(""); setProductDraft({ ...productDraft, image_url: "" }); }}>Remove image</button>}</div></div><input id="market-product-image-file" type="file" accept="image/jpeg,image/png,image/webp" style={{display:"none"}} onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; if (!file.type.startsWith("image/") || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) { setMarketNotice("Choose a JPG, PNG, or WEBP image."); event.target.value = ""; return; } if (file.size > 5 * 1024 * 1024) { setMarketNotice("Image must be 5 MB or smaller."); event.target.value = ""; return; } setMarketNotice(""); setProductImageFile(file); setProductImagePreview(URL.createObjectURL(file)); setProductDraft({ ...productDraft, image_url: "" }); }}/></div></div><div className="market-sell-field market-sell-field-wide"><label htmlFor="market-product-description">Product description</label><textarea id="market-product-description" required minLength={5} maxLength={2000} placeholder="Describe the material, size, craftsmanship, and details of your item…" value={productDraft.description} onChange={(e) => setProductDraft({ ...productDraft, description: e.target.value })} /></div><div className="market-sell-actions"><button className="btn btn-primary" type="submit" disabled={productBusy}>{productBusy ? "Saving…" : editingProductId ? "Save changes" : "Publish listing"}</button>{editingProductId && <button type="button" className="btn btn-outline" onClick={resetProductForm}>Cancel</button>}</div></form></section>
        </>
      ) : <div className="market-sell-access"><strong>{authenticated ? "Seller access requires membership approval" : "Become a community member to sell"}</strong>{authenticated ? "Your account can browse and purchase pottery. Once your membership is approved, you can publish and manage your own listings here." : "Create an account and complete community membership verification to list your handmade pottery for sale."}<div style={{marginTop:10}}>{!authenticated && <button type="button" className="btn btn-primary" onClick={() => setAuthModal("signup")}>Sign up to become a seller <ArrowRight size={14}/></button>}</div></div>)}
      {authenticated && orders.length > 0 && <section style={{ marginTop: 24, padding: 16, border: "1px solid #e3d5c7", borderRadius: 16, background: "#fffdf9" }}><h2 style={{ margin: "0 0 10px", fontSize: 16, color: "#503326" }}>{canManage || isApprovedMember ? "Marketplace order requests for your listings" : "Your order requests"}</h2>{orders.map((order) => <div key={order.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", padding: "10px 0", borderTop: "1px solid #efe2d8", fontSize: 12 }}><span>Order #{order.id}{order.buyer_name ? ` · From ${order.buyer_name}` : ""} · {order.items.reduce((count, item) => count + item.quantity, 0)} item(s) · {new Date(order.created_at).toLocaleDateString()}<small style={{ display: "block", color: "#806b5e", marginTop: 4 }}>{order.items.map((item) => `${item.name} × ${item.quantity}`).join(", ")}</small>{order.buyer_phone && <small style={{ display: "block", color: "#806b5e", marginTop: 4 }}>Buyer phone: {order.buyer_phone}{order.buyer_email ? ` · ${order.buyer_email}` : ""} · Delivery: {order.delivery_address}</small>}</span><strong>₹{Number(order.total_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })} · {order.status}</strong></div>)}</section>}
    </PageWrapper>
  );
}

/* =========================================================
   MEMBER CONTENT
========================================================= */

function SupportInquiriesPage() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const rows = await authApi("/support/inquiries");
      setInquiries(Array.isArray(rows) ? rows : []);
    } catch (loadError) { setError(loadError.message || "Could not load enquiries."); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const setStatus = async (item, status) => {
    setBusyId(item.id); setNotice(""); setError("");
    try {
      await authApi(`/support/inquiries/${item.id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      setNotice(`Enquiry #${item.id} updated.`);
      await load();
    } catch (updateError) { setError(updateError.message || "Could not update enquiry."); }
    finally { setBusyId(null); }
  };
  return <PageWrapper><PageHeader title="Help & Support enquiries" description="Questions sent by anyone from the public sign-in or sign-up screens." />
    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}><button type="button" className="btn btn-outline" onClick={load} disabled={loading}>Refresh</button></div>
    {notice && <p role="status" style={{ color: "#216b35" }}>{notice}</p>}{error && <p role="alert" style={{ color: "#a1261c" }}>{error}</p>}
    {loading ? <p>Loading enquiries…</p> : inquiries.length === 0 ? <div className="empty-state"><h3>No support enquiries yet</h3><p>New messages from the public Help & Support form will appear here.</p></div> :
      <div style={{ display: "grid", gap: 12 }}>{inquiries.map((item) => <article key={item.id} style={{ padding: 18, background: "#fff", border: "1px solid #ead8ca", borderRadius: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}><strong>{item.full_name} · {item.category}</strong><span>{item.status} · {new Date(item.created_at).toLocaleString()}</span></div>
        <p style={{ whiteSpace: "pre-wrap" }}>{item.message}</p><p style={{ color: "#806b5e" }}>Contact: {item.email || "No email"}{item.phone_number ? ` · ${item.phone_number}` : ""}</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button className="btn btn-outline" type="button" disabled={busyId === item.id || item.status === "IN_PROGRESS"} onClick={() => setStatus(item, "IN_PROGRESS")}>Mark in progress</button><button className="btn btn-primary" type="button" disabled={busyId === item.id || item.status === "RESOLVED"} onClick={() => setStatus(item, "RESOLVED")}>Mark resolved</button></div>
      </article>)}</div>}
  </PageWrapper>;
}

function MemberContent({
  currentPage,
  navigate,
  activeRole,
  activeUser,
  pendingMemberships,
  membershipLoading,
  membershipError,
  membershipActionLoading,
  memberDirectory = [],
  memberDirectoryLoading = false,
  memberDirectorySearch = "",
  setMemberDirectorySearch = () => {},
  loadMemberDirectory = () => {},
  setMemberActivation = () => {},
  loadPendingMemberships,
  handleMembershipAction,
  forwardMembership,
  viewMembershipApplication,
  search,
  setSearch,
  addToCart,
  cart,
  clearCart,
  removeCartItem,
}) {
  const [schemeScope, setSchemeScope] = useState("National");
  const [communityEvents, setCommunityEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsBusy, setEventsBusy] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventNotice, setEventNotice] = useState("");
  const [eventDraft, setEventDraft] = useState({
    title: "", description: "", announcement: "", date: "", time: "", venue: "", registrationEnabled: true,
  });
  const [eventHistoryFilter, setEventHistoryFilter] = useState("All");
  const canManageEvents = String(activeUser?.role || "").toUpperCase() === "ADMIN"
    || String(activeUser?.role || "").toUpperCase() === "SUPER ADMIN"
    || activeUser?.permissions?.includes("events.manage");
  const canApproveEvents = String(activeUser?.role || "").toUpperCase() === "SUPER ADMIN"
    || activeUser?.permissions?.includes("community.approve");
  const currentMemberName = (() => {
    try {
      const stored = JSON.parse(localStorage.getItem("potterProfile") || "{}");
      return activeUser?.full_name || stored.fullName || stored.name || "Current member";
    } catch {
      return "Current member";
    }
  })();
  const loadCommunityEvents = async () => {
    setEventsLoading(true);
    try {
      const rows = await authApi("/events");
      setCommunityEvents(Array.isArray(rows) ? rows : []);
    } catch (loadError) {
      setEventNotice(loadError.message || "Could not load events.");
    } finally { setEventsLoading(false); }
  };
  useEffect(() => { loadCommunityEvents(); }, []);
  const createCommunityEvent = async (e) => {
    e.preventDefault();
    if (!canManageEvents) return;
    if (!eventDraft.title.trim() || !eventDraft.description.trim() || !eventDraft.date || !eventDraft.time || !eventDraft.venue.trim()) {
      setEventNotice("Complete the event title, description, date, time, and venue before publishing.");
      return;
    }
    setEventsBusy(true);
    try {
      await authApi("/events", { method: "POST", body: JSON.stringify({ title: eventDraft.title.trim(), description: eventDraft.description.trim(), announcement: eventDraft.announcement.trim() || null, date: eventDraft.date, time: eventDraft.time, venue: eventDraft.venue.trim(), registration_enabled: eventDraft.registrationEnabled }) });
      setEventDraft({ title: "", description: "", announcement: "", date: "", time: "", venue: "", registrationEnabled: true });
      setShowEventForm(false);
      setEventNotice("Event sent to the President for approval. It will appear to members after approval.");
      await loadCommunityEvents();
    } catch (createError) { setEventNotice(createError.message || "Could not submit the event."); }
    finally { setEventsBusy(false); }
  };
  const registerForEvent = async (eventId) => {
    setEventsBusy(true);
    try {
      await authApi(`/events/${eventId}/registrations`, { method: "POST" });
      setEventNotice("Your registration has been recorded. Attendance will be counted only after an authorized check-in.");
      await loadCommunityEvents();
    } catch (registerError) { setEventNotice(registerError.message || "Could not register for this event."); }
    finally { setEventsBusy(false); }
  };
  const updateAttendance = async (eventId, memberId, memberName, status) => {
    if (!canManageEvents) return;
    setEventsBusy(true);
    try {
      await authApi(`/events/${eventId}/attendance/${memberId}`, { method: "PATCH", body: JSON.stringify({ status: status.toUpperCase() }) });
      setEventNotice(`Attendance marked ${status.toLowerCase()} for ${memberName}.`);
      await loadCommunityEvents();
    } catch (attendanceError) { setEventNotice(attendanceError.message || "Could not update attendance."); }
    finally { setEventsBusy(false); }
  };
  const decideEvent = async (eventId, action) => {
    const remark = action === "REJECT" ? window.prompt("Please provide a short reason for rejecting this event.") : window.prompt("Approval note (optional):");
    if (action === "REJECT" && !remark?.trim()) return;
    setEventsBusy(true);
    try {
      await authApi(`/events/${eventId}/decision`, { method: "PATCH", body: JSON.stringify({ action, remark: remark?.trim() || null }) });
      setEventNotice(action === "APPROVE" ? "Event approved and published." : "Event rejected.");
      await loadCommunityEvents();
    } catch (decisionError) { setEventNotice(decisionError.message || "Could not review this event."); }
    finally { setEventsBusy(false); }
  };
  const registeredEvents = communityEvents.filter((item) => (item.registrations || []).some((entry) => entry.name === currentMemberName));
  const attendedEvents = registeredEvents.filter((item) => item.attendance?.[currentMemberName]?.status === "Attended");
  const absentEvents = registeredEvents.filter((item) => item.attendance?.[currentMemberName]?.status === "Absent");
  const eventHistory = eventHistoryFilter === "All" ? registeredEvents : eventHistoryFilter === "Attended" ? attendedEvents : eventHistoryFilter === "Absent" ? absentEvents : registeredEvents.filter((item) => !item.attendance?.[currentMemberName]);

  if (currentPage === "dashboard") {
    return <Dashboard navigate={navigate} activeRole={activeRole} activeUser={activeUser} />;
  }

  if (currentPage === "support-inquiries") {
    return <SupportInquiriesPage />;
  }

  if (currentPage === "announcements") {
    return (
      <PageWrapper>
        <PageHeader
          title="Announcements"
          description="Community announcements and member updates."
        />

        {announcements.length > 0 ? (
          <div className="content-grid">
            {announcements.map((item) => (
              <AnnouncementCard
                key={item.title}
                item={item}
                isMember
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No verified announcements yet"
            description="The community administrator has not published any announcements."
          />
        )}
      </PageWrapper>
    );
  }

  if (currentPage === "community-records") {
    return <CommunityRecordsPage activeUser={activeUser} />;
  }

  if (currentPage === "events") {
    const today = new Date().toISOString().slice(0, 10);
    const upcomingEvents = communityEvents.filter((item) => item.status === "PUBLISHED" && item.date >= today).sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
    const pendingEvents = communityEvents.filter((item) => item.status === "PENDING_APPROVAL");
    return (
      <PageWrapper>
        <style>{`
          .pc-event-page{color:#3d2b21}.pc-event-intro{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:20px}.pc-event-kicker{font-size:10px;font-weight:900;letter-spacing:.13em;color:#a65335}.pc-event-intro h1{margin:6px 0;font-size:clamp(25px,3vw,32px)}.pc-event-intro p{margin:0;color:#806d60;font-size:12px;line-height:1.7}.pc-event-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:11px 15px;border:1px solid #a95536;border-radius:10px;background:#a95536;color:#fffaf5;font-weight:800;font-size:12px;cursor:pointer}.pc-event-btn.secondary{background:#fffaf5;color:#88462f;border-color:#e4cbbb}.pc-event-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:18px 0 24px}.pc-event-stat{padding:15px;border:1px solid #ead8c9;border-radius:14px;background:#fffdf9}.pc-event-stat span{display:block;color:#897668;font-size:11px}.pc-event-stat strong{display:block;margin-top:7px;font-size:23px;color:#503527}.pc-event-panel{padding:18px;border:1px solid #ead8c9;border-radius:16px;background:#fffdf9;margin:18px 0}.pc-event-panel-head{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:14px}.pc-event-panel-head h2{font-size:17px;margin:0}.pc-event-panel-head p{font-size:11px;color:#897668;margin:5px 0 0}.pc-event-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.pc-event-card{border:1px solid #ead8c9;border-radius:15px;overflow:hidden;background:#fff}.pc-event-card-top{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;padding:15px;background:linear-gradient(110deg,#f7e7d9,#fffaf5);border-bottom:1px solid #f0dfd2}.pc-event-datebox{display:flex;align-items:center;gap:10px}.pc-event-date-icon{width:42px;height:42px;display:grid;place-items:center;border-radius:12px;background:#f0d9c7;color:#a65335;flex:none}.pc-event-card h3{font-size:15px;margin:0 0 5px}.pc-event-card small{font-size:10px;color:#856f60}.pc-event-card-body{padding:15px}.pc-event-meta{display:flex;gap:12px;flex-wrap:wrap;color:#7f6a5d;font-size:11px;margin-bottom:11px}.pc-event-meta span{display:inline-flex;align-items:center;gap:5px}.pc-event-card-body p{font-size:12px;line-height:1.7;color:#77665a;margin:0 0 14px}.pc-event-card-actions{display:flex;gap:8px;flex-wrap:wrap}.pc-event-status{display:inline-flex;align-items:center;gap:5px;border-radius:99px;padding:6px 9px;background:#f5e8dc;color:#895035;font-size:10px;font-weight:800}.pc-event-status.green{background:#eaf2e5;color:#4c7043}.pc-event-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}.pc-event-form label{display:flex;flex-direction:column;gap:6px;font-size:11px;font-weight:800;color:#5a4030}.pc-event-form input,.pc-event-form textarea{width:100%;box-sizing:border-box;border:1px solid #e3cbbb;border-radius:9px;background:#fffaf5;padding:11px 12px;font:inherit;color:#4a3428;outline:none}.pc-event-form input:focus,.pc-event-form textarea:focus{border-color:#ad6345;box-shadow:0 0 0 3px #ad63451a}.pc-event-form textarea{min-height:88px;resize:vertical}.pc-event-form .wide{grid-column:1/-1}.pc-event-check{display:flex;align-items:center;gap:8px;font-size:11px;color:#745f51}.pc-event-check input{width:auto}.pc-event-notice{margin:12px 0;padding:11px 13px;border-radius:10px;background:#f7e9dc;color:#74452e;font-size:12px;line-height:1.6}.pc-event-empty{padding:28px 18px;text-align:center;border:1px dashed #dfc6b3;border-radius:13px;color:#806d60;background:#fffaf5}.pc-event-empty strong{display:block;color:#543a2a;margin:8px 0}.pc-event-history-row{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;padding:13px 0;border-bottom:1px solid #f0e3d9}.pc-event-history-row:last-child{border-bottom:0}.pc-event-history-row h3{font-size:13px;margin:0 0 5px}.pc-event-history-row p{font-size:11px;color:#806d60;margin:0;line-height:1.6}.pc-event-select{border:1px solid #e3cbbb;border-radius:9px;background:#fffaf5;padding:9px;color:#5c4233;font-size:11px}@media(max-width:850px){.pc-event-stats{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:650px){.pc-event-grid,.pc-event-form{grid-template-columns:1fr}.pc-event-form .wide{grid-column:auto}.pc-event-panel{padding:13px}}
        `}</style>
        <div className="pc-event-page">
          <div className="pc-event-intro">
            <div><span className="pc-event-kicker">COMMUNITY & CONNECTION</span><h1>Events and Community Activities</h1><p>Discover upcoming gatherings, register for activities, and keep a record of your participation.</p></div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button className="pc-event-btn secondary" type="button" onClick={loadCommunityEvents} disabled={eventsLoading}>{eventsLoading ? "Refreshing…" : "Refresh"}</button>{canManageEvents && <button className="pc-event-btn" onClick={() => { setShowEventForm((v) => !v); setEventNotice(""); }}><Plus size={16}/>{showEventForm ? "Close event form" : "Create an event"}</button>}</div>
          </div>
          <div className="pc-event-stats">
            <div className="pc-event-stat"><span>Upcoming events</span><strong>{upcomingEvents.length}</strong></div>
            <div className="pc-event-stat"><span>Registered by you</span><strong>{registeredEvents.length}</strong></div>
            <div className="pc-event-stat"><span>Attended</span><strong>{attendedEvents.length}</strong></div>
            <div className="pc-event-stat"><span>Marked absent</span><strong>{absentEvents.length}</strong></div>
          </div>
          {eventNotice && <div className="pc-event-notice" role="status">{eventNotice}</div>}
          {showEventForm && canManageEvents && <section className="pc-event-panel"><div className="pc-event-panel-head"><div><h2>Propose a community event</h2><p>After submission, the President reviews it before members can see it.</p></div><span className="pc-event-status"><ShieldCheck size={13}/> Organizer access</span></div><form className="pc-event-form" onSubmit={createCommunityEvent}>
            <label>Event title<input value={eventDraft.title} onChange={(e)=>setEventDraft({...eventDraft,title:e.target.value})} placeholder="e.g. Community pottery workshop" required maxLength={100}/></label>
            <label>Venue<input value={eventDraft.venue} onChange={(e)=>setEventDraft({...eventDraft,venue:e.target.value})} placeholder="Enter venue or online meeting details" required maxLength={160}/></label>
            <label>Date<input type="date" value={eventDraft.date} min={today} onChange={(e)=>setEventDraft({...eventDraft,date:e.target.value})} required/></label>
            <label>Time<input type="time" value={eventDraft.time} onChange={(e)=>setEventDraft({...eventDraft,time:e.target.value})} required/></label>
            <label className="wide">Event announcement (optional)<textarea value={eventDraft.announcement} onChange={(e)=>setEventDraft({...eventDraft,announcement:e.target.value})} placeholder="Add a short announcement for members" maxLength={600}/></label>
            <label className="wide">Event details<textarea value={eventDraft.description} onChange={(e)=>setEventDraft({...eventDraft,description:e.target.value})} placeholder="Describe the event and who can attend" required maxLength={1200}/></label>
            <label className="pc-event-check wide"><input type="checkbox" checked={eventDraft.registrationEnabled} onChange={(e)=>setEventDraft({...eventDraft,registrationEnabled:e.target.checked})}/> Enable member registration for this event</label>
            <div className="wide"><button className="pc-event-btn" type="submit" disabled={eventsBusy}><Check size={15}/> {eventsBusy ? "Submitting…" : "Submit for approval"}</button></div>
          </form></section>}
          {canApproveEvents && pendingEvents.length > 0 && <section className="pc-event-panel"><div className="pc-event-panel-head"><div><h2>Events awaiting approval</h2><p>Approve an event before it appears to members.</p></div><span className="pc-event-status">{pendingEvents.length} pending</span></div>{pendingEvents.map((item) => <article key={item.id} className="pc-event-history-row"><div><h3>{item.title}</h3><p>{item.date} at {item.time} · {item.venue} · Proposed by {item.createdBy}</p><p>{item.description}</p></div><div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}><button type="button" className="pc-event-btn" disabled={eventsBusy} onClick={() => decideEvent(item.id, "APPROVE")}>Approve</button><button type="button" className="pc-event-btn secondary" disabled={eventsBusy} onClick={() => decideEvent(item.id, "REJECT")}>Reject</button></div></article>)}</section>}
          <section className="pc-event-panel"><div className="pc-event-panel-head"><div><h2>Upcoming events</h2><p>Only events published by an authorized organizer appear here.</p></div><span className="pc-event-status">{upcomingEvents.length} published</span></div>
            {eventsLoading ? <div className="pc-event-empty">Loading events…</div> : upcomingEvents.length ? <div className="pc-event-grid">{upcomingEvents.map((item)=>{const isRegistered=(item.registrations||[]).some((entry)=>entry.name===currentMemberName);const attendance=item.attendance||{};return <article className="pc-event-card" key={item.id}><div className="pc-event-card-top"><div className="pc-event-datebox"><div className="pc-event-date-icon"><CalendarDays size={21}/></div><div><h3>{item.title}</h3><small>Published by {item.createdBy || "Authorized organizer"}</small></div></div><span className="pc-event-status">{item.registrationEnabled ? "Registration open" : "Registration closed"}</span></div><div className="pc-event-card-body"><div className="pc-event-meta"><span><CalendarDays size={13}/>{item.date}</span><span><Clock size={13}/>{item.time}</span><span><MapPin size={13}/>{item.venue}</span></div><p>{item.description}</p>{item.announcement && <div className="pc-event-notice"><strong>Announcement:</strong> {item.announcement}</div>}<div className="pc-event-card-actions">{item.registrationEnabled && <button className="pc-event-btn secondary" disabled={eventsBusy || isRegistered} onClick={()=>registerForEvent(item.id)}>{isRegistered ? <><Check size={14}/> Registered</> : <>Register for event <ArrowRight size={14}/></>}</button>}{isRegistered && <span className="pc-event-status green">{attendance[currentMemberName]?.status || "Awaiting check-in"}</span>}{canManageEvents && <span className="pc-event-status">{item.registrationCount || 0} registrations</span>}</div>{canManageEvents && (item.registrations||[]).length>0 && <div style={{marginTop:14,paddingTop:12,borderTop:"1px solid #f0e3d9"}}><strong style={{fontSize:11}}>Attendance register</strong>{item.registrations.map((entry)=><div key={entry.user_id} className="pc-event-history-row"><div><h3>{entry.name}</h3><p>Registered {new Date(entry.registeredAt).toLocaleDateString()}</p></div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}><button className="pc-event-btn secondary" disabled={eventsBusy} onClick={()=>updateAttendance(item.id,entry.user_id,entry.name,"Attended")}>Mark attended</button><button className="pc-event-btn secondary" disabled={eventsBusy} onClick={()=>updateAttendance(item.id,entry.user_id,entry.name,"Absent")}>Mark absent</button></div></div>)}</div>}</div></article>})}</div> : <div className="pc-event-empty"><CalendarDays size={28}/><strong>No published events yet</strong></div>}
          </section>
          <section className="pc-event-panel"><div className="pc-event-panel-head"><div><h2>My event history</h2><p>Registration is not counted as attendance until an authorized organizer verifies check-in.</p></div><select className="pc-event-select" value={eventHistoryFilter} onChange={(e)=>setEventHistoryFilter(e.target.value)}><option>All</option><option>Awaiting check-in</option><option>Attended</option><option>Absent</option></select></div>
            {eventHistory.length ? eventHistory.map((item)=><div className="pc-event-history-row" key={item.id}><div><h3>{item.title}</h3><p>{item.date} at {item.time} · {item.venue}</p><p>Registered on {new Date((item.registrations||[]).find((entry)=>entry.name===currentMemberName)?.registeredAt || item.createdAt).toLocaleDateString()}</p></div><span className={`pc-event-status ${item.attendance?.[currentMemberName]?.status === "Attended" ? "green" : ""}`}>{item.attendance?.[currentMemberName]?.status || "Awaiting check-in"}</span></div>) : <div className="pc-event-empty"><CalendarDays size={24}/><strong>No event history yet</strong></div>}
          </section>
        </div>
      </PageWrapper>
    );
  }

  if (currentPage === "schemes") {
    return (
      <PageWrapper>
        <PageHeader
          title="Government Schemes"
          description="Browse schemes and access personalized recommendations."
        />

        <div className="member-service-banner">
          <div className="banner-icon">
            <Sparkles size={22} />
          </div>

          <div>
            <strong>
              Personalized Scheme Assistance
            </strong>

            <p>
              Your verified member profile can be used to
              identify schemes relevant to you.
            </p>
          </div>

          <button className="btn btn-primary">
            Check Eligibility
          </button>
        </div>

        <SchemeTypeTabs
          value={schemeScope}
          onChange={setSchemeScope}
          nationalCount={schemes.filter((item) => item.scope === "National").length}
          stateCount={schemes.filter((item) => item.scope === "State").length}
        />

        {schemes.filter((item) => item.scope === schemeScope).length > 0 ? (
          <div className="content-grid">
            {schemes
              .filter((item) => item.scope === schemeScope)
              .map((scheme) => (
                <SchemeCard key={scheme.id} scheme={scheme} />
              ))}
          </div>
        ) : (
          <EmptyState
            title={schemeScope === "National" ? "No all-India schemes listed" : "No state-specific schemes listed"}
            description="Schemes appear here only when their pottery-specific eligibility and official source have been verified."
          />
        )}
      </PageWrapper>
    );
  }

  if (currentPage === "scholarships") {
    return <ScholarshipPortalPage activeUser={activeUser} />;
  }

  if (currentPage === "marketplace" || currentPage === "checkout") {
    return <MarketplacePage currentPage={currentPage} authenticated={true} navigate={navigate} search={search} setSearch={setSearch} addToCart={addToCart} cart={cart} clearCart={clearCart} removeCartItem={removeCartItem} activeUser={activeUser} />;
  }

  if (currentPage === "matrimonial") {
    return (
      <PageWrapper>
        <MatrimonialPage authenticated activeUser={activeUser} />
      </PageWrapper>
    );
  }

  if (currentPage === "professional-network") {
    return <ProfessionalNetworkPage activeUser={activeUser} api={authApi} />;
  }

  if (currentPage === "members") {
    const canReviewMemberships = String(activeUser?.role || "").toUpperCase() === "ADMIN"
      || activeUser?.permissions?.includes("membership.review")
      || activeUser?.permissions?.includes("community.approve");
    const canViewMembers = String(activeUser?.role || "").toUpperCase() === "ADMIN"
      || activeUser?.permissions?.includes("membership.view")
      || activeUser?.permissions?.includes("members.manage");
    const canManageMembers = String(activeUser?.role || "").toUpperCase() === "ADMIN"
      || activeUser?.permissions?.includes("members.manage");
    const visibleMembers = memberDirectory.filter((member) => {
      const query = memberDirectorySearch.trim().toLowerCase();
      return (!query || `${member.full_name} ${member.membership_number || ""} ${member.role || ""}`.toLowerCase().includes(query));
    });

    return (
      <PageWrapper>
        <PageHeader
          title="Member Directory"
          description="Connect with verified Potter Community members."
        />

        {canReviewMemberships && (
          <div className="membership-admin-section">
            <div className="section-heading">
              <div>
                <h2>Membership Verification</h2>
                <p>Review applications and move them through document verification and committee approval.</p>
              </div>

              <button
                className="btn btn-outline"
                onClick={loadPendingMemberships}
                disabled={membershipLoading}
              >
                {membershipLoading ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            {membershipLoading ? (
              <div className="empty-state">
                Loading pending memberships...
              </div>
            ) : membershipError ? (
              <div className="empty-state" role="alert">
                {membershipError}
              </div>
            ) : pendingMemberships.length > 0 ? (
              <div className="content-grid">
                {pendingMemberships.map((user) => (
                  <div className="directory-card" key={user.id}>
                    <div className="directory-avatar">
                      {String(user.full_name || "?")
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>

                    <div className="directory-info">
                      <div className="name-line">
                        <h3>{user.full_name}</h3>
                      </div>

                      <span>{user.phone_number}</span>

                      {user.email && (
                        <div className="directory-details">
                          <span>{user.email}</span>
                        </div>
                      )}

                      <div className="directory-details">
                        <span>
                          Phone: {user.phone_verified ? "Verified" : "Not verified"}
                        </span>
                        <span>
                          Status: {user.membership_status}
                        </span>
                        <span>Stage: {(user.review_stage || "ADMIN_REVIEW").replaceAll("_", " ")}</span>
                      </div>
                      <div className="directory-details">
                        <span>Documents: {user.document_count || 0} uploaded</span>
                        <span>{user.approved_documents_count || 0} approved</span>
                      </div>

                      <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={() => viewMembershipApplication(user.id)}
                        >
                          View application
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No pending membership requests"
                description="All membership requests have been reviewed."
              />
            )}
          </div>
        )}

        {(String(activeUser?.role || "").toUpperCase() === "ADMIN" || activeUser?.permissions?.includes("membership.review")) && <FamilyReviewQueue />}

        <div className="directory-toolbar">
          <div className="search-box">
            <Search size={18} />
            <input placeholder="Search members..." value={memberDirectorySearch} onChange={(event) => setMemberDirectorySearch(event.target.value)} />
          </div>

          {canManageMembers && <button className="btn btn-outline" onClick={loadMemberDirectory} disabled={memberDirectoryLoading}>{memberDirectoryLoading ? "Refreshing…" : "Refresh"}</button>}
        </div>

        {!canViewMembers ? <EmptyState title="Member status access is not assigned" description="Ask an administrator to grant membership.view for read-only oversight." /> : memberDirectoryLoading && !memberDirectory.length ? <div className="empty-state">Loading approved members…</div> : visibleMembers.length > 0 ? (
          <div className="member-directory">
            {visibleMembers.map((member) => (
              <div
                className="directory-card"
                key={member.id}
              >
                <div className="directory-avatar">
                  {member.full_name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>

                <div className="directory-info">
                  <div className="name-line">
                    <h3>{member.full_name}</h3>

                    <CheckCircle
                      size={16}
                      className="verified-icon"
                    />
                  </div>

                  <span>{member.role} · {member.is_active ? "Active" : "Inactive"}</span>

                  <div className="directory-details">
                    <span>Membership ID: {member.membership_number || "Not assigned"}</span>
                    {canManageMembers && <button type="button" className="btn btn-outline" onClick={() => setMemberActivation(member, !member.is_active)}>{member.is_active ? "Deactivate access" : "Reactivate access"}</button>}
                  </div>
                </div>

              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title={memberDirectorySearch ? "No members match this search" : "No approved members yet"}
            description={memberDirectorySearch ? "Try a different name, membership number, or committee role." : "Approved member records will appear here after membership review."}
          />
        )}
      </PageWrapper>
    );
  }

  if (currentPage === "community-assistant") {
    return <CommunityAssistant />;
  }

  if (currentPage === "documents") {
    return <DocumentsPage />;
  }

  if (currentPage === "committee-directory") {
    return <CommitteeDirectoryPage activeUser={activeUser} />;
  }

  if (currentPage === "widow-assistance") {
    return <WidowAssistancePage activeUser={activeUser} />;
  }

  if (currentPage === "payments") {
    return <PaymentsPage activeRole={activeRole} activeUser={activeUser} cart={cart} />;
  }

  if (currentPage === "emergency") {
    return <EmergencyPage activeUser={activeUser} />;
  }

  if (currentPage === "notifications") {
    return <NotificationsPage />;
  }

  if (currentPage === "profile") {
    return <ProfilePage />;
  }

  if (currentPage === "settings") {
    return <SettingsPage activeUser={activeUser} />;
  }

  if (currentPage === "committee-roles") {
    return <SettingsPage activeUser={activeUser} committeeOnly />;
  }

  return <Dashboard navigate={navigate} activeUser={activeUser} />;
}

/* =========================================================
   MATRIMONIAL
========================================================= */

function MatrimonialPage({
  authenticated,
  activeUser,
  openMemberFeature,
}) {
  const [matrimonialProfiles, setMatrimonialProfiles] = useState([]);
  const [myMatrimonialProfile, setMyMatrimonialProfile] = useState(null);
  const [matrimonialReviewQueue, setMatrimonialReviewQueue] = useState([]);
  const [matrimonialError, setMatrimonialError] = useState("");
  const [matrimonialBusy, setMatrimonialBusy] = useState(false);
  const canReviewMatrimonial = String(activeUser?.role || "").toUpperCase() === "ADMIN" || activeUser?.permissions?.includes("matrimonial.review");
  const [matrimonialForm, setMatrimonialForm] = useState({ gender: "", education: "", occupation: "", location: "", marital_status: "", description: "", photo_data: "" });
  const loadMatrimonial = async () => {
    const [profilesResult, mineResult, queueResult] = await Promise.allSettled([authApi("/matrimonial"), authApi("/matrimonial/mine"), canReviewMatrimonial ? authApi("/matrimonial/review") : Promise.resolve([])]);
    if (profilesResult.status === "fulfilled") setMatrimonialProfiles(profilesResult.value);
    if (mineResult.status === "fulfilled") {
      const mine = mineResult.value; setMyMatrimonialProfile(mine);
      if (mine) setMatrimonialForm({ gender: mine.gender, education: mine.education, occupation: mine.occupation, location: mine.location, marital_status: mine.maritalStatus, description: mine.description, photo_data: mine.photoData || "" });
    }
    if (queueResult.status === "fulfilled") setMatrimonialReviewQueue(queueResult.value);
    const errorResult = [profilesResult, mineResult, queueResult].find(result => result.status === "rejected");
    setMatrimonialError(errorResult?.reason?.message || "");
  };
  useEffect(() => { if (authenticated) loadMatrimonial(); }, [authenticated, canReviewMatrimonial]);
  const saveMatrimonialProfile = async (event) => {
    event.preventDefault(); setMatrimonialBusy(true); setMatrimonialError("");
    try { await authApi("/matrimonial", { method: "POST", body: JSON.stringify(matrimonialForm) }); await loadMatrimonial(); }
    catch (error) { setMatrimonialError(error.message || "Profile could not be saved."); }
    finally { setMatrimonialBusy(false); }
  };
  const decideMatrimonialProfile = async (profileId, action) => {
    try { await authApi(`/matrimonial/${profileId}/decision`, { method: "PATCH", body: JSON.stringify({ action }) }); await loadMatrimonial(); }
    catch (error) { setMatrimonialError(error.message || "Review action failed."); }
  };
  const [genderFilter, setGenderFilter] =
    useState("All");

  const [locationFilter, setLocationFilter] =
    useState("All");

  const [search, setSearch] = useState("");
  const [maritalFilter, setMaritalFilter] = useState("All");
  const [educationFilter, setEducationFilter] = useState("All");
  const [ageRange, setAgeRange] = useState("All");
  const [shortlistedIds, setShortlistedIds] = useState([]);
  const [showShortlistedOnly, setShowShortlistedOnly] = useState(false);
  const [selectedMatrimonialProfile, setSelectedMatrimonialProfile] = useState(null);
  const usingDemoProfiles = matrimonialProfiles.length === 0;
  const displayedProfiles = usingDemoProfiles ? DEMO_MATRIMONIAL_PROFILES : matrimonialProfiles;

  const filteredProfiles =
    displayedProfiles.filter((profile) => {
      const genderMatch =
        genderFilter === "All" ||
        profile.gender === genderFilter;

      const locationMatch =
        locationFilter === "All" ||
        profile.location === locationFilter;

      const searchText = `${profile.name} ${profile.occupation} ${profile.education} ${profile.description || ""} ${profile.interests || ""}`.toLowerCase();
      const searchMatch = searchText.includes(search.toLowerCase());
      const maritalMatch = maritalFilter === "All" || (profile.maritalStatus || profile.marital_status) === maritalFilter;
      const educationMatch = educationFilter === "All" || (profile.education || "").toLowerCase().includes(educationFilter.toLowerCase());
      const ageMatch = ageRange === "All" || (ageRange === "21-25" && profile.age >= 21 && profile.age <= 25) || (ageRange === "26-30" && profile.age >= 26 && profile.age <= 30) || (ageRange === "31-35" && profile.age >= 31 && profile.age <= 35) || (ageRange === "36+" && profile.age >= 36);
      const shortlistMatch = !showShortlistedOnly || shortlistedIds.includes(profile.id);
      return genderMatch && locationMatch && searchMatch && maritalMatch && educationMatch && ageMatch && shortlistMatch;
    });

  return (
    <div>
      <div className="matrimonial-header">
        <div>
          <div className="matrimonial-badge">
            <Heart size={14} />
            COMMUNITY MATRIMONIAL
          </div>

          <h1>Find Your Best Match</h1>

          <p>
            Discover compatible profiles within the verified
            Potter Community.
          </p>
        </div>

        <div className="matrimonial-heart">
          <Heart size={35} />
        </div>
      </div>

      <div className="matrimonial-info">
        <div>
          <ShieldCheck size={21} />

          <div>
            <strong>
              Verified Community Profiles
            </strong>

            <span>
              Profiles are designed for community members
              looking for meaningful matches.
            </span>
          </div>
        </div>

        {!authenticated && (
          <button
            className="btn btn-primary"
            onClick={() =>
              openMemberFeature?.("matrimonial")
            }
          >
            Unlock Full Matching
            <ArrowRight size={16} />
          </button>
        )}
      </div>

      {authenticated && <section className="matrimonial-membership-box matrimonial-profile-panel" style={{ display: "block", marginBottom: 24 }}>
        <div className="matrimonial-profile-heading">
          <div className="matrimonial-profile-heading-icon"><Heart size={20} /></div>
          <div>
            <span className="matrimonial-section-eyebrow">YOUR COMMUNITY PROFILE</span>
            <h2>{myMatrimonialProfile ? "Your matrimonial profile" : "Create a matrimonial profile"}</h2>
          </div>
          {myMatrimonialProfile && <span className="matrimonial-status-pill">{myMatrimonialProfile.status}</span>}
        </div>
        <p className="matrimonial-profile-intro">Only verified members aged 18 or above can submit. Your profile appears to verified members after committee approval. Date of birth, phone number, exact address and documents remain private.</p>
        {matrimonialError && <p className="matrimonial-form-alert" role="alert">{matrimonialError}</p>}
        <form onSubmit={saveMatrimonialProfile} className="matrimonial-profile-form">
          <label className="matrimonial-field"><span>Gender</span><select required value={matrimonialForm.gender} onChange={e => setMatrimonialForm({ ...matrimonialForm, gender: e.target.value })}><option value="">Select gender</option><option>Male</option><option>Female</option><option>Other</option></select></label>
          <label className="matrimonial-field"><span>Education</span><input required maxLength={160} placeholder="e.g. Bachelor's degree" value={matrimonialForm.education} onChange={e => setMatrimonialForm({ ...matrimonialForm, education: e.target.value })} /></label>
          <label className="matrimonial-field"><span>Occupation</span><input required maxLength={160} placeholder="e.g. Potter / Business owner" value={matrimonialForm.occupation} onChange={e => setMatrimonialForm({ ...matrimonialForm, occupation: e.target.value })} /></label>
          <label className="matrimonial-field"><span>City or district</span><input required maxLength={120} placeholder="City or district (no exact address)" value={matrimonialForm.location} onChange={e => setMatrimonialForm({ ...matrimonialForm, location: e.target.value })} /></label>
          <label className="matrimonial-field"><span>Marital status</span><select required value={matrimonialForm.marital_status} onChange={e => setMatrimonialForm({ ...matrimonialForm, marital_status: e.target.value })}><option value="">Select status</option><option>Never married</option><option>Widowed</option><option>Divorced</option><option>Other</option></select></label>
          <div className="matrimonial-photo-field matrimonial-field-full">
            <div className="matrimonial-photo-copy">
              <span className="matrimonial-photo-label">Profile photo <small>(optional)</small></span>
              <p>Add a clear, recent photo so verified members can recognize your profile.</p>
              <label className="matrimonial-photo-button" htmlFor="matrimonial-profile-photo"><ImagePlus size={16} /> {matrimonialForm.photo_data ? "Change photo" : "Choose photo"}</label>
              <input id="matrimonial-profile-photo" className="matrimonial-photo-input" type="file" accept="image/png,image/jpeg,image/webp" onChange={async e => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (!/^image\/(png|jpeg|webp)$/.test(file.type)) { setMatrimonialError("Choose a JPG, PNG, or WEBP image."); e.target.value = ""; return; }
                if (file.size > 5 * 1024 * 1024) { setMatrimonialError("Profile photos must be 5 MB or smaller."); e.target.value = ""; return; }
                const reader = new FileReader();
                reader.onload = () => { setMatrimonialForm(current => ({ ...current, photo_data: String(reader.result || "") })); setMatrimonialError(""); };
                reader.onerror = () => setMatrimonialError("The selected photo could not be read. Please try another image.");
                reader.readAsDataURL(file);
              }} />
              <small>JPG, PNG or WEBP · Maximum 5 MB. Your photo is shown only after profile approval.</small>
            </div>
            <div className="matrimonial-photo-preview">
              {matrimonialForm.photo_data ? <><img src={matrimonialForm.photo_data} alt="Matrimonial profile preview" /><button type="button" className="matrimonial-photo-remove" onClick={() => { setMatrimonialForm(current => ({ ...current, photo_data: "" })); const input = document.getElementById("matrimonial-profile-photo"); if (input) input.value = ""; }}>Remove photo</button></> : <div className="matrimonial-photo-placeholder"><UserRound size={30} /><span>Photo preview</span></div>}
            </div>
          </div>
          <label className="matrimonial-field matrimonial-field-full"><span>Short introduction</span><textarea required minLength={10} maxLength={1200} placeholder="Share a little about yourself, your interests and what matters to you…" value={matrimonialForm.description} onChange={e => setMatrimonialForm({ ...matrimonialForm, description: e.target.value })} /><small>Enter at least 10 characters. Please don't include private contact details.</small></label>
          <div className="matrimonial-form-footer"><span><ShieldCheck size={15} /> Your details are reviewed before the profile is published.</span><button className="btn btn-primary" disabled={matrimonialBusy}>{matrimonialBusy ? "Saving…" : myMatrimonialProfile ? "Update profile for review" : "Submit for review"}<ArrowRight size={16} /></button></div>
        </form>
      </section>}
      {canReviewMatrimonial && matrimonialReviewQueue.length > 0 && <section className="matrimonial-membership-box" style={{ display: "block", marginBottom: 24 }}><h2>Profiles awaiting review</h2>{matrimonialReviewQueue.map(profile => <article key={profile.id} style={{ padding: 16, borderBottom: "1px solid #ead9cf" }}><strong>{profile.name}, {profile.age}</strong>{profile.photoData && <img src={profile.photoData} alt="Profile awaiting review" style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 12, display: "block", margin: "8px 0" }} />}<p>{profile.gender} · {profile.location} · {profile.education} · {profile.occupation} · {profile.maritalStatus}</p><p>{profile.description}</p><button className="btn btn-primary" onClick={() => decideMatrimonialProfile(profile.id, "APPROVE")}>Approve</button> <button className="btn btn-outline" onClick={() => decideMatrimonialProfile(profile.id, "REJECT")}>Reject</button></article>)}</section>}

      <div className="matrimonial-toolbar">
        <div className="search-box">
          <Search size={18} />

          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search by name, education or occupation..."
          />
        </div>

        <div className="matrimonial-filter">
          <SlidersHorizontal size={16} />

          <select
            value={genderFilter}
            onChange={(e) =>
              setGenderFilter(e.target.value)
            }
          >
            <option value="All">All Profiles</option>
            <option value="Male">Men</option>
            <option value="Female">Women</option>
          </select>
        </div>

        <div className="matrimonial-filter">
          <MapPin size={16} />

          <select
            value={locationFilter}
            onChange={(e) =>
              setLocationFilter(e.target.value)
            }
          >
            <option value="All">All Locations</option>
            {Array.from(
              new Set(displayedProfiles.map((p) => p.location))
            ).map((location) => (
              <option value={location} key={location}>
                {location}
              </option>
            ))}
          </select>
        </div>
        <div className="matrimonial-filter"><SlidersHorizontal size={16} /><select value={ageRange} onChange={e => setAgeRange(e.target.value)}><option value="All">Any age</option><option value="21-25">21–25 years</option><option value="26-30">26–30 years</option><option value="31-35">31–35 years</option><option value="36+">36+ years</option></select></div>
        <div className="matrimonial-filter"><Heart size={16} /><select value={maritalFilter} onChange={e => setMaritalFilter(e.target.value)}><option value="All">Any marital status</option><option>Never married</option><option>Divorced</option><option>Widowed</option></select></div>
        <div className="matrimonial-filter"><GraduationCap size={16} /><select value={educationFilter} onChange={e => setEducationFilter(e.target.value)}><option value="All">Any education</option><option value="B.Tech">B.Tech</option><option value="B.Com">B.Com</option><option value="B.Sc">B.Sc</option><option value="B.A.">B.A.</option><option value="M.A.">M.A.</option><option value="MBA">MBA</option><option value="Diploma">Diploma</option></select></div>
        <button type="button" className="btn btn-outline" onClick={() => setShowShortlistedOnly(value => !value)}><Bookmark size={15} /> {showShortlistedOnly ? "All profiles" : `Shortlisted (${shortlistedIds.length})`}</button>
        <button type="button" className="btn btn-outline" onClick={() => { setGenderFilter("All"); setLocationFilter("All"); setMaritalFilter("All"); setEducationFilter("All"); setAgeRange("All"); setSearch(""); setShowShortlistedOnly(false); }}>Clear filters</button>
      </div>

      <div className="matrimonial-stats">
        <div>
          <strong>
            {displayedProfiles.length}
          </strong>
          <span>Profiles</span>
        </div>

        <div>
          <strong>
            {
              displayedProfiles.filter(
                (p) => p.gender === "Male"
              ).length
            }
          </strong>
          <span>Men</span>
        </div>

        <div>
          <strong>
            {
              displayedProfiles.filter(
                (p) => p.gender === "Female"
              ).length
            }
          </strong>
          <span>Women</span>
        </div>

        <div>
          <strong>{matrimonialProfiles.filter((p) => p.status === "PUBLISHED").length}</strong>
          <span>Published Profiles</span>
        </div>
      </div>

      {filteredProfiles.length > 0 ? (
        <div className="matrimonial-grid">
          {filteredProfiles.map((profile) => (
            <MatrimonialCard
              key={profile.id}
              profile={profile}
              authenticated={authenticated}
              isDemo={usingDemoProfiles}
              openMemberFeature={openMemberFeature}
              isShortlisted={shortlistedIds.includes(profile.id)}
              onToggleShortlist={() => setShortlistedIds(current => current.includes(profile.id) ? current.filter(id => id !== profile.id) : [...current, profile.id])}
              onViewMatch={() => setSelectedMatrimonialProfile(profile)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No approved matrimonial profiles published yet"
          description="Approved profiles from verified adult members will appear here."
        />
      )}

      {selectedMatrimonialProfile && <div className="matrimonial-modal-backdrop" role="presentation" onClick={() => setSelectedMatrimonialProfile(null)}><section className="matrimonial-detail-modal" role="dialog" aria-modal="true" aria-label="Matrimonial profile details" onClick={event => event.stopPropagation()}><button type="button" className="matrimonial-modal-close" onClick={() => setSelectedMatrimonialProfile(null)} aria-label="Close details">×</button><div className="matrimonial-modal-heading"><div className="matrimonial-avatar">{selectedMatrimonialProfile.photoData ? <img src={selectedMatrimonialProfile.photoData} alt="" /> : selectedMatrimonialProfile.name.split(/\s+/).map(part => part[0]).slice(0, 2).join("").toUpperCase()}</div><div><h2>{selectedMatrimonialProfile.name}</h2><p>{selectedMatrimonialProfile.age} years · {selectedMatrimonialProfile.gender} · {selectedMatrimonialProfile.location}</p></div></div><div className="matrimonial-modal-facts"><p><strong>Education:</strong> {selectedMatrimonialProfile.education}</p><p><strong>Occupation:</strong> {selectedMatrimonialProfile.occupation}</p><p><strong>Marital status:</strong> {selectedMatrimonialProfile.maritalStatus || selectedMatrimonialProfile.marital_status || "Not specified"}</p><p><strong>Interests:</strong> {selectedMatrimonialProfile.interests || "Not specified"}</p></div><p>{selectedMatrimonialProfile.description}</p><small>Demo profiles are fictional examples. Contact details are not displayed.</small><div className="matrimonial-modal-actions"><button className="btn btn-outline" onClick={() => setShortlistedIds(current => current.includes(selectedMatrimonialProfile.id) ? current.filter(id => id !== selectedMatrimonialProfile.id) : [...current, selectedMatrimonialProfile.id])}><Bookmark size={15} /> {shortlistedIds.includes(selectedMatrimonialProfile.id) ? "Remove shortlist" : "Add to shortlist"}</button><button className="btn btn-primary" onClick={() => setSelectedMatrimonialProfile(null)}>Close</button></div></section></div>}

      {!authenticated && (
        <div className="matrimonial-membership-box">
          <div className="matrimonial-membership-icon">
            <Heart size={25} />
          </div>

          <div>
            <h2>Looking for a serious match?</h2>

            <p>
              Verified members can unlock advanced
              matrimonial features including detailed
              preferences, shortlist, compatibility
              information and contact requests.
            </p>
          </div>

          <button
            className="btn btn-primary"
            onClick={() =>
              openMemberFeature?.("matrimonial")
            }
          >
            Become a Member
            <ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

function MatrimonialCard({
  profile,
  authenticated,
  isDemo = false,
  openMemberFeature,
  isShortlisted = false,
  onToggleShortlist,
  onViewMatch,
}) {
  return (
    <div className="matrimonial-card">
      <div className="matrimonial-image">
        <div className="matrimonial-avatar" aria-label={`${profile.name} profile`}>{profile.photoData ? <img src={profile.photoData} alt={`${profile.name} profile`} /> : profile.name.split(/\s+/).map(part => part[0]).slice(0, 2).join("").toUpperCase()}</div>

        <div className="profile-gender">
          {profile.gender}
        </div>

        {(profile.verified || profile.status === "PUBLISHED") && !isDemo && (
          <div className="profile-verified-tag">
            <CheckCircle size={13} />
            Verified
          </div>
        )}
      </div>

      <div className="matrimonial-card-body">
        <div className="matrimonial-name">
          <h3>{profile.name}</h3>
          <span>{profile.age} yrs</span>
        </div>

        <div className="matrimonial-location">
          <MapPin size={13} />
          {profile.location}
        </div>

        <div className="matrimonial-details">
          <div>
            <GraduationCap size={14} />
            <span>{profile.education}</span>
          </div>

          <div>
            <Briefcase size={14} />
            <span>{profile.occupation}</span>
          </div>
        </div>

        <div className="matrimonial-interest">
          <strong>Interests</strong>
          <span>{profile.description || profile.interests || "Community member profile"}</span>
        </div>

        <div className="matrimonial-card-actions">
          {authenticated ? (
            <>
              <button className="btn btn-outline" onClick={onToggleShortlist}>
                <Bookmark size={15} />
                {isShortlisted ? "Shortlisted" : "Shortlist"}
              </button>

              <button className="btn btn-primary" onClick={onViewMatch}>
                <Heart size={15} />
                View Details
              </button>
            </>
          ) : (
            <>
              <button
                className="btn btn-outline"
                onClick={() =>
                  openMemberFeature?.("matrimonial")
                }
              >
                <Lock size={14} />
                Details
              </button>

              <button
                className="btn btn-primary"
                onClick={() =>
                  openMemberFeature?.("matrimonial")
                }
              >
                Become Member
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   DASHBOARD
========================================================= */

function CommitteeDirectoryPage({ activeUser }) {
  const [committee, setCommittee] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const approved = String(activeUser?.membership_status || "").toUpperCase() === "APPROVED";

  const loadCommittee = async () => {
    setLoading(true);
    setError("");
    try {
      const rows = await authApi("/admin/roles/directory");
      setCommittee(Array.isArray(rows) ? rows : []);
    } catch (loadError) {
      setError(loadError.message || "Could not load the committee directory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (approved) loadCommittee();
  }, [approved]);

  if (!approved) {
    return <PageWrapper><PageHeader title="Committee Directory" description="This directory is available to approved members." /></PageWrapper>;
  }

  const visibleCommittee = committee.filter((member) =>
    `${member.name} ${member.designation} ${member.email || ""}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageWrapper>
      <PageHeader title="Committee Directory" description="Find current committee members, their designations, and community contact emails." />
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", margin: "18px 0" }}>
        <div className="search-box" style={{ flex: "1 1 280px" }}><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, designation, or email" aria-label="Search committee members" /></div>
        <button type="button" className="btn btn-outline" onClick={loadCommittee} disabled={loading}>{loading ? "Refreshing…" : "Refresh"}</button>
      </div>
      {error && <p role="alert" style={{ color: "#a13d2d", fontSize: 12 }}>{error}</p>}
      {loading ? <div className="empty-state">Loading committee directory…</div> : visibleCommittee.length ? (
        <div className="content-grid">
          {visibleCommittee.map((member) => <article key={`${member.member_id}-${member.designation}`} style={{ display: "flex", gap: 13, alignItems: "center", minWidth: 0, padding: 16, border: "1px solid #ead8c9", borderRadius: 13, background: "#fffdf9" }}>
            <div style={{ display: "grid", placeItems: "center", width: 48, height: 48, flex: "0 0 auto", borderRadius: 16, background: "#f3e2d5", color: "#9e5237", fontWeight: 850 }}>{member.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</div>
            <div style={{ minWidth: 0 }}>
              <h2 style={{ margin: "0 0 4px", color: "#503326", fontSize: 15 }}>{member.name}</h2>
              <div style={{ color: "#a65335", fontSize: 12, fontWeight: 750 }}>{member.designation}</div>
              {member.email ? <a href={`mailto:${member.email}`} style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 7, color: "#786457", fontSize: 12, overflowWrap: "anywhere" }}><Mail size={14} />{member.email}</a> : <span style={{ display: "block", marginTop: 7, color: "#806b5e", fontSize: 11 }}>No email address on file</span>}
              {(member.term_start || member.term_end) && <small style={{ display: "block", marginTop: 6, color: "#806b5e" }}>Term: {member.term_start || "—"} to {member.term_end || "—"}</small>}
            </div>
          </article>)}
        </div>
      ) : <EmptyState title={search ? "No committee members match" : "No active committee members listed"} description={search ? "Try another name or designation." : "Current committee assignments will appear here."} />}
    </PageWrapper>
  );
}

function MyCommitteeElectionProof() {
  const [assignments, setAssignments] = useState([]);
  const [files, setFiles] = useState({});
  const [titles, setTitles] = useState({});
  const [busyId, setBusyId] = useState(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const loadAssignments = async () => {
    try {
      const rows = await authApi("/admin/roles/my-assignments");
      setAssignments(Array.isArray(rows) ? rows : []);
    } catch (loadError) {
      setError(loadError.message || "Could not load committee assignments.");
    }
  };

  useEffect(() => { loadAssignments(); }, []);

  const uploadProof = async (event, assignment) => {
    event.preventDefault();
    const file = files[assignment.id];
    if (!file) {
      setError("Choose your election result or certificate file first.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Election proof files must be 5 MB or smaller.");
      return;
    }
    const formData = new FormData();
    formData.append("title", (titles[assignment.id] || "").trim() || "Election result proof");
    formData.append("file", file);
    setBusyId(assignment.id);
    setError("");
    setNotice("");
    try {
      await authApi(`/admin/roles/assignments/${assignment.id}/election-documents`, { method: "POST", body: formData });
      setNotice(`Your election proof for ${assignment.role} was submitted.`);
      setFiles((previous) => ({ ...previous, [assignment.id]: null }));
      setTitles((previous) => ({ ...previous, [assignment.id]: "" }));
      await loadAssignments();
    } catch (uploadError) {
      setError(uploadError.message || "Could not submit the election proof.");
    } finally {
      setBusyId(null);
    }
  };

  const openProof = async (proof) => {
    const token = sessionStorage.getItem("potterCommunityAccessToken") || localStorage.getItem("token");
    const preview = window.open("", "_blank");
    try {
      const response = await fetch(`${AUTH_API_BASE}${proof.file_url}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!response.ok) throw new Error("Could not open this document.");
      const objectUrl = URL.createObjectURL(await response.blob());
      if (preview) {
        preview.opener = null;
        preview.location.href = objectUrl;
      } else {
        const link = document.createElement("a");
        link.href = objectUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.click();
      }
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch (openError) {
      preview?.close();
      setError(openError.message || "Could not open this document.");
    }
  };

  const removeProof = async (assignment, proof) => {
    if (!window.confirm(`Remove your document “${proof.title}”?`)) return;
    setError("");
    setNotice("");
    try {
      await authApi(`/admin/roles/assignments/${assignment.id}/election-documents/${proof.id}`, { method: "DELETE" });
      setNotice("Election proof removed.");
      await loadAssignments();
    } catch (removeError) {
      setError(removeError.message || "Could not remove the document.");
    }
  };

  if (!assignments.length && !error) return null;

  return (
    <section style={{ margin: "0 0 22px", padding: 18, border: "1px solid #ead8c9", borderRadius: 14, background: "#fffdf9" }}>
      <span style={{ color: "#a65335", fontSize: 10, fontWeight: 900, letterSpacing: ".12em" }}>YOUR COMMITTEE ROLE</span>
      <h2 style={{ margin: "5px 0 7px", color: "#503326", fontSize: 19 }}>Submit election proof</h2>
      <p style={{ margin: "0 0 13px", color: "#806b5e", fontSize: 12, lineHeight: 1.6 }}>Upload the official election result, certificate, or signed meeting record for your committee appointment. Your proof is stored privately and can be reviewed by authorized role managers.</p>
      {error && <p role="alert" style={{ color: "#a13d2d", fontSize: 12 }}>{error}</p>}
      {notice && <p role="status" style={{ color: "#39734a", fontSize: 12 }}>{notice}</p>}
      <div style={{ display: "grid", gap: 11 }}>
        {assignments.map((assignment) => <article key={assignment.id} style={{ padding: 12, border: "1px solid #efe2d8", borderRadius: 10, background: "#fff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
            <strong style={{ color: "#503326", fontSize: 13 }}>{assignment.role}</strong>
            <span style={{ color: "#806b5e", fontSize: 11 }}>{assignment.term_start || "Start not set"} → {assignment.term_end || "End not set"} · {assignment.status}</span>
          </div>
          {assignment.election_documents?.length > 0 && <div style={{ display: "grid", gap: 7, marginBottom: 10 }}>
            {assignment.election_documents.map((proof) => <div key={proof.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 9, flexWrap: "wrap", padding: 9, border: "1px solid #f0e2d8", borderRadius: 8, background: "#fffaf6" }}>
              <span style={{ color: "#624b3d", fontSize: 11 }}>{proof.title} · {proof.original_filename}<small style={{ display: "block", marginTop: 3, color: "#806b5e" }}>Submitted {new Date(proof.created_at).toLocaleString()}</small></span>
              <div style={{ display: "flex", gap: 7 }}><button type="button" className="btn btn-outline" onClick={() => openProof(proof)}>View</button><button type="button" className="btn btn-outline" onClick={() => removeProof(assignment, proof)}>Remove</button></div>
            </div>)}
          </div>}
          <form onSubmit={(event) => uploadProof(event, assignment)} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 8, alignItems: "center" }}>
            <input aria-label={`Document title for ${assignment.role}`} value={titles[assignment.id] || ""} onChange={(event) => setTitles((previous) => ({ ...previous, [assignment.id]: event.target.value }))} placeholder="Document title (optional)" maxLength={160} style={{ minWidth: 0, padding: 9, border: "1px solid #ddc9b7", borderRadius: 8 }} />
            <input aria-label={`Election proof file for ${assignment.role}`} type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={(event) => setFiles((previous) => ({ ...previous, [assignment.id]: event.target.files?.[0] || null }))} style={{ minWidth: 0, color: "#624b3d", fontSize: 11 }} />
            <button type="submit" className="btn btn-primary" disabled={busyId === assignment.id}>{busyId === assignment.id ? "Submitting…" : "Submit proof"}</button>
            {files[assignment.id] && <small style={{ gridColumn: "1 / -1", color: "#806b5e" }}>{files[assignment.id].name} · PDF, JPG, or PNG · Max 5 MB</small>}
          </form>
        </article>)}
      </div>
    </section>
  );
}

function Dashboard({ navigate, activeRole = "General Member", activeUser = null }) {
  const [marketplaceProductCount, setMarketplaceProductCount] = useState(0);
  const [profile, setProfile] = useState(() => {
    try {
      return getStoredProfile();
    } catch {
      return { fullName: "", profilePhoto: "" };
    }
  });

  useEffect(() => {
    const updateProfile = () => {
      setProfile(getStoredProfile());
    };

    window.addEventListener("potter-profile-updated", updateProfile);
    return () => window.removeEventListener("potter-profile-updated", updateProfile);
  }, []);

  useEffect(() => {
    let cancelled = false;

    authApi("/marketplace/products")
      .then((rows) => {
        if (!cancelled) {
          setMarketplaceProductCount(Array.isArray(rows) ? rows.length : 0);
        }
      })
      .catch(() => {
        if (!cancelled) setMarketplaceProductCount(0);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const dashboardRole = normalizeCommunityRole(activeRole);
  const dashboardConfig = ROLE_DASHBOARD_CONFIG[dashboardRole] || (() => {
    const permissionActions = [
      ["membership.review", { label: "Membership applications", page: "members" }],
      ["membership.view", { label: "Member status", page: "members" }],
      ["announcements.manage", { label: "Announcements", page: "announcements" }],
      ["events.manage", { label: "Events", page: "events" }],
      ["community.records.view", { label: "Official records", page: "community-records" }],
      ["community.records.manage", { label: "Official records", page: "community-records" }],
      ["finance.manage", { label: "Payments & Fees", page: "payments" }],
      ["scholarships.review", { label: "Scholarships", page: "scholarships" }],
      ["matrimonial.review", { label: "Matrimonial", page: "matrimonial" }],
      ["roles.manage", { label: "Committee & Roles", page: "committee-roles" }],
      ["membership.review", { label: "Help & Support", page: "support-inquiries" }],
      ["emergency.manage", { label: "Emergency Requests", page: "emergency" }],
    ]
      .filter(([permission]) => activeUser?.permissions?.includes(permission))
      .map(([, action]) => action);

    return {
      title: `${dashboardRole} Dashboard`,
      description: "Your community responsibilities and authorized tools.",
      actions: [...permissionActions, { label: "My Profile", page: "profile" }],
    };
  })();

  const membershipStatus = String(
    activeUser?.membership_status ??
    activeUser?.membershipStatus ??
    profile.membershipStatus ??
    "PENDING"
  ).toUpperCase();

  const displayName =
    activeUser?.full_name ||
    activeUser?.fullName ||
    activeUser?.name ||
    profile.fullName ||
    "Member";

  const initials = displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "PC";

  const isVerified = membershipStatus === "APPROVED";

  return (
    <PageWrapper>
      <style>{`
        .potter-dashboard {
          --pd-ink: #493024;
          --pd-muted: #806b5e;
          --pd-line: #ead8ca;
          --pd-primary: #a65a3a;
          color: var(--pd-ink);
        }

        .potter-dashboard .dashboard-welcome {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
          margin-bottom: 22px;
          padding: 25px 27px;
          border: 1px solid #ead7c8;
          border-radius: 19px;
          background:
            radial-gradient(circle at 90% 10%, rgba(205,153,111,.17), transparent 35%),
            linear-gradient(115deg, #fffaf5 0%, #f7e8dc 100%);
          box-shadow: 0 9px 26px rgba(83,49,29,.045);
        }

        .potter-dashboard .welcome-small {
          display: inline-block;
          margin-bottom: 8px;
          color: #a65335;
          font-size: 10px;
          font-weight: 850;
          letter-spacing: .16em;
        }

        .potter-dashboard .dashboard-welcome h1 {
          margin: 0 0 7px;
          color: #503326;
          font-size: clamp(23px, 3vw, 30px);
          line-height: 1.2;
          letter-spacing: -.035em;
        }

        .potter-dashboard .dashboard-welcome p {
          margin: 0;
          color: #806b5e;
          font-size: 13px;
          line-height: 1.65;
        }

        .potter-dashboard .verified-badge-large {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border: 1px solid ${isVerified ? "#cfe4d2" : "#efd9b7"};
          border-radius: 30px;
          background: ${isVerified ? "#eff8f0" : "#fff8eb"};
          color: ${isVerified ? "#397448" : "#94601d"};
          font-size: 12px;
          font-weight: 750;
          white-space: nowrap;
        }

        .potter-dashboard .dashboard-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin: 0 0 22px;
        }

        .potter-dashboard .dashboard-community-intro {
          display: grid;
          grid-template-columns: minmax(0, 1.3fr) minmax(270px, .9fr);
          gap: 22px;
          align-items: center;
          margin: 0 0 22px;
          padding: 26px 28px;
          border: 1px solid #ead7c8;
          border-radius: 20px;
          background:
            radial-gradient(circle at 95% 5%, rgba(255,255,255,.72), transparent 32%),
            linear-gradient(115deg, #fffaf5 0%, #f5e5d8 58%, #eed8c7 100%);
          box-shadow: 0 10px 28px rgba(83,49,29,.05);
          overflow: hidden;
        }

        .potter-dashboard .section-eyebrow {
          display: block;
          margin-bottom: 9px;
          color: #a65335;
          font-size: 10px;
          font-weight: 850;
          letter-spacing: .15em;
          text-transform: uppercase;
        }

        .potter-dashboard .dashboard-community-intro h2 {
          margin: 0 0 9px;
          color: #503326;
          font-size: clamp(21px, 2.5vw, 26px);
          line-height: 1.25;
          letter-spacing: -.03em;
        }

        .potter-dashboard .dashboard-community-intro p {
          max-width: 650px;
          margin: 0;
          color: #806b5e;
          font-size: 13px;
          line-height: 1.8;
        }

        .potter-dashboard .community-pillars {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 9px;
        }

        .potter-dashboard .community-pillar {
          min-width: 0;
          padding: 15px 12px;
          border: 1px solid rgba(166,90,58,.17);
          border-radius: 14px;
          background: rgba(255,253,249,.78);
        }

        .potter-dashboard .community-pillar span {
          display: block;
          margin-bottom: 9px;
          color: #b16a49;
          font-size: 10px;
          font-weight: 850;
          letter-spacing: .08em;
        }

        .potter-dashboard .community-pillar strong {
          display: block;
          color: #563a2b;
          font-size: 13px;
        }

        .potter-dashboard .community-pillar small {
          display: block;
          margin-top: 4px;
          color: #967e6d;
          font-size: 10px;
          line-height: 1.5;
        }

        .potter-dashboard .dashboard-content-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.35fr) minmax(270px, .85fr);
          gap: 18px;
          align-items: stretch;
          margin-bottom: 20px;
        }

        .potter-dashboard .dashboard-main-card,
        .potter-dashboard .dashboard-side-card,
        .potter-dashboard .dashboard-heritage-card {
          min-width: 0;
          padding: 23px;
          border: 1px solid #ead8ca;
          border-radius: 18px;
          background: #fff;
          box-shadow: 0 8px 24px rgba(83,49,29,.045);
        }

        .potter-dashboard .card-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 17px;
        }

        .potter-dashboard .card-heading span {
          display: block;
          margin-bottom: 5px;
          color: #a65335;
          font-size: 9px;
          font-weight: 850;
          letter-spacing: .14em;
        }

        .potter-dashboard .card-heading h2 {
          margin: 0;
          color: #503326;
          font-size: 17px;
          font-weight: 800;
        }

        .potter-dashboard .announcement-list {
          display: grid;
          gap: 12px;
        }

        .potter-dashboard .announcement-row {
          display: flex;
          align-items: flex-start;
          gap: 13px;
          padding: 13px;
          border: 1px solid #f0e4dc;
          border-radius: 13px;
          background: #fffdfb;
        }

        .potter-dashboard .announcement-date {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex: 0 0 47px;
          min-height: 48px;
          border-radius: 11px;
          background: #f7e8dc;
          color: #9b5738;
          font-weight: 800;
        }

        .potter-dashboard .announcement-date span {
          font-size: 13px;
        }

        .potter-dashboard .announcement-date small {
          font-size: 9px;
          text-transform: uppercase;
        }

        .potter-dashboard .announcement-row h3 {
          margin: 1px 0 5px;
          color: #503326;
          font-size: 13px;
        }

        .potter-dashboard .announcement-row p {
          margin: 0;
          color: #806b5e;
          font-size: 12px;
          line-height: 1.65;
        }

        .potter-dashboard .dashboard-empty-message {
          margin: 0;
          padding: 22px;
          border-radius: 13px;
          background: #fff8f2;
          color: #927b6b;
          font-size: 13px;
          line-height: 1.7;
        }

        .potter-dashboard .profile-summary {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 7px 0 3px;
          text-align: center;
        }

        .potter-dashboard .profile-avatar-large {
          display: grid;
          place-items: center;
          width: 76px;
          height: 76px;
          overflow: hidden;
          margin-bottom: 12px;
          border: 1px solid #e9cdbb;
          border-radius: 50%;
          background: #f5e4d7;
          color: #a65a3a;
          font-size: 23px;
          font-weight: 850;
        }

        .potter-dashboard .profile-summary h3 {
          margin: 0 0 7px;
          color: #503326;
          font-size: 15px;
        }

        .potter-dashboard .membership-id {
          color: #a65335;
          font-size: 10px;
          font-weight: 750;
          line-height: 1.6;
        }

        .potter-dashboard .profile-verified {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 10px;
          padding: 6px 10px;
          border-radius: 30px;
          background: ${isVerified ? "#eff8f0" : "#fff8eb"};
          color: ${isVerified ? "#397448" : "#94601d"};
          font-size: 10px;
          font-weight: 750;
        }

        .potter-dashboard .dashboard-heritage-card {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(220px, .7fr);
          gap: 22px;
          align-items: center;
          margin-bottom: 22px;
          background: linear-gradient(120deg, #fff 0%, #fffaf5 100%);
        }

        .potter-dashboard .dashboard-heritage-card h2 {
          margin: 0 0 8px;
          color: #503326;
          font-size: 18px;
        }

        .potter-dashboard .dashboard-heritage-card p {
          margin: 0;
          color: #806b5e;
          font-size: 12px;
          line-height: 1.8;
        }

        .potter-dashboard .heritage-quote {
          padding: 17px 19px;
          border-left: 3px solid #b36a49;
          border-radius: 0 12px 12px 0;
          background: #fff4ec;
          color: #684633;
          font-size: 13px;
          font-weight: 650;
          line-height: 1.7;
        }

        @media (max-width: 1000px) {
          .potter-dashboard .dashboard-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .potter-dashboard .dashboard-community-intro,
          .potter-dashboard .dashboard-content-grid,
          .potter-dashboard .dashboard-heritage-card {
            grid-template-columns: minmax(0, 1fr);
          }
        }

        @media (max-width: 600px) {
          .potter-dashboard .dashboard-welcome,
          .potter-dashboard .dashboard-community-intro,
          .potter-dashboard .dashboard-main-card,
          .potter-dashboard .dashboard-side-card,
          .potter-dashboard .dashboard-heritage-card {
            padding: 18px;
            border-radius: 15px;
          }
          .potter-dashboard .dashboard-stats {
            grid-template-columns: minmax(0, 1fr);
            gap: 10px;
          }
          .potter-dashboard .community-pillars {
            gap: 7px;
          }
          .potter-dashboard .community-pillar {
            padding: 11px 8px;
          }
        }
      `}</style>

      <div className="potter-dashboard">
        <div className="dashboard-welcome">
          <div>
            <span className="welcome-small">{dashboardRole.toUpperCase()}</span>
            <h1>Hello, {displayName} 👋</h1>
            <p>{dashboardConfig.description}</p>
          </div>

          <div className="verified-badge-large">
            <CheckCircle size={17} />
            {isVerified ? "Verified Member" : "Membership Pending"}
          </div>
        </div>

        {dashboardRole === "Admin" ? (
          <>
            <section className="dashboard-community-intro">
              <div>
                <span className="section-eyebrow">PLATFORM CONTROL CENTRE</span>
                <h2>Administration overview</h2>
                <p>Manage platform access, member services, marketplace operations and system-wide activity from one place.</p>
              </div>
              <div className="community-pillars">
                <div className="community-pillar"><span>01</span><strong>Manage</strong><small>Users & access</small></div>
                <div className="community-pillar"><span>02</span><strong>Monitor</strong><small>Platform activity</small></div>
                <div className="community-pillar"><span>03</span><strong>Maintain</strong><small>Services & security</small></div>
              </div>
            </section>

            <div className="dashboard-stats">
              <StatCard icon={Users} value={members.length} label="Verified Members" />
              <StatCard icon={ShoppingBag} value={marketplaceProductCount} label="Marketplace Products" />
              <StatCard icon={Megaphone} value={announcements.length} label="Announcements" />
              <StatCard icon={CalendarDays} value={events.length} label="Community Events" />
            </div>

            <section className="dashboard-main-card" style={{ marginBottom: 20 }}>
              <div className="card-heading">
                <div><span>ADMINISTRATION</span><h2>Platform management</h2></div>
              </div>
              <div className="community-pillars">
                {[
                  { label: "User & role management", detail: "Manage accounts and assigned access", page: "committee-roles", icon: Users },
                  { label: "Membership review", detail: "Review member records and applications", page: "members", icon: UserCheck },
                  { label: "Marketplace monitoring", detail: "Review products and marketplace activity", page: "marketplace", icon: ShoppingBag },
                  { label: "Payments & fees", detail: "Review platform financial activity", page: "payments", icon: CreditCard },
                  { label: "Platform support", detail: "Manage support and emergency requests", page: "support-inquiries", icon: HeartPulse },
                ].map((item) => {
                  const ActionIcon = item.icon;
                  return (
                    <button key={item.label} type="button" onClick={() => navigate(item.page)} style={{ textAlign: "left", cursor: "pointer", border: "1px solid rgba(166,90,58,.17)", borderRadius: 14, padding: 15, background: "#fffdfb", color: "#563a2b" }}>
                      <ActionIcon size={20} color="#a65a3a" />
                      <strong style={{ display: "block", marginTop: 9, fontSize: 13 }}>{item.label}</strong>
                      <small style={{ display: "block", marginTop: 5, lineHeight: 1.5 }}>{item.detail}</small>
                    </button>
                  );
                })}
              </div>
            </section>

            <div className="dashboard-content-grid">
              <section className="dashboard-main-card">
                <div className="card-heading"><div><span>PLATFORM UPDATES</span><h2>Latest Announcements</h2></div></div>
                <div className="announcement-list">
                  {announcements.length ? announcements.slice(0, 5).map((item, index) => (
                    <article className="announcement-row" key={item.id || item.title || index}>
                      <div className="announcement-date"><span>{String(item.date || "—").split(" ")[0]}</span><small>{String(item.date || "").split(" ")[1] || ""}</small></div>
                      <div><h3>{item.title}</h3><p>{item.description}</p></div>
                    </article>
                  )) : <p className="dashboard-empty-message">No verified platform announcements have been published yet.</p>}
                </div>
              </section>
              <section className="dashboard-side-card">
                <div className="card-heading"><div><span>ADMIN ACCOUNT</span><h2>Administrator profile</h2></div></div>
                <div className="profile-summary">
                  <div className="profile-avatar-large">{profile.profilePhoto ? <img src={profile.profilePhoto} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} /> : initials}</div>
                  <h3>{profile.fullName || displayName}</h3>
                  <span className="membership-id">Platform Administrator</span>
                  <div className="profile-verified"><ShieldCheck size={15} /> Administrative access</div>
                </div>
              </section>
            </div>
          </>
        ) : dashboardRole === "President / Head" ? (
          <>
            <MyCommitteeElectionProof />
            <section className="dashboard-community-intro">
              <div>
                <span className="section-eyebrow">COMMUNITY LEADERSHIP</span>
                <h2>Lead, connect and strengthen the community</h2>
                <p>Coordinate committee work, guide community initiatives and keep members informed about decisions, events and welfare activities.</p>
              </div>
              <div className="community-pillars">
                <div className="community-pillar"><span>01</span><strong>Lead</strong><small>Committee & members</small></div>
                <div className="community-pillar"><span>02</span><strong>Coordinate</strong><small>Events & meetings</small></div>
                <div className="community-pillar"><span>03</span><strong>Support</strong><small>Community welfare</small></div>
              </div>
            </section>

            <div className="dashboard-stats">
              <StatCard icon={Users} value={members.length} label="Verified Members" />
              <StatCard icon={Users} value="—" label="Committee Overview" />
              <StatCard icon={CalendarDays} value={events.length} label="Upcoming Events" />
              <StatCard icon={Megaphone} value={announcements.length} label="Community Updates" />
            </div>

            <section className="dashboard-main-card" style={{ marginBottom: 20 }}>
              <div className="card-heading"><div><span>PRESIDENT'S DESK</span><h2>Community leadership</h2></div></div>
              <div className="community-pillars">
                {[
                  { label: "Committee & leadership", detail: "Review committee roles and appointments", page: "committee-roles", icon: Users },
                  { label: "Community members", detail: "View the verified community directory", page: "members", icon: UserCheck },
                  { label: "Events & meetings", detail: "Coordinate gatherings and registrations", page: "events", icon: CalendarDays },
                  { label: "Announcements", detail: "Share official community updates", page: "announcements", icon: Megaphone },
                  { label: "Community records", detail: "Review official community records", page: "community-records", icon: FileText },
                  { label: "Community welfare", detail: "Review support and emergency matters where authorized", page: "emergency", icon: HeartPulse },
                ].map((item) => {
                  const ActionIcon = item.icon;
                  return (
                    <button key={item.label} type="button" onClick={() => navigate(item.page)} style={{ textAlign: "left", cursor: "pointer", border: "1px solid rgba(166,90,58,.17)", borderRadius: 14, padding: 15, background: "#fffdfb", color: "#563a2b" }}>
                      <ActionIcon size={20} color="#a65a3a" />
                      <strong style={{ display: "block", marginTop: 9, fontSize: 13 }}>{item.label}</strong>
                      <small style={{ display: "block", marginTop: 5, lineHeight: 1.5 }}>{item.detail}</small>
                    </button>
                  );
                })}
              </div>
            </section>

            <div className="dashboard-content-grid">
              <section className="dashboard-main-card">
                <div className="card-heading"><div><span>COMMUNITY UPDATES</span><h2>Latest Announcements</h2></div></div>
                <div className="announcement-list">
                  {announcements.length ? announcements.slice(0, 5).map((item, index) => (
                    <article className="announcement-row" key={item.id || item.title || index}>
                      <div className="announcement-date"><span>{String(item.date || "—").split(" ")[0]}</span><small>{String(item.date || "").split(" ")[1] || ""}</small></div>
                      <div><h3>{item.title}</h3><p>{item.description}</p></div>
                    </article>
                  )) : <p className="dashboard-empty-message">No verified community announcements have been published yet. Updates will appear here when published.</p>}
                </div>
              </section>
              <section className="dashboard-side-card">
                <div className="card-heading"><div><span>LEADERSHIP PROFILE</span><h2>Your appointment</h2></div></div>
                <div className="profile-summary">
                  <div className="profile-avatar-large">{profile.profilePhoto ? <img src={profile.profilePhoto} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} /> : initials}</div>
                  <h3>{profile.fullName || displayName}</h3>
                  <span className="membership-id">{dashboardRole}</span>
                  <div className="profile-verified"><CheckCircle size={15} />{isVerified ? "Verified Member" : "Membership Pending"}</div>
                </div>
              </section>
            </div>
            <section className="dashboard-heritage-card">
              <div><span className="section-eyebrow">LEADERSHIP PRIORITY</span><h2>Build a connected and supported community</h2><p>Use the leadership workspace to coordinate committee responsibilities, communicate decisions and strengthen opportunities for pottery artisans and their families.</p></div>
              <div className="heritage-quote">“Strong communities grow through shared responsibility, transparent decisions and collective progress.”</div>
            </section>
          </>
        ) : (
          <>
            <MyCommitteeElectionProof />
            <div className="dashboard-stats">
              <StatCard icon={Users} value={members.length} label="Verified Members" />
              <StatCard icon={Megaphone} value={announcements.length} label="Announcements" />
              <StatCard icon={CalendarDays} value={events.length} label="Upcoming Events" />
              <StatCard icon={ShoppingBag} value={marketplaceProductCount} label="Marketplace Products" />
            </div>
            <section className="dashboard-community-intro">
              <div><span className="section-eyebrow">The Potter Community</span><h2>Rooted in tradition. Growing together.</h2><p>A shared space for artisans and families to connect, celebrate our craft, exchange knowledge and create new opportunities for the next generation.</p></div>
              <div className="community-pillars">
                <div className="community-pillar"><span>01</span><strong>Connect</strong><small>People & community</small></div>
                <div className="community-pillar"><span>02</span><strong>Preserve</strong><small>Craft & heritage</small></div>
                <div className="community-pillar"><span>03</span><strong>Grow</strong><small>Skills & opportunity</small></div>
              </div>
            </section>
            <div className="dashboard-content-grid">
              <section className="dashboard-main-card">
                <div className="card-heading"><div><span>COMMUNITY UPDATES</span><h2>Latest Announcements</h2></div></div>
                <div className="announcement-list">
                  {announcements.length > 0 ? announcements.slice(0, 5).map((item, index) => {
                    const dateParts = String(item.date || "").split(" ");
                    return <article className="announcement-row" key={item.id || item.title || index}><div className="announcement-date"><span>{dateParts[0] || "—"}</span><small>{dateParts[1] || ""}</small></div><div><h3>{item.title}</h3><p>{item.description}</p></div></article>;
                  }) : <p className="dashboard-empty-message">No verified community announcements have been published yet. Community news and important updates will appear here.</p>}
                </div>
              </section>
              <section className="dashboard-side-card">
                <div className="card-heading"><div><span>MEMBERSHIP</span><h2>Your Profile</h2></div></div>
                <div className="profile-summary">
                  <div className="profile-avatar-large">{profile.profilePhoto ? <img src={profile.profilePhoto} alt="Profile" style={{ width: "100%", height: "100%", maxWidth: "100%", maxHeight: "100%", objectFit: "cover", objectPosition: "center", transform: `scale(${Number(profile.photoZoom || 1)})`, display: "block" }} /> : initials}</div>
                  <h3>{profile.fullName || displayName}</h3>
                  <span className="membership-id">{isVerified ? `Membership ID: ${activeUser?.membership_number || profile.membershipId || "—"}` : "Membership ID: Assigned after approval"}</span>
                  <div className="profile-verified"><CheckCircle size={15} />{isVerified ? "Verified Member" : "Membership Pending"}</div>
                </div>
              </section>
            </div>
            <section className="dashboard-heritage-card">
              <div><span className="section-eyebrow">Our shared heritage</span><h2>Keeping the art of pottery alive</h2><p>Pottery is more than a craft — it carries generations of knowledge, creativity and cultural identity. The Potter Community brings this heritage into one place while supporting artisans with opportunities to learn, showcase their work and build lasting connections.</p></div>
              <div className="heritage-quote">“Every handmade piece carries a story — shaped by skill, tradition and imagination.”</div>
            </section>
          </>
        )}
      </div>
    </PageWrapper>
  );
}

/* =========================================================
   CARDS
========================================================= */

function AnnouncementCard({
  item,
  openMemberFeature,
  isMember,
}) {
  const locked = !item.public && !isMember;

  return (
    <div
      className={`info-card ${
        locked ? "locked-card" : ""
      }`}
    >
      <div className="info-card-top">
        <div className="small-category">
          {item.category}
        </div>

        {locked && (
          <span className="lock-label">
            <Lock size={13} />
            Members
          </span>
        )}
      </div>

      <h3>{item.title}</h3>

      <span className="card-date">
        <CalendarDays size={14} />
        {item.date}
      </span>

      <p>{item.description}</p>

      {locked ? (
        <button
          className="card-action locked-action"
          onClick={() =>
            openMemberFeature?.("announcements")
          }
        >
          Become a Member
          <ArrowRight size={15} />
        </button>
      ) : (
        <button className="card-action">
          Read More
          <ArrowRight size={15} />
        </button>
      )}
    </div>
  );
}

function EventCard({
  event,
  openMemberFeature,
  isMember,
}) {
  const locked = !event.public && !isMember;

  return (
    <div
      className={`info-card ${
        locked ? "locked-card" : ""
      }`}
    >
      <div className="info-card-top">
        <div className="small-category">
          Community Event
        </div>

        {locked && (
          <span className="lock-label">
            <Lock size={13} />
            Members
          </span>
        )}
      </div>

      <h3>{event.title}</h3>

      <div className="event-meta">
        <span>
          <CalendarDays size={14} />
          {event.date}
        </span>

        <span>
          <Clock size={14} />
          {event.time}
        </span>

        <span>
          <MapPin size={14} />
          {event.location}
        </span>
      </div>

      <p>{event.description}</p>

      {locked ? (
        <button
          className="card-action locked-action"
          onClick={() =>
            openMemberFeature?.("events")
          }
        >
          Become a Member
          <ArrowRight size={15} />
        </button>
      ) : (
        <button className="card-action">
          View Event
          <ArrowRight size={15} />
        </button>
      )}
    </div>
  );
}

function SchemeCard({ scheme }) {
  const [showDetails, setShowDetails] = useState(false);
  const [showApplication, setShowApplication] = useState(false);

  return (
    <>
      <div className="info-card compact-service-card">
        <div className="info-card-top">
          <div className="small-category">
            {scheme.category}
          </div>

          <span className="lock-label">
            <ShieldCheck size={13} />
            Government verified
          </span>
        </div>

        <h3>{scheme.title}</h3>
        <p className="scheme-coverage-label" style={{ color: "#64748b", fontSize: 13, marginTop: -6, marginBottom: 14 }}>
          {scheme.scope === "National" ? "All-India scheme" : `State-specific · ${scheme.state}`}
        </p>

        <div className="benefit-box">
          <strong>Government Benefit</strong>
          <span>{scheme.benefit}</span>
        </div>

        <button
          className="card-action"
          onClick={() => setShowDetails(true)}
        >
          View full scheme details
          <ArrowRight size={15} />
        </button>
      </div>

      {showDetails && (
        <div className="modal-overlay">
          <div className="auth-modal service-details-modal">
            <button
              className="modal-close"
              onClick={() => setShowDetails(false)}
            >
              <X size={20} />
            </button>

            <div className="small-category">
              {scheme.category}
            </div>

            <h2>{scheme.title}</h2>
            <p className="scheme-coverage-label" style={{ color: "#64748b", fontSize: 13, marginTop: -6, marginBottom: 14 }}>
              {scheme.scope === "National" ? "Available across India, subject to eligibility" : `State-specific · ${scheme.state}`}
            </p>

            <div className="details-verified-label">
              <ShieldCheck size={15} />
              Government verified · {scheme.sourceLabel}
            </div>

            <div className="scheme-modal-section">
              <strong>About the scheme</strong>
              <p>{scheme.description}</p>
            </div>

            <div className="benefit-box">
              <strong>Government Benefit</strong>
              <span>{scheme.benefit}</span>
            </div>

            <div className="scheme-detail-list">
              <div>
                <strong>Ministry</strong>
                <span>{scheme.ministry}</span>
              </div>

              <div>
                <strong>Eligibility</strong>
                <span>{scheme.eligibility}</span>
              </div>

              <div>
                <strong>Documents</strong>
                <span>{scheme.documents}</span>
              </div>
            </div>

            <div className="scheme-modal-note">
              {scheme.applicationNote}
            </div>

            <div className="card-action-row">
              <button
                className="card-action"
                onClick={() => {
                  setShowDetails(false);
                  setShowApplication(true);
                }}
              >
                Apply through Potter Community
                <ArrowRight size={15} />
              </button>

              <a
                className="card-action secondary-card-action"
                href={scheme.applicationUrl}
                target="_blank"
                rel="noreferrer"
              >
                Official Portal
                <ArrowRight size={15} />
              </a>
            </div>
          </div>
        </div>
      )}

      {showApplication && (
        <ApplicationModal
          type="scheme"
          item={scheme}
          close={() => setShowApplication(false)}
        />
      )}
    </>
  );
}

function ScholarshipPortalPage({ activeUser }) {
  const [scope, setScope] = useState("CENTRAL");
  const [schemes, setSchemes] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showSchemeForm, setShowSchemeForm] = useState(false);
  const [editingSchemeId, setEditingSchemeId] = useState(null);
  const [applyingTo, setApplyingTo] = useState(null);
  const [benefitFor, setBenefitFor] = useState(null);
  const roleName = String(activeUser?.role || "").toUpperCase();
  const admin = ["ADMIN", "SUPER ADMIN"].includes(roleName);
  const superAdmin = roleName === "SUPER ADMIN";
  const scholarshipOfficer = activeUser?.permissions?.includes("scholarships.review");
  const president = activeUser?.permissions?.includes("community.approve") && (!admin || superAdmin);
  const canReview = admin || scholarshipOfficer || president;
  const canManageBenefits = admin || scholarshipOfficer;
  const canApply = String(activeUser?.membership_status || "").toUpperCase() === "APPROVED";
  const [schemeDraft, setSchemeDraft] = useState({ scope: "COMMUNITY", name: "", provider: "", eligibility: "", amount: "", start_date: "", deadline: "", required_documents: "", application_url: "" });

  const loadScholarships = async () => {
    setLoading(true);
    setError("");
    try {
      const [schemeRows, applicationRows] = await Promise.all([
        authApi("/scholarships/schemes"),
        authApi("/scholarships/applications"),
      ]);
      setSchemes(Array.isArray(schemeRows) ? schemeRows : []);
      setApplications(Array.isArray(applicationRows) ? applicationRows : []);
    } catch (loadError) {
      setError(loadError.message || "Could not load scholarships.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadScholarships(); }, []);

  const submitScheme = async (event) => {
    event.preventDefault();
    setBusy(true); setError(""); setNotice("");
    try {
      const { required_documents, ...rest } = schemeDraft;
      await authApi(editingSchemeId ? `/scholarships/schemes/${editingSchemeId}` : "/scholarships/schemes", {
        method: editingSchemeId ? "PATCH" : "POST",
        body: JSON.stringify({ ...rest, scope: "COMMUNITY", start_date: rest.start_date || null, deadline: rest.deadline || null, required_documents: required_documents.split("\n").map((item) => item.trim()).filter(Boolean) }),
      });
      setEditingSchemeId(null);
      setSchemeDraft({ scope: "COMMUNITY", name: "", provider: "", eligibility: "", amount: "", start_date: "", deadline: "", required_documents: "", application_url: "" });
      setShowSchemeForm(false); setNotice("Scholarship added to the catalogue.");
      await loadScholarships();
    } catch (saveError) { setError(saveError.message || "Could not save the scholarship."); }
    finally { setBusy(false); }
  };

  const submitApplication = async (event) => {
    event.preventDefault();
    if (!applyingTo) return;
    setBusy(true); setError(""); setNotice("");
    const form = new FormData(event.currentTarget);
    const payload = new FormData();
    payload.set("scheme_id", String(applyingTo.id));
    payload.set("details", JSON.stringify({ course: form.get("course"), institution: form.get("institution"), notes: form.get("notes") }));
    for (const file of form.getAll("files")) if (file instanceof File && file.size) payload.append("files", file);
    try {
      await authApi("/scholarships/applications", { method: "POST", body: payload });
      setApplyingTo(null); setNotice("Application submitted for review.");
      await loadScholarships();
    } catch (submitError) { setError(submitError.message || "Could not submit the application."); }
    finally { setBusy(false); }
  };

  const decideApplication = async (application, action) => {
    let remark = "";
    if (action === "REJECT") {
      remark = window.prompt("Please provide a short reason for rejecting this application.") || "";
      if (remark.trim().length < 3) return;
    }
    setBusy(true); setError(""); setNotice("");
    try {
      await authApi(`/scholarships/applications/${application.id}/decision`, { method: "PATCH", body: JSON.stringify({ action, remark: remark.trim() || null }) });
      setNotice(action === "FORWARD" ? "Application forwarded to the next reviewer." : action === "APPROVE" ? "Application approved." : "Application rejected.");
      await loadScholarships();
    } catch (decisionError) { setError(decisionError.message || "Could not update this application."); }
    finally { setBusy(false); }
  };

  const recordBenefit = async (event) => {
    event.preventDefault();
    if (!benefitFor) return;
    setBusy(true); setError("");
    try {
      const payload = new FormData(event.currentTarget);
      if (!payload.get("amount")) payload.delete("amount");
      if (!payload.get("received_at")) payload.delete("received_at");
      const proof = payload.get("proof");
      if (!(proof instanceof File) || proof.size === 0) payload.delete("proof");
      await authApi(`/scholarships/applications/${benefitFor.id}/benefits`, { method: "POST", body: payload });
      setBenefitFor(null); setNotice("Benefit recorded separately from application approval; it is awaiting verification.");
      await loadScholarships();
    } catch (benefitError) { setError(benefitError.message || "Could not record the benefit."); }
    finally { setBusy(false); }
  };

  const verifyBenefit = async (benefitId, status) => {
    setBusy(true); setError("");
    try {
      await authApi(`/scholarships/benefits/${benefitId}/verify`, { method: "PATCH", body: JSON.stringify({ status }) });
      setNotice(`Benefit record ${status.toLowerCase()}.`); await loadScholarships();
    } catch (verifyError) { setError(verifyError.message || "Could not verify the benefit."); }
    finally { setBusy(false); }
  };

  const editScheme = (scheme) => {
    setEditingSchemeId(scheme.id);
    setSchemeDraft({
      scope: "COMMUNITY", name: scheme.name, provider: scheme.provider, eligibility: scheme.eligibility,
      amount: scheme.amount || "", start_date: scheme.start_date || "", deadline: scheme.deadline || "",
      required_documents: (scheme.required_documents || []).join("\n"), application_url: scheme.application_url || "",
    });
    setShowSchemeForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openPrivateFile = async (url) => {
    const token = sessionStorage.getItem("potterCommunityAccessToken") || localStorage.getItem("token");
    const preview = window.open("", "_blank");
    try {
      const response = await fetch(`${AUTH_API_BASE}${url}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!response.ok) throw new Error("Could not open this private file.");
      const objectUrl = URL.createObjectURL(await response.blob());
      if (preview) {
        preview.opener = null;
        preview.location.href = objectUrl;
      } else {
        const link = document.createElement("a");
        link.href = objectUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.click();
      }
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch (fileError) { preview?.close(); setError(fileError.message); }
  };

  const visibleSchemes = schemes.filter((scheme) => scheme.scope === scope);
  const scholarshipSections = [
    { value: "CENTRAL", label: "Central Government", note: "Schemes managed across India" },
    { value: "STATE", label: "State Government", note: "Schemes managed by the State Government" },
    { value: "COMMUNITY", label: "Community Scholarships", note: "Support managed by Potter Community" },
  ];
  const activeScholarshipSection = scholarshipSections.find((section) => section.value === scope);
  const statusStyle = (status) => ({ display: "inline-flex", padding: "5px 9px", borderRadius: 99, background: status === "APPROVED" || status === "VERIFIED" ? "#eaf2e5" : status === "REJECTED" ? "#fbe8e5" : "#f6eee6", color: status === "APPROVED" || status === "VERIFIED" ? "#4c7043" : status === "REJECTED" ? "#a13d2d" : "#79563d", fontSize: 10, fontWeight: 800 });

  return <PageWrapper>
    <section style={{ position: "relative", overflow: "hidden", margin: "4px 0 22px", padding: "clamp(20px,3vw,30px)", borderRadius: 22, background: "linear-gradient(118deg,#4b2c20 0%,#75432e 58%,#a85f3d 100%)", color: "#fff8f2", boxShadow: "0 14px 34px rgba(91,52,34,.13)" }}>
      <div style={{ position: "absolute", width: 230, height: 230, borderRadius: "50%", border: "1px solid rgba(255,255,255,.13)", right: -55, top: -115, boxShadow: "0 0 0 24px rgba(255,255,255,.035),0 0 0 48px rgba(255,255,255,.025)" }} />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 760 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "6px 10px", borderRadius: 99, background: "rgba(255,255,255,.13)", border: "1px solid rgba(255,255,255,.18)", fontSize: 10, fontWeight: 800, letterSpacing: ".09em", textTransform: "uppercase" }}>Education & artisan support</div>
        <h1 style={{ margin: "13px 0 7px", fontSize: "clamp(25px,3vw,34px)", lineHeight: 1.15, letterSpacing: "-.035em", color: "#fff8f2" }}>Scholarships & financial support</h1>
        <p style={{ margin: 0, maxWidth: 620, color: "rgba(255,248,242,.82)", fontSize: 13, lineHeight: 1.7 }}>Explore Central, State, and Potter Community scholarships. Find relevant support, submit applications, and follow verified benefits in one place.</p>
      </div>
      <div style={{ position: "absolute", right: 28, bottom: 24, opacity: .13, fontSize: 76, lineHeight: 1, fontWeight: 900, letterSpacing: "-.08em", userSelect: "none" }}>₹</div>
    </section>
    {error && <p role="alert" style={{ color: "#a13d2d", fontSize: 12 }}>{error}</p>}
    {notice && <p role="status" style={{ color: "#39734a", fontSize: 12 }}>{notice}</p>}
    <section style={{ margin: "0 0 24px", padding: "18px", border: "1px solid #eadbd0", borderRadius: 18, background: "linear-gradient(180deg,#fffdfa 0%,#fff8f2 100%)", boxShadow: "0 8px 24px rgba(91,52,34,.045)" }}>
      <div style={{ display: "flex", alignItems: "end", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 15 }}>
        <div><div style={{ color: "#ad5a39", fontSize: 10, fontWeight: 900, letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 5 }}>Explore opportunities</div><h2 style={{ margin: 0, color: "#503326", fontSize: 19, letterSpacing: "-.02em" }}>Choose scholarship source</h2><p style={{ color: "#806b5e", fontSize: 12, margin: "5px 0 0" }}>Government programmes and community support are managed separately.</p></div>
        <span style={{ color: "#967b6b", fontSize: 10, fontWeight: 700 }}>SELECT A CATEGORY</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,220px),1fr))", gap: 12 }}>
        {scholarshipSections.map(({ value, label, note }, index) => { const selected = scope === value; const count = schemes.filter((item) => item.scope === value).length; const symbols = ["IN", "ST", "PC"]; return <button key={value} type="button" aria-pressed={selected} onClick={() => { setScope(value); if (value !== "COMMUNITY") { setShowSchemeForm(false); setEditingSchemeId(null); } }} style={{ position: "relative", overflow: "hidden", textAlign: "left", padding: "15px 16px", minHeight: 112, border: `1px solid ${selected ? "#b65f3c" : "#eadbd0"}`, borderRadius: 14, background: selected ? "#f8e9df" : "#fff", color: "#503326", cursor: "pointer", boxShadow: selected ? "0 7px 18px rgba(173,90,57,.10)" : "none", transition: "all .18s ease" }}><span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}><span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 10, background: selected ? "#ad5a39" : "#f5e9e0", color: selected ? "#fff" : "#995438", fontSize: 10, fontWeight: 900, letterSpacing: ".04em" }}>{symbols[index]}</span><span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 27, height: 25, padding: "0 7px", borderRadius: 99, background: selected ? "#fff" : "#f7eee8", color: "#a65334", fontSize: 11, fontWeight: 900 }}>{count}</span></span><span style={{ display: "block", marginTop: 12, fontSize: 13, fontWeight: 850 }}>{label}</span><span style={{ display: "block", marginTop: 4, color: "#806b5e", fontSize: 11, lineHeight: 1.45, fontWeight: 400 }}>{note}</span>{selected && <span style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 3, background: "#ad5a39" }} />}</button>; })}
      </div>
    </section>
    <section style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap", padding: "2px 0 13px", borderBottom: "1px solid #eadbd0", marginBottom: 12 }}>
      <div><div style={{ color: "#ad5a39", fontSize: 10, fontWeight: 900, letterSpacing: ".11em", textTransform: "uppercase", marginBottom: 4 }}>Available listings</div><h2 style={{ margin: 0, color: "#503326", fontSize: 21, letterSpacing: "-.025em" }}>{activeScholarshipSection?.label}</h2><p style={{ color: "#806b5e", fontSize: 11, margin: "5px 0 0" }}>{visibleSchemes.length} {visibleSchemes.length === 1 ? "scheme" : "schemes"} in this category</p></div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button type="button" className="btn btn-outline" onClick={loadScholarships} disabled={loading}>{loading ? "Refreshing…" : "↻ Refresh"}</button>{admin && scope === "COMMUNITY" && <button type="button" className="btn btn-primary" onClick={() => setShowSchemeForm((current) => !current)}>{showSchemeForm ? "Close" : "+ Add scholarship"}</button>}</div>
    </section>
    <p style={{ color: "#806b5e", fontSize: 12, lineHeight: 1.6, margin: "0 0 16px", padding: "10px 13px", borderRadius: 10, background: "#f7eee8", borderLeft: "3px solid #c27a55" }}>{scope === "COMMUNITY" ? "Managed by Potter Community. Members can apply here and track their application." : "Read-only government information. Apply and check eligibility through the relevant government department."}</p>
    {showSchemeForm && admin && scope === "COMMUNITY" && <form onSubmit={submitScheme} style={{ display: "grid", gap: 10, padding: 16, marginBottom: 18, border: "1px solid #ead8cc", borderRadius: 14, background: "#fffdfb" }}>
      <h2 style={{ margin: 0, color: "#503326", fontSize: 17 }}>{editingSchemeId ? "Edit scholarship scheme" : "Add a scholarship scheme"}</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 10 }}>
        <span className="small-category" style={{ alignSelf: "center" }}>Community scholarship</span>
        <input required minLength={3} maxLength={180} placeholder="Scholarship name" value={schemeDraft.name} onChange={(e) => setSchemeDraft({ ...schemeDraft, name: e.target.value })} />
        <input required maxLength={180} placeholder="Provider / department" value={schemeDraft.provider} onChange={(e) => setSchemeDraft({ ...schemeDraft, provider: e.target.value })} />
        <input placeholder="Amount or benefit" value={schemeDraft.amount} onChange={(e) => setSchemeDraft({ ...schemeDraft, amount: e.target.value })} />
        <input type="date" aria-label="Application start date" value={schemeDraft.start_date} onChange={(e) => setSchemeDraft({ ...schemeDraft, start_date: e.target.value })} />
        <input type="date" aria-label="Application deadline" value={schemeDraft.deadline} onChange={(e) => setSchemeDraft({ ...schemeDraft, deadline: e.target.value })} />
        <input type="url" placeholder="Official application URL (optional)" value={schemeDraft.application_url} onChange={(e) => setSchemeDraft({ ...schemeDraft, application_url: e.target.value })} />
      </div>
      <textarea required minLength={5} maxLength={3000} rows={3} placeholder="Eligibility" value={schemeDraft.eligibility} onChange={(e) => setSchemeDraft({ ...schemeDraft, eligibility: e.target.value })} />
      <textarea rows={2} placeholder="Required documents — one per line" value={schemeDraft.required_documents} onChange={(e) => setSchemeDraft({ ...schemeDraft, required_documents: e.target.value })} />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button className="btn btn-primary" type="submit" disabled={busy}>{busy ? "Saving…" : editingSchemeId ? "Save changes" : "Save scholarship"}</button>{editingSchemeId && <button className="btn btn-outline" type="button" onClick={() => { setEditingSchemeId(null); setShowSchemeForm(false); setSchemeDraft({ scope: "COMMUNITY", name: "", provider: "", eligibility: "", amount: "", start_date: "", deadline: "", required_documents: "", application_url: "" }); }}>Cancel</button>}</div>
    </form>}
    {loading ? <div className="empty-state">Loading scholarship catalogue…</div> : visibleSchemes.length ? <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,330px),1fr))", gap: 16 }}>{visibleSchemes.map((scheme) => <article key={scheme.id} className="info-card compact-service-card" style={{ position: "relative", overflow: "hidden", padding: 0, border: "1px solid #eadbd0", borderRadius: 17, background: "#fffdfa", boxShadow: "0 8px 24px rgba(91,52,34,.055)" }}>
      <div style={{ height: 5, background: scheme.expired ? "#b8a69a" : scheme.not_open ? "#c58b48" : "linear-gradient(90deg,#ad5a39,#d59a70)" }} />
      <div style={{ padding: "17px 18px 18px" }}>
        <div className="info-card-top" style={{ alignItems: "center", marginBottom: 13 }}><span className="small-category">{scheme.provider}</span><span style={statusStyle(scheme.expired ? "EXPIRED" : scheme.not_open ? "UPCOMING" : "ACTIVE")}>{scheme.expired ? "Expired · history retained" : scheme.not_open ? "Opens later" : scheme.scope}</span></div>
        <h3 style={{ color: "#503326", fontSize: 17, lineHeight: 1.35, margin: "0 0 8px" }}>{scheme.name}</h3><p style={{ color: "#806b5e", fontSize: 12, lineHeight: 1.65, margin: "0 0 13px" }}>{scheme.eligibility}</p>
        {scheme.amount && <div className="amount-box" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 12px", borderRadius: 10, background: "#f8eee6", color: "#795039", fontWeight: 800, marginBottom: 13 }}><IndianRupee size={16}/><span>{scheme.amount}</span></div>}
        <div style={{ display: "grid", gap: 7, padding: "11px 0", borderTop: "1px solid #f0e4dc", borderBottom: scheme.required_documents?.length ? "1px solid #f0e4dc" : "none", marginBottom: 13 }}><p style={{ color: "#806b5e", fontSize: 11, margin: 0 }}><strong style={{ color: "#634332" }}>Application period</strong><br/>{scheme.start_date || "Open date not listed"} – {scheme.deadline || "Deadline as announced by provider"}</p>{scheme.required_documents?.length > 0 && <p style={{ color: "#806b5e", fontSize: 11, lineHeight: 1.55, margin: 0 }}><strong style={{ color: "#634332" }}>Documents required</strong><br/>{scheme.required_documents.join(", ")}</p>}</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{canApply && scheme.scope === "COMMUNITY" && !scheme.expired && !scheme.not_open && <button className="btn btn-primary" type="button" onClick={() => setApplyingTo(scheme)}>Apply</button>}{admin && scheme.scope === "COMMUNITY" && <button className="btn btn-outline" type="button" onClick={() => editScheme(scheme)}>Edit scheme</button>}{scheme.application_url && <a className="btn btn-outline" href={scheme.application_url} target="_blank" rel="noreferrer">Official application</a>}</div>
      </div>
    </article>)}</div> : <EmptyState title={scope === "STATE" ? "No State scholarship is listed yet" : scope === "COMMUNITY" ? "No community scholarship has been added" : "No Central scholarship is available"} description={scope === "COMMUNITY" && admin ? "Use Add scholarship to publish a community-managed scheme." : scope === "COMMUNITY" ? "Check again later or contact the community office." : "Government scholarship listings will appear here when available. Apply through the official government portal."} />}

    <section style={{ marginTop: 26 }}>
      <h2 style={{ color: "#503326", fontSize: 19 }}>{canReview ? "Scholarship application review" : "My scholarship applications and benefits"}</h2>
      {applications.length ? <div style={{ display: "grid", gap: 10 }}>{applications.map((application) => <article key={application.id} style={{ padding: 15, border: "1px solid #ead8cc", borderRadius: 13, background: "#fffdfb" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}><div><strong style={{ color: "#503326" }}>{application.scheme_name}</strong><div style={{ color: "#806b5e", fontSize: 11, marginTop: 4 }}>{application.member_name} · {application.membership_number || "Membership ID pending"} · Submitted {new Date(application.created_at).toLocaleDateString()}</div></div><div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}><span style={statusStyle(application.status)}>{application.status}</span><span style={statusStyle(application.benefit_status)}>{application.benefit_status.replaceAll("_", " ")}</span></div></div>
        {application.details?.course && <p style={{ color: "#806b5e", fontSize: 11 }}>Course: {application.details.course}{application.details.institution ? ` · ${application.details.institution}` : ""}</p>}
        {application.details?.notes && <p style={{ color: "#806b5e", fontSize: 11 }}>{application.details.notes}</p>}
        {[application.admin_remark, application.officer_remark, application.president_remark].filter(Boolean).map((remark, index) => <p key={index} style={{ color: "#806b5e", fontSize: 11 }}>Review note: {remark}</p>)}
        {canReview && <p style={{ color: "#806b5e", fontSize: 11 }}>Review stage: {application.review_stage.replaceAll("_", " ")}</p>}
        {application.documents?.length > 0 && <div style={{ display: "flex", gap: 7, flexWrap: "wrap", margin: "8px 0" }}>{application.documents.map((document) => <button key={document.id} type="button" className="btn btn-outline" onClick={() => openPrivateFile(document.download_url)}>View {document.document_type}</button>)}</div>}
        {canReview && ["SUBMITTED", "UNDER_REVIEW"].includes(application.status) && <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
          {admin && application.review_stage === "ADMIN_REVIEW" && <><button type="button" className="btn btn-primary" disabled={busy} onClick={() => decideApplication(application, "FORWARD")}>Forward to Scholarship Officer</button><button type="button" className="btn btn-outline" disabled={busy} onClick={() => decideApplication(application, "REJECT")}>Reject</button></>}
          {(!admin || superAdmin) && scholarshipOfficer && application.review_stage === "SCHOLARSHIP_OFFICER_REVIEW" && <><button type="button" className="btn btn-primary" disabled={busy} onClick={() => decideApplication(application, "FORWARD")}>Forward to President</button><button type="button" className="btn btn-outline" disabled={busy} onClick={() => decideApplication(application, "REJECT")}>Reject</button></>}
          {president && application.review_stage === "PRESIDENT_REVIEW" && <><button type="button" className="btn btn-primary" disabled={busy} onClick={() => decideApplication(application, "APPROVE")}>Approve application</button><button type="button" className="btn btn-outline" disabled={busy} onClick={() => decideApplication(application, "REJECT")}>Reject</button></>}
        </div>}
        {application.status === "APPROVED" && canManageBenefits && <button type="button" className="btn btn-outline" style={{ marginTop: 8 }} onClick={() => setBenefitFor(application)}>Record benefit received</button>}
        {application.benefits?.length > 0 && <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px solid #f0e2d8" }}>{application.benefits.map((benefit) => <div key={benefit.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", padding: "6px 0", color: "#624b3d", fontSize: 11 }}><span>{benefit.benefit_type}{benefit.amount != null ? ` · ₹${benefit.amount}` : ""}{benefit.received_at ? ` · ${benefit.received_at}` : ""}{benefit.reference_number ? ` · Ref ${benefit.reference_number}` : ""}</span><span style={statusStyle(benefit.verification_status)}>{benefit.verification_status}</span>{benefit.proof_url && <button type="button" className="btn btn-outline" onClick={() => openPrivateFile(benefit.proof_url)}>View proof</button>}{canManageBenefits && benefit.verification_status === "PENDING" && <><button type="button" className="btn btn-outline" disabled={busy} onClick={() => verifyBenefit(benefit.id, "VERIFIED")}>Verify benefit</button><button type="button" className="btn btn-outline" disabled={busy} onClick={() => verifyBenefit(benefit.id, "REJECTED")}>Reject benefit</button></>}</div>)}</div>}
      </article>)}</div> : <EmptyState title="No scholarship applications yet" description={canApply ? "Apply to an available scheme above; you can track review and benefit records here." : canReview ? "Member applications will appear here." : "Your application and verified benefit history will appear here."} />}
    </section>

    {applyingTo && <div className="modal-overlay"><section className="auth-modal" role="dialog" aria-modal="true" style={{ maxHeight: "90dvh", overflowY: "auto" }}><button className="modal-close" type="button" onClick={() => setApplyingTo(null)}>×</button><h2>Scholarship application</h2><p className="auth-description">{applyingTo.name}</p><p style={{ color: "#806b5e", fontSize: 11 }}>Required documents: {applyingTo.required_documents?.join(", ") || "Supporting documents, if applicable"}</p><form onSubmit={submitApplication} style={{ display: "grid", gap: 10 }}><input name="course" placeholder="Course / programme" required/><input name="institution" placeholder="School / college / institution" required/><textarea name="notes" placeholder="Additional eligibility details" rows={3}/><label style={{ color: "#806b5e", fontSize: 11 }}>Upload supporting documents<input name="files" type="file" accept=".pdf,.jpg,.jpeg,.png" multiple required={Boolean(applyingTo.required_documents?.length)} style={{ display: "block", marginTop: 7 }}/></label><button type="submit" className="btn btn-primary" disabled={busy}>{busy ? "Submitting…" : "Submit application"}</button></form></section></div>}
    {benefitFor && <div className="modal-overlay"><section className="auth-modal" role="dialog" aria-modal="true" style={{ maxHeight: "90dvh", overflowY: "auto" }}><button className="modal-close" type="button" onClick={() => setBenefitFor(null)}>×</button><h2>Record benefit received</h2><p className="auth-description">{benefitFor.member_name} · {benefitFor.scheme_name}</p><form onSubmit={recordBenefit} style={{ display: "grid", gap: 10 }}><input name="benefit_type" placeholder="Benefit type" required/><input name="amount" type="number" min="0" step="0.01" placeholder="Amount, if applicable"/><input name="received_at" type="date"/><input name="reference_number" placeholder="Reference number"/><label style={{ color: "#806b5e", fontSize: 11 }}>Supporting proof (optional)<input name="proof" type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: "block", marginTop: 7 }}/></label><button className="btn btn-primary" disabled={busy}>Record for verification</button></form></section></div>}
  </PageWrapper>;
}

function ScholarshipCard({ scholarship }) {
  const [showDetails, setShowDetails] = useState(false);
  const [showApplication, setShowApplication] = useState(false);

  return (
    <>
      <div className="info-card compact-service-card">
        <div className="info-card-top">
          <div className="small-category">
            {scholarship.category}
          </div>

          <span className="lock-label">
            <ShieldCheck size={13} />
            Official scheme
          </span>
        </div>

        <h3>{scholarship.title}</h3>
        <p className="scheme-coverage-label" style={{ color: "#64748b", fontSize: 13, marginTop: -6, marginBottom: 14 }}>
          {scholarship.scope === "National" ? "All-India scholarship" : `State-specific · ${scholarship.state}`}
        </p>

        <div className="amount-box">
          <IndianRupee size={17} />
          <span>{scholarship.amount}</span>
        </div>

        <button
          className="card-action"
          onClick={() => setShowDetails(true)}
        >
          View full scholarship details
          <ArrowRight size={15} />
        </button>
      </div>

      {showDetails && (
        <div className="modal-overlay">
          <div className="auth-modal service-details-modal">
            <button
              className="modal-close"
              onClick={() => setShowDetails(false)}
            >
              <X size={20} />
            </button>

            <div className="small-category">
              {scholarship.category}
            </div>

            <h2>{scholarship.title}</h2>

            <div className="details-verified-label">
              <ShieldCheck size={15} />
              Official source · {scholarship.sourceLabel}
            </div>

            <div className="scheme-modal-section">
              <strong>About the scholarship</strong>
              <p>{scholarship.description}</p>
            </div>

            <div className="amount-box">
              <IndianRupee size={17} />
              <span>{scholarship.amount}</span>
            </div>

            <div className="scheme-detail-list">
              <div>
                <strong>Ministry / Body</strong>
                <span>{scholarship.ministry}</span>
              </div>

              <div>
                <strong>Eligibility</strong>
                <span>{scholarship.eligibility}</span>
              </div>

              <div>
                <strong>Application period</strong>
                <span>{scholarship.deadline}</span>
              </div>

              <div>
                <strong>Documents</strong>
                <span>{scholarship.documents}</span>
              </div>
            </div>

            <div className="scheme-modal-note">
              {scholarship.applicationNote}
            </div>

            <div className="card-action-row">
              <button
                className="card-action"
                onClick={() => {
                  setShowDetails(false);
                  setShowApplication(true);
                }}
              >
                Apply through Potter Community
                <ArrowRight size={15} />
              </button>

              <a
                className="card-action secondary-card-action"
                href={scholarship.applicationUrl}
                target="_blank"
                rel="noreferrer"
              >
                Official NSP
                <ArrowRight size={15} />
              </a>
            </div>
          </div>
        </div>
      )}

      {showApplication && (
        <ApplicationModal
          type="scholarship"
          item={scholarship}
          close={() => setShowApplication(false)}
        />
      )}
    </>
  );
}

/* =========================================================
   APPLICATION FORM
   This collects an assistance/application request inside
   Potter Community. Government/NSP verification remains
   mandatory where required by the official scheme.
========================================================= */

function ApplicationModal({ type, item, close }) {
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    mobile: "",
    email: "",
    state: "",
    district: "",
    education: "",
    category: "",
    income: "",
    occupation: type === "scheme" ? "Potter / Artisan" : "",
    consent: false,
  });

  const update = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const submit = (e) => {
    e.preventDefault();

    if (!form.consent) {
      return;
    }

    const existing = JSON.parse(
      localStorage.getItem("potterApplications") || "[]"
    );

    existing.push({
      id: `PC-${Date.now()}`,
      type,
      itemId: item.id,
      itemTitle: item.title,
      applicant: form,
      status: "Received by Potter Community",
      submittedAt: new Date().toISOString(),
    });

    localStorage.setItem(
      "potterApplications",
      JSON.stringify(existing)
    );

    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="modal-overlay">
        <div className="auth-modal">
          <button className="modal-close" onClick={close}>
            <X size={20} />
          </button>

          <div className="auth-logo">
            <span>✓</span>
          </div>

          <h2>Application Request Received</h2>

          <p className="auth-description">
            Your request for <strong>{item.title}</strong> has
            been recorded in Potter Community.
          </p>

          <div className="verification-note">
            <ShieldCheck size={17} />
            {item.applicationNote}
          </div>

          <button
            className="auth-submit"
            type="button"
            onClick={close}
          >
            Done
            <CheckCircle size={17} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="modal-overlay"
      style={{
        boxSizing: "border-box",
        padding: "12px 0",
        overflowY: "auto",
        alignItems: "center",
      }}
    >
      <div
        className="auth-modal"
        style={{
          boxSizing: "border-box",
          maxHeight: "calc(100dvh - 24px)",
          overflowY: "auto",
          margin: "auto",
        }}
      >
        <button className="modal-close" onClick={close}>
          <X size={20} />
        </button>

        <div className="auth-logo">
          <span>{type === "scheme" ? "🏛️" : "🎓"}</span>
        </div>

        <h2>Apply through Potter Community</h2>

        <p className="auth-description">
          {item.title}
        </p>

        <form onSubmit={submit}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              value={form.fullName}
              onChange={(e) =>
                update("fullName", e.target.value)
              }
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="form-group">
            <label>Mobile Number</label>
            <input
              type="tel"
              value={form.mobile}
              onChange={(e) =>
                update("mobile", e.target.value)
              }
              placeholder="Enter your mobile number"
              required
            />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="text"
              inputMode="email"
              value={form.email}
              onChange={(e) =>
                update("email", e.target.value)
              }
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label>State</label>
            <input
              type="text"
              value={form.state}
              onChange={(e) =>
                update("state", e.target.value)
              }
              placeholder="Enter your state"
              required
            />
          </div>

          <div className="form-group">
            <label>District</label>
            <input
              type="text"
              value={form.district}
              onChange={(e) =>
                update("district", e.target.value)
              }
              placeholder="Enter your district"
              required
            />
          </div>

          {type === "scheme" ? (
            <div className="form-group">
              <label>Occupation / Trade</label>
              <input
                type="text"
                value={form.occupation}
                onChange={(e) =>
                  update("occupation", e.target.value)
                }
                placeholder="e.g. Potter / Kumhaar"
                required
              />
            </div>
          ) : (
            <>
              <div className="form-group">
                <label>Current Education</label>
                <input
                  type="text"
                  value={form.education}
                  onChange={(e) =>
                    update("education", e.target.value)
                  }
                  placeholder="e.g. B.Tech 3rd Year"
                  required
                />
              </div>

              <div className="form-group">
                <label>Category / Eligibility Group</label>
                <input
                  type="text"
                  value={form.category}
                  onChange={(e) =>
                    update("category", e.target.value)
                  }
                  placeholder="Enter only if relevant to the scheme"
                />
              </div>

              <div className="form-group">
                <label>Annual Family Income</label>
                <input
                  type="text"
                  value={form.income}
                  onChange={(e) =>
                    update("income", e.target.value)
                  }
                  placeholder="Enter annual family income"
                  required
                />
              </div>
            </>
          )}

          <div className="verification-note">
            <input
              type="checkbox"
              checked={form.consent}
              onChange={(e) =>
                update("consent", e.target.checked)
              }
              required
            />
            <span>
              I confirm that the information I provide is
              accurate and understand that official
              government/NSP eligibility and verification
              still apply.
            </span>
          </div>

          <button
            type="submit"
            className="auth-submit"
          >
            Submit Application Request
            <ArrowRight size={17} />
          </button>
        </form>
      </div>
    </div>
  );
}

/* =========================================================
   WIDOW PENSION & FINANCIAL ASSISTANCE
========================================================= */

/* =========================================================
   PAYMENTS & MEMBERSHIP FEES
   Frontend demonstration based on Section 9 of the project
   requirements. Real payment processing requires backend
   verification, signed webhooks, idempotency and audit logs.
========================================================= */
function PaymentsPage({ activeRole, activeUser, cart = [] }) {
  const STORE_KEY = "potter-community-payment-center-v1";
  const [paymentData, setPaymentData] = useState(() => {
    const defaults = {
      fees: { registration: "", renewal: "", event: "" },
      payments: [],
      refunds: [],
      membershipFlow: "registration",
    };
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
      return saved && typeof saved === "object" ? { ...defaults, ...saved, fees: { ...defaults.fees, ...(saved.fees || {}) }, payments: Array.isArray(saved.payments) ? saved.payments : [], refunds: Array.isArray(saved.refunds) ? saved.refunds : [] } : defaults;
    } catch {
      return defaults;
    }
  });
  const [paymentType, setPaymentType] = useState("membership-registration");
  const [amount, setAmount] = useState("");
  const [payerName, setPayerName] = useState(() => {
    try { const p = JSON.parse(localStorage.getItem("potterProfile") || "{}"); return p.fullName || p.name || ""; } catch { return ""; }
  });
  const [payerEmail, setPayerEmail] = useState("");
  const [externalReference, setExternalReference] = useState("");
  const [feeDraft, setFeeDraft] = useState(() => ({ registration: paymentData.fees.registration === "" ? "" : String(paymentData.fees.registration), renewal: paymentData.fees.renewal === "" ? "" : String(paymentData.fees.renewal), event: paymentData.fees.event === "" ? "" : String(paymentData.fees.event) }));
  const [refundDraft, setRefundDraft] = useState({ paymentId: "", amount: "", reason: "" });
  const [notice, setNotice] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [upiQr, setUpiQr] = useState(null);
  const [isCheckingUpiQr, setIsCheckingUpiQr] = useState(false);
  const [activeTab, setActiveTab] = useState("payments");
  const [filter, setFilter] = useState("All");

  const role = activeRole || "General Member";
  const isPlatformAdmin = String(activeUser?.role || "").toUpperCase() === "ADMIN";
  const canConfigureFees = isPlatformAdmin || activeUser?.permissions?.includes("finance.manage");
  const canManageFinance = isPlatformAdmin || activeUser?.permissions?.includes("finance.manage");
  const canApproveRefund = isPlatformAdmin || activeUser?.permissions?.includes("community.approve");
  const money = (value) => value === "" || value === null || value === undefined || !Number.isFinite(Number(value)) ? "Not configured" : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(value));
  const typeLabels = {
    "membership-registration": "Membership registration fee",
    "membership-renewal": "Membership renewal fee",
    "marketplace-order": "Marketplace order",
    donation: "Community donation",
    "event-fee": "Event fee",
  };
  const loadFinanceData = async () => {
    try {
      const [policy, transactions, refunds] = await Promise.all([
        authApi("/finance/policy"),
        authApi("/finance/transactions"),
        authApi("/finance/refunds"),
      ]);
      const fees = {
        registration: policy.registration_fee ?? "",
        renewal: policy.renewal_fee ?? "",
        event: policy.event_fee ?? "",
      };
      const payments = (Array.isArray(transactions) ? transactions : []).map((item) => ({
        ...item,
        typeLabel: typeLabels[item.type] || item.type,
        status: item.status,
      }));
      setPaymentData({ ...paymentData, fees, payments, refunds: Array.isArray(refunds) ? refunds : [] });
      setFeeDraft({ registration: fees.registration === "" ? "" : String(fees.registration), renewal: fees.renewal === "" ? "" : String(fees.renewal), event: fees.event === "" ? "" : String(fees.event) });
    } catch (error) {
      setNotice(error.message || "Finance records could not be loaded from the server.");
    }
  };
  useEffect(() => { loadFinanceData(); }, []);
  const persist = (next) => {
    setPaymentData(next);
    try { localStorage.setItem(STORE_KEY, JSON.stringify(next)); } catch { setNotice("Could not save in this browser. Storage may be full or disabled."); }
  };
  const configuredAmountForType = (type) => {
    if (type === "membership-registration") return paymentData.fees.registration;
    if (type === "membership-renewal") return paymentData.fees.renewal;
    if (type === "event-fee") return paymentData.fees.event;
    return "";
  };
  const chooseType = (type) => {
    setPaymentType(type);
    const configured = configuredAmountForType(type);
    setAmount(configured !== "" ? String(configured) : "");
  };
  const saveFees = async (e) => {
    e.preventDefault();
    if (!canConfigureFees) return;
    const nextFees = { ...paymentData.fees };
    for (const key of ["registration", "renewal", "event"]) {
      const value = feeDraft[key];
      if (value !== "" && (!Number.isFinite(Number(value)) || Number(value) < 0)) {
        setNotice("Enter valid non-negative amounts for all configured fees.");
        return;
      }
      nextFees[key] = value === "" ? "" : Number(value);
    }
    try {
      await authApi("/finance/policy", {
        method: "PUT",
        body: JSON.stringify({
          registration_fee: nextFees.registration === "" ? null : Number(nextFees.registration),
          renewal_fee: nextFees.renewal === "" ? null : Number(nextFees.renewal),
          event_fee: nextFees.event === "" ? null : Number(nextFees.event),
        }),
      });
      persist({ ...paymentData, fees: nextFees });
      setNotice("Fee configuration saved to the community finance records.");
    } catch (error) {
      setNotice(error.message || "Could not save fee configuration.");
    }
  };
  // Loads Razorpay Checkout only when a member chooses to pay.
  const loadRazorpayCheckout = () => new Promise((resolve, reject) => {
    if (window.Razorpay) { resolve(true); return; }
    const existing = document.querySelector('script[data-razorpay-checkout="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(true), { once: true });
      existing.addEventListener("error", () => reject(new Error("Could not load Razorpay Checkout. Check your connection and retry.")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.dataset.razorpayCheckout = "true";
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error("Could not load Razorpay Checkout. Check your connection and retry."));
    document.body.appendChild(script);
  });

  // The server creates the order, owns the secret key, and verifies the payment.
  // Frontend amounts and localStorage are never treated as proof of payment.
  const startGatewayPayment = async () => {
    if (isProcessingPayment) return;
    const numericAmount = Number(amount);
    if (!payerName.trim()) { setNotice("Enter the payer name before continuing."); return; }
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) { setNotice("Enter a valid amount greater than ₹0."); return; }
    if (payerEmail && !/^\S+@\S+\.\S+$/.test(payerEmail)) { setNotice("Enter a valid email address or leave it blank."); return; }
    if (externalReference.trim()) { setNotice("Clear the existing transaction reference to start a new online payment. Use the offline record form only for a payment already made elsewhere."); return; }

    setIsProcessingPayment(true);
    setNotice("Connecting securely to the payment service…");
    try {
      await loadRazorpayCheckout();
      const order = await authApi("/api/payments/create-order", {
        method: "POST",
        body: JSON.stringify({
          paymentType,
          amount: Number(numericAmount.toFixed(2)),
          payerName: payerName.trim(),
          payerEmail: payerEmail.trim() || null,
          cart: paymentType === "marketplace-order" ? cart : undefined,
        }),
      });
      const keyId = order.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID;
      const orderId = order.orderId || order.id;
      if (!keyId || !orderId || !order.amount) throw new Error("The payment server returned incomplete order details. Configure the public Razorpay Key ID and server order response.");

      const checkoutOptions = {
        key: keyId,
        order_id: orderId,
        amount: order.amount,
        currency: order.currency || "INR",
        name: "Potter Community",
        description: typeLabels[paymentType] || "Community payment",
        prefill: { name: payerName.trim(), email: payerEmail.trim() },
        theme: { color: "#a95736" },
        // Keep every payment choice inside Razorpay Checkout. Do not restrict
        // UPI to QR: Test Mode supports UPI-ID payments, while QR/intent flows
        // are intended for Live Mode.
        config: {
          display: {
            blocks: {
              potter_payment_methods: {
                name: "UPI, Cards, Netbanking & Wallets",
                instruments: [
                  { method: "upi" },
                  { method: "card" },
                  { method: "netbanking" },
                  { method: "wallet" },
                ],
              },
            },
            sequence: ["block.potter_payment_methods"],
            preferences: { show_default_blocks: false },
          },
        },
        notes: { paymentType },
        handler: async (response) => {
          try {
            setNotice("Payment received by checkout. Verifying it with the server…");
            const verification = await authApi("/api/payments/verify", {
              method: "POST",
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            if (verification.verified !== true || !["captured", "paid", "verified"].includes(String(verification.paymentStatus || verification.status || "").toLowerCase())) {
              setNotice(verification.message || "The server could not confirm this payment yet. Do not pay again immediately; check payment status or contact the community treasurer.");
              return;
            }
            const transactionReference = verification.transactionReference || response.razorpay_payment_id;
            const record = {
              id: verification.recordId || `PAY-${new Date().getFullYear()}-${Date.now().toString().slice(-8)}`,
              type: paymentType,
              typeLabel: typeLabels[paymentType],
              amount: Number(verification.amount ?? (Number(order.amount) / 100)),
              payerName: payerName.trim(),
              payerEmail: payerEmail.trim(),
              transactionReference,
              gateway: "Razorpay",
              gatewayOrderId: response.razorpay_order_id,
              gatewayPaymentId: response.razorpay_payment_id,
              status: "Verified",
              receiptNumber: verification.receiptNumber || `ACK-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`,
              createdAt: verification.paidAt || new Date().toISOString(),
              createdByRole: role,
              reconciled: false,
              source: "Razorpay payment — server verified",
            };
            const existingRecord = paymentData.payments.some((p) => p.gatewayPaymentId === record.gatewayPaymentId || p.transactionReference === record.transactionReference);
            if (!existingRecord) persist({ ...paymentData, payments: [record, ...paymentData.payments] });
            setExternalReference("");
            setNotice(`Payment verified successfully. Payment ID: ${response.razorpay_payment_id}. Your payment is recorded; membership approval remains a separate step.`);
            setActiveTab("payments");
          } catch (error) {
            setNotice(error.message || "Payment was submitted but verification could not be completed. Please check status before retrying.");
          } finally {
            setIsProcessingPayment(false);
          }
        },
        modal: { ondismiss: () => { setIsProcessingPayment(false); setNotice("Checkout was closed. If you completed a payment before closing, check the payment status before trying again."); } },
      };
      const checkout = new window.Razorpay(checkoutOptions);
      checkout.on("payment.failed", (event) => {
        setIsProcessingPayment(false);
        setNotice(event?.error?.description || "Payment failed or was cancelled. You can retry after checking your bank or UPI app.");
      });
      checkout.open();
    } catch (error) {
      setNotice(`${error.message || "Could not start payment."} Make sure the backend is running and its payment endpoints are configured.`);
      setIsProcessingPayment(false);
    }
  };

  // Create a unique Razorpay UPI QR for this amount and signed-in member.
  const generateUpiQr = async () => {
    if (isProcessingPayment) return;
    const numericAmount = Number(amount);
    if (!payerName.trim()) { setNotice("Enter the payer name before generating a UPI QR."); return; }
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) { setNotice("Enter a valid amount greater than ₹0."); return; }
    if (payerEmail && !/^\S+@\S+\.\S+$/.test(payerEmail)) { setNotice("Enter a valid email address or leave it blank."); return; }
    if (externalReference.trim()) { setNotice("Clear the existing transaction reference before starting a new online payment."); return; }

    setIsProcessingPayment(true);
    setNotice("Generating a secure, amount-specific UPI QR code…");
    try {
      const result = await authApi("/api/payments/create-upi-qr", {
        method: "POST",
        body: JSON.stringify({
          paymentType,
          amount: Number(numericAmount.toFixed(2)),
          payerName: payerName.trim(),
          payerEmail: payerEmail.trim() || null,
        }),
      });
      if (!result.qrCodeId || !result.imageUrl) throw new Error("Razorpay did not return a QR image. Check that QR Codes are enabled for your Razorpay account.");
      setUpiQr({
        id: result.qrCodeId,
        imageUrl: result.imageUrl,
        amount: Number(result.amount || numericAmount),
        expiresAt: result.expiresAt || null,
        testMode: Boolean(result.testMode),
      });
      setNotice("Your UPI QR is ready. Scan it with a UPI app, complete the payment, then check its status here.");
    } catch (error) {
      setNotice(error.message || "Could not generate the UPI QR. Please check the backend and Razorpay QR Code API access.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Only the server can confirm a QR payment and create the financial record.
  const checkUpiQrPayment = async () => {
    if (!upiQr?.id || isCheckingUpiQr) return;
    setIsCheckingUpiQr(true);
    try {
      const result = await authApi(`/api/payments/upi-qr/${encodeURIComponent(upiQr.id)}/status`);
      if (result.verified === true && String(result.paymentStatus || "").toLowerCase() === "captured") {
        const paymentId = result.transactionReference;
        const record = {
          id: result.recordId || `PAY-${new Date().getFullYear()}-${Date.now().toString().slice(-8)}`,
          type: paymentType,
          typeLabel: typeLabels[paymentType],
          amount: Number(result.amount ?? upiQr.amount),
          payerName: payerName.trim(),
          payerEmail: payerEmail.trim(),
          transactionReference: paymentId,
          gateway: "Razorpay UPI QR",
          gatewayPaymentId: paymentId,
          gatewayQrCodeId: upiQr.id,
          status: "Verified",
          receiptNumber: result.receiptNumber || `ACK-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`,
          createdAt: result.paidAt || new Date().toISOString(),
          createdByRole: role,
          reconciled: false,
          source: "Razorpay UPI QR — server verified",
        };
        const exists = paymentData.payments.some((p) => p.gatewayPaymentId === paymentId || p.transactionReference === paymentId);
        if (!exists) persist({ ...paymentData, payments: [record, ...paymentData.payments] });
        setExternalReference("");
        setUpiQr(null);
        setNotice(`UPI payment verified successfully. Payment ID: ${paymentId}. Your payment has been recorded.`);
        setActiveTab("payments");
      } else {
        setNotice("No captured payment has been found for this QR yet. Complete the payment in your UPI app, wait a moment, and check again.");
      }
    } catch (error) {
      setNotice(error.message || "Could not check the UPI payment status. Please retry.");
    } finally {
      setIsCheckingUpiQr(false);
    }
  };

  const createPaymentRecord = async (e) => {
    e.preventDefault();
    const numericAmount = Number(amount);
    if (!payerName.trim()) { setNotice("Enter the payer name before continuing."); return; }
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) { setNotice("Enter a valid amount greater than ₹0."); return; }
    if (payerEmail && !/^\S+@\S+\.\S+$/.test(payerEmail)) { setNotice("Enter a valid email address or leave it blank."); return; }
    const transactionReference = externalReference.trim();
    if (!transactionReference) { setNotice("Enter the real transaction reference from the bank, UPI app, or payment provider. This form cannot collect money."); return; }
    if (paymentData.payments.some((item) => item.transactionReference.toLowerCase() === transactionReference.toLowerCase())) {
      setNotice("That transaction reference already exists. Duplicate references are not accepted.");
      return;
    }
    try {
      const record = await authApi("/finance/transactions", {
        method: "POST",
        body: JSON.stringify({ payment_type: paymentType, amount: Number(numericAmount.toFixed(2)), payer_name: payerName.trim(), payer_email: payerEmail.trim() || null, transaction_reference: transactionReference }),
      });
      setExternalReference("");
      setNotice(`Offline reference ${record.id} was saved on the server for finance verification. This does not approve membership.`);
      setActiveTab("payments");
      await loadFinanceData();
    } catch (error) {
      setNotice(error.message || "Could not submit the payment reference.");
    }
  };
  const verifyPayment = async (paymentId) => {
    if (!canManageFinance) return;
    try {
      await authApi(`/finance/transactions/${encodeURIComponent(paymentId)}/verify`, { method: "PATCH" });
      setNotice("Payment record verified and saved.");
      await loadFinanceData();
    } catch (error) { setNotice(error.message || "Could not verify this payment record."); }
  };
  const requestRefund = async (e) => {
    e.preventDefault();
    if (!canManageFinance) return;
    const payment = paymentData.payments.find((p) => p.id === refundDraft.paymentId);
    const refundAmount = Number(refundDraft.amount);
    if (!payment) { setNotice("Select a recorded payment for this refund request."); return; }
    if (payment.status !== "Verified") { setNotice("Only verified payment records can be considered for a refund."); return; }
    if (!Number.isFinite(refundAmount) || refundAmount <= 0 || refundAmount > payment.amount) { setNotice("Enter a valid refund amount no greater than the verified payment amount."); return; }
    if (!refundDraft.reason.trim()) { setNotice("Enter a reason for the refund request."); return; }
    try {
      const refund = await authApi(`/finance/transactions/${encodeURIComponent(payment.id)}/refunds`, { method: "POST", body: JSON.stringify({ amount: Number(refundAmount.toFixed(2)), reason: refundDraft.reason.trim() }) });
      setRefundDraft({ paymentId: "", amount: "", reason: "" });
      setNotice(`Refund request ${refund.id} recorded for President approval.`);
      setActiveTab("refunds");
      await loadFinanceData();
    } catch (error) { setNotice(error.message || "Could not record the refund request."); }
  };
  const updateRefund = async (refundId, status) => {
    try {
      if (status === "Approved for processing" || status === "Rejected") {
        if (!canApproveRefund) return;
        const remark = status === "Rejected" ? window.prompt("Reason for rejecting this refund request?") : null;
        if (status === "Rejected" && (!remark || remark.trim().length < 3)) return;
        await authApi(`/finance/refunds/${encodeURIComponent(refundId)}/decision`, { method: "PATCH", body: JSON.stringify({ decision: status === "Rejected" ? "REJECTED" : "APPROVED", remark }) });
      } else if (status === "Refunded") {
        if (!canManageFinance) return;
        await authApi(`/finance/refunds/${encodeURIComponent(refundId)}/processed`, { method: "PATCH" });
      }
      setNotice(`Refund record updated to “${status}”. Any actual refund must still be sent through the payment provider.`);
      await loadFinanceData();
    } catch (error) { setNotice(error.message || "Could not update this refund."); }
  };
  const reconcile = async (paymentId) => {
    if (!canManageFinance) return;
    try {
      await authApi(`/finance/transactions/${encodeURIComponent(paymentId)}/reconcile`, { method: "PATCH" });
      setNotice("Payment record reconciled and saved.");
      await loadFinanceData();
    } catch (error) { setNotice(error.message || "Could not reconcile this payment record."); }
  };
  const printReceipt = (payment) => {
    const win = window.open("", "_blank", "width=700,height=800");
    if (!win) { setNotice("Allow pop-ups to print the receipt."); return; }
    win.document.write(`<!doctype html><html><head><title>Potter Community payment acknowledgement</title><style>body{font-family:Arial,sans-serif;color:#39271d;padding:32px;max-width:700px;margin:auto}h1{color:#a95736}hr{border:0;border-top:1px solid #e7d6c8}small{color:#76685e}.notice{background:#fff1e5;padding:12px;border:1px solid #e8c9b5;margin:18px 0}.row{display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #eee}</style></head><body><h1>Potter Community</h1><h2>Payment Record Acknowledgement</h2><div class="row"><b>Record ID</b><span>${payment.id}</span></div><div class="row"><b>Acknowledgement No.</b><span>${payment.receiptNumber}</span></div><div class="row"><b>Payer</b><span>${payment.payerName}</span></div><div class="row"><b>Payment type</b><span>${payment.typeLabel}</span></div><div class="row"><b>Amount</b><span>₹${Number(payment.amount).toFixed(2)}</span></div><div class="row"><b>Transaction reference</b><span>${payment.transactionReference}</span></div><div class="row"><b>Status</b><span>${payment.status}</span></div><div class="row"><b>Recorded on</b><span>${new Date(payment.createdAt).toLocaleString()}</span></div><script>window.onload=()=>window.print()</script></body></html>`);
    win.document.close();
  };
  const visiblePayments = paymentData.payments.filter((p) => filter === "All" || p.status === filter || (filter === "Unreconciled" && !p.reconciled));
  const totalVerified = paymentData.payments.filter((p) => p.status === "Verified").reduce((sum, p) => sum + p.amount, 0);
  const totalPending = paymentData.payments.filter((p) => p.status === "Pending verification").reduce((sum, p) => sum + p.amount, 0);
  const totalRefunded = paymentData.refunds.filter((r) => r.status === "Refunded").reduce((sum, r) => sum + r.amount, 0);
  const formatDate = (value) => value ? new Date(value).toLocaleString() : "—";
  const inputStyle = { width: "100%", boxSizing: "border-box", border: "1px solid #e6d4c7", borderRadius: 10, padding: "11px 12px", background: "#fffdf9", color: "#39271d", font: "inherit", fontSize: 13 };
  const labelStyle = { display: "block", fontSize: 11, fontWeight: 700, color: "#634535", marginBottom: 7 };
  const panelStyle = { background: "#fffdfb", border: "1px solid #ead9cc", borderRadius: 16, padding: 20, minWidth: 0 };
  const statusStyle = (status) => ({ display: "inline-flex", alignItems: "center", padding: "5px 9px", borderRadius: 99, fontSize: 10, fontWeight: 700, background: status === "Verified" || status === "Refunded" ? "#e8f4e8" : status === "Pending verification" || status === "Requested" ? "#fff1d8" : status === "Rejected" ? "#fbe8e5" : "#f0e9e3", color: status === "Verified" || status === "Refunded" ? "#2f6b3b" : status === "Pending verification" || status === "Requested" ? "#8a5b12" : status === "Rejected" ? "#a13d2d" : "#685448" });

  return (
    <PageWrapper>
      <PageHeader title="Payments & Membership Fees" description="Review fee requirements, record payment references, download acknowledgements, and manage finance records." />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(165px,1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Verified payment records", value: paymentData.payments.filter((p) => p.status === "Verified").length, icon: CheckCircle },
          { label: "Awaiting verification", value: paymentData.payments.filter((p) => p.status === "Pending verification").length, icon: Clock },
          { label: "Verified total", value: money(totalVerified), icon: IndianRupee },
          { label: "Refunds recorded", value: money(totalRefunded), icon: RotateCcw },
        ].map((item) => { const Icon = item.icon; return <div key={item.label} style={{ ...panelStyle, padding: 16, display: "flex", gap: 12, alignItems: "center" }}><div style={{ width: 42, height: 42, flexShrink: 0, borderRadius: 12, display: "grid", placeItems: "center", background: "#f6e4d7", color: "#a95736" }}><Icon size={20}/></div><div style={{ minWidth: 0 }}><div style={{ fontSize: 10, color: "#887366", marginBottom: 4 }}>{item.label}</div><strong style={{ fontSize: 16, color: "#442d20", overflowWrap: "anywhere" }}>{item.value}</strong></div></div>; })}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {[{ id: "payments", label: "Payments & Receipts", icon: CreditCard }, { id: "refunds", label: "Refund Records", icon: RotateCcw }, { id: "reconciliation", label: "Reconciliation", icon: ClipboardCheck }, ...(canManageFinance ? [{ id: "treasurer", label: "Treasurer Dashboard", icon: TrendingUp }] : []), ...(canConfigureFees ? [{ id: "fees", label: "Fee Configuration", icon: Settings }] : [])].map((tab) => { const Icon = tab.icon; return <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} style={{ border: activeTab === tab.id ? "1px solid #a95736" : "1px solid #e8d8cc", background: activeTab === tab.id ? "#a95736" : "#fffdfb", color: activeTab === tab.id ? "white" : "#6c5141", borderRadius: 10, padding: "10px 13px", display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 11, cursor: "pointer" }}><Icon size={15}/>{tab.label}</button>; })}
      </div>

      {notice && <div role="status" style={{ marginBottom: 16, padding: "12px 14px", borderRadius: 10, border: "1px solid #e8d2c0", background: "#fff5eb", color: "#704a34", fontSize: 12, lineHeight: 1.5 }}>{notice}<button onClick={() => setNotice("")} aria-label="Dismiss message" style={{ float: "right", border: 0, background: "transparent", color: "inherit", cursor: "pointer" }}><X size={15}/></button></div>}
      {activeTab === "payments" && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,330px),1fr))", gap: 16, alignItems: "start" }}>
        <section style={panelStyle}>
          <h2 style={{ margin: "0 0 5px", fontSize: 17, color: "#442d20" }}>Pay securely online</h2>
          <form onSubmit={(e) => { e.preventDefault(); startGatewayPayment(); }} style={{ display: "grid", gap: 13 }}>
            <div><label style={labelStyle}>Payment type</label><select value={paymentType} onChange={(e) => chooseType(e.target.value)} style={inputStyle}><option value="membership-registration">Membership registration fee</option><option value="membership-renewal">Renewal fee</option><option value="marketplace-order">Marketplace order</option><option value="donation">Community donation</option><option value="event-fee">Event fee</option></select></div>
            <div><label style={labelStyle}>Amount (₹)</label><input type="number" min="0.01" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={configuredAmountForType(paymentType) !== "" ? `Configured fee: ₹${configuredAmountForType(paymentType)}` : "Enter amount in INR"} style={inputStyle}/></div>
            <div><label style={labelStyle}>Payer full name</label><input required value={payerName} onChange={(e) => setPayerName(e.target.value)} placeholder="Enter payer name" style={inputStyle}/></div>
            <div><label style={labelStyle}>Email for receipt (optional)</label><input type="email" value={payerEmail} onChange={(e) => setPayerEmail(e.target.value)} placeholder="name@example.com" style={inputStyle}/></div>
            <button type="submit" className="btn btn-primary" disabled={isProcessingPayment} style={{ justifyContent: "center", width: "100%", opacity: isProcessingPayment ? 0.7 : 1 }}><CreditCard size={16}/>{isProcessingPayment ? "Connecting to payment service…" : `Pay ₹${Number(amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} securely`}</button>
          </form>
          <div style={{ borderTop: "1px solid #f0e5dc", marginTop: 18, paddingTop: 16 }}>
            <h3 style={{ margin: "0 0 5px", fontSize: 13, color: "#442d20" }}>Already paid outside this checkout?</h3>
            <form onSubmit={createPaymentRecord} style={{ display: "grid", gap: 11 }}>
              <div><label style={labelStyle}>Transaction reference (required)</label><input required value={externalReference} onChange={(e) => setExternalReference(e.target.value)} placeholder="UPI / bank / gateway reference" style={inputStyle}/></div>
              <button type="submit" className="btn btn-outline" style={{ justifyContent: "center", width: "100%" }}><Receipt size={16}/> Submit offline reference</button>
            </form>
          </div>
        </section>
        <section style={panelStyle}>
          <h2 style={{ margin: "0 0 5px", fontSize: 17, color: "#442d20" }}>Fee summary</h2>
          {[{ title: "Membership registration fee", value: paymentData.fees.registration }, { title: "Renewal fee", value: paymentData.fees.renewal }, { title: "Event fee", value: paymentData.fees.event }, { title: "Marketplace orders", value: "variable" }, { title: "Community donations", value: "voluntary" }].map((item) => <div key={item.title} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 0", borderBottom: "1px solid #f0e5dc" }}><span style={{ fontSize: 12, color: "#634b3b" }}>{item.title}</span><strong style={{ fontSize: 12, color: "#503627", textAlign: "right" }}>{typeof item.value === "number" || item.value === "" ? money(item.value) : item.value === "variable" ? "Order total" : "No fixed fee"}</strong></div>)}
        </section>
      </div>}

      {activeTab === "fees" && canConfigureFees && <section style={panelStyle}>
        <h2 style={{ margin: "0 0 5px", fontSize: 17, color: "#442d20" }}>Configure community fees</h2>
        <form onSubmit={saveFees} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14 }}>
          {[{ key: "registration", label: "Membership registration fee (₹)" }, { key: "renewal", label: "Membership renewal fee (₹)" }, { key: "event", label: "Event fee (₹)" }].map((item) => <div key={item.key}><label style={labelStyle}>{item.label}</label><input type="number" min="0" step="0.01" value={feeDraft[item.key]} onChange={(e) => setFeeDraft({ ...feeDraft, [item.key]: e.target.value })} placeholder={paymentData.fees[item.key] === "" ? "Not configured" : String(paymentData.fees[item.key])} style={inputStyle}/></div>)}
          <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10, flexWrap: "wrap" }}><button type="submit" className="btn btn-primary"><Check size={15}/> Save fee configuration</button><button type="button" className="btn btn-outline" onClick={() => setFeeDraft({ registration: paymentData.fees.registration === "" ? "" : String(paymentData.fees.registration), renewal: paymentData.fees.renewal === "" ? "" : String(paymentData.fees.renewal), event: paymentData.fees.event === "" ? "" : String(paymentData.fees.event) })}>Load current fees</button></div>
        </form>
      </section>}

      {activeTab === "refunds" && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,320px),1fr))", gap: 16, alignItems: "start" }}>
        {canManageFinance && <section style={panelStyle}><h2 style={{ margin: "0 0 5px", fontSize: 17, color: "#442d20" }}>Record refund request</h2><form onSubmit={requestRefund} style={{ display: "grid", gap: 12 }}><div><label style={labelStyle}>Verified payment</label><select required value={refundDraft.paymentId} onChange={(e) => { const payment = paymentData.payments.find((p) => p.id === e.target.value); setRefundDraft({ ...refundDraft, paymentId: e.target.value, amount: payment ? String(payment.amount) : "" }); }} style={inputStyle}><option value="">Choose a verified payment</option>{paymentData.payments.filter((p) => p.status === "Verified").map((p) => <option key={p.id} value={p.id}>{p.id} · ₹{p.amount.toFixed(2)} · {p.payerName}</option>)}</select></div><div><label style={labelStyle}>Refund amount (₹)</label><input type="number" required min="0.01" step="0.01" value={refundDraft.amount} onChange={(e) => setRefundDraft({ ...refundDraft, amount: e.target.value })} style={inputStyle}/></div><div><label style={labelStyle}>Reason</label><textarea required rows="3" value={refundDraft.reason} onChange={(e) => setRefundDraft({ ...refundDraft, reason: e.target.value })} placeholder="Reason for refund request" style={{ ...inputStyle, resize: "vertical" }}/></div><button className="btn btn-primary" type="submit"><RotateCcw size={15}/> Save refund record</button></form></section>}
        <section style={panelStyle}><h2 style={{ margin: "0 0 13px", fontSize: 17, color: "#442d20" }}>Refund history</h2>{paymentData.refunds.length === 0 ? <EmptyState title="No refund records yet" description="Refund requests and their processing status will appear here."/> : paymentData.refunds.map((r) => <div key={r.id} style={{ padding: "13px 0", borderBottom: "1px solid #f0e5dc" }}><div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}><strong style={{ fontSize: 12 }}>{r.id}</strong><span style={statusStyle(r.status)}>{r.status}</span></div><p style={{ margin: "7px 0", fontSize: 12, color: "#684c3b" }}>₹{r.amount.toFixed(2)} · Payment {r.paymentId}</p><p style={{ margin: "0 0 8px", fontSize: 11, color: "#887366" }}>{r.reason}</p><small style={{ color: "#9b887b" }}>{formatDate(r.createdAt)}</small>{((canManageFinance && r.status === "Approved for processing") || (canApproveRefund && r.status === "Requested")) && <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 10 }}>{canApproveRefund && r.status === "Requested" && <><button className="btn btn-outline" type="button" onClick={() => updateRefund(r.id, "Approved for processing")}>Approve request</button><button className="btn btn-outline" type="button" onClick={() => updateRefund(r.id, "Rejected")}>Reject</button></>}{canManageFinance && r.status === "Approved for processing" && <button className="btn btn-primary" type="button" onClick={() => updateRefund(r.id, "Refunded")}>Mark refunded</button>}</div>}</div>)}</section>
      </div>}

      {activeTab === "reconciliation" && <section style={panelStyle}><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 14 }}><div><h2 style={{ margin: 0, fontSize: 17, color: "#442d20" }}>Payment reconciliation</h2></div><span style={{ fontSize: 11, color: "#887366" }}>{paymentData.payments.filter((p) => !p.reconciled).length} unreconciled</span></div>{paymentData.payments.length === 0 ? <EmptyState title="No transactions to reconcile" description="Payment records will appear here after a member records a transaction."/> : <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", minWidth: 750, fontSize: 11 }}><thead><tr style={{ textAlign: "left", background: "#f9eee6", color: "#6a4a37" }}>{["Reference", "Payer", "Type", "Amount", "Payment status", "Reconciliation", "Action"].map((h) => <th key={h} style={{ padding: 11 }}>{h}</th>)}</tr></thead><tbody>{paymentData.payments.map((p) => <tr key={p.id} style={{ borderBottom: "1px solid #f0e5dc" }}><td style={{ padding: 11 }}>{p.transactionReference}</td><td style={{ padding: 11 }}>{p.payerName}</td><td style={{ padding: 11 }}>{p.typeLabel}</td><td style={{ padding: 11 }}>₹{p.amount.toFixed(2)}</td><td style={{ padding: 11 }}><span style={statusStyle(p.status)}>{p.status}</span></td><td style={{ padding: 11 }}>{p.reconciled ? "Reconciled" : "Unreconciled"}</td><td style={{ padding: 11 }}>{canManageFinance && !p.reconciled ? <button type="button" className="btn btn-outline" onClick={() => reconcile(p.id)}>Mark reconciled</button> : "—"}</td></tr>)}</tbody></table></div>}</section>}

      {activeTab === "treasurer" && canManageFinance && <div style={{ display: "grid", gap: 16 }}><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 12 }}>{[{ label: "Verified receipts total", value: money(totalVerified) }, { label: "Pending verification value", value: money(totalPending) }, { label: "Refunded total", value: money(totalRefunded) }, { label: "Unreconciled records", value: paymentData.payments.filter((p) => !p.reconciled).length }].map((item) => <div key={item.label} style={panelStyle}><span style={{ fontSize: 11, color: "#887366" }}>{item.label}</span><h2 style={{ margin: "8px 0 0", color: "#442d20", fontSize: 22 }}>{item.value}</h2></div>)}</div><section style={panelStyle}><h2 style={{ margin: "0 0 5px", fontSize: 17, color: "#442d20" }}>Treasurer review queue</h2><p style={{ margin: "0 0 15px", fontSize: 11, color: "#887366" }}>Verify transaction records against the payment provider before marking them verified.</p>{paymentData.payments.filter((p) => p.status === "Pending verification").length === 0 ? <EmptyState title="No payments awaiting verification" description="New payment records will appear here for finance review."/> : paymentData.payments.filter((p) => p.status === "Pending verification").map((p) => <div key={p.id} style={{ padding: "13px 0", borderBottom: "1px solid #f0e5dc", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}><div><strong style={{ fontSize: 12 }}>{p.id} · ₹{p.amount.toFixed(2)}</strong><p style={{ margin: "5px 0", fontSize: 11, color: "#6f5544" }}>{p.payerName} · {p.typeLabel}</p><small style={{ color: "#8a7669" }}>Ref: {p.transactionReference} · {formatDate(p.createdAt)}</small></div><button type="button" className="btn btn-primary" onClick={() => verifyPayment(p.id)}><CheckCircle size={14}/> Mark verified</button></div>)}</section></div>}

      {activeTab === "payments" && <section style={{ ...panelStyle, marginTop: 16 }}><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 14 }}><div><h2 style={{ margin: 0, fontSize: 17, color: "#442d20" }}>Payment records & acknowledgements</h2></div><select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ ...inputStyle, width: "auto", minWidth: 165 }}><option>All</option><option>Pending verification</option><option>Verified</option><option>Unreconciled</option></select></div>{visiblePayments.length === 0 ? <EmptyState title="No payment records yet" description="Your membership fees, renewals, donations, event fees, and marketplace payment references will appear here."/> : <div style={{ display: "grid", gap: 10 }}>{visiblePayments.map((p) => <div key={p.id} style={{ border: "1px solid #efdfd3", borderRadius: 12, padding: 14, display: "grid", gridTemplateColumns: "minmax(0,1.5fr) minmax(100px,.7fr) minmax(120px,.8fr) auto", gap: 12, alignItems: "center" }}><div><strong style={{ fontSize: 12, color: "#503627" }}>{p.typeLabel}</strong><p style={{ margin: "5px 0", color: "#887366", fontSize: 10 }}>{p.id} · {p.payerName} · {formatDate(p.createdAt)}</p><small style={{ color: "#9b887b", overflowWrap: "anywhere" }}>Transaction ref: {p.transactionReference}</small></div><strong style={{ color: "#442d20", fontSize: 14 }}>₹{p.amount.toFixed(2)}</strong><div><span style={statusStyle(p.status)}>{p.status}</span><div style={{ marginTop: 5, fontSize: 10, color: "#8a7669" }}>{p.reconciled ? "Reconciled" : "Not reconciled"}</div></div><button type="button" className="btn btn-outline" onClick={() => printReceipt(p)}><Receipt size={14}/> Print acknowledgement</button></div>)}</div>}</section>}
    </PageWrapper>
  );
}

function WidowAssistancePage({ activeUser }) {
  const [form, setForm] = useState({
    applicantName: "",
    state: "",
    district: "",
    assistanceType: "Widow pension",
    scope: "GOVERNMENT",
    annualIncome: "",
    referenceNumber: "",
    notes: "",
  });
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [benefitFor, setBenefitFor] = useState(null);
  const isAdmin = ["ADMIN", "SUPER ADMIN"].includes(String(activeUser?.role || "").toUpperCase());
  const application = applications[0] || null;

  const loadApplications = async () => {
    setLoading(true);
    try {
      const rows = await authApi("/assistance/applications");
      setApplications(Array.isArray(rows) ? rows : []);
      const needsUpdate = !isAdmin && rows.find((item) => item.status === "DOCUMENTS_REQUIRED");
      if (needsUpdate) setForm((current) => ({ ...current, applicantName: needsUpdate.applicantName || current.applicantName, state: needsUpdate.state || current.state, district: needsUpdate.district || current.district, assistanceType: needsUpdate.assistanceType || current.assistanceType, scope: needsUpdate.scope || current.scope, annualIncome: needsUpdate.annualIncome || current.annualIncome, referenceNumber: needsUpdate.officialReference || current.referenceNumber, notes: needsUpdate.notes || current.notes }));
      setError("");
    } catch (loadError) {
      setError(loadError.message || "Could not load assistance requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadApplications(); }, []);

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setMessage("");
  };

  const submitApplication = async (event) => {
    event.preventDefault();
    setBusy(true); setError(""); setMessage("");
    const payload = new FormData(event.currentTarget);
    const files = payload.getAll("files");
    const request = new FormData();
    request.set("assistance_type", form.assistanceType);
    request.set("scope", form.scope);
    request.set("official_reference", form.referenceNumber.trim());
    request.set("details", JSON.stringify({ applicantName: form.applicantName, state: form.state, district: form.district, annualIncome: form.annualIncome, notes: form.notes }));
    for (const file of files) if (file instanceof File && file.size) request.append("files", file);
    try {
      const resubmission = applications.find((item) => item.status === "DOCUMENTS_REQUIRED");
      await authApi(resubmission ? `/assistance/applications/${resubmission.id}/resubmit` : "/assistance/applications", { method: resubmission ? "PATCH" : "POST", body: request });
      setMessage(resubmission ? "Updated request resubmitted for community review." : "Request sent for community review. This does not submit a government application.");
      setForm({ applicantName: "", state: "", district: "", assistanceType: "Widow pension", scope: "GOVERNMENT", annualIncome: "", referenceNumber: "", notes: "" });
      await loadApplications();
    } catch (submitError) { setError(submitError.message || "Could not submit the request."); }
    finally { setBusy(false); }
  };

  const updateDecision = async (applicationId, status) => {
    const reason = window.prompt(status === "APPROVED" ? "Review note (optional):" : "Please enter the reason or missing documents:");
    if (status !== "APPROVED" && !reason?.trim()) return;
    setBusy(true); setError("");
    try {
      await authApi(`/assistance/applications/${applicationId}/decision`, { method: "PATCH", body: JSON.stringify({ status, reason: reason?.trim() || null }) });
      setMessage(`Request ${status.toLowerCase().replaceAll("_", " ")}.`);
      await loadApplications();
    } catch (decisionError) { setError(decisionError.message || "Could not update the request."); }
    finally { setBusy(false); }
  };

  const updateOfficialStatus = async (applicationId, status) => {
    const reason = window.prompt(`Add evidence or verification note for official status ${status}:`);
    if (!reason?.trim()) return;
    setBusy(true); setError("");
    try {
      await authApi(`/assistance/applications/${applicationId}/official-status`, { method: "PATCH", body: JSON.stringify({ status, reason: reason.trim() }) });
      await loadApplications();
    } catch (statusError) { setError(statusError.message || "Could not update official status."); }
    finally { setBusy(false); }
  };

  const submitBenefit = async (event) => {
    event.preventDefault();
    if (!benefitFor) return;
    setBusy(true); setError("");
    const data = new FormData(event.currentTarget);
    try {
      await authApi(`/assistance/applications/${benefitFor.id}/benefits`, { method: "POST", body: data });
      setBenefitFor(null); setMessage("Benefit receipt recorded and awaiting verification.");
      await loadApplications();
    } catch (benefitError) { setError(benefitError.message || "Could not record benefit."); }
    finally { setBusy(false); }
  };

  const verifyBenefit = async (benefitId, status) => {
    setBusy(true); setError("");
    try {
      await authApi(`/assistance/benefits/${benefitId}/verify`, { method: "PATCH", body: JSON.stringify({ status }) });
      await loadApplications();
    } catch (verifyError) { setError(verifyError.message || "Could not verify benefit."); }
    finally { setBusy(false); }
  };

  const openAssistanceFile = async (url) => {
    const token = sessionStorage.getItem("potterCommunityAccessToken") || localStorage.getItem("token");
    const preview = window.open("", "_blank");
    try {
      const response = await fetch(`${AUTH_API_BASE}${url}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!response.ok) throw new Error("Could not open this private document.");
      const objectUrl = URL.createObjectURL(await response.blob());
      if (preview) { preview.opener = null; preview.location.href = objectUrl; }
      else { const link = document.createElement("a"); link.href = objectUrl; link.target = "_blank"; link.rel = "noopener noreferrer"; link.click(); }
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch (fileError) { preview?.close(); setError(fileError.message); }
  };

  const fieldStyle = {
    width: "100%",
    boxSizing: "border-box",
    minHeight: 46,
    border: "1px solid #e6d2c5",
    borderRadius: 10,
    background: "#fffdfa",
    padding: "11px 13px",
    color: "#4a3025",
    font: "inherit",
    outlineColor: "#ad5a38",
  };
  const labelStyle = {
    display: "block",
    marginBottom: 7,
    color: "#4a3025",
    fontSize: 12,
    fontWeight: 700,
  };
  const panelStyle = {
    background: "#fffdfb",
    border: "1px solid #ead9ce",
    borderRadius: 16,
    padding: 22,
    boxShadow: "0 3px 12px rgba(91, 55, 36, 0.035)",
  };

  return (
    <PageWrapper>
      <PageHeader
        title="Widow Pension & Financial Assistance"
        description="Explore available support, prepare your details, and keep track of your assistance request."
      />
      {error && <p role="alert" style={{ color: "#a13d2d", fontSize: 12 }}>{error}</p>}
      {message && <p role="status" style={{ color: "#39734a", fontSize: 12 }}>{message}</p>}

      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "17px 19px", marginBottom: 22, border: "1px solid #ead1bf", borderRadius: 14, background: "linear-gradient(105deg, #fbede2 0%, #fff8f1 100%)" }}>
        <div style={{ width: 44, height: 44, flex: "0 0 44px", display: "grid", placeItems: "center", borderRadius: 12, background: "#fff", color: "#a9512f", border: "1px solid #f0d6c5" }}><ShieldCheck size={22} /></div>
        <div style={{ minWidth: 0 }}>
          <strong style={{ display: "block", color: "#603723", fontSize: 14, marginBottom: 5 }}>Start with the official scheme requirements</strong>
          <p style={{ margin: 0, color: "#795e4e", fontSize: 12, lineHeight: 1.7 }}>Eligibility, income limits, required evidence, and application routes vary by state and scheme. Use this page to prepare information; apply through the relevant official department or authorized service.</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 235px), 1fr))", gap: 15, marginBottom: 24 }}>
        <div style={{ ...panelStyle, padding: 19 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: "#f8e7da", color: "#a9512f", display: "grid", placeItems: "center" }}><IndianRupee size={21} /></div>
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".06em", color: "#9c5b3c", background: "#fbefe6", padding: "6px 8px", borderRadius: 20 }}>SUPPORT TYPE</span>
          </div>
          <h3 style={{ margin: "0 0 8px", fontSize: 16, color: "#452b20" }}>Widow pension</h3>
          <p style={{ margin: 0, color: "#80695c", fontSize: 12, lineHeight: 1.7 }}>Periodic financial support for applicants who meet the conditions of an applicable central or state scheme.</p>
        </div>
        <div style={{ ...panelStyle, padding: 19 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: "#f8e7da", color: "#a9512f", display: "grid", placeItems: "center" }}><HeartPulse size={21} /></div>
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".06em", color: "#9c5b3c", background: "#fbefe6", padding: "6px 8px", borderRadius: 20 }}>OTHER SUPPORT</span>
          </div>
          <h3 style={{ margin: "0 0 8px", fontSize: 16, color: "#452b20" }}>Financial assistance</h3>
          <p style={{ margin: 0, color: "#80695c", fontSize: 12, lineHeight: 1.7 }}>Other pension or welfare support may be offered by state departments or authorized community organizations.</p>
        </div>
        <div style={{ ...panelStyle, padding: 19 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: "#f8e7da", color: "#a9512f", display: "grid", placeItems: "center" }}><FileText size={21} /></div>
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".06em", color: "#9c5b3c", background: "#fbefe6", padding: "6px 8px", borderRadius: 20 }}>BEFORE APPLYING</span>
          </div>
          <h3 style={{ margin: "0 0 8px", fontSize: 16, color: "#452b20" }}>Eligibility checks</h3>
          <p style={{ margin: 0, color: "#80695c", fontSize: 12, lineHeight: 1.7 }}>Residence, age, marital status, income, existing benefits, and supporting documents may be assessed.</p>
        </div>
      </div>

      <div style={{ ...panelStyle, marginBottom: 24, padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "20px 22px", borderBottom: "1px solid #f0e2d8", background: "#fffaf6", display: "flex", alignItems: "center", gap: 13 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: "#f8e7da", color: "#a9512f", display: "grid", placeItems: "center", flex: "0 0 42px" }}><FileText size={21} /></div>
          <div>
            <span style={{ display: "block", color: "#a45a38", fontSize: 10, fontWeight: 800, letterSpacing: ".09em", marginBottom: 4 }}>APPLICATION DETAILS</span>
            <h2 style={{ margin: 0, color: "#452b20", fontSize: 19 }}>Prepare an assistance request</h2>
            <p style={{ margin: "5px 0 0", color: "#8a7062", fontSize: 12 }}>Enter the basic details you may need when applying through the official channel.</p>
          </div>
        </div>
        <form onSubmit={submitApplication} style={{ padding: 22 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 270px), 1fr))", gap: "18px 20px" }}>
            <div>
              <label style={labelStyle}>Applicant full name <span style={{ color: "#b45131" }}>*</span></label>
              <input style={fieldStyle} value={form.applicantName} onChange={(e) => update("applicantName", e.target.value)} placeholder="Enter applicant's full name" autoComplete="name" required />
            </div>
            <div>
              <label style={labelStyle}>Assistance type <span style={{ color: "#b45131" }}>*</span></label>
              <select style={fieldStyle} value={form.assistanceType} onChange={(e) => update("assistanceType", e.target.value)} required>
                <option>Widow pension</option>
                <option>One-time financial assistance</option>
                <option>Other pension / welfare support</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Scheme source <span style={{ color: "#b45131" }}>*</span></label>
              <select style={fieldStyle} value={form.scope} onChange={(e) => update("scope", e.target.value)}><option value="GOVERNMENT">Central / State Government</option><option value="COMMUNITY">Potter Community</option></select>
            </div>
            <div>
              <label style={labelStyle}>State / Union Territory <span style={{ color: "#b45131" }}>*</span></label>
              <input style={fieldStyle} value={form.state} onChange={(e) => update("state", e.target.value)} placeholder="Enter state or Union Territory" autoComplete="address-level1" required />
            </div>
            <div>
              <label style={labelStyle}>District <span style={{ color: "#b45131" }}>*</span></label>
              <input style={fieldStyle} value={form.district} onChange={(e) => update("district", e.target.value)} placeholder="Enter district" autoComplete="address-level2" required />
            </div>
            <div>
              <label style={labelStyle}>Approximate annual family income (₹) <span style={{ color: "#b45131" }}>*</span></label>
              <input style={fieldStyle} type="number" min="0" step="1" inputMode="numeric" value={form.annualIncome} onChange={(e) => update("annualIncome", e.target.value)} placeholder="e.g. 120000" required />
              <span style={{ display: "block", marginTop: 6, fontSize: 11, color: "#927a6d" }}>Enter an estimate in Indian rupees.</span>
            </div>
            <div>
              <label style={labelStyle}>Existing official reference number</label>
              <input style={fieldStyle} value={form.referenceNumber} onChange={(e) => update("referenceNumber", e.target.value)} placeholder="Optional — if already available" />
              <span style={{ display: "block", marginTop: 6, fontSize: 11, color: "#927a6d" }}>Leave blank if you have not applied before.</span>
            </div>
          </div>
          <div style={{ marginTop: 19 }}>
            <label style={labelStyle}>Additional notes <span style={{ color: "#927a6d", fontWeight: 400 }}>(optional)</span></label>
            <textarea style={{ ...fieldStyle, minHeight: 112, resize: "vertical", lineHeight: 1.6 }} rows={4} value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Add relevant details that may help you prepare your application. Do not enter full Aadhaar, bank account, or other sensitive identity numbers here." />
          </div>
          <div style={{ marginTop: 16 }}><label style={labelStyle}>Supporting documents (optional)</label><input name="files" type="file" accept=".pdf,.jpg,.jpeg,.png" multiple style={{ ...fieldStyle, padding: 9 }} /><span style={{ display: "block", marginTop: 5, color: "#927a6d", fontSize: 11 }}>Private files, PDF/JPG/PNG, up to 5 MB each. Upload only documents needed for community review.</span></div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 19, padding: "13px 14px", borderRadius: 11, background: "#f8eee5", border: "1px solid #f0dfd1" }}>
            <ShieldCheck size={18} style={{ color: "#985235", flex: "0 0 auto", marginTop: 1 }} />
            <p style={{ margin: 0, color: "#785a49", fontSize: 11, lineHeight: 1.7 }}>Typical documents may include a death certificate, applicant identity and residence proof, bank details, income certificate, and scheme-specific forms. Requirements vary. Submit sensitive documents only through the official channel when requested.</p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 20 }}>
            <span style={{ color: "#8b7466", fontSize: 11 }}><span style={{ color: "#b45131" }}>*</span> Required fields</span>
            <button type="submit" className="btn btn-primary" disabled={busy} style={{ minHeight: 44, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9, padding: "0 19px" }}>{busy ? "Submitting…" : applications.some((item) => item.status === "DOCUMENTS_REQUIRED") ? "Resubmit requested documents" : "Submit request for review"} <ArrowRight size={17} /></button>
          </div>
        </form>
      </div>

      {isAdmin && <section style={{ ...panelStyle, marginBottom: 24 }}><h2 style={{ margin: "0 0 12px", color: "#452b20", fontSize: 19 }}>Assistance review queue</h2>{loading ? <p>Loading requests…</p> : applications.length ? <div style={{ display: "grid", gap: 12 }}>{applications.map((item) => <article key={item.id} style={{ border: "1px solid #ead9ce", borderRadius: 12, padding: 15 }}><div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}><strong>{item.applicantName} · {item.assistanceType}</strong><span style={{ color: "#80695c", fontSize: 11 }}>{item.scope} · {item.status} · {item.referenceNumber}</span></div><p style={{ color: "#80695c", fontSize: 12 }}>{item.district}, {item.state} · Annual income ₹{Number(item.annualIncome || 0).toLocaleString("en-IN")} · {item.memberName}</p>{item.documents?.map((doc) => <button key={doc.id} type="button" className="btn btn-outline" onClick={() => openAssistanceFile(doc.downloadUrl)}>View {doc.documentType}</button>)}{item.decisionReason && <p style={{ color: "#80695c", fontSize: 12 }}>Review note: {item.decisionReason}</p>}<div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>{["APPROVED", "REJECTED", "DOCUMENTS_REQUIRED"].map((status) => <button key={status} type="button" className={status === "APPROVED" ? "btn btn-primary" : "btn btn-outline"} disabled={busy || ["APPROVED", "REJECTED"].includes(item.status)} onClick={() => updateDecision(item.id, status)}>{status.replaceAll("_", " ")}</button>)}{item.scope === "GOVERNMENT" && <><button type="button" className="btn btn-outline" onClick={() => updateOfficialStatus(item.id, "SUBMITTED")}>Confirm official application submitted</button><button type="button" className="btn btn-outline" onClick={() => updateOfficialStatus(item.id, "APPROVED")}>Confirm official approval</button><button type="button" className="btn btn-outline" onClick={() => updateOfficialStatus(item.id, "REJECTED")}>Confirm official rejection</button></>}{(item.scope === "COMMUNITY" && item.status === "APPROVED" || item.scope === "GOVERNMENT" && ["APPROVED", "DISBURSED"].includes(item.officialStatus)) && <button type="button" className="btn btn-outline" onClick={() => setBenefitFor(item)}>Record benefit received</button>}</div>{item.benefitHistory?.map((benefit) => <div key={benefit.id} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", paddingTop: 9, fontSize: 11 }}>{benefit.benefitType} · ₹{benefit.amount ?? "Amount not listed"} · {benefit.verificationStatus}{benefit.proofUrl && <button type="button" className="btn btn-outline" onClick={() => openAssistanceFile(benefit.proofUrl)}>View proof</button>}{benefit.verificationStatus === "PENDING" && <><button type="button" className="btn btn-outline" onClick={() => verifyBenefit(benefit.id, "VERIFIED")}>Verify receipt</button><button type="button" className="btn btn-outline" onClick={() => verifyBenefit(benefit.id, "REJECTED")}>Reject receipt</button></>}</div>)}</article>)}</div> : <EmptyState title="No assistance requests yet" description="Submitted requests will appear here for authorized review." />}</section>}

      {benefitFor && <div className="modal-overlay"><section className="auth-modal" role="dialog" aria-modal="true" style={{ maxHeight: "90dvh", overflowY: "auto" }}><button type="button" className="modal-close" onClick={() => setBenefitFor(null)}>×</button><h2>Record benefit received</h2><p className="auth-description">{benefitFor.memberName} · {benefitFor.assistanceType}</p><form onSubmit={submitBenefit} style={{ display: "grid", gap: 10 }}><input name="benefit_type" placeholder="Benefit type" required/><input name="amount" type="number" min="0" step="0.01" placeholder="Amount, if applicable"/><input name="received_at" type="date"/><input name="reference_number" placeholder="Reference number"/><label style={{ color: "#806b5e", fontSize: 11 }}>Proof document (optional)<input name="proof" type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: "block", marginTop: 7 }}/></label><button type="submit" className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : "Record for verification"}</button></form></section></div>}

      <div style={{ ...panelStyle, padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "20px 22px", borderBottom: "1px solid #f0e2d8", background: "#fffaf6", display: "flex", alignItems: "center", gap: 13 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: "#f8e7da", color: "#a9512f", display: "grid", placeItems: "center", flex: "0 0 42px" }}><Clock size={21} /></div>
          <div>
            <span style={{ display: "block", color: "#a45a38", fontSize: 10, fontWeight: 800, letterSpacing: ".09em", marginBottom: 4 }}>APPLICATION TRACKING</span>
            <h2 style={{ margin: 0, color: "#452b20", fontSize: 19 }}>Status & benefit history</h2>
            <p style={{ margin: "5px 0 0", color: "#8a7062", fontSize: 12 }}>Keep your reference and official updates together.</p>
          </div>
        </div>
        <div style={{ padding: 22 }}>
          {application ? (
            <>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, padding: 15, marginBottom: 18, borderRadius: 12, border: "1px solid #ead8c9", background: "#fffaf6" }}>
                <div>
                  <span style={{ display: "block", fontSize: 10, fontWeight: 800, letterSpacing: ".08em", color: "#9d6042", marginBottom: 5 }}>COMMUNITY TRACKING REFERENCE</span>
                  <strong style={{ color: "#472d21", fontSize: 18, letterSpacing: ".02em" }}>{application.referenceNumber}</strong>
                </div>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 30, padding: "7px 10px", background: "#f8ebd8", color: "#8c5b22", fontSize: 11, fontWeight: 700 }}><Clock size={14} /> {application.status?.replaceAll("_", " ") || "SUBMITTED"}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: 12 }}>
                {[
                  ["Applicant", application.applicantName],
                  ["Assistance type", application.assistanceType],
                  ["Scheme source", application.scope === "COMMUNITY" ? "Potter Community" : "Central / State Government"],
                  ["Location", `${application.district}, ${application.state}`],
                  ["Approximate annual income", `₹${Number(application.annualIncome || 0).toLocaleString("en-IN")}`],
                  ["Recorded on", application.submittedAt],
                  ["Community review note", application.decisionReason],
                  ["Official scheme status", application.officialStatus?.replaceAll("_", " ")],
                  ["Official reference", application.officialReference || "Not provided"],
                ].map(([label, value]) => (
                  <div key={label} style={{ padding: 13, border: "1px solid #efe2d8", borderRadius: 10, background: "#fff" }}>
                    <span style={{ display: "block", marginBottom: 6, color: "#8b7264", fontSize: 11 }}>{label}</span>
                    <strong style={{ display: "block", color: "#4d3327", fontSize: 12, lineHeight: 1.6, overflowWrap: "anywhere" }}>{value || "Not provided"}</strong>
                  </div>
                ))}
              </div>
              {application.benefitHistory?.length > 0 && <div style={{ marginTop: 16 }}><h3 style={{ color: "#452b20", fontSize: 15 }}>Benefit / disbursement history</h3>{application.benefitHistory.map((benefit) => <div key={benefit.id} style={{ padding: 12, marginTop: 8, border: "1px solid #efe2d8", borderRadius: 10, color: "#624b3d", fontSize: 12 }}>{benefit.benefitType} · {benefit.amount == null ? "Amount not listed" : `₹${benefit.amount}`} · {benefit.receivedAt || "Date not listed"} · {benefit.verificationStatus}</div>)}</div>}
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "26px 18px 30px" }}>
              <div style={{ width: 54, height: 54, margin: "0 auto 13px", borderRadius: 16, display: "grid", placeItems: "center", background: "#f8e7da", color: "#a9512f" }}><FileText size={24} /></div>
              <h3 style={{ margin: "0 0 7px", color: "#4a3025", fontSize: 16 }}>No request details saved yet</h3>

            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}

/* =========================================================
   DOCUMENTS
========================================================= */

function DocumentsPage() {
  const [uploadedDocuments, setUploadedDocuments] = useState({});
  const [documentErrors, setDocumentErrors] = useState({});
  const [draggingDocument, setDraggingDocument] = useState(null);
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const [submissionError, setSubmissionError] = useState("");
  const [submissionBusy, setSubmissionBusy] = useState(false);

  const documents = [
    {
      id: "government-id",
      title: "Government Identity Document",
      description: "Upload an identity document requested for membership verification.",
      examples: "Aadhaar, voter ID, or driving licence, where applicable.",
      requirement: "Required",
      required: true,
      note: "Required for identity verification. Share only the information needed for verification.",
    },
    {
      id: "community-certificate",
      title: "Caste / Community Certificate",
      description: "Provide a caste or community certificate where applicable.",
      examples: "Community proof for membership verification.",
      requirement: "Required",
      required: true,
      note: "Required for community membership verification.",
    },
    {
      id: "family-proof",
      title: "Proof of Family Relationship",
      description: "Upload supporting proof if it is needed for family registration.",
      examples: "A relevant family record or certificate.",
      requirement: "Required",
      required: true,
      note: "Required to establish the family relationship for membership verification.",
    },
    {
      id: "school-record",
      title: "School Record / Transfer Certificate",
      description: "Provide this only if required by the community verification policy.",
      examples: "School record or transfer certificate, where applicable.",
      requirement: "If committee requested",
      required: false,
      note: "Upload this document only if requested by the verification committee.",
    },
    {
      id: "additional-documents",
      title: "Additional Supporting Documents",
      description: "Upload any other document specifically requested by the authorized verification committee.",
      examples: "Only submit documents requested for your case.",
      requirement: "If committee requested",
      required: false,
      note: "Upload only when the verification committee requests additional supporting documents.",
    },
  ];

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleDocumentUpload = (id, file) => {
    setDocumentErrors((current) => ({ ...current, [id]: "" }));
    if (!file) return;

    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    const allowedExtensions = /\.(pdf|jpe?g|png)$/i;
    if (!allowedTypes.includes(file.type) && !allowedExtensions.test(file.name)) {
      setDocumentErrors((current) => ({ ...current, [id]: "Unsupported file type. Choose a PDF, JPG, or PNG file." }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setDocumentErrors((current) => ({ ...current, [id]: "This file exceeds 5 MB. Choose a smaller file." }));
      return;
    }
    setUploadedDocuments((current) => ({
      ...current,
      [id]: { file, selectedAt: new Date().toLocaleString() },
    }));
    setSubmissionStatus(null);
    setSubmissionError("");
  };

  const removeDocument = (id) => {
    setUploadedDocuments((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
    setDocumentErrors((current) => ({ ...current, [id]: "" }));
    const input = document.getElementById(`member-document-${id}`);
    if (input) input.value = "";
  };

  const selectedCount = Object.keys(uploadedDocuments).length;
  const remainingCount = documents.length - selectedCount;

  const submitDocuments = async (event) => {
    event.preventDefault();
    const requiredDocuments = documents.filter((item) => item.required);
    const missingRequired = requiredDocuments.filter((item) => !uploadedDocuments[item.id]);
    if (missingRequired.length > 0) {
      setSubmissionError(`Please upload all 3 required documents before submitting: ${missingRequired.map((item) => item.title).join(", ")}.`);
      setSubmissionStatus(null);
      return;
    }
    setSubmissionError("");
    setSubmissionBusy(true);
    try {
      const submittedAt = new Date().toLocaleString();
      for (const item of documents) {
        const selected = uploadedDocuments[item.id];
        if (!selected?.file) continue;
        const formData = new FormData();
        formData.append("document_type", item.title);
        formData.append("file", selected.file, selected.file.name);
        await authApi("/verification/upload", { method: "POST", body: formData });
      }
      setSubmissionStatus({ submittedAt, count: selectedCount });
    } catch (error) {
      setSubmissionError(error.message || "Could not submit documents. Please try again.");
    } finally {
      setSubmissionBusy(false);
    }
  };

  return (
    <PageWrapper>
      <div className="documents-verification-page">
      <style>{`
        .documents-verification-page { --dv-ink:#38251d; --dv-muted:#79665b; --dv-line:#eadbd2; --dv-accent:#a95736; color:var(--dv-ink); }
        .documents-verification-page .document-grid { grid-template-columns:repeat(3,minmax(0,1fr)) !important; gap:18px !important; }
        .documents-verification-page .document-card { position:relative; padding:20px !important; gap:16px !important; border-radius:16px !important; border-color:var(--dv-line) !important; background:linear-gradient(180deg,#fff 0%,#fffaf7 100%) !important; box-shadow:0 3px 12px rgba(66,42,30,.045) !important; }
        .documents-verification-page .document-card:hover { border-color:#d7ad98 !important; box-shadow:0 9px 24px rgba(66,42,30,.085) !important; transform:translateY(-2px); }
        .documents-verification-page .document-card > div:first-child { align-items:flex-start; }
        .documents-verification-page .document-icon { width:46px !important; height:46px !important; border-radius:13px !important; background:#f8e9df !important; color:var(--dv-accent) !important; }
        .documents-verification-page .document-card h3 { color:#39251d; font-size:14px !important; font-weight:750; letter-spacing:-.01em; }
        .documents-verification-page .document-card p { color:#6f5c51 !important; }
        .documents-verification-page .document-card label[for^="member-document-"] { min-height:94px !important; border:1px dashed #c88a6e !important; border-radius:12px !important; background:#fffaf7 !important; transition:all .18s ease; }
        .documents-verification-page .document-card label[for^="member-document-"]:hover { border-color:#a95736 !important; background:#fff3eb !important; }
        .documents-verification-page .document-card label[for^="member-document-"]:focus-within { outline:3px solid rgba(169,87,54,.16); }
        .documents-verification-page .dv-summary-card { border-radius:15px !important; padding:18px 20px !important; background:#fff !important; box-shadow:0 2px 9px rgba(66,42,30,.035); }
        .documents-verification-page .dv-privacy { border-radius:13px !important; padding:16px 18px !important; }
        .documents-verification-page .dv-requirement { border:1px solid #f0dfd2; border-left:3px solid #c27a53; border-radius:12px !important; padding:14px 16px !important; }
        .documents-verification-page .dv-submit { border-radius:16px !important; padding:20px 22px !important; background:linear-gradient(135deg,#fff 0%,#fff8f3 100%) !important; box-shadow:0 3px 12px rgba(66,42,30,.04); }
        @media (max-width:1050px) { .documents-verification-page .document-grid { grid-template-columns:repeat(2,minmax(0,1fr)) !important; } }
        @media (max-width:640px) { .documents-verification-page .document-grid { grid-template-columns:1fr !important; } .documents-verification-page .document-card { padding:16px !important; } }
        @media (prefers-reduced-motion:reduce) { .documents-verification-page .document-card, .documents-verification-page .document-card label[for^="member-document-"] { transition:none !important; } }
      `}</style>
      <PageHeader
        title="Documents & Verification"
        description="Step 2: Identity and community proof. Manage the supporting documents that apply to your membership verification."
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 175px), 1fr))", gap: 12, marginBottom: 18 }}>
        {[
          { label: "Selected on this device", value: selectedCount, icon: FileText, color: "#9b4e31", bg: "#fbefe7" },
          { label: "Awaiting review", value: "—", icon: Clock, color: "#87621b", bg: "#fbf5e6" },
          { label: "Verified", value: "—", icon: ShieldCheck, color: "#39734a", bg: "#edf7ef" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div className="dv-summary-card" key={item.label} style={{ display: "flex", alignItems: "center", gap: 14, padding: "17px 18px", border: "1px solid #ead8cc", borderRadius: 12, background: "#fffdfb", minWidth: 0 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, display: "grid", placeItems: "center", flexShrink: 0, background: item.bg, color: item.color }}><Icon size={21} /></div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 23, lineHeight: 1.15, fontWeight: 750, color: "#503326" }}>{item.value}</div>
                <div style={{ fontSize: 12, lineHeight: 1.4, color: "#806b5e" }}>{item.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="dv-privacy" style={{ display: "flex", alignItems: "flex-start", gap: 11, padding: "13px 15px", marginBottom: 12, border: "1px solid #d7e2ec", borderRadius: 11, background: "#f2f6f9", color: "#34495e" }}>
        <ShieldCheck size={21} style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          <strong style={{ display: "block", marginBottom: 4 }}>Your documents are private</strong>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55 }}>Sensitive identity documents must have restricted access and secure storage. Full identity numbers and document images must never appear on public profiles.</p>
        </div>
      </div>

      <div className="dv-requirement" style={{ display: "flex", alignItems: "flex-start", gap: 9, padding: "11px 14px", marginBottom: 20, borderRadius: 10, background: "#fbf0e8", color: "#704b39", lineHeight: 1.5, fontSize: 13 }}>
        <CheckCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>The first three documents are compulsory for membership verification. Upload the School Record / Transfer Certificate and Additional Supporting Documents only if requested by the verification committee.</span>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        <div>
          <h3 style={{ margin: "0 0 4px", color: "#503326", fontSize: 18 }}>Community verification documents</h3>
          <p style={{ margin: 0, color: "#806b5e", fontSize: 12 }}>{selectedCount} of {documents.length} document types selected on this device · {remainingCount} not selected</p>
        </div>
        <span style={{ fontSize: 12, color: "#806b5e" }}>PDF, JPG or PNG · Maximum 5 MB per file</span>
      </div>

      <div className="document-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 290px), 1fr))", gap: 14, alignItems: "stretch" }}>
        {documents.map((item) => {
          const selected = uploadedDocuments[item.id];
          const file = selected?.file;
          const isDragging = draggingDocument === item.id;
          return (
            <div className="document-card" key={item.id} style={{ display: "flex", flexDirection: "column", alignItems: "stretch", gap: 12, padding: 16, border: isDragging ? "1px solid #b65d3b" : "1px solid #ead8cc", borderRadius: 13, background: isDragging ? "#fff7f1" : "#fffdfb", minWidth: 0, boxShadow: "0 2px 8px rgba(80, 51, 38, 0.035)", transition: "border-color 150ms ease, background 150ms ease" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 11 }}>
                <div className="document-icon" style={{ flexShrink: 0, width: 42, height: 42, display: "grid", placeItems: "center", borderRadius: 10 }}><FileText size={21} /></div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                    <h3 style={{ margin: 0, fontSize: 14, lineHeight: 1.4, overflowWrap: "anywhere" }}>{item.title}</h3>
                    <span style={{ fontSize: 10, lineHeight: 1.5, fontWeight: 700, whiteSpace: "nowrap", padding: "3px 7px", borderRadius: 999, color: item.required ? "#a13b32" : "#6c5593", background: item.required ? "#fbe9e5" : "#f2edf8" }}>{item.requirement}</span>
                  </div>
                  <p style={{ margin: "0 0 5px", fontSize: 12, lineHeight: 1.5, color: "#6f594c" }}>{item.description}</p>
                  <p style={{ margin: 0, fontSize: 11, lineHeight: 1.45, color: "#8a776b" }}>{item.examples}</p>
                </div>
              </div>

              {file ? (
                <div style={{ padding: 11, border: "1px solid #d7e5d8", borderRadius: 10, background: "#f6faf6", minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 9, minWidth: 0 }}>
                    <div style={{ width: 35, height: 35, borderRadius: 8, display: "grid", placeItems: "center", background: "#e5f1e7", color: "#39734a", flexShrink: 0 }}><FileText size={18} /></div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 650, color: "#355b3d", overflowWrap: "anywhere", lineHeight: 1.45 }}>{file.name}</div>
                      <div style={{ marginTop: 3, fontSize: 11, color: "#627966" }}>{formatFileSize(file.size)} · Selected {selected.selectedAt}</div>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 7, padding: "3px 7px", borderRadius: 999, background: submissionStatus ? "#fbf2df" : "#e9f2ea", color: submissionStatus ? "#87621b" : "#39734a", fontSize: 10, fontWeight: 700 }}><CheckCircle size={12} /> {submissionStatus ? "Submitted for administrator review" : "Selected locally · not submitted"}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", flexWrap: "wrap", gap: 10, marginTop: 10, paddingTop: 9, borderTop: "1px solid #dfe9e0" }}>
                    <button type="button" onClick={() => { const url = URL.createObjectURL(file); const preview = window.open(url, "_blank", "noopener,noreferrer"); if (!preview) URL.revokeObjectURL(url); }} style={{ display: "inline-flex", alignItems: "center", gap: 5, border: 0, background: "transparent", cursor: "pointer", color: "#6f594c", fontSize: 12, fontWeight: 650 }}><Eye size={14} /> Preview</button>
                    <label htmlFor={`member-document-${item.id}`} style={{ display: "inline-flex", alignItems: "center", gap: 5, cursor: "pointer", color: "#9b4e31", fontSize: 12, fontWeight: 650 }}><Plus size={14} /> Replace</label>
                    <button type="button" onClick={() => removeDocument(item.id)} style={{ display: "inline-flex", alignItems: "center", gap: 4, border: 0, background: "transparent", cursor: "pointer", color: "#a13b32", fontSize: 12, fontWeight: 650 }}><X size={14} /> Remove</button>
                  </div>
                </div>
              ) : (
                <label
                  htmlFor={`member-document-${item.id}`}
                  onDragOver={(event) => { event.preventDefault(); setDraggingDocument(item.id); }}
                  onDragLeave={() => setDraggingDocument((current) => current === item.id ? null : current)}
                  onDrop={(event) => { event.preventDefault(); setDraggingDocument(null); handleDocumentUpload(item.id, event.dataTransfer.files?.[0]); }}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5, minHeight: 82, padding: "12px 10px", border: isDragging ? "1px dashed #9b4e31" : "1px dashed #bd7658", borderRadius: 10, color: "#9b4e31", background: isDragging ? "#fff0e5" : "#fffdfb", cursor: "pointer", textAlign: "center" }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontWeight: 700, fontSize: 12 }}><Plus size={17} /> Choose a document</span>
                  <span style={{ fontSize: 10, color: "#8a776b" }}>or drag and drop it here</span>
                </label>
              )}
              <input
                id={`member-document-${item.id}`}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                onChange={(event) => handleDocumentUpload(item.id, event.target.files?.[0])}
                onClick={(event) => { event.currentTarget.value = ""; }}
                style={{ display: "none" }}
              />
              {documentErrors[item.id] && <p role="alert" style={{ margin: 0, color: "#b42318", fontSize: 12, lineHeight: 1.45 }}>{documentErrors[item.id]}</p>}
            </div>
          );
        })}
      </div>

      <form className="dv-submit" onSubmit={submitDocuments} style={{ marginTop: 20, padding: 16, border: "1px solid #ead8cc", borderRadius: 12, background: "#fffdfb" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h3 style={{ margin: "0 0 5px", fontSize: 16, color: "#503326" }}>Ready to submit your documents?</h3>
          </div>
          <button type="submit" disabled={submissionBusy || documents.some((item) => item.required && !uploadedDocuments[item.id])} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 18px", border: 0, borderRadius: 9, background: documents.some((item) => item.required && !uploadedDocuments[item.id]) ? "#d8c6bb" : "#a95736", color: "#fff", fontWeight: 700, fontSize: 13, cursor: documents.some((item) => item.required && !uploadedDocuments[item.id]) || submissionBusy ? "not-allowed" : "pointer", flexShrink: 0 }}>
            {submissionBusy ? "Submitting…" : submissionStatus ? "Submit updated documents" : "Submit documents for verification"} <ArrowRight size={16} />
          </button>
        </div>
        {submissionError && <p role="alert" style={{ margin: "10px 0 0", color: "#b42318", fontSize: 12 }}>{submissionError}</p>}
        {submissionStatus && <div role="status" style={{ display: "flex", alignItems: "flex-start", gap: 9, marginTop: 12, padding: 12, borderRadius: 9, border: "1px solid #ead8b2", background: "#fff8e9", color: "#75551d" }}><Clock size={18} style={{ flexShrink: 0, marginTop: 1 }} /><div style={{ fontSize: 12, lineHeight: 1.5 }}><strong>Submission recorded</strong><br />{submissionStatus.count} document type(s) marked as submitted at {submissionStatus.submittedAt}.</div></div>}
      </form>
      </div>
    </PageWrapper>
  );
}

/* =========================================================
   EMERGENCY
========================================================= */

function EmergencyPage({ activeUser }) {
  const isAdmin = ["ADMIN", "SUPER ADMIN"].includes(String(activeUser?.role || "").toUpperCase());
  const canManage = isAdmin || activeUser?.permissions?.includes("emergency.manage");
  const isApproved = String(activeUser?.membership_status || "").toUpperCase() === "APPROVED";

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [requestType, setRequestType] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState(activeUser?.phone_number || "");
  const [reviewNotes, setReviewNotes] = useState({});

  const loadRequests = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await authApi("/emergency/requests");
      setRequests(Array.isArray(result) ? result : []);
    } catch (loadError) {
      setError(loadError.message || "Sign in with an approved member account to use Emergency Support.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const submitRequest = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");

    try {
      const created = await authApi("/emergency/requests", {
        method: "POST",
        body: JSON.stringify({
          emergency_type: requestType,
          description,
          location,
          contact_phone: phone,
        }),
      });

      setNotice("Your request was sent to the community emergency support team. Call local emergency services for immediate danger.");
      setRequests((previous) => [created, ...previous]);
      setRequestType("");
      setDescription("");
      setLocation("");
    } catch (submitError) {
      setError(submitError.message || "Could not submit the emergency request.");
    } finally {
      setBusy(false);
    }
  };

  const updateRequest = async (item, nextStatus) => {
    setBusyId(item.id);
    setError("");
    setNotice("");

    try {
      const updated = await authApi(`/emergency/requests/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: nextStatus,
          review_note: reviewNotes[item.id] || null,
        }),
      });

      setRequests((previous) =>
        previous.map((request) =>
          request.id === item.id ? updated : request
        )
      );

      setNotice(`Emergency request #${item.id} marked ${nextStatus.toLowerCase()}.`);
    } catch (updateError) {
      setError(updateError.message || "Could not update this request.");
    } finally {
      setBusyId(null);
    }
  };

  const statusColor = (status) =>
    status === "RESOLVED"
      ? "#397448"
      : status === "REJECTED"
      ? "#a1261c"
      : "#a65332";

  return (
    <PageWrapper>
      <style>{`
        .emergency-page {
          --em-ink: #40291f;
          --em-muted: #806b60;
          --em-line: #eadbd1;
          --em-primary: #a9573a;
          width: 100%;
          color: var(--em-ink);
        }

        .emergency-page .emergency-warning {
          display: flex;
          align-items: flex-start;
          gap: 15px;
          padding: 18px 21px;
          margin: 0 0 24px;
          border: 1px solid #efd5ad;
          border-radius: 17px;
          background:
            radial-gradient(circle at 100% 0%, rgba(245,190,112,.17), transparent 38%),
            linear-gradient(115deg,#fff7e9,#fffdfa);
          color: #805016;
          box-shadow: 0 7px 22px rgba(115,77,34,.045);
        }

        .emergency-page .emergency-warning > svg {
          flex: 0 0 auto;
          margin-top: 1px;
        }

        .emergency-page .emergency-warning strong {
          display: block;
          font-size: 13px;
          line-height: 1.5;
        }

        .emergency-page .emergency-warning p {
          margin: 5px 0 0;
          color: #987344;
          font-size: 12px;
          line-height: 1.6;
        }

        .emergency-page .emergency-grid {
          display: grid !important;
          grid-template-columns: minmax(0,1.48fr) minmax(290px,.92fr) !important;
          align-items: stretch;
          gap: 21px;
        }

        .emergency-page .emergency-main-card,
        .emergency-page .assistance-card {
          box-sizing: border-box;
          min-width: 0;
          width: 100%;
          padding: 29px;
          border: 1px solid var(--em-line);
          border-radius: 21px;
          background: linear-gradient(145deg,#fff,#fffdfa);
          box-shadow:
            0 14px 35px rgba(76,48,34,.055),
            0 2px 7px rgba(76,48,34,.025);
        }

        .emergency-page .emergency-main-card {
          display: flex;
          flex-direction: column;
          align-items: stretch;
        }

        .emergency-page .emergency-icon {
          display: grid;
          place-items: center;
          width: 57px;
          height: 57px;
          margin: 0 0 19px;
          border: 1px solid #f4d9cf;
          border-radius: 18px;
          background: linear-gradient(145deg,#fff0eb,#fff7f3);
          color: #bd5143;
          box-shadow: 0 7px 16px rgba(189,81,67,.08);
        }

        .emergency-page .emergency-main-card h2 {
          margin: 0 0 8px;
          color: var(--em-ink);
          font-size: clamp(20px,2vw,23px);
          line-height: 1.3;
          font-weight: 800;
          letter-spacing: -.035em;
        }

        .emergency-page .emergency-main-card > p {
          margin: 0 0 20px;
          color: var(--em-muted);
          font-size: 13px;
          line-height: 1.7;
        }

        .emergency-page .emergency-main-card > p[role=note] {
          padding: 11px 13px;
          border: 1px solid #f0dfc4;
          border-radius: 11px;
          background: #fff9ed;
          color: #805016;
        }

        .emergency-page .emergency-main-card > label {
          display: block;
          margin: 13px 0 7px;
          color: #594033;
          font-size: 12px;
          line-height: 1.45;
          font-weight: 750;
          letter-spacing: .015em;
        }

        .emergency-page .emergency-main-card > input,
        .emergency-page .emergency-main-card > select,
        .emergency-page .emergency-main-card > textarea {
          display: block !important;
          box-sizing: border-box !important;
          width: 100% !important;
          max-width: 100%;
          min-width: 0;
          margin: 0 !important;
          padding: 13px 15px;
          border: 1px solid #e7d8ce;
          border-radius: 12px;
          background: #fff;
          color: #40291f;
          font-family: inherit;
          font-size: 13px;
          line-height: 1.5;
          outline: none;
          box-shadow: inset 0 1px 2px rgba(64,41,31,.025);
          transition: border-color .2s ease, box-shadow .2s ease;
        }

        .emergency-page .emergency-main-card > input,
        .emergency-page .emergency-main-card > select {
          min-height: 49px;
        }

        .emergency-page .emergency-main-card > textarea {
          min-height: 136px;
          resize: vertical;
          line-height: 1.65;
        }

        .emergency-page .emergency-main-card > input::placeholder,
        .emergency-page .emergency-main-card > textarea::placeholder {
          color: #a99a90;
          opacity: 1;
        }

        .emergency-page .emergency-main-card > input:focus,
        .emergency-page .emergency-main-card > select:focus,
        .emergency-page .emergency-main-card > textarea:focus {
          border-color: #b66a4b;
          background: #fffefd;
          box-shadow: 0 0 0 4px rgba(169,87,58,.105);
        }

        .emergency-page .emergency-main-card > input:disabled,
        .emergency-page .emergency-main-card > select:disabled,
        .emergency-page .emergency-main-card > textarea:disabled {
          background: #f7f2ee;
          cursor: not-allowed;
        }

        .emergency-page .emergency-main-card > .emergency-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          min-height: 51px;
          margin: 22px 0 0;
          padding: 13px 19px;
          border: 1px solid rgba(117,53,36,.12);
          border-radius: 13px;
          background: linear-gradient(110deg,#a9573a,#bd5143);
          color: #fff;
          font-family: inherit;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 8px 17px rgba(169,87,58,.19);
          transition: transform .2s ease, box-shadow .2s ease;
        }

        .emergency-page .emergency-main-card > .emergency-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 23px rgba(169,87,58,.25);
        }

        .emergency-page .emergency-main-card > .emergency-button:disabled {
          opacity: .58;
          cursor: not-allowed;
          box-shadow: none;
        }

        .emergency-page .assistance-card {
          overflow: hidden;
          background:
            radial-gradient(circle at 100% 0%,rgba(242,222,208,.3),transparent 38%),
            linear-gradient(145deg,#fffdfa,#fff);
        }

        .emergency-page .assistance-card h3 {
          margin: 2px 0 18px;
          color: var(--em-ink);
          font-size: 16px;
          font-weight: 800;
        }

        .emergency-page .assistance-item {
          display: flex;
          align-items: flex-start;
          gap: 13px;
          padding: 17px 0;
          border-bottom: 1px solid #f0e6df;
        }

        .emergency-page .assistance-item:last-child {
          border-bottom: 0;
          padding-bottom: 2px;
        }

        .emergency-page .assistance-icon {
          display: grid;
          place-items: center;
          flex: 0 0 43px;
          width: 43px;
          height: 43px;
          border: 1px solid #f4e2d9;
          border-radius: 14px;
          background: linear-gradient(145deg,#fff0eb,#fff8f4);
          color: #b84f42;
        }

        .emergency-page .assistance-item strong {
          display: block;
          margin: 2px 0 5px;
          color: #51382b;
          font-size: 12px;
          font-weight: 800;
        }

        .emergency-page .assistance-item span {
          display: block;
          color: #89766b;
          font-size: 11px;
          line-height: 1.65;
        }

        .emergency-page .emergency-page-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          margin: 24px 0 13px;
        }

        .emergency-page .emergency-page-heading h2 {
          margin: 0;
          color: var(--em-ink);
          font-size: 22px;
          font-weight: 800;
        }

        .emergency-page .emergency-refresh {
          border: 1px solid #e7d5c9 !important;
          border-radius: 11px !important;
          background: #fff !important;
          color: #75432f !important;
          padding: 10px 15px !important;
          font-weight: 700 !important;
        }

        .emergency-page .emergency-request-list {
          display: grid;
          gap: 13px;
        }

        .emergency-page .emergency-request-card {
          padding: 19px 20px;
          border: 1px solid var(--em-line);
          border-radius: 17px;
          background: linear-gradient(145deg,#fff,#fffdfa);
          box-shadow: 0 7px 22px rgba(76,48,34,.045);
        }

        .emergency-page .emergency-request-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          flex-wrap: wrap;
        }

        .emergency-page .emergency-request-top > strong:first-child {
          color: #51382b;
          font-size: 14px;
          font-weight: 800;
        }

        .emergency-page .emergency-status {
          display: inline-flex;
          align-items: center;
          padding: 6px 10px;
          border-radius: 30px;
          background: #f8eee8;
          font-size: 11px;
          font-weight: 800;
        }

        .emergency-page .emergency-request-description {
          margin: 12px 0;
          color: #5f4a3e;
          font-size: 13px;
          line-height: 1.7;
          white-space: pre-wrap;
        }

        .emergency-page .emergency-request-meta {
          color: var(--em-muted);
          font-size: 12px;
          line-height: 1.8;
        }

        .emergency-page .emergency-request-meta a {
          color: #87442f;
          font-weight: 700;
        }

        .emergency-page .emergency-review-note {
          margin: 11px 0 0;
          padding: 11px 13px;
          border-left: 3px solid #b86d4d;
          border-radius: 0 9px 9px 0;
          background: #fff6f0;
          color: #624b3d;
          font-size: 12px;
          line-height: 1.6;
        }

        .emergency-page .emergency-review-controls {
          display: flex;
          gap: 9px;
          flex-wrap: wrap;
          margin-top: 14px;
        }

        .emergency-page .emergency-review-controls input {
          flex: 1 1 240px;
          min-width: 0;
          padding: 11px 12px;
          border: 1px solid #e7d8ce;
          border-radius: 10px;
          outline: none;
        }

        .emergency-page .emergency-alert {
          margin-bottom: 14px;
          padding: 13px 15px;
          border-radius: 12px;
          font-size: 13px;
          line-height: 1.6;
        }

        @media(max-width:900px) {
          .emergency-page .emergency-grid {
            grid-template-columns: minmax(0,1fr) !important;
          }
        }

        @media(max-width:600px) {
          .emergency-page .emergency-main-card,
          .emergency-page .assistance-card {
            padding: 20px;
            border-radius: 17px;
          }

          .emergency-page .emergency-warning {
            padding: 15px;
          }

          .emergency-page .emergency-page-heading h2 {
            font-size: 19px;
          }

          .emergency-page .emergency-request-card {
            padding: 15px;
          }
        }

        @media(prefers-reduced-motion:reduce) {
          .emergency-page * {
            transition: none !important;
          }
        }
      `}</style>

      <div className="emergency-page">
        <PageHeader
          title={canManage ? "Emergency Support Requests" : "Emergency Support"}
          description={
            canManage
              ? "Review incoming requests and update their status."
              : "Send a request to the community emergency support team and track its status."
          }
        />

        <div className="emergency-warning">
          <AlertTriangle size={22} />
          <div>
            <strong>For immediate danger, call local emergency services.</strong>
            <p>
              This form contacts the Potter Community team. It is not an emergency dispatch service.
            </p>
          </div>
        </div>

        {notice && (
          <div
            role="status"
            className="emergency-alert"
            style={{ background: "#f0faf2", color: "#216b35" }}
          >
            {notice}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="emergency-alert"
            style={{ background: "#fff1f0", color: "#a1261c" }}
          >
            {error}
          </div>
        )}

        <div className="emergency-grid">
          <form className="emergency-main-card" onSubmit={submitRequest}>
            <div className="emergency-icon">
              <HeartPulse size={30} />
            </div>

            <h2>Request Emergency Support</h2>

            <p>
              Tell the support team what happened, where help is needed, and how to contact you.
            </p>

            {!isApproved && (
              <p role="note">
                Sign in with an approved member account to send an emergency request.
              </p>
            )}

            <label htmlFor="emergency-type">Emergency type</label>
            <select
              id="emergency-type"
              value={requestType}
              onChange={(event) => setRequestType(event.target.value)}
              required
              disabled={!isApproved}
            >
              <option value="">Select emergency type</option>
              <option>Medical Emergency</option>
              <option>Accident</option>
              <option>Blood Requirement</option>
              <option>Other Emergency</option>
            </select>

            <label htmlFor="emergency-location">
              Location where help is needed
            </label>
            <input
              id="emergency-location"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              maxLength={500}
              placeholder="Area, town or full address"
              required
              disabled={!isApproved}
            />

            <label htmlFor="emergency-phone">Contact phone</label>
            <input
              id="emergency-phone"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              maxLength={20}
              placeholder="10-digit phone number"
              required
              disabled={!isApproved}
            />

            <label htmlFor="emergency-description">What happened?</label>
            <textarea
              id="emergency-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              minLength={10}
              maxLength={3000}
              placeholder="Share the details the support team needs to respond."
              required
              disabled={!isApproved}
            />

            <button
              type="submit"
              className="btn emergency-button"
              disabled={busy || !isApproved}
            >
              <HeartPulse size={18} />
              {busy ? "Sending request…" : "Request Assistance"}
            </button>
          </form>

          <div className="assistance-card">
            <h3>What happens next</h3>

            <div className="assistance-item">
              <div className="assistance-icon">
                <FileCheck size={18} />
              </div>
              <div>
                <strong>Request is recorded</strong>
                <span>Your request and contact details are saved securely.</span>
              </div>
            </div>

            <div className="assistance-item">
              <div className="assistance-icon">
                <Bell size={18} />
              </div>
              <div>
                <strong>Support team is notified</strong>
                <span>
                  The Emergency Support team receives an in-app notification.
                </span>
              </div>
            </div>

            <div className="assistance-item">
              <div className="assistance-icon">
                <Phone size={18} />
              </div>
              <div>
                <strong>Track the response</strong>
                <span>
                  Status updates appear below and in your notifications.
                </span>
              </div>
            </div>
          </div>
        </div>

        <section>
          <div className="emergency-page-heading">
            <h2>{canManage ? "Incoming requests" : "Your requests"}</h2>

            <button
              className="btn btn-outline emergency-refresh"
              type="button"
              onClick={loadRequests}
              disabled={loading}
            >
              {loading ? "Loading…" : "Refresh"}
            </button>
          </div>

          {loading ? (
            <p>Loading requests…</p>
          ) : requests.length === 0 ? (
            <EmptyState
              title="No emergency requests yet"
              description={
                canManage
                  ? "New community requests will appear here."
                  : "Requests you submit will appear here so you can follow their status."
              }
            />
          ) : (
            <div className="emergency-request-list">
              {requests.map((item) => (
                <article
                  key={item.id}
                  className="emergency-request-card"
                >
                  <div className="emergency-request-top">
                    <strong>
                      {item.emergency_type}
                      {canManage && item.member_name
                        ? ` · ${item.member_name}`
                        : ""}
                    </strong>

                    <strong
                      className="emergency-status"
                      style={{ color: statusColor(item.status) }}
                    >
                      {item.status.replaceAll("_", " ")}
                    </strong>
                  </div>

                  <p className="emergency-request-description">
                    {item.description}
                  </p>

                  <div className="emergency-request-meta">
                    Location: {item.location} · Contact:{" "}
                    <a href={`tel:${item.contact_phone}`}>
                      {item.contact_phone}
                    </a>{" "}
                    · Sent {new Date(item.created_at).toLocaleString()}
                  </div>

                  {item.review_note && (
                    <p className="emergency-review-note">
                      Team update: {item.review_note}
                    </p>
                  )}

                  {canManage &&
                    item.status !== "RESOLVED" &&
                    item.status !== "REJECTED" && (
                      <div className="emergency-review-controls">
                        <input
                          value={reviewNotes[item.id] || ""}
                          onChange={(event) =>
                            setReviewNotes((previous) => ({
                              ...previous,
                              [item.id]: event.target.value,
                            }))
                          }
                          maxLength={1000}
                          placeholder="Optional update for the member"
                          aria-label="Update for the member"
                        />

                        <button
                          className="btn btn-outline"
                          type="button"
                          disabled={busyId === item.id}
                          onClick={() =>
                            updateRequest(item, "ACKNOWLEDGED")
                          }
                        >
                          Acknowledge
                        </button>

                        <button
                          className="btn btn-primary"
                          type="button"
                          disabled={busyId === item.id}
                          onClick={() =>
                            updateRequest(item, "RESOLVED")
                          }
                        >
                          Resolve
                        </button>
                      </div>
                    )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </PageWrapper>
  );
}

/* =========================================================
   NOTIFICATIONS - 7
========================================================= */

function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    setLoading(true);
    setError("");
    try {
      const rows = await authApi("/notifications");
      setNotifications(Array.isArray(rows) ? rows : []);
    } catch (loadError) {
      setError(loadError.message || "Could not load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadNotifications(); }, []);

  const markAllRead = async () => {
    try {
      await authApi("/notifications/read-all", { method: "PATCH" });
      await loadNotifications();
    } catch (loadError) {
      setError(loadError.message || "Could not update notifications.");
    }
  };

  const markRead = async (id) => {
    try {
      await authApi(`/notifications/${id}/read`, { method: "PATCH" });
      setNotifications((items) => items.map((item) => item.id === id ? { ...item, is_read: true } : item));
    } catch (loadError) {
      setError(loadError.message || "Could not update this notification.");
    }
  };

  return (
    <PageWrapper>
      <PageHeader
        title="Notifications"
        description="Your personalized community updates."
      />

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}><button type="button" className="btn btn-outline" onClick={markAllRead} disabled={!notifications.some((item) => !item.is_read)}>Mark all as read</button></div>
      {error && <div role="alert" className="empty-state">{error}</div>}
      {loading ? <div className="empty-state">Loading notifications…</div> : null}

      {!loading && !error && notifications.length === 0 ? <EmptyState title="No notifications yet" description="Membership decisions and future community updates will appear here." /> : null}
      {!loading && notifications.length > 0 && <div className="notification-list">
        {notifications.map((item) => (
            <div
              className="notification-card"
              key={item.id}
              style={{ opacity: item.is_read ? 0.72 : 1 }}
            >
              <div className="notification-icon">
                <Bell size={19} />
              </div>

              <div>
                <h3>{item.title}</h3>
                <p>{item.message}</p>
                <span>{new Date(item.created_at).toLocaleString()}</span>
              </div>
              {!item.is_read && <button type="button" className="btn btn-outline" onClick={() => markRead(item.id)}>Mark read</button>}
            </div>
          )
        )}
      </div>}
    </PageWrapper>
  );
}

/* =========================================================
   PROFILE
========================================================= */

function getStoredProfile() {
  const saved = localStorage.getItem("potterProfile");
  let profile;

  if (saved) {
    try {
      profile = JSON.parse(saved);
    } catch {
      // Ignore invalid local profile data and rebuild it below.
      profile = null;
    }
  }

  if (!profile) {
    profile = {
      fullName: "",
      email: "",
      phone: "",
      dateOfBirth: "",
      gender: "",
      occupation: "",
      artisanStatus: "",
      specialization: "",
      address: "",
      permanentAddress: "",
      correspondenceAddress: "",
      city: "",
      state: "",
      pincode: "",
      bloodGroup: "",
      referralMemberName: "",
      referralMembershipId: "",
      bio: "",
      profilePhoto: "",
      membershipStatus: "PENDING",
    };
  }

  // Prefer the authenticated backend user over old demo/local profile data.
  try {
    const savedUser = sessionStorage.getItem("potterCommunityUser");

    if (savedUser) {
      const user = JSON.parse(savedUser);

      profile = {
        ...profile,
        fullName: user.full_name ?? user.fullName ?? profile.fullName,
        email: user.email ?? profile.email,
        phone: user.phone_number ?? user.phone ?? profile.phone,
        membershipStatus:
          user.membership_status ?? profile.membershipStatus,
        membershipId:
          user.membership_number ?? profile.membershipId ?? "",
        role: user.role ?? profile.role,
      };
    }
  } catch {
    // Keep the local profile if session user data is unavailable.
  }

  // Add fields introduced by the registration specification to existing local profiles.
  profile.permanentAddress ??= profile.address || "";
  profile.correspondenceAddress ??= profile.address || "";
  profile.bloodGroup ??= "";
  profile.referralMemberName ??= "";
  profile.referralMembershipId ??= "";
  // Membership status and membership ID are controlled by the backend.
  // Never auto-approve or generate a membership ID in the browser.
  if (!profile.membershipStatus) {
    profile.membershipStatus = "PENDING";
  }

  localStorage.setItem("potterProfile", JSON.stringify(profile));
  return profile;
}

function ProfilePage() {
  const [profile, setProfile] = useState(getStoredProfile);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [memberCardActionsOpen, setMemberCardActionsOpen] = useState(false);
  const [memberCardPreviewOpen, setMemberCardPreviewOpen] = useState(false);
  const [photoEditorOpen, setPhotoEditorOpen] = useState(false);
  const [photoDraft, setPhotoDraft] = useState("");
  const [photoDraftZoom, setPhotoDraftZoom] = useState(1);
  const [photoZoom, setPhotoZoom] = useState(() => {
    const stored = Number(getStoredProfile().photoZoom || 1);
    return Math.min(2.5, Math.max(1, stored));
  });

  const updateField = (field, value) => {
    setProfile((current) => ({
      ...current,
      [field]: value,
    }));
    setSaved(false);
  };

  const openPhotoEditor = () => {
    setPhotoDraft(profile.profilePhoto || "");
    setPhotoDraftZoom(Number(profile.photoZoom || photoZoom || 1));
    setPhotoEditorOpen(true);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      alert("Please choose a JPG, PNG, WebP, or GIF image.");
      e.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Please choose an image smaller than 2 MB.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoDraft(String(reader.result || ""));
      setPhotoDraftZoom(1);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const savePhotoDraft = () => {
    const nextProfile = {
      ...profile,
      profilePhoto: photoDraft,
      photoZoom: photoDraft ? photoDraftZoom : 1,
    };
    setProfile(nextProfile);
    setPhotoZoom(photoDraft ? photoDraftZoom : 1);
    localStorage.setItem("potterProfile", JSON.stringify(nextProfile));
    window.dispatchEvent(new Event("potter-profile-updated"));
    setPhotoEditorOpen(false);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  };



  const saveProfile = (e) => {
    e.preventDefault();

    localStorage.setItem(
      "potterProfile",
      JSON.stringify(profile)
    );

    window.dispatchEvent(new Event("potter-profile-updated"));

    setEditing(false);
    setSaved(true);

    window.setTimeout(() => {
      setSaved(false);
    }, 3000);
  };

  const initials = profile.fullName
    ? profile.fullName
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("")
    : "PC";
  const membershipStatus = String(profile.membershipStatus || "PENDING").toUpperCase();

  // Personal pottery memories are stored by the backend and remain available
  // across devices. Image requests use the existing app JWT and are owner-only.
  const [memories, setMemories] = useState([]);
  const [memoriesLoading, setMemoriesLoading] = useState(true);
  const [memoryBusy, setMemoryBusy] = useState(false);
  const [memoryCaption, setMemoryCaption] = useState("");
  const [memoryFile, setMemoryFile] = useState(null);
  const [memoryPreviews, setMemoryPreviews] = useState({});
  const [memoryNotice, setMemoryNotice] = useState("");
  const [memoryError, setMemoryError] = useState("");

  const loadMemories = async () => {
    setMemoriesLoading(true);
    setMemoryError("");
    try {
      const rows = await authApi("/profile/memories");
      const token = sessionStorage.getItem("potterCommunityAccessToken") || localStorage.getItem("token");
      const previewEntries = await Promise.all((Array.isArray(rows) ? rows : []).map(async (item) => {
        const response = await fetch(`${AUTH_API_BASE}/profile/memories/${item.id}/image`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!response.ok) throw new Error("Could not load one of your memory photos.");
        return [item.id, URL.createObjectURL(await response.blob())];
      }));
      setMemoryPreviews((previous) => {
        Object.values(previous).forEach((url) => URL.revokeObjectURL(url));
        return Object.fromEntries(previewEntries);
      });
      setMemories(Array.isArray(rows) ? rows : []);
    } catch (loadError) {
      setMemoryError(loadError.message || "Could not load your pottery memories.");
    } finally {
      setMemoriesLoading(false);
    }
  };

  useEffect(() => {
    loadMemories();
    return () => {
      setMemoryPreviews((current) => {
        Object.values(current).forEach((url) => URL.revokeObjectURL(url));
        return {};
      });
    };
  }, []);

  const addPotteryMemory = async (event) => {
    event.preventDefault();
    if (!memoryFile) {
      setMemoryError("Choose a photo to add to your memories.");
      return;
    }
    const payload = new FormData();
    payload.append("file", memoryFile);
    payload.append("caption", memoryCaption.trim());
    setMemoryBusy(true);
    setMemoryError("");
    setMemoryNotice("");
    try {
      await authApi("/profile/memories", { method: "POST", body: payload });
      setMemoryFile(null);
      setMemoryCaption("");
      const picker = document.getElementById("pottery-memory-file");
      if (picker) picker.value = "";
      setMemoryNotice("Your pottery memory has been saved to your profile.");
      await loadMemories();
    } catch (uploadError) {
      setMemoryError(uploadError.message || "Could not upload this memory.");
    } finally {
      setMemoryBusy(false);
    }
  };

  const deletePotteryMemory = async (item) => {
    if (!window.confirm("Delete this memory photo from your profile? This cannot be undone.")) return;
    setMemoryBusy(true);
    setMemoryError("");
    setMemoryNotice("");
    try {
      await authApi(`/profile/memories/${item.id}`, { method: "DELETE" });
      setMemoryPreviews((previous) => {
        if (previous[item.id]) URL.revokeObjectURL(previous[item.id]);
        const next = { ...previous };
        delete next[item.id];
        return next;
      });
      setMemories((previous) => previous.filter((memory) => memory.id !== item.id));
      setMemoryNotice("Memory photo deleted.");
    } catch (deleteError) {
      setMemoryError(deleteError.message || "Could not delete this memory.");
    } finally {
      setMemoryBusy(false);
    }
  };

  if (editing) {
    return (
      <PageWrapper>
        <PageHeader
          title="Edit Profile"
          description="Update your personal and community profile information."
        />

        <form
          className="profile-edit-panel"
          onSubmit={saveProfile}
          style={{ width: "100%", maxWidth: "100%", minWidth: 0, boxSizing: "border-box", overflow: "hidden" }}
        >
          <div className="profile-edit-photo-section" style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", width: "100%", minWidth: 0, boxSizing: "border-box" }}>
            <div className="profile-avatar-large profile-edit-avatar" style={{ width: 76, height: 76, minWidth: 76, flex: "0 0 76px", borderRadius: "50%", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", boxSizing: "border-box" }}>
              {profile.profilePhoto ? (
                <img src={profile.profilePhoto} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", transform: `scale(${photoZoom})`, display: "block" }} />
              ) : initials}
            </div>
            <div style={{ flex: "1 1 260px", minWidth: 0 }}>
              <h3>Profile Photo</h3>
              <p>Manage your profile picture. Maximum size: 2 MB.</p>
              <button type="button" className="btn btn-outline" onClick={openPhotoEditor} style={{ marginTop: 10 }}>
                {profile.profilePhoto ? "Adjust Photo" : "Add Profile Photo"}
              </button>
            </div>
          </div>

          {photoEditorOpen && (
            <div role="dialog" aria-modal="true" aria-label="Adjust profile photo" style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(35, 24, 18, 0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
              <div style={{ width: "100%", maxWidth: 440, maxHeight: "90vh", overflowY: "auto", background: "#fffaf6", border: "1px solid #ead5c8", borderRadius: 18, padding: 24, boxSizing: "border-box", boxShadow: "0 20px 60px rgba(0,0,0,.22)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                  <div><h3 style={{ margin: 0 }}>Adjust profile photo</h3><p style={{ margin: "6px 0 0", fontSize: 13 }}>Choose a picture and adjust how it appears.</p></div>
                  <button type="button" className="btn btn-outline" aria-label="Close photo editor" onClick={() => setPhotoEditorOpen(false)}>×</button>
                </div>
                <div style={{ display: "flex", justifyContent: "center", padding: "22px 0 16px" }}>
                  <div style={{ width: 168, height: 168, borderRadius: "50%", overflow: "hidden", border: "2px solid #ead5c8", background: "#f4e3d7", display: "flex", alignItems: "center", justifyContent: "center", color: "#75442f", fontSize: 28, fontWeight: 700 }}>
                    {photoDraft ? <img src={photoDraft} alt="Profile photo preview" style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${photoDraftZoom})` }} /> : initials}
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 8 }}>
                  <label className="btn btn-outline" style={{ cursor: "pointer" }}>Choose photo<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handlePhotoChange} hidden /></label>
                  {photoDraft && <button type="button" className="btn btn-outline" onClick={() => { setPhotoDraft(""); setPhotoDraftZoom(1); }}>Remove photo</button>}
                </div>
                {photoDraft && <div style={{ marginTop: 20 }}>
                  <label htmlFor="profile-photo-draft-zoom" style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600, marginBottom: 8 }}><span>Zoom</span><span>{Math.round(photoDraftZoom * 100)}%</span></label>
                  <input id="profile-photo-draft-zoom" type="range" min="1" max="2.5" step="0.05" value={photoDraftZoom} onChange={(e) => setPhotoDraftZoom(Number(e.target.value))} style={{ width: "100%", accentColor: "#ad5b3b" }} />
                  <p style={{ fontSize: 12, margin: "6px 0 0" }}>Preview is cropped to a circle. JPG, PNG, WebP or GIF · Maximum 2 MB.</p>
                </div>}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 22 }}>
                  <button type="button" className="btn btn-outline" onClick={() => setPhotoEditorOpen(false)}>Cancel</button>
                  <button type="button" className="btn btn-primary" onClick={savePhotoDraft}>Save Photo</button>
                </div>
              </div>
            </div>
          )}

          <div className="profile-form-section">
            <div className="profile-form-section-heading">
              <span>PERSONAL INFORMATION</span>
              <h2>Basic Details</h2>
            </div>


            <div className="profile-form-grid">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={profile.fullName}
                  onChange={(e) => updateField("fullName", e.target.value)}
                  placeholder="As shown on your 10th marks sheet"
                  readOnly
                  required
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="text"
                  inputMode="email"
                  value={profile.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="Enter your email"
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="Enter your phone number"
                />
              </div>

              <div className="form-group">
                <label>Date of Birth</label>
                <input
                  type="date"
                  value={profile.dateOfBirth}
                  readOnly
                  aria-describedby="dob-lock-note"
                />
              </div>

              <div className="form-group">
                <label>Gender</label>
                <select
                  value={profile.gender}
                  onChange={(e) => updateField("gender", e.target.value)}
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>

                </select>
              </div>

              <div className="form-group">
                <label>Blood Group <span style={{ color: "#8a7062", fontWeight: 400 }}>(Optional)</span></label>
                <select value={profile.bloodGroup || ""} onChange={(e) => updateField("bloodGroup", e.target.value)}>
                  <option value="">No selection</option>
                  { ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((group) => <option key={group} value={group}>{group}</option>) }
                </select>
              </div>

              <div className="form-group">
                <label>Occupation</label>
                <select value={profile.occupation || ""} onChange={(e) => updateField("occupation", e.target.value)}>
                  <option value="">Select occupation</option>
                  {["Government employee", "Private-sector employee", "Business owner", "Potter / artisan", "Farmer", "Student", "Self-employed", "Other occupation", "Currently unemployed", "Retired"].map((occupation) => <option key={occupation} value={occupation}>{occupation}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="profile-form-section">
            <div className="profile-form-section-heading">
              <span>ARTISAN INFORMATION</span>
              <h2>Pottery & Community Details</h2>
            </div>

            <div className="profile-form-grid">
              <div className="form-group">
                <label>Are you a Potter / Artisan?</label>
                <select
                  value={profile.artisanStatus}
                  onChange={(e) =>
                    updateField("artisanStatus", e.target.value)
                  }
                >
                  <option value="">Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div className="form-group">
                <label>Pottery / Artisan Specialization</label>
                <input
                  type="text"
                  value={profile.specialization}
                  onChange={(e) =>
                    updateField("specialization", e.target.value)
                  }
                  placeholder="e.g. Terracotta, Clay Pottery"
                />
              </div>
            </div>
          </div>

          <div className="profile-form-section">
            <div className="profile-form-section-heading">
              <span>ADDRESS</span>
              <h2>Location Details</h2>
            </div>

            <div className="profile-form-grid">
              <div className="form-group profile-form-full">
                <label>Permanent Address</label>
                <textarea
                  value={profile.permanentAddress ?? profile.address ?? ""}
                  onChange={(e) => { updateField("permanentAddress", e.target.value); updateField("address", e.target.value); }}
                  placeholder="Door number, house/apartment, street, area, city and PIN code"
                  rows="3"
                  readOnly
                  required
                />
              </div>
              <div className="form-group profile-form-full">
                <label>Correspondence Address</label>
                <textarea
                  value={profile.correspondenceAddress ?? ""}
                  onChange={(e) => updateField("correspondenceAddress", e.target.value)}
                  placeholder="Enter your correspondence address"
                  rows="3"
                  required
                />
              </div>
              <div className="form-group">
                <label>Referral Member Name <span style={{ color: "#8a7062", fontWeight: 400 }}>(Provided by community)</span></label>
                <input type="text" value={profile.referralMemberName || ""} readOnly placeholder="To be recorded by the community" />
              </div>
              <div className="form-group">
                <label>Referral Membership No. <span style={{ color: "#8a7062", fontWeight: 400 }}>(Provided by community)</span></label>
                <input type="text" value={profile.referralMembershipId || ""} readOnly placeholder="To be recorded by the community" />
              </div>

              <div className="form-group">
                <label>City</label>
                <input
                  type="text"
                  value={profile.city}
                  onChange={(e) =>
                    updateField("city", e.target.value)
                  }
                  placeholder="Enter city"
                />
              </div>

              <div className="form-group">
                <label>State</label>
                <input
                  type="text"
                  value={profile.state}
                  onChange={(e) =>
                    updateField("state", e.target.value)
                  }
                  placeholder="Enter state"
                />
              </div>

              <div className="form-group">
                <label>PIN Code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength="6"
                  value={profile.pincode}
                  onChange={(e) =>
                    updateField(
                      "pincode",
                      e.target.value.replace(/\D/g, "")
                    )
                  }
                  placeholder="Enter PIN code"
                />
              </div>
            </div>
          </div>

          <div className="profile-form-section">
            <div className="profile-form-section-heading">
              <span>ABOUT YOU</span>
              <h2>Profile Bio</h2>
            </div>

            <div className="form-group">
              <label>About Me</label>
              <textarea
                value={profile.bio}
                onChange={(e) =>
                  updateField("bio", e.target.value)
                }
                placeholder="Tell the community a little about yourself..."
                rows="4"
                maxLength="500"
              />
            </div>
          </div>

          <div className="profile-account-info">
            <ShieldCheck size={18} />
            <div>
              <strong>Verified membership information</strong>
              <p>
                Membership ID, role, verification status and joining date
                are managed by the community administration and cannot be
                changed from your profile.
              </p>
            </div>
          </div>

          <div className="profile-save-actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                setProfile(getStoredProfile());
                setEditing(false);
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn btn-primary"
            >
              Save Profile
              <CheckCircle size={17} />
            </button>
          </div>
        </form>

      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <PageHeader
        title="My Profile"
        description="Manage your verified Potter Community profile."
      />

      <div className="profile-page">
        <div className="profile-header-card">
          <div className="profile-avatar-large">
            {profile.profilePhoto ? (
              <img
                src={profile.profilePhoto}
                alt="Profile"
              />
            ) : (
              initials
            )}
          </div>

          <div>
            <div className="profile-name-row">
              <h2>{profile.fullName || "Your Name"}</h2>

              <CheckCircle
                size={19}
                className="verified-icon"
              />
            </div>

            <p>
              {profile.role ? `${profile.role} account` : membershipStatus === "APPROVED" ? "Verified Potter Community Member" : "Membership application"}
            </p>

            <span className="membership-id">
              Membership ID: {membershipStatus === "APPROVED" ? profile.membershipId : "Assigned after approval"}
            </span>
          </div>

          <button
            className="btn btn-outline"
            onClick={() => setEditing(true)}
          >
            Edit Profile
          </button>
        </div>

        {saved && (
          <div className="profile-save-success">
            <CheckCircle size={17} />
            Profile updated successfully.
          </div>
        )}

        <div className="profile-basic-grid">
          <ProfileDetail
            label="Role"
            value={profile.role || "Member"}
          />

          <ProfileDetail
            label="Status"
            value={membershipStatus === "APPROVED" ? "Approved Member" : "Pending Verification"}
          />

          <ProfileDetail
            label="Membership ID"
            value={membershipStatus === "APPROVED" ? profile.membershipId : "Assigned after approval"}
          />
        </div>

        <section className="pottery-memories-panel" style={{ marginTop: 24 }}>
          <style>{`
            .pottery-memories-panel{position:relative;isolation:isolate;overflow:hidden;padding:clamp(18px,2.4vw,30px);border:1px solid #ead4c5;border-radius:22px;background:radial-gradient(ellipse at 100% 0%,rgba(198,126,88,.13),transparent 36%),linear-gradient(135deg,#fffdf9 0%,#fff8f1 100%);box-shadow:0 14px 38px rgba(93,54,34,.055)}
            .pottery-memories-panel:before{content:"";position:absolute;z-index:-1;width:210px;height:210px;right:-100px;bottom:-125px;border:1px solid rgba(173,91,59,.16);border-radius:50%;box-shadow:0 0 0 22px rgba(173,91,59,.025),0 0 0 44px rgba(173,91,59,.02)}
            .pottery-memory-eyebrow{display:inline-flex;align-items:center;gap:7px;color:#a95736;font-size:10px;font-weight:800;letter-spacing:.16em;text-transform:uppercase}
            .pottery-memory-count{display:inline-flex;align-items:center;gap:7px;padding:8px 12px;border:1px solid #efd9c9;border-radius:30px;background:#fff8f1;color:#875039;font-size:11px;font-weight:750;white-space:nowrap}
            .pottery-memory-upload{display:grid;grid-template-columns:minmax(0,1fr) minmax(220px,1.15fr) auto;gap:16px;align-items:end;margin-top:22px;padding:17px;border:1px solid #ead5c5;border-radius:16px;background:rgba(255,255,255,.78);box-shadow:inset 0 1px 0 #fff}
            .pottery-memory-label{display:block;margin-bottom:8px;color:#654431;font-size:12px;font-weight:750}
            .pottery-memory-filebox{display:flex;align-items:center;gap:12px;min-height:43px;padding:7px 10px;border:1px dashed #d8b39d;border-radius:11px;background:#fffaf6;color:#76513c;font-size:11px;min-width:0}
            .pottery-memory-filebox input{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none}
            .pottery-memory-filebox label{display:inline-flex;align-items:center;gap:7px;padding:8px 11px;border-radius:8px;background:#f4e5da;color:#80472f;font-weight:750;cursor:pointer;white-space:nowrap}
            .pottery-memory-filebox label:hover{background:#ecd5c5}
            .pottery-memory-caption{width:100%;box-sizing:border-box;min-height:43px;padding:11px 13px;border:1px solid #e5d2c4;border-radius:10px;background:#fff;color:#503326;font:inherit;font-size:12px;outline:none;transition:border-color .2s,box-shadow .2s}
            .pottery-memory-caption:focus{border-color:#b66a48;box-shadow:0 0 0 3px rgba(182,106,72,.12)}
            .pottery-memory-add{min-height:43px;padding:0 18px!important;border-radius:10px!important;white-space:nowrap}
            .pottery-memory-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,225px),1fr));gap:17px;margin-top:22px}
            .pottery-memory-card{overflow:hidden;min-width:0;border:1px solid #ead9cd;border-radius:16px;background:#fff;box-shadow:0 7px 20px rgba(76,48,32,.055);transition:transform .22s ease,box-shadow .22s ease}
            .pottery-memory-card:hover{transform:translateY(-4px);box-shadow:0 14px 28px rgba(76,48,32,.12)}
            .pottery-memory-image{display:block;width:100%;height:205px;object-fit:cover;background:#f4e5da;transition:transform .4s ease}
            .pottery-memory-card:hover .pottery-memory-image{transform:scale(1.035)}
            .pottery-memory-empty{display:grid;place-items:center;min-height:190px;margin-top:22px;padding:25px;border:1px dashed #dfc2ae;border-radius:16px;background:linear-gradient(135deg,#fffaf5,#f8eee5);text-align:center}
            @media(max-width:760px){.pottery-memory-upload{grid-template-columns:1fr}.pottery-memory-add{width:100%}.pottery-memory-image{height:220px}}
          `}</style>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div style={{ maxWidth: 660 }}>
              <span className="pottery-memory-eyebrow"><ImagePlus size={14}/> Your pottery journey</span>
              <h2 style={{ margin: "8px 0 7px", color: "#442d20", fontSize: "clamp(21px,2.2vw,26px)", letterSpacing: "-.025em" }}>My Memories</h2>
              <p style={{ margin: 0, color: "#806b5e", fontSize: 13, lineHeight: 1.7 }}>A personal gallery for the moments behind your craft — creations, workshops, exhibitions and milestones worth keeping.</p>
            </div>
            <span className="pottery-memory-count"><ImagePlus size={14}/>{memories.length} {memories.length === 1 ? "memory" : "memories"}</span>
          </div>

          <form onSubmit={addPotteryMemory} className="pottery-memory-upload">
            <div style={{ minWidth: 0 }}>
              <label className="pottery-memory-label" htmlFor="pottery-memory-file">Select your photograph</label>
              <div className="pottery-memory-filebox"><label htmlFor="pottery-memory-file"><ImagePlus size={15}/> Browse photos</label><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{memoryFile?.name || "No photo selected"}</span><input id="pottery-memory-file" type="file" accept="image/jpeg,image/png,image/webp" required onChange={(event) => { const file = event.target.files?.[0] || null; if (file && file.size > 8 * 1024 * 1024) { setMemoryError("Choose an image smaller than 8 MB."); event.target.value = ""; setMemoryFile(null); return; } setMemoryError(""); setMemoryFile(file); }}/></div>
              <small style={{ display: "block", marginTop: 7, color: "#9a8171", fontSize: 10 }}>JPG, PNG or WEBP · Maximum 8 MB</small>
            </div>
            <div style={{ minWidth: 0 }}>
              <label className="pottery-memory-label" htmlFor="pottery-memory-caption">Give this memory a title <span style={{ color: "#9a8171", fontWeight: 500 }}>(optional)</span></label>
              <input className="pottery-memory-caption" id="pottery-memory-caption" type="text" maxLength={500} value={memoryCaption} onChange={(event) => setMemoryCaption(event.target.value)} placeholder="e.g. My first terracotta workshop" />
            </div>
            <button type="submit" className="btn btn-primary pottery-memory-add" disabled={memoryBusy || !memoryFile}>{memoryBusy ? "Saving…" : <><ImagePlus size={16}/> Save memory</>}</button>
          </form>
          {memoryError && <p role="alert" style={{ margin: "12px 0 0", color: "#a13d2d", fontSize: 12 }}>{memoryError}</p>}
          {memoryNotice && <p role="status" style={{ margin: "12px 0 0", color: "#39734a", fontSize: 12 }}>{memoryNotice}</p>}

          {memoriesLoading ? <p style={{ color: "#806b5e", fontSize: 13, marginTop: 22 }}>Loading your memories…</p> : memories.length === 0 ? (
            <div className="pottery-memory-empty"><div><div style={{ width: 54, height: 54, margin: "0 auto 12px", display: "grid", placeItems: "center", borderRadius: 18, background: "#f0dfd2", color: "#a65a3a" }}><ImagePlus size={27}/></div><h3 style={{ margin: "0 0 6px", color: "#503326", fontSize: 16 }}>Your story starts with a photograph</h3><p style={{ margin: 0, color: "#806b5e", fontSize: 12, lineHeight: 1.7 }}>Save a moment from your pottery journey and build a gallery you can revisit anytime.</p></div></div>
          ) : (
            <div className="pottery-memory-grid">
              {memories.map((item) => <article key={item.id} className="pottery-memory-card">
                {memoryPreviews[item.id] ? <img className="pottery-memory-image" src={memoryPreviews[item.id]} alt={item.caption || "Pottery activity memory"} /> : <div style={{ height: 205, display: "grid", placeItems: "center", background: "#f5e8df", color: "#9b6a50", fontSize: 12 }}>Loading photo…</div>}
                <div style={{ padding: "13px 14px 14px" }}>
                  <p style={{ margin: "0 0 11px", minHeight: 20, color: "#503326", fontSize: 13, fontWeight: 700, lineHeight: 1.5, overflowWrap: "anywhere" }}>{item.caption || "A moment from my pottery journey"}</p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, paddingTop: 10, borderTop: "1px solid #f1e7df" }}>
                    <small style={{ color: "#927d6e", fontSize: 10 }}>{item.created_at ? new Date(item.created_at).toLocaleDateString() : "Saved memory"}</small>
                    <button type="button" className="btn btn-outline" disabled={memoryBusy} onClick={() => deletePotteryMemory(item)} style={{ padding: "6px 9px", fontSize: 10, borderRadius: 8 }}><Trash2 size={13}/> Delete</button>
                  </div>
                </div>
              </article>)}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 18, paddingTop: 13, borderTop: "1px solid #f0e3d9", color: "#927d6e", fontSize: 10, lineHeight: 1.6 }}><ShieldCheck size={14} color="#a65a3a"/><span>Your memories are private to your account and stay saved until you choose to delete them.</span></div>
        </section>

        <section style={{ marginTop: 22, padding: 20, border: "1px solid #ead8cc", borderRadius: 14, background: "#fffdfb" }}>
          <div style={{ marginBottom: 14 }}>
            <span style={{ color: "#a95736", fontSize: 10, fontWeight: 800, letterSpacing: ".12em" }}>MEMBERSHIP</span>
            <h2 style={{ margin: "5px 0", color: "#503326", fontSize: 19 }}>Member card & QR code</h2>
            <p style={{ margin: 0, color: "#806b5e", fontSize: 12 }}>Your QR code contains only your membership ID.</p>
          </div>
          {membershipStatus === "APPROVED" && profile.membershipId ? <>
            <style>{`
              @page { size: landscape; margin: 0; }
              @media print {
                html, body, #root { width: 100% !important; height: 100% !important; margin: 0 !important; padding: 0 !important; background: #fff !important; overflow: hidden !important; }
                body * { visibility: hidden !important; }
                #potter-membership-card, #potter-membership-card * { visibility: visible !important; }
                #potter-membership-card { position: fixed !important; inset: 0 !important; display: flex !important; flex-wrap: nowrap !important; align-items: center !important; justify-content: space-between !important; gap: 12mm !important; width: 100vw !important; height: 100vh !important; min-height: 0 !important; max-width: none !important; box-sizing: border-box !important; margin: 0 !important; padding: 18mm 22mm !important; overflow: hidden !important; border: 3px solid #c58c6d !important; border-radius: 0 !important; box-shadow: none !important; background: linear-gradient(125deg, #fffaf5 0%, #f1d7c5 100%) !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; break-inside: avoid !important; page-break-inside: avoid !important; }
                #potter-membership-card .member-card-print-details { min-width: 0 !important; flex: 1 1 auto !important; }
                #potter-membership-card .member-card-print-qr { flex: 0 0 62mm !important; width: 62mm !important; padding: 5mm !important; border-radius: 4mm !important; align-self: center !important; }
                #potter-membership-card .member-card-print-qr svg { width: 50mm !important; height: 50mm !important; }
                #potter-membership-card .member-card-brand { font-size: 18pt !important; }
                #potter-membership-card .member-card-name { font-size: 34pt !important; margin-top: 12mm !important; }
                #potter-membership-card .member-card-role { font-size: 18pt !important; }
                #potter-membership-card .member-card-id-label { font-size: 13pt !important; margin-top: 12mm !important; }
                #potter-membership-card .member-card-id { font-size: 24pt !important; }
                #potter-membership-card .member-card-status { font-size: 15pt !important; margin-top: 8mm !important; }
                #potter-membership-card .member-card-tagline { font-size: 12pt !important; margin-top: 6mm !important; }
                #potter-membership-card .member-card-print-qr-label { font-size: 11pt !important; }
                .potter-membership-print-action, [role='dialog'] { display: none !important; }
              }
            `}</style>
            <div id="potter-membership-card" style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "stretch", gap: 18, flexWrap: "nowrap", width: "min(100%, 620px)", minHeight: 230, boxSizing: "border-box", padding: 22, border: "1px solid #d9b49e", borderRadius: 16, background: "linear-gradient(125deg, #fffaf5 0%, #f3dfd0 100%)", boxShadow: "0 8px 24px rgba(80, 51, 38, .08)", overflow: "hidden" }}>
              <div aria-hidden="true" style={{ position: "absolute", right: -28, top: -45, width: 160, height: 160, borderRadius: "50%", border: "1px solid rgba(169,87,54,.16)", pointerEvents: "none" }} />
              <div className="member-card-print-details" style={{ position: "relative", minWidth: 0, flex: "1 1 auto", display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ display: "inline-flex", width: 25, height: 25, alignItems: "center", justifyContent: "center", borderRadius: 7, background: "#f0d8c8", color: "#a95736", fontWeight: 900, fontSize: 13 }}>P</span>
                  <div className="member-card-brand" style={{ color: "#a95736", fontSize: 10, fontWeight: 900, letterSpacing: ".14em" }}>POTTER COMMUNITY</div>
                </div>
                <h3 className="member-card-name" style={{ margin: "12px 0 4px", color: "#503326", fontSize: 21, lineHeight: 1.15, overflowWrap: "anywhere" }}>{profile.fullName || "Community Member"}</h3>
                <div className="member-card-role" style={{ color: "#6f5b4e", fontSize: 12 }}>{profile.role || "Member"}</div>
                <div className="member-card-id-label" style={{ marginTop: 16, color: "#806b5e", fontSize: 10, fontWeight: 800, letterSpacing: ".08em" }}>MEMBERSHIP ID</div>
                <strong className="member-card-id" style={{ display: "block", marginTop: 3, color: "#a95736", fontSize: 15, overflowWrap: "anywhere" }}>{profile.membershipId}</strong>
                <div className="member-card-status" style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 10, color: "#386a3c", fontSize: 11, fontWeight: 900 }}>✓ VERIFIED MEMBER</div>
                <div className="member-card-tagline" style={{ marginTop: 7, color: "#806b5e", fontSize: 9 }}>Craft • Community • Tradition</div>
              </div>
              <div className="member-card-print-qr" style={{ position: "relative", flex: "0 0 142px", alignSelf: "center", padding: 10, border: "1px solid #f0dfd3", borderRadius: 12, background: "white", textAlign: "center", boxSizing: "border-box" }}>
                <QRCodeSVG value={profile.membershipId} size={120} level="M" title={`Membership ID ${profile.membershipId}`} />
                <div className="member-card-print-qr-label" style={{ marginTop: 4, color: "#806b5e", fontSize: 9, fontWeight: 700 }}>SCAN TO VERIFY ID</div>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-primary potter-membership-print-action"
              onClick={() => window.setTimeout(() => window.print(), 50)}
              style={{ marginTop: 12 }}
            >
              Print member card
            </button>

          </> : <p style={{ margin: 0, padding: 13, borderRadius: 10, background: "#fff8f2", color: "#806b5e", fontSize: 12 }}>{membershipStatus === "APPROVED" ? "A member card and QR code will be available when your membership ID is assigned." : "A member card and QR code will be available after membership approval."}</p>}
        </section>

        <FamilyMembersPanel />
      </div>
    </PageWrapper>
  );
}

function FamilyMembersPanel() {
  const [familyMembers, setFamilyMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadFamilyMembers = async () => {
    setError("");
    try {
      const rows = await authApi("/family-members");
      setFamilyMembers(Array.isArray(rows) ? rows : []);
    } catch (loadError) {
      setError(loadError.message || "Could not load family members.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadFamilyMembers(); }, []);

  const addFamilyMember = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    const form = event.currentTarget;
    const formData = new FormData(form);
    const values = Object.fromEntries(formData.entries());
    for (const key of Object.keys(values)) if (values[key] === "") values[key] = null;
    try {
      await authApi("/family-members", { method: "POST", body: JSON.stringify(values) });
      form.reset();
      setNotice("Family member added and sent for individual verification.");
      await loadFamilyMembers();
    } catch (saveError) {
      setError(saveError.message || "Could not add this family member.");
    } finally {
      setBusy(false);
    }
  };

  const deleteFamilyMember = async (id) => {
    try {
      await authApi(`/family-members/${id}`, { method: "DELETE" });
      await loadFamilyMembers();
    } catch (deleteError) {
      setError(deleteError.message || "Could not remove this family member.");
    }
  };

  return (
    <section style={{ marginTop: 22, padding: 20, border: "1px solid #ead8cc", borderRadius: 14, background: "#fffdfb" }}>
      <div style={{ marginBottom: 15 }}><span style={{ color: "#a95736", fontSize: 10, fontWeight: 800, letterSpacing: ".12em" }}>HOUSEHOLD</span><h2 style={{ margin: "5px 0", color: "#503326", fontSize: 19 }}>Family members</h2><p style={{ margin: 0, color: "#806b5e", fontSize: 12 }}>Each family member has an independent verification status and membership record.</p></div>
      <form onSubmit={addFamilyMember} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 10, padding: 14, border: "1px solid #f0e2d8", borderRadius: 11 }}>
        <input name="full_name" required minLength={2} maxLength={160} placeholder="Full name" aria-label="Family member full name" style={{ padding: 10, border: "1px solid #ddc9b7", borderRadius: 8, color: "#503326" }} />
        <select name="relationship" required defaultValue="" aria-label="Relationship" style={{ padding: 10, border: "1px solid #ddc9b7", borderRadius: 8, color: "#503326", background: "#fffdfb" }}><option value="" disabled>Relationship</option>{["Spouse", "Child", "Parent", "Other"].map((item) => <option key={item}>{item}</option>)}</select>
        <input name="date_of_birth" type="date" aria-label="Date of birth" style={{ padding: 10, border: "1px solid #ddc9b7", borderRadius: 8, color: "#503326" }} />
        <select name="gender" defaultValue="" aria-label="Gender" style={{ padding: 10, border: "1px solid #ddc9b7", borderRadius: 8, color: "#503326", background: "#fffdfb" }}><option value="">Gender (optional)</option>{["Female", "Male", "Non-binary", "Prefer not to say"].map((item) => <option key={item}>{item}</option>)}</select>
        <input name="phone_number" type="tel" maxLength={20} placeholder="Phone (optional)" aria-label="Family member phone" style={{ padding: 10, border: "1px solid #ddc9b7", borderRadius: 8, color: "#503326" }} />
        <input name="email" type="email" maxLength={255} placeholder="Email (optional)" aria-label="Family member email" style={{ padding: 10, border: "1px solid #ddc9b7", borderRadius: 8, color: "#503326" }} />
        <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? "Adding…" : "Add family member"} <Plus size={15} /></button>
      </form>
      {error && <p role="alert" style={{ color: "#a13d2d", fontSize: 12 }}>{error}</p>}
      {notice && <p role="status" style={{ color: "#39734a", fontSize: 12 }}>{notice}</p>}
      <div style={{ display: "grid", gap: 8, marginTop: 13 }}>
        {loading ? <p style={{ color: "#806b5e", fontSize: 12 }}>Loading family members…</p> : familyMembers.length ? familyMembers.map((member) => <div key={member.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", padding: 12, border: "1px solid #efe2d8", borderRadius: 9 }}><div><strong style={{ color: "#503326" }}>{member.full_name}</strong><div style={{ color: "#806b5e", fontSize: 11, marginTop: 3 }}>{member.relationship}{member.date_of_birth ? ` · DOB ${member.date_of_birth}` : ""} · {member.membership_status}{member.membership_number ? ` · ${member.membership_number}` : ""}</div>{member.admin_remark && <div style={{ color: "#806b5e", fontSize: 11, marginTop: 3 }}>Review note: {member.admin_remark}</div>}</div>{member.membership_status !== "APPROVED" && <button type="button" className="btn btn-outline" onClick={() => deleteFamilyMember(member.id)}>Remove</button>}</div>) : <p style={{ color: "#806b5e", fontSize: 12 }}>No family members added yet.</p>}
      </div>
    </section>
  );
}

function FamilyReviewQueue() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  const loadItems = async () => {
    setError("");
    try {
      const rows = await authApi("/family-members/admin/pending");
      setItems(Array.isArray(rows) ? rows : []);
    } catch (loadError) {
      setError(loadError.message || "Could not load family membership requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadItems(); }, []);

  const decide = async (id, status) => {
    setBusyId(id);
    setError("");
    try {
      await authApi(`/family-members/admin/${id}/review`, {
        method: "PATCH",
        body: JSON.stringify({ status, admin_remark: null }),
      });
      await loadItems();
    } catch (reviewError) {
      setError(reviewError.message || "Could not update family member status.");
    } finally {
      setBusyId(null);
    }
  };

  return <section style={{ margin: "18px 0", padding: 18, border: "1px solid #ead8cc", borderRadius: 14, background: "#fffdfb" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}><div><h2 style={{ margin: "0 0 5px", color: "#503326", fontSize: 19 }}>Family membership review</h2><p style={{ margin: 0, color: "#806b5e", fontSize: 12 }}>Review family members independently from the primary member.</p></div><button type="button" className="btn btn-outline" onClick={loadItems} disabled={loading}>Refresh</button></div>
    {error && <p role="alert" style={{ color: "#a13d2d", fontSize: 12 }}>{error}</p>}
    {loading ? <p style={{ color: "#806b5e", fontSize: 12 }}>Loading family requests…</p> : items.length ? <div style={{ display: "grid", gap: 8, marginTop: 12 }}>{items.map((item) => <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", padding: 12, border: "1px solid #efe2d8", borderRadius: 9 }}><div><strong style={{ color: "#503326" }}>{item.full_name}</strong><div style={{ color: "#806b5e", fontSize: 11, marginTop: 3 }}>{item.relationship} · Under {item.primary_member_name}{item.primary_membership_number ? ` (${item.primary_membership_number})` : ""}{item.date_of_birth ? ` · DOB ${item.date_of_birth}` : ""}</div><div style={{ color: "#806b5e", fontSize: 11 }}>{item.phone_number || "No phone provided"}{item.email ? ` · ${item.email}` : ""}</div></div><div style={{ display: "flex", gap: 8 }}><button type="button" className="btn btn-outline" onClick={() => decide(item.id, "REJECTED")} disabled={busyId !== null}>{busyId === item.id ? "Saving…" : "Reject"}</button><button type="button" className="btn btn-primary" onClick={() => decide(item.id, "APPROVED")} disabled={busyId !== null}>Approve</button></div></div>)}</div> : <p style={{ marginTop: 14, color: "#806b5e", fontSize: 12 }}>No pending family member requests.</p>}
  </section>;
}

function ProfileDetail({ label, value }) {
  return (
    <div className="profile-detail">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

/* =========================================================
   SETTINGS
========================================================= */

function CommunityRecordsPage({ activeUser }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ record_type: "NOTICE", title: "", content: "", scheduled_at: "", venue: "" });
  const isAdmin = String(activeUser?.role || "").toUpperCase() === "ADMIN";
  const canManage = isAdmin || activeUser?.permissions?.includes("community.records.manage");
  const canApprove = isAdmin || activeUser?.permissions?.includes("community.approve");

  const loadRecords = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await authApi("/community/records");
      setRecords(Array.isArray(result) ? result : []);
    } catch (loadError) {
      setError(loadError.message || "Could not load community records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRecords(); }, []);

  const saveRecord = async (event, submitForApproval) => {
    event?.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);
    const payload = {
      ...form,
      scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
      venue: form.venue.trim() || null,
      submit_for_approval: submitForApproval,
    };
    try {
      await authApi(editingId ? `/community/records/${editingId}` : "/community/records", {
        method: editingId ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      setNotice(submitForApproval ? "Saved and sent to the President for approval." : "Draft saved.");
      setForm({ record_type: "NOTICE", title: "", content: "", scheduled_at: "", venue: "" });
      setEditingId(null);
      await loadRecords();
    } catch (saveError) {
      setError(saveError.message || "Could not save this community record.");
    } finally {
      setBusy(false);
    }
  };

  const editRecord = (record) => {
    let scheduledAt = "";
    if (record.scheduled_at) {
      const localDate = new Date(new Date(record.scheduled_at).getTime() - new Date(record.scheduled_at).getTimezoneOffset() * 60_000);
      scheduledAt = localDate.toISOString().slice(0, 16);
    }
    setForm({ record_type: record.record_type, title: record.title, content: record.content, scheduled_at: scheduledAt, venue: record.venue || "" });
    setEditingId(record.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteRecord = async (record) => {
    if (!window.confirm(`Delete the draft “${record.title}”?`)) return;
    setBusy(true);
    setError("");
    try {
      await authApi(`/community/records/${record.id}`, { method: "DELETE" });
      setNotice("Draft deleted.");
      await loadRecords();
    } catch (deleteError) {
      setError(deleteError.message || "Could not delete this draft.");
    } finally { setBusy(false); }
  };

  const decideRecord = async (record, decision) => {
    const remark = decision === "REJECTED" ? window.prompt("Please give a reason for rejecting this record.") : "";
    if (decision === "REJECTED" && (!remark || remark.trim().length < 3)) return;
    setBusy(true);
    setError("");
    try {
      await authApi(`/community/records/${record.id}/decision`, { method: "PATCH", body: JSON.stringify({ decision, remark: remark || null }) });
      setNotice(decision === "APPROVED" ? "Record approved and published." : "Record returned to the author with your reason.");
      await loadRecords();
    } catch (decisionError) {
      setError(decisionError.message || "Could not update this record.");
    } finally { setBusy(false); }
  };

  const recordStyle = (status) => ({ display: "inline-flex", borderRadius: 99, padding: "5px 9px", background: status === "PUBLISHED" ? "#eaf2e5" : status === "PENDING_APPROVAL" ? "#fff1d8" : status === "REJECTED" ? "#fbe8e5" : "#f0e9e3", color: status === "PUBLISHED" ? "#4c7043" : status === "REJECTED" ? "#a13d2d" : "#79563d", fontSize: 10, fontWeight: 800 });

  return <PageWrapper>
    <PageHeader title="Meetings & Official Records" description="The Secretary maintains notices, meeting records, minutes, and day-to-day community activities. Committee actions are timestamped and reviewed by the President." />
    {error && <p role="alert" style={{ color: "#a13d2d", fontSize: 12 }}>{error}</p>}
    {notice && <p role="status" style={{ color: "#39734a", fontSize: 12 }}>{notice}</p>}
    {canManage && <section style={{ margin: "16px 0", padding: 18, border: "1px solid #ead8cc", borderRadius: 14, background: "#fffdfb" }}>
      <h2 style={{ margin: "0 0 12px", color: "#503326", fontSize: 18 }}>{editingId ? "Edit community record" : "Create a notice or official record"}</h2>
      <form onSubmit={(event) => saveRecord(event, true)} style={{ display: "grid", gap: 11 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 10 }}>
          <label style={{ display: "grid", gap: 5, color: "#806b5e", fontSize: 11 }}>Record type<select value={form.record_type} onChange={(event) => setForm({ ...form, record_type: event.target.value })} style={{ padding: 10, border: "1px solid #ddc9b7", borderRadius: 8, background: "#fffdfb" }}>{[["NOTICE", "Notice"], ["MEETING", "Meeting"], ["MINUTES", "Meeting minutes"], ["ACTIVITY", "Day-to-day activity"]].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label style={{ display: "grid", gap: 5, color: "#806b5e", fontSize: 11 }}>Date and time (if applicable)<input type="datetime-local" value={form.scheduled_at} onChange={(event) => setForm({ ...form, scheduled_at: event.target.value })} style={{ padding: 10, border: "1px solid #ddc9b7", borderRadius: 8, background: "#fffdfb" }} /></label>
          <label style={{ display: "grid", gap: 5, color: "#806b5e", fontSize: 11 }}>Venue or record reference<input value={form.venue} onChange={(event) => setForm({ ...form, venue: event.target.value })} maxLength={255} placeholder="Venue, meeting reference, or location" style={{ padding: 10, border: "1px solid #ddc9b7", borderRadius: 8, background: "#fffdfb" }} /></label>
        </div>
        <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} minLength={3} maxLength={160} required placeholder="Record title" style={{ padding: 11, border: "1px solid #ddc9b7", borderRadius: 8, background: "#fffdfb" }} />
        <textarea value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} minLength={5} maxLength={5000} required rows={4} placeholder="Notice details, agenda, decisions, minutes, or activity record" style={{ padding: 11, border: "1px solid #ddc9b7", borderRadius: 8, background: "#fffdfb", resize: "vertical" }} />
        <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}><button type="button" className="btn btn-outline" disabled={busy} onClick={() => saveRecord(null, false)}>{busy ? "Saving…" : "Save draft"}</button><button type="submit" className="btn btn-primary" disabled={busy}>{busy ? "Sending…" : "Submit to President"}</button>{editingId && <button type="button" className="btn btn-outline" onClick={() => { setEditingId(null); setForm({ record_type: "NOTICE", title: "", content: "", scheduled_at: "", venue: "" }); }}>Cancel edit</button>}</div>
      </form>
    </section>}
    <section style={{ display: "grid", gap: 10, marginTop: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}><h2 style={{ margin: 0, color: "#503326", fontSize: 18 }}>{canApprove ? "Records awaiting your approval and published records" : "Community records"}</h2><button type="button" className="btn btn-outline" disabled={loading} onClick={loadRecords}>{loading ? "Refreshing…" : "Refresh"}</button></div>
      {loading ? <div className="empty-state">Loading community records…</div> : records.length ? records.map((record) => <article key={record.id} style={{ padding: 16, border: "1px solid #ead8cc", borderRadius: 13, background: "#fffdfb" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}><div><span style={{ color: "#a65335", fontSize: 10, fontWeight: 900, letterSpacing: ".1em" }}>{record.record_type.replaceAll("_", " ")}</span><h3 style={{ margin: "5px 0", color: "#503326", fontSize: 16 }}>{record.title}</h3></div><span style={recordStyle(record.status)}>{record.status.replaceAll("_", " ")}</span></div><p style={{ whiteSpace: "pre-wrap", color: "#6f5b4e", fontSize: 12, lineHeight: 1.7 }}>{record.content}</p><div style={{ display: "flex", gap: 12, flexWrap: "wrap", color: "#806b5e", fontSize: 10 }}><span>Recorded by {record.created_by}</span><span>Updated {new Date(record.updated_at).toLocaleString()}</span>{record.scheduled_at && <span>{new Date(record.scheduled_at).toLocaleString()}</span>}{record.venue && <span>{record.venue}</span>}</div>{record.approval_remark && <p style={{ color: "#a13d2d", fontSize: 11, marginBottom: 0 }}>Review note: {record.approval_remark}</p>}{canApprove && record.status === "PENDING_APPROVAL" && <div style={{ display: "flex", gap: 8, marginTop: 12 }}><button type="button" className="btn btn-primary" disabled={busy} onClick={() => decideRecord(record, "APPROVED")}>Approve & publish</button><button type="button" className="btn btn-outline" disabled={busy} onClick={() => decideRecord(record, "REJECTED")}>Reject with reason</button></div>}{canManage && record.created_by_id === activeUser?.id && ["DRAFT", "REJECTED"].includes(record.status) && <div style={{ display: "flex", gap: 8, marginTop: 12 }}><button type="button" className="btn btn-outline" onClick={() => editRecord(record)}>Edit</button><button type="button" className="btn btn-outline" disabled={busy} onClick={() => deleteRecord(record)}>Delete draft</button></div>}</article>) : <EmptyState title="No community records yet" description="Notices, meeting minutes, and activities will appear here when recorded." />}
    </section>
  </PageWrapper>;
}

function SettingsPage({ activeUser, committeeOnly = false }) {
  const [roles, setRoles] = useState([]);
  const [roleUsers, setRoleUsers] = useState([]);
  const [roleAssignments, setRoleAssignments] = useState([]);
  const [roleLoading, setRoleLoading] = useState(false);
  const [roleError, setRoleError] = useState("");
  const [roleNotice, setRoleNotice] = useState("");
  const [activityLogs, setActivityLogs] = useState([]);
  const [activityError, setActivityError] = useState("");
  const [activityBusy, setActivityBusy] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [roleDraft, setRoleDraft] = useState({ name: "", description: "", permissions: [], is_active: true });
  const [assignmentTermStart, setAssignmentTermStart] = useState("");
  const [assignmentTermEnd, setAssignmentTermEnd] = useState("");
  const [assignmentMinutesReference, setAssignmentMinutesReference] = useState("");
  const [roleProofFiles, setRoleProofFiles] = useState({});
  const [roleProofTitles, setRoleProofTitles] = useState({});
  const [roleProofBusyId, setRoleProofBusyId] = useState(null);
  const [adminDraft, setAdminDraft] = useState({ full_name: "", email: "", phone_number: "", password: "" });
  const [adminBusy, setAdminBusy] = useState(false);
  const canManageRoles = ["ADMIN", "SUPER ADMIN"].includes(String(activeUser?.role || "").toUpperCase()) || activeUser?.permissions?.includes("roles.manage");
  const canCreateAdmins = ["ADMIN", "SUPER ADMIN"].includes(String(activeUser?.role || "").toUpperCase());
  const permissionOptions = [
    ["membership.view", "View member status"],
    ["membership.review", "Review membership applications"],
    ["documents.review", "Review verification documents"],
    ["members.manage", "Manage member records"],
    ["events.manage", "Manage events"],
    ["announcements.manage", "Manage announcements"],
    ["scholarships.review", "Review scholarships"],
    ["matrimonial.review", "Review matrimonial applications"],
    ["finance.manage", "Manage finance records"],
    ["reports.view", "View reports"],
    ["community.records.view", "View official community records"],
    ["community.records.manage", "Create community records and meeting minutes"],
    ["community.approve", "Approve committee notices and decisions"],
    ["marketplace.manage", "Manage marketplace engagement"],
    ["emergency.manage", "Review emergency support requests"],
    ["roles.manage", "Manage roles and assignments"],
  ];

  const loadRoleManagement = async () => {
    if (!canManageRoles) return;
    setRoleLoading(true);
    setRoleError("");
    try {
      const [roleRows, userRows, assignmentRows] = await Promise.all([
        authApi("/admin/roles"),
        authApi("/admin/roles/users"),
        authApi("/admin/roles/assignments"),
      ]);
      setRoles(Array.isArray(roleRows) ? roleRows : []);
      setRoleUsers(Array.isArray(userRows) ? userRows : []);
      setRoleAssignments(Array.isArray(assignmentRows) ? assignmentRows : []);
    } catch (error) {
      setRoleError(error.message || "Could not load role management.");
    } finally {
      setRoleLoading(false);
    }
  };

  const loadActivityLogs = async () => {
    if (!["ADMIN", "SUPER ADMIN"].includes(String(activeUser?.role || "").toUpperCase())) return;
    setActivityError("");
    try {
      const rows = await authApi("/admin/audit-logs?limit=100");
      setActivityLogs(Array.isArray(rows) ? rows : []);
    } catch (error) {
      setActivityError(error.message || "Could not load activity history.");
    }
  };

  const deleteActivityLog = async (entry) => {
    if (!window.confirm(`Delete this activity entry from ${new Date(entry.created_at).toLocaleString()}?`)) return;
    setActivityBusy(true);
    setActivityError("");
    try {
      await authApi(`/admin/audit-logs/${entry.id}`, { method: "DELETE" });
      setActivityLogs((current) => current.filter((row) => row.id !== entry.id));
    } catch (error) {
      setActivityError(error.message || "Could not delete the activity entry.");
    } finally {
      setActivityBusy(false);
    }
  };

  const clearActivityLogs = async () => {
    if (!activityLogs.length || !window.confirm("Permanently delete all activity history? This cannot be undone.")) return;
    setActivityBusy(true);
    setActivityError("");
    try {
      await authApi("/admin/audit-logs", { method: "DELETE" });
      setActivityLogs([]);
    } catch (error) {
      setActivityError(error.message || "Could not clear activity history.");
    } finally {
      setActivityBusy(false);
    }
  };

  useEffect(() => { loadRoleManagement(); loadActivityLogs(); }, [canManageRoles, activeUser?.role]);

  const saveRole = async (event) => {
    event.preventDefault();
    setRoleError("");
    setRoleNotice("");
    const method = editingRoleId ? "PATCH" : "POST";
    const path = editingRoleId ? `/admin/roles/${editingRoleId}` : "/admin/roles";
    try {
      await authApi(path, {
        method,
        body: JSON.stringify(roleDraft),
      });
      setRoleNotice(editingRoleId ? "Role updated." : "Role created.");
      setEditingRoleId(null);
      setRoleDraft({ name: "", description: "", permissions: [], is_active: true });
      await loadRoleManagement();
    } catch (error) {
      setRoleError(error.message || "Could not save this role.");
    }
  };

  const editRole = (role) => {
    setEditingRoleId(role.id);
    setRoleDraft({ name: role.name, description: role.description || "", permissions: role.permissions || [], is_active: role.is_active });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteRole = async (role) => {
    if (!window.confirm(`Delete the custom role “${role.name}”? This cannot be undone.`)) return;
    setRoleError("");
    setRoleNotice("");
    try {
      await authApi(`/admin/roles/${role.id}`, { method: "DELETE" });
      setRoleNotice(`Role “${role.name}” was deleted.`);
      if (editingRoleId === role.id) {
        setEditingRoleId(null);
        setRoleDraft({ name: "", description: "", permissions: [], is_active: true });
      }
      await loadRoleManagement();
    } catch (error) {
      setRoleError(error.message || "Could not delete this role.");
    }
  };

  const assignRole = async (userId, roleId) => {
    if (!roleId) return;
    const selectedRole = roles.find((role) => role.id === Number(roleId));
    const electedRoles = ["PRESIDENT / HEAD", "SECRETARY", "TREASURER", "DIRECTOR", "NOMINATED DIRECTOR"];
    if (electedRoles.includes(String(selectedRole?.name || "").trim().toUpperCase()) && (!assignmentTermStart || !assignmentTermEnd)) {
      setRoleNotice("");
      setRoleError("This elected committee role needs both term dates. Enter the start and end dates below, then assign the role again.");
      return;
    }
    setRoleError("");
    setRoleNotice("");
    try {
      await authApi(`/admin/roles/members/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({
          role_id: Number(roleId),
          term_start: assignmentTermStart || null,
          term_end: assignmentTermEnd || null,
          minutes_reference: assignmentMinutesReference.trim() || null,
        }),
      });
      setRoleNotice("Committee role assigned.");
      await loadRoleManagement();
    } catch (error) {
      setRoleError(error.message || "Could not assign this role.");
    }
  };

  const openElectionProof = async (proofDoc) => {
    const token = sessionStorage.getItem("potterCommunityAccessToken") || localStorage.getItem("token");
    const preview = window.open("", "_blank");
    try {
      const response = await fetch(`${AUTH_API_BASE}${proofDoc.file_url}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!response.ok) throw new Error("Could not open this election proof document.");
      const objectUrl = URL.createObjectURL(await response.blob());
      if (preview) {
        preview.opener = null;
        preview.location.href = objectUrl;
      } else {
        const link = document.createElement("a");
        link.href = objectUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.click();
      }
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch (error) {
      preview?.close();
      setRoleError(error.message || "Could not open this election proof document.");
    }
  };

  const deleteElectionProof = async (assignment, document) => {
    if (!window.confirm(`Remove “${document.title}” for ${assignment.member_name}?`)) return;
    setRoleError("");
    setRoleNotice("");
    try {
      await authApi(`/admin/roles/assignments/${assignment.id}/election-documents/${document.id}`, { method: "DELETE" });
      setRoleNotice("Election proof document removed.");
      await loadRoleManagement();
    } catch (error) {
      setRoleError(error.message || "Could not remove the election proof document.");
    }
  };

  const uploadElectionProofForMember = async (event, assignment) => {
    event.preventDefault();
    const file = roleProofFiles[assignment.id];
    if (!file) {
      setRoleError("Choose an election result or certificate file first.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setRoleError("Election proof files must be 5 MB or smaller.");
      return;
    }
    const formData = new FormData();
    formData.append("title", (roleProofTitles[assignment.id] || "").trim() || "Election result proof");
    formData.append("file", file);
    setRoleProofBusyId(assignment.id);
    setRoleError("");
    setRoleNotice("");
    try {
      await authApi(`/admin/roles/assignments/${assignment.id}/election-documents`, { method: "POST", body: formData });
      setRoleNotice(`Election proof added for ${assignment.member_name} (${assignment.role}).`);
      setRoleProofFiles((previous) => ({ ...previous, [assignment.id]: null }));
      setRoleProofTitles((previous) => ({ ...previous, [assignment.id]: "" }));
      await loadRoleManagement();
    } catch (error) {
      setRoleError(error.message || "Could not upload the election proof.");
    } finally {
      setRoleProofBusyId(null);
    }
  };

  const revokeRole = async (user) => {
    const reason = window.prompt(`Reason for removing ${user.full_name} from the committee? Their member account will remain active.`);
    if (!reason || reason.trim().length < 3) return;
    setRoleError("");
    setRoleNotice("");
    try {
      await authApi(`/admin/roles/members/${user.id}/revoke`, {
        method: "PATCH",
        body: JSON.stringify({ reason: reason.trim() }),
      });
      setRoleNotice(`${user.full_name} was removed from the committee. Their member account remains active, and the change is recorded in assignment history.`);
      await loadRoleManagement();
    } catch (error) {
      setRoleError(error.message || "Could not revoke this role.");
    }
  };

  const deleteMemberAccount = async (user) => {
    const confirmed = window.confirm(`Permanently delete ${user.full_name}'s member account, committee assignment history, uploaded documents, and personal applications? This cannot be undone.`);
    if (!confirmed) return;
    if (window.prompt(`Type DELETE to permanently remove ${user.full_name}'s account.`) !== "DELETE") return;
    setRoleError("");
    setRoleNotice("");
    try {
      await authApi(`/admin/roles/members/${user.id}`, { method: "DELETE" });
      setRoleNotice(`${user.full_name}'s member account and personal application data were permanently deleted.`);
      await loadRoleManagement();
    } catch (error) {
      setRoleError(error.message || "Could not delete this member account.");
    }
  };

  const createAdminAccount = async (event) => {
    event.preventDefault();
    setRoleError("");
    setRoleNotice("");
    setAdminBusy(true);
    try {
      const result = await authApi("/admin/roles/admins", {
        method: "POST",
        body: JSON.stringify({
          ...adminDraft,
          email: adminDraft.email.trim().toLowerCase(),
          phone_number: adminDraft.phone_number.trim() || null,
        }),
      });
      setAdminDraft({ full_name: "", email: "", phone_number: "", password: "" });
      setRoleNotice(`Admin account created for ${result.full_name} (${result.email}). They can now sign in.`);
    } catch (error) {
      setRoleError(error.message || "Could not create the Admin account.");
    } finally {
      setAdminBusy(false);
    }
  };

  return (
    <PageWrapper>
      <PageHeader
        title={committeeOnly ? "Committee & Roles" : "Settings"}
        description={committeeOnly ? "Assign committee roles and manage future role needs." : "Manage your account preferences."}
      />

      {canManageRoles && <section style={{ marginBottom: 20, padding: 18, border: "1px solid #ead8cc", borderRadius: 14, background: "#fffdfb" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div><h2 style={{ margin: "0 0 5px", color: "#503326", fontSize: 19 }}>Roles & committee assignments</h2><p style={{ margin: 0, color: "#806b5e", fontSize: 12 }}>Create roles as committee needs change, set their permissions, and assign them to approved members.</p></div>
          <button type="button" className="btn btn-outline" onClick={loadRoleManagement} disabled={roleLoading}>{roleLoading ? "Refreshing…" : "Refresh"}</button>
        </div>

        <details style={{ marginTop: 14, padding: 12, border: "1px solid #f0e2d8", borderRadius: 11 }}>
        <summary style={{ color: "#624b3d", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Create or edit a committee role</summary>
        <form onSubmit={saveRole} style={{ display: "grid", gap: 12, marginTop: 12, padding: 14, border: "1px solid #f0e2d8", borderRadius: 11 }}>
          <h3 style={{ margin: 0, color: "#503326", fontSize: 15 }}>{editingRoleId ? "Edit role" : "Create a role"}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
            <input aria-label="Role name" required minLength={2} maxLength={100} value={roleDraft.name} onChange={(event) => setRoleDraft({ ...roleDraft, name: event.target.value })} placeholder="e.g. Potter Market Engagement Coordinator" style={{ padding: 11, border: "1px solid #ddc9b7", borderRadius: 8, color: "#503326" }} />
            <input aria-label="Role description" maxLength={255} value={roleDraft.description} onChange={(event) => setRoleDraft({ ...roleDraft, description: event.target.value })} placeholder="Role responsibilities" style={{ padding: 11, border: "1px solid #ddc9b7", borderRadius: 8, color: "#503326" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 8 }}>
            {permissionOptions.map(([permission, label]) => <label key={permission} style={{ display: "flex", gap: 8, alignItems: "center", padding: "8px 10px", border: "1px solid #efe2d8", borderRadius: 8, color: "#624b3d", fontSize: 12 }}><input type="checkbox" checked={roleDraft.permissions.includes(permission)} onChange={(event) => setRoleDraft({ ...roleDraft, permissions: event.target.checked ? [...roleDraft.permissions, permission] : roleDraft.permissions.filter((item) => item !== permission) })} />{label}</label>)}
          </div>
          <label style={{ display: "flex", gap: 8, alignItems: "center", color: "#624b3d", fontSize: 12 }}><input type="checkbox" checked={roleDraft.is_active} onChange={(event) => setRoleDraft({ ...roleDraft, is_active: event.target.checked })} />Role is active</label>
          <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}><button type="submit" className="btn btn-primary">{editingRoleId ? "Save role" : "Create role"}</button>{editingRoleId && <button type="button" className="btn btn-outline" onClick={() => { setEditingRoleId(null); setRoleDraft({ name: "", description: "", permissions: [], is_active: true }); }}>Cancel</button>}</div>
        </form>
        </details>

        {roleError && <p role="alert" style={{ color: "#a13d2d", fontSize: 12 }}>{roleError}</p>}
        {roleNotice && <p role="status" style={{ color: "#39734a", fontSize: 12 }}>{roleNotice}</p>}

        {canCreateAdmins && <details style={{ marginTop: 14, padding: 12, border: "1px solid #f0e2d8", borderRadius: 11 }}>
          <summary style={{ color: "#624b3d", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Create a platform Admin account</summary>
          <form onSubmit={createAdminAccount} style={{ display: "grid", gap: 10, marginTop: 12 }}>
            <p style={{ margin: 0, color: "#806b5e", fontSize: 12 }}>Admin access is created here by an existing Admin. Public sign-up remains for member applications only. Sign in with the email or phone number provided.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 9 }}>
              <input aria-label="New Admin full name" required minLength={2} maxLength={160} value={adminDraft.full_name} onChange={(event) => setAdminDraft({ ...adminDraft, full_name: event.target.value })} placeholder="Full name" style={{ padding: 10, border: "1px solid #ddc9b7", borderRadius: 8 }} />
              <input aria-label="New Admin email" type="email" value={adminDraft.email} onChange={(event) => setAdminDraft({ ...adminDraft, email: event.target.value })} placeholder="Email address (optional)" style={{ padding: 10, border: "1px solid #ddc9b7", borderRadius: 8 }} />
              <input aria-label="New Admin phone number" type="tel" minLength={10} maxLength={20} value={adminDraft.phone_number} onChange={(event) => setAdminDraft({ ...adminDraft, phone_number: event.target.value })} placeholder="Phone number (email or phone required)" style={{ padding: 10, border: "1px solid #ddc9b7", borderRadius: 8 }} />
              <input aria-label="New Admin password" type="password" required minLength={10} maxLength={128} value={adminDraft.password} onChange={(event) => setAdminDraft({ ...adminDraft, password: event.target.value })} placeholder="Password (10+ characters)" style={{ padding: 10, border: "1px solid #ddc9b7", borderRadius: 8 }} />
            </div>
            <div><button type="submit" className="btn btn-primary" disabled={adminBusy}>{adminBusy ? "Creating…" : "Create Admin account"}</button></div>
          </form>
        </details>}

        <div style={{ display: "grid", gap: 9, marginTop: 14 }}>
          {roles.map((role) => <div key={role.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", padding: 12, border: "1px solid #efe2d8", borderRadius: 9 }}><div><strong style={{ color: "#503326" }}>{role.name}</strong><div style={{ color: "#806b5e", fontSize: 11, marginTop: 3 }}>{role.description || "No description"} · {role.users_count} assigned · {role.is_active ? "Active" : "Inactive"}</div><div style={{ color: "#806b5e", fontSize: 11, marginTop: 3 }}>Permissions: {(role.permissions || []).length ? role.permissions.join(", ") : "None"}</div></div><div style={{ display: "flex", gap: 8 }}><button type="button" className="btn btn-outline" onClick={() => editRole(role)}>Edit</button>{!role.is_protected && <button type="button" className="btn btn-outline" onClick={() => deleteRole(role)}>Delete role</button>}</div></div>)}
        </div>

        <h3 style={{ margin: "20px 0 8px", color: "#503326", fontSize: 15 }}>Assign or end a role for an approved member</h3>
        <div style={{ margin: "10px 0 13px", padding: 10, border: "1px solid #f0e2d8", borderRadius: 9 }}>
        <strong style={{ color: "#624b3d", fontSize: 11 }}>Term dates and meeting reference</strong>
        <p style={{ color: "#806b5e", fontSize: 11, margin: "4px 0 0" }}>Term start and end dates are required for President / Head, Secretary, Treasurer, Director, and Nominated Director roles. They are optional for other roles.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 9, marginTop: 10 }}>
          <label style={{ display: "grid", gap: 5, color: "#806b5e", fontSize: 11 }}>Term starts<input type="date" value={assignmentTermStart} onChange={(event) => setAssignmentTermStart(event.target.value)} style={{ padding: 9, border: "1px solid #ddc9b7", borderRadius: 8, background: "#fffdfb" }} /></label>
          <label style={{ display: "grid", gap: 5, color: "#806b5e", fontSize: 11 }}>Term ends<input type="date" min={assignmentTermStart || undefined} value={assignmentTermEnd} onChange={(event) => setAssignmentTermEnd(event.target.value)} style={{ padding: 9, border: "1px solid #ddc9b7", borderRadius: 8, background: "#fffdfb" }} /></label>
          <label style={{ display: "grid", gap: 5, color: "#806b5e", fontSize: 11 }}>Signed minutes / resolution reference<input value={assignmentMinutesReference} onChange={(event) => setAssignmentMinutesReference(event.target.value)} maxLength={255} placeholder="Optional meeting reference" style={{ padding: 9, border: "1px solid #ddc9b7", borderRadius: 8, background: "#fffdfb" }} /></label>
        </div>
        </div>
        {roleUsers.length ? <div style={{ display: "grid", gap: 8 }}>{roleUsers.map((user) => <div key={user.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", padding: 11, border: "1px solid #efe2d8", borderRadius: 9 }}><div><strong style={{ color: "#503326", fontSize: 13 }}>{user.full_name}</strong><div style={{ color: "#806b5e", fontSize: 11 }}>{user.membership_number || user.email || `Member #${user.id}`} · Current role: {user.role}</div></div><div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}><select aria-label={`Assign role to ${user.full_name}`} value="" onChange={(event) => assignRole(user.id, event.target.value)} style={{ minWidth: 220, padding: 9, border: "1px solid #ddc9b7", borderRadius: 8, background: "#fffdfb", color: "#503326" }}><option value="" disabled>Assign committee role…</option>{roles.filter((role) => role.is_active && role.name.toUpperCase() !== "ADMIN").map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select>{user.role_id && !["CITIZEN", "ADMIN", "SUPER ADMIN"].includes(user.role.toUpperCase()) && <button type="button" className="btn btn-outline" onClick={() => revokeRole(user)}>Remove from committee</button>}{canCreateAdmins && !["ADMIN", "SUPER ADMIN"].includes(user.role.toUpperCase()) && <button type="button" className="btn btn-outline" onClick={() => deleteMemberAccount(user)}>Delete member account</button>}</div></div>)}</div> : <p style={{ color: "#806b5e", fontSize: 12 }}>No approved active members are available for role assignment.</p>}

        <details style={{ marginTop: 16, padding: 10, border: "1px solid #f0e2d8", borderRadius: 9 }}>
        <summary style={{ color: "#624b3d", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Committee terms, election proof & handover history</summary>
        {roleAssignments.length ? <div style={{ display: "grid", gap: 9, marginTop: 10 }}>{roleAssignments.map((assignment) => <article key={assignment.id} style={{ display: "grid", gap: 9, padding: 12, border: "1px solid #efe2d8", borderRadius: 9, color: "#624b3d", fontSize: 11 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(145px,1fr))", gap: 8 }}>
            <strong>{assignment.member_name} · {assignment.role}</strong><span>Status: {assignment.status}</span><span>{assignment.term_start || "Start not set"} → {assignment.term_end || "End not set"}</span><span>{assignment.minutes_reference || "No minutes reference"}</span><span>{assignment.end_reason || `Assigned ${new Date(assignment.assigned_at).toLocaleString()}`}</span>
          </div>
          <div style={{ padding: 10, border: "1px solid #f0e2d8", borderRadius: 8, background: "#fffaf6" }}>
            <strong style={{ display: "block", marginBottom: 7, color: "#503326" }}>Election result proof</strong>
            {assignment.election_documents?.length ? <div style={{ display: "grid", gap: 6, marginBottom: 9 }}>{assignment.election_documents.map((proofDoc) => <div key={proofDoc.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 9, flexWrap: "wrap" }}><span>{proofDoc.title} · {proofDoc.original_filename}<small style={{ display: "block", color: "#806b5e", marginTop: 2 }}>Added {new Date(proofDoc.created_at).toLocaleString()}</small></span><div style={{ display: "flex", gap: 7 }}><button type="button" className="btn btn-outline" onClick={() => openElectionProof(proofDoc)}>View</button><button type="button" className="btn btn-outline" onClick={() => deleteElectionProof(assignment, proofDoc)}>Remove</button></div></div>)}</div> : <p style={{ margin: "0 0 8px", color: "#806b5e" }}>No election proof document uploaded for this assignment yet.</p>}
            <form onSubmit={(event) => uploadElectionProofForMember(event, assignment)} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 8, alignItems: "center", marginTop: 10 }}>
              <input aria-label={`Election proof title for ${assignment.member_name}`} value={roleProofTitles[assignment.id] || ""} onChange={(event) => setRoleProofTitles((previous) => ({ ...previous, [assignment.id]: event.target.value }))} maxLength={160} placeholder="Document title (optional)" style={{ minWidth: 0, padding: 9, border: "1px solid #ddc9b7", borderRadius: 8 }} />
              <input aria-label={`Election proof file for ${assignment.member_name}`} type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={(event) => setRoleProofFiles((previous) => ({ ...previous, [assignment.id]: event.target.files?.[0] || null }))} style={{ minWidth: 0, color: "#624b3d", fontSize: 11 }} />
              <button type="submit" className="btn btn-outline" disabled={roleProofBusyId === assignment.id}>{roleProofBusyId === assignment.id ? "Uploading…" : "Add election proof"}</button>
              {roleProofFiles[assignment.id] && <small style={{ gridColumn: "1 / -1", color: "#806b5e" }}>{roleProofFiles[assignment.id].name} · PDF, JPG, or PNG · Max 5 MB</small>}
            </form>
          </div>
        </article>)}</div> : <p style={{ color: "#806b5e", fontSize: 12 }}>New assignments and handovers will be recorded here.</p>}
        </details>
      </section>}

      {["ADMIN", "SUPER ADMIN"].includes(String(activeUser?.role || "").toUpperCase()) && <details style={{ marginBottom: 20, padding: 14, border: "1px solid #ead8cc", borderRadius: 14, background: "#fffdfb" }}>
        <summary style={{ color: "#503326", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Activity history</summary>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div><h2 style={{ margin: "0 0 5px", color: "#503326", fontSize: 19 }}>Activity history</h2><p style={{ margin: 0, color: "#806b5e", fontSize: 12 }}>Administrative changes with timestamp, account, result, and connecting IP address.</p></div>
          <div style={{ display: "flex", gap: 8 }}><button type="button" className="btn btn-outline" disabled={activityBusy} onClick={loadActivityLogs}>Refresh</button><button type="button" className="btn btn-outline" disabled={activityBusy || !activityLogs.length} onClick={clearActivityLogs}>Clear history</button></div>
        </div>
        {activityError && <p role="alert" style={{ color: "#a13d2d", fontSize: 12 }}>{activityError}</p>}
        {activityLogs.length ? <div style={{ display: "grid", gap: 7, marginTop: 14 }}>{activityLogs.map((entry) => <div key={entry.id} style={{ display: "grid", gridTemplateColumns: "minmax(130px, 1.2fr) minmax(110px, 1fr) minmax(130px, 1.3fr) minmax(90px, .7fr) auto", gap: 10, alignItems: "center", padding: 10, border: "1px solid #efe2d8", borderRadius: 8, color: "#624b3d", fontSize: 11, overflowWrap: "anywhere" }}><span>{new Date(entry.created_at).toLocaleString()}</span><strong>{entry.actor_name}</strong><span>{entry.action} {entry.resource} · {entry.status_code}</span><span>IP: {entry.ip_address || "Unavailable"}</span><button type="button" className="btn btn-outline" disabled={activityBusy} onClick={() => deleteActivityLog(entry)}>Delete</button></div>)}</div> : !activityError && <p style={{ color: "#806b5e", fontSize: 12, marginTop: 14 }}>No recorded activity yet.</p>}
      </details>}

      {!committeeOnly && <div className="settings-card">
        {[
          [
            "Account Security",
            "Manage your password and security preferences.",
          ],
          [
            "Email Notifications",
            "Receive important community updates by email.",
          ],
          [
            "Emergency Notifications",
            "Receive important emergency alerts.",
          ],
          [
            "Matrimonial Notifications",
            "Receive notifications about compatible matches.",
          ],
        ].map(([title, text]) => (
          <div
            className="setting-row"
            key={title}
          >
            <div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>

            <label className="switch">
              <input
                type="checkbox"
                defaultChecked
              />
              <span></span>
            </label>
          </div>
        ))}
      </div>}
    </PageWrapper>
  );
}

/* =========================================================
   AUTH MODAL
========================================================= */

function AuthModal({
  type,
  close,
  onAuthenticated,
  onRegistered,
}) {
  const [mode, setMode] = useState(type);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [certificateFile, setCertificateFile] = useState(null);
  const [certificateError, setCertificateError] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [signupOtpSent, setSignupOtpSent] = useState(false);
  const [signupOtpVerified, setSignupOtpVerified] = useState(false);
  const signupFormRef = useRef(null);
  const [signupEmail, setSignupEmail] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);

  const sendSignupEmailVerification = async () => {
    setAuthError(""); setAuthNotice("");
    const form = signupFormRef.current;
    if (!form) return;
    const email = signupEmail.trim().toLowerCase();
    const password = form.querySelector('[name="password"]')?.value || "";
    const confirmation = form.querySelector('[name="confirmPassword"]')?.value || "";
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setAuthError("Enter a valid email address first."); return; }
    if (password.length < 8 || password !== confirmation) { setAuthError("Enter matching passwords (at least 8 characters) before verifying your email."); return; }
    setAuthBusy(true);
    try {
      let user = firebaseAuth.currentUser;
      if (user && user.email?.toLowerCase() !== email) {
        await signOut(firebaseAuth);
        user = null;
      }
      if (!user) {
        try {
          const result = await createUserWithEmailAndPassword(firebaseAuth, email, password);
          user = result.user;
        } catch (error) {
          if (error.code !== "auth/email-already-in-use") throw error;
          const result = await signInWithEmailAndPassword(firebaseAuth, email, password);
          user = result.user;
        }
      }
      await reload(user);
      if (user.emailVerified) {
        setEmailVerified(true);
        setAuthNotice("Email address is already verified.");
      } else {
        await sendEmailVerification(user);
        setEmailVerificationSent(true);
        setEmailVerified(false);
        setAuthNotice("Verification link sent. Open your email, verify it, then click 'I've verified my email'.");
      }
    } catch (error) {
      setAuthError(error.code === "auth/too-many-requests" ? "Too many requests. Please wait before trying again." : error.code === "auth/invalid-credential" ? "This email already has a Firebase account with a different password." : error.message || "Unable to send verification email.");
    } finally { setAuthBusy(false); }
  };

  const checkSignupEmailVerification = async () => {
    setAuthError(""); setAuthNotice(""); setAuthBusy(true);
    try {
      const user = firebaseAuth.currentUser;
      if (!user || user.email?.toLowerCase() !== signupEmail.trim().toLowerCase()) {
        throw new Error("Email session not found. Please send the verification link again.");
      }
      await reload(user);
      if (!user.emailVerified) throw new Error("Email is not verified yet. Open the link in your inbox, then try again.");
      setEmailVerified(true);
      setAuthNotice("Email address verified successfully.");
    } catch (error) { setEmailVerified(false); setAuthError(error.message || "Email verification failed."); }
    finally { setAuthBusy(false); }
  };

  const [phoneVerificationToken, setPhoneVerificationToken] = useState("");
  const [loginOtpStep, setLoginOtpStep] = useState(false);
  const [loginChallengeId, setLoginChallengeId] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authNotice, setAuthNotice] = useState("");
  const [showSupport, setShowSupport] = useState(false);
  const [supportBusy, setSupportBusy] = useState(false);
  const [supportError, setSupportError] = useState("");
  const [supportNotice, setSupportNotice] = useState("");
  const [forgotPassword, setForgotPassword] = useState(false);
  const [forgotPhone, setForgotPhone] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotChallengeId, setForgotChallengeId] = useState("");
  const [forgotOtpSent, setForgotOtpSent] = useState(false);
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");

  const sendPasswordResetOtp = async () => {
    setAuthError("");
    setAuthNotice("");

    const phoneValue = forgotPhone.replace(/\D/g, "");

    if (!/^[6-9]\d{9}$/.test(phoneValue)) {
      setAuthError("Enter a valid 10-digit Indian mobile number.");
      return;
    }

    setAuthBusy(true);

    try {
      const result = await authApi("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({
          phone_number: phoneValue,
        }),
      });

      setForgotPhone(phoneValue);
      setForgotOtpSent(true);
      setForgotOtp("");
      setForgotChallengeId("");

      if (result.debug_otp) {
        setAuthNotice(`Development OTP: ${result.debug_otp}`);
      } else {
        setAuthNotice(
          result.message ||
            "If the account is eligible, password reset instructions will be sent."
        );
      }
    } catch (error) {
      setAuthError(
        error.message || "Unable to send reset OTP. Please try again."
      );
    } finally {
      setAuthBusy(false);
    }
  };

  const resetPasswordWithOtp = async (e) => {
    e.preventDefault();

    setAuthError("");
    setAuthNotice("");

    const phoneValue = forgotPhone.replace(/\D/g, "");
    const otpValue = forgotOtp.trim();

    if (!/^[6-9]\d{9}$/.test(phoneValue)) {
      setAuthError("Enter a valid 10-digit Indian mobile number.");
      return;
    }

    if (!/^\d{6}$/.test(otpValue)) {
      setAuthError("Enter the 6-digit OTP.");
      return;
    }

    if (forgotNewPassword.length < 8) {
      setAuthError("Your new password must contain at least 8 characters.");
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setAuthError("The new passwords do not match.");
      return;
    }

    setAuthBusy(true);

    try {
      const otpResult = await authApi("/auth/verify-reset-otp", {
        method: "POST",
        body: JSON.stringify({
          phone_number: phoneValue,
          otp: otpValue,
        }),
      });

      if (!otpResult.reset_token) {
        throw new Error(
          "The server did not return a password reset token."
        );
      }

      const resetResult = await authApi("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          reset_token: otpResult.reset_token,
          new_password: forgotNewPassword,
          confirm_password: forgotConfirmPassword,
        }),
      });

      setAuthNotice(
        resetResult.message ||
          "Password reset successfully. You can now sign in."
      );

      setForgotPassword(false);
      setForgotOtpSent(false);
      setForgotPhone("");
      setForgotOtp("");
      setForgotChallengeId("");
      setForgotNewPassword("");
      setForgotConfirmPassword("");
      setMode("signin");
    } catch (error) {
      setAuthError(
        error.message || "Unable to reset password. Please try again."
      );
    } finally {
      setAuthBusy(false);
    }
  };

  const handleCertificateChange = (e) => {
    const file = e.target.files?.[0];
    setCertificateError("");

    if (!file) return;

    const allowedExtensions = /\.(pdf|jpe?g|png)$/i;
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];

    if (!allowedTypes.includes(file.type) && !allowedExtensions.test(file.name)) {
      setCertificateError("Please choose a PDF, JPG, or PNG file.");
      e.target.value = "";
      setCertificateFile(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setCertificateError("The file must be 5 MB or smaller.");
      e.target.value = "";
      setCertificateFile(null);
      return;
    }

    setCertificateFile(file);
  };

  const removeCertificate = () => {
    setCertificateFile(null);
    setCertificateError("");
    const input = document.getElementById("caste-certificate-upload");
    if (input) input.value = "";
  };

  const sendSignupOtp = async () => {
    setAuthError("");
    setAuthNotice("");
    const normalizedPhone = phone.replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(normalizedPhone)) {
      setAuthError("Enter a valid 10-digit Indian mobile number.");
      return;
    }
    setAuthBusy(true);
    try {
      const result = await authApi("/auth/request-otp", {
        method: "POST", body: JSON.stringify({ phone_number: normalizedPhone }),
      });
      if (result.phone_verified) {
        setSignupOtpSent(false);
        setAuthError("This phone number already has an account. Sign in instead.");
        setMode("signin");
        return;
      }
      setSignupOtpSent(true);
      setSignupOtpVerified(false);
      setPhoneVerificationToken("");
      setOtp("");

      if (result.debug_otp) {
        setAuthNotice(`Development OTP: ${result.debug_otp}`);
      } else {
        setAuthNotice(result.message || "OTP sent. Check your phone and enter the code below.");
      }
    } catch (error) {
      setAuthError(error.message || "Could not send OTP. Check your connection and try again.");
    } finally { setAuthBusy(false); }
  };

  const verifySignupOtp = async () => {
    setAuthError("");
    setAuthNotice("");
    if (!/^\d{4,8}$/.test(otp.trim())) { setAuthError("Enter the OTP you received."); return; }
    setAuthBusy(true);
    try {
      const result = await authApi("/auth/verify-otp", {
        method: "POST", body: JSON.stringify({ phone_number: phone.replace(/\D/g, ""), otp: otp.trim() }),
      });
      if (!result.verified || !result.verificationToken) {
        if (result.phone_verified) {
          setMode("signin");
          throw new Error("This phone number belongs to an existing account. Sign in instead.");
        }
        throw new Error("The server did not confirm OTP verification. Please try again.");
      }
      setSignupOtpVerified(true);
      setPhoneVerificationToken(result.verificationToken);
      setAuthNotice("Phone number verified successfully.");
      setAuthError("");
    } catch (error) {
      setSignupOtpVerified(false);
      setPhoneVerificationToken("");
      setAuthError(error.message || "OTP verification failed.");
    } finally { setAuthBusy(false); }
  };

  const submit = async (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthNotice("");
    const form = e.currentTarget;
    const formData = new FormData(form);
    const password = String(formData.get("password") || "");
    if (!password) { setAuthError("Password is required every time you sign in."); return; }
    setAuthBusy(true);
    try {
      if (mode === "signup") {
        const confirmPassword = String(formData.get("confirmPassword") || "");
        const dobValue = String(formData.get("dateOfBirth") || "");
        const dob = dobValue ? new Date(`${dobValue}T00:00:00`) : null;
        const today = new Date();
        let age = dob ? today.getFullYear() - dob.getFullYear() : -1;
        if (dob && (today.getMonth() < dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate()))) age -= 1;
        if (password !== confirmPassword) throw new Error("Password and confirm password must match.");
        if (password.length < 8) throw new Error("Use a password with at least 8 characters.");
        if (!dob || Number.isNaN(dob.getTime()) || age < 18) throw new Error("Members must be at least 18 years old. Please check the date of birth.");
        if (!certificateFile) { setCertificateError("Please upload your caste/community certificate to continue."); throw new Error("Please upload your caste/community certificate to continue."); }
        if (!signupOtpVerified || !phoneVerificationToken) throw new Error("Verify your phone number with OTP before submitting the membership request.");
        const firebaseUser = firebaseAuth.currentUser;
        if (!firebaseUser || firebaseUser.email?.toLowerCase() !== String(formData.get("email") || "").trim().toLowerCase()) {
          throw new Error("Verify the email address entered in the signup form.");
        }
        await reload(firebaseUser);
        if (!firebaseUser.emailVerified) { setEmailVerified(false); throw new Error("Verify your email through the Firebase verification link before registering."); }
        const firebaseIdToken = await firebaseUser.getIdToken(true);
        formData.set("firebaseIdToken", firebaseIdToken);


        formData.set("full_name", String(formData.get("fullName") || "").trim());
        formData.set("phone", phone.replace(/\D/g, ""));
        formData.set("phoneVerificationToken", phoneVerificationToken);
        if (certificateFile) formData.set("certificate", certificateFile);
        const result = await authApi("/auth/register", { method: "POST", body: formData });
        setAuthNotice(result.message || "Your account request was submitted successfully.");
        onRegistered();
      } else {
        const identifier = String(formData.get("identifier") || "").trim();

        if (!identifier) {
          throw new Error("Enter your email address or phone number.");
        }

        const result = await authApi("/auth/login", {
          method: "POST",
          body: JSON.stringify({
            identifier,
            password,
          }),
        });

        if (!result.access_token) {
          throw new Error("The server did not return an access token.");
        }

        // Store the backend JWT for authenticated API requests.
        sessionStorage.setItem(
          "potterCommunityAccessToken",
          result.access_token
        );

        // Also keep localStorage compatible with the existing API client.
        localStorage.setItem("token", result.access_token);

        let user;
        try {
          user = await authApi("/auth/me", { method: "GET" });
        } catch (error) {
          sessionStorage.removeItem("potterCommunityAccessToken");
          localStorage.removeItem("token");
          throw new Error(error.message || "Signed in, but your account profile could not be loaded. Please try again.");
        }

        const serverRole =
          user?.role ||
          result.role ||
          "General Member";

        if (user) {
          try {
            sessionStorage.setItem(
              "potterCommunityUser",
              JSON.stringify(user)
            );

            const existingProfile = JSON.parse(
              localStorage.getItem("potterProfile") || "{}"
            );

            const syncedProfile = {
              ...existingProfile,
              fullName: user.full_name || existingProfile.fullName || "",
              email: user.email || existingProfile.email || "",
              phone: user.phone_number || existingProfile.phone || "",
              membershipStatus:
                user.membership_status ||
                existingProfile.membershipStatus ||
                "PENDING",
              membershipId:
                user.membership_number ||
                existingProfile.membershipId ||
                "",
            };

            localStorage.setItem(
              "potterProfile",
              JSON.stringify(syncedProfile)
            );
          } catch {}
        }

        onAuthenticated(serverRole, user);
      }
    } catch (error) {
      setAuthError(error.message || "Unable to complete this request. Please try again.");
    } finally { setAuthBusy(false); }
  };

  const submitSupportInquiry = async (event) => {
    event.preventDefault();
    setSupportError(""); setSupportNotice("");
    const form = event.currentTarget;
    const formData = new FormData(form);
    setSupportBusy(true);
    try {
      const result = await authApi("/support/inquiries", {
        method: "POST",
        body: JSON.stringify({
          full_name: String(formData.get("supportName") || "").trim(),
          email: String(formData.get("supportEmail") || "").trim() || null,
          phone_number: String(formData.get("supportPhone") || "").trim() || null,
          category: String(formData.get("supportCategory") || "Other"),
          message: String(formData.get("supportMessage") || "").trim(),
        }),
      });
      setSupportNotice(result.message || "Your enquiry has been received.");
      form.reset();
    } catch (error) { setSupportError(error.message || "Could not submit your enquiry. Please try again."); }
    finally { setSupportBusy(false); }
  };

  if (forgotPassword) {
    return (
      <div className="modal-overlay" style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, boxSizing: "border-box", overflowY: "auto", zIndex: 9999 }}>
        <div className="auth-modal" style={{ width: "min(395px, calc(100vw - 32px))", maxWidth: 395, maxHeight: "calc(100dvh - 32px)", overflowY: "auto", boxSizing: "border-box", margin: "auto" }}>
          <button className="modal-close" type="button" onClick={() => { setForgotPassword(false); setAuthError(""); setAuthNotice(""); }} aria-label="Close password reset">×</button>
          <div className="auth-logo"><span>🏺</span></div>
          <h2>Forgot Password</h2>
          {!forgotOtpSent ? (
            <div style={{ display: "grid", gap: 14 }}>
              <div className="form-group">
                <label htmlFor="forgot-phone">Registered Phone Number</label>
                <input id="forgot-phone" type="tel" autoComplete="tel" value={forgotPhone} onChange={(e) => setForgotPhone(e.target.value)} placeholder="Enter your registered mobile number" required />
              </div>
              <button className="auth-submit" type="button" disabled={authBusy} onClick={sendPasswordResetOtp}>
                {authBusy ? "Sending OTP…" : "Send Reset OTP"} <ArrowRight size={17} />
              </button>
            </div>
          ) : (
            <form onSubmit={resetPasswordWithOtp} style={{ display: "grid", gap: 13 }}>
              <div className="form-group">
                <label htmlFor="forgot-otp">OTP</label>
                <input id="forgot-otp" inputMode="numeric" autoComplete="one-time-code" value={forgotOtp} onChange={(e) => setForgotOtp(e.target.value.replace(/\\D/g, "").slice(0, 8))} placeholder="Enter OTP" required />
              </div>
              <div className="form-group">
                <label htmlFor="forgot-new-password">New Password</label>
                <input id="forgot-new-password" type="password" autoComplete="new-password" value={forgotNewPassword} onChange={(e) => setForgotNewPassword(e.target.value)} placeholder="At least 8 characters" required minLength={8} />
              </div>
              <div className="form-group">
                <label htmlFor="forgot-confirm-password">Confirm New Password</label>
                <input id="forgot-confirm-password" type="password" autoComplete="new-password" value={forgotConfirmPassword} onChange={(e) => setForgotConfirmPassword(e.target.value)} placeholder="Re-enter new password" required minLength={8} />
              </div>
              <button className="auth-submit" type="submit" disabled={authBusy}>
                {authBusy ? "Resetting Password…" : "Verify OTP & Reset Password"} <ArrowRight size={17} />
              </button>
              <button type="button" className="auth-switch" style={{ border: 0, background: "transparent", cursor: "pointer" }} onClick={sendPasswordResetOtp} disabled={authBusy}>Resend OTP</button>
            </form>
          )}
          {authError && <div role="alert" style={{ marginTop: 12, padding: 10, borderRadius: 9, background: "#fff1f0", color: "#b42318", fontSize: 12 }}>{authError}</div>}
          {authNotice && <div role="status" style={{ marginTop: 12, padding: 10, borderRadius: 9, background: "#f0faf2", color: "#216b35", fontSize: 12 }}>{authNotice}</div>}
          <div className="auth-switch" style={{ marginTop: 16 }}>
            Remember your password? <button type="button" onClick={() => { setForgotPassword(false); setAuthError(""); setAuthNotice(""); setMode("signin"); }}>Sign In</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="modal-overlay"
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        boxSizing: "border-box",
        overflowY: "auto",
        zIndex: 9999,
      }}
    >
      <div
        className={`auth-modal${mode === "signup" ? " auth-modal-signup" : ""}`}
        style={{
          width: mode === "signup" ? "min(760px, calc(100vw - 32px))" : showSupport ? "min(560px, calc(100vw - 32px))" : "min(395px, calc(100vw - 32px))",
          maxWidth: mode === "signup" ? "760px" : showSupport ? "560px" : "395px",
          maxHeight: "calc(100dvh - 32px)",
          overflowY: "auto",
          boxSizing: "border-box",
          flexShrink: 0,
          margin: "auto",
        }}
      >
        <button
          className="modal-close"
          type="button"
          onClick={close}
        >
          <X size={20} />
        </button>

        <div className="auth-logo">
          <span>🏺</span>
        </div>

        <h2>{showSupport ? "Help & Support" : mode === "signin" ? "Welcome Back" : "Join Potter Community"}</h2>
        {showSupport ? (
          <>
            <p style={{ color: "#806b5e", fontSize: 13, lineHeight: 1.55, margin: "0 0 16px" }}>Anyone can contact the Potter Community team. Tell us what information or help you need.</p>
            {supportNotice ? <div role="status" style={{ padding: 14, borderRadius: 10, background: "#f0faf2", color: "#216b35", fontSize: 13, lineHeight: 1.5 }}>{supportNotice}</div> : <form onSubmit={submitSupportInquiry} style={{ display: "grid", gap: 12 }}>
              <div className="form-group"><label htmlFor="support-name">Your name</label><input id="support-name" name="supportName" autoComplete="name" required minLength={2} maxLength={160} placeholder="Enter your name" /></div>
              <div className="form-group"><label htmlFor="support-email">Email address <span style={{ color: "#806b5e", fontWeight: 400 }}>(or phone number)</span></label><input id="support-email" name="supportEmail" type="email" autoComplete="email" placeholder="you@example.com" /></div>
              <div className="form-group"><label htmlFor="support-phone">Phone number</label><input id="support-phone" name="supportPhone" type="tel" autoComplete="tel" placeholder="Optional if you provided email" maxLength={20} /></div>
              <div className="form-group"><label htmlFor="support-category">What do you need help with?</label><select id="support-category" name="supportCategory" defaultValue="Signup and membership"><option>Signup and membership</option><option>OTP or sign-in</option><option>Documents</option><option>Community information</option><option>Marketplace</option><option>Other</option></select></div>
              <div className="form-group"><label htmlFor="support-message">Your question</label><textarea id="support-message" name="supportMessage" rows={4} required minLength={10} maxLength={3000} placeholder="Describe the information or help you need" /></div>
              {supportError && <div role="alert" style={{ padding: 10, borderRadius: 9, background: "#fff1f0", color: "#b42318", fontSize: 12 }}>{supportError}</div>}
              <button type="submit" className="auth-submit" disabled={supportBusy}>{supportBusy ? "Sending…" : "Send enquiry"} {!supportBusy && <ArrowRight size={17} />}</button>
            </form>}
            <div className="auth-switch" style={{ marginTop: 16 }}> <button type="button" onClick={() => { setShowSupport(false); setSupportError(""); setSupportNotice(""); }}>Back to {mode === "signup" ? "Sign Up" : "Sign In"}</button></div>
          </>
        ) : <>
        <form ref={signupFormRef} onSubmit={submit} className={mode === "signup" ? "auth-form-signup" : ""}>
          {mode === "signup" && (
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="fullName"
                placeholder="As shown on your 10th marks sheet"
                autoComplete="name"
                required
              />
            </div>
          )}

          {mode === "signup" ? (
            <>
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" name="email" inputMode="email" autoComplete="email" placeholder="Enter your personal email address" required value={signupEmail} onChange={(e) => { setSignupEmail(e.target.value); setEmailVerified(false); setEmailVerificationSent(false); }} />
              </div>
              <div className="form-group">
                <label>Phone Number <span style={{ color: "#b45335" }}>*</span></label>
                <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
                  <input type="tel" name="phone" value={phone} onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "").slice(0, 10)); setSignupOtpVerified(false); setPhoneVerificationToken(""); setSignupOtpSent(false); setAuthError(""); }} inputMode="numeric" autoComplete="tel-national" placeholder="10-digit mobile number" pattern="[0-9]{10}" maxLength={10} required style={{ flex: 1, minWidth: 0 }} />
                  <button type="button" onClick={sendSignupOtp} disabled={authBusy || signupOtpVerified} style={{ border: "1px solid #c47c5a", borderRadius: 8, padding: "0 11px", background: signupOtpVerified ? "#e7f5e9" : "#fff4ec", color: signupOtpVerified ? "#24733a" : "#88432f", fontSize: 11, fontWeight: 750, cursor: authBusy || signupOtpVerified ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}>{signupOtpVerified ? "Verified ✓" : authBusy ? "Sending…" : signupOtpSent ? "Resend OTP" : "Send OTP"}</button>
                </div>
                {signupOtpSent && !signupOtpVerified && <div style={{ display: "flex", gap: 8, marginTop: 9 }}>
                  <input aria-label="Signup OTP" inputMode="numeric" autoComplete="one-time-code" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 8))} placeholder="Enter OTP" maxLength={8} style={{ flex: 1, minWidth: 0 }} />
                  <button type="button" onClick={verifySignupOtp} disabled={authBusy} style={{ border: "1px solid #c47c5a", borderRadius: 8, padding: "0 12px", background: "#a9502f", color: "#fff", fontSize: 11, fontWeight: 750, cursor: authBusy ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}>{authBusy ? "Checking…" : "Verify OTP"}</button>
                </div>}
                {signupOtpSent && authNotice && <div role="status" style={{ marginTop: 8, padding: "9px 11px", border: "1px solid #c7e4cd", borderRadius: 8, background: "#f0faf2", color: "#216b35", fontSize: 12, lineHeight: 1.5 }}>{authNotice}</div>}
                {mode === "signup" && authError && <div role="alert" style={{ marginTop: 8, padding: "9px 11px", border: "1px solid #f0b8b2", borderRadius: 8, background: "#fff2f0", color: "#a1261c", fontSize: 12, lineHeight: 1.5 }}>{authError}</div>}
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label>Email Address or Phone Number</label>
                <input type="text" name="identifier" inputMode="text" autoComplete="username" placeholder="Email address or 10-digit mobile number" required disabled={loginOtpStep} />
              </div>
            </>
          )}

          <div className="form-group">
            <label>Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {mode === "signup" && (
            <div className="form-group">
              <label>Confirm Password</label>
              <div className="password-input-wrapper">
                <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" autoComplete="new-password" placeholder="Confirm your password" required />
                <button type="button" className="password-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)} aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}>
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          {mode === "signup" && (
            <div className="form-group" style={{ padding: 12, border: "1px solid #e4d2c2", borderRadius: 10, background: "#fffaf5" }}>
              <label>Email Verification <span style={{ color: "#b45335" }}>*</span></label>
              <p style={{ fontSize: 12, margin: "4px 0 10px" }}>{emailVerified ? "Email verified successfully ✓" : "Verify your email address before submitting your membership application."}</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="button" onClick={sendSignupEmailVerification} disabled={authBusy || emailVerified} style={{ padding: "9px 12px", border: "1px solid #c47c5a", borderRadius: 8, background: "#fff4ec", color: "#88432f", cursor: "pointer" }}>{emailVerified ? "Verified ✓" : emailVerificationSent ? "Resend verification link" : "Send verification link"}</button>
                {!emailVerified && emailVerificationSent && <button type="button" onClick={checkSignupEmailVerification} disabled={authBusy} style={{ padding: "9px 12px", border: "1px solid #c47c5a", borderRadius: 8, background: "#a9502f", color: "white", cursor: "pointer" }}>I've verified my email</button>}
              </div>
            </div>
          )}

          {mode === "signin" && !loginOtpStep && (
            <div style={{ display: "flex", justifyContent: "flex-end", margin: "0 0 8px" }}>
              <button type="button" onClick={() => { setForgotPassword(true); setAuthError(""); setAuthNotice(""); setForgotOtpSent(false); setForgotOtp(""); setForgotChallengeId(""); }} style={{ border: 0, padding: 0, background: "transparent", color: "#a65332", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                Forgot Password?
              </button>
            </div>
          )}
          {mode === "signin" && loginOtpStep && (
            <div className="form-group" style={{ padding: 12, border: "1px solid #ead8ca", borderRadius: 10, background: "#fffaf6" }}>
              <label>One-Time Password (OTP)</label>
              <input name="loginOtp" inputMode="numeric" autoComplete="one-time-code" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 8))} placeholder="Enter the OTP sent to your phone" maxLength={8} required />
              <button type="button" onClick={() => { setLoginOtpStep(false); setLoginChallengeId(""); setOtp(""); setAuthError(""); setAuthNotice("Enter your credentials again to request a new OTP."); }} style={{ marginTop: 8, padding: 0, border: 0, background: "transparent", color: "#88432f", textDecoration: "underline", cursor: "pointer", fontSize: 11 }}>Start over / resend OTP</button>
            </div>
          )}

          {mode === "signup" && (
            <>
              <style>{`
                select.signup-professional-select {
                  display: block !important;
                  width: 100% !important;
                  min-width: 0 !important;
                  min-height: 46px !important;
                  box-sizing: border-box !important;
                  padding: 11px 44px 11px 14px !important;
                  border: 1px solid #dfcbbb !important;
                  border-radius: 10px !important;
                  background-color: #fff !important;
                  color: #503326 !important;
                  font: 600 14px/1.4 inherit !important;
                  cursor: pointer !important;
                  appearance: none !important;
                  -webkit-appearance: none !important;
                  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238b6b5a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") !important;
                  background-repeat: no-repeat !important;
                  background-position: right 14px center !important;
                }
                select.signup-professional-select:focus {
                  border-color: #b76543 !important;
                  outline: 3px solid rgba(183, 101, 67, .14) !important;
                  box-shadow: 0 0 0 1px #b76543 !important;
                }
                select.signup-professional-select option {
                  background: #fff !important;
                  color: #503326 !important;
                  padding: 10px !important;
                }
              `}</style>
              <div className="form-group">
                <label>Date of Birth (18+ required)</label>
                <input type="date" name="dateOfBirth" max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().slice(0, 10)} autoComplete="bday" required />
              </div>

              <div className="form-group">
                <label>Gender</label>
                <select
                  name="gender"
                  required
                  defaultValue=""
                  className="signup-professional-select"
                  style={{ width: "100%", minHeight: 44, boxSizing: "border-box", padding: "11px 42px 11px 13px", border: "1px solid #dfcbbb", borderRadius: 10, backgroundColor: "#fff", color: "#503326", fontSize: 13, fontWeight: 600, outline: "none", appearance: "none", WebkitAppearance: "none", cursor: "pointer", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238b6b5a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center" }}
                >
                  <option value="" disabled>Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div className="form-group">
                <label>Permanent Address</label>
                <textarea className="signup-address-field" name="permanentAddress" placeholder="House / building, street, village or area, district, state and PIN code" rows={3} autoComplete="street-address" required />
              </div>

              <div className="form-group">
                <label>Correspondence Address</label>
                <textarea className="signup-address-field" name="correspondenceAddress" placeholder="Address where you can currently receive letters, including PIN code" rows={3} required />
              </div>

              <div className="form-group">
                <label>Blood Group <span style={{ color: "#806b5e", fontWeight: 400 }}>(Optional)</span></label>
                <select
                  name="bloodGroup"
                  defaultValue=""
                  className="signup-professional-select"
                  style={{ width: "100%", minHeight: 44, boxSizing: "border-box", padding: "11px 42px 11px 13px", border: "1px solid #dfcbbb", borderRadius: 10, backgroundColor: "#fff", color: "#503326", fontSize: 13, fontWeight: 600, outline: "none", appearance: "none", WebkitAppearance: "none", cursor: "pointer", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238b6b5a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center" }}
                >
                  <option value="">Select blood group (optional)</option>
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((group) => <option key={group} value={group}>{group}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Referral Member Name <span style={{ color: "#806b5e", fontWeight: 400 }}>(Community entry)</span></label>
                <input type="text" name="referralMemberName" placeholder="To be entered by the community" readOnly />
              </div>

              <div className="form-group">
                <label>Referral Membership No. <span style={{ color: "#806b5e", fontWeight: 400 }}>(Community entry)</span></label>
                <input type="text" name="referralMembershipId" placeholder="To be entered by the community" readOnly />
              </div>

              <div
                className="form-group"
                style={{
                  border: "1px solid #e4d2c2",
                  borderRadius: "12px",
                  padding: "12px",
                  background: "#fffaf5",
                  minWidth: 0,
                  boxSizing: "border-box",
                }}
              >
                <label
                  htmlFor="caste-certificate-upload"
                  style={{ display: "block", marginBottom: "7px" }}
                >
                  Caste Certificate <span style={{ color: "#b45335" }}>*</span>
                </label>

                {!certificateFile ? (
                  <label
                    htmlFor="caste-certificate-upload"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      width: "100%",
                      minHeight: "42px",
                      padding: "9px 12px",
                      boxSizing: "border-box",
                      border: "1px dashed #c99a7e",
                      borderRadius: "8px",
                      color: "#88432f",
                      background: "#fffdf9",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: "pointer",
                      textAlign: "center",
                    }}
                  >
                    <Plus size={16} />
                    Choose certificate file
                  </label>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "9px",
                      width: "100%",
                      padding: "9px",
                      boxSizing: "border-box",
                      border: "1px solid #d8c5b4",
                      borderRadius: "8px",
                      background: "#fffdf9",
                      minWidth: 0,
                    }}
                  >
                    <FileText size={20} style={{ flex: "0 0 auto", color: "#88432f" }} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        title={certificateFile.name}
                        style={{
                          color: "#49372c",
                          fontSize: "12px",
                          fontWeight: 700,
                          overflowWrap: "anywhere",
                          lineHeight: 1.4,
                        }}
                      >
                        {certificateFile.name}
                      </div>
                      <div style={{ color: "#786d62", fontSize: "11px", marginTop: "3px" }}>
                        {(certificateFile.size / (1024 * 1024)).toFixed(2)} MB · Ready to submit
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeCertificate}
                      aria-label="Remove selected certificate"
                      title="Remove file"
                      style={{
                        flex: "0 0 auto",
                        display: "grid",
                        placeItems: "center",
                        width: "32px",
                        height: "32px",
                        border: "1px solid #e5c5b9",
                        borderRadius: "8px",
                        background: "#fff4ef",
                        color: "#a3412b",
                        cursor: "pointer",
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}

                <input
                  id="caste-certificate-upload"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                  onChange={handleCertificateChange}
                  required={!certificateFile}
                  style={{
                    position: "absolute",
                    width: "1px",
                    height: "1px",
                    padding: 0,
                    margin: "-1px",
                    overflow: "hidden",
                    clip: "rect(0,0,0,0)",
                    whiteSpace: "nowrap",
                    border: 0,
                  }}
                />

                {certificateError && (
                  <p role="alert" style={{ margin: "8px 0 0", color: "#b42318", fontSize: "12px", lineHeight: 1.4 }}>
                    {certificateError}
                  </p>
                )}
              </div>
            </>
          )}

          {mode !== "signup" && authError && <div role="alert" style={{ margin: "10px 0", padding: "10px 12px", borderRadius: 8, border: "1px solid #f0b8b2", background: "#fff2f0", color: "#a1261c", fontSize: 12, lineHeight: 1.5 }}>{authError}</div>}
          {authNotice && !(mode === "signup" && signupOtpSent) && <div role="status" style={{ margin: "10px 0", padding: "10px 12px", borderRadius: 8, border: "1px solid #c7e4cd", background: "#f0faf2", color: "#216b35", fontSize: 12, lineHeight: 1.5 }}>{authNotice}</div>}
          <button type="submit" className="auth-submit" disabled={authBusy || (mode === "signup" && !signupOtpVerified)} style={{ opacity: authBusy || (mode === "signup" && !signupOtpVerified) ? 0.65 : 1, cursor: authBusy || (mode === "signup" && !signupOtpVerified) ? "not-allowed" : "pointer" }}>
            {authBusy ? "Please wait…" : mode === "signin" ? (loginOtpStep ? "Verify OTP & Sign In" : "Continue with Password") : "Submit Membership Request"}
            {!authBusy && <ArrowRight size={17} />}
          </button>
        </form>

        <div className="auth-switch">
          {mode === "signin" ? (
            <>
              Don't have an account?
              <button type="button" onClick={() => { setMode("signup"); setAuthError(""); setAuthNotice(""); setLoginOtpStep(false); setOtp(""); }}>
                Sign Up
              </button>
            </>
          ) : (
            <>
              Already have an account?
              <button type="button" onClick={() => { setMode("signin"); setAuthError(""); setAuthNotice(""); setSignupOtpSent(false); setSignupOtpVerified(false); setPhoneVerificationToken(""); setOtp(""); }}>
                Sign In
              </button>
            </>
          )}
        </div>
        <div style={{ marginTop: 12, textAlign: "center" }}><button type="button" onClick={() => { setShowSupport(true); setSupportError(""); setSupportNotice(""); }} style={{ border: 0, background: "transparent", color: "#a65332", fontWeight: 700, cursor: "pointer", padding: 6 }}>Help & Support · Ask a question</button></div>
        </>}
      </div>
    </div>
  );
}

function VerificationPending({
  close,
  setAuthModal,
}) {
  return (
    <div className="modal-overlay">
      <div className="verification-card">
        <div className="verification-icon">
          <UserCheck size={30} />
        </div>

        <h2>Membership Request Submitted</h2>

        <p>
          Your registration has been submitted successfully.
          Your details need to be verified before member-only
          features can be accessed.
        </p>

        <div className="verification-status-box">
          <Clock size={20} />

          <div>
            <strong>Verification Pending</strong>

            <span>
              Waiting for community administrator approval.
            </span>
          </div>
        </div>

        <button
          className="btn btn-primary verification-back"
          onClick={close}
        >
          Continue as Guest
        </button>

        <button
          className="verification-signin"
          onClick={() => {
            close();
            setAuthModal("signin");
          }}
        >
          Already verified? Sign In
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   MEMBER PROMPT
========================================================= */

function MemberPrompt({
  close,
  setAuthModal,
}) {
  return (
    <div className="modal-overlay">
      <div className="member-prompt">
        <button
          className="modal-close"
          onClick={close}
        >
          <X size={20} />
        </button>

        <div className="member-prompt-icon">
          <Lock size={27} />
        </div>

        <h2>Verified Membership Required</h2>

        <p>
          This option provides additional services available
          to verified Potter Community members.
        </p>

        <div className="unlock-list">
          <div>
            <CheckCircle size={16} />
            Personalized community services
          </div>

          <div>
            <CheckCircle size={16} />
            Member-only documents and updates
          </div>

          <div>
            <CheckCircle size={16} />
            Advanced marketplace features
          </div>

          <div>
            <CheckCircle size={16} />
            Advanced matrimonial matching
          </div>

          <div>
            <CheckCircle size={16} />
            Emergency assistance services
          </div>
        </div>

        <button
          className="btn btn-primary member-prompt-button"
          onClick={() => {
            close();
            setAuthModal("signup");
          }}
        >
          Become a Verified Member
          <ArrowRight size={17} />
        </button>

        <button
          className="member-signin"
          onClick={() => {
            close();
            setAuthModal("signin");
          }}
        >
          Already a member? Sign In
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   COMMON COMPONENTS
========================================================= */

function PublicPage({ children }) {
  return (
    <main className="page-container public-page">
      {children}
    </main>
  );
}

function PageWrapper({ children }) {
  return (
    <main className="page-container">
      {children}
    </main>
  );
}

function PageHeader({ title, description }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </div>
  );
}


function EmptyState({ title, description }) {
  return (
    <div className="info-card empty-state-card">
      <div className="feature-icon">
        <ShieldCheck size={23} />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
}) {
  return (
    <div className="stat-card">
      <div className="stat-icon">
        <Icon size={21} />
      </div>

      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  title,
  description,
  onClick,
}) {
  return (
    <button
      className="quick-action"
      onClick={onClick}
    >
      <div className="quick-action-icon">
        <Icon size={21} />
      </div>

      <div>
        <strong>{title}</strong>
        <span>{description}</span>
      </div>

      <ChevronRight size={17} />
    </button>
  );
}

export default App;
