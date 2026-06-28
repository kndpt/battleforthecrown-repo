import {
  type ReactNode,
  type RefObject,
  type TransitionEvent,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

interface EnterExitOptions {
  /**
   * Propriété CSS transitionnée dont la fin marque celle de l'animation de
   * sortie (déclenche le démontage). Défaut : `transform`.
   */
  property?: string;
}

export interface EnterExitTransition {
  /** Le composant doit-il rester dans le DOM (true pendant l'animation de sortie). */
  isRendered: boolean;
  /** État ouvert *visuel* : pilote les classes/transform d'entrée et de sortie. */
  isVisible: boolean;
  /** À poser sur l'élément animé (celui qui porte la transition CSS). */
  panelRef: RefObject<HTMLDivElement | null>;
  /** À brancher sur `onTransitionEnd` de l'élément animé pour démonter en fin de sortie. */
  handleTransitionEnd: (event: TransitionEvent<HTMLElement>) => void;
}

/**
 * Pilote une animation enter/exit basée sur des transitions CSS pour un élément
 * monté/démonté selon `isOpen`.
 *
 * Le piège classique : un composant qui fait `if (!isOpen) return null` est
 * démonté instantanément (aucune sortie) et monté directement à sa position
 * finale (aucune entrée) — les classes `transition-*` n'ont jamais deux valeurs
 * à interpoler. Ce hook résout les deux :
 *
 * - `isRendered` garde l'élément dans le DOM le temps de l'animation de sortie,
 *   le démontage n'arrivant qu'au `transitionend` (voir `handleTransitionEnd`).
 * - À l'entrée, on force un reflow (`getBoundingClientRect`) sur la frame fermée
 *   avant de basculer `isVisible` → le navigateur a une frame de départ et anime
 *   réellement (sinon le passage fermé → ouvert est coalescé en un seul style).
 *
 * Le consommateur mappe `isVisible` vers ses propres classes (translateY, scale,
 * opacity…) et pose `panelRef` + `onTransitionEnd={handleTransitionEnd}` sur
 * l'élément animé.
 */
export function useEnterExitTransition(
  isOpen: boolean,
  options: EnterExitOptions = {},
): EnterExitTransition {
  const { property = 'transform' } = options;
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);

  // Ajustement d'état pendant le render (pattern React recommandé) : l'élément
  // est monté dans la même passe, l'effet ci-dessous le voit déjà présent.
  if (isOpen && !isRendered) setIsRendered(true);

  useLayoutEffect(() => {
    if (!isOpen || !isRendered) {
      if (!isOpen) setIsVisible(false);
      return;
    }
    // Lecture de layout = flush de la frame fermée avant le flip vers ouvert.
    void panelRef.current?.getBoundingClientRect();
    setIsVisible(true);
  }, [isOpen, isRendered]);

  const handleTransitionEnd = (event: TransitionEvent<HTMLElement>) => {
    if (event.target !== event.currentTarget || event.propertyName !== property) return;
    if (!isOpen) setIsRendered(false);
  };

  return { isRendered, isVisible, panelRef, handleTransitionEnd };
}

/**
 * Conserve le dernier contenu rendu pendant l'animation de sortie.
 *
 * Certains parents passent un enfant conditionnel lié à la même condition que
 * `isOpen` (ex. `{recruitTroop ? <Popup/> : null}`) qui se démonte
 * instantanément à la fermeture, laissant un conteneur vide s'animer. On rejoue
 * le dernier contenu connu tant que l'élément n'est pas fermé.
 */
export function useRetainedChildren(isOpen: boolean, children: ReactNode): ReactNode {
  const lastChildrenRef = useRef<ReactNode>(children);
  if (isOpen) lastChildrenRef.current = children;
  return isOpen ? children : lastChildrenRef.current;
}
