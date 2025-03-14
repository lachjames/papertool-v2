import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import getBaseURL from '../getBaseURL';

// Define interfaces for request options
interface ApiRequestOptions extends Omit<AxiosRequestConfig, 'url' | 'withCredentials'> {
    headers?: Record<string, string>;
}

/**
 * Create an axios instance with authentication handling
 * @param endpoint - API endpoint path (without base URL)
 * @param apiKey - Optional API key for backward compatibility
 * @param options - Additional axios request options
 * @returns Axios request promise
 */
export const apiRequest = async <T = any>(
    endpoint: string,
    apiKey?: string,
    options: ApiRequestOptions = {}
): Promise<AxiosResponse<T>> => {
    // Construct full URL using getBaseURL
    const url = getBaseURL(endpoint);

    // Prepare headers
    const headers = {
        ...(options.headers || {})
    };

    // Add API key if provided (for backward compatibility)
    if (apiKey) {
        headers['x-proxy-key'] = apiKey;
    }

    // Return axios request with credentials included
    return axios({
        url,
        ...options,
        headers,
        withCredentials: true
    });
};

/**
 * Helper for GET requests
 * @param endpoint - API endpoint
 * @param apiKey - Optional API key
 * @param options - Additional options
 */
export const apiGet = <T = any>(
    endpoint: string,
    apiKey?: string,
    options: ApiRequestOptions = {}
): Promise<AxiosResponse<T>> => {
    return apiRequest<T>(endpoint, apiKey, { ...options, method: 'GET' });
};

/**
 * Helper for POST requests
 * @param endpoint - API endpoint
 * @param data - Post data
 * @param apiKey - Optional API key
 * @param options - Additional options
 */
export const apiPost = <T = any, D = any>(
    endpoint: string,
    data: D,
    apiKey?: string,
    options: ApiRequestOptions = {}
): Promise<AxiosResponse<T>> => {
    return apiRequest<T>(endpoint, apiKey, {
        ...options,
        method: 'POST',
        data
    });
};

/**
 * Helper for PUT requests
 * @param endpoint - API endpoint
 * @param data - Put data
 * @param apiKey - Optional API key
 * @param options - Additional options
 */
export const apiPut = <T = any, D = any>(
    endpoint: string,
    data: D,
    apiKey?: string,
    options: ApiRequestOptions = {}
): Promise<AxiosResponse<T>> => {
    return apiRequest<T>(endpoint, apiKey, {
        ...options,
        method: 'PUT',
        data
    });
};

/**
 * Helper for DELETE requests
 * @param endpoint - API endpoint
 * @param apiKey - Optional API key
 * @param options - Additional options
 */
export const apiDelete = <T = any>(
    endpoint: string,
    apiKey?: string,
    options: ApiRequestOptions = {}
): Promise<AxiosResponse<T>> => {
    return apiRequest<T>(endpoint, apiKey, {
        ...options,
        method: 'DELETE'
    });
};
