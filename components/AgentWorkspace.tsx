"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import Link from "@/components/SiteLink";
import { withBasePath } from "@/lib/base-path";
import {
  baselineConfiguration,
  configurationPlanningPrice,
  planningConfigurationArea,
  sortConfigurationOptions,
  usesLandedArea,
} from "@/lib/unit-pricing";

type AgentUser = { email: string; name: string; role: string; phone?: string; title?: string; avatarUrl?: string; expiresAt?: string; mustChangePassword?: boolean; onboardingRequired?: boolean };
type AgentTool = "overview" | "chat" | "portfolio" | "sales_offer" | "proposal" | "comparison" | "documents" | "admin";
type ProjectResearch = {
  areaBenchmark: {
    value: number;
    display: string;
    label: string;
    period: string;
    sourceLabel: string;
    sourceUrl: string;
    note: string;
  } | null;
  nearby: Array<{ name: string; category: string; distanceKm: number }>;
  upcoming: Array<{ name: string; developer: string; handover: string; distanceKm: number | null }>;
  demandSegments: string[];
  demographicContext: {
    scope: string;
    display: string;
    note: string;
    sourceLabel: string;
    sourceUrl: string;
  } | null;
  rentalEvidence: {
    status: string;
    note: string;
    indexLabel: string;
    indexUrl: string;
    datasetLabel: string;
    datasetUrl: string;
  };
};
type ProjectOption = {
  slug: string;
  name: string;
  developer: string;
  location: string;
  emirate: string;
  startingPrice: string;
  paymentPlan: string;
  handover: string;
  pricePerSqft: string;
  residences: string;
  bedrooms: string;
  bedroomOptions: string[];
  positioning: string;
  imageUrl: string;
  research: ProjectResearch;
};
type CustomProject = {
  id: string;
  name: string;
  developer: string;
  location: string;
  emirate: string;
  startingPrice: string;
  paymentPlan: string;
  handover: string;
  pricePerSqft: string;
  residences: string;
  bedrooms: string;
  positioning: string;
  imageUrl: string;
  projectUrl: string;
};
type PropertyFinderProfile = {
  profileUrl: string;
  agencyUrl: string;
  brn: string;
  experience: string;
  languages: string[];
  areas: string[];
  verifiedAt: string;
  listings: Array<{
    id: string;
    url: string;
    title: string;
    location: string;
    propertyType: string;
    listingType: "sale" | "rent";
    bedrooms: string;
    bathrooms: number;
    sizeSqft: number;
    priceAed: number;
    imageUrl: string;
  }>;
  sync: {
    status: "pending" | "success" | "failed";
    cachedCount: number;
    totalCount: number;
    lastAttemptedAt: string;
    lastSyncedAt: string;
    error: string;
  } | null;
};
type ConfirmedProjectFacts = {
  slug: string;
  bedroom: string;
  unitReference: string;
  unitPrice: string;
  unitAreaSqft: string;
  annualRent: string;
  annualRentLow: string;
  annualRentHigh: string;
  occupancyRate: string;
  serviceChargePerSqft: string;
  otherAnnualCosts: string;
  acquisitionCosts: string;
  rentalEvidenceNotes: string;
  confirmationNotes: string;
};
type ReportProjectOption = ProjectOption & {
  paymentSchedule?: Array<{ label: string; percentage: number; amount: number }>;
  unitReference?: string;
  bedroom?: string;
  unitPrice?: number;
  unitAreaSqft?: number;
  annualRent?: number;
  annualRentLow?: number;
  annualRentHigh?: number;
  occupancyRate?: number;
  effectiveAnnualRent?: number;
  serviceChargePerSqft?: number;
  annualServiceCharge?: number;
  otherAnnualCosts?: number;
  acquisitionCosts?: number;
  unitPricePerSqft?: number;
  grossYield?: number;
  netYield?: number;
  effectiveNetYield?: number;
  nearby?: Array<{ name: string; category: string; distanceKm: number }>;
  upcoming?: Array<{ name: string; developer: string; handover: string; distanceKm: number | null }>;
  areaBenchmark?: { display: string; period: string; note: string } | null;
  demandSegments?: string[];
  demographicContext?: ProjectResearch["demographicContext"];
  rentalEvidence?: ProjectResearch["rentalEvidence"];
  rentalEvidenceNotes?: string;
  advisoryScreen?: {
    total: number;
    label: string;
    statement: string;
    factors: Array<{ label: string; weight: number; score: number; rationale: string }>;
  };
};
type DocumentContent = {
  executiveSummary: string;
  recommendation: string;
  marketPosition?: string;
  locationStory?: string;
  riskNotes?: string[];
  advisoryScope: string[];
  nextSteps: string[];
  projects: ReportProjectOption[];
  notes: string;
  preparedAt?: string;
  advisor?: { name: string; email: string; phone: string; title: string };
  marketContext?: {
    scope: string;
    period: string;
    headline: Array<{ label: string; display: string; note: string }>;
    charts: Array<{ title: string; subtitle: string; data: Array<{ label: string; value: number; display: string }> }>;
  };
  residencyGuidance?: {
    title: string;
    threshold: string;
    status: string;
    summary: string;
  };
};
type AgentDocument = {
  id: string;
  agent_email: string;
  type: "sales_offer" | "proposal" | "comparison";
  title: string;
  client_name: string;
  status: string;
  created_at: string;
  updated_at: string;
  content: DocumentContent;
};
type DocumentSummary = Omit<AgentDocument, "content">;
type ChatMessage = { id: string; role: "user" | "assistant"; content: string; sources?: Array<{ label: string; href: string }> };
type AdminUser = {
  email: string;
  name: string;
  role: string;
  active: boolean;
  createdAt: string;
  username: string;
  lastLoginAt: string | null;
  passwordChangedAt: string | null;
  mustChangePassword: boolean;
  hasPassword: boolean;
  phone: string;
  title: string;
  avatarUrl: string;
  documentCount: number;
};
type AdvisorProfile = {
  displayName: string;
  title: string;
  avatarUrl: string;
  topDevelopers: string[];
  topProjectSlugs: string[];
  topProjects: ProjectOption[];
  customProjects: CustomProject[];
  headline: string;
  bio: string;
  specialties: string[];
  recommendations: string[];
  portfolioPublic: boolean;
  portfolioSlug: string;
  contactPhone: string;
  whatsappPhone: string;
  linkedinUrl: string;
  instagramUrl: string;
  propertyFinder: PropertyFinderProfile | null;
  onboardingComplete: boolean;
  updatedAt: string;
};

const MIN_PROFILE_DEVELOPERS = 3;
const MAX_PROFILE_DEVELOPERS = 8;
const MIN_PROFILE_PROJECTS = 3;
const MAX_PROFILE_PROJECTS = 12;
type SecondaryUnit = {
  id: string;
  title: string;
  community: string;
  emirate: string;
  propertyType: string;
  bedrooms: string;
  bathrooms: number;
  sizeSqft: number;
  priceAed: number;
  reference: string;
  imageUrl: string;
  description: string;
  status: "available" | "under_offer" | "sold" | "leased";
  published: boolean;
  createdAt: string;
  updatedAt: string;
};
type SecondaryUnitDraft = {
  title: string;
  community: string;
  emirate: string;
  propertyType: string;
  bedrooms: string;
  bathrooms: string;
  sizeSqft: string;
  priceAed: string;
  reference: string;
  imageUrl: string;
  description: string;
  status: SecondaryUnit["status"];
  published: boolean;
};
type AdvisorProfilePayload = {
  profile: AdvisorProfile;
  developerOptions: string[];
  featuredProjects: ProjectOption[];
};

const tools: Array<{ id: AgentTool; label: string; note: string }> = [
  { id: "overview", label: "Workspace", note: "Today and recent work" },
  { id: "chat", label: "AI research", note: "Evidence-led advisory chat" },
  { id: "portfolio", label: "My portfolio", note: "Profile and client link" },
  { id: "sales_offer", label: "Curated offer", note: "Customer-ready opportunity" },
  { id: "proposal", label: "Curated brief", note: "Visual investment presentation" },
  { id: "comparison", label: "Compare projects", note: "Two to six developments" },
  { id: "documents", label: "Documents", note: "Drafts and sent files" },
  { id: "admin", label: "User administration", note: "Staff access and status" },
];

const toolDemos: Record<AgentTool, {
  title: string;
  summary: string;
  steps: Array<{ selector: string; title: string; copy: string }>;
  example: string;
}> = {
  overview: {
    title: "Your workspace at a glance",
    summary: "Start here to choose the right workflow and reopen recent client work.",
    steps: [
      { selector: "overview-profile", title: "Your advisor identity", copy: "This profile is printed on client-facing reports and emails. Confirm the name, title, company email and contact number before preparing a presentation." },
      { selector: "overview-tools", title: "Choose the right workflow", copy: "Open AI research for questions, a curated offer for one opportunity, a curated brief for an investment case, or comparison for two to six projects." },
      { selector: "overview-recent", title: "Continue saved work", copy: "Recent reports appear here. The full Documents library lets you reopen, download, send or delete each saved brief." },
    ],
    example: "A buyer comparing two waterfront launches should begin with Compare projects, then save the finished brief in Documents.",
  },
  chat: {
    title: "Research with the AI desk",
    summary: "Ask one focused property or investment question and refine the answer through follow-up questions.",
    steps: [
      { selector: "chat-modes", title: "Choose the response style", copy: "Research mode prioritises evidence, risks and next checks. Advisory mode turns confirmed facts into concise client guidance." },
      { selector: "chat-prompts", title: "Start with a focused question", copy: "Use a sample prompt or include the location, budget, property type, holding period and client objective in your own question." },
      { selector: "chat-composer", title: "Build the research thread", copy: "Ask follow-up questions here. Treat every response as research support and verify live price, availability and transaction documents before presenting it." },
    ],
    example: "Compare Dubai Islands waterfront apartments below AED 4 million for a five-year investment horizon.",
  },
  portfolio: {
    title: "Build your advisor portfolio",
    summary: "Shape the expertise clients see, amend the AI draft and publish a link you control.",
    steps: [
      { selector: "portfolio-focus", title: "Set your market focus", copy: "Your three preferred developers and projects guide the AI profile. You can update them whenever your active portfolio changes." },
      { selector: "portfolio-copy", title: "Make the profile yours", copy: "Review the generated headline, introduction, specialties and private recommendations. Edit every field before saving." },
      { selector: "portfolio-contact", title: "Add direct contact options", copy: "Keep your calling and WhatsApp numbers current, then add LinkedIn and Instagram only when those profiles are ready for clients." },
      { selector: "portfolio-units", title: "Maintain secondary units", copy: "Add, edit, publish or remove your own secondary-market stock. Each listing stays attached to your account and appears on your client page only when published." },
      { selector: "portfolio-sharing", title: "Share with clients", copy: "Publish only when the profile is ready. Copy the dedicated link and send it directly to clients as your HAUS & GRACE portfolio." },
    ],
    example: "Select your focus, add direct contact links, publish two verified secondary units and share the client portfolio.",
  },
  sales_offer: {
    title: "Build a curated offer",
    summary: "Present one selected opportunity with a dated price, return scenario and client-focused recommendation.",
    steps: [
      { selector: "builder-client", title: "Frame the client decision", copy: "Add the buyer’s name, budget, intended use, holding period, preferences and the advisor details that must appear on the report." },
      { selector: "builder-project", title: "Select the opportunity", copy: "Search the live catalogue and choose the project. The unit configuration, price, area, rent, costs and payment schedule become editable after selection." },
      { selector: "builder-output", title: "Understand the finished report", copy: "The report includes project imagery, transaction charts, unit economics, rental scenarios, accessibility, community evidence, risks, sources and next actions." },
      { selector: "builder-generate", title: "Generate, review and deliver", copy: "The readiness panel shows anything still missing. When complete, generate the report, review the narrative, then download or send the PDF." },
    ],
    example: "Create an offer for a two-bedroom residence, including price per sqft, projected yield, access and nearby establishments.",
  },
  proposal: {
    title: "Create a curated brief",
    summary: "Turn a broader client objective into a structured, visual investment presentation.",
    steps: [
      { selector: "builder-client", title: "Describe the decision", copy: "Record the client’s budget, priorities, holding period, residence needs and the questions the presentation must answer." },
      { selector: "builder-project", title: "Choose the opportunity", copy: "Select a development, choose the bedroom configuration and confirm every unit-level assumption used in the calculations." },
      { selector: "builder-output", title: "See what will be built", copy: "The client-ready PDF combines visuals, transaction charts, ROI scenarios, payment timing, community scoring, access, pipeline, Golden Visa context and methodology." },
      { selector: "builder-generate", title: "Prepare client delivery", copy: "Complete the readiness checks, generate the report, review the recommendation and personalise the client email before sending." },
    ],
    example: "Prepare a UAE investment brief for a client seeking income, capital appreciation and Golden Visa planning context.",
  },
  comparison: {
    title: "Compare projects consistently",
    summary: "Place two to six developments on the same evidence frame so trade-offs are easy to explain.",
    steps: [
      { selector: "builder-client", title: "Define one comparison question", copy: "Keep the client objective, budget and time horizon consistent so the shortlist answers one clear decision." },
      { selector: "builder-project", title: "Select comparable projects", copy: "Choose two to six relevant developments. Each selected unit gets its own editable price, area, rent, fees, payment schedule and acquisition costs." },
      { selector: "builder-output", title: "Compare on one evidence frame", copy: "The finished report aligns unit economics, AED per sqft, yields, community factors, access, pipeline, risks and source notes." },
      { selector: "builder-generate", title: "Confirm and generate", copy: "Resolve every readiness item, confirm the dated assumptions and generate the client-facing comparison for review and delivery." },
    ],
    example: "Compare three Dubai launches on net yield, AED per sqft, payment plan, accessibility and upcoming supply.",
  },
  documents: {
    title: "Manage saved client files",
    summary: "Every generated brief is kept here until its owner or an administrator removes it.",
    steps: [
      { selector: "documents-library", title: "Open and refine", copy: "Select one of your saved files to edit its title, client name, summary, recommendation or delivery details." },
      { selector: "documents-library", title: "Download or send", copy: "Open the report, verify the client and unit evidence, then download the current PDF or send it from your company email." },
      { selector: "documents-library", title: "Delete carefully", copy: "Use Delete only when the file is no longer needed. The confirmation step permanently removes the saved report." },
    ],
    example: "Open the latest client brief, confirm the recipient email, send it, then retain the sent version for reference.",
  },
  admin: {
    title: "Manage staff access",
    summary: "Create, suspend or permanently remove agent accounts and review files across the team.",
    steps: [
      { selector: "admin-create", title: "Create secure access", copy: "Enter the staff name, company email and temporary six-digit PIN. The user must replace it at first sign-in." },
      { selector: "admin-users", title: "Suspend before deleting", copy: "Suspension immediately blocks access while preserving the user’s work. Use it when access may be restored later." },
      { selector: "admin-users", title: "Delete only when final", copy: "Permanent deletion removes the profile, sessions, chats and saved documents. Protected administrators cannot be deleted." },
    ],
    example: "For a temporary leave, suspend the account. For a confirmed departure, review the file count and then permanently delete it.",
  },
};

