import { Injectable } from '@nestjs/common';

export interface TicketacoVenue {
  place_name: string | null;
  place_detail: string | null;
  address: string;
}

export interface TicketacoEvent {
  id: string;
  title: string;
  status: string;
  start_date: string;
  end_date: string;
  image_url: string | null;
  created_at: string;
  venues: TicketacoVenue;
}

export interface TicketacoOrganizationResponse {
  organization: { id: string; name: string };
  events: TicketacoEvent[];
}

export interface TicketacoApiClient {
  fetchOrganization(slug: string): Promise<TicketacoOrganizationResponse>;
}

export const TICKETACO_API_CLIENT = Symbol('TICKETACO_API_CLIENT');

@Injectable()
export class HttpTicketacoApiClient implements TicketacoApiClient {
  async fetchOrganization(
    slug: string,
  ): Promise<TicketacoOrganizationResponse> {
    try {
      const encoded = encodeURIComponent(slug);
      const res = await fetch(
        `https://vlizxsubseudvtswwsjd.supabase.co/functions/v1/organizations/${encoded}`,
        { signal: AbortSignal.timeout(5000) },
      );

      if (!res.ok) {
        throw new Error(
          `Ticketaco API error: ${res.status} for slug "${slug}"`,
        );
      }

      return res.json() as Promise<TicketacoOrganizationResponse>;
    } catch (error) {
      if (error instanceof Error && /^(Abort|Timeout)Error$/.test(error.name)) {
        throw new Error(`Ticketaco API timeout for slug "${slug}"`);
      }
      throw error;
    }
  }
}
