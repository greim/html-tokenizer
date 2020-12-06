import { Entities } from './types';

const DEFAULT_ENTITIES: Entities = {
  'quot': '\u0022',
  'amp': '\u0026',
  'lt': '\u003C',
  'gt': '\u003E',
  'nbsp': '\u00A0',
};

/**
 * A small set of the most common entities for use during parsing.
 */
export default DEFAULT_ENTITIES;

Object.freeze(DEFAULT_ENTITIES);
