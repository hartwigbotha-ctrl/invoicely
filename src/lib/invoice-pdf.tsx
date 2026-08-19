import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#1f2937" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  businessName: { fontSize: 18, fontWeight: 700, marginBottom: 4 },
  small: { fontSize: 9, color: "#6b7280" },
  invoiceTitle: { fontSize: 22, fontWeight: 700, textAlign: "right" },
  metaLabel: { fontSize: 9, color: "#6b7280", textAlign: "right" },
  metaValue: { fontSize: 10, textAlign: "right", marginBottom: 6 },
  section: { marginBottom: 20 },
  sectionLabel: { fontSize: 9, color: "#6b7280", marginBottom: 4, textTransform: "uppercase" },
  table: { marginTop: 10, borderTopWidth: 1, borderTopColor: "#e5e7eb" },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#f9fafb",
    paddingVertical: 6,
    paddingHorizontal: 4,
    fontWeight: 700,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  colDesc: { flex: 4 },
  colQty: { flex: 1, textAlign: "right" },
  colPrice: { flex: 1.5, textAlign: "right" },
  colAmount: { flex: 1.5, textAlign: "right" },
  totalsBlock: { marginTop: 12, alignSelf: "flex-end", width: 220 },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  totalsLabel: { color: "#6b7280" },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 6,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    fontWeight: 700,
    fontSize: 12,
  },
  footer: { marginTop: 30, fontSize: 9, color: "#6b7280" },
  statusBadge: {
    marginTop: 8,
    alignSelf: "flex-end",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 3,
    fontSize: 9,
    fontWeight: 700,
  },
});

export type InvoicePdfData = {
  business: {
    name: string;
    email: string;
    phone?: string | null;
    address?: string | null;
    vatNumber?: string | null;
    bankDetails?: string | null;
  };
  client: {
    name: string;
    email?: string | null;
    address?: string | null;
    vatNumber?: string | null;
  };
  invoice: {
    number: string;
    status: string;
    issueDate: string;
    dueDate: string;
    currency: string;
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    total: number;
    notes?: string | null;
  };
  lineItems: { description: string; quantity: number; unitPrice: number; amount: number }[];
};

function money(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-ZA", { style: "currency", currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function statusColor(status: string) {
  switch (status) {
    case "paid":
      return { backgroundColor: "#dcfce7", color: "#166534" };
    case "overdue":
      return { backgroundColor: "#fee2e2", color: "#991b1b" };
    case "sent":
      return { backgroundColor: "#dbeafe", color: "#1e40af" };
    default:
      return { backgroundColor: "#f3f4f6", color: "#374151" };
  }
}

export function InvoiceDocument({ data }: { data: InvoicePdfData }) {
  const { business, client, invoice, lineItems } = data;
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.businessName}>{business.name}</Text>
            {business.address && <Text style={styles.small}>{business.address}</Text>}
            {business.email && <Text style={styles.small}>{business.email}</Text>}
            {business.phone && <Text style={styles.small}>{business.phone}</Text>}
            {business.vatNumber && <Text style={styles.small}>VAT: {business.vatNumber}</Text>}
          </View>
          <View>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.metaLabel}>Invoice #</Text>
            <Text style={styles.metaValue}>{invoice.number}</Text>
            <Text style={styles.metaLabel}>Issue date</Text>
            <Text style={styles.metaValue}>{invoice.issueDate}</Text>
            <Text style={styles.metaLabel}>Due date</Text>
            <Text style={styles.metaValue}>{invoice.dueDate}</Text>
            <View style={[styles.statusBadge, statusColor(invoice.status)]}>
              <Text>{invoice.status.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Bill to</Text>
          <Text style={{ fontWeight: 700 }}>{client.name}</Text>
          {client.address && <Text style={styles.small}>{client.address}</Text>}
          {client.email && <Text style={styles.small}>{client.email}</Text>}
          {client.vatNumber && <Text style={styles.small}>VAT: {client.vatNumber}</Text>}
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={styles.colDesc}>Description</Text>
            <Text style={styles.colQty}>Qty</Text>
            <Text style={styles.colPrice}>Unit price</Text>
            <Text style={styles.colAmount}>Amount</Text>
          </View>
          {lineItems.map((li, i) => (
            <View style={styles.tableRow} key={i}>
              <Text style={styles.colDesc}>{li.description}</Text>
              <Text style={styles.colQty}>{li.quantity}</Text>
              <Text style={styles.colPrice}>{money(li.unitPrice, invoice.currency)}</Text>
              <Text style={styles.colAmount}>{money(li.amount, invoice.currency)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsBlock}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Subtotal</Text>
            <Text>{money(invoice.subtotal, invoice.currency)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Tax ({invoice.taxRate}%)</Text>
            <Text>{money(invoice.taxAmount, invoice.currency)}</Text>
          </View>
          <View style={styles.grandTotalRow}>
            <Text>Total</Text>
            <Text>{money(invoice.total, invoice.currency)}</Text>
          </View>
        </View>

        {invoice.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Notes</Text>
            <Text style={styles.small}>{invoice.notes}</Text>
          </View>
        )}

        {business.bankDetails && (
          <View style={styles.footer}>
            <Text style={styles.sectionLabel}>Payment details</Text>
            <Text>{business.bankDetails}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}

export async function generateInvoicePdf(data: InvoicePdfData): Promise<Buffer> {
  return renderToBuffer(<InvoiceDocument data={data} />);
}
