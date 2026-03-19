# TANSS TypeScript API Client — Template

## Basis-Client

```typescript
// lib/tanss.ts

interface TanssConfig {
  /** TANSS URL — ggf. mit /backend Prefix (z.B. https://tanss.firma.de/backend) */
  baseUrl: string;
  username?: string;
  password?: string;
}

interface TanssAuth {
  apiKey: string;
  expire: number;
  refresh: string;
  employeeId: number;
  employeeType: string;
}

interface TanssResponse<T> {
  meta: {
    linkedEntities: Record<string, Record<string, unknown>>;
    properties: Record<string, unknown>;
  };
  content: T;
}

interface TanssError {
  error: {
    text: string;
    localizedText: string;
    type: string;
  };
}

export class TanssClient {
  private baseUrl: string;
  private auth: TanssAuth | null = null;

  constructor(config: TanssConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
  }

  // --- Auth ---

  async login(username: string, password: string, twoFactorToken?: string): Promise<TanssAuth> {
    const body: Record<string, string> = { username, password };
    if (twoFactorToken) body.token = twoFactorToken;

    const res = await fetch(`${this.baseUrl}/api/v1/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`Login fehlgeschlagen: ${res.status}`);

    const data = (await res.json()) as TanssResponse<TanssAuth>;
    this.auth = data.content;
    return this.auth;
  }

  private getHeaders(): Record<string, string> {
    if (!this.auth) throw new Error("Nicht eingeloggt — zuerst login() aufrufen");

    // Token-Ablauf prüfen
    if (Date.now() / 1000 > this.auth.expire) {
      throw new Error("Token abgelaufen — erneuter Login nötig");
    }

    return {
      "Content-Type": "application/json",
      apiToken: this.auth.apiKey,
    };
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<TanssResponse<T>> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const err = (await res.json().catch(() => null)) as TanssError | null;
      throw new Error(
        err?.error?.localizedText || `TANSS API Fehler: ${res.status}`
      );
    }

    return res.json() as Promise<TanssResponse<T>>;
  }

  // --- Tickets ---

  async getOwnTickets() {
    return this.request<unknown[]>("GET", "/api/v1/tickets/own");
  }

  async getTicket(ticketId: number) {
    return this.request<unknown>("GET", `/api/v1/tickets/${ticketId}`);
  }

  async createTicket(ticket: {
    companyId: number;
    title: string;
    content?: string;
    statusId?: number;
    typeId?: number;
    assignedToEmployeeId?: number;
  }) {
    return this.request<unknown>("POST", "/api/v1/tickets", ticket);
  }

  async updateTicket(ticketId: number, updates: Record<string, unknown>) {
    return this.request<unknown>("PUT", `/api/v1/tickets/${ticketId}`, updates);
  }

  async addComment(ticketId: number, comment: {
    title?: string;
    content: string;
    internal?: boolean;
    pinned?: boolean;
  }) {
    return this.request<unknown>("POST", `/api/v1/tickets/${ticketId}/comments`, comment);
  }

  async getTicketHistory(ticketId: number) {
    return this.request<unknown[]>("GET", `/api/v1/tickets/history/${ticketId}`);
  }

  // --- Employees ---

  async getEmployees() {
    return this.request<unknown[]>("GET", "/api/v1/employees");
  }

  async getTechnicians() {
    return this.request<unknown[]>("GET", "/api/v1/employees/technicians");
  }

  // --- Companies ---

  async search(searchString: string) {
    return this.request<unknown[]>("POST", "/api/v1/search", { searchString });
  }

  // --- Supports ---

  async createSupport(support: {
    ticketId: number;
    date: number;
    employeeId?: number;
    location: "OFFICE" | "CUSTOMER" | "REMOTE";
    duration: number;
    text?: string;
  }) {
    return this.request<unknown>("POST", "/api/v1/supports", support);
  }

  // --- Tags ---

  async getTags() {
    return this.request<unknown[]>("GET", "/api/v1/tags");
  }

  // --- Timers ---

  async getTimers() {
    return this.request<unknown[]>("GET", "/api/v1/timers");
  }

  async startTimer(ticketId: number) {
    return this.request<unknown>("POST", "/api/v1/timers", { ticketId });
  }
}
```

## Verwendung

```typescript
const tanss = new TanssClient({ baseUrl: "https://tanss.example.com" });
await tanss.login("admin", "password");

// Eigene Tickets abrufen
const tickets = await tanss.getOwnTickets();

// Neues Ticket erstellen
const ticket = await tanss.createTicket({
  companyId: 123,
  title: "Server nicht erreichbar",
  content: "Der Domänencontroller antwortet nicht auf Ping.",
});
```
