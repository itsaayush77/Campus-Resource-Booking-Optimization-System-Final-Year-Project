import { Link } from 'react-router-dom';

const Unauthorized = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-red-600">403</h1>
        <p className="mt-4 text-xl text-gray-600">Unauthorized Access</p>
        <p className="mt-2 text-sm text-gray-500">You don't have permission to access this page</p>
        <Link 
          to="/" 
          className="inline-block px-6 py-3 mt-6 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;