import { dedupedRecipientUserIds } from './combat-report.utils';

describe('dedupedRecipientUserIds', () => {
  it('returns empty for no inputs', () => {
    expect(dedupedRecipientUserIds()).toEqual([]);
  });

  it('drops null and undefined ids', () => {
    expect(dedupedRecipientUserIds(null, undefined, 'a')).toEqual(['a']);
  });

  it('drops empty strings (barbarian villages have no userId)', () => {
    expect(dedupedRecipientUserIds('', 'a', '')).toEqual(['a']);
  });

  it('deduplicates repeated ids while preserving first occurrence order', () => {
    expect(dedupedRecipientUserIds('a', 'b', 'a', 'c', 'b')).toEqual([
      'a',
      'b',
      'c',
    ]);
  });

  it('returns both distinct ids for two-recipient reports', () => {
    expect(dedupedRecipientUserIds('origin-user', 'target-user')).toEqual([
      'origin-user',
      'target-user',
    ]);
  });

  it('collapses to a single id when sender and receiver are the same player', () => {
    expect(dedupedRecipientUserIds('p1', 'p1')).toEqual(['p1']);
  });
});
