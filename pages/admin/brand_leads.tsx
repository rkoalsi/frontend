import { useEffect } from 'react';
import { useRouter } from 'next/router';

const BrandLeads = () => {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/leads?tab=brand');
  }, []); // eslint-disable-line
  return null;
};

export default BrandLeads;
