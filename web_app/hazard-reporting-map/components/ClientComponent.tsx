import React, { useEffect, useState } from 'react';

export default function ClientComponent({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  return <>{isClient ? children : null}</>;
}
