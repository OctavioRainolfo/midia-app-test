import axios from 'axios';
import { Dispatch, SetStateAction } from 'react';

interface ImageInfo {
    arquivoId?: number;
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
        const response = await apiMidia.get<ArrayBuffer>(
            `verArquivo/${image.url}/${userCode}`,
            {
                responseType: 'arraybuffer', // informe ao axios que estamos esperando dados binários
            }
        );

        // Criar um Blob a partir dos dados binários
        const blob = new Blob([response.data], { type: 'image/png' });
        // Criar um URL Object a partir do Blob
        const imageUrl = {
            url: URL.createObjectURL(blob),
            nome: image.nome,
            arquivoId: image.arquivoId,
        };

        return imageUrl;
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

export const getUser = async (verifyCode: string, callback: (user: any) => void) => {
    apiUsuario.get(`validarUsuario/` + verifyCode)
        .then(response => {
            if (response.data) {
                getMidias(verifyCode);
            }
            if (!response.data) {
                // If user does not exist, create user
                apiUsuario.post(`salvarUsuario/${verifyCode}`)
                    .then(response => {
                        if (response.status === 200) {
                            localStorage.setItem('userCode', verifyCode);
                        } else {
                            alert('Error saving user. Please try again.');
                        }
                    });
            }
            localStorage.setItem('userCode', verifyCode);
        });
}

///////////////////////////////////////////////////////////////////////////////////
// Post's from Midia API

export const postImage = async (verifyCode: string,
    formData: FormData,
    callback: (images: ImageInfo[]) => void
) => {
    apiMidia.post(`salvarArquivo/${verifyCode}`, formData)
        .then((response: { status: number; }) => {
            if (response.status === 200) {
                alert('Image uploaded successfully!');
                getMidias(verifyCode);
            }
        }).catch((error) => {
            console.log(error);
        });
}

export const postImageName = async (verifyCode: string,
    formData: FormData,
    fileName: string,
    callback: (images: ImageInfo[]) => void
) => {
    apiMidia.post(`salvarArquivoNome/${fileName}/${verifyCode}`, formData)
        .then((response: { status: number; }) => {
            if (response.status === 200) {
                alert('Image with name uploaded successfully!');
                getMidias(verifyCode);
            }
        }).catch((error) => {
            console.log(error);
        });
}


////////////////////////////////////////////////////////////////////////////////////////////
// Patch's from Midia API

export const patchName = async (verifyCode: string,
    url: string,
    callback: (user: any) => void,
    newName: string) => {

    console.log(newName);
    await apiMidia.patch(`alterarNomeArquivo/${url}/${verifyCode}`, JSON.stringify(newName), {
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(response => {
        if (response.status === 200) {
            getMidias(verifyCode);
        } else {
            alert('Error saving user. Please try again.');
        }
    }).catch((error) => {
        console.log(error);
    }
    );
}


///////////////////////////////////////////////////////////////////////////////////
// Delete's from Midia API

export const deleteImage = async (verifyCode: string,
    url: string,
    callback: (image: ImageInfo[]) => void
) => {
    apiMidia.delete(`deletarArquivo/${url}/${verifyCode}`)
        .then((response) => {
            if (response.status === 200) {
                alert('Image deleted successfully!');
                getMidias(verifyCode);
            }
        }).catch((error) => {
            console.log(error);
        });
}
