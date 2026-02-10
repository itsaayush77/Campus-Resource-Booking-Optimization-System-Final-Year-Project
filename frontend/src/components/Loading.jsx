const Loading = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto border-b-4 border-blue-600 rounded-full animate-spin"></div>
        <p className="mt-4 font-medium text-gray-600">Loading...</p>
      </div>
    </div>
  );
};

export default Loading;