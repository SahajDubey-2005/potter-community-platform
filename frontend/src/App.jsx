import React, { useEffect, useState } from "react";
import {
  Home,
  Users,
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
  Receipt,
  RotateCcw,
  ClipboardCheck,
  FileCheck,
  TrendingUp,
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

const products = [];
const members = [];
const matrimonialProfiles = [];

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
    actions: [{ label: "Members", page: "members" }, { label: "Committee & Roles", page: "committee-roles" }, { label: "Payments & Fees", page: "payments" }, { label: "Events", page: "events" }, { label: "Announcements", page: "announcements" }, { label: "Official records", page: "community-records" }],
  },
  "Admin": {
    title: "Admin Dashboard",
    description: "Manage community operations and member services.",
    actions: [{ label: "Members", page: "members" }, { label: "Committee & Roles", page: "committee-roles" }, { label: "Announcements", page: "announcements" }, { label: "Events", page: "events" }, { label: "Documents", page: "documents" }, { label: "Official records", page: "community-records" }],
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

function App() {
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
    if (!authenticated && page !== "home" && page !== "marketplace") {
      setMemberPrompt(true);
      return;
    }
    if (!authenticated && memberOnly && page !== "marketplace") {
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
    <div className="app">
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

  const initials = profile.fullName
    ? profile.fullName
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("")
    : "PC";

  return (
    <header className="top-header">
      <div className="header-left">
        {authenticated && (
          <button
            className="mobile-menu-button"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={22} />
          </button>
        )}

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
      </div>

      {!authenticated ? (
        <div className="auth-buttons">
          <button
            className="btn btn-outline"
            onClick={() => navigate("marketplace")}
            title="Browse pottery products for free"
          >
            <ShoppingBag size={15} /> Shop Pottery
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
            onClick={() => navigate("marketplace")}
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
              <strong>{profile.fullName || "Your Name"}</strong>
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

function PublicContent({ currentPage, navigate, setAuthModal, openMemberFeature, search, setSearch, addToCart, cart }) {
  if (currentPage === "marketplace") {
    return <MarketplacePage authenticated={false} navigate={navigate} search={search} setSearch={setSearch} addToCart={addToCart} cart={cart} setAuthModal={setAuthModal} />;
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
          .premium-step{min-height:auto}.premium-step strong{margin-top:8px}.premium-cta{padding:36px 0}
          .premium-cta-inner{align-items:flex-start;flex-direction:column}.premium-cta .premium-btn{width:100%}
        }
        @media(prefers-reduced-motion:reduce){.premium-landing *,.premium-landing *:before,.premium-landing *:after{animation-duration:.01ms!important;transition-duration:.01ms!important}}
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

/* =========================================================
   MARKETPLACE — FREE PUBLIC BROWSING
========================================================= */
function MarketplacePage({ authenticated, navigate, search, setSearch, addToCart, cart, setAuthModal }) {
  const filteredProducts = products.filter((product) =>
    `${product.name || ""} ${product.description || ""} ${product.category || ""}`.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <PageWrapper>
      <style>{`
        .market-public-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap}
        .market-kicker{display:inline-flex;align-items:center;gap:7px;color:#985239;font-size:10px;font-weight:900;letter-spacing:.14em;margin-bottom:8px}
        .market-free-badge{display:inline-flex;align-items:center;gap:7px;padding:9px 12px;border-radius:99px;background:#edf2e8;color:#4f6848;font-size:11px;font-weight:800}
        .market-public-banner{display:flex;align-items:center;gap:16px;padding:22px;margin:18px 0;border:1px solid #d9c0aa;border-radius:18px;background:linear-gradient(110deg,#f2e0ce,#fffaf4 58%,#f3e4d4);box-shadow:0 10px 25px #5135220b}
        .market-banner-icon{display:grid;place-items:center;width:54px;height:54px;flex:none;border-radius:16px;background:#a95338;color:#fff7ed}
        .market-banner-copy{flex:1;min-width:180px}.market-banner-copy strong{display:block;font:500 22px Georgia,serif;color:#382a20}.market-banner-copy span{display:block;margin-top:5px;color:#796d61;font-size:12px;line-height:1.7}
        .market-toolbar{display:flex;align-items:center;justify-content:space-between;gap:15px;flex-wrap:wrap;margin:22px 0 14px}.market-toolbar .search-box{flex:1;min-width:230px}
        .market-categories{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:22px}.market-chip{padding:8px 13px;border:1px solid #ddc9b7;border-radius:99px;background:#fffaf4;color:#6c4b39;font-size:11px;font-weight:750;cursor:pointer}.market-chip:hover{background:#f0dfce}
        .market-empty{display:flex;flex-direction:column;align-items:center;text-align:center;padding:48px 20px 52px;border:1px dashed #d6bba5;border-radius:22px;background:linear-gradient(135deg,#fffaf4,#f5e8d9)}
        .market-empty-icon{position:relative;display:grid;place-items:center;width:76px;height:76px;margin-bottom:18px;border-radius:25px;background:#ead2bd;color:#9b5237}.market-empty-icon:after{content:'✦';position:absolute;top:-8px;right:-5px;color:#b65f43;font-size:25px}
        .market-empty h2{margin:8px 0;font:500 clamp(25px,3vw,34px) Georgia,serif;color:#362920}.market-empty p{max-width:510px;margin:0 0 19px;color:#786d62;font-size:12px;line-height:1.8}
        .market-product{overflow:hidden;border:1px solid #e3d5c7;border-radius:17px;background:#fffdf9;box-shadow:0 6px 18px #3b29180b}.market-product-img{display:flex;align-items:center;justify-content:center;width:100%;height:190px;object-fit:cover;background:linear-gradient(145deg,#f1dfcc,#e2c2a6);color:#9a5237}.market-product-body{padding:16px}.market-product-body h3{margin:8px 0;font-size:15px;color:#382b21}.market-product-body p{color:#786d62;font-size:11px;line-height:1.65}.market-product-bottom{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:13px}.market-product-bottom strong{font-size:15px;color:#88432f}
        .market-cart-bar{position:sticky;bottom:14px;display:flex;align-items:center;justify-content:space-between;gap:15px;margin-top:22px;padding:14px 16px;border:1px solid #ddc8b6;border-radius:16px;background:#fffdf7f2;box-shadow:0 12px 30px #3623171c;backdrop-filter:blur(12px)}
        @media(max-width:650px){.market-public-banner{align-items:flex-start;flex-wrap:wrap;padding:16px}.market-cart-bar{align-items:flex-start;flex-direction:column}.market-cart-bar .btn{width:100%}}
      `}</style>
      <div className="market-public-head">
        <div><span className="market-kicker"><ShoppingBag size={14}/> OPEN TO EVERYONE</span><PageHeader title="Potter Marketplace" description="Discover handmade pottery and support local artisans. Browsing is free for everyone — no membership required." /></div>
        <span className="market-free-badge"><CheckCircle size={14}/> Free public access</span>
      </div>
      <div className="market-public-banner">
        <div className="market-banner-icon"><ShoppingBag size={25}/></div>
        <div className="market-banner-copy"><strong>Every pot has a story. Find yours.</strong><span>Explore artisan-made pieces and help pottery makers reach more customers.</span></div>
        {!authenticated && <button className="btn btn-outline" onClick={() => setAuthModal("signup")}>Become a seller <ArrowRight size={15}/></button>}
      </div>
      <div className="market-toolbar">
        <div className="search-box"><Search size={18}/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search pottery, clay art, planters..." aria-label="Search marketplace products"/></div>
        <span style={{display:"inline-flex",alignItems:"center",gap:8,color:"#786d62",fontSize:11}}><ShoppingCart size={16}/>{cart.length ? `${cart.length} item(s) in cart` : "Browse freely — no membership needed"}</span>
      </div>
      <div className="market-categories">{["All pottery","Home & décor","Planters","Tableware","Traditional craft"].map((category) => <button key={category} className="market-chip" onClick={() => setSearch(category === "All pottery" ? "" : category)}>{category}</button>)}</div>
      {filteredProducts.length ? (
        <div className="product-grid">{filteredProducts.map((product) => <article className="market-product" key={product.id}>{product.image ? <img className="market-product-img" src={product.image} alt={product.name}/> : <div className="market-product-img"><ShoppingBag size={32}/></div>}<div className="market-product-body"><span className="market-kicker">{product.category || "HANDCRAFTED POTTERY"}</span><h3>{product.name}</h3><p>{product.description || "A unique handmade piece crafted with care."}</p><div className="market-product-bottom"><strong>{product.price ? `₹${product.price}` : "Price on request"}</strong><button className="btn btn-primary" onClick={() => addToCart(product)}><ShoppingCart size={15}/> Add to cart</button></div></div></article>)}</div>
      ) : (
        <div className="market-empty"><div className="market-empty-icon"><ShoppingBag size={34}/></div><span className="market-kicker">THE ARTISAN SHELF</span><h2>{search ? "No matching pottery found" : "Beautiful things are being shaped."}</h2><p>{search ? "Try another keyword or choose All pottery to browse again." : "This public marketplace is ready for everyone. Product listings will appear here when artisans publish their work."}</p>{search ? <button className="btn btn-outline" onClick={() => setSearch("")}>Show all pottery</button> : <button className="btn btn-primary" onClick={() => setAuthModal("signup")}>Become a seller <ArrowRight size={16}/></button>}</div>
      )}
      {cart.length > 0 && <div className="market-cart-bar"><div style={{display:"flex",alignItems:"center",gap:10}}><ShoppingCart size={18}/><strong>{cart.length} item(s) in your cart</strong><span style={{color:"#817468",fontSize:10}}>Public shopping</span></div><button className="btn btn-primary" onClick={() => setAuthModal("signup")}>Continue to checkout <ArrowRight size={16}/></button></div>}
    </PageWrapper>
  );
}

/* =========================================================
   MEMBER CONTENT
========================================================= */

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

  if (currentPage === "marketplace") {
    return <MarketplacePage authenticated={true} navigate={navigate} search={search} setSearch={setSearch} addToCart={addToCart} cart={cart} />;
  }

  if (currentPage === "matrimonial") {
    return (
      <PageWrapper>
        <MatrimonialPage authenticated activeUser={activeUser} />
      </PageWrapper>
    );
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

  if (currentPage === "documents") {
    return <DocumentsPage />;
  }

  if (currentPage === "widow-assistance") {
    return <WidowAssistancePage activeUser={activeUser} />;
  }

  if (currentPage === "payments") {
    return <PaymentsPage activeRole={activeRole} activeUser={activeUser} cart={cart} />;
  }

  if (currentPage === "emergency") {
    return <EmergencyPage />;
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

  return <Dashboard navigate={navigate} />;
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
  const [matrimonialForm, setMatrimonialForm] = useState({ gender: "", education: "", occupation: "", location: "", marital_status: "", description: "" });
  const loadMatrimonial = async () => {
    const [profilesResult, mineResult, queueResult] = await Promise.allSettled([authApi("/matrimonial"), authApi("/matrimonial/mine"), canReviewMatrimonial ? authApi("/matrimonial/review") : Promise.resolve([])]);
    if (profilesResult.status === "fulfilled") setMatrimonialProfiles(profilesResult.value);
    if (mineResult.status === "fulfilled") {
      const mine = mineResult.value; setMyMatrimonialProfile(mine);
      if (mine) setMatrimonialForm({ gender: mine.gender, education: mine.education, occupation: mine.occupation, location: mine.location, marital_status: mine.maritalStatus, description: mine.description });
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

  const filteredProfiles =
    matrimonialProfiles.filter((profile) => {
      const genderMatch =
        genderFilter === "All" ||
        profile.gender === genderFilter;

      const locationMatch =
        locationFilter === "All" ||
        profile.location === locationFilter;

      const searchMatch =
        profile.name
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        profile.occupation
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        profile.education
          .toLowerCase()
          .includes(search.toLowerCase());

      return (
        genderMatch &&
        locationMatch &&
        searchMatch
      );
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

      {authenticated && <section className="matrimonial-membership-box" style={{ display: "block", marginBottom: 24 }}>
        <h2>{myMatrimonialProfile ? "Your matrimonial profile" : "Create a matrimonial profile"}</h2>
        <p>Only verified members aged 18 or above can submit. Profiles appear to verified members after committee approval. Date of birth, phone, exact address and documents stay private.</p>
        {matrimonialError && <p role="alert">{matrimonialError}</p>}
        {myMatrimonialProfile && <p>Application status: <strong>{myMatrimonialProfile.status}</strong></p>}
        <form onSubmit={saveMatrimonialProfile} className="matrimonial-toolbar" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
          <select required value={matrimonialForm.gender} onChange={e => setMatrimonialForm({ ...matrimonialForm, gender: e.target.value })}><option value="">Gender</option><option>Male</option><option>Female</option><option>Other</option></select>
          <input required maxLength={160} placeholder="Education" value={matrimonialForm.education} onChange={e => setMatrimonialForm({ ...matrimonialForm, education: e.target.value })} />
          <input required maxLength={160} placeholder="Occupation" value={matrimonialForm.occupation} onChange={e => setMatrimonialForm({ ...matrimonialForm, occupation: e.target.value })} />
          <input required maxLength={120} placeholder="City or district (no exact address)" value={matrimonialForm.location} onChange={e => setMatrimonialForm({ ...matrimonialForm, location: e.target.value })} />
          <select required value={matrimonialForm.marital_status} onChange={e => setMatrimonialForm({ ...matrimonialForm, marital_status: e.target.value })}><option value="">Marital status</option><option>Never married</option><option>Widowed</option><option>Divorced</option><option>Other</option></select>
          <textarea required minLength={10} maxLength={1200} placeholder="Short introduction" value={matrimonialForm.description} onChange={e => setMatrimonialForm({ ...matrimonialForm, description: e.target.value })} />
          <button className="btn btn-primary" disabled={matrimonialBusy}>{matrimonialBusy ? "Saving…" : "Submit for review"}</button>
        </form>
      </section>}
      {canReviewMatrimonial && matrimonialReviewQueue.length > 0 && <section className="matrimonial-membership-box" style={{ display: "block", marginBottom: 24 }}><h2>Profiles awaiting review</h2>{matrimonialReviewQueue.map(profile => <article key={profile.id} style={{ padding: 16, borderBottom: "1px solid #ead9cf" }}><strong>{profile.name}, {profile.age}</strong><p>{profile.gender} · {profile.location} · {profile.education} · {profile.occupation} · {profile.maritalStatus}</p><p>{profile.description}</p><button className="btn btn-primary" onClick={() => decideMatrimonialProfile(profile.id, "APPROVE")}>Approve</button> <button className="btn btn-outline" onClick={() => decideMatrimonialProfile(profile.id, "REJECT")}>Reject</button></article>)}</section>}

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
              new Set(matrimonialProfiles.map((p) => p.location))
            ).map((location) => (
              <option value={location} key={location}>
                {location}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="matrimonial-stats">
        <div>
          <strong>
            {matrimonialProfiles.length}
          </strong>
          <span>Profiles</span>
        </div>

        <div>
          <strong>
            {
              matrimonialProfiles.filter(
                (p) => p.gender === "Male"
              ).length
            }
          </strong>
          <span>Men</span>
        </div>

        <div>
          <strong>
            {
              matrimonialProfiles.filter(
                (p) => p.gender === "Female"
              ).length
            }
          </strong>
          <span>Women</span>
        </div>

        <div>
          <strong>0</strong>
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
              openMemberFeature={openMemberFeature}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No approved matrimonial profiles published yet"
          description="Approved profiles from verified adult members will appear here."
        />
      )}

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
  openMemberFeature,
}) {
  return (
    <div className="matrimonial-card">
      <div className="matrimonial-image">
        <div className="matrimonial-avatar" aria-label={`${profile.name} profile`}>{profile.name.split(/\s+/).map(part => part[0]).slice(0, 2).join("").toUpperCase()}</div>

        <div className="profile-gender">
          {profile.gender}
        </div>

        {(profile.verified || profile.status === "PUBLISHED") && (
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
              <button className="btn btn-outline">
                <Bookmark size={15} />
                Shortlist
              </button>

              <button className="btn btn-primary">
                <Heart size={15} />
                View Match
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

function Dashboard({ navigate, activeRole = "General Member", activeUser = null }) {
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
    ].filter(([permission]) => activeUser?.permissions?.includes(permission)).map(([, action]) => action);
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
    ? displayName
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("")
    : "PC";

  return (
    <PageWrapper>
      <div className="dashboard-welcome">
        <div>
          <span className="welcome-small">
            {dashboardRole.toUpperCase()}
          </span>

          <h1>Hello, {displayName} 👋</h1>

          <p>{dashboardConfig.description}</p>
        </div>

        <div className="verified-badge-large">
          <CheckCircle size={17} />
          {membershipStatus === "APPROVED"
            ? "Verified Member"
            : "Membership Pending"}
        </div>
      </div>

      <div className="role-dashboard-actions" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(175px, 1fr))", gap: 12, margin: "0 0 22px" }}>
        {dashboardConfig.actions.map((action) => (
          <button
            key={`${dashboardRole}-${action.page}`}
            type="button"
            onClick={() => navigate(action.page)}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, textAlign: "left", padding: "15px 16px", border: "1px solid #ead8c9", borderRadius: 13, background: "#fffdf9", color: "#503527", cursor: "pointer", fontWeight: 750, fontSize: 12 }}
          >
            <span>{action.label}</span><ArrowRight size={15} />
          </button>
        ))}
      </div>

      <div className="dashboard-stats">
        <StatCard
          icon={Users}
          value={members.length}
          label="Verified Members"
        />

        <StatCard
          icon={Megaphone}
          value={announcements.length}
          label="Announcements"
        />

        <StatCard
          icon={CalendarDays}
          value={events.length}
          label="Upcoming Events"
        />

        <StatCard
          icon={ShoppingBag}
          value={products.length}
          label="Marketplace Products"
        />
      </div>

      <div className="dashboard-layout">
        <div className="dashboard-main-card">
          <div className="card-heading">
            <div>
              <span>COMMUNITY</span>
              <h2>Latest Announcements</h2>
            </div>

            <button
              onClick={() =>
                navigate("announcements")
              }
            >
              View All
              <ArrowRight size={15} />
            </button>
          </div>

          <div className="announcement-list">
            {announcements.length > 0 ? (
              announcements
                .slice(0, 5)
                .map((item) => (
                  <div
                    className="announcement-row"
                    key={item.title}
                  >
                    <div className="announcement-date">
                      <span>
                        {item.date.split(" ")[0]}
                      </span>

                      <small>
                        {item.date.split(" ")[1]}
                      </small>
                    </div>

                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.description}</p>
                    </div>
                  </div>
                ))
            ) : (
              <p className="dashboard-empty-message">
                No verified community announcements have been published yet.
              </p>
            )}
          </div>
        </div>

        <div className="dashboard-side-card">
          <div className="card-heading">
            <div>
              <span>MEMBERSHIP</span>
              <h2>Your Profile</h2>
            </div>
          </div>

          <div className="profile-summary">
            <div className="profile-avatar-large">
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

            <h3>{profile.fullName || "Your Name"}</h3>

            <span className="membership-id">
              {membershipStatus === "APPROVED"
                ? `Membership ID: ${activeUser?.membership_number || profile.membershipId}`
                : "Membership ID: Assigned after approval"}
            </span>

            <div className="profile-verified">
              <CheckCircle size={15} />
              {membershipStatus === "APPROVED"
                ? "Verified Member"
                : "Membership Pending"}
            </div>
          </div>

          <button
            className="full-width-button"
            onClick={() =>
              navigate("profile")
            }
          >
            View Profile
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <div className="quick-actions">
        <h2>Quick Access</h2>

        <div className="quick-grid">
          <QuickAction
            icon={ShoppingBag}
            title="Marketplace"
            description="Buy & sell"
            onClick={() =>
              navigate("marketplace")
            }
          />

          <QuickAction
            icon={Landmark}
            title="Government Schemes"
            description="Find benefits"
            onClick={() =>
              navigate("schemes")
            }
          />

          <QuickAction
            icon={IndianRupee}
            title="Widow Pension & Assistance"
            description="Pension and financial support"
            onClick={() => navigate("widow-assistance")}
          />

          <QuickAction
            icon={GraduationCap}
            title="Scholarships"
            description="Education support"
            onClick={() =>
              navigate("scholarships")
            }
          />

          <QuickAction
            icon={Heart}
            title="Matrimonial"
            description="Find your match"
            onClick={() =>
              navigate("matrimonial")
            }
          />
        </div>
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
    <PageHeader title="Scholarships" description="Browse Central, State, and community scholarships; track applications and verified benefits." />
    {error && <p role="alert" style={{ color: "#a13d2d", fontSize: 12 }}>{error}</p>}
    {notice && <p role="status" style={{ color: "#39734a", fontSize: 12 }}>{notice}</p>}
    <section style={{ margin: "18px 0", padding: 18, border: "1px solid #ead8cc", borderRadius: 16, background: "#fffdfb" }}>
      <h2 style={{ margin: "0 0 4px", color: "#503326", fontSize: 18 }}>Choose scholarship source</h2>
      <p style={{ color: "#806b5e", fontSize: 12, margin: "0 0 12px" }}>Government programmes and community support are managed separately.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 10 }}>
        {scholarshipSections.map(({ value, label, note }) => { const selected = scope === value; return <button key={value} type="button" aria-pressed={selected} onClick={() => { setScope(value); if (value !== "COMMUNITY") { setShowSchemeForm(false); setEditingSchemeId(null); } }} style={{ textAlign: "left", padding: "13px 15px", minHeight: 76, border: `1px solid ${selected ? "#ad5a39" : "#ead8cc"}`, borderRadius: 12, background: selected ? "#f8ece4" : "#fff", color: "#503326", cursor: "pointer" }}><span style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 13, fontWeight: 800 }}>{label}<span style={{ color: "#ad5a39" }}>{schemes.filter((item) => item.scope === value).length}</span></span><span style={{ display: "block", marginTop: 5, color: "#806b5e", fontSize: 11, fontWeight: 400 }}>{note}</span></button>; })}
      </div>
    </section>
    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "baseline", marginBottom: 6 }}><h2 style={{ margin: 0, color: "#503326", fontSize: 20 }}>{activeScholarshipSection?.label}</h2><span style={{ color: "#806b5e", fontSize: 11 }}>{visibleSchemes.length} {visibleSchemes.length === 1 ? "scheme" : "schemes"}</span></div>
    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap", margin: "0 0 12px" }}>
      <button type="button" className="btn btn-outline" onClick={loadScholarships} disabled={loading}>{loading ? "Refreshing…" : "Refresh"}</button>
      {admin && scope === "COMMUNITY" && <button type="button" className="btn btn-primary" onClick={() => setShowSchemeForm((current) => !current)}>{showSchemeForm ? "Close" : "Add scholarship"}</button>}
    </div>
    <p style={{ color: "#806b5e", fontSize: 12, margin: "0 0 16px" }}>{scope === "COMMUNITY" ? "Managed by Potter Community. Members can apply here and track their application." : "Read-only government information. Apply and check eligibility through the relevant government department."}</p>
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
    {loading ? <div className="empty-state">Loading scholarship catalogue…</div> : visibleSchemes.length ? <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,320px),1fr))", gap: 14 }}>{visibleSchemes.map((scheme) => <article key={scheme.id} className="info-card compact-service-card">
      <div className="info-card-top"><span className="small-category">{scheme.provider}</span><span style={statusStyle(scheme.expired ? "EXPIRED" : scheme.not_open ? "UPCOMING" : "ACTIVE")}>{scheme.expired ? "Expired · history retained" : scheme.not_open ? "Opens later" : scheme.scope}</span></div>
      <h3>{scheme.name}</h3><p style={{ color: "#806b5e", fontSize: 12 }}>{scheme.eligibility}</p>
      {scheme.amount && <div className="amount-box"><IndianRupee size={16}/><span>{scheme.amount}</span></div>}
      <p style={{ color: "#806b5e", fontSize: 11 }}>Application period: {scheme.start_date || "Open date not listed"} – {scheme.deadline || "Deadline as announced by provider"}</p>
      {scheme.required_documents?.length > 0 && <p style={{ color: "#806b5e", fontSize: 11 }}>Documents: {scheme.required_documents.join(", ")}</p>}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{canApply && scheme.scope === "COMMUNITY" && !scheme.expired && !scheme.not_open && <button className="btn btn-primary" type="button" onClick={() => setApplyingTo(scheme)}>Apply</button>}{admin && scheme.scope === "COMMUNITY" && <button className="btn btn-outline" type="button" onClick={() => editScheme(scheme)}>Edit scheme</button>}{scheme.application_url && <a className="btn btn-outline" href={scheme.application_url} target="_blank" rel="noreferrer">Official application</a>}</div>
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

    const apiBase = String(import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
    setIsProcessingPayment(true);
    setNotice("Connecting securely to the payment service…");
    try {
      await loadRazorpayCheckout();
      const orderResponse = await fetch(`${apiBase}/api/payments/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          paymentType,
          amount: Number(numericAmount.toFixed(2)),
          payerName: payerName.trim(),
          payerEmail: payerEmail.trim(),
          cart: paymentType === "marketplace-order" ? cart : undefined,
        }),
      });
      const order = await orderResponse.json().catch(() => ({}));
      if (!orderResponse.ok) throw new Error(order.message || order.error || `Could not create payment order (HTTP ${orderResponse.status}).`);
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
        notes: { paymentType },
        handler: async (response) => {
          try {
            setNotice("Payment received by checkout. Verifying it with the server…");
            const verifyResponse = await fetch(`${apiBase}/api/payments/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verification = await verifyResponse.json().catch(() => ({}));
            if (!verifyResponse.ok || verification.verified !== true || !["captured", "paid", "verified"].includes(String(verification.paymentStatus || verification.status || "").toLowerCase())) {
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
            <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "15px 16px", border: "1px solid #ead8cc", borderRadius: 12, background: "#fffdfb", minWidth: 0 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, display: "grid", placeItems: "center", flexShrink: 0, background: item.bg, color: item.color }}><Icon size={21} /></div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 23, lineHeight: 1.15, fontWeight: 750, color: "#503326" }}>{item.value}</div>
                <div style={{ fontSize: 12, lineHeight: 1.4, color: "#806b5e" }}>{item.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", alignItems: "flex-start", gap: 11, padding: "13px 15px", marginBottom: 12, border: "1px solid #d7e2ec", borderRadius: 11, background: "#f2f6f9", color: "#34495e" }}>
        <ShieldCheck size={21} style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          <strong style={{ display: "block", marginBottom: 4 }}>Your documents are private</strong>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55 }}>Sensitive identity documents must have restricted access and secure storage. Full identity numbers and document images must never appear on public profiles.</p>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "flex-start", gap: 9, padding: "11px 14px", marginBottom: 20, borderRadius: 10, background: "#fbf0e8", color: "#704b39", lineHeight: 1.5, fontSize: 13 }}>
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

      <form onSubmit={submitDocuments} style={{ marginTop: 20, padding: 16, border: "1px solid #ead8cc", borderRadius: 12, background: "#fffdfb" }}>
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
    </PageWrapper>
  );
}

