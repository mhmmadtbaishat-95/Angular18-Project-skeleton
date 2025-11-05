// nav.types.ts
export type BadgeVariant = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export interface INavBadge {
  text?: string;           
  i18nKey?: string;      
  variant?: BadgeVariant; 
}

export interface INavItem {
  id: string;                
  labelKey: string;         
  icon?: string;             
  route?: string;           
  externalUrl?: string;      
  exact?: boolean;           
  roles?: string[];          
  featureFlag?: string;      
  badge?: INavBadge;          
  children?: INavItem[];   
}
export interface IFeatureConfig {
  key: string;
  enabled: boolean;
  requiredRoles?: string[];
}
