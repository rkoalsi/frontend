const formatAddress = (address: any) => {
  if (!address || typeof address !== 'object') return '';
  const parts = [
    address.attention,
    address.address,
    address.streetz,
    address.city,
    address.state,
    address.zip,
    address.country,
  ].filter((part) => part && part.toString().trim() !== '');
  return parts.join(', ');
};

export default formatAddress;
