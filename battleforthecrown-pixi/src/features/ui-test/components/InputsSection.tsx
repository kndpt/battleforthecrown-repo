import { Input, InputLabel, InputHelperText } from '@/ui';

export function InputsSection() {
  return (
    <section className="w-full max-w-4xl mt-12">
      <h2 className="font-cinzel text-2xl font-bold text-gray-700 mb-6 text-center">Champs de saisie</h2>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Input default */}
        <div>
          <InputLabel htmlFor="username" required>Nom d&apos;utilisateur</InputLabel>
          <Input 
            id="username" 
            type="text" 
            placeholder="Entrez votre nom"
            variant="default"
            size="md"
          />
          <InputHelperText variant="default">3-20 caractères alphanumériques</InputHelperText>
        </div>

        {/* Input parchment */}
        <div>
          <InputLabel htmlFor="village">Nom du village</InputLabel>
          <Input 
            id="village" 
            type="text" 
            placeholder="Château de..."
            variant="parchment"
            size="md"
          />
          <InputHelperText variant="default">Choisissez un nom unique</InputHelperText>
        </div>

        {/* Input success */}
        <div>
          <InputLabel htmlFor="email-valid" size="md">Email (validé)</InputLabel>
          <Input 
            id="email-valid" 
            type="email" 
            placeholder="email@exemple.com"
            variant="success"
            defaultValue="joueur@example.com"
            size="md"
          />
          <InputHelperText variant="success">Format valide ✓</InputHelperText>
        </div>

        {/* Input error */}
        <div>
          <InputLabel htmlFor="email-error">Email (invalide)</InputLabel>
          <Input 
            id="email-error" 
            type="email" 
            placeholder="email@exemple.com"
            variant="error"
            defaultValue="email-invalide"
            size="md"
          />
          <InputHelperText variant="error">Format d&apos;email invalide</InputHelperText>
        </div>

        {/* Input disabled */}
        <div>
          <InputLabel htmlFor="id">ID Joueur</InputLabel>
          <Input 
            id="id" 
            type="text" 
            variant="default"
            defaultValue="12345678"
            disabled
            size="md"
          />
          <InputHelperText variant="default">Ce champ ne peut pas être modifié</InputHelperText>
        </div>

        {/* Input small */}
        <div>
          <InputLabel htmlFor="search" size="sm">Recherche rapide</InputLabel>
          <Input 
            id="search" 
            type="search" 
            placeholder="Chercher..."
            variant="parchment"
            size="sm"
          />
        </div>
      </div>
    </section>
  );
}
