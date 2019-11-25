import { LayoutTypes, LayoutBreakpoints } from '../types';

export const defaultLayouts: LayoutTypes = ['desktop', 'tablet', 'mobile'];

export const defaultBreakpoints: LayoutBreakpoints = ['(min-width: 991px)', '(min-width: 481px)', '(max-width: 480px)'];

const mm = typeof window === 'undefined' ? () => ({ matches: [] }) : window.matchMedia;

export function getCurrentLayout<T>(breakpoints: Array<string>, layouts: Array<T>, defaultLayout: T) {
  const query = breakpoints.findIndex(q => mm(q).matches);
  const layout = layouts[query];
  return layout !== undefined ? layout : defaultLayout;
}
