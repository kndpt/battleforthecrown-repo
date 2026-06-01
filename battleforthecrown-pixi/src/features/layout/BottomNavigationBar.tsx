import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
} from "react";
import { Castle, Globe, Lock, Mail, Swords } from "lucide-react";
import { useBuildingsForLockCheck } from "./useBuildingsForLockCheck";

type Tab = "army" | "buildings" | "world" | "messages";

export const BOTTOM_NAV_HEIGHT_VAR = "--bftc-bottom-nav-height";
export const BOTTOM_NAV_GAP_VAR = "--bftc-bottom-nav-gap";
const BOTTOM_NAV_GAP_PX = 18;

interface BottomNavigationBarProps {
  onBuildingsClick: () => void;
  onArmyClick?: () => void;
  onWorldClick?: () => void;
  onMessagesClick?: () => void;
  activeTab?: Tab;
  animateActiveOnMount?: boolean;
  density?: "compact" | "cozy";
  /** Number of unread combat reports — drives the red bubble on Messages. */
  unreadCount?: number;
}

type LucideIcon = ComponentType<{ size?: number; strokeWidth?: number }>;

// ─── Design tokens — verbatim from the "V13 · Sceau jaillissant" design file ──
const reset: CSSProperties = {
  appearance: "none",
  border: "none",
  background: "transparent",
  cursor: "pointer",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: 0,
  font: "inherit",
};

// Pastille or "frappée" — médaillon réutilisable (V3).
const goldFace: CSSProperties = {
  background:
    "radial-gradient(circle at 50% 30%, #fff1c4 0%, #f4ca5b 44%, #cd962f 100%)",
  boxShadow:
    "0 4px 9px rgba(0,0,0,.45), 0 0 16px rgba(246,213,123,.45), inset 0 2px 2px rgba(255,255,255,.75), inset 0 -3px 6px rgba(140,86,12,.55)",
  border: "2px solid #9e7b0d",
};

const labelCss = (active: boolean): CSSProperties => ({
  fontFamily: "Cinzel, Georgia, serif",
  fontWeight: 700,
  fontSize: 8,
  letterSpacing: ".12em",
  textTransform: "uppercase",
  color: active ? "#f8e3a6" : "#c9b489",
  textShadow: "0 1px 1px rgba(0,0,0,.6)",
  transition: "color .18s",
});

interface NavItemProps {
  icon: LucideIcon;
  label: string;
  active: boolean;
  locked?: boolean;
  lockHint?: string;
  hint?: string;
  badge?: number;
  onClick?: () => void;
}

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      style={{
        position: "absolute",
        top: -7,
        right: -9,
        minWidth: 16,
        height: 16,
        padding: "0 4px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 999,
        border: "1.5px solid #2e2112",
        background: "linear-gradient(to bottom, #e25141, #b4271b)",
        color: "#fff",
        fontFamily: "Cinzel, Georgia, serif",
        fontWeight: 800,
        fontSize: 9,
        lineHeight: 1,
        boxShadow: "0 1px 3px rgba(0,0,0,.5)",
      }}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

// Spring-ish easing so the seal rises/settles smoothly on page change.
const RISE = "cubic-bezier(.34,1.45,.64,1)";

