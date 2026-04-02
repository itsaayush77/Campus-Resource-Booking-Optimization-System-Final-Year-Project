import { LuArrowLeft } from 'react-icons/lu';
import { useNavigate } from 'react-router-dom';

const BackButton = ({ label = 'Back', to, fallback = '/', className = '' }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (to) {
      navigate(to);
      return;
    }

    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate(fallback);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center gap-2 px-4 py-2.5 mb-6 text-sm font-semibold text-slate-700 bg-white/90 border border-white shadow-sm rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:text-blue-700 hover:shadow-md ${className}`}
    >
      <LuArrowLeft className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
};

export default BackButton;
