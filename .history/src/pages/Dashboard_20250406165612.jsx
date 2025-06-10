const Dashboard = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">OJT Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Hours Card */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-700">Total Hours</h2>
          <p className="text-3xl font-bold text-blue-600 mt-2">0</p>
        </div>

        {/* Today's Progress Card */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-700">Today's Progress</h2>
          <p className="text-3xl font-bold text-green-600 mt-2">0 hrs</p>
        </div>

        {/* Documents Status Card */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-700">Documents</h2>
          <p className="text-3xl font-bold text-purple-600 mt-2">0/0</p>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          <p className="text-gray-600">No recent activity</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 