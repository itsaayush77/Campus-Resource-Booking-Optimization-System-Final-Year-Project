const Footer = () => {
  return (
    <footer className="py-8 mt-auto text-white bg-gray-800">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* About Section */}
          <div>
            <h3 className="mb-4 text-lg font-bold">CampusBook</h3>
            <p className="text-sm text-gray-400">
              Simplifying campus resource booking and optimization for educational institutions.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-lg font-bold">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/" className="text-gray-400 transition duration-200 hover:text-white">
                  Home
                </a>
              </li>
              <li>
                <a href="/resources" className="text-gray-400 transition duration-200 hover:text-white">
                  Resources
                </a>
              </li>
              <li>
                <a href="/about" className="text-gray-400 transition duration-200 hover:text-white">
                  About Us
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-lg font-bold">Contact</h3>
            <p className="text-sm text-gray-400">
              Email: support@campusbook.edu<br />
              Phone: +977-123-456-7890
            </p>
          </div>
        </div>

        <div className="pt-6 mt-8 text-sm text-center text-gray-400 border-t border-gray-700">
          © 2026 CampusBook. All rights reserved. | Developed by Aayush Koirala
        </div>
      </div>
    </footer>
  )
}

export default Footer