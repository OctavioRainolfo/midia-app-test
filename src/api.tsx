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


//Get's from Midia API

export const getMidias = async (verifyCode: string, callback: (images: ImageInfo[]) => void) => {
    apiMidia.get(`buscaArquivosUsuario/${verifyCode}`)
        .then((response) => {
            if (response.data) {
                const imageResponse = response.data;
                const filteredImages = imageResponse.filter((image: ImageInfo) => !image.deletado);
                callback(filteredImages);
            } else {
                alert('No images found for this user.');
            }
        })
        .catch((error) => {
            console.log(error);
        });
}

export const getSingleImage = async (
    image: ImageInfo,
    userCode: string,
): Promise<ImageInfo> => {
    return new Promise((resolve, reject) => {
        apiMidia.get(`verArquivo/${image.url}/${userCode}`, {
            responseType: 'arraybuffer' // informe ao axios que estamos esperando dados binários
        }).then((response) => {

            // Criar um Blob a partir dos dados binários
            const blob = new Blob([response.data], { type: 'image/png' });
            // Criar um URL Object a partir do Blob
            const imageUrl = {
                url: URL.createObjectURL(blob),
                nome: image.nome,
                arquivoId: image.arquivoId,
            }
            resolve(imageUrl);
        })
            .catch((error) => {
                reject(error);
            });
    }
    )
}

export const getAllImages = async (
    userCode: string,
    array: ImageInfo[],
    callback: (image: ImageInfo[]) => void
) => {
    try {
        const newArray = await Promise.all(array.map((image) => getSingleImage(image, userCode)));
        callback(newArray);
    } catch (error) {
        console.log(error);
    }
}

///////////////////////////////////////////////////////////////////////////////////
// Get's from Usuario API

export const getUser = async (verifyCode: string, callback: (user: any) => void) => {
    apiUsuario.get(`validarUsuario/` + verifyCode)
        .then(response => {
            if (response.data) {
                getMidias(verifyCode, callback);
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
                getMidias(verifyCode, callback);
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
                getMidias(verifyCode, callback);
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
            getMidias(verifyCode, callback);
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
                getMidias(verifyCode, callback);
            }
        }).catch((error) => {
            console.log(error);
        });
}
