import { LuTriangleAlert } from 'react-icons/lu';
import { getSuspensionMessage, isUserSuspended } from '../utils/suspension';

const SuspensionBanner = ({ user, className = '' }) => {
  if (!isUserSuspended(user)) return null;

  return (
    <div className={`rounded-2xl border border-red-200 bg-red-50 px-4 py-3 ${className}`.trim()}>
      <div className="flex items-start gap-3">
        <LuTriangleAlert className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
        <div>
          <p className="text-sm font-bold text-red-700">Account suspended</p>
          <p className="mt-1 text-sm text-red-600">{getSuspensionMessage(user)}</p>
        </div>
      </div>
    </div>
  );
};

export default SuspensionBanner;