function NavItem({
  icon: Icon,
  label,
  active,
  locked = false,
  lockHint,
  hint,
  badge = 0,
  onClick,
}: NavItemProps) {
  const IconCmp = locked ? Lock : Icon;
  return (
    <button
      type="button"
      onClick={locked ? undefined : onClick}
      disabled={locked}
      title={locked ? lockHint : hint}
      style={{
        ...reset,
        flex: 1,
        gap: 8,
        ...(locked ? { opacity: 0.4, cursor: "not-allowed" } : null),
      }}
    >
      {/* Short fixed slot → bar height never shifts. The seal is bottom-anchored
          (stays tight to the label) and juts UPWARD; it never pushes the label. */}
      <span
        style={{
          position: "relative",
          width: 40,
          height: 22,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Médaillon frappé (V3) — fond doré qui jaillit vers le haut (V5). */}
        <span
          style={{
            position: "absolute",
            left: 1,
            top: -18,
            width: 40,
            height: 40,
            borderRadius: "50%",
            ...goldFace,
            boxShadow: `0 5px 11px rgba(0,0,0,.5), ${goldFace.boxShadow as string}`,
            opacity: active ? 1 : 0,
            transform: active ? "scale(1)" : "scale(.55)",
            transformOrigin: "50% 100%",
            transition: `opacity .22s ease, transform .28s ${RISE}`,
            pointerEvents: "none",
          }}
        />
        {/* Icône — monte au centre du sceau, vire au bronze quand actif. */}
        <span
          style={{
            position: "relative",
            zIndex: 1,
            display: "inline-flex",
            color: active ? "#5a3d0e" : locked ? "#8d7c58" : "#e0cda3",
            transform: active ? "translateY(-9px)" : "translateY(0)",
            transition: `color .2s ease, transform .28s ${RISE}`,
          }}
        >
          <IconCmp size={19} strokeWidth={1.9} />
          <Badge count={badge} />
        </span>
      </span>
      <span style={labelCss(active)}>{label}</span>
    </button>
  );
}

export function BottomNavigationBar({
  onBuildingsClick,
  onArmyClick,
  onWorldClick,
  onMessagesClick,
  activeTab = "buildings",
  animateActiveOnMount = false,
  unreadCount = 0,
}: BottomNavigationBarProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const { isBarracksBuilt, isWatchtowerBuilt } = useBuildingsForLockCheck();
  const [shouldShowActive, setShouldShowActive] = useState(!animateActiveOnMount);

  useEffect(() => {
    if (!animateActiveOnMount) return undefined;

    const frame = window.requestAnimationFrame(() => setShouldShowActive(true));

    return () => window.cancelAnimationFrame(frame);
  }, [animateActiveOnMount]);

  const animatedActiveTab = shouldShowActive ? activeTab : undefined;

  useLayoutEffect(() => {
    const node = rootRef.current;
    if (!node) return undefined;

    const syncHeight = () => {
      // Floating bar: reserve the gap between the bar's top edge and the viewport
      // bottom so scrollable content above never slides under it.
      const top = node.getBoundingClientRect().top;
      const reserved = Math.max(0, window.innerHeight - top);
      document.documentElement.style.setProperty(
        BOTTOM_NAV_HEIGHT_VAR,
        `${reserved}px`,
      );
      document.documentElement.style.setProperty(
        BOTTOM_NAV_GAP_VAR,
        `${BOTTOM_NAV_GAP_PX}px`,
      );
    };

    syncHeight();
    window.addEventListener("resize", syncHeight);
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(syncHeight);
    observer?.observe(node);

    return () => {
      window.removeEventListener("resize", syncHeight);
      observer?.disconnect();
      document.documentElement.style.removeProperty(BOTTOM_NAV_HEIGHT_VAR);
      document.documentElement.style.removeProperty(BOTTOM_NAV_GAP_VAR);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 40,
        padding: "0 12px",
        paddingBottom: "max(env(safe-area-inset-bottom), 0px)",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "relative",
          margin: "0 auto 16px",
          maxWidth: 460,
          pointerEvents: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: "linear-gradient(to bottom, #54401f, #2e2112)",
            border: "1.5px solid #1d1408",
            borderRadius: 18,
            boxShadow:
              "0 10px 22px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.16)",
            padding: "7px 4px",
          }}
        >
          <NavItem
            icon={Swords}
            label="Armée"
            active={animatedActiveTab === "army"}
            locked={!isBarracksBuilt}
            lockHint="Construisez la caserne pour débloquer"
            hint="Gérer votre armée"
            onClick={onArmyClick}
          />

          <NavItem
            icon={Castle}
            label="Village"
            active={animatedActiveTab === "buildings"}
            hint="Retour au village"
            onClick={onBuildingsClick}
          />

          <NavItem
            icon={Mail}
            label="Messages"
            active={animatedActiveTab === "messages"}
            hint="Consulter vos messages"
            badge={unreadCount}
            onClick={onMessagesClick}
          />

          <NavItem
            icon={Globe}
            label="Monde"
            active={animatedActiveTab === "world"}
            locked={!isWatchtowerBuilt}
            lockHint="Construisez la tour de guet pour débloquer"
            hint="Explorer la carte du monde"
            onClick={onWorldClick}
          />
        </div>
      </div>
    </div>
  );
}
