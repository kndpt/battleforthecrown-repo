import '@testing-library/jest-dom/vitest';

// jsdom n'implémente pas scrollIntoView (utilisé par le listbox custom Select).
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}
