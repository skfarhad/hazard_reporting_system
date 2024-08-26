import React from 'react';

const SummaryCardsComponent = () => {
  return (
    <div className="w-1/6 z-10 h-[90vh] bg-gray-100 p-4 font-bold">
      <div className="flex flex-col space-y-4">
        <div className="card bg-red-400 rounded-md p-4 shadow-md">
        <h3 className="text-md">Open Incidents</h3>
        <p className="text-lg">200</p>
        </div>
        <div className="card bg-green-400 rounded-md p-4 shadow-md">
        <h3 className="text-md">Closed Incidents</h3>
        <p className="text-lg">300</p>
        </div>
        <div className="card bg-purple-400 rounded-md p-4 shadow-md">
        <h3 className="text-lg">Active Volunteers</h3>
        <p className="text-md">100</p>
        </div>
        <div className="card bg-cyan-400 rounded-md p-4 shadow-md">
        <h3 className="text-lg">Total volunteers</h3>
        <p className="text-md">120</p>
        </div>
      </div>
    </div>
  );
};

export default SummaryCardsComponent;