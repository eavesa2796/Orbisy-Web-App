export function salesRange(value: unknown) {
    const days = typeof value === "string" && value.trim() ? Number(value) : NaN;
    return [0, 7, 30, 90].includes(days) ? days : 30;
}
export const salesStatusLabels: Record<string, string> = { new_inbound: "New inquiry", needs_review: "Needs review", qualified: "Qualified", contact_planned: "Contact planned", contacted: "Contacted", replied: "Replied", consultation: "Consultation", proposal_sent: "Proposal awaiting reply", won: "Won", lost: "Lost", suppressed: "Do not contact", manually_added: "Manually added", saved: "Saved, no linked lead" };
export type SalesSummary = {
    days: number;
    totals: {
        inquiries: number;
        progressing: number;
        proposalPending: number;
        won: number;
        lost: number;
    };
    statuses: {
        status: string;
        count: number;
    }[];
    services: {
        service: string;
        count: number;
    }[];
    sources: {
        source: string;
        medium: string;
        campaign: string;
        count: number;
        won: number;
    }[];
    recent: {
        id: string;
        leadId: string | null;
        name: string;
        service: string;
        status: string;
        submittedAt: Date;
    }[];
    followUps: {
        id: string;
        name: string;
        status: string;
        followUpAt: Date | null;
    }[];
    followUpsDue: number;
    workspaceProposals: number;
};
