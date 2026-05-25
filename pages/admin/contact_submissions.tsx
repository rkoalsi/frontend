import { useEffect } from 'react';
import { useRouter } from 'next/router';

const ContactSubmissions = () => {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/leads?tab=contact');
  }, []); // eslint-disable-line
  return null;
};

export default ContactSubmissions;
