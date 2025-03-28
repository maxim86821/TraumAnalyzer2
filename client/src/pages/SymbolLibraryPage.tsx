import React from 'react';
import Layout from '@/components/Layout';
import DreamSymbolLibrary from '@/components/DreamSymbolLibrary';
import ProtectedRoute from '@/components/ProtectedRoute';

const SymbolLibraryPage: React.FC = () => {
  return (
    <ProtectedRoute>
      <Layout>
        <DreamSymbolLibrary />
      </Layout>
    </ProtectedRoute>
  );
};

export default SymbolLibraryPage;