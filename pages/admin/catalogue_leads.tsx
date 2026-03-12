import { useEffect } from 'react';
import { useRouter } from 'next/router';

const CatalogueLeads = () => {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/leads?tab=catalogue');
  }, []); // eslint-disable-line
  return null;
};

export default CatalogueLeads;
