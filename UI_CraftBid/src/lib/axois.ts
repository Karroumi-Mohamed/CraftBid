import axios, { AxiosError, AxiosResponse } from 'axios';
interface ValidationErrors {
    [field: string]: string[];
}

interface ApiError {
    message: string;
    errors?: ValidationErrors;
    status?: number;
}

type ApiResponse<T = any> = {
    success: boolean;
    data: T | null;
    error: ApiError | null;
    status?: number;
};

axios.defaults.withCredentials = true;
axios.defaults.withXSRFToken = true;

const api = axios.create({
    baseURL: 'http://127.0.0.1:8000/api',
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
});

api.interceptors.response.use(
    (response) => response,
    (error: any): Promise<ApiError> => {
        let apiError: ApiError;
        let status: number | undefined;

        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError<any>;
            const responseData = axiosError.response?.data;
            status = axiosError.response?.status;

            if (status === 422 && responseData?.errors) {
                apiError = {
                    message: responseData.message || 'Validation failed',
                    errors: responseData.errors as ValidationErrors,
                    status: status,
                };
            } 
            else if (status === 401 && responseData?.message) {
                apiError = {
                    message: responseData.message,
                    status: status,
                };
                console.log('Authentication error:', responseData.message);
            }
            else {
                apiError = {
                    message: responseData?.message || axiosError.message || 'An API error occurred',
                    status: status,
                };
            }
        } else {
            apiError = {
                message: error instanceof Error ? error.message : 'An unexpected error occurred',
                status: undefined,
            };
        }

        console.error('API Error Interceptor:', apiError);

        return Promise.reject(apiError);
    }
);

async function makeRequest<T>(requestPromise: Promise<AxiosResponse<T>>): Promise<ApiResponse<T>> {
    try {
        const response = await requestPromise;
        return {
            success: true,
            data: response.data,
            error: null,
            status: response.status,
        };
    } catch (error) {
        const apiError = error as ApiError;
        return {
            success: false,
            data: null,
            error: apiError || { message: 'An unknown error occurred' },
            status: apiError?.status,
        };
    }
}

export default api;
export { makeRequest };
export type { ApiResponse, ApiError, ValidationErrors };
