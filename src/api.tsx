import axios from 'axios';

export const api = axios.create({
    baseURL: "https://localhost:7111/api/v1/Midia/",
});