import { AuthResponse, ContactInfo, UserInfo, ValidatedAgent, MetaOption } from "../types";

const API_BASE = "https://api1.simplyworkcrm.com/api:xyNb4DPW";

export const api = {
  login: async (user_id: string, location_id: string): Promise<string> => {
    try {
      const response = await fetch(`${API_BASE}/auth/ghl/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id, location_id }),
      });

      if (!response.ok) {
        throw new Error("Authentication failed");
      }

      const data: AuthResponse = await response.json();
      return data.authToken;
    } catch (error) {
      console.error("Login Error:", error);
      throw error;
    }
  },

  getMe: async (authToken: string): Promise<UserInfo> => {
    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user info");
      }

      return await response.json();
    } catch (error) {
      console.error("Get Me Error:", error);
      throw error;
    }
  },

  getContact: async (
    authToken: string, 
    location_id: string, 
    contact_id: string | null, 
    conversation_id: string | null
  ): Promise<ContactInfo> => {
    try {
      const params = new URLSearchParams();
      params.append("location_id", location_id);
      
      if (contact_id) {
        params.append("contact_id", contact_id);
      } else if (conversation_id) {
        params.append("conversation_id", conversation_id);
      }

      const response = await fetch(`${API_BASE}/ghl/contact?${params.toString()}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch contact info");
      }

      return await response.json();
    } catch (error) {
      console.error("Get Contact Error:", error);
      throw error;
    }
  },

  validatePolicyNumber: async (authToken: string, policyNumber: string): Promise<boolean> => {
    const response = await fetch(`${API_BASE}/policy/validator`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ policyNumber }),
    });
    if (!response.ok) throw new Error("Policy number validation failed");
    const data = await response.json();
    // API returns true = duplicate (reject), false = available (accept)
    return data === true || data?.result === true || data?.exists === true || data?.duplicate === true;
  },

  validateAgent: async (authToken: string, npn: string): Promise<ValidatedAgent> => {
    try {
      const response = await fetch(`${API_BASE}/agent/${npn}/validate`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Invalid NPN");
      }

      return await response.json();
    } catch (error) {
      console.error("Validate Agent Error:", error);
      throw error;
    }
  },

  getContactSources: async (authToken: string): Promise<MetaOption[]> => {
    try {
      const response = await fetch(`${API_BASE}/meta/contactSources`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch sources");
      }

      const data = await response.json();
      // Handle various response structures (array or wrapped object)
      const list = Array.isArray(data) ? data : (data.sources || data.options || data.data || []);
      
      // Map common field names to id/name structure and ensure string IDs
      return list.map((item: any) => ({
        id: String(item.id || item.value || item.key || item._id),
        name: item.name || item.label || item.title || item.source || "Unknown"
      })).filter((i: MetaOption) => i.id && i.id !== "undefined" && i.name !== "Unknown");

    } catch (error) {
      console.error("Get Sources Error:", error);
      return [];
    }
  },

  getContactTypes: async (authToken: string): Promise<MetaOption[]> => {
    try {
      const response = await fetch(`${API_BASE}/meta/contactTypes`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch types");
      }

      const data = await response.json();
      const list = Array.isArray(data) ? data : (data.types || data.options || data.data || []);

      return list.map((item: any) => ({
        id: String(item.id || item.value || item.key || item._id),
        name: item.name || item.label || item.title || item.type || "Unknown"
      })).filter((i: MetaOption) => i.id && i.id !== "undefined" && i.name !== "Unknown");

    } catch (error) {
      console.error("Get Types Error:", error);
      return [];
    }
  },

  getCarriers: async (authToken: string): Promise<MetaOption[]> => {
    try {
      const response = await fetch(`${API_BASE}/meta/carriers`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch carriers");
      }

      const data = await response.json();
      const list = Array.isArray(data) ? data : (data.carriers || data.options || data.data || []);

      return list.map((item: any) => ({
        id: String(item.id || item.value || item.key || item._id),
        name: item.name || item.label || item.title || item.carrier || "Unknown"
      })).filter((i: MetaOption) => i.id && i.id !== "undefined" && i.name !== "Unknown");

    } catch (error) {
      console.error("Get Carriers Error:", error);
      return [];
    }
  },

  getPolicyStatuses: async (authToken: string, typeId?: string): Promise<MetaOption[]> => {
    try {
      // Build URL with optional type_id query parameter
      const url = typeId 
        ? `${API_BASE}/meta/policyStatuses?type_id=${encodeURIComponent(typeId)}`
        : `${API_BASE}/meta/policyStatuses`;
        
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch policy statuses");
      }

      const data = await response.json();
      const list = Array.isArray(data) ? data : (data.statuses || data.options || data.data || []);

      return list.map((item: any) => ({
        id: String(item.id || item.value || item.key || item._id),
        name: item.name || item.label || item.title || item.status || "Unknown"
      })).filter((i: MetaOption) => i.id && i.id !== "undefined" && i.name !== "Unknown");

    } catch (error) {
      console.error("Get Policy Statuses Error:", error);
      return [];
    }
  },

  createPolicy: async (authToken: string, data: any): Promise<any> => {
    try {
      const response = await fetch(`${API_BASE}/policy`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create policy");
      }

      return await response.json();
    } catch (error) {
      console.error("Create Policy Error:", error);
      throw error;
    }
  },

  createAnnuityPolicy: async (authToken: string, data: any): Promise<any> => {
    try {
      const response = await fetch(`${API_BASE}/policy/annuity`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create annuity policy");
      }

      return await response.json();
    } catch (error) {
      console.error("Create Annuity Policy Error:", error);
      throw error;
    }
  }
};