export interface DashboardLinks {
  menuLinks: MenuLink[];
  externalLinks?: MenuLink[];
  quickLinks?: Link[];
  documentationItems?: Link[];
}

export type LinkType = 'item' | 'section';

export interface MenuLink {
  type: LinkType;
  link: string;
  text: string;
  icon: string;
  iframe?: boolean;
  items?: SectionItem[];
}

export interface SectionItem {
  type: LinkType;
  link: string;
  text: string;
}

export interface Link {
  text: string;
  desc: string;
  link: string;
}
