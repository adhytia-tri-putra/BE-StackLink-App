export interface Link {
  id: string;
  userId: number;
  title: string;
  url: string;
  icon: string | null;
  position: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  startsAt: Date | null;
  endsAt: Date | null;
}

export interface CreateLinkInput {
  title: string;
  url: string;
  icon?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
}

export interface UpdateLinkInput {
  title?: string;
  url?: string;
  icon?: string | null;
  isActive?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
}

export interface ReorderLinkItem {
  id: string;
  position: number;
}

export interface ReorderLinksInput {
  links: ReorderLinkItem[];
}
