import { Button, Modal, ModalBody, ModalFooter } from '@/ui';
import { useState } from 'react';

export function ModalsSection() {
  const [isDefaultOpen, setIsDefaultOpen] = useState(false);
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [isDangerOpen, setIsDangerOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  return (
    <>
      <section className="w-full max-w-4xl mt-8">
        <h2 className="font-cinzel text-2xl font-bold text-gray-700 mb-4 text-center">Modales</h2>
        
        <div className="flex gap-4 justify-center flex-wrap">
          <Button variant="neutral" onClick={() => setIsDefaultOpen(true)}>
            Modal Standard
          </Button>
          <Button variant="warning" onClick={() => setIsWarningOpen(true)}>
            Modal Avertissement
          </Button>
          <Button variant="danger" onClick={() => setIsDangerOpen(true)}>
            Modal Danger
          </Button>
          <Button variant="info" onClick={() => setIsInfoOpen(true)}>
            Modal Info
          </Button>
        </div>
      </section>

      {/* Default Modal */}
      <Modal
        isOpen={isDefaultOpen}
        onClose={() => setIsDefaultOpen(false)}
        title="Améliorer le Château"
        size="md"
        variant="default"
      >
        <ModalBody>
          <p className="mb-4">
            Voulez-vous améliorer le Château au niveau 2 ?
          </p>
          <div className="space-y-2">
            <p><strong>Coûts :</strong></p>
            <ul className="list-disc list-inside ml-4">
              <li>Bois : 100</li>
              <li>Pierre : 80</li>
              <li>Fer : 50</li>
            </ul>
            <p className="mt-4"><strong>Temps :</strong> 5 minutes</p>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="neutral" onClick={() => setIsDefaultOpen(false)}>
            Annuler
          </Button>
          <Button variant="success" onClick={() => setIsDefaultOpen(false)}>
            Confirmer
          </Button>
        </ModalFooter>
      </Modal>

      {/* Warning Modal */}
      <Modal
        isOpen={isWarningOpen}
        onClose={() => setIsWarningOpen(false)}
        title="⚠️ Attention"
        variant="warning"
        size="sm"
      >
        <ModalBody>
          <p className="text-center">Vous n&apos;avez pas assez de ressources !</p>
        </ModalBody>
        <ModalFooter>
          <Button variant="warning" onClick={() => setIsWarningOpen(false)}>
            Compris
          </Button>
        </ModalFooter>
      </Modal>

      {/* Danger Modal */}
      <Modal
        isOpen={isDangerOpen}
        onClose={() => setIsDangerOpen(false)}
        title="Supprimer le village ?"
        variant="danger"
        size="sm"
        closeOnOverlayClick={false}
      >
        <ModalBody>
          <p className="text-center">
            Cette action est irréversible. Êtes-vous sûr de vouloir supprimer votre village ?
          </p>
        </ModalBody>
        <ModalFooter>
          <Button variant="neutral" onClick={() => setIsDangerOpen(false)}>
            Annuler
          </Button>
          <Button variant="danger" onClick={() => setIsDangerOpen(false)}>
            Supprimer
          </Button>
        </ModalFooter>
      </Modal>

      {/* Info Modal */}
      <Modal
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
        title="ℹ️ Informations"
        variant="info"
        size="lg"
      >
        <ModalBody>
          <h3 className="font-cinzel text-xl font-bold mb-3">Bienvenue dans votre royaume</h3>
          <p className="mb-4">
            Gérez vos ressources avec sagesse pour développer votre village et construire une armée puissante.
          </p>
          <div className="space-y-2">
            <p><strong>Ressources disponibles :</strong></p>
            <ul className="list-disc list-inside ml-4">
              <li>Bois : Produit par le Camp de bûcherons</li>
              <li>Pierre : Produite par la Carrière de pierre</li>
              <li>Fer : Produit par la Mine de fer</li>
            </ul>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="info" onClick={() => setIsInfoOpen(false)}>
            J&apos;ai compris
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
