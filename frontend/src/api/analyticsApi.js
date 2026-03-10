import api from "./api";

const formatError = (error, fallbackMessage) => {
  console.log(error);
  return {
    success: false,
    message: error?.response?.data?.message || fallbackMessage,
    data: error?.response?.data?.data || null,
  };
};

export const getAnalyticsSummary = async (fromDate, toDate) => {
  try {
    const params = new URLSearchParams();

    if (fromDate) params.append("fromDate", fromDate);
    if (toDate) params.append("toDate", toDate);

    const query = params.toString();
    const url = query ? `/analytics/summary?${query}` : "/analytics/summary";
    const response = await api.get(url);

    return response.data;
  } catch (error) {
    return formatError(error, "Failed to fetch analytics summary");
  }
};
