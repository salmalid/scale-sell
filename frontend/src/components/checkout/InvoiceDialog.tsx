import { Download, Printer, X, FileText } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Invoice } from '@/types/checkout';
import { formatWeight, formatPrice } from '@/utils/weightEstimation';

interface InvoiceDialogProps {
  invoice: Invoice | null;
  open: boolean;
  onClose: () => void;
}

export function InvoiceDialog({ invoice, open, onClose }: InvoiceDialogProps) {
  if (!invoice) return null;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-MA', {
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(date);
  };

  const handleDownload = () => {
    const content = generateTextInvoice(invoice);
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `facture-${invoice.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg print:max-w-none print:shadow-none">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Facture
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 print:text-sm" id="invoice-content">
          {/* Header */}
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-bold text-primary">🛒 Caisse Intelligente</h2>
            <p className="text-muted-foreground">Système de Caisse Automatique</p>
          </div>

          <Separator />

          {/* Invoice details */}
          <div className="flex justify-between text-sm">
            <div>
              <p className="font-medium">N° Facture</p>
              <p className="text-muted-foreground font-mono">{invoice.id}</p>
            </div>
            <div className="text-right">
              <p className="font-medium">Date</p>
              <p className="text-muted-foreground">{formatDate(invoice.timestamp)}</p>
            </div>
          </div>

          <Separator />

          {/* Items */}
          <div className="space-y-2">
            <h3 className="font-semibold">Articles</h3>
            <div className="space-y-2">
              {invoice.items.map((item, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{item.fruit.icon}</span>
                    <div>
                      <p className="font-medium">{item.fruit.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatWeight(item.weightKg)} × {formatPrice(item.unitPrice)}/kg
                      </p>
                    </div>
                  </div>
                  <span className="font-medium">{formatPrice(item.totalPrice)}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Totals */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Sous-total</span>
              <span>{formatPrice(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>TVA ({(invoice.tvaRate * 100).toFixed(0)}%)</span>
              <span>{formatPrice(invoice.tva)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-xl font-bold">
              <span>Total</span>
              <span className="text-primary">{formatPrice(invoice.total)}</span>
            </div>
          </div>

          <Separator />

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground">
            <p>Merci pour votre achat ! 🙏</p>
            <p>شكرا على مشترياتكم</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 print:hidden">
          <Button variant="outline" className="flex-1" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Télécharger
          </Button>
          <Button variant="outline" className="flex-1" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimer
          </Button>
          <Button className="flex-1" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function generateTextInvoice(invoice: Invoice): string {
  const lines: string[] = [
    '═══════════════════════════════════════════',
    '         🛒 CAISSE INTELLIGENTE',
    '      Système de Caisse Automatique',
    '═══════════════════════════════════════════',
    '',
    `Facture N°: ${invoice.id}`,
    `Date: ${new Intl.DateTimeFormat('fr-MA', { dateStyle: 'long', timeStyle: 'short' }).format(invoice.timestamp)}`,
    '',
    '───────────────────────────────────────────',
    'ARTICLES',
    '───────────────────────────────────────────',
    '',
  ];

  invoice.items.forEach(item => {
    lines.push(`${item.fruit.icon} ${item.fruit.name}`);
    lines.push(`   ${formatWeight(item.weightKg)} × ${formatPrice(item.unitPrice)}/kg = ${formatPrice(item.totalPrice)}`);
  });

  lines.push('');
  lines.push('───────────────────────────────────────────');
  lines.push(`Sous-total:           ${formatPrice(invoice.subtotal)}`);
  lines.push(`TVA (${(invoice.tvaRate * 100).toFixed(0)}%):              ${formatPrice(invoice.tva)}`);
  lines.push('───────────────────────────────────────────');
  lines.push(`TOTAL:                ${formatPrice(invoice.total)}`);
  lines.push('═══════════════════════════════════════════');
  lines.push('');
  lines.push('Merci pour votre achat ! 🙏');
  lines.push('شكرا على مشترياتكم');

  return lines.join('\n');
}
