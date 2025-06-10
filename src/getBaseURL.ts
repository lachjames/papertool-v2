let __API_BASE_URL__: string;
// If we are on localhost, use the localhost URL. Otherwise, use the production URL
if (window.location.hostname === 'localhost') {
    __API_BASE_URL__ = "http://localhost:3060";
} else {
    __API_BASE_URL__ = "https://papertool-server.sodalabs.io";
}

const getBaseURL = (path: string) => {
    return `${__API_BASE_URL__}/${path}`;
}

export default getBaseURL;