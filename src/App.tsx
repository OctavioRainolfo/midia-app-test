import React, { useEffect, useState, useRef } from 'react';
import { postImage, getMidias, deleteImage, getAllImages, postImageName, getUser, patchName } from './api';
import './App.css';

interface ImageInfo {
    arquivoId?: number;
    nome: string;
    tipo?: string;
    url: string;
    dataCriacao?: string;
    dataAtualizacao?: string;
    deletado?: boolean;
}


function ImageManagementDemo() {
    const [images, setImages] = useState<ImageInfo[]>([]);
    const [selectedImage, setSelectedImage] = useState<ImageInfo | undefined | null>();
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadFileName, setUploadFileName] = useState('');
    const [editFileName, setEditFileName] = useState('');
    const [userCode, setUserCode] = useState('');
    const [downloadedImages, setDownloadedImages] = useState<ImageInfo[]>([]);
    const [toggleEdit, setToggleEdit] = useState<boolean[]>([]);
    const [updateImages, setUpdateImages] = useState(false);

    const imgRef = useRef<HTMLImageElement | null>(null);

    const validateUser = (code?: string) => {
        const verifyCode = code ? code : userCode;
        getUser(verifyCode, setImages);
    }

    const searchImages = async (code?: string) => {
        const verifyCode = code ? code : userCode;
        if (!verifyCode) return;
        await getMidias(verifyCode).then((response) => {
            if (response) {
                const imageResponse = response;
                const filteredImages = imageResponse.filter((image: ImageInfo) => !image.deletado);
                setImages(filteredImages);
            } else {
                alert('No images found for this user.');
            }
        })
            .catch((error) => {
                console.log(error);
            });
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setUploadFile(e.target.files[0]);
        }
    }

    const handleDownloadImages = async () => {
        await getAllImages(userCode, images).then((response) => {
            response && setDownloadedImages(response);
        })
    }

    const searchByName = (image: ImageInfo) => {
        var temp = downloadedImages.find((img) => img.nome === image.nome);
        return temp;
    }

    const searchByUrl = (image: ImageInfo) => {
        var tempDownloaded = downloadedImages.find((img) => img.url === image.url);
        var temp = images.find((img) => img.nome === tempDownloaded?.nome);
        return temp;
    }

    const searchById = (image: ImageInfo) => {
        var temp = images.find((img) => img.arquivoId === image.arquivoId);
        return temp;
    }

    const searchDownloadedById = (image: ImageInfo) => {
        var temp = downloadedImages.find((img) => img.arquivoId === image.arquivoId);
        return temp;
    }

    const handleFindImage = (image: ImageInfo) => {
        const temp = downloadedImages.find((img) => img.arquivoId === image.arquivoId);
        return temp?.url;
    }

    const handleToggleEdit = (index: number) => {
        setEditFileName(images[index].nome);
        setToggleEdit((prevToggleEdit) => {
            const updatedToggleEdit = [...prevToggleEdit];
            updatedToggleEdit[index] = !updatedToggleEdit[index];
            return updatedToggleEdit;
        });
    };

    const handleEditName = (image: ImageInfo, index: number) => {
        var searchedId = searchById(image);
        if (searchedId) {
            patchName(userCode, searchedId.url, setImages, editFileName)
            handleToggleEdit(index);
        }
    };

    const uploadImage = () => {
        if (uploadFile) {
            let formData = new FormData();
            formData.append('file', uploadFile);
            if (userCode) {
                postImage(userCode, formData, setImages);
            } else {
                alert('Please enter user code.');
            }
        } else {
            alert('Please select an image.');
        }
    }

    const uploadImageWithName = () => {
        if (uploadFile) {
            let formData = new FormData();
            formData.append('file', uploadFile);
            if (userCode) {
                console.log(userCode, uploadFile);
                postImageName(userCode, formData, uploadFileName, setImages)
            }
        }
    }

    //useRef to get the image and scroll to it
    const selectAndScroll = async (image: ImageInfo) => {
        var searchedId = searchDownloadedById(image);
        console.log(searchedId);
        if (searchedId) {
            setSelectedImage(searchedId);
            const img = imgRef.current;
            if (img) {
                img.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }

    //get the url of the image and delete it
    const handleDeleteImage = (image: ImageInfo) => {
        var imageId = searchById(image);
        console.log(imageId);
        if (imageId) {
            deleteImage(userCode, imageId.url, setImages);
        }
    }

    useEffect(() => {
        handleDownloadImages();
        console.log('downloadedImages')
    }, [images])

    useEffect(() => {
        if (downloadedImages.length > 0) {
            setSelectedImage(downloadedImages[0]);
        }
    }, [downloadedImages])

    useEffect(() => {
        var userCode = localStorage.getItem('userCode');
        if (userCode) {
            setUserCode(userCode);
            validateUser(userCode);
        }
    }, [userCode]);

    useEffect(() => {
        if (updateImages) {
            searchImages();
            setUpdateImages(false);
            console.log('update');
        }
    }, [updateImages]);

    return (
        <div className="container">
            <div className="image-management-demo">

                <div className="upload-section box-container">
                    <div className='upload-form'>
                        <h2>Image Management Demo</h2>

                        <div className='upload-container'>

                            <div className='userCode-form'>
                                <h3>User Code</h3>
                                <input type="text" placeholder="Enter user code" value={userCode} onChange={e => setUserCode(e.target.value)} />
                                <button onClick={() => {
                                    validateUser();
                                }}>Search Images</button>
                            </div>

                            <div className='uploadImage-form'>
                                <h3>Upload Image</h3>
                                <div className='box-input'>
                                    <input type="file" onChange={handleFileUpload} />
                                    <button onClick={uploadImage}>Upload</button>
                                </div>
                                <div className='box-input'>
                                    <input type="text" placeholder="Enter file name" value={uploadFileName} onChange={e => setUploadFileName(e.target.value)} />
                                    <button onClick={uploadImageWithName}>Upload with name</button>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                <div className='images-container'>
                    <div className="images-section">
                        <h3>Images</h3>
                        <div className='map-cards-container'>
                            {downloadedImages.map((image, index) => (
                                <div key={index} className="image-card">
                                    <div className='image-info-section'>

                                        <div className='wrap-mini-image'>

                                            <div className='mini-image'>
                                                <img src={
                                                    handleFindImage(image)
                                                } alt={image.nome}
                                                    onClick={() =>
                                                        selectAndScroll(image)
                                                    }
                                                />
                                            </div>

                                            {toggleEdit[index] ? (
                                                <div className='wrap-input'>
                                                    <input type="text" value={editFileName} onChange={e => setEditFileName(e.target.value)} />
                                                    <button onClick={() => {
                                                        handleEditName(image, index);
                                                    }}>Save</button>
                                                </div>
                                            ) : (
                                                <p>{image.nome}</p>
                                            )}
                                        </div>

                                    </div>
                                    <div className='buttons-section'>
                                        <button onClick={() =>
                                            handleToggleEdit(index)
                                        }>Edit</button>
                                        <button onClick={
                                            () => handleDeleteImage(image)
                                        }>Delete</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="info-section">
                        <h3>Image Information</h3>
                        <p><strong>Nome:</strong> {selectedImage?.nome}</p>

                        <div className='downloaded-image'>
                            {selectedImage && <img
                                className="selected-image"
                                src={selectedImage.url} alt="downloaded"
                                ref={imgRef}
                            />}
                        </div>

                    </div>
                </div>
            </div>
        </div >
    );
}

export default ImageManagementDemo;
