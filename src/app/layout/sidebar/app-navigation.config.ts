import { IFeatureConfig, INavItem } from "./models/nav.types";

export const FEATURE_FLAGS: Record<string, IFeatureConfig> = {
  dashboard: { key: 'dashboard', enabled: true },
  users:     { key: 'users', enabled: true, requiredRoles: ['admin', 'manager'] },
  settings:  { key: 'settings', enabled: true },
};

export const RAW_NAV_ITEMS: INavItem[] = [
  {
    id: 'dashboard',
    labelKey: 'navigation.dashboard',
    icon: 'home',
    route: '/dashboard',
    exact: true,
    featureFlag: 'dashboard',
  },
  {
    id: 'users',
    labelKey: 'navigation.users',
    icon: 'users',
    route: '/users',
    featureFlag: 'users',
  },
  {
    id: 'settings',
    labelKey: 'navigation.settings',
    icon: 'cog',
    route: '/settings',
    featureFlag: 'settings',
  },
];

export function buildNav(
  items: INavItem[],
  features: Record<string, IFeatureConfig>,
  userRoles: string[] = []
): INavItem[] {
  const allowByFeature = (flag?: string) => {
    if (!flag) return true;
    const fc = features[flag];
    if (!fc?.enabled) return false;
    if (fc.requiredRoles?.length) {
      return fc.requiredRoles.some(r => userRoles.includes(r));
    }
    return true;
  };

  const recur = (list: INavItem[]): INavItem[] =>
    list
      .filter(i => allowByFeature(i.featureFlag))
      .map(i => ({
        ...i,
        children: i.children ? recur(i.children) : undefined,
      }))
      .filter(i => (i.children ? i.children.length > 0 : true));

  return recur(items);
}
