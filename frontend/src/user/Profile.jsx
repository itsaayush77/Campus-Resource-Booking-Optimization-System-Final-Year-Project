import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen py-8 bg-gray-50">
      <div className="max-w-3xl px-4 mx-auto">
        <div className="p-6 bg-white rounded-lg shadow">
          <h1 className="mb-6 text-2xl font-bold">My Profile</h1>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-600">Name</label>
              <p className="text-lg font-medium">{user?.name}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Email</label>
              <p className="text-lg font-medium">{user?.email}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Role</label>
              <p className="text-lg font-medium capitalize">{user?.role}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Department</label>
              <p className="text-lg font-medium">{user?.department || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Phone Number</label>
              <p className="text-lg font-medium">{user?.phoneNumber || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;