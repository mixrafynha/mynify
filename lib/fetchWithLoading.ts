import { useLoading } from "@/app/context/LoadingContext";

let activeRequests = 0;

export function useFetchWithLoading() {
  const { setLoading } = useLoading();

  const fetchWithLoading = async (url: string, options?: RequestInit) => {
    try {
      activeRequests++;
      setLoading(true);

      const res = await fetch(url, options);

      return res;
    } catch (err) {
      console.error("[FETCH_ERROR]", err);
      throw err;
    } finally {
      activeRequests--;

      if (activeRequests <= 0) {
        activeRequests = 0;
        setLoading(false);
      }
    }
  };

  return fetchWithLoading;
}