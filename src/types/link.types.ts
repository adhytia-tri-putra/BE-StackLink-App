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
}

export interface CreateLinkInput {
  title: string;
  url: string;
  icon?: string | null;
}

export interface UpdateLinkInput {
  title?: string;
  url?: string;
  icon?: string | null;
  isActive?: boolean;
}

export interface ReorderLinkItem {
  id: string;
  position: number;
}

export interface ReorderLinksInput {
  links: ReorderLinkItem[];
}