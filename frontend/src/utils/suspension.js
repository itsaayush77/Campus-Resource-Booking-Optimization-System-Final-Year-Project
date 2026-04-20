export const isUserSuspended = (user) => {
  if (!user?.isSuspended || !user?.suspendedUntil) return false;

  const suspendedUntil = new Date(user.suspendedUntil);
  return !Number.isNaN(suspendedUntil.getTime()) && suspendedUntil.getTime() > Date.now();
};

export const formatSuspensionDate = (value) => {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleDateString();
};

export const getSuspensionMessage = (user) => {
  if (!isUserSuspended(user)) return null;

  const formattedDate = formatSuspensionDate(user?.suspendedUntil);
  return formattedDate
    ? `Your account is suspended until ${formattedDate}. You can still browse resources, but booking actions are temporarily disabled.`
    : 'Your account is currently suspended. You can still browse resources, but booking actions are temporarily disabled.';
};
