/// <reference types="node" />

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const featuresRoot = join(process.cwd(), 'src/features');
const allowedFeatureSheetChildren = [
  'GameBottomSheetPanel',
  'KingdomActivitiesBottomSheet',
  'MultiVillageBottomSheet',
  'PlayerProfileSheet',
] as const;

const sharedPanelWrappers = [
  'design-system/components/KingdomActivitiesPanel.tsx',
  'design-system/components/MultiVillageBottomSheet.tsx',
  'design-system/components/PlayerProfileSheet.tsx',
] as const;

function walkTsxFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) return walkTsxFiles(path);
    return path.endsWith('.tsx') ? [path] : [];
  });
}

function bottomSheetBlocks(source: string): string[] {
  return source.match(/<BottomSheet\b[\s\S]*?<\/BottomSheet>/g) ?? [];
}

describe('BottomSheet feature conventions', () => {
  it('renders feature sheets through the shared game panel or an approved wrapper', () => {
    const violations = walkTsxFiles(featuresRoot).flatMap((file) => {
      const source = readFileSync(file, 'utf8');
      return bottomSheetBlocks(source).flatMap((block, index) => {
        const usesSharedPanel = allowedFeatureSheetChildren.some((child) =>
          block.includes(`<${child}`),
        );
        return usesSharedPanel
          ? []
          : [`${relative(featuresRoot, file)}#${index + 1}`];
      });
    });

    expect(violations).toEqual([]);
  });

  it('keeps approved feature wrappers backed by GameBottomSheetPanel', () => {
    const violations = sharedPanelWrappers.flatMap((file) => {
      const source = readFileSync(join(featuresRoot, file), 'utf8');
      return source.includes('<GameBottomSheetPanel') ? [] : [file];
    });

    expect(violations).toEqual([]);
  });
});
