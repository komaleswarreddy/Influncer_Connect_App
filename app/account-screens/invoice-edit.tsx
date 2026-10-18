import React, { useCallback } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { KollabScreenHeader, ScrollScreen, showKollabToast } from '@/components/ui';
import { InvoiceForm } from '@/components/invoices/InvoiceForm';

export default function InvoiceEditScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const onUnavailable = useCallback(
    (message: string) => {
      showKollabToast(message);
      router.back();
    },
    [router]
  );

  return (
    <ScrollScreen
      safeAreaEdges={['top', 'left', 'right', 'bottom']}
      scrollProps={{ keyboardShouldPersistTaps: 'handled' }}
    >
      <KollabScreenHeader title="Edit invoice" subtitle="Only drafts can be changed" />
      <InvoiceForm
        mode="edit"
        invoiceId={typeof id === 'string' ? id : undefined}
        onSaved={() => router.back()}
        onUnavailable={onUnavailable}
      />
    </ScrollScreen>
  );
}
