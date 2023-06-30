import React, { useEffect, useState, useRef } from 'react';
import { apiMidia, apiUsuario } from './api';
import './App.css';

interface ImageInfo {
    arquivoId: number;
    nome: string;
    tipo: string;
    url: string;
    dataCriacao: string;
    dataAtualizacao: string;
    deletado: boolean;
}


function ImageManagementDemo() {
    const [images, setImages] = useState<ImageInfo[]>([]);
    const [selectedImage, setSelectedImage] = useState<ImageInfo | null>(null);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [fileName, setFileName] = useState('');
    const [userCode, setuserCode] = useState(localStorage.getItem('userCode') || '');
    const [downloadedImages, setDownloadedImages] = useState<string>('');

    const imgRef = useRef<HTMLImageElement | null>(null);

    const validateUser = () => {
        // Check if user exists
        apiUsuario.get(`validarUsuario/` + userCode)
            .then(response => {
                if (response.data) {
                    searchImages();
                }
                if (!response.data) {
                    // If user does not exist, create user
                    apiUsuario.post(`salvarUsuario/${userCode}`)
                        .then(response => {
                            if (response.status === 200) {
                                localStorage.setItem('userCode', userCode);
                            } else {
                                alert('Error saving user. Please try again.');
                            }
                        });
                }
                localStorage.setItem('userCode', userCode);
            });
    }

    const searchImages = () => {
        apiMidia.get(`buscaArquivosUsuario/${userCode}`)
            .then((response) => {
                console.log('response', response);
                if (response.data) {
                    const imageResponse = response.data;
                    const filteredImages = imageResponse.filter((image: ImageInfo) => !image.deletado);
                    setImages(filteredImages);
                    localStorage.setItem('images', JSON.stringify(filteredImages));
                } else {
                    alert('No images found for this user.');
                }
            })
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setUploadFile(e.target.files[0]);
        }
    }

    const uploadImage = () => {
        if (uploadFile) {
            let formData = new FormData();
            formData.append('file', uploadFile);

            if (userCode) {
                apiMidia.post(`salvarArquivo/${userCode}`, formData)
                    .then((response: { status: number; }) => {
                        if (response.status === 200) {
                            alert('Image uploaded successfully!');
                        }
                        apiMidia.get(`buscaArquivosUsuario/${userCode}`)
                            .then((response) => {
                                setImages(response.data);
                                localStorage.setItem('images', JSON.stringify(response.data));
                            });
                    })
            } else {
                alert('Please enter user code.');
            }
        }
    }

    const uploadImageWithName = () => {
        if (uploadFile) {
            let formData = new FormData();
            formData.append('file', uploadFile);

            apiMidia.post(`salvarArquivoNome/${fileName}/${userCode}`, formData)
                .then((response: { status: number; }) => {
                    if (response.status === 200) {
                        alert('Image with name uploaded successfully!');
                        searchImages();
                    }
                    apiMidia.get(`buscaArquivosUsuario/${userCode}`)
                        .then((response) => {
                            setImages(response.data);
                            localStorage.setItem('images', JSON.stringify(response.data));
                        });
                })
        }
    }

    const downloadImage = (url: string) => {
        apiMidia.get(`baixarArquivo/` + url + "/" + userCode, { responseType: 'blob' })
            .then((response: { data: BlobPart; }) => {
                let link = document.createElement('a');
                link.href = window.URL.createObjectURL(new Blob([response.data]));
                link.download = 'image.jpg';
                link.click();
            });
    }

    const fileDownloadHandler = (url: string) => {
        console.log('url', url);
        apiMidia.get(`verArquivo/${url}/${userCode}`, {
            responseType: 'arraybuffer' // informe ao axios que estamos esperando dados binários
        }).then((response) => {

            // Criar um Blob a partir dos dados binários
            const blob = new Blob([response.data], { type: 'image/png' });

            // Criar um URL Object a partir do Blob
            const imageUrl = URL.createObjectURL(blob);

            // Atualizar o estado com a URL da imagem
            setDownloadedImages(imageUrl);
        });
    }

    //useRef to get the image and scroll to it
    const selectAndScroll = (image: ImageInfo) => {
        fileDownloadHandler(image.url);
        setSelectedImage(image);
        const img = imgRef.current;
        if (img) {
            img.scrollIntoView({ behavior: 'smooth' });
        }
    }

    //get the url of the image and delete it
    const handleDeleteImage = (image: ImageInfo) => {
        apiMidia.delete(`deletarArquivo/${image.url}/${userCode}`)
            .then((response) => {
                if (response.status === 200) {
                    alert('Image deleted successfully!');
                    searchImages();
                }
            })
    }


    return (
        <div className="container">
            <div className="image-management-demo">
                <h2>Image Management Demo</h2>

                <div className="upload-section">
                    <div className='upload-form'>
                        <h3>User Code</h3>
                        <input type="text" placeholder="Enter user code" value={userCode} onChange={e => setuserCode(e.target.value)} />
                        {userCode && (
                            <button onClick={() => {
                                validateUser();
                            }}>Search Images</button>
                        )}

                        <h3>Upload Image</h3>
                        <input type="file" onChange={handleFileUpload} />
                        <button onClick={uploadImage}>Upload</button>
                        <input type="text" placeholder="Enter file name" value={fileName} onChange={e => setFileName(e.target.value)} />
                        <button onClick={uploadImageWithName}>Upload with name</button>
                    </div>
                </div>

                <div className="images-section">
                    <h3>Images</h3>
                    {images.map((image, index) => (
                        <div key={index} className="image-card">
                            <div className='image-info-section' onClick={() =>
                                selectAndScroll(image)
                            }>
                                <p>
                                    {image.nome}
                                </p>
                                <p>
                                    {image.url}
                                </p>
                            </div>
                            <div className='buttons-section'>
                                <button onClick={() =>
                                    selectAndScroll(image)
                                }>Download</button>
                                <button onClick={
                                    () => handleDeleteImage(image)
                                }>Delete</button>
                            </div>
                        </div>
                    ))}
                </div>

                {selectedImage && (
                    <div className="info-section">
                        <h3>Image Information</h3>
                        <p><strong>URL:</strong> {selectedImage.url}</p>
                        <p>{downloadedImages &&
                            <img ref={imgRef}
                                className='downloadedImage' src={downloadedImages} />
                        }</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ImageManagementDemo;
