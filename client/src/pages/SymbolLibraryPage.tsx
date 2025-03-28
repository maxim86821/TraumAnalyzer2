import React from 'react';
import Layout from '@/components/Layout';
import DreamSymbolLibrary from '@/components/DreamSymbolLibrary';
import { ProtectedRoute } from '@/components/ProtectedRoute';

const SymbolLibraryPageContent: React.FC = () => {
  return (
    <Layout>
      <DreamSymbolLibrary />
    </Layout>
  );
};

const SymbolLibraryPage: React.FC = () => {
  return <SymbolLibraryPageContent />;
};

export default SymbolLibraryPage;