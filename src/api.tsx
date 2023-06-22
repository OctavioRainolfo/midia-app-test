import axios from 'axios';

export const apiMidia = axios.create({
    baseURL: "https://localhost:7111/api/v1/Midia/",
});

export const apiUsuario = axios.create({
    baseURL: "https://localhost:7111/api/v1/Usuario/",
});
