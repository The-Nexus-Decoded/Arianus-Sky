/**
 * Zone Action Bindings
 * 
 * Per Orla's zone bindings spec:
 * | Zone   | Primary Action          | Secondary Action    |
 * | ------ | ----------------------- | ------------------- |
 * | CENTER | confirm / select        | -                   |
 * | NORTH  | scroll up / previous   | secondary           |
 * | SOUTH  | scroll down / next      | tertiary            |
 * | WEST   | back / cancel           | secondary           |
 * | EAST   | forward / action        | secondary           |
 * | NW/NE  | secondary actions       | configurable        |
 * | SW/SE  | tertiary actions        | configurable        |
 */

export type ZoneAction = 
  | 'confirm' | 'select'
  | 'scroll_up' | 'previous'
  | 'scroll_down' | 'next'
  | 'back' | 'cancel'
  | 'forward' | 'action'
  | 'secondary'
  | 'tertiary'
  | 'none';

export interface ZoneBinding {
  primary: ZoneAction;
  secondary?: ZoneAction;
  tertiary?: ZoneAction;
}

export type ZoneBindings = Record<string, ZoneBinding>;

export const DEFAULT_ZONE_BINDINGS: ZoneBindings = {
  CENTER: { primary: 'confirm', secondary: 'select' },
  NORTH: { primary: 'scroll_up', secondary: 'previous' },
  SOUTH: { primary: 'scroll_down', secondary: 'next' },
  WEST: { primary: 'back', secondary: 'cancel' },
  EAST: { primary: 'forward', secondary: 'action' },
  NW: { primary: 'secondary', secondary: 'tertiary' },
  NE: { primary: 'secondary', secondary: 'tertiary' },
  SW: { primary: 'tertiary', secondary: 'secondary' },
  SE: { primary: 'tertiary', secondary: 'secondary' },
};

/**
 * Resolve zone binding to action
 */
export function getZoneAction(
  zone: string, 
  bindings: ZoneBindings = DEFAULT_ZONE_BINDINGS,
  modifier: 'primary' | 'secondary' | 'tertiary' = 'primary'
): ZoneAction {
  const binding = bindings[zone];
  if (!binding) return 'none';
  return binding[modifier] || binding.primary;
}

export default DEFAULT_ZONE_BINDINGS;
