import React, { useEffect, useState, useRef } from 'react';
import { postImage, getMidias, deleteImage, getAllImages, postImageName, validateUser, saveUser, patchName } from './api';
import './App.css';
import { ImageInfo } from './api';

function ImageManagementDemo() {
    const [images, setImages] = useState<ImageInfo[]>([]);
    const [selectedImage, setSelectedImage] = useState<ImageInfo | undefined | null>();
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadFileName, setUploadFileName] = useState('');
    const [editFileName, setEditFileName] = useState('');
    const [userCode, setUserCode] = useState('');
    const [downloadedImages, setDownloadedImages] = useState<ImageInfo[]>([]);
    const [activeEditIndex, setActiveEditIndex] = useState<number | null>(null);

    const imgRef = useRef<HTMLImageElement | null>(null);

    const postSaveUser = async (verifyCode: string) => {
        await saveUser(verifyCode).then((response) => {
            if (response.status === 200) {
                localStorage.setItem('userCode', verifyCode);
            } else {
                alert(response);
            }
        });
    }

    const verifyUser = async (code?: string) => {
        const verifyCode = code ? code : userCode;
        await validateUser(verifyCode).then(response => {
            if (response) {
                searchImages(verifyCode);
            }
            if (!response) {
                // If user does not exist, create user
                postSaveUser(verifyCode);
            }
            localStorage.setItem('userCode', verifyCode);
        });
    }

    const searchImages = async (code?: string) => {
        const verifyCode = code ? code : userCode;
        if (!verifyCode) return;
        await getMidias(verifyCode).then((response: any) => {
            if (response) {
                const imageResponse = response.data;
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

    const toggleEdit = (index: number) => {
        if (activeEditIndex === index) setActiveEditIndex(null);
        else setActiveEditIndex(index);
        setEditFileName(images[index].nome);
    };

    const handleEditName = async (image: ImageInfo, index: number) => {
        var searchedId = searchById(image);
        if (searchedId) {
            await patchName(userCode, searchedId.url, editFileName).then(response => {
                searchImages();
            }).catch((error) => {
                alert('Error saving user. Please try again.');
                console.log(error);
            }
            );
            setActiveEditIndex(null);
        }
    };

    const uploadImage = async () => {
        if (uploadFile) {
            let formData = new FormData();
            formData.append('file', uploadFile);
            if (userCode) {
                await postImage(userCode, formData)
                    .then(() => {
                        alert('Image uploaded successfully!');
                        getMidias(userCode);

                    }).catch((error) => {
                        console.log(error);
                    });
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
                postImageName(userCode, formData, uploadFileName)
                    .then(() => {
                        alert('Image with name uploaded successfully!');
                        getMidias(userCode);
                    }).catch((error) => {
                        console.log(error);
                    });
            }
        }
    }

    //useRef to get the image and scroll to it
    const selectAndScroll = async (image: ImageInfo) => {
        var searchedId = searchDownloadedById(image);
        if (searchedId) {
            setSelectedImage(searchedId);
            const img = imgRef.current;
            if (img) {
                img.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }

    //get the url of the image and delete it
    const handleDeleteImage = async (image: ImageInfo) => {
        var imageId = searchById(image);
        if (imageId) {
            await deleteImage(userCode, imageId.url).then((response) => {
                if (response.status === 200) {
                    alert('Image deleted successfully!');
                   searchImages();
                }
            }).catch((error) => {
                console.log(error);
            });

        }
    }

    useEffect(() => {
        handleDownloadImages();
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
            verifyUser(userCode);
        }
    }, [userCode]);

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
                                    verifyUser();
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


                                        <div className='mini-image'>
                                            <img src={
                                                handleFindImage(image)
                                            } alt={image.nome}
                                                onClick={() =>
                                                    selectAndScroll(image)
                                                }
                                            />
                                        </div>

                                        {activeEditIndex === index ? (
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
                                    <div className='buttons-section'>
                                        <button onClick={() =>
                                            toggleEdit(index)
                                        }>Edit</button>
                                        <button onClick={
                                            () => handleDeleteImage(image)
                                        }>Delete</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="info-section" ref={imgRef}>
                        <h3>Image Information</h3>
                        <p><strong>Nome:</strong> {selectedImage?.nome}</p>

                        <div className='downloaded-image'>
                            {selectedImage && <img
                                className="selected-image"
                                src={selectedImage.url} alt="downloaded"

                            />}
                        </div>

                    </div>
                </div>
            </div>
        </div >
    );
}

export default ImageManagementDemo;
