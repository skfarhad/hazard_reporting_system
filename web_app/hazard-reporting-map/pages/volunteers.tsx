import React from 'react';

const Volunteers = () => {
  const volunteers = [
    { id: 1, name: 'John Doe', phone: '123-456-7890', email: 'john@example.com', status: 'Active' },
    { id: 2, name: 'Jane Smith', phone: '234-567-8901', email: 'jane@example.com', status: 'Inactive' },
    { id: 3, name: 'Jim Brown', phone: '345-678-9012', email: 'jim@example.com', status: 'Active' },
  ];

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Volunteer List</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full border-b border-neutral-200 dark:border-white/10">
          <thead className="text-left">
            <tr>
              <th className="py-2 px-4 border-b-2">Name</th>
              <th className="py-2 px-4 border-b-2">Phone</th>
              <th className="py-2 px-4 border-b-2">Email</th>
              <th className="py-2 px-4 border-b-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {volunteers.map((volunteer) => (
              <tr key={volunteer.id} className="border-b border-neutral-200 dark:border-white/10">
                <td className="whitespace-nowrap py-2 px-4 border-b">{volunteer.name}</td>
                <td className="whitespace-nowrap py-2 px-4 border-b">{volunteer.phone}</td>
                <td className="whitespace-nowrap py-2 px-4 border-b">{volunteer.email}</td>
                <td className={`whitespace-nowrap py-2 px-4 border-b ${volunteer.status === 'Active' ? 'text-green-600' : 'text-red-600'}`}>
                  {volunteer.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Volunteers;
