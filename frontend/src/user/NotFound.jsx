import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900">404</h1>
        <p className="mt-4 text-xl text-gray-600">Page Not Found</p>
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

export default NotFound;