import { Textarea, InputLabel, InputHelperText, Button, Panel, PanelHeader, PanelBody, PanelFooter } from '@/ui';
import { useState } from 'react';

export function TextareasSection() {
  const [message, setMessage] = useState('');
  const [description, setDescription] = useState('');
  const maxChars = 500;
  const isValid = description.length >= 20 && description.length <= 200;

  return (
    <section className="w-full max-w-4xl mt-12">
      <h2 className="font-cinzel text-2xl font-bold text-gray-700 mb-6 text-center">Zones de texte (Textareas)</h2>
      
      <div className="space-y-6">
        {/* Variants */}
        <div className="space-y-4">
          <h3 className="font-game text-lg font-semibold text-gray-700">Variants</h3>
          
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600 mb-2">Default</p>
              <Textarea variant="default" placeholder="Zone de texte standard..." />
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-2">Parchment (médiéval)</p>
              <Textarea variant="parchment" placeholder="Écrivez votre message..." />
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-2">Success (validé)</p>
              <Textarea variant="success" placeholder="Texte validé..." defaultValue="Ce texte est valide !" />
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-2">Error (invalide)</p>
              <Textarea variant="error" placeholder="Texte invalide..." defaultValue="Texte trop court" />
            </div>
          </div>
        </div>

        {/* Tailles */}
        <div className="space-y-4">
          <h3 className="font-game text-lg font-semibold text-gray-700">Tailles</h3>
          
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600 mb-2">Small (60px min)</p>
              <Textarea variant="parchment" size="sm" placeholder="Commentaire court..." />
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-2">Medium (100px min)</p>
              <Textarea variant="parchment" size="md" placeholder="Message standard..." />
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-2">Large (150px min)</p>
              <Textarea variant="parchment" size="lg" placeholder="Article ou description longue..." />
            </div>
          </div>
        </div>

        {/* Exemples contextuels */}
        <div className="space-y-4">
          <h3 className="font-game text-lg font-semibold text-gray-700">Exemples contextuels</h3>
          
          {/* Message avec compteur */}
          <div className="bg-white/50 rounded-lg p-4 border-2 border-[#d4c094]">
            <p className="text-sm text-gray-600 mb-3 font-semibold">Message avec compteur de caractères</p>
            <div className="space-y-2">
              <InputLabel htmlFor="message-counter">
                Message ({message.length} / {maxChars})
              </InputLabel>
              <Textarea
                id="message-counter"
                variant="parchment"
                size="md"
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, maxChars))}
                placeholder="Écrivez votre message..."
                rows={5}
              />
              <InputHelperText>
                Maximum {maxChars} caractères
              </InputHelperText>
            </div>
          </div>

          {/* Textarea avec validation */}
          <div className="bg-white/50 rounded-lg p-4 border-2 border-[#d4c094]">
            <p className="text-sm text-gray-600 mb-3 font-semibold">Avec validation (20-200 caractères)</p>
            <div className="space-y-2">
              <InputLabel htmlFor="validated" required>
                Description du bâtiment
              </InputLabel>
              <Textarea
                id="validated"
                variant={description.length === 0 ? 'parchment' : isValid ? 'success' : 'error'}
                size="md"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez votre bâtiment personnalisé..."
                rows={4}
                maxLength={200}
              />
              <InputHelperText variant={isValid ? 'success' : 'error'}>
                {description.length === 0
                  ? 'Minimum 20 caractères requis'
                  : description.length < 20
                  ? `${20 - description.length} caractères minimum`
                  : `✓ ${description.length} / 200 caractères`}
              </InputHelperText>
            </div>
          </div>

          {/* Textarea désactivée */}
          <div className="bg-white/50 rounded-lg p-4 border-2 border-[#d4c094]">
            <p className="text-sm text-gray-600 mb-3 font-semibold">Zone de texte verrouillée</p>
            <div className="space-y-2">
              <InputLabel htmlFor="disabled">Message (verrouillé)</InputLabel>
              <Textarea
                id="disabled"
                variant="default"
                size="md"
                value="Ce texte ne peut pas être modifié. Il est verrouillé pour des raisons de sécurité."
                disabled
              />
            </div>
          </div>

          {/* Dans un Panel */}
          <Panel variant="parchment" padding="none">
            <PanelHeader variant="parchment">
              <span>Envoyer un message à la guilde</span>
            </PanelHeader>
            <PanelBody>
              <div className="space-y-2">
                <InputLabel htmlFor="guild-message">
                  Message
                </InputLabel>
                <Textarea
                  id="guild-message"
                  variant="parchment"
                  size="md"
                  placeholder="Annoncez quelque chose à votre guilde..."
                  rows={5}
                />
                <InputHelperText>
                  Ce message sera visible par tous les membres de la guilde.
                </InputHelperText>
              </div>
            </PanelBody>
            <PanelFooter variant="parchment">
              <Button variant="neutral" size="sm">Annuler</Button>
              <Button variant="success" size="sm">Envoyer</Button>
            </PanelFooter>
          </Panel>
        </div>
      </div>
    </section>
  );
}
