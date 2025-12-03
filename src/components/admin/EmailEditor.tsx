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
  { value: "pending", label: "Em Espera", color: "#F59E0B" },
  { value: "analyzing", label: "Em Análise", color: "#3B82F6" },
  { value: "accepted", label: "Aceito", color: "#10B981" },
  { value: "in_progress", label: "Em Curso", color: "#8B5CF6" },
  { value: "completed", label: "Concluído", color: "#6B7280" },
  { value: "rejected", label: "Rejeitado", color: "#EF4444" },
];

export const EmailEditor = ({ request, onClose }: EmailEditorProps) => {
  const [status, setStatus] = useState(request.status);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [companyName, setCompanyName] = useState("Six Events");
  
  // Estilo
  const [backgroundColor, setBackgroundColor] = useState("#F8FAFC");
  const [accentColor, setAccentColor] = useState("#2563EB");
  const [textColor, setTextColor] = useState("#1E293B");
  const [fontFamily, setFontFamily] = useState("Sans Serif");
  
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Atualizar assunto baseado no status
    const statusLabel = statusOptions.find((s) => s.value === status)?.label || "Atualização";
    setSubject(`${statusLabel} - Party Builder - ${companyName}`);
    
    // Mensagem padrão baseada no status
    updateDefaultMessage(status);
  }, [status]);

  const updateDefaultMessage = (newStatus: string) => {
    const messages: Record<string, string> = {
      pending: `Olá ${request.client_name},\n\nRecebemos o seu pedido para o Party Builder e estamos a analisá-lo.\n\nEm breve entraremos em contacto com um orçamento detalhado.\n\nObrigado pela sua preferência!`,
      analyzing: `Olá ${request.client_name},\n\nEstamos a analisar o seu pedido em detalhe.\n\nTema: ${request.custom_theme}\n\nA nossa equipa está a preparar uma proposta personalizada para si.\n\nAguarde o nosso contacto em breve!`,
      accepted: `Olá ${request.client_name},\n\nTemos o prazer de informar que o seu pedido foi aceite!\n\n✅ O seu Party Builder está confirmado\n\nEntraremos em contacto para finalizar os detalhes.\n\nMal podemos esperar para criar esta festa incrível!`,
      in_progress: `Olá ${request.client_name},\n\nBoas notícias! O seu Party Builder está em curso.\n\n🎉 A nossa equipa já está a trabalhar na preparação\n\nEm breve terá tudo pronto para uma festa inesquecível!`,
      completed: `Olá ${request.client_name},\n\nO seu Party Builder foi concluído com sucesso!\n\n🎊 Esperamos que tenha uma festa maravilhosa\n\nObrigado por confiar em nós. Adoraríamos receber fotos do evento!`,
      rejected: `Olá ${request.client_name},\n\nInfelizmente não conseguimos aceitar o seu pedido neste momento.\n\nPor favor, contacte-nos para discutir alternativas ou para um novo pedido.\n\nObrigado pela compreensão.`,
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

      // Salvar no localStorage como template
      const templates = JSON.parse(localStorage.getItem("emailTemplates") || "[]");
      templates.push({
        id: Date.now(),
        name: `Template ${status} - ${new Date().toLocaleDateString()}`,
        ...template,
      });
      localStorage.setItem("emailTemplates", JSON.stringify(templates));

      toast.success("Template salvo com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar template:", error);
      toast.error("Erro ao salvar template");
    } finally {
      setSaving(false);
    }
  };

  const handleSendEmail = async () => {
    if (!message.trim()) {
      toast.error("Por favor, escreva uma mensagem");
      return;
    }

    setSending(true);
    try {
      // Atualizar status do pedido
      const { error: updateError } = await supabase
        .from("party_builder_requests")
        .update({ status } as any)
        .eq("id", request.id);

      if (updateError) throw updateError;

      // Preparar dados do email com o HTML renderizado
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

      // Inserir na fila de emails
      const { error: emailError } = await supabase
        .from("email_queue")
        .insert({
          type: "party_builder_status_update",
          recipient_email: request.client_email,
          data: JSON.stringify(emailData),
          status: "pending",
        } as any);

      if (emailError) throw emailError;

      toast.success("Email enviado com sucesso!");
      onClose();
    } catch (error) {
      console.error("Erro ao enviar email:", error);
      toast.error("Erro ao enviar email");
    } finally {
      setSending(false);
    }
  };

  // Preview do email
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

        {/* Saudação */}
        <div style={{ padding: "20px" }}>
          <h2 style={{ color: textColor, marginBottom: "20px" }}>
            Olá, {request.client_name}!
          </h2>

          {/* Mensagem Principal */}
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

          {/* Detalhes do Pedido */}
          <div 
            style={{
              backgroundColor: "rgba(255,255,255,0.5)",
              padding: "15px",
              borderRadius: "8px",
              marginTop: "20px",
              fontSize: "14px",
            }}
          >
            <p style={{ margin: "5px 0" }}>
              <strong>📧 Email:</strong> {request.client_email}
            </p>
            <p style={{ margin: "5px 0" }}>
              <strong>📱 Telefone:</strong> {request.client_phone}
            </p>
            {request.estimated_price && (
              <p style={{ margin: "5px 0" }}>
                <strong>💰 Preço Estimado:</strong> {request.estimated_price}€
              </p>
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
            <p>Se tiver alguma dúvida, não hesite em contactar-nos.</p>
            <p style={{ margin: "10px 0" }}>
              © {new Date().getFullYear()} {companyName}. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-2 gap-6 h-full">
      {/* Editor (Esquerda) */}
      <div className="space-y-4 overflow-y-auto pr-4">
        <h3 className="text-lg font-semibold">Editor de Email</h3>

        {/* Status */}
        <div>
          <Label>Status do Pedido</Label>
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

        {/* Nome da Empresa */}
        <div>
          <Label>Nome da Empresa</Label>
          <Input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Six Events"
          />
        </div>

        {/* Assunto */}
        <div>
          <Label>Assunto do Email</Label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Assunto..."
          />
        </div>

        {/* Mensagem */}
        <div>
          <Label>Mensagem Principal</Label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={8}
            placeholder="Digite sua mensagem..."
          />
        </div>

        {/* Estilo */}
        <div className="space-y-3 pt-4 border-t">
          <h4 className="font-semibold">Personalização</h4>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Cor de Fundo</Label>
              <Input
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
              />
            </div>

            <div>
              <Label>Cor de Destaque</Label>
              <Input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
              />
            </div>

            <div>
              <Label>Cor do Texto</Label>
              <Input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
              />
            </div>

            <div>
              <Label>Fonte</Label>
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
        <div className="flex gap-2 pt-4">
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
            Salvar Template
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
            Enviar Email
          </Button>
        </div>
      </div>

      {/* Preview (Direita) */}
      <div className="border-l pl-6">
        <div className="sticky top-0">
          <h3 className="text-lg font-semibold mb-4">Preview em Tempo Real</h3>
          <div className="border rounded-lg overflow-hidden shadow-lg">
            {emailPreview()}
          </div>
        </div>
      </div>
    </div>
  );
};
