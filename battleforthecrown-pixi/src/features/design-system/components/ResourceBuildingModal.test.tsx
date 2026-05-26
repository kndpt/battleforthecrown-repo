import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ResourceBuildingModal } from './ResourceBuildingModal';

const accent = {
  border: '#9e7b0d',
  dark: '#d4a017',
  haloTint: 'rgba(241,196,15,.4)',
  light: '#f1c40f',
};

describe('ResourceBuildingModal', () => {
  it('renders Quarter population as available housing ratios without hourly production units', () => {
    const { container } = render(
      <ResourceBuildingModal
        accent={accent}
        buildingIcon="/assets/quarter.png"
        cost={{ crowns: 0, iron: 0, stone: 0, wood: 0 }}
        eyebrow="Logement · Population"
        isPopulation
        level={7}
        levelStats={{
          7: { production: 160, storage: 480 },
          8: { production: 215, storage: 535 },
        }}
        linkVariant="rule"
        maxLevel={10}
        name="Quartier"
        requirementLabel="Château niv. 1"
        resourceIcon="/assets/resources/population.png"
        resourceLabel="villageois"
        stock={{ crowns: 0, iron: 0, stone: 0, wood: 0 }}
        stockNow={320}
        tagline="Sans pain, point de soldats."
        upgradeTime="1:00"
      />,
    );

    expect(container).toHaveTextContent('Capacité');
    expect(container).toHaveTextContent('Logement');
    expect(container).toHaveTextContent('160 / 480');
    expect(container).toHaveTextContent('215 / 535');
    expect(container).toHaveTextContent('+55 villageois');
    expect(container).not.toHaveTextContent('/ heure');
    expect(container).not.toHaveTextContent('/ h');
  });
});