function Logo() {
  const logo = withBasePath("/brand/haus-grace-properties-logo-transparent.png");
  const style = { "--agent-wordmark": `url("${logo}")` } as CSSProperties;
  return <span className="agent-wordmark" style={style}><img src={logo} alt="HAUS & GRACE Properties" /></span>;
}

function AgentAvatar({ user, className = "" }: { user: Pick<AgentUser, "name" | "avatarUrl">; className?: string }) {
  const initial = user.name.trim().charAt(0).toUpperCase() || "H";
  return <span className={`agent-avatar ${className}`.trim()} aria-label={`${user.name} profile photo`}>
    {user.avatarUrl
      ? <img src={withBasePath(user.avatarUrl)} alt={`${user.name}, HAUS & GRACE`} />
      : <span aria-hidden="true">{initial}</span>}
  </span>;
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(withBasePath(path), {
    credentials: "include",
    ...init,
    headers: {
      ...(init?.body ? { "content-type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  const payload = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new Error(payload.error || "The workspace could not complete this request.");
  return payload;
}

function SignIn({ onAuthenticated }: { onAuthenticated: (user: AgentUser) => void }) {
  const [mode, setMode] = useState<"login" | "setup-email" | "setup-password">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [masked, setMasked] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function login(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      const result = await api<{ user: AgentUser }>("/api/agent/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      onAuthenticated(result.user);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }

  async function requestPasswordCode(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      const result = await api<{ email: string }>("/api/agent/auth/password/request", { method: "POST", body: JSON.stringify({ email }) });
      setMasked(result.email); setMode("setup-password");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to send the code.");
    } finally {
      setBusy(false);
    }
  }

  async function completePasswordSetup(event: FormEvent) {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }
    setBusy(true); setError("");
    try {
      const result = await api<{ user: AgentUser }>("/api/agent/auth/password/complete", {
        method: "POST",
        body: JSON.stringify({ email, code, password: newPassword }),
      });
      onAuthenticated(result.user);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to create the password.");
    } finally {
      setBusy(false);
    }
  }

  function showLogin() {
    setMode("login");
    setCode("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
  }

  return <div className="agent-auth-shell">
    <div className="agent-auth-brand"><Link href="/"><Logo /></Link><span>Private agent workspace</span></div>
    <section className="agent-auth-panel">
      <p className="kicker">HAUS &amp; GRACE team access</p>
      <h1>{mode === "login" ? <>Your private<br /><em>advisory desk.</em></> : mode === "setup-email" ? <>Create your<br /><em>secure access.</em></> : <>Check your<br /><em>staff inbox.</em></>}</h1>
      <p>{mode === "login"
        ? "Sign in with your HAUS & GRACE username and password to access research, proposals, sales offers and project comparisons."
        : mode === "setup-email"
          ? "Use your company email to create a first password or securely replace a forgotten one."
          : `A six-digit password verification code was sent to ${masked}.`}</p>
      {mode === "login" ? <form onSubmit={login}>
        <label><span>Username or staff email</span><input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="name or name@hausandgrace.ae" autoComplete="username" required /></label>
        <label><span>Password</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Your private password" autoComplete="current-password" required /></label>
        <button disabled={busy}>{busy ? "Signing in" : "Enter workspace"}</button>
        <button type="button" className="agent-text-button" onClick={() => { setMode("setup-email"); setError(""); }}>First sign-in or forgot password?</button>
      </form> : mode === "setup-email" ? <form onSubmit={requestPasswordCode}>
        <label><span>Staff email</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@hausandgrace.ae" autoComplete="email" required /></label>
        <button disabled={busy}>{busy ? "Sending verification" : "Send verification code"}</button>
        <button type="button" className="agent-text-button" onClick={showLogin}>Back to login</button>
      </form> : <form onSubmit={completePasswordSetup}>
        <label><span>Six-digit code</span><input className="agent-code-input" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} placeholder="000000" autoComplete="one-time-code" required /></label>
        <label><span>New password</span><input type="password" minLength={6} maxLength={128} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="Six-digit PIN or secure passphrase" autoComplete="new-password" required /></label>
        <label><span>Confirm password</span><input type="password" minLength={6} maxLength={128} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repeat your password" autoComplete="new-password" required /></label>
        <button disabled={busy || code.length !== 6}>{busy ? "Securing access" : "Create password and continue"}</button>
        <button type="button" className="agent-text-button" onClick={showLogin}>Back to login</button>
      </form>}
      {error && <p className="agent-form-error" role="alert">{error}</p>}
      <small>Access is restricted to active @hausandgrace.ae staff accounts. Passwords are securely derived and sessions expire automatically.</small>
    </section>
    <aside className="agent-auth-aside"><span>Private client system</span><h2>Research.<br />Compare.<br /><em>Present value.</em></h2><p>Every output follows the HAUS &amp; GRACE visual and advisory standard.</p></aside>
  </div>;
}

function PasswordChange({ user, onChanged, onSignOut }: {
  user: AgentUser;
  onChanged: (user: AgentUser) => void;
  onSignOut: () => void;
}) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (password !== confirmation) {
      setError("The passwords do not match.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await api<{ user: AgentUser }>("/api/agent/auth/password/change", {
        method: "POST",
        body: JSON.stringify({ password }),
      });
      setPassword("");
      setConfirmation("");
      onChanged(result.user);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to secure the account.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="agent-auth-shell agent-password-change">
    <div className="agent-auth-brand"><Link href="/"><Logo /></Link><span>Secure staff access</span></div>
    <section className="agent-auth-panel">
      <AgentAvatar user={user} className="agent-avatar-auth" />
      <p className="kicker">First sign-in security</p>
      <h1>Replace the<br /><em>temporary password.</em></h1>
      <p>Welcome, {user.name}. Create a private password before opening the agent workspace. The temporary credential will stop working immediately.</p>
      <form onSubmit={submit}>
        <label><span>New password</span><input type="password" minLength={6} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Six-digit PIN or secure passphrase" autoComplete="new-password" required /></label>
        <label><span>Confirm password</span><input type="password" minLength={6} maxLength={128} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Repeat your password" autoComplete="new-password" required /></label>
        <button disabled={busy}>{busy ? "Securing workspace access" : "Save password and open workspace"}</button>
        <button type="button" className="agent-text-button" onClick={onSignOut}>Sign out</button>
      </form>
      {error && <p className="agent-form-error" role="alert">{error}</p>}
      <small>Use a six-digit PIN or a longer secure passphrase. Five failed attempts trigger a temporary lock. All existing sessions close when the password changes.</small>
    </section>
    <aside className="agent-auth-aside"><span>Your agent profile</span><h2>Research clearly.<br />Present value.<br /><em>Advise securely.</em></h2><p>Your profile, research tools and client presentations stay together inside the HAUS &amp; GRACE workspace.</p></aside>
  </div>;
}

function FocusChoicePicker({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const visible = options.filter((option) => option.toLowerCase().includes(query.toLowerCase())).slice(0, 60);
  function toggle(value: string) {
    if (selected.includes(value)) onChange(selected.filter((item) => item !== value));
    else if (selected.length < MAX_PROFILE_DEVELOPERS) onChange([...selected, value]);
  }
  return <section className="agent-focus-picker">
    <header><div><span>{label}</span><strong>{selected.length} selected · {MIN_PROFILE_DEVELOPERS} minimum</strong></div></header>
    <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${label.toLowerCase()}`} aria-label={`Search ${label.toLowerCase()}`} />
    <div className="agent-focus-selected">{selected.map((value) => <button type="button" key={value} onClick={() => toggle(value)}>{value}<span aria-hidden="true">×</span></button>)}</div>
    <div className="agent-focus-options">{visible.map((value) => <button type="button" key={value} data-selected={selected.includes(value) ? "" : undefined} disabled={!selected.includes(value) && selected.length === MAX_PROFILE_DEVELOPERS} onClick={() => toggle(value)}>{value}</button>)}</div>
  </section>;
}

function ProjectFocusPicker({
  selected,
  onChange,
  featured,
  remaining,
}: {
  selected: ProjectOption[];
  onChange: (selected: ProjectOption[]) => void;
  featured: ProjectOption[];
  remaining: number;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(featured);
  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      api<{ projects: ProjectOption[] }>(`/api/agent/projects?q=${encodeURIComponent(query)}`)
        .then((result) => { if (active) setResults(result.projects); })
        .catch(() => { if (active) setResults(featured); });
    }, query ? 220 : 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [query, featured]);
  function toggle(project: ProjectOption) {
    if (selected.some((item) => item.slug === project.slug)) onChange(selected.filter((item) => item.slug !== project.slug));
    else if (remaining > 0) onChange([...selected, project]);
  }
  return <section className="agent-focus-picker agent-project-focus">
    <header><div><span>Portfolio projects</span><strong>{selected.length} selected · {remaining} spaces left</strong></div></header>
    <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search project, developer or community" aria-label="Search projects" />
    <div className="agent-focus-selected">{selected.map((project) => <button type="button" key={project.slug} onClick={() => toggle(project)}>{project.name}<span aria-hidden="true">×</span></button>)}</div>
    <div className="agent-project-focus-results">{results.map((project) => {
      const isSelected = selected.some((item) => item.slug === project.slug);
      return <button type="button" key={project.slug} data-selected={isSelected ? "" : undefined} disabled={!isSelected && remaining === 0} onClick={() => toggle(project)}>
        {project.imageUrl ? <img src={project.imageUrl} alt="" loading="lazy" /> : <span className="agent-project-placeholder" />}
        <span><strong>{project.name}</strong><small>{project.developer} · {project.location}</small></span>
      </button>;
    })}</div>
  </section>;
}

const emptyCustomProject = {
  name: "",
  developer: "",
  location: "",
  emirate: "Dubai",
  startingPrice: "",
  paymentPlan: "",
  handover: "",
  pricePerSqft: "",
  residences: "",
  bedrooms: "",
  positioning: "",
  imageUrl: "",
  projectUrl: "",
};

function CustomProjectEditor({
  projects,
  onChange,
  remaining,
}: {
  projects: CustomProject[];
  onChange: (projects: CustomProject[]) => void;
  remaining: number;
}) {
  const [draft, setDraft] = useState(emptyCustomProject);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  function update<Key extends keyof typeof emptyCustomProject>(key: Key, value: (typeof emptyCustomProject)[Key]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }
  function add(event: FormEvent) {
    event.preventDefault();
    if (remaining < 1) return setError(`A public portfolio can include up to ${MAX_PROFILE_PROJECTS} projects.`);
    if (draft.name.trim().length < 2 || draft.developer.trim().length < 2 || draft.location.trim().length < 2) {
      return setError("Add the project name, developer and community.");
    }
    const id = `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    onChange([...projects, { id, ...draft }]);
    setDraft(emptyCustomProject);
    setError("");
    setOpen(false);
  }
  return <section className="agent-custom-projects">
    <header><div><span>Own project records</span><p>Add a current project that is not yet in the main catalogue. Keep the project photograph clean and link to a secure source when available.</p></div><button type="button" onClick={() => setOpen((value) => !value)} disabled={!open && remaining === 0}>{open ? "Close form" : "Add own project"}</button></header>
    {projects.length > 0 && <div className="agent-custom-project-list">{projects.map((project) => <article key={project.id}>
      {project.imageUrl ? <img src={project.imageUrl} alt="" loading="lazy" /> : <span />}
      <div><strong>{project.name}</strong><small>{project.developer} · {project.location}</small></div>
      <button type="button" onClick={() => onChange(projects.filter((item) => item.id !== project.id))}>Remove</button>
    </article>)}</div>}
    {open && <form onSubmit={add} className="agent-custom-project-form">
      <label><span>Project name</span><input value={draft.name} onChange={(event) => update("name", event.target.value)} maxLength={120} required /></label>
      <label><span>Developer</span><input value={draft.developer} onChange={(event) => update("developer", event.target.value)} maxLength={100} required /></label>
      <label><span>Community</span><input value={draft.location} onChange={(event) => update("location", event.target.value)} maxLength={120} required /></label>
      <label><span>Emirate</span><select value={draft.emirate} onChange={(event) => update("emirate", event.target.value)}><option>Dubai</option><option>Abu Dhabi</option><option>Ras Al Khaimah</option><option>Sharjah</option><option>Ajman</option><option>Fujairah</option><option>Umm Al Quwain</option></select></label>
      <label><span>Starting price</span><input value={draft.startingPrice} onChange={(event) => update("startingPrice", event.target.value)} placeholder="AED 1,250,000" maxLength={80} /></label>
      <label><span>Handover</span><input value={draft.handover} onChange={(event) => update("handover", event.target.value)} placeholder="Q4 2028" maxLength={80} /></label>
      <label><span>Payment plan</span><input value={draft.paymentPlan} onChange={(event) => update("paymentPlan", event.target.value)} placeholder="20 / 50 / 30" maxLength={80} /></label>
      <label><span>Configurations</span><input value={draft.bedrooms} onChange={(event) => update("bedrooms", event.target.value)} placeholder="1–3 bedrooms" maxLength={100} /></label>
      <label className="wide"><span>Clean image URL</span><input type="url" value={draft.imageUrl} onChange={(event) => update("imageUrl", event.target.value)} placeholder="https://..." maxLength={500} /></label>
      <label className="wide"><span>Project information URL</span><input type="url" value={draft.projectUrl} onChange={(event) => update("projectUrl", event.target.value)} placeholder="https://..." maxLength={500} /></label>
      {error && <p className="agent-form-error wide" role="alert">{error}</p>}
      <button className="agent-primary-action wide" disabled={remaining < 1}>Add to portfolio</button>
    </form>}
  </section>;
}

function AdvisorOnboarding({ user, onComplete, onSignOut }: {
  user: AgentUser;
  onComplete: (profile: AdvisorProfile) => void;
  onSignOut: () => void;
}) {
  const [payload, setPayload] = useState<AdvisorProfilePayload | null>(null);
  const [developers, setDevelopers] = useState<string[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [customProjects, setCustomProjects] = useState<CustomProject[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    api<AdvisorProfilePayload>("/api/agent/advisor-profile")
      .then((result) => {
        setPayload(result);
        setDevelopers(result.profile.topDevelopers);
        setProjects(result.profile.topProjects);
        setCustomProjects(result.profile.customProjects);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to prepare your advisor profile."));
  }, []);
  async function submit(event: FormEvent) {
    event.preventDefault();
    const projectTotal = projects.length + customProjects.length;
    if (developers.length < MIN_PROFILE_DEVELOPERS || projectTotal < MIN_PROFILE_PROJECTS) {
      setError(`Select at least ${MIN_PROFILE_DEVELOPERS} developers and ${MIN_PROFILE_PROJECTS} projects.`);
      return;
    }
    setBusy(true); setError("");
    try {
      const result = await api<{ profile: AdvisorProfile }>("/api/agent/advisor-profile", {
        method: "POST",
        body: JSON.stringify({ topDevelopers: developers, topProjects: projects.map((project) => project.slug), customProjects }),
      });
      onComplete(result.profile);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to build your advisor profile.");
    } finally {
      setBusy(false);
    }
  }
  return <div className="agent-onboarding">
    <header className="agent-onboarding-bar"><Link href="/"><Logo /></Link><div><AgentAvatar user={user} /><button type="button" onClick={onSignOut}>Sign out</button></div></header>
    <main>
      <div className="agent-onboarding-intro">
        <p className="kicker">Personalise your workspace</p>
        <h1>Build the focus behind<br /><em>your advice.</em></h1>
        <p>Welcome, {user.name}. Choose the developers and projects you know best. The AI desk will prepare a starting profile and practical recommendations that you can review and amend.</p>
      </div>
      {payload ? <form onSubmit={submit} className="agent-onboarding-form">
        <FocusChoicePicker label="Top developers" options={payload.developerOptions} selected={developers} onChange={setDevelopers} />
        <ProjectFocusPicker featured={payload.featuredProjects} selected={projects} onChange={setProjects} remaining={MAX_PROFILE_PROJECTS - projects.length - customProjects.length} />
        <CustomProjectEditor projects={customProjects} onChange={setCustomProjects} remaining={MAX_PROFILE_PROJECTS - projects.length - customProjects.length} />
        {error && <p className="agent-form-error" role="alert">{error}</p>}
        <div className="agent-onboarding-submit"><span>{developers.length} developers · {projects.length + customProjects.length} projects</span><button disabled={busy || developers.length < MIN_PROFILE_DEVELOPERS || projects.length + customProjects.length < MIN_PROFILE_PROJECTS}>{busy ? "Building your advisor profile" : "Create my advisor profile"}</button></div>
      </form> : <div className="agent-profile-loading">{error || "Preparing developers and projects"}</div>}
    </main>
  </div>;
}

const emptySecondaryUnit: SecondaryUnitDraft = {
  title: "",
  community: "",
  emirate: "Dubai",
  propertyType: "Apartment",
  bedrooms: "",
  bathrooms: "",
  sizeSqft: "",
  priceAed: "",
  reference: "",
  imageUrl: "",
  description: "",
  status: "available",
  published: false,
};

function secondaryUnitDraft(unit: SecondaryUnit): SecondaryUnitDraft {
  return {
    title: unit.title,
    community: unit.community,
    emirate: unit.emirate,
    propertyType: unit.propertyType,
    bedrooms: unit.bedrooms,
    bathrooms: String(unit.bathrooms),
    sizeSqft: String(unit.sizeSqft),
    priceAed: String(unit.priceAed),
    reference: unit.reference,
    imageUrl: unit.imageUrl,
    description: unit.description,
    status: unit.status,
    published: unit.published,
  };
}

function secondaryStatusLabel(status: SecondaryUnit["status"]) {
  return ({ available: "Available", under_offer: "Under offer", sold: "Sold", leased: "Leased" })[status];
}

function SecondaryUnitsPanel() {
  const [units, setUnits] = useState<SecondaryUnit[]>([]);
  const [draft, setDraft] = useState<SecondaryUnitDraft>(emptySecondaryUnit);
  const [editingId, setEditingId] = useState("");
  const [deleting, setDeleting] = useState<SecondaryUnit | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadUnits = useCallback(async () => {
    try {
      const result = await api<{ units: SecondaryUnit[] }>("/api/agent/secondary-units");
      setUnits(result.units);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load your secondary units.");
    }
  }, []);

  useEffect(() => {
    void loadUnits();
  }, [loadUnits]);

  function updateDraft<Key extends keyof SecondaryUnitDraft>(key: Key, value: SecondaryUnitDraft[Key]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function resetDraft() {
    setDraft(emptySecondaryUnit);
    setEditingId("");
    setError("");
  }

  async function saveUnit(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setError(""); setMessage("");
    try {
      const result = await api<{ unit: SecondaryUnit }>(
        editingId ? `/api/agent/secondary-units/${editingId}` : "/api/agent/secondary-units",
        {
          method: editingId ? "PATCH" : "POST",
          body: JSON.stringify({
            ...draft,
            bathrooms: Number(draft.bathrooms || 0),
            sizeSqft: Number(draft.sizeSqft),
            priceAed: Number(draft.priceAed),
          }),
        },
      );
      setUnits((current) => {
        const remaining = current.filter((unit) => unit.id !== result.unit.id);
        return [result.unit, ...remaining];
      });
      setMessage(editingId ? "Secondary unit updated." : "Secondary unit added to your portfolio.");
      setDraft(emptySecondaryUnit);
      setEditingId("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save this unit.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteUnit() {
    if (!deleting) return;
    setBusy(true); setError(""); setMessage("");
    try {
      await api<{ ok: true }>(`/api/agent/secondary-units/${deleting.id}`, { method: "DELETE" });
      setUnits((current) => current.filter((unit) => unit.id !== deleting.id));
      if (editingId === deleting.id) resetDraft();
      setMessage(`${deleting.title} was removed.`);
      setDeleting(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to remove this unit.");
    } finally {
      setBusy(false);
    }
  }

  return <section data-tour="portfolio-units" className="agent-secondary-units">
    <header><div><span>Agent-owned inventory</span><h2>Secondary units</h2><p>Add ready and resale opportunities you personally maintain. Publish only after price, availability and ownership documents have been reconfirmed.</p></div><strong>{units.length} unit{units.length === 1 ? "" : "s"}</strong></header>
    <div className="agent-secondary-layout">
      <form onSubmit={saveUnit} className="agent-secondary-form">
        <div className="agent-secondary-form-title"><div><span>{editingId ? "Editing unit" : "New unit"}</span><h3>{editingId ? draft.title : "Add secondary inventory"}</h3></div>{editingId && <button type="button" onClick={resetDraft}>Cancel edit</button>}</div>
        <div className="agent-secondary-fields">
          <label className="wide"><span>Listing title</span><input value={draft.title} onChange={(event) => updateDraft("title", event.target.value)} placeholder="Marina view residence" maxLength={120} required /></label>
          <label><span>Community</span><input value={draft.community} onChange={(event) => updateDraft("community", event.target.value)} placeholder="Dubai Marina" maxLength={100} required /></label>
          <label><span>Emirate</span><select value={draft.emirate} onChange={(event) => updateDraft("emirate", event.target.value)}><option>Dubai</option><option>Abu Dhabi</option><option>Ras Al Khaimah</option><option>Sharjah</option><option>Ajman</option><option>Fujairah</option><option>Umm Al Quwain</option></select></label>
          <label><span>Property type</span><select value={draft.propertyType} onChange={(event) => updateDraft("propertyType", event.target.value)}><option>Apartment</option><option>Villa</option><option>Townhouse</option><option>Penthouse</option><option>Duplex</option><option>Plot</option><option>Office</option><option>Retail</option></select></label>
          <label><span>Bedrooms</span><input value={draft.bedrooms} onChange={(event) => updateDraft("bedrooms", event.target.value)} placeholder="2 bedrooms or Studio" maxLength={40} required /></label>
          <label><span>Bathrooms</span><input type="number" min="0" max="30" value={draft.bathrooms} onChange={(event) => updateDraft("bathrooms", event.target.value)} placeholder="2" /></label>
          <label><span>Internal area, sqft</span><input type="number" min="1" max="1000000" value={draft.sizeSqft} onChange={(event) => updateDraft("sizeSqft", event.target.value)} placeholder="1,250" required /></label>
          <label><span>Asking price, AED</span><input type="number" min="1" max="1000000000" value={draft.priceAed} onChange={(event) => updateDraft("priceAed", event.target.value)} placeholder="2,450,000" required /></label>
          <label><span>Listing reference</span><input value={draft.reference} onChange={(event) => updateDraft("reference", event.target.value)} placeholder="HG-S-1042" maxLength={80} /></label>
          <label><span>Status</span><select value={draft.status} onChange={(event) => updateDraft("status", event.target.value as SecondaryUnit["status"])}><option value="available">Available</option><option value="under_offer">Under offer</option><option value="sold">Sold</option><option value="leased">Leased</option></select></label>
          <label className="wide"><span>Image URL</span><small>Use a clean property photograph with no promotional text, QR code or watermark.</small><input type="url" value={draft.imageUrl} onChange={(event) => updateDraft("imageUrl", event.target.value)} placeholder="https://..." maxLength={500} /></label>
          <label className="wide"><span>Short property note</span><textarea value={draft.description} onChange={(event) => updateDraft("description", event.target.value)} rows={4} maxLength={1000} placeholder="Condition, view, occupancy and the most relevant client context." /></label>
        </div>
        <label className="agent-publish-toggle"><input type="checkbox" checked={draft.published} onChange={(event) => updateDraft("published", event.target.checked)} /><span>Show this unit on my public advisor page</span></label>
        <button className="agent-primary-action" disabled={busy}>{busy ? "Saving unit" : editingId ? "Update unit" : "Add unit"}</button>
        {message && <p className="agent-form-success" role="status">{message}</p>}
        {error && <p className="agent-form-error" role="alert">{error}</p>}
      </form>
      <div className="agent-secondary-list">
        {units.length ? units.map((unit) => <article key={unit.id}>
          <div>{unit.imageUrl ? <img src={unit.imageUrl} alt="" loading="lazy" /> : <span>{unit.propertyType}</span>}<strong data-status={unit.status}>{secondaryStatusLabel(unit.status)}</strong></div>
          <section><span>{unit.community} · {unit.emirate}</span><h3>{unit.title}</h3><p>AED {unit.priceAed.toLocaleString("en-AE")} · {unit.bedrooms} · {unit.sizeSqft.toLocaleString("en-AE")} sqft</p><small>{unit.published ? "Published on your advisor page" : "Private draft"}</small><footer><button type="button" onClick={() => { setEditingId(unit.id); setDraft(secondaryUnitDraft(unit)); setMessage(""); setError(""); }}>Edit</button><button type="button" onClick={() => setDeleting(unit)}>Delete</button></footer></section>
        </article>) : <div className="agent-secondary-empty"><span>No secondary units yet</span><p>Add the first verified opportunity using the form.</p></div>}
      </div>
    </div>
    {deleting && <ConfirmDialog title={`Delete ${deleting.title}?`} copy="This permanently removes the unit from your inventory and public advisor page." confirmLabel="Delete unit" busy={busy} onCancel={() => setDeleting(null)} onConfirm={() => void deleteUnit()} />}
  </section>;
}

function AdvisorPortfolioPanel({ user }: { user: AgentUser }) {
  const [payload, setPayload] = useState<AdvisorProfilePayload | null>(null);
  const [displayName, setDisplayName] = useState(user.name);
  const [roleTitle, setRoleTitle] = useState(user.title || "Property Advisor");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [specialties, setSpecialties] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [contactPhone, setContactPhone] = useState(user.phone || "");
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [developers, setDevelopers] = useState<string[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [customProjects, setCustomProjects] = useState<CustomProject[]>([]);
  const [editingFocus, setEditingFocus] = useState(false);
  const [busy, setBusy] = useState(false);
  const [syncingListings, setSyncingListings] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const applyProfile = useCallback((result: AdvisorProfilePayload | { profile: AdvisorProfile }) => {
    const profile = result.profile;
    setDisplayName(profile.displayName);
    setRoleTitle(profile.title);
    setHeadline(profile.headline);
    setBio(profile.bio);
    setSpecialties(profile.specialties.join("\n"));
    setRecommendations(profile.recommendations.join("\n"));
    setContactPhone(profile.contactPhone || user.phone || "");
    setWhatsappPhone(profile.whatsappPhone);
    setLinkedinUrl(profile.linkedinUrl);
    setInstagramUrl(profile.instagramUrl);
    setIsPublic(profile.portfolioPublic);
    setDevelopers(profile.topDevelopers);
    setProjects(profile.topProjects);
    setCustomProjects(profile.customProjects);
  }, [user.phone]);

  useEffect(() => {
    api<AdvisorProfilePayload>("/api/agent/advisor-profile")
      .then((result) => { setPayload(result); applyProfile(result); })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to load your advisor portfolio."));
  }, [applyProfile]);

  async function regenerate() {
    const projectTotal = projects.length + customProjects.length;
    if (developers.length < MIN_PROFILE_DEVELOPERS || projectTotal < MIN_PROFILE_PROJECTS) {
      setError(`Select at least ${MIN_PROFILE_DEVELOPERS} developers and ${MIN_PROFILE_PROJECTS} projects.`);
      return;
    }
    setBusy(true); setError(""); setMessage("");
    try {
      const result = await api<{ profile: AdvisorProfile }>("/api/agent/advisor-profile", {
        method: "POST",
        body: JSON.stringify({ topDevelopers: developers, topProjects: projects.map((project) => project.slug), customProjects }),
      });
      applyProfile(result);
      setEditingFocus(false);
      setMessage("Your focus and AI profile have been rebuilt. Review the copy before publishing.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to rebuild your profile.");
    } finally {
      setBusy(false);
    }
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setError(""); setMessage("");
    try {
      const result = await api<{ profile: AdvisorProfile }>("/api/agent/advisor-profile", {
        method: "PATCH",
        body: JSON.stringify({
          displayName,
          title: roleTitle,
          headline,
          bio,
          specialties: specialties.split("\n"),
          recommendations: recommendations.split("\n"),
          contactPhone,
          whatsappPhone,
          linkedinUrl,
          instagramUrl,
          portfolioPublic: isPublic,
        }),
      });
      applyProfile(result);
      setMessage(isPublic ? "Portfolio saved and ready to share." : "Portfolio draft saved privately.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save your profile.");
    } finally {
      setBusy(false);
    }
  }

  async function copyShareLink() {
    if (!payload?.profile.portfolioSlug) return;
    const url = `${window.location.origin}${withBasePath(`/advisors/${payload.profile.portfolioSlug}`)}`;
    await navigator.clipboard.writeText(url);
    setMessage("Client portfolio link copied.");
  }

  async function refreshExternalListings() {
    setSyncingListings(true); setMessage(""); setError("");
    try {
      const result = await api<{ profile: AdvisorProfile }>("/api/agent/property-finder/sync", {
        method: "POST",
      });
      applyProfile(result);
      setPayload((current) => current ? { ...current, profile: result.profile } : current);
      const count = result.profile.propertyFinder?.listings.length || 0;
      setMessage(`${count} current listing${count === 1 ? "" : "s"} refreshed on your public portfolio.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to refresh current listings.");
    } finally {
      setSyncingListings(false);
    }
  }

  if (!payload) return <section className="agent-panel"><div className="agent-profile-loading">{error || "Opening your portfolio"}</div></section>;
  return <section className="agent-panel agent-portfolio-panel">
    <header className="agent-section-title"><div><span>Advisor identity</span><h1>My portfolio</h1><p>Refine how your expertise is presented, then publish a dedicated link for clients.</p></div></header>
    <div className="agent-portfolio-preview">
      <div><AgentAvatar user={{ ...user, name: displayName }} className="agent-portfolio-avatar" /><span><small>{roleTitle}</small><strong>{displayName}</strong></span></div>
      <p>{headline || "Your advisor headline will appear here."}</p>
    </div>
    <div data-tour="portfolio-focus" className="agent-portfolio-focus">
      <header><div><span>Selected market focus</span><p>{developers.join(" · ")}</p></div><button type="button" onClick={() => setEditingFocus((value) => !value)}>{editingFocus ? "Keep current focus" : "Change focus"}</button></header>
      <div className="agent-portfolio-projects">
        {projects.map((project) => <article key={project.slug}>{project.imageUrl && <img src={project.imageUrl} alt="" loading="lazy" />}<span><strong>{project.name}</strong><small>{project.developer} · {project.location}</small></span></article>)}
        {customProjects.map((project) => <article key={project.id}>{project.imageUrl && <img src={project.imageUrl} alt="" loading="lazy" />}<span><strong>{project.name}</strong><small>{project.developer} · {project.location}</small></span></article>)}
      </div>
      {editingFocus && <div className="agent-portfolio-focus-editor">
        <FocusChoicePicker label="Top developers" options={payload.developerOptions} selected={developers} onChange={setDevelopers} />
        <ProjectFocusPicker featured={payload.featuredProjects} selected={projects} onChange={setProjects} remaining={MAX_PROFILE_PROJECTS - projects.length - customProjects.length} />
        <CustomProjectEditor projects={customProjects} onChange={setCustomProjects} remaining={MAX_PROFILE_PROJECTS - projects.length - customProjects.length} />
        <button type="button" className="agent-primary-action" onClick={() => void regenerate()} disabled={busy || developers.length < MIN_PROFILE_DEVELOPERS || projects.length + customProjects.length < MIN_PROFILE_PROJECTS}>{busy ? "Rebuilding profile" : "Regenerate AI profile"}</button>
      </div>}
    </div>
    <form onSubmit={save} className="agent-portfolio-form">
      <div data-tour="portfolio-copy" className="agent-portfolio-copy">
        <section className="agent-portfolio-identity-fields">
          <header><span>Public identity</span><p>Changes saved here update your client-facing advisor page immediately.</p></header>
          <div>
            <label><span>Full professional name</span><input value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={100} required /></label>
            <label><span>Role or specialisation</span><input value={roleTitle} onChange={(event) => setRoleTitle(event.target.value)} maxLength={80} required /></label>
          </div>
        </section>
        <label><span>Portfolio headline</span><input value={headline} onChange={(event) => setHeadline(event.target.value)} maxLength={100} required /></label>
        <label><span>Advisor introduction</span><textarea value={bio} onChange={(event) => setBio(event.target.value)} rows={7} maxLength={1600} required /></label>
        <label><span>Client-facing specialties</span><small>One specialty per line</small><textarea value={specialties} onChange={(event) => setSpecialties(event.target.value)} rows={6} /></label>
        <section data-tour="portfolio-contact" className="agent-portfolio-contact-fields">
          <header><span>Direct contact and social profiles</span><p>Only completed fields appear as branded buttons on your public advisor page.</p></header>
          <div>
            <label><span>Calling number</span><input type="tel" value={contactPhone} onChange={(event) => setContactPhone(event.target.value)} placeholder="+971 50 000 0000" maxLength={32} required /></label>
            <label><span>WhatsApp number</span><input type="tel" value={whatsappPhone} onChange={(event) => setWhatsappPhone(event.target.value)} placeholder="+971 50 000 0000" maxLength={32} /></label>
            <label><span>LinkedIn profile</span><input type="url" value={linkedinUrl} onChange={(event) => setLinkedinUrl(event.target.value)} placeholder="https://www.linkedin.com/in/..." maxLength={500} /></label>
            <label><span>Instagram profile</span><input type="url" value={instagramUrl} onChange={(event) => setInstagramUrl(event.target.value)} placeholder="https://www.instagram.com/..." maxLength={500} /></label>
          </div>
        </section>
        {payload.profile.propertyFinder && <section className="agent-property-finder-record">
          <header><span>Verified brokerage record and listings</span><p>Credentials and current inventory are matched to your HAUS &amp; GRACE email before anything is added to your public portfolio.</p></header>
          <dl>
            {payload.profile.propertyFinder.brn && <div><dt>Broker registration</dt><dd>BRN {payload.profile.propertyFinder.brn}</dd></div>}
            {payload.profile.propertyFinder.experience && <div><dt>Experience</dt><dd>{payload.profile.propertyFinder.experience}</dd></div>}
            {payload.profile.propertyFinder.languages.length > 0 && <div><dt>Languages</dt><dd>{payload.profile.propertyFinder.languages.join(" · ")}</dd></div>}
            {payload.profile.propertyFinder.areas.length > 0 && <div><dt>Current areas</dt><dd>{payload.profile.propertyFinder.areas.join(" · ")}</dd></div>}
            <div><dt>Listings on your page</dt><dd>{payload.profile.propertyFinder.listings.length}{payload.profile.propertyFinder.sync?.totalCount ? ` of ${payload.profile.propertyFinder.sync.totalCount} current listings` : " current listings"}</dd></div>
            <div><dt>Last refreshed</dt><dd>{formatAdminDate(payload.profile.propertyFinder.sync?.lastSyncedAt || null)}</dd></div>
          </dl>
          <div className="agent-property-finder-actions">
            <button type="button" onClick={() => void refreshExternalListings()} disabled={syncingListings}>{syncingListings ? "Refreshing listings" : "Refresh my listings"}</button>
            <a href={payload.profile.propertyFinder.profileUrl || payload.profile.propertyFinder.agencyUrl} target="_blank" rel="noreferrer">Open verified record</a>
          </div>
        </section>}
        <label><span>Private AI recommendations</span><small>These are visible only to you. Amend, remove or add one recommendation per line.</small><textarea value={recommendations} onChange={(event) => setRecommendations(event.target.value)} rows={7} /></label>
      </div>
      <aside data-tour="portfolio-sharing" className="agent-portfolio-sharing">
        <span>Client visibility</span>
        <h2>{isPublic ? "Portfolio is ready to share" : "Portfolio remains private"}</h2>
        <p>Publishing makes your name, contact buttons, introduction, specialties, selected focus and published secondary units visible at your dedicated HAUS & GRACE link. Private recommendations are never displayed.</p>
        <label className="agent-publish-toggle"><input type="checkbox" checked={isPublic} onChange={(event) => setIsPublic(event.target.checked)} /><span>Publish client portfolio</span></label>
        {isPublic && <button type="button" className="agent-secondary-action" onClick={() => void copyShareLink()}>Copy portfolio link</button>}
        <button className="agent-primary-action" disabled={busy}>{busy ? "Saving portfolio" : "Save portfolio"}</button>
        {message && <p className="agent-form-success" role="status">{message}</p>}
        {error && <p className="agent-form-error" role="alert">{error}</p>}
      </aside>
    </form>
    <SecondaryUnitsPanel />
  </section>;
}

function formatAdminDate(value: string | null) {
  if (!value) return "Not yet";
  const date = new Date(`${value.replace(" ", "T")}Z`);
  return Number.isNaN(date.valueOf()) ? "Not yet" : date.toLocaleDateString("en-AE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function ConfirmDialog({
  title,
  copy,
  confirmLabel,
  busy,
  onCancel,
  onConfirm,
}: {
  title: string;
  copy: string;
  confirmLabel: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return <div className="agent-dialog-backdrop" role="presentation" onMouseDown={(event) => {
    if (event.currentTarget === event.target && !busy) onCancel();
  }}>
    <section className="agent-confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="agent-confirm-title">
      <span>Permanent action</span>
      <h2 id="agent-confirm-title">{title}</h2>
      <p>{copy}</p>
      <div><button type="button" onClick={onCancel} disabled={busy}>Cancel</button><button type="button" className="danger" onClick={onConfirm} disabled={busy}>{busy ? "Deleting" : confirmLabel}</button></div>
    </section>
  </div>;
}

function AdminPanel({ currentUser }: { currentUser: AgentUser }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [title, setTitle] = useState("Property Advisor");
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [changing, setChanging] = useState("");
  const [deleting, setDeleting] = useState<AdminUser | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const loadUsers = useCallback(async () => {
    try {
      const result = await api<{ users: AdminUser[] }>("/api/agent/admin/users");
      setUsers(result.users);
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load staff accounts.");
    }
  }, []);

  useEffect(() => { void loadUsers(); }, [loadUsers]);

  async function createUser(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setStatus("");
    try {
      const result = await api<{ invitationSent: boolean }>("/api/agent/admin/users", {
        method: "POST",
        body: JSON.stringify({ name, email, phone, title, temporaryPassword }),
      });
      setName("");
      setEmail("");
      setPhone("");
      setTitle("Property Advisor");
      setTemporaryPassword("");
      setStatus(result.invitationSent
        ? "The account is active. The user can sign in with the temporary PIN and must replace it immediately."
        : "The account is active. Share the temporary PIN securely; the user must replace it at first sign-in.");
      await loadUsers();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to create the staff account.");
    } finally {
      setBusy(false);
    }
  }

  async function setActive(user: AdminUser, active: boolean) {
    setChanging(user.email);
    setError("");
    setStatus("");
    try {
      await api("/api/agent/admin/users", {
        method: "PATCH",
        body: JSON.stringify({ email: user.email, active }),
      });
      setStatus(`${user.name} is now ${active ? "active" : "suspended"}.`);
      await loadUsers();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to update the staff account.");
    } finally {
      setChanging("");
    }
  }

  async function deleteUser() {
    if (!deleting) return;
    setChanging(deleting.email);
    setError("");
    setStatus("");
    try {
      await api(`/api/agent/admin/users/${encodeURIComponent(deleting.email)}`, { method: "DELETE" });
      setStatus(`${deleting.name}'s account and associated workspace data were permanently deleted.`);
      setDeleting(null);
      await loadUsers();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to delete the staff account.");
    } finally {
      setChanging("");
    }
  }

  const activeCount = users.filter((user) => user.active).length;
  return <section className="agent-admin">
    <div className="agent-tool-intro">
      <div><p className="kicker">Administrator control</p><h1>Manage staff<br /><em>workspace access.</em></h1></div>
      <p>Create authorised HAUS &amp; GRACE users, monitor account readiness and suspend access immediately when required.</p>
    </div>
    <div className="agent-admin-summary">
      <div><span>Active users</span><strong>{activeCount}</strong><small>including administrator</small></div>
      <div><span>Total accounts</span><strong>{users.length}</strong><small>provisioned staff profiles</small></div>
      <div><span>Awaiting setup</span><strong>{users.filter((user) => !user.hasPassword || user.mustChangePassword).length}</strong><small>first login incomplete</small></div>
    </div>
    <form className="agent-admin-create" data-tour="admin-create" onSubmit={createUser}>
      <div><span>New staff access</span><h2>Create an agent account</h2><p>The user receives access only after this account is provisioned.</p></div>
      <label><span>Full name</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Agent name" maxLength={100} required /></label>
      <label><span>Company email</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@hausandgrace.ae" required /></label>
      <label><span>Contact number</span><input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Optional at setup" /></label>
      <label><span>Role title</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Property Advisor" maxLength={80} required /></label>
      <label><span>Temporary six-digit PIN</span><input type="password" inputMode="numeric" pattern="[0-9]{6}" minLength={6} maxLength={6} value={temporaryPassword} onChange={(event) => setTemporaryPassword(event.target.value.replace(/\D/g, ""))} placeholder="Six digits" autoComplete="new-password" required /></label>
      <button disabled={busy}>{busy ? "Creating account" : "Create user"}</button>
    </form>
    {status && <p className="agent-action-status" role="status">{status}</p>}
    {error && <p className="agent-form-error" role="alert">{error}</p>}
    <div className="agent-admin-users" data-tour="admin-users">
      <header><span>Staff directory</span><small>{users.length} accounts</small></header>
      {users.map((user) => <article key={user.email}>
        <div className="agent-admin-identity"><AgentAvatar user={user} className="agent-avatar-admin" /><span><strong>{user.name}</strong><small>{user.email}</small></span></div>
        <div><span>Role</span><strong>{user.title || user.role}</strong></div>
        <div><span>Username</span><strong>{user.username || "Pending setup"}</strong></div>
        <div><span>Contact</span><strong>{user.phone || "Not recorded"}</strong></div>
        <div><span>Status</span><strong data-status={user.active ? "active" : "suspended"}>{user.active ? (user.mustChangePassword ? "Password change required" : "Active") : "Suspended"}</strong></div>
        <div className="agent-admin-action">
          {user.role === "admin" || user.email === currentUser.email
            ? <small>Protected administrator</small>
            : <><button type="button" disabled={changing === user.email} onClick={() => void setActive(user, !user.active)}>{changing === user.email ? "Updating" : user.active ? "Suspend" : "Activate"}</button><button type="button" className="danger" disabled={changing === user.email} onClick={() => setDeleting(user)}>Delete</button></>}
        </div>
      </article>)}
    </div>
    {deleting && <ConfirmDialog
      title={`Delete ${deleting.name}?`}
      copy={`This permanently removes ${deleting.email}, all sessions, chats and ${deleting.documentCount} saved file${deleting.documentCount === 1 ? "" : "s"}. Suspend the account instead if access may be needed again.`}
      confirmLabel="Delete user"
      busy={changing === deleting.email}
      onCancel={() => setDeleting(null)}
      onConfirm={() => void deleteUser()}
    />}
  </section>;
}

function ProjectPicker({ selected, onChange, minimum = 1 }: { selected: ProjectOption[]; onChange: (projects: ProjectOption[]) => void; minimum?: number }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const selectedSlugs = useMemo(() => new Set(selected.map((project) => project.slug)), [selected]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`${withBasePath("/api/agent/projects")}?q=${encodeURIComponent(query)}`, { credentials: "include", signal: controller.signal });
        if (!response.ok) return;
        const payload = await response.json() as { projects: ProjectOption[] };
        setResults(payload.projects);
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query]);

  function toggle(project: ProjectOption) {
    if (selectedSlugs.has(project.slug)) onChange(selected.filter((item) => item.slug !== project.slug));
    else if (selected.length < 6) onChange([...selected, project]);
  }

  return <div className="agent-project-picker" data-tour="builder-project">
    <div className="agent-field-heading"><span>Project selection</span><small>{selected.length} selected · minimum {minimum}</small></div>
    {selected.length > 0 && <div className="agent-selected-projects">{selected.map((project) => <button type="button" key={project.slug} onClick={() => toggle(project)}><strong>{project.name}</strong><span>Remove</span></button>)}</div>}
    <label className="agent-project-search"><span>Find a development</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Project, developer, community or emirate" /></label>
    <div className="agent-project-results" aria-busy={loading}>
      {results.map((project) => <button type="button" key={project.slug} data-selected={selectedSlugs.has(project.slug) ? "" : undefined} onClick={() => toggle(project)} disabled={!selectedSlugs.has(project.slug) && selected.length >= 6}>
        <span>{project.emirate} · {project.developer}</span><strong>{project.name}</strong><small>{project.location} · {project.startingPrice}</small>
      </button>)}
    </div>
  </div>;
}

function suggestedArea(project: ProjectOption, bedroom: string) {
  return planningConfigurationArea(bedroom, usesLandedArea(project.residences));
}

function defaultProjectFacts(project: ProjectOption, preferredBedroom?: string): ConfirmedProjectFacts {
  const startingPrice = Number(project.startingPrice.replace(/[^\d.]/g, ""));
  const bedroomOptions = sortConfigurationOptions(project.bedroomOptions || []);
  const bedroom = preferredBedroom || bedroomOptions[0] || "Configuration to confirm";
  const baseline = baselineConfiguration(bedroomOptions);
  const unitPrice = configurationPlanningPrice(
    startingPrice,
    bedroomOptions,
    bedroom,
    usesLandedArea(project.residences),
  );
  const estimatedForConfiguration = Boolean(unitPrice && baseline && bedroom !== baseline);
  const grossYieldPlanningRate = project.emirate === "Dubai" ? .0658 : .065;
  const serviceCharge = project.emirate === "Dubai" ? 18 : project.emirate === "Abu Dhabi" ? 14 : 12;
  const acquisitionRate = project.emirate === "Dubai" ? .045 : project.emirate === "Abu Dhabi" ? .035 : .04;
  const annualRent = unitPrice ? Math.round(unitPrice * grossYieldPlanningRate / 1_000) * 1_000 : 0;
  return {
    slug: project.slug,
    bedroom,
    unitReference: `${bedroom} ${estimatedForConfiguration ? "configuration estimate" : "starting-price scenario"}`,
    unitPrice: unitPrice ? String(unitPrice) : "",
    unitAreaSqft: String(suggestedArea(project, bedroom)),
    annualRent: annualRent ? String(annualRent) : "",
    annualRentLow: annualRent ? String(Math.round(annualRent * .9 / 1_000) * 1_000) : "",
    annualRentHigh: annualRent ? String(Math.round(annualRent * 1.1 / 1_000) * 1_000) : "",
    occupancyRate: "95",
    serviceChargePerSqft: String(serviceCharge),
    otherAnnualCosts: "2500",
    acquisitionCosts: unitPrice ? String(Math.round(unitPrice * acquisitionRate / 1_000) * 1_000) : "0",
    rentalEvidenceNotes: project.emirate === "Dubai"
      ? "Planning estimate. Confirm against the current Dubai Land Department Rental Index and recent configuration-matched Ejari contracts before client use."
      : "Planning estimate. Replace with dated, configuration-matched leasing comparables before client use.",
    confirmationNotes: estimatedForConfiguration
      ? "Configuration estimate derived from the project’s advertised starting price and typical size bands. Replace with the current unit statement, service-charge schedule and rent evidence."
      : "Advertised starting-price scenario. Replace with the current unit statement, service-charge schedule and rent evidence.",
  };
}

function formatMoney(value?: number) {
  return Number.isFinite(value) ? `AED ${Math.round(value || 0).toLocaleString("en-AE")}` : "Confirm";
}

function formatPercent(value?: number) {
  return Number.isFinite(value) ? `${(value || 0).toFixed(2)}%` : "Confirm";
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function previewAdvisoryScreen(project: ProjectOption, facts: ConfirmedProjectFacts) {
  const price = Number(facts.unitPrice || 0);
  const area = Number(facts.unitAreaSqft || 0);
  const rent = Number(facts.annualRent || 0);
  const occupancy = Math.max(0, Math.min(100, Number(facts.occupancyRate || 0)));
  const annualServiceCharge = area * Number(facts.serviceChargePerSqft || 0);
  const allInCost = price + Number(facts.acquisitionCosts || 0);
  const unitPricePerSqft = area > 0 ? price / area : 0;
  const grossYield = price > 0 ? rent / price * 100 : 0;
  const effectiveNetYield = allInCost > 0
    ? (rent * occupancy / 100 - annualServiceCharge - Number(facts.otherAnnualCosts || 0)) / allInCost * 100
    : 0;
  const benchmark = project.research?.areaBenchmark;
  const priceVsAreaPercent = benchmark?.value && unitPricePerSqft
    ? (unitPricePerSqft - benchmark.value) / benchmark.value * 100
    : null;
  const nearby = project.research?.nearby || [];
  const categoryCoverage = new Set(nearby.map((place) => place.category)).size;
  const averageDistance = nearby.length ? nearby.reduce((sum, place) => sum + place.distanceKm, 0) / nearby.length : 40;
  const factors = [
    {
      label: "Value versus area",
      weight: 25,
      score: priceVsAreaPercent === null ? 50 : clampScore(80 - priceVsAreaPercent * 2),
      rationale: priceVsAreaPercent === null
        ? "Area benchmark not stored"
        : `${Math.abs(priceVsAreaPercent).toFixed(1)}% ${priceVsAreaPercent <= 0 ? "below" : "above"} benchmark`,
    },
    {
      label: "Rental return",
      weight: 25,
      score: clampScore(25 + grossYield * 6 + effectiveNetYield * 4),
      rationale: `${formatPercent(grossYield)} gross · ${formatPercent(effectiveNetYield)} stressed net`,
    },
    {
      label: "Accessibility",
      weight: 20,
      score: nearby.length ? clampScore(48 + categoryCoverage * 10 + Math.max(0, 22 - averageDistance)) : 25,
      rationale: nearby.length ? `${categoryCoverage} categories · ${nearby.length} checks` : "Coordinates required",
    },
    {
      label: "Demand depth",
      weight: 15,
      score: clampScore(45 + (project.research?.demandSegments.length || 0) * 11),
      rationale: `${project.research?.demandSegments.length || 0} potential segments`,
    },
    {
      label: "Supply balance",
      weight: 10,
      score: clampScore(82 - (project.research?.upcoming.length || 0) * 7),
      rationale: `${project.research?.upcoming.length || 0} nearby indexed pipeline records`,
    },
    {
      label: "Evidence quality",
      weight: 5,
      score: clampScore((benchmark ? 30 : 0) + (nearby.length ? 25 : 0) + (project.research?.demographicContext ? 15 : 0) + (facts.rentalEvidenceNotes.trim() ? 30 : 0)),
      rationale: facts.rentalEvidenceNotes.trim() ? "Rental note included" : "Rental note required",
    },
  ];
  const total = Math.round(factors.reduce((sum, factor) => sum + factor.score * factor.weight / 100, 0));
  return {
    total,
    label: total >= 80 ? "Strong screen" : total >= 65 ? "Balanced screen" : total >= 50 ? "Selective review" : "Evidence or pricing review",
    factors,
    unitPricePerSqft,
    priceVsAreaPercent,
    grossYield,
    effectiveNetYield,
    effectiveAnnualRent: rent * occupancy / 100,
  };
}

function previewPaymentSchedule(plan: string, unitPrice: number) {
  const match = plan.match(/\b\d{1,3}(?:\s*\/\s*\d{1,3}){1,5}\b/);
  const percentages = match ? match[0].split("/").map((part) => Number(part.trim())) : [];
  if (percentages.length < 2 || percentages.some((value) => value <= 0 || value > 100) || percentages.reduce((sum, value) => sum + value, 0) !== 100) return [];
  return percentages.map((percentage, index) => ({
    label: percentages.length === 2
      ? (index === 0 ? "During construction" : "On handover")
      : index === 0
        ? "On booking"
        : index === percentages.length - 1
          ? "On handover"
          : `Construction stage ${index}`,
    percentage,
    amount: unitPrice * percentage / 100,
  }));
}

function documentTypeLabel(type: AgentDocument["type"]) {
  return type === "sales_offer" ? "Curated offer" : type === "proposal" ? "Curated brief" : "Curated comparison";
}

function ProjectConfirmation({
  project,
  facts,
  onChange,
  onReplace,
}: {
  project: ProjectOption;
  facts: ConfirmedProjectFacts;
  onChange: (field: keyof ConfirmedProjectFacts, value: string) => void;
  onReplace: (facts: ConfirmedProjectFacts) => void;
}) {
  const annualServiceCharge = Number(facts.unitAreaSqft || 0) * Number(facts.serviceChargePerSqft || 0);
  const grossYield = Number(facts.unitPrice) > 0 ? Number(facts.annualRent) / Number(facts.unitPrice) * 100 : 0;
  const netIncome = Number(facts.annualRent) - annualServiceCharge - Number(facts.otherAnnualCosts || 0);
  const netYield = Number(facts.unitPrice) + Number(facts.acquisitionCosts || 0) > 0
    ? netIncome / (Number(facts.unitPrice) + Number(facts.acquisitionCosts || 0)) * 100
    : 0;
  const screen = previewAdvisoryScreen(project, facts);
  const livePaymentSchedule = previewPaymentSchedule(project.paymentPlan, Number(facts.unitPrice || 0));
  function updatePrice(value: string) {
    const previousPrice = Number(facts.unitPrice || 0);
    const nextPrice = Number(value || 0);
    const fallbackRate = project.emirate === "Dubai" ? .045 : project.emirate === "Abu Dhabi" ? .035 : .04;
    const acquisitionRate = previousPrice > 0 ? Number(facts.acquisitionCosts || 0) / previousPrice : fallbackRate;
    onReplace({
      ...facts,
      unitPrice: value,
      acquisitionCosts: nextPrice > 0 ? String(Math.round(nextPrice * acquisitionRate / 1_000) * 1_000) : "0",
    });
  }
  function updateRent(value: string) {
    const rent = Number(value || 0);
    onReplace({
      ...facts,
      annualRent: value,
      annualRentLow: rent > 0 ? String(Math.round(rent * .9 / 1_000) * 1_000) : "",
      annualRentHigh: rent > 0 ? String(Math.round(rent * 1.1 / 1_000) * 1_000) : "",
    });
  }
  return <article className="agent-confirmation-card">
    <header>
      <div><span>{project.developer} · {project.location}</span><h3>{project.name}</h3></div>
      <small>Prefilled planning scenario</small>
    </header>
    <div className="agent-autofill-primary">
      <label><span>Bedrooms / configuration</span><select value={facts.bedroom} onChange={(event) => onReplace(defaultProjectFacts(project, event.target.value))}>{sortConfigurationOptions(project.bedroomOptions).map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
      <label className="agent-inline-price"><span>Editable unit price · AED</span><input aria-label={`${project.name} current unit price in AED`} type="number" inputMode="numeric" min="100000" max="1000000000" step="1" value={facts.unitPrice} onFocus={(event) => event.currentTarget.select()} onChange={(event) => updatePrice(event.target.value)} /><small>Costs and returns adjust live</small></label>
      <label className="agent-inline-price"><span>Editable net area · sqft</span><input aria-label={`${project.name} net area in sqft`} type="number" inputMode="numeric" min="100" max="100000" step="1" value={facts.unitAreaSqft} onFocus={(event) => event.currentTarget.select()} onChange={(event) => onChange("unitAreaSqft", event.target.value)} /><small>Price and rent per sqft adjust</small></label>
      <label className="agent-inline-price"><span>Expected annual rent · AED</span><input aria-label={`${project.name} expected annual rent in AED`} type="number" inputMode="numeric" min="1000" max="100000000" step="1" value={facts.annualRent} onFocus={(event) => event.currentTarget.select()} onChange={(event) => updateRent(event.target.value)} /><small>Editable planning scenario</small></label>
      <div><span>Price per sqft</span><strong>AED {Math.round(screen.unitPricePerSqft).toLocaleString("en-AE")}</strong></div>
      <div><span>Gross yield</span><strong>{formatPercent(grossYield)}</strong></div>
      <div><span>Net scenario</span><strong>{formatPercent(netYield)}</strong></div>
    </div>
    <section className="agent-valuation-panel">
      <header>
        <div><span>Investment-fit screen</span><strong>{screen.total}<small>/100</small></strong></div>
        <div><h4>{screen.label}</h4><p>Weighted advisory screen with visible assumptions. It is not a formal or lender valuation.</p></div>
      </header>
      <div className="agent-valuation-metrics">
        <div><span>Area benchmark</span><strong>{project.research?.areaBenchmark?.display || "Comparable set required"}</strong><small>{project.research?.areaBenchmark?.period || "No dated benchmark stored"}</small></div>
        <div><span>Selected unit position</span><strong>{screen.priceVsAreaPercent === null ? "Not scored" : `${Math.abs(screen.priceVsAreaPercent).toFixed(1)}% ${screen.priceVsAreaPercent <= 0 ? "below" : "above"}`}</strong><small>Based on editable price and net area</small></div>
        <div><span>Rent sensitivity</span><strong>{formatMoney(Number(facts.annualRentLow))}–{formatMoney(Number(facts.annualRentHigh)).replace("AED ", "")}</strong><small>Editable low and high cases</small></div>
        <div><span>Occupancy-adjusted rent</span><strong>{formatMoney(screen.effectiveAnnualRent)}</strong><small>{Number(facts.occupancyRate || 0).toFixed(0)}% planning occupancy</small></div>
      </div>
      <div className="agent-live-payment">
        <span>Live payment schedule · {project.paymentPlan}</span>
        {livePaymentSchedule.length
          ? <div>{livePaymentSchedule.map((item) => <article key={`${item.label}-${item.percentage}`}><strong>{item.percentage}%</strong><small>{item.label}</small><em>{formatMoney(item.amount)}</em></article>)}</div>
          : <p>Ask the developer for the current structured payment schedule; no percentages have been inferred.</p>}
      </div>
      <div className="agent-score-factors">
        {screen.factors.map((factor) => <div key={factor.label}>
          <span><strong>{factor.label}</strong><small>{factor.weight}% weight · {factor.rationale}</small></span>
          <i><b style={{ "--agent-score": `${factor.score}%` } as CSSProperties} /></i>
          <em>{factor.score}</em>
        </div>)}
      </div>
      <div className="agent-research-grid">
        <article>
          <span>Accessibility evidence</span>
          <ul>{(project.research?.nearby || []).slice(0, 5).map((place) => <li key={`${place.name}-${place.category}`}><strong>{place.name}</strong><small>{place.category} · approx. {place.distanceKm.toFixed(1)} km</small></li>)}</ul>
          {!project.research?.nearby?.length && <p>Published coordinates are required before proximity can be calculated.</p>}
        </article>
        <article>
          <span>Demand and demographics</span>
          <ul>{(project.research?.demandSegments || []).map((segment) => <li key={segment}><strong>{segment}</strong></li>)}</ul>
          {project.research?.demographicContext
            ? <><p><strong>{project.research.demographicContext.display}</strong><br />{project.research.demographicContext.scope}. {project.research.demographicContext.note}</p><a href={project.research.demographicContext.sourceUrl} target="_blank" rel="noreferrer">{project.research.demographicContext.sourceLabel}</a></>
            : <p>No official community demographic series is embedded. Add a current tenant and leasing-comparable sample before presenting demographic claims.</p>}
        </article>
        <article>
          <span>Rental and supply checks</span>
          <p>{project.research?.rentalEvidence.note}</p>
          <div className="agent-research-links">
            {project.research?.rentalEvidence.indexUrl && <a href={project.research.rentalEvidence.indexUrl} target="_blank" rel="noreferrer">{project.research.rentalEvidence.indexLabel}</a>}
            {project.research?.rentalEvidence.datasetUrl && <a href={project.research.rentalEvidence.datasetUrl} target="_blank" rel="noreferrer">{project.research.rentalEvidence.datasetLabel}</a>}
          </div>
          <ul>{(project.research?.upcoming || []).slice(0, 4).map((item) => <li key={`${item.name}-${item.developer}`}><strong>{item.name}</strong><small>{item.handover}{item.distanceKm === null ? " · same area" : ` · approx. ${item.distanceKm.toFixed(1)} km`}</small></li>)}</ul>
          {!project.research?.upcoming?.length && <p>No matching nearby pipeline record was found in the current project index; this does not prove that no other supply exists.</p>}
        </article>
      </div>
    </section>
    <details className="agent-assumption-details">
      <summary>Review or edit the planning assumptions</summary>
      <p>These values are prefilled to reduce typing. Replace them with the selected unit’s current statement whenever available.</p>
      <div className="agent-confirmation-grid">
        <label><span>Unit reference</span><input value={facts.unitReference} onChange={(event) => onChange("unitReference", event.target.value)} placeholder="Unit number or configuration" required /></label>
        <label><span>Price · AED</span><input type="number" min="100000" max="1000000000" step="1" value={facts.unitPrice} onChange={(event) => updatePrice(event.target.value)} required /></label>
        <label><span>Net area · sqft</span><input type="number" min="100" max="100000" step="1" value={facts.unitAreaSqft} onChange={(event) => onChange("unitAreaSqft", event.target.value)} required /></label>
        <label><span>Expected annual rent · AED</span><input type="number" min="1000" max="100000000" step="1" value={facts.annualRent} onChange={(event) => updateRent(event.target.value)} required /></label>
        <label><span>Low-rent sensitivity · AED</span><input type="number" min="1000" max="100000000" step="1" value={facts.annualRentLow} onChange={(event) => onChange("annualRentLow", event.target.value)} required /></label>
        <label><span>High-rent sensitivity · AED</span><input type="number" min="1000" max="100000000" step="1" value={facts.annualRentHigh} onChange={(event) => onChange("annualRentHigh", event.target.value)} required /></label>
        <label><span>Planning occupancy · %</span><input type="number" min="0" max="100" step="0.1" value={facts.occupancyRate} onChange={(event) => onChange("occupancyRate", event.target.value)} required /></label>
        <label><span>Service charge · AED/sqft/year</span><input type="number" min="0" max="500" step="0.01" value={facts.serviceChargePerSqft} onChange={(event) => onChange("serviceChargePerSqft", event.target.value)} required /></label>
        <label><span>Other annual costs · AED</span><input type="number" min="0" max="100000000" step="1" value={facts.otherAnnualCosts} onChange={(event) => onChange("otherAnnualCosts", event.target.value)} required /></label>
        <label><span>Acquisition costs · AED</span><input type="number" min="0" max="100000000" step="1" value={facts.acquisitionCosts} onChange={(event) => onChange("acquisitionCosts", event.target.value)} required /></label>
        <label className="wide"><span>Rental evidence note</span><input value={facts.rentalEvidenceNotes} onChange={(event) => onChange("rentalEvidenceNotes", event.target.value)} placeholder="Dated index result, Ejari comparables or leasing evidence" /></label>
        <label className="wide"><span>Confirmation note</span><input value={facts.confirmationNotes} onChange={(event) => onChange("confirmationNotes", event.target.value)} /></label>
      </div>
    </details>
  </article>;
}

function DocumentEditor({ document, user, onSaved }: { document: AgentDocument; user: AgentUser; onSaved: (document: AgentDocument) => void }) {
  const [draft, setDraft] = useState(document);
  const [saving, setSaving] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState(document.title);
  const [message, setMessage] = useState(`Please find the HAUS & GRACE curated brief prepared for ${document.client_name}.`);
  const [status, setStatus] = useState("");

  useEffect(() => { setDraft(document); setSubject(document.title); }, [document]);

  async function persistDraft() {
    return api<{ document: AgentDocument }>(`/api/agent/documents/${draft.id}`, {
      method: "PATCH",
      body: JSON.stringify({ title: draft.title, clientName: draft.client_name, executiveSummary: draft.content.executiveSummary, recommendation: draft.content.recommendation, notes: draft.content.notes }),
    });
  }

  async function save() {
    setSaving(true); setStatus("");
    try {
      const result = await persistDraft();
      setDraft(result.document); onSaved(result.document); setStatus("Draft saved");
    } catch (reason) {
      setStatus(reason instanceof Error ? reason.message : "Unable to save.");
    } finally {
      setSaving(false);
    }
  }

  async function send(event: FormEvent) {
    event.preventDefault();
    setSaving(true); setStatus("");
    try {
      const { document: saved } = await persistDraft();
      setDraft(saved);
      const result = await api<{ message: string }>(`/api/agent/documents/${draft.id}/send`, { method: "POST", body: JSON.stringify({ to: recipient, subject, message }) });
      setStatus(result.message); setSendOpen(false);
      onSaved({ ...saved, status: "sent" });
    } catch (reason) {
      setStatus(reason instanceof Error ? reason.message : "Unable to send.");
    } finally {
      setSaving(false);
    }
  }

  return <section className="agent-document-editor">
    <header><div><span>{documentTypeLabel(draft.type)}</span><h2>{draft.title}</h2><p>Prepared by {user.name} · {user.email}</p></div><div><button type="button" onClick={() => void save()} disabled={saving}>{saving ? "Saving" : "Save draft"}</button><a href={withBasePath(`/api/agent/documents/${draft.id}/download`)}>Download PDF</a><button type="button" onClick={() => setSendOpen((value) => !value)}>Send to client</button></div></header>
    <div className="agent-document-layout">
      <div className="agent-document-form">
        <label><span>Document title</span><input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label>
        <label><span>Client name</span><input value={draft.client_name} onChange={(event) => setDraft({ ...draft, client_name: event.target.value })} /></label>
        <label><span>Executive summary</span><textarea rows={8} value={draft.content.executiveSummary} onChange={(event) => setDraft({ ...draft, content: { ...draft.content, executiveSummary: event.target.value } })} /></label>
        <label><span>Advisor recommendation</span><textarea rows={7} value={draft.content.recommendation} onChange={(event) => setDraft({ ...draft, content: { ...draft.content, recommendation: event.target.value } })} /></label>
        <label><span>Internal brief notes</span><textarea rows={5} value={draft.content.notes} onChange={(event) => setDraft({ ...draft, content: { ...draft.content, notes: event.target.value } })} /></label>
      </div>
      <aside className="agent-document-preview">
        <div className="agent-preview-brand"><span>HAUS &amp; GRACE</span><small>Curated client brief</small></div>
        {draft.content.projects[0]?.imageUrl && <img className="agent-preview-cover-image" src={draft.content.projects[0].imageUrl} alt="" />}
        <p>Customer presentation</p><h3>{draft.title}</h3><strong>Prepared for {draft.client_name}</strong>
        <div className="agent-preview-rule" />
        <p>{draft.content.executiveSummary}</p>
        {draft.content.marketContext?.headline?.length ? <div className="agent-preview-market-strip">{draft.content.marketContext.headline.slice(0, 3).map((metric) => <div key={metric.label}><span>{metric.label}</span><strong>{metric.display}</strong></div>)}</div> : null}
        {draft.content.residencyGuidance && <div className="agent-preview-residency"><span>Residency planning</span><strong>{draft.content.residencyGuidance.title}</strong><p>{draft.content.residencyGuidance.status}</p></div>}
        <div className="agent-preview-projects">{draft.content.projects.map((project) => <article key={project.slug}>
          {project.imageUrl && <img src={project.imageUrl} alt="" />}
          <span>{project.developer} · {project.location}</span><h4>{project.name}</h4>
          <dl>
            <div><dt>Confirmed price</dt><dd>{formatMoney(project.unitPrice)}</dd></div>
            <div><dt>Unit AED/sqft</dt><dd>{project.unitPricePerSqft ? `AED ${Math.round(project.unitPricePerSqft).toLocaleString("en-AE")}` : project.pricePerSqft}</dd></div>
            <div><dt>Gross yield</dt><dd>{formatPercent(project.grossYield)}</dd></div>
            <div><dt>Net scenario</dt><dd>{formatPercent(project.netYield)}</dd></div>
            <div><dt>Occupancy-adjusted net</dt><dd>{formatPercent(project.effectiveNetYield)}</dd></div>
            <div><dt>Investment-fit screen</dt><dd>{project.advisoryScreen ? `${project.advisoryScreen.total}/100 · ${project.advisoryScreen.label}` : "Not scored"}</dd></div>
            <div><dt>Area benchmark</dt><dd>{project.areaBenchmark?.display || "Not available"}</dd></div>
            <div><dt>Handover</dt><dd>{project.handover}</dd></div>
          </dl>
          {project.nearby?.length ? <p className="agent-preview-nearby">Nearby: {project.nearby.slice(0, 3).map((place) => `${place.name} ${place.distanceKm} km`).join(" · ")}</p> : null}
          {project.paymentSchedule?.length ? <p className="agent-preview-nearby">Payment schedule: {project.paymentSchedule.map((item) => `${item.percentage}% ${formatMoney(item.amount)}`).join(" · ")}</p> : null}
        </article>)}</div>
      </aside>
    </div>
    {sendOpen && <form className="agent-send-panel" onSubmit={send}>
      <div><span>Client delivery</span><h3>Send from {user.email}</h3><small>{user.phone ? `${user.title || "Property Advisor"} · ${user.phone}` : "Add your advisor phone before sending."}</small></div>
      <label><span>Client email</span><input type="email" value={recipient} onChange={(event) => setRecipient(event.target.value)} placeholder="client@email.com" required /></label>
      <details>
        <summary>Personalise subject and message</summary>
        <label><span>Subject</span><input value={subject} onChange={(event) => setSubject(event.target.value)} required /></label>
        <label><span>Message</span><textarea rows={4} value={message} onChange={(event) => setMessage(event.target.value)} /></label>
      </details>
      <button disabled={saving}>{saving ? "Sending" : "Send curated PDF"}</button>
    </form>}
    {status && <p className="agent-action-status" role="status">{status}</p>}
  </section>;
}

function DocumentBuilder({
  type,
  user,
  onCreated,
  onUserUpdated,
}: {
  type: "sales_offer" | "proposal" | "comparison";
  user: AgentUser;
  onCreated: (document: AgentDocument) => void;
  onUserUpdated: (user: AgentUser) => void;
}) {
  const [clientName, setClientName] = useState("");
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [projectFacts, setProjectFacts] = useState<Record<string, ConfirmedProjectFacts>>({});
  const [advisorName, setAdvisorName] = useState(user.name);
  const [advisorPhone, setAdvisorPhone] = useState(user.phone || "");
  const [advisorTitle, setAdvisorTitle] = useState(user.title || "Property Advisor");
  const [factsConfirmed, setFactsConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const minimum = type === "comparison" ? 2 : 1;
  const labels = {
    sales_offer: { kicker: "Curated offer studio", title: "Present one opportunity with evidence.", copy: "Create a visual customer presentation with confirmed costs, projected returns, market context, access and local pipeline." },
    proposal: { kicker: "Curated brief studio", title: "Turn a client objective into a visual investment case.", copy: "AI frames the narrative only after the advisor confirms every unit-level input used in the calculations." },
    comparison: { kicker: "Curated comparison studio", title: "Compare the trade-offs, not just the headlines.", copy: "Place two to six developments on one consistent decision frame with project images, ROI scenarios and area benchmarks." },
  }[type];
  const clientReady = Boolean(clientName.trim() && brief.trim() && advisorName.trim() && advisorPhone.trim() && advisorTitle.trim());
  const selectionReady = projects.length >= minimum;
  const evidenceReady = selectionReady && projects.every((project) => {
    const facts = projectFacts[project.slug];
    return Boolean(
      facts
      && facts.bedroom
      && Number(facts.unitPrice) > 0
      && Number(facts.unitAreaSqft) > 0
      && Number(facts.annualRent) > 0
      && Number(facts.annualRentLow) > 0
      && Number(facts.annualRentHigh) >= Number(facts.annualRentLow)
      && Number(facts.occupancyRate) > 0
      && Number(facts.occupancyRate) <= 100
      && Number(facts.serviceChargePerSqft) >= 0
      && Number(facts.acquisitionCosts) >= 0
      && facts.rentalEvidenceNotes.trim(),
    );
  });
  const missingItems = [
    ...(!clientName.trim() ? ["Add the client name"] : []),
    ...(!brief.trim() ? ["Describe the client objective"] : []),
    ...(!advisorName.trim() ? ["Add the advisor name"] : []),
    ...(!advisorPhone.trim() ? ["Add the advisor contact number"] : []),
    ...(!advisorTitle.trim() ? ["Add the advisor title"] : []),
    ...(!selectionReady ? [`Select at least ${minimum} project${minimum === 1 ? "" : "s"}`] : []),
    ...(selectionReady && !evidenceReady ? ["Complete the unit, rent and cost evidence for every selected project"] : []),
    ...(evidenceReady && !factsConfirmed ? ["Confirm the dated client and unit assumptions"] : []),
  ];
  const readyToGenerate = missingItems.length === 0;

  function selectProjects(next: ProjectOption[]) {
    setProjects(next);
    setProjectFacts((current) => {
      const updated = { ...current };
      next.forEach((project) => {
        if (!updated[project.slug]) updated[project.slug] = defaultProjectFacts(project);
      });
      return updated;
    });
    setFactsConfirmed(false);
  }

  function updateProjectFact(slug: string, field: keyof ConfirmedProjectFacts, value: string) {
    setProjectFacts((current) => ({
      ...current,
      [slug]: { ...(current[slug] || defaultProjectFacts(projects.find((project) => project.slug === slug)!)), [field]: value },
    }));
    setFactsConfirmed(false);
  }

  async function generate(event: FormEvent) {
    event.preventDefault();
    if (projects.length < minimum) { setError(`Select at least ${minimum} project${minimum === 1 ? "" : "s"}.`); return; }
    if (!factsConfirmed) { setError("Confirm the client and unit information before generation."); return; }
    const invalidRentRange = projects.find((project) => Number(projectFacts[project.slug]?.annualRentLow) > Number(projectFacts[project.slug]?.annualRentHigh));
    if (invalidRentRange) { setError(`The low-rent case must not exceed the high-rent case for ${invalidRentRange.name}.`); return; }
    setBusy(true); setError("");
    try {
      const profile = await api<{ user: AgentUser }>("/api/agent/profile", {
        method: "PATCH",
        body: JSON.stringify({ name: advisorName, phone: advisorPhone, title: advisorTitle }),
      });
      onUserUpdated(profile.user);
      const confirmedFacts = projects.map((project) => {
        const facts = projectFacts[project.slug];
        return {
          ...facts,
          slug: project.slug,
          unitPrice: Number(facts.unitPrice),
          unitAreaSqft: Number(facts.unitAreaSqft),
          annualRent: Number(facts.annualRent),
          annualRentLow: Number(facts.annualRentLow),
          annualRentHigh: Number(facts.annualRentHigh),
          occupancyRate: Number(facts.occupancyRate),
          serviceChargePerSqft: Number(facts.serviceChargePerSqft),
          otherAnnualCosts: Number(facts.otherAnnualCosts),
          acquisitionCosts: Number(facts.acquisitionCosts),
        };
      });
      const result = await api<{ document: AgentDocument }>("/api/agent/documents", {
        method: "POST",
        body: JSON.stringify({
          type,
          clientName,
          title,
          brief,
          projectSlugs: projects.map((project) => project.slug),
          projectFacts: confirmedFacts,
          factsConfirmed: true,
        }),
      });
      onCreated(result.document);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to generate the document.");
    } finally {
      setBusy(false);
    }
  }

  return <section className="agent-builder">
    <div className="agent-tool-intro"><div><p className="kicker">{labels.kicker}</p><h1>{labels.title}</h1></div><p>{labels.copy}</p></div>
    <ol className="agent-builder-progress" data-tour="builder-progress" aria-label="Report preparation progress">
      {[
        { label: "Client brief", complete: clientReady },
        { label: "Project selection", complete: selectionReady },
        { label: "Evidence check", complete: evidenceReady },
        { label: "Ready to generate", complete: readyToGenerate },
      ].map((item, index, items) => {
        const firstIncomplete = items.findIndex((candidate) => !candidate.complete);
        const state = item.complete ? "complete" : index === (firstIncomplete < 0 ? items.length - 1 : firstIncomplete) ? "current" : "pending";
        return <li key={item.label} data-state={state}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item.label}</strong><small>{item.complete ? "Complete" : state === "current" ? "Next" : "Pending"}</small></li>;
      })}
    </ol>
    <form onSubmit={generate}>
      <div className="agent-builder-fields" data-tour="builder-client">
        <label><span>Client name</span><input value={clientName} onChange={(event) => { setClientName(event.target.value); setFactsConfirmed(false); }} placeholder="Client or family name" required /></label>
        <label><span>Optional document title</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Generated automatically if left blank" /></label>
        <label className="wide"><span>Client objective and advisor notes</span><textarea rows={5} value={brief} onChange={(event) => { setBrief(event.target.value); setFactsConfirmed(false); }} placeholder="Budget, holding period, investment objective, residence preferences and risks to address" required /></label>
        <label><span>Advisor name on the brief</span><input value={advisorName} onChange={(event) => { setAdvisorName(event.target.value); setFactsConfirmed(false); }} placeholder="Advisor name" required /></label>
        <label><span>Advisor contact number</span><input type="tel" value={advisorPhone} onChange={(event) => { setAdvisorPhone(event.target.value); setFactsConfirmed(false); }} placeholder="+971 50 000 0000" required /></label>
        <label><span>Advisor title</span><input value={advisorTitle} onChange={(event) => setAdvisorTitle(event.target.value)} placeholder="Property Advisor" required /></label>
      </div>
      <ProjectPicker selected={projects} onChange={selectProjects} minimum={minimum} />
      {projects.length > 0 && <section className="agent-confirmation-section">
        <div className="agent-field-heading"><span>Confirm the evidence</span><small>Used in the PDF calculations</small></div>
        <p>Select the configuration to autofill a planning scenario, then edit the exact price, area, rent and evidence where needed. AED/sqft, returns, costs and the weighted advisory screen update from those inputs; AI does not invent the figures.</p>
        <div className="agent-confirmation-list">{projects.map((project) => <ProjectConfirmation key={project.slug} project={project} facts={projectFacts[project.slug] || defaultProjectFacts(project)} onChange={(field, value) => updateProjectFact(project.slug, field, value)} onReplace={(facts) => { setProjectFacts((current) => ({ ...current, [project.slug]: facts })); setFactsConfirmed(false); }} />)}</div>
        <label className="agent-confirm-checkbox">
          <input type="checkbox" checked={factsConfirmed} onChange={(event) => setFactsConfirmed(event.target.checked)} required />
          <span>I confirm the client details, selected-unit price, area, rent range, occupancy assumption, service charge and cost estimates are current enough to present as dated scenarios.</span>
        </label>
      </section>}
      <div className="agent-report-includes" data-tour="builder-output">
        <span>Every client-ready report includes</span>
        <div>{["Cover and contents", "Project imagery", "Transaction charts", "Confirmed unit economics", "Payment schedule", "Gross and net ROI scenarios", "Rental sensitivity", "Occupancy stress case", "AED/sqft benchmark", "Weighted community screen", "Accessibility and nearby places", "Demand and demographic context", "Upcoming local pipeline", "Golden Visa context", "Risks and next actions", "Sources and methodology"].map((item) => <small key={item}>{item}</small>)}</div>
      </div>
      <section className="agent-generation-readiness" data-state={readyToGenerate ? "ready" : "incomplete"} aria-live="polite">
        <div><span>{readyToGenerate ? "Ready for generation" : "Complete before generation"}</span><h3>{readyToGenerate ? "The report is ready to build." : `${missingItems.length} item${missingItems.length === 1 ? "" : "s"} remaining.`}</h3><p>{readyToGenerate ? "Generation creates the analysis and PDF, then opens the report editor for a final review before download or email delivery." : "The workspace will unlock generation as soon as the required evidence is complete."}</p></div>
        {!readyToGenerate && <ul>{missingItems.map((item) => <li key={item}>{item}</li>)}</ul>}
        {readyToGenerate && <ol><li>Generate the analysis and branded PDF</li><li>Review the narrative and recommendation</li><li>Download or send from your company email</li></ol>}
      </section>
      <div className="agent-generate-bar" data-tour="builder-generate"><div><span>Prepared by</span><strong>{advisorName || "Advisor name required"}</strong><small>{user.email} · {advisorPhone || "Contact number required"}</small></div><button disabled={busy || !readyToGenerate}>{busy ? "Building the analysis and PDF" : "Generate client-ready report"}</button></div>
      {error && <p className="agent-form-error" role="alert">{error}</p>}
    </form>
  </section>;
}

function ChatPanel() {
  const [mode, setMode] = useState<"advisory" | "research">("research");
  const [conversationId, setConversationId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function send(event: FormEvent) {
    event.preventDefault();
    const message = input.trim();
    if (!message) return;
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", content: message };
    setMessages((current) => [...current, userMessage]); setInput(""); setBusy(true); setError("");
    try {
      const result = await api<{ conversationId: string; message: { role: "assistant"; content: string }; sources: Array<{ label: string; href: string }> }>("/api/agent/chat", {
        method: "POST",
        body: JSON.stringify({ message, conversationId, mode }),
      });
      setConversationId(result.conversationId);
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", content: result.message.content, sources: result.sources }]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The research assistant is unavailable.");
    } finally {
      setBusy(false);
    }
  }

  return <section className="agent-chat">
    <header><div><p className="kicker">Private AI desk</p><h1>Research with<br /><em>your full catalogue.</em></h1><p>Ask about a project, developer, community, price positioning, payment structure or client strategy. Project-specific answers are grounded in the HAUS & GRACE catalogue.</p></div><div className="agent-chat-modes" data-tour="chat-modes"><button type="button" data-active={mode === "research" ? "" : undefined} onClick={() => setMode("research")}>Research mode</button><button type="button" data-active={mode === "advisory" ? "" : undefined} onClick={() => setMode("advisory")}>Advisory mode</button><button type="button" onClick={() => { setConversationId(""); setMessages([]); setError(""); }}>New chat</button></div></header>
    <div className="agent-chat-window">
      {messages.length === 0 ? <div className="agent-chat-empty" data-tour="chat-prompts"><span>Start with a decision</span><h2>What does your client need to understand?</h2><div>{["Compare waterfront projects in Dubai Islands under AED 4M", "Build a due-diligence checklist for an off-plan investor", "Explain the trade-off between payment plan and price per square foot"].map((prompt) => <button type="button" key={prompt} onClick={() => setInput(prompt)}>{prompt}</button>)}</div></div> : <div className="agent-messages" data-tour="chat-prompts">{messages.map((message) => <article key={message.id} data-role={message.role}><span>{message.role === "user" ? "Agent" : "HAUS & GRACE AI"}</span><p>{message.content}</p>{message.sources && message.sources.length > 0 && <div>{message.sources.map((source) => <Link key={source.href} href={source.href} target="_blank">{source.label}</Link>)}</div>}</article>)}{busy && <article data-role="assistant" className="thinking"><span>HAUS & GRACE AI</span><p>Reviewing the catalogue and framing the evidence.</p></article>}</div>}
      <form data-tour="chat-composer" onSubmit={send}><textarea rows={3} value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask a research or client advisory question" disabled={busy} /><div><small>{mode === "research" ? "Findings, evidence, risks and next checks" : "Concise guidance and practical next actions"}</small><button disabled={busy || !input.trim()}>{busy ? "Researching" : "Send"}</button></div></form>
      {error && <p className="agent-form-error" role="alert">{error}</p>}
    </div>
  </section>;
}

function Documents({
  documents,
  user,
  onOpen,
  onDeleted,
}: {
  documents: DocumentSummary[];
  user: AgentUser;
  onOpen: (id: string) => void;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState<DocumentSummary | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  async function deleteFile() {
    if (!deleting) return;
    setBusy(true);
    setStatus("");
    try {
      await api(`/api/agent/documents/${deleting.id}`, { method: "DELETE" });
      setStatus(`"${deleting.title}" was permanently deleted.`);
      setDeleting(null);
      onDeleted();
    } catch (reason) {
      setStatus(reason instanceof Error ? reason.message : "Unable to delete the file.");
    } finally {
      setBusy(false);
    }
  }

  return <section className="agent-documents" data-tour="documents-library">
    <div className="agent-tool-intro"><div><p className="kicker">Document library</p><h1>Every client draft,<br /><em>kept together.</em></h1></div><p>Open, refine, download or send the exact saved version prepared by the agent workspace.</p></div>
    {status && <p className="agent-action-status" role="status">{status}</p>}
    {documents.length ? <div className="agent-document-list">{documents.map((document) => {
      const isOwner = document.agent_email === user.email;
      return <article key={document.id}>
        <button type="button" className="agent-document-open" onClick={() => onOpen(document.id)} disabled={!isOwner} title={isOwner ? "Open saved file" : "Administrators can remove this team file without opening or impersonating its owner"}>
          <span>{documentTypeLabel(document.type)}</span>
          <strong>{document.title}</strong>
          <small>{document.client_name} · {new Date(`${document.updated_at.replace(" ", "T")}Z`).toLocaleDateString("en-AE", { day: "2-digit", month: "short", year: "numeric" })}{user.role === "admin" ? ` · ${document.agent_email}` : ""}</small>
          <b>{isOwner ? document.status : "Team file"}</b>
        </button>
        <button type="button" className="agent-document-delete" onClick={() => setDeleting(document)}>Delete</button>
      </article>;
    })}</div> : <div className="agent-empty-library"><span>No curated briefs yet</span><h2>Build the first customer presentation.</h2><p>Create a curated offer, visual property brief or evidence-led comparison from the workspace.</p></div>}
    {deleting && <ConfirmDialog
      title={`Delete "${deleting.title}"?`}
      copy={`This permanently removes the saved file prepared for ${deleting.client_name}.${user.role === "admin" && deleting.agent_email !== user.email ? ` It belongs to ${deleting.agent_email}.` : ""}`}
      confirmLabel="Delete file"
      busy={busy}
      onCancel={() => setDeleting(null)}
      onConfirm={() => void deleteFile()}
    />}
  </section>;
}

function Overview({ user, documents, availableTools, onNavigate }: { user: AgentUser; documents: DocumentSummary[]; availableTools: typeof tools; onNavigate: (tool: AgentTool) => void }) {
  return <section className="agent-overview">
    <div className="agent-overview-hero"><div><p className="kicker">Private agent workspace</p><h1>Good morning,<br /><em>{user.name.split(" ")[0]}.</em></h1><p>Move from project research to a client-ready HAUS & GRACE document without leaving the workspace.</p></div><aside><span>Live catalogue</span><strong>Growing</strong><small>New UAE projects can be added to the research and comparison catalogue at any time</small></aside></div>
    <section className="agent-profile-card" data-tour="overview-profile" aria-label={`${user.name} agent profile`}>
      <AgentAvatar user={user} className="agent-avatar-profile" />
      <div><span>Your HAUS &amp; GRACE profile</span><h2>{user.name}</h2><p>{user.title || "Property Advisor"}</p></div>
      <dl>
        <div><dt>Company email</dt><dd>{user.email}</dd></div>
        <div><dt>Client contact</dt><dd>{user.phone || "Add before preparing a client brief"}</dd></div>
      </dl>
    </section>
    <div className="agent-tool-cards" data-tour="overview-tools">{availableTools.filter((tool) => !["overview", "documents"].includes(tool.id)).map((tool, index) => <button type="button" key={tool.id} onClick={() => onNavigate(tool.id)}><span>{String(index + 1).padStart(2, "0")}</span><h2>{tool.label}</h2><p>{tool.note}</p></button>)}</div>
    <div className="agent-recent" data-tour="overview-recent"><div><span>Recent documents</span><button type="button" onClick={() => onNavigate("documents")}>Open library</button></div>{documents.slice(0, 4).map((document) => <button type="button" key={document.id} onClick={() => onNavigate("documents")}><strong>{document.title}</strong><span>{documentTypeLabel(document.type)} · {document.status}</span></button>)}</div>
  </section>;
}

function GuidedDemo({
  tool,
  onClose,
}: {
  tool: AgentTool;
  onClose: () => void;
}) {
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const guide = toolDemos[tool];
  useEffect(() => { setStep(0); }, [tool]);
  const activeStep = guide.steps[step];

  useEffect(() => {
    const target = document.querySelector<HTMLElement>(`[data-tour="${activeStep.selector}"]`);
    if (!target) {
      setTargetRect(null);
      return;
    }
    target.setAttribute("data-tour-active", "");
    target.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    const measure = () => {
      const rect = target.getBoundingClientRect();
      const padding = 7;
      setTargetRect({
        top: Math.max(8, rect.top - padding),
        left: Math.max(8, rect.left - padding),
        width: Math.min(window.innerWidth - Math.max(8, rect.left - padding) - 8, rect.width + padding * 2),
        height: Math.min(window.innerHeight - Math.max(8, rect.top - padding) - 8, rect.height + padding * 2),
      });
    };
    const animationFrame = window.requestAnimationFrame(measure);
    const settleTimer = window.setTimeout(measure, 360);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      target.removeAttribute("data-tour-active");
      window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(settleTimer);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [activeStep.selector]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const focusStyle = targetRect ? {
    "--agent-tour-top": `${targetRect.top}px`,
    "--agent-tour-left": `${targetRect.left}px`,
    "--agent-tour-width": `${targetRect.width}px`,
    "--agent-tour-height": `${targetRect.height}px`,
  } as CSSProperties : undefined;
  const cardStyle = targetRect ? (() => {
    const cardWidth = Math.min(380, window.innerWidth - 32);
    const cardHeight = 300;
    const roomRight = window.innerWidth - (targetRect.left + targetRect.width);
    const roomLeft = targetRect.left;
    let left = Math.max(16, Math.min(targetRect.left, window.innerWidth - cardWidth - 16));
    let top = targetRect.top + targetRect.height + 18;
    if (roomRight >= cardWidth + 32) {
      left = targetRect.left + targetRect.width + 18;
      top = Math.max(16, Math.min(targetRect.top, window.innerHeight - cardHeight - 16));
    } else if (roomLeft >= cardWidth + 32) {
      left = targetRect.left - cardWidth - 18;
      top = Math.max(16, Math.min(targetRect.top, window.innerHeight - cardHeight - 16));
    } else if (top + cardHeight > window.innerHeight) {
      top = Math.max(16, targetRect.top - cardHeight - 18);
    }
    return { "--agent-tour-card-left": `${left}px`, "--agent-tour-card-top": `${top}px` } as CSSProperties;
  })() : undefined;

  return <div className="agent-tour-shell" role="presentation">
    {targetRect && <div className="agent-tour-focus" style={focusStyle} aria-hidden="true" />}
    <section className="agent-tour-card" style={cardStyle} role="dialog" aria-modal="true" aria-labelledby="agent-demo-title" aria-describedby="agent-demo-copy">
      <header>
        <div><span>Guided walkthrough · {tools.find((item) => item.id === tool)?.label}</span><strong>{guide.title}</strong></div>
        <button type="button" onClick={onClose} aria-label="Close guided demo">Close</button>
      </header>
      <div className="agent-tour-body">
        <span>Step {String(step + 1).padStart(2, "0")} of {String(guide.steps.length).padStart(2, "0")}</span>
        <h2 id="agent-demo-title">{activeStep.title}</h2>
        <p id="agent-demo-copy">{activeStep.copy}</p>
        <small>{guide.summary}</small>
        {step === guide.steps.length - 1 && <div className="agent-tour-example"><strong>Example</strong><p>{guide.example}</p></div>}
      </div>
      <footer>
        <div aria-label="Demo progress">{guide.steps.map((item, index) => <button type="button" key={item.title} data-active={index === step ? "" : undefined} onClick={() => setStep(index)} aria-label={`Open step ${index + 1}`} />)}</div>
        <span><button type="button" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0}>Back</button>{step < guide.steps.length - 1 ? <button type="button" onClick={() => setStep((current) => current + 1)}>Next</button> : <button type="button" onClick={onClose}>Finish</button>}</span>
      </footer>
    </section>
  </div>;
}

export function AgentWorkspace() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AgentUser | null>(null);
  const [active, setActive] = useState<AgentTool>("overview");
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [document, setDocument] = useState<AgentDocument | null>(null);
  const [demoTool, setDemoTool] = useState<AgentTool | null>(null);
  const availableTools = useMemo(
    () => tools.filter((tool) => tool.id !== "admin" || user?.role === "admin"),
    [user?.role],
  );

  const loadDocuments = useCallback(async () => {
    if (!user || user.mustChangePassword || user.onboardingRequired) return;
    try {
      const result = await api<{ documents: DocumentSummary[] }>("/api/agent/documents");
      setDocuments(result.documents);
    } catch {
      setDocuments([]);
    }
  }, [user]);

  useEffect(() => {
    fetch(withBasePath("/api/agent/session"), { credentials: "include", headers: { accept: "application/json" } })
      .then(async (response) => response.ok ? (await response.json() as { user: AgentUser }).user : null)
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { void loadDocuments(); }, [loadDocuments]);

  useEffect(() => {
    if (!user || user.mustChangePassword || user.onboardingRequired) return;
    const key = `hg-workspace-demo:${user.email}`;
    if (!window.localStorage.getItem(key)) setDemoTool("overview");
  }, [user]);

  function closeDemo() {
    if (user) window.localStorage.setItem(`hg-workspace-demo:${user.email}`, "seen");
    setDemoTool(null);
  }

  async function openDocument(id: string) {
    const result = await api<{ document: AgentDocument }>(`/api/agent/documents/${id}`);
    setDocument(result.document);
  }

  async function signOut() {
    await api("/api/agent/logout", { method: "POST" }).catch(() => null);
    setUser(null); setDocuments([]); setDocument(null); setActive("overview");
  }

  if (loading) return <div className="agent-loading"><Logo /><span>Opening private workspace</span></div>;
  if (!user) return <SignIn onAuthenticated={setUser} />;
  if (user.mustChangePassword) return <PasswordChange user={user} onChanged={setUser} onSignOut={() => void signOut()} />;
  if (user.onboardingRequired) return <AdvisorOnboarding user={user} onComplete={() => setUser({ ...user, onboardingRequired: false })} onSignOut={() => void signOut()} />;

  return <div className="agent-shell">
    <aside className="agent-sidebar">
      <Link href="/" className="agent-sidebar-brand"><Logo /><span>Private workspace</span></Link>
      <nav aria-label="Agent workspace">{availableTools.map((tool) => <button type="button" key={tool.id} data-active={active === tool.id && !document ? "" : undefined} onClick={() => { setDocument(null); setActive(tool.id); }}><strong>{tool.label}</strong><span>{tool.note}</span></button>)}</nav>
      <div className="agent-user"><div className="agent-user-profile"><AgentAvatar user={user} className="agent-avatar-sidebar" /><span><strong>{user.name}</strong><small>{user.title || "Property Advisor"}</small></span></div><small>{user.email}</small>{user.phone && <small>{user.phone}</small>}<div className="agent-user-actions"><button type="button" onClick={() => setDemoTool(document ? "documents" : active)}>Guided demo</button><button type="button" onClick={signOut}>Sign out</button></div></div>
    </aside>
    <div className="agent-main">
      <header className="agent-mobile-bar"><Logo /><div className="agent-mobile-profile"><AgentAvatar user={user} className="agent-avatar-mobile" /><details><summary>Workspace menu</summary><nav>{availableTools.map((tool) => <button type="button" key={tool.id} onClick={() => { setDocument(null); setActive(tool.id); }}>{tool.label}</button>)}<button type="button" onClick={() => setDemoTool(document ? "documents" : active)}>Guided demo</button><button type="button" onClick={signOut}>Sign out</button></nav></details></div></header>
      <div className="agent-context-help"><div><span>{document ? "Document editor" : tools.find((tool) => tool.id === active)?.label}</span><small>Need a quick walkthrough of this page?</small></div><button type="button" onClick={() => setDemoTool(document ? "documents" : active)}>Show guided demo</button></div>
      {document ? <DocumentEditor document={document} user={user} onSaved={(saved) => { setDocument(saved); void loadDocuments(); }} /> :
        active === "overview" ? <Overview user={user} documents={documents} availableTools={availableTools} onNavigate={setActive} /> :
        active === "chat" ? <ChatPanel /> :
        active === "portfolio" ? <AdvisorPortfolioPanel user={user} /> :
        active === "sales_offer" ? <DocumentBuilder type="sales_offer" user={user} onUserUpdated={setUser} onCreated={(created) => { setDocument(created); void loadDocuments(); }} /> :
        active === "proposal" ? <DocumentBuilder type="proposal" user={user} onUserUpdated={setUser} onCreated={(created) => { setDocument(created); void loadDocuments(); }} /> :
        active === "comparison" ? <DocumentBuilder type="comparison" user={user} onUserUpdated={setUser} onCreated={(created) => { setDocument(created); void loadDocuments(); }} /> :
        active === "admin" ? <AdminPanel currentUser={user} /> :
        <Documents documents={documents} user={user} onOpen={(id) => void openDocument(id)} onDeleted={() => void loadDocuments()} />}
    </div>
    {demoTool && <GuidedDemo tool={demoTool} onClose={closeDemo} />}
  </div>;
}
