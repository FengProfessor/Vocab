import React from 'react';

export const Fragment = React.Fragment;
export const ForwardRef = Symbol.for('react.forward_ref');
export const Memo = Symbol.for('react.memo');

export function isFragment(object: unknown): boolean {
  return (
    typeof object === 'object' &&
    object !== null &&
    (object as { type?: unknown }).type === React.Fragment
  );
}

export function isElement(object: unknown): boolean {
  return React.isValidElement(object);
}

export function isValidElementType(type: unknown): boolean {
  return (
    typeof type === 'string' ||
    typeof type === 'function' ||
    (typeof type === 'object' && type !== null)
  );
}

export default {
  Fragment,
  ForwardRef,
  Memo,
  isFragment,
  isElement,
  isValidElementType,
};