/* =========================================================
   EMERGENCY
========================================================= */

function EmergencyPage() {
  return (
    <PageWrapper>
      <PageHeader
        title="Emergency Support"
        description="Get assistance during emergencies and critical situations."
      />

      <div className="emergency-warning">
        <AlertTriangle size={22} />

        <div>
          <strong>Emergency assistance</strong>

          <p>
            Use this service to request community assistance.
            For immediate life-threatening situations, contact
            your local emergency services.
          </p>
        </div>
      </div>

      <div className="emergency-grid">
        <div className="emergency-main-card">
          <div className="emergency-icon">
            <HeartPulse size={30} />
          </div>

          <h2>Request Emergency Support</h2>

          <p>
            Submit your emergency details so available
            community support can respond.
          </p>

          <select>
            <option>Select Emergency Type</option>
            <option>Medical Emergency</option>
            <option>Accident</option>
            <option>Blood Requirement</option>
            <option>Other Emergency</option>
          </select>

          <textarea placeholder="Describe your emergency..." />

          <button className="btn emergency-button">
            <HeartPulse size={18} />
            Request Assistance
          </button>
        </div>

        <div className="assistance-card">
          <h3>Nearby Assistance</h3>

          {[
            [
              "Hospitals",
              "Find nearby hospitals",
            ],
            [
              "Blood Banks",
              "Find blood availability",
            ],
            [
              "Community Volunteers",
              "Contact available volunteers",
            ],
            [
              "Emergency Contacts",
              "View emergency contacts",
            ],
            [
              "Ambulance Support",
              "Find available assistance",
            ],
          ].map(([title, text]) => (
            <div
              className="assistance-item"
              key={title}
            >
              <div className="assistance-icon">
                <HeartPulse size={18} />
              </div>

              <div>
                <strong>{title}</strong>
                <span>{text}</span>
              </div>

              <ChevronRight size={17} />
            </div>
          ))}
        </div>
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
              Verified Potter Community Member
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
            value="Member"
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
    const form = event.currentTarget;
    setBusy(true);
    setError("");
    setNotice("");
    const formData = new FormData(event.currentTarget);
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
        <select name="relationship" required defaultValue="" aria-label="Relationship" style={{ padding: 10, border: "1px solid #ddc9b7", borderRadius: 8, color: "#503326", background: "#fffdfb" }}><option value="" disabled>Relationship</option>{["Spouse", "Child", "Parent", "Sibling", "Other"].map((item) => <option key={item}>{item}</option>)}</select>
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
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [roleDraft, setRoleDraft] = useState({ name: "", description: "", permissions: [], is_active: true });
  const [assignmentTermStart, setAssignmentTermStart] = useState("");
  const [assignmentTermEnd, setAssignmentTermEnd] = useState("");
  const [assignmentMinutesReference, setAssignmentMinutesReference] = useState("");
  const [adminDraft, setAdminDraft] = useState({ full_name: "", email: "", phone_number: "", password: "" });
  const [adminBusy, setAdminBusy] = useState(false);
  const canManageRoles = String(activeUser?.role || "").toUpperCase() === "ADMIN" || activeUser?.permissions?.includes("roles.manage");
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

  const assignRole = async (userId, roleId) => {
    if (!roleId) return;
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

  const revokeRole = async (user) => {
    const reason = window.prompt(`Reason for ending ${user.full_name}'s committee role?`);
    if (!reason || reason.trim().length < 3) return;
    setRoleError("");
    setRoleNotice("");
    try {
      await authApi(`/admin/roles/members/${user.id}/revoke`, {
        method: "PATCH",
        body: JSON.stringify({ reason: reason.trim() }),
      });
      setRoleNotice("Committee role ended and recorded in assignment history.");
      await loadRoleManagement();
    } catch (error) {
      setRoleError(error.message || "Could not revoke this role.");
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
          {roles.map((role) => <div key={role.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", padding: 12, border: "1px solid #efe2d8", borderRadius: 9 }}><div><strong style={{ color: "#503326" }}>{role.name}</strong><div style={{ color: "#806b5e", fontSize: 11, marginTop: 3 }}>{role.description || "No description"} · {role.users_count} assigned · {role.is_active ? "Active" : "Inactive"}</div><div style={{ color: "#806b5e", fontSize: 11, marginTop: 3 }}>Permissions: {(role.permissions || []).length ? role.permissions.join(", ") : "None"}</div></div><button type="button" className="btn btn-outline" onClick={() => editRole(role)}>Edit</button></div>)}
        </div>

        <h3 style={{ margin: "20px 0 8px", color: "#503326", fontSize: 15 }}>Assign or end a role for an approved member</h3>
        <details style={{ margin: "10px 0 13px", padding: 10, border: "1px solid #f0e2d8", borderRadius: 9 }}>
        <summary style={{ color: "#806b5e", fontSize: 11, cursor: "pointer" }}>Optional term dates and meeting reference</summary>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 9, marginTop: 10 }}>
          <label style={{ display: "grid", gap: 5, color: "#806b5e", fontSize: 11 }}>Term starts<input type="date" value={assignmentTermStart} onChange={(event) => setAssignmentTermStart(event.target.value)} style={{ padding: 9, border: "1px solid #ddc9b7", borderRadius: 8, background: "#fffdfb" }} /></label>
          <label style={{ display: "grid", gap: 5, color: "#806b5e", fontSize: 11 }}>Term ends<input type="date" min={assignmentTermStart || undefined} value={assignmentTermEnd} onChange={(event) => setAssignmentTermEnd(event.target.value)} style={{ padding: 9, border: "1px solid #ddc9b7", borderRadius: 8, background: "#fffdfb" }} /></label>
          <label style={{ display: "grid", gap: 5, color: "#806b5e", fontSize: 11 }}>Signed minutes / resolution reference<input value={assignmentMinutesReference} onChange={(event) => setAssignmentMinutesReference(event.target.value)} maxLength={255} placeholder="Optional meeting reference" style={{ padding: 9, border: "1px solid #ddc9b7", borderRadius: 8, background: "#fffdfb" }} /></label>
        </div>
        </details>
        {roleUsers.length ? <div style={{ display: "grid", gap: 8 }}>{roleUsers.map((user) => <div key={user.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", padding: 11, border: "1px solid #efe2d8", borderRadius: 9 }}><div><strong style={{ color: "#503326", fontSize: 13 }}>{user.full_name}</strong><div style={{ color: "#806b5e", fontSize: 11 }}>{user.membership_number || user.email || `Member #${user.id}`} · Current role: {user.role}</div></div><div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}><select aria-label={`Assign role to ${user.full_name}`} value="" onChange={(event) => assignRole(user.id, event.target.value)} style={{ minWidth: 220, padding: 9, border: "1px solid #ddc9b7", borderRadius: 8, background: "#fffdfb", color: "#503326" }}><option value="" disabled>Assign committee role…</option>{roles.filter((role) => role.is_active && role.name.toUpperCase() !== "ADMIN").map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select>{user.role_id && user.role.toUpperCase() !== "CITIZEN" && user.role.toUpperCase() !== "ADMIN" && <button type="button" className="btn btn-outline" onClick={() => revokeRole(user)}>End role</button>}</div></div>)}</div> : <p style={{ color: "#806b5e", fontSize: 12 }}>No approved active members are available for role assignment.</p>}

        <details style={{ marginTop: 16, padding: 10, border: "1px solid #f0e2d8", borderRadius: 9 }}>
        <summary style={{ color: "#624b3d", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Committee term and handover history</summary>
        {roleAssignments.length ? <div style={{ display: "grid", gap: 7 }}>{roleAssignments.map((assignment) => <div key={assignment.id} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 8, padding: 10, border: "1px solid #efe2d8", borderRadius: 8, color: "#624b3d", fontSize: 11 }}><strong>{assignment.member_name} · {assignment.role}</strong><span>{assignment.status}</span><span>{assignment.term_start || "Start not set"} → {assignment.term_end || "End not set"}</span><span>{assignment.minutes_reference || "No minutes reference"}</span><span>{assignment.end_reason || `Assigned ${new Date(assignment.assigned_at).toLocaleString()}`}</span></div>)}</div> : <p style={{ color: "#806b5e", fontSize: 12 }}>New assignments and handovers will be recorded here.</p>}
        </details>
      </section>}

      {["ADMIN", "SUPER ADMIN"].includes(String(activeUser?.role || "").toUpperCase()) && <details style={{ marginBottom: 20, padding: 14, border: "1px solid #ead8cc", borderRadius: 14, background: "#fffdfb" }}>
        <summary style={{ color: "#503326", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Activity history</summary>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div><h2 style={{ margin: "0 0 5px", color: "#503326", fontSize: 19 }}>Activity history</h2><p style={{ margin: 0, color: "#806b5e", fontSize: 12 }}>Administrative changes with timestamp, account, result, and connecting IP address.</p></div>
          <button type="button" className="btn btn-outline" onClick={loadActivityLogs}>Refresh</button>
        </div>
        {activityError && <p role="alert" style={{ color: "#a13d2d", fontSize: 12 }}>{activityError}</p>}
        {activityLogs.length ? <div style={{ display: "grid", gap: 7, marginTop: 14 }}>{activityLogs.map((entry) => <div key={entry.id} style={{ display: "grid", gridTemplateColumns: "minmax(150px, 1.2fr) minmax(130px, 1fr) minmax(150px, 1.3fr) minmax(100px, .7fr)", gap: 10, padding: 10, border: "1px solid #efe2d8", borderRadius: 8, color: "#624b3d", fontSize: 11, overflowWrap: "anywhere" }}><span>{new Date(entry.created_at).toLocaleString()}</span><strong>{entry.actor_name}</strong><span>{entry.action} {entry.resource} · {entry.status_code}</span><span>IP: {entry.ip_address || "Unavailable"}</span></div>)}</div> : !activityError && <p style={{ color: "#806b5e", fontSize: 12, marginTop: 14 }}>No recorded activity yet.</p>}
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
  const [phoneVerificationToken, setPhoneVerificationToken] = useState("");
  const [loginOtpStep, setLoginOtpStep] = useState(false);
  const [loginChallengeId, setLoginChallengeId] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authNotice, setAuthNotice] = useState("");
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
        className="auth-modal"
        style={{
          width: "min(395px, calc(100vw - 32px))",
          maxWidth: "395px",
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

        <h2>
          {mode === "signin"
            ? "Welcome Back"
            : "Join Potter Community"}
        </h2>
        <form onSubmit={submit}>
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
                <input type="email" name="email" inputMode="email" autoComplete="email" placeholder="Enter your personal email address" required />
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
              <div className="form-group">
                <label>Date of Birth (18+ required)</label>
                <input type="date" name="dateOfBirth" max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().slice(0, 10)} autoComplete="bday" required />
              </div>

              <div className="form-group">
                <label>Gender</label>
                <select name="gender" required defaultValue="">
                  <option value="" disabled>Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div className="form-group">
                <label>Permanent Address</label>
                <textarea name="permanentAddress" placeholder="Door no., house/apartment, street, area, city and PIN code" rows={2} required style={{ width: "100%", resize: "vertical", boxSizing: "border-box" }} />
              </div>

              <div className="form-group">
                <label>Correspondence Address</label>
                <textarea name="correspondenceAddress" placeholder="Enter correspondence address" rows={2} required style={{ width: "100%", resize: "vertical", boxSizing: "border-box" }} />
              </div>

              <div className="form-group">
                <label>Blood Group <span style={{ color: "#806b5e", fontWeight: 400 }}>(Optional)</span></label>
                <select name="bloodGroup" defaultValue="">
                  <option value="">No selection</option>
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

              <div className="form-group">
                <label>Confirm Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    autoComplete="new-password"
                    placeholder="Confirm your password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
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
