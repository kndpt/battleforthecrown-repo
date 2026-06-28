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

  // Ajustements d'état pendant le render (pattern React recommandé, converge) :
  // - à l'ouverture, monter l'élément dans la même passe ;
  // - à la fermeture, déclencher la transition de sortie sans passer par un
  //   effet (évite un setState « nu » dans useLayoutEffect).
  if (isOpen && !isRendered) setIsRendered(true);
  if (!isOpen && isVisible) setIsVisible(false);

  useLayoutEffect(() => {
    if (!isOpen || !isRendered) return;
    // Lecture de layout = flush de la frame fermée avant le flip vers ouvert.
    // Ce setState *est* la synchronisation animation↔DOM voulue (jouer la
    // transition après que le navigateur a peint l'état fermé) ; la règle
    // set-state-in-effect le rejette par prudence, dérogation assumée et locale.
    void panelRef.current?.getBoundingClientRect();
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
  // Cache du dernier contenu ouvert, lu uniquement sur les frames de sortie.
  // Même forme que `usePrevious` (écriture/lecture de ref en render) ; la règle
  // react-hooks/refs interdit ce motif par prudence mais il est ici idempotent
  // et volontairement hors du flux de mémoïsation du compilateur.
  const lastChildrenRef = useRef<ReactNode>(children);
  // eslint-disable-next-line react-hooks/refs
  if (isOpen) lastChildrenRef.current = children;
  // eslint-disable-next-line react-hooks/refs
  return isOpen ? children : lastChildrenRef.current;
}
