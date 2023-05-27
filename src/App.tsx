import React, { useState } from 'react';
import './App.css';
import { api } from './api';

function App() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [getFile, setGetFile] = useState<File | null>(null);
    const [url, setUrl] = useState<string>('');
    const [image, setImage] = useState<string>('');

    const fileSelectedHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setSelectedFile(event.target.files[0]);
        }
    }

    const fileUploadHandler = async () => {
        const formData = new FormData();
        if (selectedFile) {
            formData.append('file', selectedFile, selectedFile.name);
            try {
                await api.post('salvarArquivo', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }).then((response) => {
                    console.log(response.data);
                    setUrl(response.data.url);
                });
            } catch (error) {
                console.error(error);
            }
        }
    }

    const fileDownloadHandler = async () => {
        try {
            await api.get('verArquivo/' + url, {
                responseType: 'arraybuffer' // informe ao axios que estamos esperando dados binários
            }).then((response) => {
            
                // Criar um Blob a partir dos dados binários
                const blob = new Blob([response.data], { type: 'image/png' });
            
                // Criar um URL Object a partir do Blob
                const imageUrl = URL.createObjectURL(blob);
            
                // Atualizar o estado com a URL da imagem
                setImage(imageUrl);
            });
        } catch (error) {
            console.error(error);
        }
    }

    return (
        <div style={{ display: "flex", justifyContent:"center", flexDirection:"column", alignItems:"center", height:"100vh"}}>
            <input type="file" onChange={fileSelectedHandler} />
            <button onClick={fileUploadHandler}>Upload</button>
            <button onClick={fileDownloadHandler}>Download</button>
            <img src={image} alt="imagem" />
        </div>
    );
}

export default App;
