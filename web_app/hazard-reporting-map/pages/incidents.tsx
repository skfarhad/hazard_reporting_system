import React from 'react';

const IncidentListView = () => {
  const cards = [
    {
      id: 1,
      title: 'Card Title 1',
      subtitle: 'Subtitle 1',
      description: 'This is a brief description of the card content.',
      status: 'Active',
    },
    {
      id: 2,
      title: 'Card Title 2',
      subtitle: 'Subtitle 2',
      description: 'This is a brief description of the card content.',
      status: 'Inactive',
    },
    {
      id: 3,
      title: 'Card Title 3',
      subtitle: 'Subtitle 3',
      description: 'This is a brief description of the card content.',
      status: 'Active',
    },
    {
      id: 4,
      title: 'Card Title 4',
      subtitle: 'Subtitle 4',
      description: 'This is a brief description of the card content.',
      status: 'Inactive',
    },
    {
      id: 5,
      title: 'Card Title 5',
      subtitle: 'Subtitle 5',
      description: 'This is a brief description of the card content.',
      status: 'Active',
    },
    {
      id: 6,
      title: 'Card Title 6',
      subtitle: 'Subtitle 6',
      description: 'This is a brief description of the card content.',
      status: 'Inactive',
    },
    {
        id: 7,
        title: 'Card Title 7',
        subtitle: 'Subtitle 7',
        description: 'This is a brief description of the card content.',
        status: 'Active',
      },
    // Add more cards as needed
  ];

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Incidents</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => (
          <div
            key={card.id}
            className="bg-white p-6 shadow-md rounded-lg hover:shadow-lg transition-shadow duration-300"
          >
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-semibold">{card.title}</h2>
              <span
                className={`px-3 py-1 text-sm font-medium rounded-full ${
                  card.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}
              >
                {card.status}
              </span>
            </div>
            <h3 className="text-md font-medium text-gray-600 mb-4">{card.subtitle}</h3>
            <p className="text-gray-700">{card.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IncidentListView;
