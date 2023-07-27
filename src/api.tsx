import axios from 'axios';

export interface ImageInfo {
    arquivoId: number;
    nome: string;
    tipo?: string;
    url: string;
    dataCriacao?: string;
    dataAtualizacao?: string;
    deletado?: boolean;
}

export const apiMidia = axios.create({
    baseURL: "https://localhost:7111/api/v1/Midia/",
});

export const apiUsuario = axios.create({
    baseURL: "https://localhost:7111/api/v1/Usuario/",
});


//Get's from Midia API ImageInfo[] 

export const getMidias = async (verifyCode: string): Promise<ImageInfo[]> => {
    return apiMidia.get(`buscaArquivosUsuario/${verifyCode}`)
}

export const getSingleImage = async (
    image: ImageInfo,
    userCode: string,
): Promise<ImageInfo> => {
    try {
        return await apiMidia.get<ArrayBuffer>(
            `verArquivo/${image.url}/${userCode}`,
            {
                responseType: 'arraybuffer', // informe ao axios que estamos esperando dados binários
            }
        ).then((response) => {

            // Criar um Blob a partir dos dados binários
            const blob = new Blob([response.data], { type: 'image/png' });
            // Criar um URL Object a partir do Blob
            const imageUrl = {
                url: URL.createObjectURL(blob),
                nome: image.nome,
                arquivoId: image.arquivoId,
            };

            return imageUrl;
        });
    } catch (error) {
        // Handle any errors that might occur during the API call
        throw error;
    }
};

export const getAllImages = async (
    userCode: string,
    array: ImageInfo[]
): Promise<ImageInfo[]> => {
    try {
        const newArray = await Promise.all(array.map((image) => getSingleImage(image, userCode)));
        return newArray;
    } catch (error) {
        console.log(error);
    }
    return [];
}

///////////////////////////////////////////////////////////////////////////////////
// Get's from Usuario API

export const validateUser = (verifyCode: string): Promise<Boolean> => {
    return apiUsuario.get(`validarUsuario/` + verifyCode)
}

///////////////////////////////////////////////////////////////////////////////////
// Post's from Usuario Api
export const saveUser = async (verifyCode: string) => {
    return apiUsuario.post(`salvarUsuario/${verifyCode}`)
}

///////////////////////////////////////////////////////////////////////////////////

// Post's from Midia API

export const postImage = async (verifyCode: string,
    formData: FormData
) => {
    return apiMidia.post(`salvarArquivo/${verifyCode}`, formData)

}

export const postImageName = async (verifyCode: string,
    formData: FormData,
    fileName: string
) => {
    return apiMidia.post(`salvarArquivoNome/${fileName}/${verifyCode}`, formData)
}


////////////////////////////////////////////////////////////////////////////////////////////
// Patch's from Midia API

export const patchName = (
    verifyCode: string,
    url: string,
    newName: string) => {
    return apiMidia.patch(`alterarNomeArquivo/${url}/${verifyCode}`, JSON.stringify(newName), {
        headers: {
            'Content-Type': 'application/json'
        }
    })
}


///////////////////////////////////////////////////////////////////////////////////
// Delete's from Midia API

export const deleteImage = async (verifyCode: string,
    url: string,
) => {
    return apiMidia.delete(`deletarArquivo/${url}/${verifyCode}`)
}
