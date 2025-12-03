import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Loader2, Save, Send } from "lucide-react";

interface EmailEditorProps {
  request: {
    id: string;
    client_name: string;
    client_email: string;
    client_phone: string;
    custom_theme: string;
    client_message?: string;
    selected_options?: any[];
    estimated_price?: number | null;
    status: string;
  };
  onClose: () => void;
}

const statusOptions = [
  { value: "pending", label: "En Attente", color: "#F59E0B" },
  { value: "processing", label: "En Analyse", color: "#3B82F6" },
  { value: "quoted", label: "Devis Envoyé", color: "#06B6D4" },
  { value: "accepted", label: "Accepté", color: "#10B981" },
  { value: "completed", label: "Terminé", color: "#6B7280" },
  { value: "rejected", label: "Rejeté", color: "#EF4444" },
];

export const EmailEditor = ({ request, onClose }: EmailEditorProps) => {
  const [status, setStatus] = useState(request.status);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [companyName, setCompanyName] = useState("Six Events");
  
  // Style
  const [backgroundColor, setBackgroundColor] = useState("#F8FAFC");
  const [accentColor, setAccentColor] = useState("#2563EB");
  const [textColor, setTextColor] = useState("#1E293B");
  const [fontFamily, setFontFamily] = useState("Sans Serif");
  
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Mettre à jour le sujet en fonction du statut
    const statusLabel = statusOptions.find((s) => s.value === status)?.label || "Mise à jour";
    setSubject(`${statusLabel} - Party Builder - ${companyName}`);
    
    // Message par défaut basé sur le statut
    updateDefaultMessage(status);
  }, [status]);

  const updateDefaultMessage = (newStatus: string) => {
    const messages: Record<string, string> = {
      pending: `Bonjour ${request.client_name},\n\nNous avons reçu votre demande de Party Builder et nous l'examinons actuellement.\n\nNous vous recontacterons bientôt avec un devis détaillé.\n\nMerci de votre confiance !`,
      processing: `Bonjour ${request.client_name},\n\nNous analysons votre demande en détail.\n\nThème: ${request.custom_theme}\n\nNotre équipe prépare une proposition personnalisée pour vous.\n\nAttendez notre contact prochainement !`,
      quoted: `Bonjour ${request.client_name},\n\nNous avons le plaisir de vous envoyer notre devis pour votre Party Builder.\n\n💰 Prix estimé: ${request.estimated_price || 'À définir'}€\n\nThème: ${request.custom_theme}\n\nVeuillez consulter les détails et nous faire savoir si vous souhaitez confirmer.\n\nNous restons à votre disposition pour toute question !`,
      accepted: `Bonjour ${request.client_name},\n\nNous avons le plaisir de vous informer que votre demande a été acceptée !\n\n✅ Votre Party Builder est confirmé\n\nNous vous recontacterons pour finaliser les détails.\n\nNous avons hâte de créer cette fête incroyable !`,
      completed: `Bonjour ${request.client_name},\n\nVotre Party Builder a été terminé avec succès !\n\n🎊 Nous espérons que vous passerez une fête merveilleuse\n\nMerci de votre confiance. Nous serions ravis de recevoir des photos de l'événement !`,
      rejected: `Bonjour ${request.client_name},\n\nMalheureusement, nous ne pouvons pas accepter votre demande pour le moment.\n\nVeuillez nous contacter pour discuter des alternatives ou pour une nouvelle demande.\n\nMerci de votre compréhension.`,
    };
    
    setMessage(messages[newStatus] || messages.pending);
  };

  const handleSaveTemplate = async () => {
    setSaving(true);
    try {
      const template = {
        subject,
        message,
        companyName,
        backgroundColor,
        accentColor,
        textColor,
        fontFamily,
        status,
      };

      // Enregistrer dans localStorage comme template
      const templates = JSON.parse(localStorage.getItem("emailTemplates") || "[]");
      templates.push({
        id: Date.now(),
        name: `Template ${status} - ${new Date().toLocaleDateString()}`,
        ...template,
      });
      localStorage.setItem("emailTemplates", JSON.stringify(templates));

      toast.success("Template enregistré avec succès !");
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du template:", error);
      toast.error("Erreur lors de l'enregistrement du template");
    } finally {
      setSaving(false);
    }
  };

  const handleSendEmail = async () => {
    if (!message.trim()) {
      toast.error("Veuillez écrire un message");
      return;
    }

    setSending(true);
    try {
      // Mettre à jour le statut de la demande
      const { error: updateError } = await supabase
        .from("party_builder_requests")
        .update({ status } as any)
        .eq("id", request.id);

      if (updateError) throw updateError;

      // Préparer les données de l'email avec le HTML rendu
      const emailData = {
        clientName: request.client_name,
        clientEmail: request.client_email,
        subject,
        message,
        companyName,
        status,
        statusLabel: statusOptions.find((s) => s.value === status)?.label,
        statusColor: statusOptions.find((s) => s.value === status)?.color,
        backgroundColor,
        accentColor,
        textColor,
        fontFamily,
        customTheme: request.custom_theme,
        options: request.selected_options || [],
        estimatedPrice: request.estimated_price,
      };

      // Insérer dans la file d'attente des emails
      const { error: emailError } = await supabase
        .from("email_queue")
        .insert({
          type: "party_builder_status_update",
          recipient_email: request.client_email,
          data: JSON.stringify(emailData),
          status: "pending",
        } as any);

      if (emailError) throw emailError;

      toast.success("Email envoyé avec succès !");
      onClose();
    } catch (error) {
      console.error("Erreur lors de l'envoi de l'email:", error);
      toast.error("Erreur lors de l'envoi de l'email");
    } finally {
      setSending(false);
    }
  };

  // Aperçu de l'email
  const emailPreview = () => {
    const statusLabel = statusOptions.find((s) => s.value === status)?.label || status;
    const statusColorValue = statusOptions.find((s) => s.value === status)?.color || accentColor;
    
    return (
      <div 
        style={{ 
          backgroundColor, 
          color: textColor,
          fontFamily: fontFamily === "Sans Serif" ? "Arial, sans-serif" : "Georgia, serif",
          padding: "20px",
          borderRadius: "8px",
          minHeight: "400px",
        }}
      >
        {/* Header */}
        <div 
          style={{ 
            background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}dd 100%)`,
            color: "white",
            padding: "30px 20px",
            borderRadius: "8px 8px 0 0",
            marginBottom: "20px",
            textAlign: "center",
          }}
        >
          <h1 style={{ margin: 0, fontSize: "28px" }}>{companyName}</h1>
        </div>

        {/* Status Badge */}
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <span 
            style={{
              display: "inline-block",
              backgroundColor: statusColorValue,
              color: "white",
              padding: "8px 16px",
              borderRadius: "20px",
              fontSize: "14px",
              fontWeight: "600",
            }}
          >
            {statusLabel}
          </span>
        </div>

        {/* Salutation */}
        <div style={{ padding: "20px" }}>
          <h2 style={{ color: textColor, marginBottom: "20px" }}>
            Bonjour, {request.client_name} !
          </h2>

          {/* Message Principal */}
          <div 
            style={{
              backgroundColor: "rgba(255,255,255,0.7)",
              padding: "20px",
              borderRadius: "8px",
              marginBottom: "20px",
              whiteSpace: "pre-wrap",
              lineHeight: "1.6",
            }}
          >
            {message}
          </div>

          {/* Détails de la Demande */}
          <div 
            style={{
              backgroundColor: "rgba(255,255,255,0.5)",
              padding: "15px",
              borderRadius: "8px",
              marginTop: "20px",
              fontSize: "14px",
            }}
          >
            <h3 style={{ margin: "0 0 10px 0", fontSize: "16px", fontWeight: "bold" }}>
              📋 Détails de votre demande
            </h3>
            <p style={{ margin: "5px 0" }}>
              <strong>🎨 Thème:</strong> {request.custom_theme}
            </p>
            <p style={{ margin: "5px 0" }}>
              <strong>📧 Email:</strong> {request.client_email}
            </p>
            <p style={{ margin: "5px 0" }}>
              <strong>📱 Téléphone:</strong> {request.client_phone}
            </p>
            {request.estimated_price && request.estimated_price > 0 && (
              <p style={{ margin: "5px 0" }}>
                <strong>💰 Prix Estimé:</strong> {request.estimated_price}€
              </p>
            )}
            {request.selected_options && request.selected_options.length > 0 && (
              <div style={{ marginTop: "10px" }}>
                <strong>🎁 Options sélectionnées:</strong>
                <ul style={{ margin: "5px 0", paddingLeft: "20px" }}>
                  {request.selected_options.map((opt: any, idx: number) => (
                    <li key={idx}>{opt.name} x{opt.quantity} ({opt.total}€)</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Footer */}
          <div 
            style={{
              marginTop: "30px",
              paddingTop: "20px",
              borderTop: "1px solid rgba(0,0,0,0.1)",
              textAlign: "center",
              fontSize: "12px",
              color: "#666",
            }}
          >
            <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
            <p style={{ margin: "10px 0" }}>
              © {new Date().getFullYear()} {companyName}. Tous droits réservés.
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full overflow-hidden">
      {/* Editor (Esquerda) */}
      <div className="space-y-4 overflow-y-auto pr-4 pb-4 max-h-[calc(90vh-120px)]">
        <h3 className="text-lg font-semibold sticky top-0 bg-background pb-2 z-10">Éditeur d'Email</h3>

        {/* Statut */}
        <div>
          <Label>Statut de la Demande</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Nom de l'Entreprise */}
        <div>
          <Label>Nom de l'Entreprise</Label>
          <Input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Six Events"
          />
        </div>

        {/* Objet */}
        <div>
          <Label>Objet de l'Email</Label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Objet..."
          />
        </div>

        {/* Message */}
        <div>
          <Label>Message Principal</Label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={8}
            placeholder="Tapez votre message..."
          />
        </div>

        {/* Style */}
        <div className="space-y-3 pt-4 border-t">
          <h4 className="font-semibold">Personnalisation</h4>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Couleur de Fond</Label>
              <Input
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
              />
            </div>

            <div>
              <Label>Couleur d'Accent</Label>
              <Input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
              />
            </div>

            <div>
              <Label>Couleur du Texte</Label>
              <Input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
              />
            </div>

            <div>
              <Label>Police</Label>
              <Select value={fontFamily} onValueChange={setFontFamily}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sans Serif">Sans Serif</SelectItem>
                  <SelectItem value="Serif">Serif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-2 pt-4 sticky bottom-0 bg-background pb-2">
          <Button
            variant="outline"
            onClick={handleSaveTemplate}
            disabled={saving}
            className="flex-1"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Sauvegarder Template
          </Button>

          <Button
            onClick={handleSendEmail}
            disabled={sending}
            className="flex-1"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Envoyer Email
          </Button>
        </div>
      </div>

      {/* Preview (Direita) */}
      <div className="border-l pl-6 overflow-hidden">
        <div className="h-full flex flex-col">
          <h3 className="text-lg font-semibold mb-4 flex-shrink-0">Preview en Temps Réel</h3>
          <div className="border rounded-lg overflow-auto shadow-lg flex-1 max-h-[calc(90vh-120px)]">
            {emailPreview()}
          </div>
        </div>
      </div>
    </div>
  );
};
