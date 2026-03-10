import api from "./api";

const formatError = (error, fallbackMessage) => {
  console.log(error);
  return {
    success: false,
    message: error?.response?.data?.message || fallbackMessage,
    data: error?.response?.data?.data || null,
  };
};

export const getAllResources = async (filters = {}) => {
  try {
    const params = new URLSearchParams();

    if (filters.category) params.append("category", filters.category);
    if (filters.search) params.append("search", filters.search);
    if (filters.type) params.append("type", filters.type);

    const query = params.toString();
    const url = query ? `/resources?${query}` : "/resources";
    const response = await api.get(url);

    return response.data;
  } catch (error) {
    return formatError(error, "Failed to fetch resources");
  }
};

export const getResourceById = async (id) => {
  try {
    const response = await api.get(`/resources/${id}`);
    return response.data;
  } catch (error) {
    return formatError(error, "Failed to fetch resource details");
  }
};
