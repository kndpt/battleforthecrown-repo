import { ModalBackdrop, Spinner } from "@/ui";
import { usePublicPlayerProfileQuery } from "@/api/queries";
import { useTickingNow } from "@/lib/useTickingNow";
import { NewbieShieldIcon, NewbieShieldTimer } from "./NewbieShieldIcon";

interface PublicPlayerProfileSheetProps {
  userId: string;
  worldId: string;
  onClose: () => void;
}

const NUMBER_FORMATTER = new Intl.NumberFormat("fr-FR");

/**
 * Fiche publique d'un joueur tiers ouverte depuis la carte. N'affiche que des
 * champs publics par spec (09 § Visibilité) : nom, puissance royaume, état du
 * bouclier débutant. Le bloc bouclier est masqué quand `newbieShield === null`
 * (spec 14 § 3 — pas de signal « exposé » explicite).
 */
export function PublicPlayerProfileSheet({
  userId,
  worldId,
  onClose,
}: PublicPlayerProfileSheetProps) {
  const profile = usePublicPlayerProfileQuery(userId, worldId);
  const now = useTickingNow(1_000);

  // Le serveur reste autoritatif (active vient du DTO). On masque seulement le
  // bloc dès que `endsAt` est dépassé localement — cohérent avec NewbieShieldIcon
  // /Timer qui se masquent à expiration ; évite un libellé « Bouclier débutant »
  // orphelin sans countdown si la fiche reste ouverte au-delà de l'échéance.
  const shieldEndsMs = profile.data?.newbieShield
    ? Date.parse(profile.data.newbieShield.endsAt)
    : Number.NaN;
  const shieldStillVisible =
    Number.isFinite(shieldEndsMs) && shieldEndsMs > now;

  return (
    <ModalBackdrop onClose={onClose}>
      <div
        className="relative font-game"
        style={{ width: 328, maxWidth: "92vw" }}
      >
        <div
          style={{
            background: "linear-gradient(to bottom, #fef9f0, #e8d4a8)",
            border: "4px solid #3c2619",
            borderRadius: 16,
            boxShadow:
              "0 0 0 2px #d4a017, 0 16px 34px rgba(0,0,0,.6), inset 0 2px 0 rgba(255,255,255,.55)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: 7,
              background: "linear-gradient(to right, #f1c40f, #d4a017)",
            }}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              padding: "10px 12px 8px",
            }}
          >
            <span
              style={{
                fontWeight: 900,
                fontSize: 12,
                letterSpacing: ".14em",
                textTransform: "uppercase",
                color: "#6d5838",
              }}
            >
              Profil du joueur
            </span>
            <button
              aria-label="Fermer"
              onClick={onClose}
              className="grid h-7 w-7 shrink-0 cursor-pointer place-items-center rounded-full border-2 border-[#3c2619] bg-[linear-gradient(to_bottom,#fff7e6,#ecd9ab)] text-[#3c2619]"
            >
              ✕
            </button>
          </div>

          <div style={{ padding: "0 12px 14px" }}>
            {profile.isLoading && (
              <div className="grid place-items-center py-8">
                <Spinner />
              </div>
            )}

            {profile.isError && (
              <p className="py-6 text-center text-[12px] font-semibold text-[#7d1e15]">
                Profil indisponible.
              </p>
            )}

            {profile.isSuccess && (
              <div className="flex flex-col gap-3">
                <p
                  style={{
                    fontWeight: 900,
                    fontSize: 18,
                    color: "#3d2f1f",
                    textShadow: "0 1px 0 rgba(255,255,255,.5)",
                  }}
                >
                  {profile.data.displayName}
                </p>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                    padding: "8px 12px",
                    borderRadius: 10,
                    background:
                      "linear-gradient(to bottom, #fff7e6, #ecd9ab)",
                    border: "1.5px solid #b08d5a",
                  }}
                >
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: 9.5,
                      letterSpacing: ".12em",
                      textTransform: "uppercase",
                      color: "#6d5838",
                    }}
                  >
                    Puissance royaume
                  </span>
                  <span
                    style={{
                      fontWeight: 800,
                      fontSize: 16,
                      color: "#3d2f1f",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {NUMBER_FORMATTER.format(profile.data.kingdomPower)}
                  </span>
                </div>

                {profile.data.newbieShield && shieldStillVisible && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 12px",
                      borderRadius: 10,
                      background:
                        "linear-gradient(to bottom, #eef6ff, #d6e6f7)",
                      border: "1.5px solid #6f9bc4",
                    }}
                  >
                    <NewbieShieldIcon
                      endsAt={profile.data.newbieShield.endsAt}
                      size={26}
                    />
                    <div className="flex flex-col">
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: 11,
                          color: "#2c4763",
                        }}
                      >
                        Bouclier débutant
                      </span>
                      <NewbieShieldTimer
                        endsAt={profile.data.newbieShield.endsAt}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </ModalBackdrop>
  );
}
