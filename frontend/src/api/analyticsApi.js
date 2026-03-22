import api from "./api";

const formatError = (error, fallbackMessage) => {
  console.log(error);
  return {
    success: false,
    message: error?.response?.data?.message || fallbackMessage,
    data: error?.response?.data?.data || null,
  };
};

export const getAnalyticsSummary = async (from, to) => {
  try {
    const params = new URLSearchParams();

    if (from) params.append("from", from);
    if (to) params.append("to", to);

    const query = params.toString();
    const url = query
      ? `/admin/analytics/summary?${query}`
      : "/admin/analytics/summary";
    const response = await api.get(url);

    return response.data;
  } catch (error) {
    return formatError(error, "Failed to fetch analytics summary");
  }
};
